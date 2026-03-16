import { create } from 'zustand';
import type { Analysis, AgentStep } from '../types';
import type { PRFile } from '../api/github';
import { AGENT_STEPS } from '../types';
import { createAnalysis, getAnalysis, listAnalyses, fileToBase64 } from '../api';
import { buildDiffSummary } from '../api/github';

interface AnalysisState {
  currentAnalysis: Analysis | null;
  agentSteps: AgentStep[];
  isSubmitting: boolean;
  error: string | null;
  analyses: Analysis[];
  isLoadingHistory: boolean;

  submitAnalysis: (params: {
    prUrl: string;
    prTitle: string;
    prFiles: PRFile[];
    codeLanguage: string;
    analysisType: string;
    screenshotFile?: File;
  }) => Promise<void>;
  pollAnalysis: (id: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  viewAnalysis: (analysis: Analysis) => void;
  reset: () => void;
  simulateAgentProgress: (onComplete: () => void) => void;
}

const MAX_DIFF_LENGTH = 8000;

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  agentSteps: AGENT_STEPS.map((s) => ({ ...s })),
  isSubmitting: false,
  error: null,
  analyses: [],
  isLoadingHistory: false,

  submitAnalysis: async ({ prUrl, prTitle, prFiles, codeLanguage, analysisType, screenshotFile }) => {
    set({
      isSubmitting: true,
      error: null,
      agentSteps: AGENT_STEPS.map((s) => ({ ...s })),
      currentAnalysis: null,
    });

    const diff = buildDiffSummary(prFiles).slice(0, MAX_DIFF_LENGTH);

    try {
      let screenshotBase64: string | undefined;
      if (screenshotFile) {
        screenshotBase64 = await fileToBase64(screenshotFile);
      }

      const files = prFiles.map((f) => ({
        filename: f.filename,
        status: f.status,
        patch: f.patch,
      }));

      const { id } = await createAnalysis({
        prUrl,
        prTitle,
        diff,
        files,
        codeLanguage,
        analysisType,
        screenshotBase64,
      });

      set({
        currentAnalysis: {
          id,
          userId: '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          input: {
            hasScreenshot: !!screenshotFile,
            codeLanguage,
            codeLength: diff.length,
            prUrl,
            prTitle,
            fileCount: prFiles.length,
          },
        },
        isSubmitting: false,
      });

      get().simulateAgentProgress(() => {});
      get().pollAnalysis(id);
    } catch (err) {
      set({
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Analysis submission failed',
      });
    }
  },

  pollAnalysis: async (id: string) => {
    const poll = async () => {
      try {
        const analysis = await getAnalysis(id);
        set({ currentAnalysis: analysis });

        if (analysis.status === 'completed' || analysis.status === 'failed') {
          if (analysis.status === 'completed') {
            set({
              agentSteps: AGENT_STEPS.map((s) => ({ ...s, status: 'completed' as const })),
            });
          }
          return;
        }

        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 3000);
      }
    };

    setTimeout(poll, 1000);
  },

  loadHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const { items } = await listAnalyses(20);
      set({ analyses: items, isLoadingHistory: false });
    } catch {
      set({ isLoadingHistory: false });
    }
  },

  viewAnalysis: (analysis: Analysis) => {
    set({
      currentAnalysis: analysis,
      agentSteps:
        analysis.agentTrace ??
        AGENT_STEPS.map((s) => ({ ...s, status: 'completed' as const })),
    });
  },

  reset: () => {
    set({
      currentAnalysis: null,
      agentSteps: AGENT_STEPS.map((s) => ({ ...s })),
      isSubmitting: false,
      error: null,
    });
  },

  simulateAgentProgress: (onComplete: () => void) => {
    const stepDelays = [500, 3000, 7000, 12000];
    const stepDurations = [2500, 4000, 5000, 3000];
    const totalDuration =
      stepDelays[stepDelays.length - 1]! + stepDurations[stepDurations.length - 1]!;

    stepDelays.forEach((delay, idx) => {
      setTimeout(() => {
        set((state) => {
          if (state.currentAnalysis?.status === 'completed') return state;
          const steps = [...state.agentSteps];
          steps[idx] = { ...steps[idx]!, status: 'running' };
          return { agentSteps: steps };
        });
      }, delay);

      setTimeout(() => {
        set((state) => {
          if (state.currentAnalysis?.status === 'completed') return state;
          const steps = [...state.agentSteps];
          steps[idx] = {
            ...steps[idx]!,
            status: 'completed',
            durationMs: stepDurations[idx],
          };
          return { agentSteps: steps };
        });
      }, delay + stepDurations[idx]!);
    });

    setTimeout(onComplete, totalDuration);
  },
}));
