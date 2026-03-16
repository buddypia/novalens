import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { AnalysisRequest, AnalysisResult, Issue, AgentStep } from '../types/analysis.js';
import { updateAnalysisResult, updateAnalysisStatus } from './dynamodb.js';

const client = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION ?? 'us-east-1' });
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'us.amazon.nova-2-lite-v1:0';

// JSON Schema for individual issue items
const ISSUE_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    severity: { type: 'string', description: 'Issue severity: critical, major, minor, or info' },
    title: { type: 'string', description: 'Short descriptive title of the issue' },
    description: { type: 'string', description: 'Detailed explanation of what is wrong and why' },
    location: { type: 'string', description: 'File path and line number, e.g. src/App.tsx:42' },
    suggestion: { type: 'string', description: 'How to fix the issue' },
    fixCode: { type: 'string', description: 'Corrected code snippet' },
  },
  required: ['severity', 'title', 'description'],
};

// Tool definition for structured output via forced tool use
const ANALYSIS_TOOL_SPEC = {
  name: 'submitAnalysisReport',
  description:
    'Submit the complete code review report with all identified issues. ' +
    'You MUST call this tool with your analysis findings organized by category. ' +
    'Be thorough and identify real, actionable problems.',
  inputSchema: {
    json: {
      type: 'object',
      properties: {
        uiIssues: { type: 'array', description: 'UI/visual design issues found in the code', items: ISSUE_ITEM_SCHEMA },
        codeIssues: { type: 'array', description: 'Code quality, bugs, and performance issues', items: ISSUE_ITEM_SCHEMA },
        crossModalIssues: { type: 'array', description: 'Mismatches between design intent and code implementation', items: ISSUE_ITEM_SCHEMA },
        accessibilityIssues: { type: 'array', description: 'WCAG and accessibility violations', items: ISSUE_ITEM_SCHEMA },
        summary: { type: 'string', description: 'Overall analysis summary in 2-3 sentences' },
        score: { type: 'number', description: 'Overall code quality score from 0 (worst) to 100 (best)' },
      },
      required: ['uiIssues', 'codeIssues', 'crossModalIssues', 'accessibilityIssues', 'summary', 'score'],
    },
  },
};

export async function invokeAgent(
  analysisId: string,
  userId: string,
  request: AnalysisRequest,
): Promise<void> {
  try {
    await updateAnalysisStatus(analysisId, userId, 'analyzing');

    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: buildSystemPrompt(request) }],
      messages: [
        { role: 'user', content: [{ text: buildUserMessage(request) }] },
      ],
      toolConfig: {
        tools: [{ toolSpec: ANALYSIS_TOOL_SPEC }],
        toolChoice: { tool: { name: 'submitAnalysisReport' } },
      },
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0,
      },
    });

    console.log('Invoking Nova 2 Lite via Converse API, model:', MODEL_ID);
    const response = await client.send(command);
    console.log('Response stopReason:', response.stopReason);

    const traceSteps: AgentStep[] = [];
    let results: NonNullable<AnalysisResult['results']>;

    // Extract tool use input from response
    const toolInput = extractToolUseInput(response);

    if (toolInput) {
      results = {
        uiIssues: normalizeIssues(toolInput.uiIssues, 'ui'),
        codeIssues: normalizeIssues(toolInput.codeIssues, 'code'),
        crossModalIssues: normalizeIssues(toolInput.crossModalIssues, 'cross-modal'),
        accessibilityIssues: normalizeIssues(toolInput.accessibilityIssues, 'accessibility'),
        summary: String(toolInput.summary ?? 'Analysis completed.'),
        score: typeof toolInput.score === 'number' ? Math.max(0, Math.min(100, toolInput.score)) : 50,
      };

      const totalIssues =
        results.uiIssues.length + results.codeIssues.length +
        results.crossModalIssues.length + results.accessibilityIssues.length;

      traceSteps.push({
        toolName: 'submitAnalysisReport',
        input: JSON.stringify({ modelId: MODEL_ID, analysisType: request.analysisType }),
        output: JSON.stringify({ totalIssues, score: results.score }),
        durationMs: 0,
      });

      console.log('Tool use parsed successfully. Issues:', totalIssues, 'Score:', results.score);
    } else {
      // Fallback: try to parse from text response
      const text = extractTextResponse(response);
      console.warn('No tool use in response, falling back to text parsing. Text length:', text.length);
      results = parseTextFallback(text);
    }

    await updateAnalysisResult(analysisId, userId, results, traceSteps);
  } catch (error) {
    console.error('Nova 2 Lite invocation failed:', error);
    await updateAnalysisStatus(analysisId, userId, 'failed');
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractToolUseInput(response: any): Record<string, unknown> | null {
  const content = response.output?.message?.content;
  if (!Array.isArray(content)) return null;

  for (const block of content) {
    if (block.toolUse?.input) {
      return block.toolUse.input as Record<string, unknown>;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextResponse(response: any): string {
  const content = response.output?.message?.content;
  if (!Array.isArray(content)) return '';

  for (const block of content) {
    if (typeof block.text === 'string') return block.text;
  }
  return '';
}

function buildSystemPrompt(request: AnalysisRequest): string {
  return [
    `You are an expert code reviewer for ${request.codeLanguage} applications.`,
    'Analyze the provided code thoroughly for:',
    '1. UI/Visual Design issues (layout, colors, spacing, responsive design, component structure)',
    '2. Code Quality issues (bugs, performance, maintainability, naming conventions, React best practices)',
    '3. Cross-Modal issues (mismatches between intended design and actual code implementation)',
    '4. Accessibility issues (WCAG compliance, ARIA attributes, keyboard navigation, screen reader support)',
    '',
    'For each issue, provide:',
    '- severity: "critical" (app-breaking), "major" (significant problem), "minor" (improvement), or "info" (suggestion)',
    '- title: concise description',
    '- description: detailed explanation',
    '- location: file path and line number',
    '- suggestion: how to fix it',
    '- fixCode: corrected code snippet when applicable',
    '',
    'Rate overall quality from 0 (critical failures) to 100 (excellent).',
    'Be specific and actionable. Focus on real problems, not style preferences.',
  ].join('\n');
}

function buildUserMessage(request: AnalysisRequest): string {
  const isPR = !!request.diff;
  const codeBlock = isPR ? request.diff! : request.code ?? '';

  const parts: string[] = [];
  parts.push(`Analysis type: ${request.analysisType}`);

  if (request.prTitle) parts.push(`PR Title: ${request.prTitle}`);
  if (request.prUrl) parts.push(`PR URL: ${request.prUrl}`);

  if (request.files?.length) {
    parts.push(`\nChanged files (${request.files.length}):`);
    for (const f of request.files) {
      parts.push(`  - ${f.filename} (${f.status})`);
    }
  }

  parts.push('');
  parts.push(`${isPR ? 'PR Diff' : 'Code'}:`);
  parts.push(`\`\`\`${isPR ? 'diff' : request.codeLanguage}`);
  parts.push(codeBlock);
  parts.push('```');

  if (request.screenshotBase64) {
    parts.push('\nNote: A UI screenshot was provided. Consider visual design aspects in your code-level review.');
  }

  parts.push('\nAnalyze this code thoroughly and submit your complete findings.');

  return parts.join('\n');
}

function parseTextFallback(response: string): NonNullable<AnalysisResult['results']> {
  // Try markdown code block first
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    const result = tryParseAnalysisJson(codeBlockMatch[1].trim());
    if (result) return result;
  }

  // Try balanced brace matching
  for (let i = 0; i < response.length; i++) {
    if (response[i] !== '{') continue;

    let depth = 0;
    for (let j = i; j < response.length; j++) {
      if (response[j] === '{') depth++;
      else if (response[j] === '}') {
        depth--;
        if (depth === 0) {
          const result = tryParseAnalysisJson(response.slice(i, j + 1));
          if (result) return result;
          break;
        }
      }
    }
  }

  return {
    uiIssues: [],
    codeIssues: [],
    crossModalIssues: [],
    accessibilityIssues: [],
    summary: response || 'Analysis completed but no structured output was generated.',
    score: 0,
  };
}

function tryParseAnalysisJson(text: string): NonNullable<AnalysisResult['results']> | null {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;

    if (!parsed.uiIssues && !parsed.codeIssues && !parsed.crossModalIssues && !parsed.accessibilityIssues) {
      return null;
    }

    return {
      uiIssues: normalizeIssues(parsed.uiIssues, 'ui'),
      codeIssues: normalizeIssues(parsed.codeIssues, 'code'),
      crossModalIssues: normalizeIssues(parsed.crossModalIssues, 'cross-modal'),
      accessibilityIssues: normalizeIssues(parsed.accessibilityIssues, 'accessibility'),
      summary: parsed.summary ?? 'Analysis completed.',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
    };
  } catch {
    return null;
  }
}

function normalizeIssues(raw: unknown, category: string): Issue[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: Record<string, unknown>, idx: number) => ({
    id: (item.id as string) ?? `${category}-${idx + 1}`,
    severity: validateSeverity(item.severity),
    category: category as Issue['category'],
    title: String(item.title ?? 'Untitled issue'),
    description: String(item.description ?? ''),
    location: item.location != null ? String(item.location) : undefined,
    suggestion: item.suggestion != null ? String(item.suggestion) : undefined,
    fixCode: item.fixCode != null ? String(item.fixCode) : undefined,
  }));
}

function validateSeverity(value: unknown): Issue['severity'] {
  if (value === 'critical' || value === 'major' || value === 'minor' || value === 'info') {
    return value;
  }
  return 'info';
}
