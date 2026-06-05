# ADR 004: 백엔드 폴더 구조 리팩토링 및 모듈 분리

## 1. 개요 (Status)
- 상태: 제안됨 (Proposed)
- 작성일: 2026-06-04

## 2. 배경 (Context)
현재 `LogiVOC` 시스템의 백엔드(`backend/app/`)는 `models.py`, `schemas.py`, `crud.py` 등 단일 파일에 모든 도메인 로직이 집중되어 있습니다. 기능이 확장(예: 대시보드, 사용자 관리 등)됨에 따라 파일 크기가 비대해지고 유지보수 및 협업에 어려움이 발생하고 있습니다. Phase 1 PRD(`prd-workspace-fixes.md`)에서 제기된 문제점에 따라, 각 책임을 명확히 하고 향후 확장성을 확보할 수 있는 디렉터리 구조로의 리팩토링이 필요합니다.

## 3. 결정 (Decision)
백엔드 코드를 기능/계층별로 분리하기 위해 단일 파이썬 파일 구조에서 디렉터리 기반의 패키지 구조로 변경합니다.

- `app/models/`: SQLAlchemy 데이터베이스 모델 정의 (`user.py`, `wiki.py`, `category.py` 등)
- `app/schemas/`: Pydantic 스키마 정의 (요청/응답 모델) (`user.py`, `wiki.py`, `category.py` 등)
- `app/crud/`: 데이터베이스 CRUD 연산 로직 (`crud_user.py`, `crud_wiki.py`, `crud_category.py` 등)
- `app/routers/` (또는 `app/api/`): API 엔드포인트(라우터) 정의 (`users.py`, `wiki.py`, `stats.py` 등)

기존의 `models.py`, `schemas.py`, `crud.py`는 각 패키지 내부의 도메인별 파일로 분할하여 작성합니다.

## 4. 파급 효과 (Consequences)
- **긍정적 효과:**
  - 코드 가독성이 크게 향상되며 도메인별 응집도가 높아집니다.
  - 다수의 개발 에이전트(혹은 개발자)가 병렬로 작업할 때 충돌(Merge Conflict) 발생 빈도가 줄어듭니다.
  - 향후 신규 모듈(예: 결제, 알림 등) 추가 시 기존 구조를 방해하지 않고 손쉽게 확장할 수 있습니다.
- **부정적 효과 (고려사항):**
  - 기존의 단일 파일 구조에서 패키지 구조로 변경하면서, `import` 경로가 대대적으로 변경되므로 Import 에러를 방지하기 위한 꼼꼼한 의존성 체크 및 회귀 테스트(Regression Test)가 필수적입니다.
  - `Alembic` 마이그레이션 스크립트에서 변경된 모델 경로를 정확히 인지하도록 `env.py` 수정이 필요할 수 있습니다.
