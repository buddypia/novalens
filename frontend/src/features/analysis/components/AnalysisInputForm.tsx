import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  Upload,
  X,
  Sparkles,
  GitPullRequest,
  Loader2,
  FileCode,
  Plus,
  Minus,
  ExternalLink,
  Eye,
  Code,
  GitCompareArrows,
  ImageIcon,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalysisStore } from '../hooks/use-analysis-store';
import {
  parsePRUrl,
  fetchPRInfo,
  fetchPRFiles,
  filterFrontendFiles,
  detectLanguage,
  type PRInfo,
  type PRFile,
} from '../api/github';

const SAMPLE_PR_URL = 'https://github.com/facebook/react/pull/28271';

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: GitPullRequest,
    title: 'Paste PR URL',
    desc: 'Enter any public GitHub PR link. We auto-detect frontend file changes.',
  },
  {
    step: 2,
    icon: ImageIcon,
    title: 'Add Screenshot',
    desc: 'Upload a UI screenshot to enable visual cross-modal analysis.',
  },
  {
    step: 3,
    icon: Sparkles,
    title: 'Get AI Review',
    desc: 'Nova 2 Lite analyzes your diff for UI, code, and accessibility issues.',
  },
] as const;

export function AnalysisInputForm() {
  const { submitAnalysis, isSubmitting } = useAnalysisStore();

  const [prUrl, setPrUrl] = useState('');
  const [prInfo, setPrInfo] = useState<PRInfo | null>(null);
  const [prFiles, setPrFiles] = useState<PRFile[]>([]);
  const [frontendFiles, setFrontendFiles] = useState<PRFile[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState('full');

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const removeScreenshot = useCallback(() => {
    setScreenshotFile(null);
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(null);
  }, [screenshotPreview]);

  const fetchPR = async (url?: string) => {
    const targetUrl = url ?? prUrl;
    const parsed = parsePRUrl(targetUrl);
    if (!parsed) {
      setFetchError('Invalid GitHub PR URL. Example: https://github.com/owner/repo/pull/123');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setPrInfo(null);
    setPrFiles([]);
    setFrontendFiles([]);

    try {
      const [info, files] = await Promise.all([
        fetchPRInfo(parsed.owner, parsed.repo, parsed.number),
        fetchPRFiles(parsed.owner, parsed.repo, parsed.number),
      ]);
      const feFiles = filterFrontendFiles(files);
      setPrInfo(info);
      setPrFiles(files);
      setFrontendFiles(feFiles);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch PR');
    } finally {
      setIsFetching(false);
    }
  };

  const loadSample = () => {
    setPrUrl(SAMPLE_PR_URL);
    fetchPR(SAMPLE_PR_URL);
  };

  const handleSubmit = () => {
    if (!prInfo || frontendFiles.length === 0) return;
    const lang = detectLanguage(frontendFiles);
    submitAnalysis({
      prUrl: prInfo.htmlUrl,
      prTitle: prInfo.title,
      prFiles: frontendFiles,
      codeLanguage: lang,
      analysisType,
      screenshotFile: screenshotFile ?? undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isFetching) fetchPR();
  };

  return (
    <div className="space-y-8">
      {/* How It Works - only show before PR is fetched */}
      {!prInfo && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              AI-Powered Visual Code Review
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a GitHub PR link and let AI catch UI bugs, accessibility issues,
              and code-visual mismatches before they reach production.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="relative flex flex-col items-center rounded-lg border bg-card p-4 text-center"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="absolute top-2 left-3 text-xs font-bold text-muted-foreground/40">
                  {step}
                </span>
                <h3 className="mt-2 text-sm font-medium">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: PR URL Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitPullRequest className="h-4 w-4" />
              {prInfo ? 'Pull Request' : 'Step 1 — Paste PR URL'}
            </CardTitle>
            {!prInfo && (
              <button
                onClick={loadSample}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Try sample PR
              </button>
            )}
            {prInfo && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setPrInfo(null);
                  setPrFiles([]);
                  setFrontendFiles([]);
                  setPrUrl('');
                  setFetchError(null);
                }}
              >
                Change PR
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!prInfo && (
            <>
              <div className="flex gap-2">
                <Input
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="font-mono text-sm"
                  disabled={isFetching}
                />
                <Button
                  onClick={() => fetchPR()}
                  disabled={!prUrl.trim() || isFetching}
                  variant="secondary"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Fetch
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Works with any public GitHub repository. We'll auto-detect .tsx, .jsx, .html, .css, .vue, and .svelte files.
              </p>
            </>
          )}

          {fetchError && (
            <p className="text-sm text-destructive">{fetchError}</p>
          )}

          {/* PR Info Card */}
          {prInfo && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={prInfo.state === 'open' ? 'default' : 'secondary'}
                      className={prInfo.state === 'open' ? 'bg-emerald-600' : ''}
                    >
                      {prInfo.state}
                    </Badge>
                    <span className="truncate text-sm font-medium">
                      {prInfo.title}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <img
                        src={prInfo.avatarUrl}
                        alt={prInfo.user}
                        className="h-4 w-4 rounded-full"
                      />
                      {prInfo.user}
                    </span>
                    <span>{prInfo.baseBranch} ← {prInfo.headBranch}</span>
                    <a
                      href={prInfo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      #{prInfo.number}
                    </a>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Plus className="h-3 w-3" />
                    {prInfo.additions}
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <Minus className="h-3 w-3" />
                    {prInfo.deletions}
                  </span>
                  <span className="text-muted-foreground">
                    {prInfo.changedFiles} files
                  </span>
                </div>
              </div>

              {/* Frontend Files */}
              {frontendFiles.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Frontend files detected ({frontendFiles.length} of {prFiles.length})
                  </p>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {frontendFiles.map((f) => (
                      <div
                        key={f.filename}
                        className="flex items-center gap-2 rounded px-2 py-1 text-xs bg-background"
                      >
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate font-mono">{f.filename}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {f.status}
                        </Badge>
                        <span className="shrink-0 text-emerald-600">+{f.additions}</span>
                        <span className="shrink-0 text-red-500">-{f.deletions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : prFiles.length > 0 ? (
                <p className="text-xs text-amber-600">
                  No frontend files detected in this PR ({prFiles.length} files changed).
                  Try a PR with .tsx, .jsx, .html, .css, .vue, or .svelte changes.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 & 3: Screenshot + Options (shown after PR fetch) */}
      {prInfo && frontendFiles.length > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Step 2: Screenshot Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="h-4 w-4" />
                  Step 2 — UI Screenshot
                  <Badge variant="outline" className="text-[10px] font-normal">Recommended</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {screenshotPreview ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full rounded-lg border object-contain"
                      style={{ maxHeight: 240 }}
                    />
                    <button
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                      isDragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Drag & drop or click to upload
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      PNG, JPG, WebP
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Explanation */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground/80">
                    Why add a screenshot?
                  </p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Eye className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
                      <span>
                        <strong>Visual analysis</strong> — detects layout issues, color contrast problems, and spacing inconsistencies
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <GitCompareArrows className="mt-0.5 h-3 w-3 shrink-0 text-purple-500" />
                      <span>
                        <strong>Cross-modal</strong> — finds mismatches between what users see and what the code actually does
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Code className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                      <span>
                        <strong>Without screenshot</strong> — still works! Code-only analysis checks accessibility, semantics, and patterns
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Analysis Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 3 — Analysis Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Analysis Type
                  </label>
                  <Select value={analysisType} onValueChange={(v) => v && setAnalysisType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Analysis</SelectItem>
                      <SelectItem value="ui-only">UI Only</SelectItem>
                      <SelectItem value="code-only">Code Only</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Analysis Summary */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Review Summary</p>
                  <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium">{detectLanguage(frontendFiles).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Files to analyze</span>
                      <span className="font-medium">{frontendFiles.length} file{frontendFiles.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diff size</span>
                      <span className="font-medium">
                        <span className="text-emerald-600">+{frontendFiles.reduce((s, f) => s + f.additions, 0)}</span>
                        {' / '}
                        <span className="text-red-500">-{frontendFiles.reduce((s, f) => s + f.deletions, 0)}</span>
                        {' lines'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Screenshot</span>
                      <span className={`font-medium ${screenshotFile ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {screenshotFile ? 'Attached' : 'Not attached'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analysis mode</span>
                      <span className="font-medium">
                        {screenshotFile ? 'Code + Visual (Cross-Modal)' : 'Code-Only'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What AI checks */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">What the AI checks</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { label: 'WCAG contrast', active: true },
                      { label: 'Missing alt text', active: true },
                      { label: 'Semantic HTML', active: true },
                      { label: 'CSS anti-patterns', active: true },
                      { label: 'Visual regression', active: !!screenshotFile },
                      { label: 'Layout mismatch', active: !!screenshotFile },
                    ].map(({ label, active }) => (
                      <div
                        key={label}
                        className={`rounded-md border px-2 py-1.5 ${
                          active
                            ? 'border-primary/20 bg-primary/5 text-foreground'
                            : 'border-dashed text-muted-foreground/50'
                        }`}
                      >
                        {label}
                        {!active && (
                          <span className="ml-1 text-[10px]">(need screenshot)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Starting PR Analysis...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze PR with Nova 2 Lite
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
