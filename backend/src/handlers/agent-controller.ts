import type { Context } from 'aws-lambda';
import { invokeAgent } from '../services/bedrock-agent.js';
import type { AnalysisRequest } from '../types/analysis.js';

interface AgentEvent {
  analysisId: string;
  userId: string;
  request: AnalysisRequest;
}

export async function handler(event: AgentEvent, _context: Context): Promise<void> {
  console.log('Agent controller invoked:', {
    analysisId: event.analysisId,
    userId: event.userId,
    analysisType: event.request.analysisType,
  });

  await invokeAgent(event.analysisId, event.userId, event.request);
}
