import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { saveAnalysis, getAnalysis, listAnalysesByUser } from './services/dynamodb.js';
import { invokeAgent } from './services/bedrock-agent.js';

const PORT = Number(process.env.DEV_PORT ?? '4001');
const USER_ID = 'local-dev';

async function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const method = req.method;

  if (method === 'OPTIONS') {
    json(res, 200, {});
    return;
  }

  console.log(`${method} ${url.pathname}`);

  try {
    // POST /api/analyses
    if (method === 'POST' && url.pathname === '/api/analyses') {
      const body = await parseBody(req);
      const analysisId = randomUUID();

      const codeOrDiff = (body.diff as string) ?? (body.code as string) ?? '';
      const analysis = {
        id: analysisId,
        userId: USER_ID,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        input: {
          hasScreenshot: !!body.screenshotBase64,
          codeLanguage: (body.codeLanguage as string) ?? 'react',
          codeLength: codeOrDiff.length,
          prUrl: body.prUrl as string | undefined,
          prTitle: body.prTitle as string | undefined,
          fileCount: Array.isArray(body.files) ? body.files.length : undefined,
        },
      };

      await saveAnalysis(analysis);
      console.log(`Analysis created: ${analysisId}`);

      // Fire-and-forget: invoke Bedrock Agent in background
      invokeAgent(analysisId, USER_ID, body as never).catch((err) => {
        console.error('Bedrock Agent invocation failed:', err);
      });

      json(res, 201, { id: analysisId, status: 'pending' });
      return;
    }

    // GET /api/analyses/:id
    const idMatch = url.pathname.match(/^\/api\/analyses\/([\w-]+)$/);
    if (method === 'GET' && idMatch) {
      const analysis = await getAnalysis(idMatch[1]!, USER_ID);
      if (!analysis) {
        json(res, 404, { error: 'Analysis not found' });
        return;
      }
      json(res, 200, analysis);
      return;
    }

    // GET /api/analyses
    if (method === 'GET' && url.pathname === '/api/analyses') {
      const limit = Number(url.searchParams.get('limit') ?? '20');
      const analyses = await listAnalysesByUser(USER_ID, limit);
      json(res, 200, { items: analyses });
      return;
    }

    json(res, 404, { error: 'Not Found' });
  } catch (error) {
    console.error('Server error:', error);
    json(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`\n  NovaLens Dev Server running at http://localhost:${PORT}`);
  console.log(`  Bedrock Agent ID: ${process.env.BEDROCK_AGENT_ID}`);
  console.log(`  DynamoDB Table:   ${process.env.ANALYSIS_TABLE_NAME}\n`);
});
