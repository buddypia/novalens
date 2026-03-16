import { z } from 'zod';

export const AnalysisRequestSchema = z.object({
  prUrl: z.string().url().optional(),
  prTitle: z.string().optional(),
  diff: z.string().optional(),
  files: z.array(z.object({
    filename: z.string(),
    status: z.string(),
    patch: z.string().optional(),
  })).optional(),
  // Legacy: direct code input (kept for backwards compatibility)
  code: z.string().optional(),
  screenshotUrl: z.string().url().optional(),
  screenshotBase64: z.string().optional(),
  codeLanguage: z.enum(['html', 'css', 'react', 'vue', 'svelte']).default('react'),
  analysisType: z.enum(['full', 'ui-only', 'code-only', 'accessibility']).default('full'),
}).refine(
  (data) => !!(data.diff || data.code),
  { message: 'Either diff (from PR) or code (direct input) is required' },
);

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export interface AnalysisResult {
  id: string;
  userId: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  input: {
    hasScreenshot: boolean;
    codeLanguage: string;
    codeLength: number;
    prUrl?: string;
    prTitle?: string;
    fileCount?: number;
  };
  results?: {
    uiIssues: Issue[];
    codeIssues: Issue[];
    crossModalIssues: Issue[];
    accessibilityIssues: Issue[];
    summary: string;
    score: number;
  };
  agentTrace?: AgentStep[];
}

export interface Issue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
  fixCode?: string;
}

export interface AgentStep {
  toolName: string;
  input: string;
  output: string;
  durationMs: number;
}
