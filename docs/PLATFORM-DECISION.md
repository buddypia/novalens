# NovaLens - Platform Decision Report

> Stage 4 Output | platform-selector | 2026-03-16

---

## 1. Executive Summary

| Item | Decision |
|------|----------|
| **Selected Platform** | **Web SPA** (React + Vite + Lambda API) |
| Category | Web |
| Score | **73/100** (1위) |
| Secondary | Web SSR (Next.js, 71/100) |
| Strategy | 단계적 멀티플랫폼 (Web → CLI → VS Code) |

---

## 2. Evaluation Matrix

### Scoring (1-5 per criterion, weighted)

| Criterion | Weight | Web SPA | Next.js SSR | Tauri Desktop |
|-----------|:------:|:-------:|:-----------:|:-------------:|
| Persona Fit | x3 | **5** | 5 | 4 |
| Feature Feasibility | x3 | **5** | 5 | 4 |
| Dev Cost | x2 | **5** | 4 | 3 |
| Timeline Fit | x2 | **5** | 4 | 2 |
| User Reach | x2 | **5** | 5 | 3 |
| Long-term Viability | x1 | 4 | **5** | 4 |
| Ecosystem Maturity | x1 | 4 | **5** | 3 |
| Scalability | x1 | **5** | 5 | 3 |
| **Weighted Total** | | **73** | **71** | **50** |

---

## 3. Detailed Analysis

### Option A: Web SPA (React + Vite + Lambda) - RECOMMENDED

**Rationale**: 가장 단순하고 빠른 AWS 네이티브 배포. S3 + CloudFront (static frontend) + Lambda + API Gateway (backend). 해커톤 데모에서 설치 없이 즉시 시연 가능.

| Pros | Cons |
|------|------|
| S3+CloudFront 배포 = 가장 단순 | SSR 미지원 (불필요) |
| 설치 불요, 브라우저만으로 사용 | 프론트/백 API 계약 관리 |
| 병렬 개발 가능 (FE/BE 분리) | |
| 월 $5-15 운영비 | |
| CDK로 IaC 완전 관리 | |

### Option B: Web SSR (Next.js on Amplify) - SECONDARY

**Rationale**: 업계 표준 프레임워크이나, SSR이 이 유스케이스에서는 불필요한 복잡도. Amplify 배포는 CDK 대비 유연성 감소.

| Pros | Cons |
|------|------|
| React 생태계 업계 표준 | SSR이 과잉 |
| API Routes 내장 | Amplify 종속 |
| 향후 확장에 유리 | Cold start 이슈 |

### Option C: Desktop (Tauri + React) - NOT RECOMMENDED

**Rationale**: 로컬 파일 접근은 매력적이나, 설치 필요로 해커톤 데모 즉시성 저하. AWS 서비스 활용 폭이 좁아져 평가 마이너스. 타임라인 +2-3주.

| Pros | Cons |
|------|------|
| 로컬 파일 직접 접근 | 설치 필요 → 데모 즉시성 저하 |
| 오프라인 가능 | AWS 서비스 활용 좁음 |
| Tauri 경량 (Rust) | 크로스 빌드 복잡도 |

---

## 4. Multi-Platform Roadmap

```
Phase 1 (Month 1-3): Web SPA
  - 해커톤 데모 + 초기 사용자 확보
  - AWS 네이티브 배포 (S3 + CloudFront + Lambda)

Phase 2 (Month 3-6): CLI Tool (npm package)
  - GitHub Actions CI 통합
  - 개발자 워크플로우 깊은 통합
  - Web UI는 결과 뷰어로 계속 사용

Phase 3 (Month 6-9): VS Code Extension
  - 에디터 내 실시간 분석
  - 개발 중 즉각적 피드백
```

---

## 5. Platform Requirements Check

| Requirement | Needed? | Web SPA Support |
|-------------|:-------:|:---------------:|
| Offline | No | N/A |
| Push Notification | No | N/A |
| Hardware API | No | N/A |
| App Store | No | N/A |
| SEO | No | N/A |
| Real-time Streaming | **Yes** | SSE / WebSocket |
| Heavy Computation | No (server-side) | Lambda |

---

## 6. Final Recommendation

**Web SPA (React + Vite + Lambda API)**를 추천한다.

**결정 근거**:
1. Primary Persona(Yuki)가 MacBook + 브라우저 환경에서 작업
2. 설치 불요 → 해커톤 데모 즉시 시연 가능
3. AWS 네이티브 배포(S3+CloudFront+Lambda+API Gateway)로 AWS 서비스 활용 폭 최대
4. 10주 타임라인에서 가장 빠른 개발 속도
5. 월 $5-15 운영비로 예산 제약($0-50/월) 충족
6. React 기반이므로 향후 Next.js/CLI/VS Code Extension 전환 비용 낮음
