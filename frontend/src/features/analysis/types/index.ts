import { z } from 'zod';

// --- Re-export GitHub types ---
export type { PRInfo, PRFile } from '../api/github';

// --- Request Schemas ---

export const analysisRequestSchema = z.object({
  prUrl: z.string().url(),
  prTitle: z.string(),
  diff: z.string(),
  files: z.array(z.object({
    filename: z.string(),
    status: z.enum(['added', 'modified', 'removed', 'renamed']),
    patch: z.string().optional(),
  })),
  screenshotFile: z.instanceof(File).optional(),
  screenshotBase64: z.string().optional(),
  codeLanguage: z.enum(['html', 'css', 'react', 'vue', 'svelte']).default('react'),
  analysisType: z.enum(['full', 'ui-only', 'code-only', 'accessibility']).default('full'),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

// --- Response Types ---

export type Severity = 'critical' | 'major' | 'minor' | 'info';
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';
export type IssueCategory = 'ui' | 'code' | 'cross-modal' | 'accessibility';

export interface Issue {
  id: string;
  severity: Severity;
  category: IssueCategory;
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
  fixCode?: string;
}

export interface AgentStep {
  toolName: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: string;
  output?: string;
  durationMs?: number;
}

export interface AnalysisResults {
  uiIssues: Issue[];
  codeIssues: Issue[];
  crossModalIssues: Issue[];
  accessibilityIssues: Issue[];
  summary: string;
  score: number;
}

export interface Analysis {
  id: string;
  userId: string;
  status: AnalysisStatus;
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
  results?: AnalysisResults;
  agentTrace?: AgentStep[];
}

// --- UI State ---

export const AGENT_STEPS: readonly AgentStep[] = [
  { toolName: 'ui_analysis', displayName: 'UI Visual Analysis', status: 'pending' },
  { toolName: 'code_analysis', displayName: 'Code Structure Analysis', status: 'pending' },
  { toolName: 'cross_modal', displayName: 'Cross-Modal Reasoning', status: 'pending' },
  { toolName: 'report_generation', displayName: 'Report Generation', status: 'pending' },
] as const;

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  info: 3,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  major: 'text-orange-600 bg-orange-50 border-orange-200',
  minor: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
};

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  ui: 'UI Issues',
  code: 'Code Issues',
  'cross-modal': 'Cross-Modal Issues',
  accessibility: 'Accessibility Issues',
};
