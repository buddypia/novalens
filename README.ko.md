# NovaLens

**AI Visual Code Review Agent** — Amazon Bedrock 기반 UI 스크린샷과 소스 코드의 크로스모달 분석

[English](./README.md) | [한국어](./README.ko.md)

---

## NovaLens란?

NovaLens는 **UI 스크린샷**과 **프론트엔드 소스 코드**를 동시에 교차 분석하여 시각적-코드 불일치를 검출하는 AI 에이전트입니다. 기존 도구들이 코드 또는 UI를 개별적으로 검사하는 것과 달리, NovaLens는 두 모달리티를 연결하여 기존 도구가 놓치는 문제를 발견합니다.

**핵심 기능:**
- **UI 시각 분석** — 스크린샷에서 레이아웃, 색상 대비, 간격, 타이포그래피 문제 검출
- **코드 구조 분석** — 시맨틱 HTML, ARIA 속성, CSS 문제, 반응형 디자인 검사
- **크로스모달 추론** — 핵심 차별점: AI가 이미지와 코드를 교차 분석하여 불일치 발견
- **실행 가능한 리포트** — WCAG 위반 상세 내용과 수정 코드 제안이 포함된 우선순위별 이슈 리포트

## 아키텍처

```
┌─────────────────────────────────┐
│  React 19 SPA (Vite 6)         │
│  Tailwind CSS 4 + shadcn/ui    │
└──────────────┬──────────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────────┐
│  CloudFront CDN                  │
│  ├─ S3 Origin (정적 에셋)        │
│  └─ API Gateway Origin (/api/*) │
└──────────────┬───────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌──────────────────────┐
│ Lambda: API  │ │ Lambda: Agent Ctrl   │
│ CRUD 처리     │ │ Bedrock Agent + SSE  │
└──────┬───────┘ └──────────┬───────────┘
       │                    │
       ▼                    ▼
┌──────────────┐ ┌──────────────────────┐
│  DynamoDB    │ │  Amazon Bedrock      │
│  분석 이력 &  │ │  Nova 2 Lite Agent   │
│  사용자 데이터 │ │  ├─ UI 분석           │
└──────────────┘ │  ├─ 코드 분석         │
┌──────────────┐ │  ├─ 크로스모달 추론    │
│  S3          │ │  └─ 리포트 생성       │
│  스크린샷 &   │ └──────────────────────┘
│  리포트 저장   │
└──────────────┘
```

## 기술 스택

| 계층 | 기술 |
|------|------|
| 프론트엔드 | React 19 + Vite 6 + TypeScript |
| 스타일링 | Tailwind CSS 4 + shadcn/ui |
| 상태 관리 | Zustand |
| 백엔드 | AWS Lambda (Node.js 22) + API Gateway |
| 데이터베이스 | Amazon DynamoDB (on-demand) |
| 스토리지 | Amazon S3 |
| 인증 | Amazon Cognito |
| AI | Amazon Bedrock (Nova 2 Lite + Agent) |
| CDN | Amazon CloudFront |
| IaC | AWS CDK v2 (TypeScript) |
| CI/CD | GitHub Actions (OIDC) |
| 테스트 | Vitest + Playwright |

## AWS 서비스 (9개)

| # | 서비스 | 역할 |
|---|--------|------|
| 1 | Amazon Bedrock | Nova 2 Lite + Agent (AI 핵심) |
| 2 | AWS Lambda | 백엔드 API + Agent Controller |
| 3 | Amazon API Gateway | REST API + Cognito 인증 + Rate Limiting |
| 4 | Amazon S3 | 프론트엔드 호스팅 + 스크린샷/리포트 저장 |
| 5 | Amazon CloudFront | CDN |
| 6 | Amazon DynamoDB | 분석 이력, 사용자 데이터 |
| 7 | Amazon Cognito | 인증 (User Pool + OAuth) |
| 8 | AWS CDK v2 | Infrastructure as Code |
| 9 | Amazon CloudWatch | 로깅, 모니터링, 알람 |

## 시작하기

### 사전 요구 사항

- Node.js 22+
- AWS CLI 설정 완료
- AWS CDK v2 설치 (`npm i -g aws-cdk`)

### 설치

```bash
# 저장소 클론
git clone https://github.com/buddypia/novalens.git
cd novalens

# 의존성 설치
cd frontend && npm install
cd ../backend && npm install
cd ../infra && npm install
```

### 개발

```bash
# 프론트엔드 개발 서버 실행 (localhost:3001)
cd frontend && npm run dev

# 백엔드 Lambda 번들 빌드
cd backend && npm run build

# 타입 체크
cd frontend && npm run typecheck
cd backend && npm run typecheck
```

### 테스트

```bash
# 프론트엔드 단위 테스트
cd frontend && npm run test

# 프론트엔드 E2E 테스트
cd frontend && npm run test:e2e

# 백엔드 단위 테스트
cd backend && npm run test
```

### 배포

```bash
# CloudFormation 템플릿 합성
cd infra && npx cdk synth

# 변경 사항 미리보기
cd infra && npx cdk diff

# 배포
cd infra && npx cdk deploy
```

## 프로젝트 구조

```
novalens/
├── frontend/               # React 19 + Vite 6 SPA
│   ├── src/
│   │   ├── features/       # Feature-first 아키텍처
│   │   │   └── analysis/   # 핵심 분석 기능
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       ├── api/
│   │   │       └── types/
│   │   ├── shared/         # 공유 컴포넌트, 훅, 유틸
│   │   └── config/         # 앱 설정
│   └── tests/
├── backend/                # Lambda 핸들러
│   └── src/
│       ├── handlers/       # API Gateway Lambda 핸들러
│       ├── services/       # DynamoDB, S3, Bedrock 클라이언트
│       └── types/          # 공유 TypeScript 타입
├── infra/                  # CDK v2 인프라
│   ├── bin/                # CDK 앱 진입점
│   └── lib/                # 스택 정의
└── docs/                   # 문서
    └── features/           # 기능 명세 & 컨텍스트
```

## 동작 방식

1. **입력** — 사용자가 GitHub PR URL을 입력하거나 UI 스크린샷과 소스 코드를 업로드
2. **에이전트 오케스트레이션** — Bedrock Agent가 자율적으로 분석 도구를 선택하고 호출
3. **UI 분석** — Nova 2 Lite가 스크린샷을 처리하여 시각적 문제 검출
4. **코드 분석** — 소스 코드의 구조, 시맨틱, 접근성 분석
5. **크로스모달 추론** — 에이전트가 시각적 발견 사항과 코드 구조를 상관 분석하여 불일치 식별
6. **리포트** — 우선순위별 이슈, WCAG 참조, 수정 제안이 포함된 구조화된 리포트 출력

## 비용

| 단계 | 사용자 수 | 월 비용 |
|------|:---------:|:-------:|
| MVP | 100 | ~$12 |
| 출시 | 1,000 | ~$35 |
| 성장 | 10,000 | ~$150 |

> MVP는 월 ~$12로 운영되며, AWS Free Tier + 최소 Bedrock 사용량 범위 내입니다.

## 라이선스

MIT
