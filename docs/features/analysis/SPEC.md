# SPEC: GitHub PR-Based Analysis

## Overview

기존 코드 직접 입력 방식을 **GitHub PR URL 기반 분석**으로 전환한다.
사용자가 PR URL을 붙여넣으면 자동으로 diff를 가져와 분석하고, 선택적으로 UI 스크린샷을 업로드하여 크로스모달 분석을 수행한다.

## User Story

> As a **frontend developer**,
> I want to **paste a GitHub PR URL and have the AI automatically fetch and analyze my code changes**,
> So that I can **catch visual-code inconsistencies and accessibility violations in my PR before merging**.

## Modification Scope

### F1: Analysis Input Form (REPLACE)

**Before**: Code textarea + language selector + screenshot upload
**After**: PR URL input + auto-fetch + file preview + screenshot upload (optional)

#### UI Components

**0. How It Works 가이드** (PR 입력 전에만 노출)
   - 3개의 카드로 사용법을 한눈에 설명 (PR fetch 후 자동 숨김)
   - Step 1: Paste PR URL — 아이콘: GitPullRequest
   - Step 2: Add Screenshot — 아이콘: ImageIcon
   - Step 3: Get AI Review — 아이콘: Sparkles
   - 상단 타이틀: "AI-Powered Visual Code Review"
   - 서브텍스트: 기능 요약 한 줄 설명

**1. Step 1 — PR URL Input** (top card)
   - Text input: `https://github.com/owner/repo/pull/123`
   - "Fetch →" 버튼 (or Enter key)
   - "Try sample PR" 링크 (primary 색상)
   - 하단 안내: "Works with any public GitHub repository. We'll auto-detect .tsx, .jsx, .html, .css, .vue, and .svelte files."
   - PR fetch 후: "Change PR" 버튼으로 URL 재입력 가능
   - Error message area

**2. PR Info Card** (appears after fetch, Step 1 카드 내부)
   - PR title, state badge (open/closed/merged)
   - Author avatar + username
   - Branch info: `base ← head`
   - Stats: +additions / -deletions / files changed
   - Link to GitHub PR

**3. Frontend Files List** (inside PR Info)
   - Filtered list of frontend files (.tsx, .jsx, .html, .css, .vue, .svelte)
   - Each file: filename, status badge (added/modified/removed), +/- counts
   - Warning if no frontend files detected

**4. Step 2 — Screenshot Upload** (bottom-left card, Recommended badge)
   - Drag & drop + click to upload (PNG, JPG, WebP)
   - Preview with remove button
   - **"Why add a screenshot?" 설명 박스**:
     - Visual analysis (Eye icon, blue) — 레이아웃, 색상 대비, 간격 문제 감지
     - Cross-modal (GitCompareArrows icon, purple) — 사용자가 보는 것과 코드의 불일치 발견
     - Without screenshot (Code icon, amber) — 스크린샷 없이도 코드 분석 가능함을 안내

**5. Step 3 — Analysis Options** (bottom-right card)
   - Analysis type selector (Full/UI Only/Code Only/Accessibility)
   - **Review Summary 테이블**:
     - Language (auto-detected)
     - Files to analyze (count)
     - Diff size (+N / -N lines, 색상 구분)
     - Screenshot (Attached / Not attached, 색상 구분)
     - Analysis mode (Code + Visual (Cross-Modal) / Code-Only, 스크린샷 유무에 따라 동적)
   - **"What the AI checks" 그리드** (2x3):
     - 항상 활성: WCAG contrast, Missing alt text, Semantic HTML, CSS anti-patterns
     - 스크린샷 필요: Visual regression, Layout mismatch (비활성 시 "(need screenshot)" 표시)

**6. Submit Button**
   - "Analyze PR with Nova 2 Lite"

#### Interaction Flow

```
[How It Works 가이드 노출]
     ↓
Step 1: URL Input → Fetch → Show PR Info + Files
     ↓ (가이드 자동 숨김)
Step 2: Upload Screenshot (recommended, not required)
Step 3: Select Analysis Options → Review Summary 확인
     ↓
Submit → Agent Reasoning Trace + Report
```

### F2: Agent Reasoning Trace (NO CHANGE)

기존 4단계 추론 과정 실시간 표시 유지.

### F3: Analysis Report View (NO CHANGE)

기존 카테고리별 이슈 리포트 유지. 단, PR diff 컨텍스트에서의 이슈 표시.

### F4: Analysis History (NO CHANGE)

기존 히스토리 유지.

## API Changes

### Frontend → GitHub API (Direct)

- `GET /repos/{owner}/{repo}/pulls/{number}` - PR metadata
- `GET /repos/{owner}/{repo}/pulls/{number}/files` - Changed files + patches

### Frontend → Backend

**POST /api/analyses** (updated schema):
```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "prTitle": "Fix button styles",
  "diff": "unified diff content...",
  "files": [{ "filename": "...", "status": "modified", "patch": "..." }],
  "codeLanguage": "react",
  "analysisType": "full",
  "screenshotBase64": "optional"
}
```

### Backend → Bedrock

Updated prompt: diff-focused analysis instead of full code analysis.

## Type Changes

### Frontend types/index.ts

- Add `PRInfo`, `PRFile` to existing types
- Update `AnalysisRequest` to accept PR data instead of raw code

### Backend types/analysis.ts

- Update `AnalysisRequestSchema` to accept `prUrl`, `prTitle`, `diff`, `files`

## Technical Notes

- GitHub API: Public repos only, no auth needed (60 req/hr per IP)
- GitHub API supports CORS → frontend calls directly
- Frontend files filter: `.tsx`, `.jsx`, `.ts`, `.js`, `.html`, `.css`, `.scss`, `.vue`, `.svelte`
- Diff size limit: truncate at 8000 chars to fit Bedrock context
- Demo mode: mock GitHub fetch with simulated data
