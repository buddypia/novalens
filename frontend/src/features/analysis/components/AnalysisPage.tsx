import { AnalysisInputForm } from './AnalysisInputForm';
import { AgentTracePanel } from './AgentTracePanel';
import { AnalysisReport } from './AnalysisReport';
import { useAnalysisStore } from '../hooks/use-analysis-store';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function AnalysisPage() {
  const { currentAnalysis, reset } = useAnalysisStore();
  const showResults = currentAnalysis != null;

  return (
    <div className="space-y-6">
      {showResults && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            New Analysis
          </Button>
        </div>
      )}

      {!showResults && <AnalysisInputForm />}

      {showResults && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AgentTracePanel />
          </div>
          <div className="lg:col-span-2">
            <AnalysisReport />
          </div>
        </div>
      )}
    </div>
  );
}
