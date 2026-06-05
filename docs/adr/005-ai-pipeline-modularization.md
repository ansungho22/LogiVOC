# ADR 005: AI 파이프라인(LangGraph) 모듈화 및 백엔드 2차 리팩토링

## 1. 컨텍스트 (Context)
현재 시스템(`LogiVOC`)의 백엔드는 1차 리팩토링을 통해 MVC 패턴을 도입하여 `models`, `schemas`, `crud`, `routers` 등으로 분리되었습니다. 그러나 `ai_pipeline.py`와 같은 단일 파일에 비대한 비즈니스 및 AI 처리 로직(상태 관리, 노드 정의, 엣지 라우팅, 그래프 컴파일)이 결합되어 있어, 유지보수성과 확장성에 한계가 있었습니다. 
또한 시스템 공통 인프라 설정 및 라우터 등의 코드가 `app/` 하위에 혼재되어 있어 전체적인 계층적 아키텍처의 응집도가 낮았습니다. 향후 다중 에이전트 파이프라인 도입과 테스트 용이성을 위해 이를 완전히 모듈화할 필요성이 대두되었습니다.

## 2. 결정 사항 (Decision)
1. **LangGraph 파이프라인 모듈화 (`app/pipeline/`)**
   - 단일 파일이었던 `ai_pipeline.py`를 `app/pipeline/` 패키지로 분리합니다.
   - 구성 요소 분리:
     - `state.py`: 파이프라인 상태(`PipelineState` 등) 및 LLM Structured Output용 Pydantic 모델 정의
     - `nodes.py`: 각 처리 단계별 독립적인 노드 함수 구현
     - `edges.py` / `graph.py`: 조건부 라우팅 함수 분리 및 StateGraph 조립, 컴파일 로직 구현
2. **백엔드 계층별 폴더 구조 2차 개편**
   - **`app/core/`**: 시스템 인프라 설정 (`config.py`, `database.py`, `security.py`, `rate_limit.py`) 통합
   - **`app/api/`**: API 및 라우팅 로직 통합 (`routers/`, `dependencies.py` 분리)
   - **`app/worker/`**: Celery 워커 설정(`celery_app.py`)과 태스크 정의(`tasks.py`) 분리
   - **`app/services/`**: 순수 데이터베이스 입출력 로직(`crud`)과 명확히 분리되는 핵심 비즈니스 로직(서비스 레이어) 도입

## 3. 결과 및 기대 효과 (Consequences)
- **응집도 향상 및 결합도 감소**: 각 모듈이 단일 책임을 갖게 되어 코드 복잡도가 크게 줄어듭니다.
- **테스트 용이성 (Testability)**: 개별 노드 함수 및 서비스 로직을 고립하여 유닛 테스트 및 모킹(Mocking)하기 쉬워집니다.
- **확장성 확보**: 새로운 AI 에이전트(예: 다국어 번역 에이전트, 분류 에이전트) 파이프라인을 추가할 때 기존 코드 수정 없이 `app/pipeline/` 하위에 모듈을 쉽게 확장할 수 있습니다.
- **순환 참조 방지**: `core` 및 `api` 계층을 명확히 함으로써, 기존에 발생할 수 있었던 순환 참조(Circular Dependency) 문제를 예방합니다.
