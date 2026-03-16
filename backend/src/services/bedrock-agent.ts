import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import type { AnalysisRequest, AnalysisResult, Issue, AgentStep } from '../types/analysis.js';
import { updateAnalysisResult, updateAnalysisStatus } from './dynamodb.js';

const client = new BedrockAgentRuntimeClient({ region: process.env.BEDROCK_REGION ?? 'us-east-1' });

const AGENT_ID = process.env.BEDROCK_AGENT_ID ?? '';
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID ?? '';

export async function invokeAgent(
  analysisId: string,
  userId: string,
  request: AnalysisRequest,
): Promise<void> {
  const prompt = buildPrompt(request);

  try {
    await updateAnalysisStatus(analysisId, userId, 'analyzing');

    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: analysisId,
      enableTrace: true,
      inputText: prompt,
    });

    const response = await client.send(command);

    let fullResponse = '';
    const traceSteps: AgentStep[] = [];

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          fullResponse += new TextDecoder().decode(event.chunk.bytes);
        }

        if (event.trace?.trace?.orchestrationTrace) {
          const orchTrace = event.trace.trace.orchestrationTrace;

          if (orchTrace.invocationInput?.actionGroupInvocationInput) {
            const toolName =
              orchTrace.invocationInput.actionGroupInvocationInput.function ?? 'unknown';
            traceSteps.push({
              toolName,
              input: JSON.stringify(
                orchTrace.invocationInput.actionGroupInvocationInput.parameters ?? {},
              ),
              output: '',
              durationMs: 0,
            });
          }

          if (orchTrace.observation?.actionGroupInvocationOutput && traceSteps.length > 0) {
            const lastStep = traceSteps[traceSteps.length - 1]!;
            lastStep.output = orchTrace.observation.actionGroupInvocationOutput.text ?? '';
          }
        }
      }
    }

    let results = parseAgentResponse(fullResponse);

    // If main response parsing yielded no issues, extract from trace tool outputs
    const totalIssues =
      results.uiIssues.length +
      results.codeIssues.length +
      results.crossModalIssues.length +
      results.accessibilityIssues.length;

    if (totalIssues === 0 && traceSteps.length > 0) {
      results = buildResultsFromTrace(traceSteps);
    }

    await updateAnalysisResult(analysisId, userId, results, traceSteps);
  } catch (error) {
    console.error('Bedrock Agent invocation failed:', error);
    await updateAnalysisStatus(analysisId, userId, 'failed');
    throw error;
  }
}

function buildPrompt(request: AnalysisRequest): string {
  const isPR = !!request.diff;
  const codeBlock = isPR ? request.diff! : request.code ?? '';
  const prContext = request.prTitle
    ? `\nPR Title: ${request.prTitle}\nPR URL: ${request.prUrl ?? 'N/A'}`
    : '';
  const filesContext = request.files?.length
    ? `\nChanged files (${request.files.length}):\n${request.files.map((f) => `  - ${f.filename} (${f.status})`).join('\n')}`
    : '';

  const parts: string[] = [];

  parts.push(`Analysis type: ${request.analysisType}`);
  parts.push(`Code language: ${request.codeLanguage}${prContext}${filesContext}`);

  if (request.screenshotBase64) {
    parts.push('\nA UI screenshot has been provided for visual analysis.');
  }

  parts.push(`\n${isPR ? 'PR Diff' : 'Code'}:`);
  parts.push(`\`\`\`${isPR ? 'diff' : request.codeLanguage}`);
  parts.push(codeBlock);
  parts.push('```');

  parts.push(
    `\nPlease analyze this ${isPR ? 'PR diff' : 'code'} for code quality issues and accessibility issues, then generate a final report.`,
  );

  return parts.join('\n');
}

function parseAgentResponse(response: string): NonNullable<AnalysisResult['results']> {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        uiIssues: normalizeIssues(parsed.uiIssues, 'ui'),
        codeIssues: normalizeIssues(parsed.codeIssues, 'code'),
        crossModalIssues: normalizeIssues(parsed.crossModalIssues, 'cross-modal'),
        accessibilityIssues: normalizeIssues(parsed.accessibilityIssues, 'accessibility'),
        summary: parsed.summary ?? 'Analysis completed.',
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
      };
    } catch {
      // Fall through to fallback
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

const TOOL_CATEGORY_MAP: Record<string, keyof ReturnType<typeof buildResultsFromTrace>> = {
  analyzeCodeQuality: 'codeIssues',
  analyzeUIDesign: 'uiIssues',
  checkAccessibility: 'accessibilityIssues',
  crossModalAnalysis: 'crossModalIssues',
};

function buildResultsFromTrace(steps: AgentStep[]): NonNullable<AnalysisResult['results']> {
  const results: NonNullable<AnalysisResult['results']> = {
    uiIssues: [],
    codeIssues: [],
    crossModalIssues: [],
    accessibilityIssues: [],
    summary: '',
    score: 0,
  };

  for (const step of steps) {
    const category = TOOL_CATEGORY_MAP[step.toolName];
    if (!category || !step.output) continue;

    // Extract JSON array from markdown code block or raw JSON
    const jsonMatch = step.output.match(/```(?:json)?\s*([\s\S]*?)```/) ?? step.output.match(/(\[[\s\S]*\])/);
    if (!jsonMatch?.[1]) continue;

    try {
      const issues = JSON.parse(jsonMatch[1]);
      if (Array.isArray(issues)) {
        const categoryName = category.replace('Issues', '').replace('crossModal', 'cross-modal');
        results[category] = normalizeIssues(issues, categoryName);
      }
    } catch {
      // skip unparseable output
    }
  }

  const total =
    results.uiIssues.length +
    results.codeIssues.length +
    results.crossModalIssues.length +
    results.accessibilityIssues.length;

  const criticals = [
    ...results.uiIssues,
    ...results.codeIssues,
    ...results.crossModalIssues,
    ...results.accessibilityIssues,
  ].filter((i) => i.severity === 'critical').length;

  const majors = [
    ...results.uiIssues,
    ...results.codeIssues,
    ...results.crossModalIssues,
    ...results.accessibilityIssues,
  ].filter((i) => i.severity === 'major').length;

  results.score = Math.max(0, 100 - criticals * 20 - majors * 10 - (total - criticals - majors) * 3);
  results.summary = `Found ${total} issue${total !== 1 ? 's' : ''} across ${
    [results.uiIssues, results.codeIssues, results.crossModalIssues, results.accessibilityIssues]
      .filter((a) => a.length > 0).length
  } categories.`;

  return results;
}
