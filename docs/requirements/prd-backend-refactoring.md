# 제품 요구사항 정의서 (PRD): 백엔드 구조 리팩토링 및 AI 파이프라인 모듈화

## 1. 개요 (Overview)
현재 LogiVOC 시스템의 백엔드는 1차적으로 MVC 패턴을 도입하여 `models`, `schemas`, `crud`, `routers` 등으로 분리되었으나, 여전히 단일 파일로 구성된 복잡한 컴포넌트(`ai_pipeline.py`)와 루트 디렉토리에 혼재된 인프라/설정 파일들이 존재합니다. 본 문서는 시스템의 유지보수성과 확장성을 높이기 위한 **2차 백엔드 아키텍처 리팩토링**과 LangGraph 기반의 **AI 파이프라인 모듈화**에 대한 요구사항을 정의합니다.

## 2. 목표 (Goals)
- 단일 파일로 묶여 있는 `ai_pipeline.py`를 구조화된 패키지로 분리하여 모듈 간 결합도를 낮추고 테스트 용이성을 확보합니다.
- 기존 애플리케이션 루트에 혼재된 시스템 설정 및 인프라성 코드(`database.py`, `rate_limit.py`, 토큰 로직 등)를 분리하여 완전한 계층형(Layered) 아키텍처를 구축합니다.
- 향후 추가적인 AI 파이프라인(예: 다국어 번역 전문 에이전트, 메타데이터 추출 에이전트 등) 도입을 고려한 확장성 있는 디렉토리 구조를 확립합니다.

## 3. 세부 요구사항 (Requirements)

### 3.1 AI 파이프라인 모듈화 (`app/pipeline/` 패키지 신설)
현재 `app/ai_pipeline.py` 단일 파일 내에 정의된 상태(State), 노드(Node), 그래프(Graph) 컴포넌트들을 논리적 단위로 분할해야 합니다.

- **`app/pipeline/state.py`**:
  - `PipelineState` TypedDict 정의
  - 프롬프트 템플릿(Prompt Template)이나 LLM 구조화된 출력(Structured Output)을 위한 Pydantic 모델(`SummaryOutput`, `SelfCorrectOutput` 등) 분리
- **`app/pipeline/nodes.py`**:
  - 각 단계별 노드 함수 완전 분리 (`extract_text_node`, `apply_custom_prompt_node`, `increment_chunk_node`, `self_correct_node`, `save_as_draft_node`)
  - 각 노드 내부의 로직을 독립적으로 모킹(Mocking) 및 단위 테스트할 수 있도록 의존성 분리
- **`app/pipeline/edges.py`** (선택적 혹은 `graph.py`와 통합):
  - 조건부 라우팅을 위한 함수 분리 (`check_chunks`, `should_continue`)
- **`app/pipeline/graph.py`**:
  - 노드와 엣지를 임포트하여 조립하고 `StateGraph`를 컴파일하는 로직 구현
  - 외부(Celery 워커 등)에서 주입받아 사용할 수 있도록 컴파일된 `summarization_pipeline` 객체를 노출

### 3.2 백엔드 폴더 구조 2차 리팩토링 (Core/API 계층 고도화)
현재 `app/` 하위에 위치한 모듈들을 용도와 책임에 맞게 계층화합니다.

- **`app/core/` 패키지 신설 (핵심 설정 및 인프라)**:
  - `database.py` 이동
  - `rate_limit.py` 이동
  - `config.py` 신설: 하드코딩된 환경 변수(REDIS_URL, 비밀키 등)를 `pydantic-settings`의 `BaseSettings`로 일원화하여 타입 안정성 확보
  - `security.py` 신설: `routers/deps.py`나 `routers/auth.py`에 혼재된 비밀번호 해싱 및 JWT 토큰 생성 로직 통합
- **API 및 라우팅 계층 정비 (`app/api/`)**:
  - 향후 버전 관리와 엔드포인트 확장을 위해 `routers` 디렉토리를 `app/api/` 혹은 `app/api/routers/`로 개편
  - 라우터에 포함된 DB 세션 주입 등 공통 의존성(Dependency)들을 `app/api/dependencies.py` 등의 별도 구조로 명확히 분리
- **Celery Worker 구조 정비 (`app/worker/`)**:
  - `celery_worker.py`를 `app/worker/` 패키지로 이동시키고, Celery 앱 설정(`celery_app.py`)과 태스크 정의(`tasks.py`)를 분리하여 응집도 향상

### 3.3 기존 모듈(MVC) 재검토 및 무결성 점검
- **`models`, `schemas`, `crud`**:
  - 1차 리팩토링 시 분리된 컴포넌트들 간의 순환 참조(Circular Dependency) 가능성 점검 및 선제적 해결
  - `crud` 내부의 특정 비즈니스 로직(복잡한 데이터 가공 및 분기 처리)은 `app/services/` 계층으로 이동하여, `crud`는 순수한 데이터베이스 입출력 로직만 담당하도록 제한

## 4. 예상 디렉토리 구조 (Proposed Architecture)
```text
backend/app/
├── api/                   # API 엔드포인트 계층
│   ├── dependencies.py    # 공통 의존성 (Depends)
│   └── routers/           # 라우터 모듈 모음
├── core/                  # 애플리케이션 공통 인프라 및 설정
│   ├── config.py          # 환경변수 중앙 관리
│   ├── database.py
│   ├── security.py        # 인증, 해싱 등 보안 유틸
│   └── rate_limit.py
├── crud/                  # 데이터베이스 CRUD 오퍼레이션
├── models/                # SQLAlchemy ORM 모델
├── pipeline/              # AI 파이프라인 (LangGraph)
│   ├── __init__.py
│   ├── state.py
│   ├── nodes.py
│   ├── edges.py
│   └── graph.py
├── schemas/               # API 입출력 Pydantic 스키마
├── services/              # 핵심 비즈니스 로직 및 외부 서비스 연동
├── worker/                # Celery 비동기 작업
│   ├── celery_app.py      # Celery 초기화
│   └── tasks.py           # 백그라운드 태스크 (문서 처리 등)
└── main.py                # FastAPI 진입점 (설정 조립 및 앱 실행)
```

## 5. 기대 효과 (Expected Benefits)
- **관심사의 완벽한 분리(Separation of Concerns)**: 설정, 라우팅, DB 통신, 비즈니스 로직, AI 노드 처리가 명확히 분리되어 유지보수성이 극대화됩니다.
- **테스트 커버리지 향상 가능성**: 비대해진 단일 파일이 쪼개지면서, LangGraph의 개별 노드나 핵심 서비스 로직에 대해 고립된 유닛 테스트(Unit Test)를 작성하기 용이해집니다.
- **미래 지향적 확장성**: 새로운 AI 에이전트(예: 자동 분류 에이전트, 권한 검증 에이전트 등) 추가 시 기존 시스템을 크게 훼손하지 않고 `app/pipeline/` 하위에 새로운 패키지를 추가할 수 있습니다.

## 6. 다음 단계 (Next Steps)
- 본 문서를 바탕으로 `architect` 에이전트가 상세 아키텍처 스펙 및 마이그레이션 가이드를 작성합니다. (`Phase 2`)
- 이어서 `backend_dev` 및 `ai_dev` 에이전트가 협업하여 실제 리팩토링 및 코드 이관을 수행합니다. (`Phase 3`)
