export interface PRInfo {
  number: number;
  title: string;
  state: string;
  user: string;
  avatarUrl: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  htmlUrl: string;
  baseBranch: string;
  headBranch: string;
}

export interface PRFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
  rawUrl: string;
}

const FRONTEND_EXTENSIONS = [
  '.tsx', '.jsx', '.ts', '.js',
  '.html', '.css', '.scss',
  '.vue', '.svelte',
];

export function parsePRUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1]!, repo: match[2]!, number: parseInt(match[3]!, 10) };
}

export async function fetchPRInfo(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PRInfo> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error('PR not found. Is the repository public?');
    if (res.status === 403) throw new Error('GitHub API rate limit exceeded. Try again later.');
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const data = await res.json();
  return {
    number: data.number,
    title: data.title,
    state: data.state,
    user: data.user.login,
    avatarUrl: data.user.avatar_url,
    additions: data.additions,
    deletions: data.deletions,
    changedFiles: data.changed_files,
    htmlUrl: data.html_url,
    baseBranch: data.base.ref,
    headBranch: data.head.ref,
  };
}

export async function fetchPRFiles(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PRFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
    { headers: { Accept: 'application/vnd.github.v3+json' } },
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  return data.map((f: Record<string, unknown>) => ({
    filename: f.filename as string,
    status: f.status as PRFile['status'],
    additions: f.additions as number,
    deletions: f.deletions as number,
    patch: f.patch as string | undefined,
    rawUrl: f.raw_url as string,
  }));
}

export function filterFrontendFiles(files: PRFile[]): PRFile[] {
  return files.filter(
    (f) => FRONTEND_EXTENSIONS.some((ext) => f.filename.endsWith(ext)) && f.patch,
  );
}

export function detectLanguage(files: PRFile[]): string {
  const extCounts: Record<string, number> = {};
  for (const f of files) {
    const ext = f.filename.slice(f.filename.lastIndexOf('.'));
    extCounts[ext] = (extCounts[ext] ?? 0) + 1;
  }
  const dominant = Object.entries(extCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominant === '.tsx' || dominant === '.jsx') return 'react';
  if (dominant === '.vue') return 'vue';
  if (dominant === '.svelte') return 'svelte';
  if (dominant === '.css' || dominant === '.scss') return 'css';
  if (dominant === '.html') return 'html';
  return 'react';
}

export function buildDiffSummary(files: PRFile[]): string {
  return files
    .map(
      (f) =>
        `=== ${f.filename} (${f.status}, +${f.additions}/-${f.deletions}) ===\n${f.patch ?? '(no diff)'}`,
    )
    .join('\n\n');
}
