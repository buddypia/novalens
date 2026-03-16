# NovaLens - Stack ADR (Architecture Decision Record)

> Stage 5 Output | stack-selector | 2026-03-16

## Status

**Proposed** (AWS Hackathon submission)

---

## Context

NovaLens는 UI 스크린샷과 코드를 멀티모달 AI 에이전트로 교차 분석하는 개발자 도구이다. AWS 해커톤/챌린지 컨텍스트에서 Nova 2 Lite (Bedrock)를 핵심 기술로 사용한다.

- Platform: Web SPA (Stage 4 결정)
- Budget: Low ($0-50/month)
- Timeline: 10 weeks
- Team: Small (2-5), Advanced maturity
- Core: Amazon Bedrock (Nova 2 Lite) + Bedrock Agent

---

## Architecture Drivers

### Functional Drivers
- UI 스크린샷 업로드 + Nova 2 Lite 멀티모달 분석
- 코드 입력 + 구조/접근성 분석
- 크로스모달 정합성 추론 (에이전트 자율 판단)
- 구조화된 리포트 + 수정 제안 코드 생성
- 에이전트 추론 과정 실시간 스트리밍

### Quality Attribute Drivers
| QA | Priority | Rationale |
|----|:--------:|-----------|
| Time to Market | **Critical** | 10주 해커톤 마감 |
| Cost | **Critical** | 월 $50 이내 |
| Usability | **High** | 해커톤 데모 인상도 |
| Maintainability | Medium | 심사관 코드 리뷰 |
| Performance | Medium | AI 추론 지연 허용 |
| Scalability | Low | 데모 수준 |

### Technical Constraints
- **AWS 서비스 필수** (해커톤 평가 기준)
- **Nova 2 Lite (Bedrock)** = 핵심 AI 모델 (변경 불가)
- **서버리스 아키텍처** (비용/관리 최소화)

### Business Constraints
- 월 $0-50 운영 예산
- 2-5인 소규모 팀
- 10주 개발 기간

---

## Integrated Stack Decision

```
+--[ Frontend ]----------------------------------+
|  React 19 + Vite 6 + TypeScript                |
|  Tailwind CSS 4 + shadcn/ui                    |
|  Zustand (State Management)                    |
+------------------------------------------------+
            |  REST API (HTTPS)
            v
+--[ API Layer ]----------------------------------+
|  Amazon API Gateway (REST)                      |
|  + Amazon Cognito Authorizer                    |
+------------------------------------------------+
            |
            v
+--[ Backend ]------------------------------------+
|  AWS Lambda (Node.js 22 + TypeScript)           |
|  +-- Agent Controller (orchestration)           |
|  +-- Analysis API (CRUD)                        |
+------------------------------------------------+
            |
            v
+--[ AI Layer ]-----------------------------------+
|  Amazon Bedrock                                 |
|  +-- Nova 2 Lite (Multimodal Foundation Model)  |
|  +-- Bedrock Agent (4 Tools, Autonomous)        |
|       +-- Tool 1: UI Analysis                   |
|       +-- Tool 2: Code Analysis                 |
|       +-- Tool 3: Cross-Modal Reasoning         |
|       +-- Tool 4: Report Generation             |
+------------------------------------------------+
            |
            v
+--[ Data Layer ]---------------------------------+
|  Amazon DynamoDB (Analysis History, Users)       |
|  Amazon S3 (Screenshots, Reports)               |
+------------------------------------------------+
            |
            v
+--[ Infrastructure ]-----------------------------+
|  AWS CDK v2 (TypeScript IaC)                    |
|  Amazon CloudFront (CDN)                        |
|  Amazon Cognito (Auth)                          |
|  GitHub Actions (CI/CD)                         |
|  Amazon CloudWatch (Monitoring)                 |
+------------------------------------------------+
```

---

## Stack Decision by Layer

### Frontend Framework

| Criterion | Weight | React+Vite | Vue3+Vite | Svelte5 |
|-----------|:------:|:----------:|:---------:|:-------:|
| DX | H | +++ | ++ | ++ |
| Performance | M | ++ | ++ | +++ |
| Ecosystem | H | +++ | ++ | + |
| Maintainability | H | +++ | ++ | ++ |
| Cost | M | +++ | +++ | +++ |
| Long-term | H | +++ | ++ | + |
| **Score** | | **85** | **72** | **65** |

**Decision**: React 19 + Vite 6 + TypeScript
**Rationale**: React = npm 주간 2500만+ DL의 압도적 업계 표준. shadcn/ui, Zustand 등 최고 수준의 에코시스템. TypeScript로 Lambda 백엔드와 타입 공유.

### UI Library

| Criterion | Tailwind+shadcn | MUI | Chakra UI |
|-----------|:---------------:|:---:|:---------:|
| Dev Speed | +++ | ++ | ++ |
| Bundle Size | +++ | + | ++ |
| Customization | +++ | ++ | ++ |
| **Score** | **88** | **68** | **62** |

**Decision**: Tailwind CSS 4 + shadcn/ui
**Rationale**: Utility-first로 가장 빠른 UI 구현. shadcn/ui는 복사-기반으로 번들 영향 0. 해커톤 데모에서 세련된 UI를 최소 시간으로.

### Backend

| Criterion | Lambda Node.js/TS | Lambda Python | Lambda Hono |
|-----------|:-----------------:|:-------------:|:-----------:|
| DX | +++ | ++ | ++ |
| AWS Integration | +++ | ++ | ++ |
| Cold Start | +++ | + | +++ |
| Type Safety | +++ | ++ | +++ |
| **Score** | **82** | **72** | **70** |

**Decision**: AWS Lambda (Node.js 22 LTS + TypeScript) + API Gateway
**Rationale**: 프론트와 동일 언어(TypeScript). AWS SDK v3 네이티브. Bedrock Agent Runtime SDK 완전 지원. Cold start 최소 (~100ms).

### Database

| Criterion | DynamoDB+S3 | Aurora Serverless | MongoDB Atlas |
|-----------|:-----------:|:-----------------:|:-------------:|
| Cost | +++ | + | ++ |
| AWS Native | +++ | +++ | + |
| Simplicity | +++ | ++ | ++ |
| Scalability | +++ | +++ | ++ |
| **Score** | **85** | **60** | **58** |

**Decision**: Amazon DynamoDB (on-demand) + Amazon S3
**Rationale**: DynamoDB on-demand = 0 traffic 시 $0. S3 Free Tier 5GB. NovaLens의 데이터 모델(분석 이력, 메타데이터)은 key-value 패턴에 완벽 적합. 관계형 DB는 이 규모에서 과잉.

### Auth

| Criterion | Cognito | Auth.js | No Auth |
|-----------|:-------:|:-------:|:-------:|
| AWS Native | +++ | - | N/A |
| Free Tier | +++ | +++ | +++ |
| SPA Support | ++ | - | +++ |
| **Score** | **80** | **45** | **40** |

**Decision**: Amazon Cognito (User Pools + Hosted UI)
**Rationale**: AWS 네이티브 (해커톤 필수). Free Tier 50K MAU. API Gateway Authorizer 직접 통합. Google/GitHub OAuth 지원.

---

## Sensitivity Points

| # | Point | Impact |
|---|-------|--------|
| S1 | Bedrock Agent의 응답 시간이 30초를 초과할 경우, SSE 스트리밍 없이는 UX가 심각하게 저하됨 | API Gateway → Lambda → Bedrock 체인에 SSE 스트리밍 필수 |
| S2 | DynamoDB의 단순 데이터 모델이 향후 복잡한 쿼리 요구 시 한계 | Post-MVP에서 Aurora 전환 가능성 열어둠 |
| S3 | Nova 2 Lite의 이미지 분석 정확도가 전체 서비스 품질을 결정 | Week 2 PoC에서 Go/No-Go |

## Tradeoff Points

| # | Tradeoff | Chosen Side | Cost |
|---|----------|-------------|------|
| T1 | SPA vs SSR | SPA (개발 속도) | SEO 불가 (불필요) |
| T2 | DynamoDB vs Aurora | DynamoDB (비용) | 복잡 쿼리 불가 |
| T3 | Cognito vs Custom Auth | Cognito (속도) | UI 커스터마이징 제한 |

## Risk Themes

| Theme | Sources | Mitigation |
|-------|---------|------------|
| AWS 종속 | 모든 레이어가 AWS 서비스 | 해커톤 컨텍스트에서는 의도적. Post-MVP 시 추상화 레이어 도입 가능. |
| TypeScript 단일 언어 | Frontend + Backend + CDK | 팀 스킬 통일의 장점이 다양성 부족의 단점보다 큼 |
| 서버리스 Cold Start | Lambda + DynamoDB | Node.js 22 Cold start ~100ms. Provisioned Concurrency는 비용상 미적용. |

---

## Consequences

### Positive
- 전체 스택이 TypeScript로 통일 → 팀 생산성 최대화
- 전체 AWS 서비스 → 해커톤 평가 기준 직결
- 서버리스 → 0 traffic 시 $0, 관리 부담 최소
- CDK IaC → 인프라 재현성 100%, 심사관 코드 리뷰 가능
- Free Tier 내 운영 → 예산 $50/월 충족

### Negative
- AWS 종속 (해커톤에서는 장점이나 장기적으로는 리스크)
- DynamoDB의 제한적 쿼리 패턴
- Cognito Hosted UI의 제한적 커스터마이징

### Risks
- Bedrock Agent 응답 시간이 데모 품질에 직결
- Nova 2 Lite의 시각 분석 정확도 미검증

---

## AWS Services Summary (Hackathon Evaluation)

| AWS Service | Role | Free Tier |
|-------------|------|-----------|
| **Amazon Bedrock** | Nova 2 Lite + Agent | 사용량 기반 |
| **AWS Lambda** | Backend API | 100만 req/월 무료 |
| **Amazon API Gateway** | REST API | 100만 호출/월 무료 |
| **Amazon S3** | Screenshot/Report Storage | 5GB 무료 |
| **Amazon CloudFront** | CDN (Frontend) | 1TB 무료 |
| **Amazon DynamoDB** | Analysis History | 25GB 무료 |
| **Amazon Cognito** | Authentication | 50K MAU 무료 |
| **AWS CDK** | Infrastructure as Code | 무료 |
| **Amazon CloudWatch** | Monitoring | 기본 무료 |
| **Total** | **9 AWS Services** | 대부분 Free Tier |
