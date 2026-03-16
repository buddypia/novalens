# NovaLens - Market Research Report

> Stage 2 Output | market-researcher | 2026-03-16

---

## 1. Executive Summary

NovaLens는 **크로스모달(UI+코드) 정합성 분석**이라는 미개척 니치에 진입하는 최초의 도구이다. AI Code Review ($750M), Accessibility Testing ($610-850M), Visual Regression Testing ($200M) 시장이 겹치는 교차점에 위치하며, 기존 도구 중 **UI 이미지와 코드를 동시에 분석하는 제품은 존재하지 않는다**.

| Metric | Value |
|--------|-------|
| TAM | $1.5B (AI Code Review + Accessibility Testing 통합) |
| SAM | $200M (Frontend CI/CD 팀, 크로스모달 니치) |
| SOM (3년) | $2M (SAM 1% 점유) |
| Viability Score | **19/25 (Recommended)** |
| Direct Competitors | **0** (블루오션) |
| Evidence Grade | B (T2: 8건, T3: 5건) |

**핵심 인사이트**: 기존 도구는 모두 "코드만 분석" 또는 "UI만 분석"하는 단일 모달. NovaLens의 "코드 AND UI 동시 분석"은 진정한 미충족 수요(unmet need)를 충족한다.

---

## 2. Market Size (TAM/SAM/SOM)

### TAM: $1.5B

| Segment | Size (2025) | CAGR | Source |
|---------|------------|------|--------|
| AI Code Review Tools | $750M | 9.2% | Market Report Analytics |
| Accessibility Testing Tools | $610-850M | 5.6-8.6% | Mordor Intelligence / Market Growth Reports |
| AI-enabled Testing (broader) | $1.01B | 18.3% | Fortune Business Insights |
| AI Code Tools (broadest) | $7.37B | 26.6% | Mordor Intelligence |

NovaLens TAM = AI Code Review + Accessibility Testing 교차 영역 (중복 조정) = **~$1.5B**

### SAM: $200M

- CI/CD를 운영하는 Frontend 중심 팀 (전체 기업의 63%가 자동 스캔 요구)
- 이 중 Frontend 비중 ~20%, 크로스모달 니즈 명확한 팀 ~33%
- TAM $1.5B x 13% = **~$200M**

### SOM: $2M (3년)

- 2-5인 팀, freemium 모델, AWS 해커톤 기반 초기 인지도
- 유사 DevTools 스타트업 초기 ARR 참고
- SAM $200M의 1% = **$2M**

---

## 3. Persona Definitions

### Primary: Yuki (Frontend Lead, 32)

| Attribute | Detail |
|-----------|--------|
| Role | Frontend Tech Lead, SaaS 회사 (50-200명) |
| Pain | PR 리뷰에서 UI 변경의 시각적 영향을 코드만 보고 판단해야 함 |
| Current | ESLint + Chromatic + Lighthouse CI + 수동 눈 검사 |
| Ideal | PR 생성 시 AI가 자동으로 UI-코드 정합성 + 접근성 검사 |
| WTP | $19-49/month per team |
| Trigger | EU EAA 접근성 규제 대응 의무 발생 시 |

### Secondary: Sarah (QA Accessibility Specialist, 28)

| Attribute | Detail |
|-----------|--------|
| Role | QA Accessibility Engineer, 중견기업 (200-1000명) |
| Pain | 자동 도구가 WCAG 위반의 30%만 감지 — 70%가 수동 |
| Current | Axe DevTools + WAVE + 수동 스크린리더 테스트 |
| Ideal | AI가 UI+코드를 교차 분석하여 70% 갭을 메움 |
| WTP | $49-99/month per seat |
| Trigger | EU EAA 시행 (2025.06) / ADA 소송 리스크 |

### Edge: Kenji (Indie Developer, 25)

| Attribute | Detail |
|-----------|--------|
| Role | Fullstack Developer, Solo/소규모 |
| Pain | 코드 리뷰어 없음, 접근성 전문 지식 부족 |
| Current | Lighthouse + ESLint 기본 |
| WTP | $0 (무료 티어 필수) |
| Value | 커뮤니티 확산, 사용 데이터 축적 |

---

## 4. Competitor / Alternative Analysis

### Competitive Positioning Map

```
                    Code Analysis Depth
                    High ──────────────── Low
                    │                      │
  Visual      High  │  [NovaLens]         │  Applitools
  Analysis          │                      │  Percy
  Depth             │                      │  Chromatic
                    │                      │
              Low   │  CodeRabbit          │  Lighthouse
                    │  SonarQube           │  (Manual)
                    │  Codacy              │
                    │                      │
```

### Competitor Comparison Matrix

| Feature | NovaLens | CodeRabbit | Applitools | Percy | Axe | Lighthouse |
|---------|:--------:|:----------:|:----------:|:-----:|:---:|:----------:|
| Code Static Analysis | ○ | ◎ | × | × | × | × |
| UI Visual Analysis | ◎ | × | ◎ | ◎ | × | △ |
| **Cross-Modal Consistency** | **◎** | **×** | **×** | **×** | **×** | **×** |
| WCAG Accessibility | ○ | △ | △ | × | ◎ | ○ |
| Fix Suggestion Code | ◎ | ◎ | × | × | △ | × |
| CI/CD Integration | ○ | ◎ | ○ | ○ | ○ | ○ |
| AI Agent Reasoning | ◎ | ◎ | ○ | ○ | × | × |
| Price (개인) | Free | Free | $99+/mo | Free | Free | Free |

> ◎ = 강점, ○ = 보통, △ = 약함, × = 미지원

**핵심 발견**: Cross-Modal Consistency 열에서 NovaLens만이 ◎. 이것이 최대 차별점이자 시장 진입 근거.

### Percy의 AI Visual Review Agent (2025) — 가장 가까운 위협

Percy가 2025년 출시한 AI Visual Review Agent는 시각적 차이를 AI로 분석하고 요약하지만:
- **코드를 분석하지 않음** — 두 스크린샷 간의 픽셀 차이만 분석
- **접근성 검사 없음** — WCAG 위반 감지 불가
- **원인 특정 불가** — "여기가 바뀌었다"는 말할 수 있지만 "왜 바뀌었는지, 어떤 코드가 원인인지"는 모름

NovaLens는 이 세 가지 갭을 모두 커버한다.

---

## 5. Differentiation

### Unique Value Proposition

> "UI 스크린샷과 코드를 AI 에이전트가 동시에 분석하여, 기존 도구로는 불가능한 **크로스모달 정합성 검사**를 수행하는 유일한 도구."

### Barriers to Entry

1. **멀티모달 에이전트 설계 복잡도**: UI 이미지 이해 + 코드 분석 + 크로스모달 추론의 3단계 파이프라인은 단순한 API 호출이 아닌 고도의 에이전트 설계 필요
2. **벤치마크 데이터 부재**: 크로스모달 UI-코드 정합성 벤치마크가 없어, 선점한 팀이 자체 벤치마크를 구축하며 데이터 해자 확보
3. **Bedrock Agent 전문성**: AWS Bedrock Agent의 도구 자율 선택 패턴은 일반적이지 않은 전문 역량

### Sustainable Advantages

1. 사용자가 늘수록 크로스모달 분석 벤치마크 데이터 축적 → 정확도 향상 (Data Network Effect)
2. AWS Bedrock 생태계 First-Mover (DevTool 카테고리)
3. 접근성 규제 강화 → 가치가 시간에 따라 증가하는 방어적 해자

---

## 6. Viability Score

| Axis | Score (1-5) | Rationale |
|------|:-----------:|-----------|
| Market Opportunity | **4** | AI DevTools CAGR 26.6%, 접근성 CAGR 8.6%, 크로스모달 니치 미개척 |
| Problem Severity | **3** | 접근성 규제 대상 = Painkiller, 일반 팀 = Vitamin |
| Differentiation | **5** | 직접 경쟁사 0. 크로스모달 분석은 NovaLens만 가능 |
| Technical Feasibility | **4** | Nova 2 Lite OCRBench/RealKIE 경쟁 모델 상회, Extended Thinking 지원. 공간 추론 한계가 유일 리스크 |
| Monetization | **3** | Freemium 검증 모델, 해커톤 우선 → 수익화는 중기 |
| **Total** | **19/25** | **Recommended (조건부 유망)** |

> 20+ = Strongly Recommended, **15-19 = Recommended**, 10-14 = Needs Review

---

## 7. User Projections

| Phase | Period | Users | Basis |
|-------|--------|-------|-------|
| Beta | 0-1개월 | 20-50 | 해커톤 + AWS 커뮤니티 얼리 어답터 |
| Launch | 1-3개월 | 100-300 | 해커톤 수상 인지도 + 기술 블로그 |
| Growth | 3-12개월 | 500-2,000 | AWS Marketplace + EU EAA 대응 니즈 |
| Maturity | 12개월+ | 2,000-10,000 | B2B 세일즈 + 엔터프라이즈 |

---

## 8. Risks and Opportunities

### Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 대형 플레이어(Anthropic/OpenAI/Google) 진입 | High | First-Mover 데이터 해자 + AWS 생태계 깊은 통합으로 차별화 유지 |
| Nova 2 Lite 성능 한계 (공간 추론) | Medium | Extended Thinking 활용 + UI 분석 결과의 후처리 로직으로 보완 |
| 새 카테고리 교육 비용 | Medium | 해커톤 데모 + 사례 연구로 가치 직관적 전달 |
| 무료 대안(Lighthouse+ESLint) 충분론 | Low-Medium | 크로스모달 분석의 차별적 가치를 구체적 예시로 증명 |

### Key Opportunities

| Opportunity | Timing | Action |
|-------------|--------|--------|
| EU EAA 시행 (2025.06) | Immediate | 접근성 규제 대응 마케팅 강화 |
| AI 코딩 도구 시장 폭발 (CAGR 26.6%) | Ongoing | 시장 성장 파도 탑승 |
| 기존 도구 WCAG 30% 감지 한계 | Ongoing | "70% 갭을 AI가 메운다" 메시징 |
| AWS 해커톤 수상 | 1-3개월 | 초기 신뢰도 + AWS 지원/프로모션 |

---

## 9. Recommended Actions

1. **Beachhead 집중**: CI/CD 운영 Frontend SaaS 팀 (5-50명) + 접근성 규제 대상 → 최초 100명 사용자 확보
2. **해커톤 데모 최적화**: 에이전트의 4단계 추론 과정이 실시간으로 가시적인 인상적 데모 구축
3. **크로스모달 벤치마크 구축**: UI-코드 불일치 + WCAG 위반 샘플 데이터셋 50+ 케이스 구축 (경쟁 진입 장벽)
4. **모델 리스크 헤징**: Nova 2 Lite 외 Claude/GPT-4V 백엔드 전환 가능한 추상화 레이어 설계
5. **접근성 규제 메시징**: "EU EAA / ADA 대응의 가장 효율적인 방법" 포지셔닝

---

## Sources

- [Market Report Analytics - AI Code Review Tool](https://www.marketreportanalytics.com/reports/ai-code-review-tool-73089)
- [Mordor Intelligence - AI Code Tools Market](https://www.mordorintelligence.com/industry-reports/artificial-intelligence-code-tools-market)
- [Mordor Intelligence - Accessibility Testing Market](https://www.mordorintelligence.com/industry-reports/accessibility-testing-market)
- [Fortune Business Insights - AI-enabled Testing Market](https://www.fortunebusinessinsights.com/ai-enabled-testing-market-108825)
- [AWS - Amazon Nova 2 Lite](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html)
- [AWS - Nova 2 Multimodal Understanding](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-multimodal-models.html)
- [Percy vs Chromatic Comparison](https://percy.io/blog/visual-regression-testing-tools/)
- [CodeRabbit](https://www.coderabbit.ai/)
- [Applitools Pricing](https://applitools.com/platform-pricing/)
