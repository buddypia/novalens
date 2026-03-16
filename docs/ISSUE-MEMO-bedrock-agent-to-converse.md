# Issue Memo: Bedrock Agent -> Converse API 전환 필요

## 날짜: 2026-03-17

---

## 문제 요약

Bedrock Agent가 tool을 **실행하지 않고 계획만 세움**. 결과적으로 구조화된 분석 결과(JSON)가 반환되지 않아 프론트엔드에 빈 결과가 표시됨.

---

## 현재 구현 (문제가 있는 코드)

### 핵심 파일: `backend/src/services/bedrock-agent.ts`

- **SDK**: `@aws-sdk/client-bedrock-agent-runtime` / `InvokeAgentCommand`
- **방식**: 사전 구성된 Bedrock Agent를 호출 (Agent ID: `JFZQEARAAA`, Alias: `PGZMUBKQDE`)
- **프롬프트**: `buildPrompt()`에서 텍스트로 JSON 형식을 요청 (line 116-121)
- **파싱**: `parseAgentResponse()`로 응답에서 JSON 추출 시도 (line 125-159)
- **Fallback**: `buildResultsFromTrace()`로 Agent trace의 tool output에서 결과 추출 시도 (line 242-307)

### 호출 흐름

```
analysis.ts (API Handler)
  -> Lambda async invoke (Event type)
    -> agent-controller.ts
      -> bedrock-agent.ts :: invokeAgent()
        -> BedrockAgentRuntimeClient.InvokeAgentCommand
```

### CDK 인프라: `infra/lib/novalens-stack.ts`

- `agentFunction` Lambda에 `bedrock:InvokeAgent`, `bedrock:InvokeModel` 권한 부여 (line 136-145)
- 환경변수: `BEDROCK_AGENT_ID`, `BEDROCK_AGENT_ALIAS_ID`, `BEDROCK_REGION`

---

## 근본 원인

1. **Nova 모델은 native structured output을 지원하지 않음** - `outputConfig.textFormat: "json"` 같은 옵션 없음
2. **Bedrock Agent의 orchestration이 불안정** - Agent가 tool 호출 계획은 세우지만 실제 실행하지 않는 경우 발생
3. **프롬프트 기반 JSON 요청은 신뢰할 수 없음** - Nova가 JSON 대신 자연어로 응답하거나 불완전한 JSON 반환

---

## 해결 방안: Converse API + Forced Tool Use

### 핵심 아이디어

Nova는 **Converse API의 Tool Use + `toolChoice` 강제 호출**을 지원함.
Tool의 input schema를 원하는 JSON 구조로 정의하면, Nova가 **반드시 해당 schema에 맞는 JSON을 생성**하여 tool call로 반환.

### 변경 대상

| 파일 | 변경 내용 |
|------|----------|
| `backend/src/services/bedrock-agent.ts` | `BedrockAgentRuntimeClient` -> `BedrockRuntimeClient` + `ConverseCommand` 전환 |
| `backend/src/handlers/agent-controller.ts` | import 변경만 (인터페이스 동일) |
| `infra/lib/novalens-stack.ts` | 환경변수에서 `BEDROCK_AGENT_ID`/`BEDROCK_AGENT_ALIAS_ID` 제거, `BEDROCK_MODEL_ID` 추가 |
| `backend/package.json` | `@aws-sdk/client-bedrock-agent-runtime` -> `@aws-sdk/client-bedrock-runtime` |

### 구현 개요 (Converse API)

```typescript
// AS-IS: Bedrock Agent
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

// TO-BE: Converse API
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const command = new ConverseCommand({
  modelId: 'amazon.nova-lite-v1:0',  // Nova 2 Lite
  messages: [{ role: 'user', content: [{ text: prompt }] }],
  toolConfig: {
    tools: [{
      toolSpec: {
        name: 'report_analysis_result',
        description: 'Report the code analysis result',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              uiIssues: { type: 'array', items: { /* Issue schema */ } },
              codeIssues: { type: 'array', items: { /* Issue schema */ } },
              // ...
              summary: { type: 'string' },
              score: { type: 'number' },
            },
            required: ['uiIssues', 'codeIssues', 'summary', 'score'],
          },
        },
      },
    }],
    toolChoice: { tool: { name: 'report_analysis_result' } },  // 강제 호출
  },
});
```

### 장점

1. **JSON 출력 보장**: `toolChoice`로 강제하면 Nova가 반드시 tool schema에 맞는 JSON 생성
2. **파싱 로직 대폭 단순화**: `parseAgentResponse()`, `buildResultsFromTrace()` 등 복잡한 fallback 불필요
3. **Bedrock Agent 의존성 제거**: Agent 생성/관리/alias 설정 불필요, 인프라 단순화
4. **비용 절감**: Agent 오케스트레이션 오버헤드 없음
5. **디버깅 용이**: 요청/응답이 단순한 API 호출로 추적 가능

---

## 삭제 가능한 코드 (전환 후)

- `parseAgentResponse()` - 자유 텍스트에서 JSON 추출 로직 (약 35줄)
- `buildResultsFromTrace()` - trace 기반 fallback (약 65줄)
- `resolveToolCategory()` - tool 이름 매핑 (약 25줄)
- `TOOL_CATEGORY_MAP` 상수

-> 총 약 **130줄 제거**, Converse API 호출 + tool response 파싱으로 **약 50줄 대체**

---

## 해커톤 제약사항 참고

- **Nova 모델만 사용 가능** (해커톤 규칙)
- Nova는 `outputConfig.textFormat` (structured output) 미지원
- Nova는 Converse API `toolChoice` 지원 확인됨
- Model ID: `amazon.nova-lite-v1:0` (us-east-1)
