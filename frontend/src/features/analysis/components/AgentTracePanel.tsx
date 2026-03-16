import { Eye, Code, GitCompareArrows, FileText, Loader2, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AgentStep } from '../types';
import { useAnalysisStore } from '../hooks/use-analysis-store';

const STEP_ICONS = {
  ui_analysis: Eye,
  code_analysis: Code,
  cross_modal: GitCompareArrows,
  report_generation: FileText,
} as const;

const STEP_DESCRIPTIONS = {
  ui_analysis: 'Analyzing screenshot for layout, color contrast, and spacing issues...',
  code_analysis: 'Checking code structure, semantics, and accessibility attributes...',
  cross_modal: 'Cross-referencing visual findings with code implementation...',
  report_generation: 'Compiling prioritized report with fix suggestions...',
} as const;

function StepItem({ step, index }: { step: AgentStep; index: number }) {
  const Icon = STEP_ICONS[step.toolName as keyof typeof STEP_ICONS] ?? FileText;
  const description =
    STEP_DESCRIPTIONS[step.toolName as keyof typeof STEP_DESCRIPTIONS] ?? '';

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
            step.status === 'completed'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950'
              : step.status === 'running'
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950'
                : 'border-muted text-muted-foreground'
          }`}
        >
          {step.status === 'completed' ? (
            <Check className="h-4 w-4" />
          ) : step.status === 'running' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-xs font-medium">{index + 1}</span>
          )}
        </div>
        {index < 3 && (
          <div
            className={`w-0.5 grow transition-colors duration-500 ${
              step.status === 'completed' ? 'bg-emerald-300' : 'bg-muted'
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-h-16 pb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span
            className={`text-sm font-medium ${
              step.status === 'running' ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            {step.displayName}
          </span>
          {step.durationMs != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {(step.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {step.status === 'running' && (
          <p className="mt-1 text-xs text-muted-foreground animate-in fade-in">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function AgentTracePanel() {
  const { agentSteps, currentAnalysis } = useAnalysisStore();

  if (!currentAnalysis) return null;

  const completedSteps = agentSteps.filter((s) => s.status === 'completed').length;
  const isComplete = completedSteps === agentSteps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Agent Reasoning Trace</span>
          <span className="text-sm font-normal text-muted-foreground">
            {isComplete ? 'Completed' : `Step ${completedSteps + 1} of ${agentSteps.length}`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {agentSteps.map((step, idx) => (
            <StepItem key={step.toolName} step={step} index={idx} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
