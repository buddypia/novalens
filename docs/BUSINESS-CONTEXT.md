# NovaLens - Business Context

> Stage 1 Output | business-analyzer | 2026-03-16

---

## 1. Business Overview

**NovaLens**는 UI 스크린샷과 구현 코드(HTML/CSS/React 등) 간의 시각적/구조적 갭을 Amazon Nova 2 Lite 멀티모달 에이전트로 자동 검출하는 **AI Visual Code Review Agent**이다.

인간의 코드 리뷰에서 놓치기 쉬운 "시각적 문제와 코드의 대응 관계"를 AI가 교차 검증하여, 접근성 위반(WCAG), UI-코드 불일치, UX 안티패턴을 구조화된 리포트로 제공한다.

### Core Architecture

```
User Input
  +-- UI Screenshot (Image)
  +-- Source Code (HTML/CSS/React etc.)
          |
          v
+-------------------------------+
|  Nova 2 Lite (Bedrock API)    |
|  Multimodal Agent             |
+-------------------------------+
|  Tool 1: UI Analysis          | <-- Image -> Layout/Color/Spacing issues
|  Tool 2: Code Analysis        | <-- Code -> Structure/Quality analysis
|  Tool 3: Consistency Check    | <-- UI x Code inconsistency reasoning
|  Tool 4: Report Generator     | <-- Prioritized report output
+-------------------------------+
          |
          v
  Structured Report
  +-- Accessibility Violations (WCAG)
  +-- UI/Code Inconsistencies
  +-- UX Best Practice Violations
  +-- Fix Suggestion Code
```

### Agent Reasoning Flow (Technical Core)

에이전트가 자율적으로 판단하여 도구를 선택/호출하는 설계:

| Step | 이름 | 설명 |
|------|------|------|
| 1 | UI Visual Analysis | 스크린샷을 Nova 2 Lite에 이미지 입력. 레이아웃, 색상 대비, 텍스트 크기, 요소 간격 시각 분석 |
| 2 | Code Structure Analysis | 코드를 텍스트 입력으로 해석. 시맨틱 HTML, ARIA 속성, CSS 문제, 반응형 대응 체크 |
| 3 | Consistency Reasoning | Step 1+2 결과를 통합하여 크로스모달 문제 추론 (핵심 기술 차별점) |
| 4 | Report Generation | 문제를 중요도별로 분류, 수정 코드 예시 포함 리포트 출력 |

---

## 2. Problem Statement

| # | 문제 | 현재 상태 | 영향 |
|---|------|-----------|------|
| P1 | 수동 코드 리뷰로 UI-코드 시각적 불일치를 체계적으로 발견할 수 없다 | 눈 검사 의존, 리뷰어 피로도에 따라 품질 변동 | 시각적 버그가 프로덕션에 배포 |
| P2 | WCAG 접근성 기준의 수동 검증이 비효율적이다 | 부분적 자동화(Lighthouse, Axe)는 코드만 분석 | 접근성 규제 위반 리스크 |
| P3 | 디자인-코드 간 갭이 프로덕션까지 전파된다 | 디자인 시안과 구현 비교가 수동/비체계적 | UX 품질 저하, 디자이너-개발자 마찰 |
| P4 | 기존 도구는 코드 OR UI를 개별 분석할 뿐, 교차 검증하지 않는다 | ESLint(코드만), Lighthouse(UI만), 크로스모달 도구 부재 | 크로스모달 불일치가 사각지대 |

---

## 3. Target Users

### Primary Persona: Frontend Developer

- **Demographics**: 25-40세, 3-10년 경험, React/Vue/Angular 사용
- **Context**: 5-20명 스타트업/중소기업, CI/CD 파이프라인 운영
- **Pain Points**:
  - UI-코드 정합성 체계적 검증 수단 부재
  - 접근성(WCAG) 수동 확인에 과도한 시간 소요
  - 디자인 시안과 실제 구현의 미묘한 차이 발견 곤란
  - 반응형 레이아웃 전체 해상도 검증 불가능
- **JTBD**:
  - PR 리뷰 시 UI-코드 정합성 확인 -> 시각적 버그 프로덕션 전 차단
  - 접근성 감사 시 WCAG 자동 검증 -> 규제 준수 비용 절감
  - 디자인 핸드오프 후 차이 자동 검출 -> 커뮤니케이션 비용 절감

### Secondary Personas

| Persona | Key Pain Point |
|---------|---------------|
| QA Engineer | 시각적 회귀 테스트 수동 수행의 비효율 |
| Design System Manager | 디자인 토큰과 구현 일치 추적 곤란 |
| Tech Lead / EM | 코드+UI 품질 동시 관리, 접근성 리스크 모니터링 |

---

## 4. Hypothesis

> "프론트엔드 개발자는 코드 리뷰 시 UI-코드 정합성을 체계적으로 검증하지 못해 시각적 버그가 프로덕션에 배포되고 있으며, Nova 2 Lite 멀티모달 에이전트가 자율적으로 UI 이미지와 코드를 교차 분석함으로써, 기존 도구 대비 3배 이상의 시각적 불일치를 사전에 검출할 수 있다."

### Validation KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| 분석 1회당 검출 이슈 수 | 5건 이상 | 자동 카운트 |
| False Positive Rate | 20% 이하 | 수동 검증 샘플링 |
| 분석 소요 시간 | 30초 이내 | 엔드투엔드 측정 |
| 사용자 만족도 NPS | 50 이상 | 설문 조사 |
| 에이전트 추론 단계별 정확도 | 각 80% 이상 | 벤치마크 데이터셋 |

---

## 5. Constraints

| Category | Value | Note |
|----------|-------|------|
| Budget | Low ($0-50/month) | AWS Free Tier + Bedrock 최소 비용 |
| Timeline | Month (1-3 months) | AWS Hackathon deadline 기준 |
| Team Size | Small (2-5) | |
| Tech Maturity | Advanced | AI Agent + Bedrock 통합 역량 |
| Platform Context | **AWS Hackathon/Challenge** | Nova 2 Lite + Bedrock Agent = 핵심 평가 기준 |
| Tech Preference | AWS Native (Bedrock, Lambda, S3, DynamoDB) | 해커톤 평가 기준 직결 |

---

## 6. Success Definition (Draft)

### Hackathon Success (Primary)

| Criteria | Target |
|----------|--------|
| Nova 2 Lite 멀티모달 에이전트의 기술적 정교함 | 4단계 추론 플로우가 명확히 동작 |
| 에이전트의 자율적 도구 선택/호출 | 입력에 따라 도구 조합이 달라지는 것이 가시적 |
| 실시간 데모 인상도 | 스크린샷 + 코드 입력 -> 30초 내 리포트 생성 |
| AWS 서비스 활용 폭 | Bedrock + 3개 이상 AWS 서비스 통합 |
| 코드 품질 / 아키텍처 | Clean Architecture, IaC(CDK), 테스트 포함 |

### Product Success (Secondary, Post-Hackathon)

| Criteria | Target |
|----------|--------|
| 베타 사용자 수 | 100명 (3개월 내) |
| 주간 활성 사용자 (WAU) | 30명 |
| 크로스모달 이슈 검출 정확도 | 80% 이상 |

---

## 7. AI Estimation Items

아래 항목은 사용자가 명시하지 않아 AI가 추정한 값이다. 후속 스테이지에서 이 추정을 기반으로 의사결정이 이루어진다.

| Field | Estimated Value | Confidence | Reasoning |
|-------|----------------|------------|-----------|
| Revenue Model | Freemium (개인 무료, 팀 유료) | Medium | DevTools 시장의 표준 수익 모델 |
| Tech Maturity | Advanced | High | 멀티모달 AI Agent + Bedrock 설계 역량 기반 판단 |
| Geographic Target | Global (영어 우선, 일본어 2차) | Medium | DevTools는 언어 비의존적, 입력이 일본어이므로 일본 초기 타겟 추정 |
| Deployment | AWS Serverless | High | AWS 해커톤 컨텍스트에서 필수 |

---

## PM Frameworks Applied

### Vision Statement

> "모든 프론트엔드 코드 리뷰에서 UI와 코드 간의 시각적 불일치를 AI가 자동으로 발견하여, 더 나은 사용자 경험과 접근성을 보장하는 세계를 만든다."

### Value Proposition (6-Part JTBD)

| Part | Content |
|------|---------|
| When | 프론트엔드 코드를 리뷰하거나 PR을 머지하기 전에 |
| I want to | UI 스크린샷과 구현 코드가 서로 일치하는지, 접근성 기준을 충족하는지 확인하고 싶다 |
| So I can | 시각적 문제가 프로덕션에 배포되기 전에 차단할 수 있다 |
| But today | 수동 눈 검사에 의존하거나, 코드만 분석하는 린터/정적분석 도구만 사용하여 시각적 불일치를 놓치고 있다 |
| Because | 인간은 코드와 UI를 동시에 체계적으로 교차 검증하기 어렵고, 기존 도구는 크로스모달 분석을 지원하지 않기 때문이다 |
| With NovaLens | AI 에이전트가 자율적으로 UI 이미지와 코드를 교차 분석하여 불일치, 접근성 위반, UX 안티패턴을 자동 검출하고 수정 코드까지 제안한다 |

### Lean Canvas

> See `business-context.json` > `business.lean_canvas` for structured data.

### Strategy Canvas

| Factor | ESLint/Prettier | Lighthouse | Axe DevTools | **NovaLens** |
|--------|:-:|:-:|:-:|:-:|
| Code Static Analysis | 9 | 3 | 2 | 5 |
| UI Visual Analysis | 0 | 5 | 3 | **8** |
| Cross-Modal Consistency | 0 | 1 | 0 | **9** |
| Accessibility Auto-Check | 2 | 7 | 9 | 7 |
| Fix Suggestion Code | 3 | 2 | 4 | **8** |
| CI/CD Integration | 9 | 6 | 5 | 7 |
| Ease of Setup | 8 | 7 | 6 | 7 |
| Cost (10=Free) | 10 | 10 | 7 | 8 |

**Differentiation**: 기존 도구가 코드 OR UI를 개별 분석하는 반면, NovaLens는 코드 AND UI를 동시에 분석하여 **크로스모달 불일치**를 발견하는 유일한 도구.

---

## NFR Profile (Stage 4-5 Input)

| Dimension | Level | Note |
|-----------|-------|------|
| Performance | Medium | AI 추론 지연(5-15초) 허용, 비동기 처리 가능 |
| Scalability | Low | 해커톤 데모 수준, 동시 10명 이하 |
| Security | Medium | 사용자 코드 처리 → 기본 보안 필수 |
| Cost | **Critical** | 월 $50 이내, API 호출 최적화 필수 |
| Availability | Low | 데모 수준, 99% SLA 불필요 |
| Maintainability | Medium | 심사관 코드 리뷰 대비 |
| Time to Market | **Critical** | 1-3개월 내 데모 가능 |
| Usability | **High** | 해커톤 데모 인상도 결정적 |
