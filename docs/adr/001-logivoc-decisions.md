# LogiVOC 아키텍처 결정 기록 (Architecture Decision Records)

이 문서는 LogiVOC 시스템 개발 과정에서 발생한 주요 아키텍처 및 구현 결정 사항을 요약한 통합 ADR(Architecture Decision Record)입니다.

## 0001. Multi-Agent Harness SDLC 도입
* **결정 사항:** 에이전트 하네스 SDLC 워크플로우를 도입.
* **이유:** Phase 1 요구사항에 맞춰 자율 에이전트의 효과적인 개발, 검증(QA) 및 워크플로우 관리를 위해 도입.

## 0002. 보안 강화 및 E2E 테스트 통합 환경 구축
* **결정 사항:** 임시 파일 생성 시 Python 내장 `tempfile` 모듈 사용 의무화 및 프론트엔드 E2E 테스트 시 백엔드 통합 실행 환경 구축.
* **이유:** 하드코딩된 임시 경로(CWE-377) 취약점을 해결하고, 테스트의 신뢰성을 확보하기 위함.

## 0003. API 인증 Payload 스펙 통일 및 UI 테스트 커버리지 확대
* **결정 사항:** 프론트/백엔드 간 인증 API Payload 스펙을 `application/x-www-form-urlencoded` (OAuth2PasswordRequestForm)로 일치. 하네스 UI 컴포넌트 테스트 시 `data-testid` 적용.
* **이유:** 422 Unprocessable Entity 에러를 방지하고 프론트엔드 테스트의 정확도를 높이기 위함.

## 0004. 테스트 포트 충돌 방지
* **결정 사항:** 통합 테스트(E2E) 스크립트 실행 전 특정 포트(예: 8088, 5174)를 점유 중인 프로세스를 자동 종료(`kill -9`)하는 로직 의무화.
* **이유:** 서버 기동 시 포트 충돌로 인한 500 Internal Server Error를 방지하여 안정적인 테스트 환경을 보장하기 위함.

## 0005. 인프라 환경변수 무결성 및 DB 마이그레이션 전략
* **결정 사항:** DB 스키마 변경 시 Alembic 마이그레이션 필수화 및 내부 pgvector(`CREATE EXTENSION IF NOT EXISTS vector;`) 활성화 구문 삽입. `docker-compose.yml` 내 필수 환경변수(`JWT_SECRET_KEY`, `AZURE_DI_ENDPOINT` 등) 누락 방지 규정.
* **이유:** 서버 기동 크래시 및 DB 초기화 문제를 미연에 방지하여 인프라 무결성을 확보하기 위함.

## 0006. 비동기 E2E 테스트 시 프론트엔드 폴링 무한 대기 해결
* **결정 사항:** `CELERY_TASK_ALWAYS_EAGER=True` 환경에서 프론트엔드의 폴링 무한 대기(Timeout) 현상을 막기 위해 백엔드 Mocking 처리(최근 생성 DRAFT를 즉시 COMPLETED로 반환) 적용.
* **이유:** 비동기 통합 테스트 시 Celery AsyncResult 상태 조회가 불가능한 Eager 모드의 한계를 극복하고 원활한 E2E 검증을 지원하기 위함.
