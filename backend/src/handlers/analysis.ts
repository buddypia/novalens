import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { randomUUID } from 'crypto';
import { AnalysisRequestSchema } from '../types/analysis.js';
import { saveAnalysis, getAnalysis, listAnalysesByUser } from '../services/dynamodb.js';

const lambdaClient = new LambdaClient({});
const AGENT_FUNCTION_NAME = process.env.AGENT_FUNCTION_NAME ?? '';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;

  try {
    if (httpMethod === 'POST' && path === '/api/analyses') {
      return await createAnalysis(event);
    }
    if (httpMethod === 'GET' && path.match(/^\/api\/analyses\/[\w-]+$/)) {
      const id = path.split('/').pop()!;
      return await getAnalysisById(id, event);
    }
    if (httpMethod === 'GET' && path === '/api/analyses') {
      return await listAnalyses(event);
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not Found' }) };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}

async function createAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body ?? '{}');
  const parsed = AnalysisRequestSchema.safeParse(body);

  if (!parsed.success) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Validation Error', details: parsed.error.issues }),
    };
  }

  const userId = event.requestContext.authorizer?.claims?.sub ?? 'anonymous';
  const analysisId = randomUUID();

  const codeOrDiff = parsed.data.diff ?? parsed.data.code ?? '';
  const analysis = {
    id: analysisId,
    userId,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    input: {
      hasScreenshot: !!(parsed.data.screenshotUrl || parsed.data.screenshotBase64),
      codeLanguage: parsed.data.codeLanguage,
      codeLength: codeOrDiff.length,
      prUrl: parsed.data.prUrl,
      prTitle: parsed.data.prTitle,
      fileCount: parsed.data.files?.length,
    },
  };

  await saveAnalysis(analysis);

  // Invoke Agent Lambda asynchronously (Event invocation = fire-and-forget)
  await lambdaClient.send(
    new InvokeCommand({
      FunctionName: AGENT_FUNCTION_NAME,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        analysisId,
        userId,
        request: parsed.data,
      }),
    }),
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ id: analysisId, status: 'pending' }),
  };
}

async function getAnalysisById(
  id: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const userId = event.requestContext.authorizer?.claims?.sub ?? 'anonymous';
  const analysis = await getAnalysis(id, userId);

  if (!analysis) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Analysis not found' }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify(analysis) };
}

async function listAnalyses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.requestContext.authorizer?.claims?.sub ?? 'anonymous';
  const limit = Number(event.queryStringParameters?.limit ?? '20');
  const analyses = await listAnalysesByUser(userId, limit);

  return { statusCode: 200, headers, body: JSON.stringify({ items: analyses }) };
}
