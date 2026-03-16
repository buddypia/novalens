import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { AnalysisResult } from '../types/analysis.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.ANALYSIS_TABLE_NAME ?? 'NovaLensAnalysis';

export async function saveAnalysis(analysis: Omit<AnalysisResult, 'results' | 'agentTrace'>): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: analysis,
    }),
  );
}

export async function getAnalysis(id: string, userId: string): Promise<AnalysisResult | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id, userId },
    }),
  );
  return (result.Item as AnalysisResult) ?? null;
}

export async function listAnalysesByUser(userId: string, limit: number): Promise<AnalysisResult[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: limit,
    }),
  );
  return (result.Items as AnalysisResult[]) ?? [];
}

export async function updateAnalysisStatus(
  id: string,
  userId: string,
  status: AnalysisResult['status'],
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id, userId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
    }),
  );
}

export async function updateAnalysisResult(
  id: string,
  userId: string,
  results: AnalysisResult['results'],
  agentTrace: AnalysisResult['agentTrace'],
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id, userId },
      UpdateExpression: 'SET #status = :status, results = :results, agentTrace = :trace, completedAt = :completedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':results': results,
        ':trace': agentTrace,
        ':completedAt': new Date().toISOString(),
      },
    }),
  );
}
