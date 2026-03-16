# NovaLens - MVP Recommendation Report

> Stage 3 Output | mvp-scoper | 2026-03-16

---

## 1. Executive Summary

| Item | Value |
|------|-------|
| MVP Scope | 6 Must Features (4 AI Tools + Agent Orchestration + Web UI) |
| Timeline | **10 weeks** (2-5인 팀) |
| NSM | Cross-Modal Issues Detected per Analysis |
| Viability | 19/25 Recommended (Stage 2) |
| Key Risk | Nova 2 Lite 시각 분석 정확도 (Week 2 PoC에서 Go/No-Go) |
| Key Opportunity | 크로스모달 정합성 분석 = 직접 경쟁사 0인 블루오션 |

**MVP 판정 원칙**: 에이전트의 4단계 자율 추론(UI 분석 → 코드 분석 → 크로스모달 추론 → 리포트)이 **엔드투엔드로 동작하는 최소 범위**. 해커톤 데모에서 이 추론 과정이 실시간으로 가시적이어야 한다.

---

## 2. Core Value Proposition

> "프론트엔드 개발자가 코드 리뷰 시, Nova 2 Lite 멀티모달 에이전트가 **UI 스크린샷과 코드를 동시에 분석**하여 크로스모달 정합성 검사를 수행하고, **우선순위화된 이슈 + 수정 제안 코드**를 제공한다. 기존 도구가 코드만 OR UI만 분석하는 반면, NovaLens는 코드 AND UI를 교차 분석하는 **유일한 도구**."

---

## 3. Feature List (MoSCoW)

### Must (MVP 포함) - 6 Features

| # | Feature | Opp Score | Effort | Justification |
|---|---------|:---------:|:------:|---------------|
| 1 | UI Screenshot Analysis (Tool 1) | 6.4 | M | 에이전트 Step 1. 시각 분석 입력 데이터 생성 |
| 2 | Code Structure Analysis (Tool 2) | 4.2 | M | 에이전트 Step 2. 코드 측 분석 데이터 생성 |
| 3 | **Cross-Modal Consistency (Tool 3)** | **10.0** | L | **핵심 차별점**. 직접 경쟁사 0. Opp Score 만점 |
| 4 | Structured Report (Tool 4) | 7.2 | M | 수정 제안 코드 포함 리포트. 데모 인상도 |
| 5 | Bedrock Agent Orchestration | 9.0 | L | 해커톤 핵심: 자율적 도구 선택 추론 |
| 6 | Web UI Dashboard | 5.6 | M | 데모 필수. 에이전트 추론 과정 실시간 표시 |

> Must 합계: 6 features, Effort 합계: 2L + 4M, 추정 기간: 7-8주 (구현) + 2주 (통합/데모)

### Should (Phase 2)

| Feature | Opp Score | Target |
|---------|:---------:|--------|
| GitHub Actions CI Integration | 6.0 | MVP 직후 |
| WCAG Compliance Score Dashboard | 5.5 | 월 2-3 |
| Analysis History & Comparison | 4.0 | 월 3-4 |
| Batch Analysis | 3.5 | 월 4-6 |

### Could (Phase 3)

- VS Code Extension
- Figma Plugin Integration
- Custom Rule Configuration
- Team Workspace & Sharing

### Won't (Scope Out)

| Feature | Rationale |
|---------|-----------|
| Mobile App | 개발자 도구는 데스크톱 웹이 주요 사용 환경 |
| Self-hosted Enterprise | PMF 확인 후 검토 |
| Multi-language (Python, Java) | Frontend 코드에 집중 |
| Real-time Collaborative Review | 아키텍처 복잡도 과도 |
| Nova 2 Lite 외 모델 지원 | 해커톤에서 Bedrock 네이티브 필수 |

---

## 4. MVP Scope

### Architecture Overview

```
[Web UI]
  |
  v
[API Gateway] --> [Lambda: Agent Controller]
                       |
                       v
              [Bedrock Agent (Nova 2 Lite)]
              Autonomous Tool Selection:
                |-- Tool 1: UI Analysis
                |-- Tool 2: Code Analysis
                |-- Tool 3: Cross-Modal Reasoning
                |-- Tool 4: Report Generation
                       |
                       v
              [S3: Screenshots/Reports]
              [DynamoDB: Analysis History]
```

### Agent Reasoning Flow

```
Input: Screenshot + Code
  |
  v
Agent thinks: "I have both image and code. Let me analyze both."
  |
  +--> Tool 1: UI Analysis (image input)
  |      Result: layout issues, color contrast, spacing
  |
  +--> Tool 2: Code Analysis (text input)
  |      Result: semantic HTML, ARIA, CSS issues
  |
  v
Agent thinks: "Now I'll cross-reference the visual and code findings."
  |
  +--> Tool 3: Cross-Modal Reasoning
  |      Result: mismatches between UI and code
  |
  v
Agent thinks: "Let me compile everything into a prioritized report."
  |
  +--> Tool 4: Report Generation
         Result: prioritized issues + fix suggestions
```

---

## 5. Success Metrics (KPI)

| Category | Metric | Launch (1mo) | Growth (3-6mo) |
|----------|--------|:------------:|:--------------:|
| Activation | 첫 분석 완료율 | >= 80% | >= 90% |
| Engagement | **크로스모달 이슈 검출 수 (NSM)** | **>= 3** | **>= 5** |
| Engagement | 수정 제안 코드 적용률 | >= 30% | >= 50% |
| Retention | 7일 리텐션율 | >= 30% | >= 50% |
| NPS | Net Promoter Score | >= 30 | >= 50 |

### North Star Metric

> **Cross-Modal Issues Detected per Analysis**
>
> NovaLens만이 제공하는 유일한 가치 = 크로스모달 이슈 검출.
> 이 수치가 증가하면 사용자 가치 증가, 감소하면 핵심 가치 훼손.

---

## 6. Development Timeline (10 Weeks)

```
Week 1-2    [Architecture & Agent Setup]
            - AWS CDK 인프라, Bedrock Agent, Nova 2 Lite 연동
            - PoC: 샘플 이미지 시각 분석 정확도 검증
            * Go/No-Go Gate: 10개 샘플 중 7개 이상 정확 → Go

Week 3-5    [Core Tools Implementation]
            - Tool 1 (UI Analysis) + Tool 2 (Code Analysis)
            - Tool 3 (Cross-Modal Reasoning) — 가장 도전적
            - 프롬프트 엔지니어링 + 품질 튜닝

Week 6-7    [Report & Web UI]
            - Tool 4 (Report Generator)
            - Web UI 대시보드 (업로드 → 분석 → 결과)
            - 에이전트 추론 과정 실시간 스트리밍

Week 8-9    [Integration & Testing]
            - 전체 통합 테스트 (10개 시나리오)
            - 성능 최적화 (30초 이내)
            - 에지 케이스 처리

Week 10     [Demo & Polish]
            - 해커톤 데모 시나리오 + 인상적 케이스
            - 문서화 + 발표 자료
```

---

## 7. Risk Assessment

| Risk | Impact | Prob | Mitigation |
|------|:------:|:----:|------------|
| Nova 2 Lite 시각 분석 정확도 부족 | High | Med | Week 2 PoC Go/No-Go + Extended Thinking + 스코프 축소 대비 |
| 크로스모달 추론 오탐 과다 | High | Med | Confidence threshold + 프롬프트 최적화 + Few-shot 예시 |
| 10주 타임라인 초과 | Med | Med | 서버리스로 인프라 관리 최소화 + UI 최소 구현 |
| 기존 플레이어 크로스모달 진출 | Med | Low | First-Mover + 벤치마크 데이터 해자 |
| 해커톤 경쟁 제출물 | Med | Low | 에이전트 추론의 기술적 정교함으로 차별화 |

### Pre-Mortem: "10주 후 해커톤에서 기대 이하 평가"

| Failure Mode | Leading Indicator | Prevention |
|-------------|-------------------|------------|
| 시각 분석 부정확 → 데모 실패 | Week 2 PoC 70% 미만 | 분석 스코프 축소 (색상/대비 집중) |
| 에이전트가 항상 같은 순서로 Tool 호출 | Week 3 Tool 호출 패턴 동일 | 조건부 분기 프롬프트 + 다양한 입력 테스트 |
| 분석 30초 초과 → 데모 지루 | Week 5 통합 테스트 1분+ | Thinking intensity 조정 + 병렬 호출 + 스트리밍 |

---

## 8. Phase 2 Roadmap (Post-MVP)

| Priority | Feature | Target | Rationale |
|:--------:|---------|--------|-----------|
| 1 | GitHub Actions CI | MVP+1mo | Beachhead 핵심 요구 |
| 2 | WCAG Score Dashboard | MVP+2mo | 접근성 규제 대응 |
| 3 | Analysis History | MVP+3mo | 리텐션 향상 |
| 4 | VS Code Extension | MVP+4mo | 워크플로우 깊은 통합 |

---

## Assumption Register

| # | Assumption | Risk | Validation |
|---|-----------|:----:|------------|
| A1 | Nova 2 Lite가 UI 시각 분석을 정확히 수행 | Med | Week 2 PoC (10 samples, >= 70%) |
| A2 | 크로스모달 추론이 의미 있는 인사이트 생성 | **High** | Week 3-4 평가 (20 cases, FP < 30%) |
| A3 | Bedrock Agent의 자율적 Tool 선택이 안정적 | Med | Week 2-3 안정성 검증 |
| A4 | 월 $50 내 충분한 API 호출 가능 | Low | 비용 모델링 (~$0.05/분석, 1000회/월) |
| A5 | 개발자가 AI 분석 결과를 신뢰/적용 | Med | Beta 테스터 5명 NPS >= 40 |
