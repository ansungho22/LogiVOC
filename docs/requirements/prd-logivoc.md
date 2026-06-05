# LogiVOC (OmniLog AI) Product Requirements Document (PRD)

## 1. 프로젝트 개요 (Project Overview)
**LogiVOC (OmniLog AI)**는 파편화된 IT 운영 지식(매뉴얼, 트러블슈팅 이력, RCA 로그 등)과 VOC(Voice of Customer) 데이터를 중앙 집중화하고 자연어 검색을 지원하는 AI 기반 IT 운영(ITO) 플랫폼입니다. Lean MVP 전략을 통해 초기 복잡도를 낮추고 점진적인 고도화를 거쳐 AIOps(자율 운영)로 나아가는 것을 목표로 합니다.

## 2. 핵심 기능 요구사항 (Core Functional Requirements)

### 2.1 문서 업로드 및 AI 파이프라인 (AI Document Pipeline)
*   **비동기 파일 처리**: 대용량 문서 업로드 시 Celery를 활용한 비동기 백그라운드 작업으로 처리하여 사용자 경험 저하를 방지합니다.
*   **Azure Document Intelligence 통합**: 문서를 파싱하여 구조화된 데이터(텍스트 및 테이블)를 추출합니다. 임시 파서를 우회하지 않고 실제 API 기반으로 파싱합니다.
*   **AI 기반 요약 및 구조화 (LangGraph 기반)**: 추출된 텍스트를 LLM을 통해 요약 및 메타데이터화 합니다.
*   **한국어 출력 강제 (Bug-5 정책)**: 원본 문서 언어와 무관하게 모든 분석 결과(요약, 제목 등)는 100% 한국어로 생성되도록 프롬프트를 강제합니다.
*   **장애 대응 폴백 정책**: API 장애나 네트워크 예외 발생 시 카테고리가 기본값으로 안전하게 동작하도록 Fallback 정책을 유지합니다.

### 2.2 대화형 검증 프로세스 (Interactive Verification)
*   **DRAFT (초안) 상태**: AI 파이프라인에서 추출된 지식은 자동 배포되지 않고 최초에 'DRAFT' 상태로 저장됩니다.
*   **승인 워크플로우**: 관리자(또는 운영자)는 추출된 내용을 검토 및 수정 후 `GO(승인)`를 통해 'PUBLISHED(발행)' 상태로 변경하거나, `STOP(반려/폐기)`를 통해 삭제할 수 있습니다.

### 2.3 실용적 온톨로지 (Practical Ontology) 카테고리 관리
*   **3단계 계층 구조**: 지식을 `Service > Module > Architecture`와 같은 트리 구조로 관리합니다.
*   **사용자 정의 프롬프트 (Custom Prompt)**: 각 카테고리별로 AI 정보 추출 시 반영할 맞춤형 프롬프트를 설정할 수 있습니다.

### 2.4 지식 검색 (Knowledge Search)
*   **벡터 검색 (Semantic Search)**: PostgreSQL의 `pgvector` 확장을 활용하여 문서 임베딩(Vector)에 대한 코사인 유사도 기반 자연어 검색을 지원합니다. (HNSW 인덱스 적용)
*   **통합 검색**: DRAFT 상태가 아닌 PUBLISHED 상태의 지식 위주로 검색 결과가 반환되어야 합니다.

### 2.5 사용자 및 권한 관리 (MVP Mocking)
*   **역할 분리**: `ADMIN`, `OPERATOR`, `VIEWER` 역할로 권한을 분리합니다.
*   **JWT 인증**: MVP 단계에서는 시스템 어드민 계정을 통한 Mock 로그인(JWT 발급)을 지원하며, 추후 실제 OAuth/SSO 통합을 대비합니다.

## 3. UI/UX 요구사항 (UI/UX Requirements)
프론트엔드는 React + Tailwind CSS 기반의 3-Tab 분리 구조로 제공됩니다.
*   **Workspace (작업 공간)**: 문서 업로드 및 AI가 추출한 DRAFT 지식을 검토, 수정, 승인(Go)/폐기(Stop) 하는 핵심 업무 화면입니다.
*   **Search/Dashboard (검색 및 대시보드)**: PUBLISHED 상태의 지식을 자연어로 검색하고 열람하는 화면입니다. 시스템 전체 지식 현황을 요약하여 보여줍니다.
*   **System Admin (시스템 관리)**: 온톨로지 카테고리(트리 구조)를 생성, 수정, 삭제하고 카테고리별 프롬프트를 설정하는 관리자 화면입니다.

## 4. 비기능 요구사항 (Non-Functional Requirements)
*   **시스템 아키텍처**: 
    - Frontend: React, Vite, TypeScript, TailwindCSS
    - Backend: FastAPI, SQLAlchemy, LangGraph, LangChain, Celery
    - DB: PostgreSQL (pgvector 확장 포함)
    - 인프라: Docker & Docker Compose
*   **성능 및 안정성**: 문서 파싱과 임베딩 추출은 메인 스레드를 블로킹하지 않도록 철저히 비동기 처리되어야 합니다.
*   **보안 필수 요건**: 보안 강화를 위해 시스템 내 모든 임시 파일 생성 시 하드코딩된 경로(`/tmp/` 등)를 절대 사용해서는 안 됩니다. 반드시 Python 내장 `tempfile` 모듈 등을 활용하여 안전한 임시 파일 및 경로를 할당해야 합니다 (CWE-377 방지).
*   **자동화 테스트 환경**: 프론트엔드 E2E 테스트(예: `run_test.sh`) 등 환경 구성 시 API 통신 오류를 방지하기 위해, 반드시 백엔드 서버가 로컬에 통합으로 실행된 상태에서 테스트가 진행되도록 구성되어야 합니다.
    - **포트 충돌 방지**: 자동화 테스트 환경 스크립트 실행 시, 백엔드 서버를 구동하기 전에 반드시 대상 포트(예: 8088)를 점유하고 있는 기존 프로세스를 찾아 안전하게 종료(Kill) 처리하여 환경 충돌을 미연에 방지해야 합니다.
    - **비동기 상태 정합성 보장(타임아웃 방지)**: 자동화 테스트 환경에서 비동기 워커(Celery Eager Mode 등)를 테스트할 때, 프론트엔드의 작업 상태 폴링 로직이 무한 대기(타임아웃)에 빠지지 않도록 해야 합니다. 테스트 환경 기동 시 백엔드 API에서 상태 조회를 즉시 SUCCESS/COMPLETED로 Mocking 하거나, 실제 Worker 환경을 함께 구성하여 E2E 테스트의 비동기 상태 정합성을 반드시 보장해야 합니다.
*   **API 연동 규격 일치**: 프론트엔드와 백엔드 간 인증(로그인) API 등 통신 시, Payload 스펙(`username`, `password` 등)을 사전에 정의된 규격대로 완전히 일치시켜 422 Unprocessable Entity 에러가 발생하지 않도록 강제합니다.
*   **하네스 UI 테스트 커버리지**: 신규로 추가된 하네스 워크플로우 로직 및 UI 검증(검증 모달, `GO`/`STOP` 버튼 등)을 위해, 프론트엔드 상에 `data-testid`를 명확히 부여하고 이를 검증하는 프론트엔드 E2E 기능 테스트 스크립트를 반드시 신규 작성해야 합니다.
*   **데이터베이스 동기화 및 마이그레이션**: DB 스키마(모델) 변경 시 반드시 데이터베이스 동기화를 위한 Alembic 마이그레이션 스크립트를 생성해야 합니다. 특히 `pgvector`와 같은 특수 타입을 사용할 경우, 마이그레이션 스크립트 내에 익스텐션 생성(`CREATE EXTENSION IF NOT EXISTS vector;`) 로직을 필수적으로 포함해야 합니다.
*   **인프라 환경변수 무결성**: 인증 및 백엔드 기동에 필수적인 설정(환경변수 `JWT_SECRET_KEY` 등)은 `docker-compose.yml` 등 모든 배포 및 실행 환경 구성 파일에 반드시 누락 없이 명시되어야 서버 크래시를 방지할 수 있습니다.

## 5. 개발 및 운영 방법론: 멀티 에이전트 하네스 (Multi-Agent Harness SDLC)
LogiVOC 시스템 개발 및 유지보수는 Anchor AI 멀티 에이전트 하네스의 5대 원칙과 Phase 워크플로우에 따라 진행됩니다.
*   **5.1 자율적 문서 주도 개발 (Zero-Touch & Document-Driven)**
    - 모든 설계와 개발은 철저히 마크다운(`docs/`) 문서 스펙에 기반하여 13명의 전문 AI 에이전트들(Subagents)을 통해 자율적으로 진행됩니다. 사용자의 직접 개입(Zero-Touch)이나 에이전트의 임의 코딩은 금지됩니다.
*   **5.2 단계별 위임 절차 (Phase 1 ~ Phase 6)**
    - 기획(RA) ➔ 설계(Architect, Designer) ➔ 기능 개발(Dev) ➔ 검증(QA, DevOps, Security) ➔ 사용자 인수 테스트(UAT) ➔ PM 승인의 6단계 엄격한 워크플로우를 준수합니다. 이전 단계의 문서/결과물 없이 다음 단계로 넘어갈 수 없습니다.
*   **5.3 품질 게이트 (Quality Gate) 및 훅(Hooks)**
    - 개발된 코드는 QA 에이전트에게 인계(Hand-over)되기 전, 반드시 `hooks/quality-gate.sh`와 `pre-phase.sh`, `post-task.sh` 등의 시스템 훅을 통해 린트/빌드 검증을 1차적으로 통과해야 합니다. 
*   **5.4 실시간 추적 및 검증 (Traceability & QA Delegation)**
    - 개발자가 스스로 품질을 승인할 수 없으며, 반드시 검증 전담 에이전트(devops, qa, security)가 `test`, `security_scan`, `validate_mermaid` 등의 전용 스킬(Skills)을 사용해 검증해야 합니다. 모든 작업 내역과 결함 보고는 `docs/blackboard.md`와 `docs/reports/`에 실시간으로 기록됩니다.

## 6. 향후 로드맵 (Future Roadmap - Phases 3+)
*   실제 Azure Document Intelligence 연동 및 문서 포맷 지원(PDF, Word 등) 확장
*   장애 로그 상관관계 분석 및 RCA(Root Cause Analysis) 리포팅 기능
*   지표 연동을 통한 이상 탐지 (Anomaly Detection) 및 ChatOps 자동 복구 워크플로우 지원
