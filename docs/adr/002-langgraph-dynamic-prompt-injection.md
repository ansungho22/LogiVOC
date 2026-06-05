# ADR 002: LangGraph 워크플로우 동적 프롬프트 주입 (Dynamic Prompt Injection) 전략

## 1. 개요 (Context)
Phase 1 `prd-workspace-enhancement.md` 요구사항에 따라, 사용자가 문서 업로드 및 데이터 등록 시 자신만의 '추출 및 정리 방식'을 지시할 수 있는 커스텀 프롬프트(Ad-hoc Custom Prompt) 입력 기능이 요구되었습니다. 기존 시스템은 카테고리에 지정된 고정 프롬프트(`categories.custom_prompt`)를 참조하였으나, 런타임에 동적으로 사용자 정의 프롬프트를 AI 파이프라인(LangGraph)에 주입해야 하는 설계적 과제가 발생했습니다.

## 2. 대안 (Alternatives)
1. **(대안 A) LangGraph 노드 설정(Config) 오버라이딩**: 런타임에 노드를 동적으로 생성하거나 설정을 변경하여 프롬프트를 적용. (복잡도 높음, 노드 재사용성 저하)
2. **(대안 B) Graph State를 통한 컨텍스트 전달**: LangGraph의 전역 상태 객체인 `GraphState`에 `user_custom_prompt` 필드를 추가하고, 입력값 존재 시 프롬프트 템플릿 렌더링 단계에서 해당 변수를 삽입. (추천)
3. **(대안 C) DB 임시 저장 후 노드 조회**: 업로드와 동시에 임시 DB 레코드에 프롬프트를 저장하고, 워커에서 DB를 다시 조회하여 반영. (불필요한 I/O 증가)

## 3. 결정 (Decision)
**대안 B (Graph State를 통한 컨텍스트 전달)** 구조를 채택합니다.
1. LangGraph의 핵심 데이터 구조체(TypedDict 기반 `GraphState`)에 `user_custom_prompt: Optional[str]` 항목을 추가합니다.
2. 프론트엔드에서 `/api/v1/files/upload` 요청 시 Payload 폼 데이터로 `custom_prompt` 문자열을 전달받아 Celery 태스크 인자로 넘깁니다.
3. 워커(Celery Worker)가 LangGraph 파이프라인을 기동할 때 초기 State 값으로 해당 프롬프트를 주입합니다.
4. 요약 및 추출 역할을 담당하는 AI 노드는 프롬프트 템플릿 구성 시, `user_custom_prompt` 값이 존재할 경우 System Message 하단 혹은 특정 Context 영역에 이를 명시적으로 덧붙여 LLM이 인지할 수 있도록(Prioritize) 지시합니다.

## 4. 영향 (Consequences)
- **장점 (Pros)**: 구조가 매우 직관적이며 기존 파이프라인이나 노드 흐름을 깨지 않고 유연하게 확장 가능합니다. 상태 객체 기반이므로 디버깅과 테스트(State 검증)가 용이합니다.
- **단점 (Cons)**: 프롬프트 템플릿을 관리하는 모든 관련 노드(Node) 코드에서 해당 변수(`user_custom_prompt`)를 조건부로 처리하는 프롬프트 체인 수정 작업이 수반되어야 합니다.
- **후속 조치**: 백엔드/AI 개발 에이전트(`backend_dev`, `ai_dev`)는 프롬프트 인젝션 방어(Prompt Injection Attack Mitigation)를 위해 사용자 입력 프롬프트 내에 시스템 지시를 무력화하는 악의적 명령어(예: "Ignore all previous instructions")가 있는지 전처리 검증하는 로직을 추가해야 합니다.
