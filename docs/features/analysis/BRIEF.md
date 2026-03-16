# Feature Brief: Core Analysis Dashboard

## Summary

NovaLens의 핵심 MVP 기능. 사용자가 UI 스크린샷과 코드를 입력하면, Bedrock Agent(Nova 2 Lite)가 4단계 자율 추론을 수행하여 크로스모달 정합성 리포트를 생성한다.

## User Story

> As a **frontend developer**,
> I want to **upload a UI screenshot and paste my code so that an AI agent analyzes both simultaneously**,
> So that I can **catch visual-code inconsistencies, accessibility violations, and UX anti-patterns before they reach production**.

## MVP Scope (Must)

### F1: Analysis Input Form
- Screenshot upload (drag & drop + file picker)
- Code input (textarea with syntax highlighting placeholder)
- Code language selector (HTML/CSS/React/Vue/Svelte)
- Analysis type selector (Full / UI Only / Code Only / Accessibility)
- "Analyze" button to submit

### F2: Agent Reasoning Trace (Real-time)
- SSE streaming으로 에이전트의 4단계 추론 과정 실시간 표시
- Step 1: UI Visual Analysis (진행중/완료 상태)
- Step 2: Code Structure Analysis
- Step 3: Cross-Modal Consistency Reasoning
- Step 4: Report Generation
- 각 단계의 소요 시간 표시

### F3: Analysis Report View
- Issue 목록 (severity별 분류: Critical/Major/Minor/Info)
- Issue 카테고리: UI Issues, Code Issues, Cross-Modal Issues, Accessibility Issues
- 각 이슈의 상세 설명 + 위치 + 수정 제안 코드
- 전체 점수 (0-100)
- Summary 텍스트

### F4: Analysis History
- 과거 분석 목록 (최신순)
- 각 분석의 상태/점수/이슈 수 요약
- 분석 상세 보기 네비게이션

## Out of Scope (Won't)
- GitHub Actions CI 통합
- VS Code Extension
- 팀 workspace
- 다국어 지원

## Technical Notes
- Frontend: React 19 + Vite 6 + Tailwind CSS 4 + shadcn/ui + Zustand
- Backend: AWS Lambda + API Gateway + DynamoDB + S3 + Bedrock Agent
- 에이전트 추론 스트리밍: Lambda Response Streaming 또는 Polling
- Bedrock Agent에 4개 Tool 정의 필요

## Success Criteria
- 스크린샷 + 코드 입력 -> 30초 내 리포트 생성
- 에이전트 추론 과정이 UI에서 실시간 가시적
- Cross-modal 이슈 3건 이상 검출 (per analysis)
- False Positive Rate 20% 이하

## Dependencies
- Amazon Bedrock Agent 설정 (Agent ID, Alias ID)
- Amazon Cognito 인증 (MVP에서는 anonymous 허용)
- S3 스크린샷 업로드 presigned URL
