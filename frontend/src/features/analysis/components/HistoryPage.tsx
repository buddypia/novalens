import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAnalysisStore } from '../hooks/use-analysis-store';
import { useNavigate } from 'react-router-dom';
import type { Analysis } from '../types';

function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const { viewAnalysis } = useAnalysisStore();
  const navigate = useNavigate();

  const totalIssues = analysis.results
    ? analysis.results.uiIssues.length +
      analysis.results.codeIssues.length +
      analysis.results.crossModalIssues.length +
      analysis.results.accessibilityIssues.length
    : 0;

  const handleClick = () => {
    viewAnalysis(analysis);
    navigate('/');
  };

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={handleClick}
    >
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {analysis.status === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          ) : analysis.status === 'failed' ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {analysis.input.prTitle ?? `${analysis.input.codeLanguage.toUpperCase()} Analysis`}
            </span>
            <Badge
              variant={analysis.status === 'completed' ? 'default' : 'secondary'}
            >
              {analysis.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(analysis.createdAt).toLocaleString()}
            </span>
            {analysis.results && (
              <>
                <span>Score: {analysis.results.score}/100</span>
                <span>{totalIssues} issues found</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoryPage() {
  const { analyses, isLoadingHistory, loadHistory } = useAnalysisStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Analysis History</h1>

      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="mb-2 h-8 w-8" />
            <p className="text-sm">No analyses yet</p>
            <p className="mt-1 text-xs">
              Run your first analysis to see results here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}
