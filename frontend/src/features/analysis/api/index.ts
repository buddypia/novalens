import type { Analysis } from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function createAnalysis(params: {
  prUrl: string;
  prTitle: string;
  diff: string;
  files: { filename: string; status: string; patch?: string }[];
  codeLanguage: string;
  analysisType: string;
  screenshotBase64?: string;
}): Promise<{ id: string; status: string }> {
  return fetchJSON(`${API_BASE}/analyses`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getAnalysis(id: string): Promise<Analysis> {
  return fetchJSON(`${API_BASE}/analyses/${id}`);
}

export async function listAnalyses(limit = 20): Promise<{ items: Analysis[] }> {
  return fetchJSON(`${API_BASE}/analyses?limit=${limit}`);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]!);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
