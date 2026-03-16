import { AlertTriangle, CheckCircle, Info, AlertCircle, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { Issue, Severity, IssueCategory, AnalysisResults } from '../types';
import { SEVERITY_COLORS, CATEGORY_LABELS, SEVERITY_ORDER } from '../types';
import { useAnalysisStore } from '../hooks/use-analysis-store';

const SEVERITY_ICONS = {
  critical: AlertCircle,
  major: AlertTriangle,
  minor: Info,
  info: CheckCircle,
} as const;

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? 'text-emerald-500'
      : score >= 60
        ? 'text-yellow-500'
        : score >= 40
          ? 'text-orange-500'
          : 'text-red-500';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const Icon = SEVERITY_ICONS[issue.severity];

  return (
    <div className={`rounded-lg border p-4 ${SEVERITY_COLORS[issue.severity]}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{issue.title}</span>
            <Badge variant="outline" className="text-[10px]">
              {issue.severity}
            </Badge>
          </div>
          <p className="mt-1 text-xs opacity-80">{issue.description}</p>
          {issue.location && (
            <p className="mt-1 font-mono text-[10px] opacity-60">
              Location: {issue.location}
            </p>
          )}
          {issue.suggestion && (
            <p className="mt-2 text-xs font-medium">
              Suggestion: {issue.suggestion}
            </p>
          )}
          {issue.fixCode && (
            <pre className="mt-2 overflow-x-auto rounded bg-black/5 p-2 text-[11px] dark:bg-white/5">
              <code>{issue.fixCode}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueCategoryTab({
  issues,
  category,
}: {
  issues: Issue[];
  category: IssueCategory;
}) {
  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CheckCircle className="mb-2 h-8 w-8" />
        <p className="text-sm">No {CATEGORY_LABELS[category].toLowerCase()} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

function SeveritySummary({ results }: { results: AnalysisResults }) {
  const allIssues = [
    ...results.uiIssues,
    ...results.codeIssues,
    ...results.crossModalIssues,
    ...results.accessibilityIssues,
  ];
  const counts: Record<Severity, number> = { critical: 0, major: 0, minor: 0, info: 0 };
  for (const issue of allIssues) {
    counts[issue.severity]++;
  }

  return (
    <div className="flex gap-3">
      {(Object.entries(counts) as [Severity, number][]).map(([severity, count]) => (
        <div
          key={severity}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${SEVERITY_COLORS[severity]}`}
        >
          {count}
          <span className="capitalize">{severity}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalysisReport() {
  const { currentAnalysis } = useAnalysisStore();
  const results = currentAnalysis?.results;

  if (!results) return null;

  return (
    <div className="space-y-6">
      {/* Score + Summary */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          <ScoreRing score={results.score} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Analysis Complete</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{results.summary}</p>
            <div className="mt-3">
              <SeveritySummary results={results} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Issues by Category */}
      <Tabs defaultValue="cross-modal">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="cross-modal" className="gap-1">
            Cross-Modal
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {results.crossModalIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="gap-1">
            Accessibility
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {results.accessibilityIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-1">
            UI
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {results.uiIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-1">
            Code
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {results.codeIssues.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cross-modal">
          <IssueCategoryTab issues={results.crossModalIssues} category="cross-modal" />
        </TabsContent>
        <TabsContent value="accessibility">
          <IssueCategoryTab issues={results.accessibilityIssues} category="accessibility" />
        </TabsContent>
        <TabsContent value="ui">
          <IssueCategoryTab issues={results.uiIssues} category="ui" />
        </TabsContent>
        <TabsContent value="code">
          <IssueCategoryTab issues={results.codeIssues} category="code" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
