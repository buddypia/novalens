# NovaLens - Infrastructure Design Report

> Stage 6 Output | infra-designer | 2026-03-16

---

## 1. Executive Summary

| Item | Decision |
|------|----------|
| Provider | **AWS (9 Services)** |
| Architecture | **Serverless** |
| IaC | **AWS CDK v2 (TypeScript)** |
| CI/CD | **GitHub Actions** |
| MVP Monthly Cost | **~$12/month** (Budget $50 = 76% 여유) |
| Scaling to 10K users | **~$150/month** |

---

## 2. Architecture Diagram

```
+--[ Client Browser ]------------------------------+
|  React 19 + Vite (Static SPA)                    |
+--------------------------------------------------+
         |  HTTPS
         v
+--[ Amazon CloudFront (CDN) ]---------------------+
|  S3 Origin (Frontend Static)                      |
|  + API Gateway Origin (/api/*)                    |
+--------------------------------------------------+
         |
         v
+--[ Amazon API Gateway ]---------------------------+
|  REST API                                         |
|  + Cognito Authorizer                             |
|  + Rate Limiting (100 req/sec/IP)                 |
+--------------------------------------------------+
         |
    +----+----+
    |         |
    v         v
+--[ Lambda: API ]--+  +--[ Lambda: Agent Controller ]--+
|  CRUD Operations  |  |  Bedrock Agent Invocation       |
|  - Analysis CRUD  |  |  - SSE Streaming Response       |
|  - User Profile   |  |  - Tool Orchestration           |
+-------------------+  +--------------------------------+
    |                            |
    v                            v
+--[ DynamoDB ]-+  +--[ Amazon Bedrock ]------------------+
|  Analysis     |  |  Nova 2 Lite (Multimodal)             |
|  History      |  |  + Bedrock Agent                      |
|  User Data    |  |    +-- Tool 1: UI Analysis            |
+---------------+  |    +-- Tool 2: Code Analysis          |
                   |    +-- Tool 3: Cross-Modal Reasoning  |
+--[ S3 ]---------+    +-- Tool 4: Report Generation      |
|  Screenshots  |  +--------------------------------------+
|  Reports      |
+---------------+

+--[ Amazon Cognito ]------+  +--[ CloudWatch ]----------+
|  User Pool + Hosted UI   |  |  Logs, Metrics, Alarms   |
|  Google/GitHub OAuth     |  +---------------------------+
+--------------------------+

+--[ AWS CDK v2 ]----------+  +--[ GitHub Actions ]------+
|  All Infrastructure      |  |  CI/CD Pipeline          |
|  as TypeScript Code      |  +---------------------------+
+--------------------------+
```

---

## 3. Cost Estimation (4 Phases)

| Phase | Users | Analyses/mo | Monthly Cost | Within Budget? |
|-------|:-----:|:-----------:|:------------:|:--------------:|
| **MVP** | 100 | 500 | **$12** | YES ($50) |
| Launch | 1,000 | 5,000 | **$35** | YES ($50) |
| Growth | 10,000 | 50,000 | **$150** | Needs upgrade |
| Scale | 100,000 | 500,000 | **$800** | Enterprise tier |

### MVP Cost Breakdown ($12/month)

| Service | Cost | Note |
|---------|-----:|------|
| Bedrock (Nova 2 Lite) | $5.00 | ~$0.01/analysis x 500 |
| Route 53 (Domain) | $5.00 | Optional |
| S3 (Storage excess) | $1.00 | Beyond 5GB Free Tier |
| CloudWatch | $1.00 | Custom metrics |
| Lambda | $0.00 | Free Tier |
| API Gateway | $0.00 | Free Tier |
| DynamoDB | $0.00 | Free Tier |
| CloudFront | $0.00 | Free Tier |
| Cognito | $0.00 | Free Tier |
| **Total** | **$12** | **76% under budget** |

### Bedrock API Cost Model

```
Per Analysis (~4 Agent Tool Calls):
  Input:  ~3K tokens (code+prompt) x 4 calls = 12K tokens
  Image:  1 screenshot = $0.00012
  Output: ~2K tokens x 4 calls = 8K tokens

  Cost = (12K x $0.06/1M) + $0.00012 + (8K x $0.24/1M)
       = $0.00072 + $0.00012 + $0.00192
       = ~$0.003 per analysis (agent calls only)

  + Extended Thinking overhead: ~$0.007

  Total: ~$0.01 per analysis
```

---

## 4. CI/CD Pipeline

```
[Push to GitHub]
    |
    v
[Lint + TypeCheck + Unit Test] -----> FAIL → Block merge
    |
    v (PASS)
[Build: Frontend (Vite) + Backend (esbuild)]
    |
    v
[CDK Diff: Show infrastructure changes]
    |
    v
[Deploy to Staging (CDK deploy --stage staging)]
    |
    v
[E2E Test (Playwright on staging)]
    |
    v (PASS)
[Manual Approval] -----> (production only)
    |
    v
[Deploy to Production (CDK deploy --stage production)]
    |
    v
[Health Check: Lambda invoke + CloudFront ping]
    |
    v (FAIL?)
[Auto Rollback (CDK deploy --rollback)]
```

### GitHub Actions Configuration

```yaml
# Environments
- staging:  auto-deploy on push to develop
- production: manual approval required (main branch)

# Secrets (OIDC, no static keys)
- AWS_ROLE_ARN: via GitHub OIDC Federation
- No AWS_ACCESS_KEY_ID needed

# Caching
- Node modules (npm ci)
- CDK Cloud Assembly
- Vite build cache
```

---

## 5. Security Design

| Area | Implementation |
|------|----------------|
| HTTPS | CloudFront 기본 (ACM 인증서 무료) |
| Auth | Cognito User Pool + API Gateway Authorizer |
| IAM | 최소 권한 원칙 — 각 Lambda에 필요한 권한만 |
| CORS | CloudFront 도메인만 허용 |
| Rate Limiting | API Gateway: 100 req/sec/IP (burst 200) |
| Secrets | IAM Role 기반 (정적 키 없음). GitHub OIDC Federation |
| Encryption | S3: SSE-S3, DynamoDB: AWS managed, Transit: TLS 1.3 |
| Dependency | Dependabot + npm audit (자동) |
| CSP | Content-Security-Policy 헤더 (CloudFront Response Headers) |

---

## 6. Scaling Strategy

| Trigger | Action | Cost Impact |
|---------|--------|-------------|
| Lambda concurrent > 100 | 자동 스케일 (기본 1000) | 미미 |
| DynamoDB RCU/WCU burst | On-demand 자동 조정 | $0.25/100만 RWU |
| Bedrock 동시 세션 > 5 | Provisioned Throughput 적용 | ~$50/월 추가 |
| S3 storage > 5GB | Standard tier 과금 | $0.023/GB |
| 사용자 > 1,000 | 비용 모니터링 알람 설정 | - |

**병목점**: Bedrock Agent 추론 시간 (5-30초). 대규모 동시 분석 시 Bedrock 동시 세션 한도가 병목.
**완화**: SSE 스트리밍으로 체감 대기 시간 완화 + 분석 큐(SQS) 도입으로 비동기 처리.

---

## 7. Free Tier Limits & Alerts

| Service | Free Tier Limit | Alert Threshold |
|---------|----------------|-----------------|
| Lambda | 100만 req/월 | 800K req (80%) |
| API Gateway | 100만 calls/월 | 800K calls |
| DynamoDB | 25GB, 200만 RWU | 20GB, 160만 RWU |
| S3 | 5GB, 20K GET | 4GB, 16K GET |
| CloudFront | 1TB/월 | 800GB |
| Cognito | 50K MAU | 40K MAU |

---

## 8. Vendor Lock-in Assessment

| Service | Risk | Mitigation |
|---------|:----:|------------|
| Bedrock (Nova 2 Lite) | **High** | 의도적 (해커톤). Post-MVP: AI 모델 추상화 레이어 도입 |
| DynamoDB | High | DocumentClient 추상화. Post-MVP: PostgreSQL 전환 가능 |
| Lambda | Medium | 표준 Node.js. Container 전환 용이 |
| Cognito | Medium | OAuth 2.0 표준. Auth0/Clerk 전환 가능 |
| S3 | Low | S3 API = 업계 표준 (MinIO, Cloudflare R2 호환) |
| CDK | Medium | CloudFormation 출력 → Terraform 전환 가능 |

> **해커톤 컨텍스트에서 AWS Lock-in은 장점** (평가 기준 직결). Post-MVP에서 필요 시 추상화 레이어 도입.
