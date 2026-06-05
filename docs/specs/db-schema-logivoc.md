# LogiVOC DB 스키마

## 1. 개요
LogiVOC 시스템의 데이터베이스 스키마 및 주요 테이블 구조를 정의합니다.
PostgreSQL을 사용하며, 벡터 검색을 위해 `pgvector` 확장을 활용합니다.

## 2. 주요 테이블

### 2.1 categories 테이블
온톨로지 분류 체계 (Service > Module > Architecture 3단계 계층 구조)를 저장합니다.
- `id` (PK)
- `name`: 카테고리 이름
- `level`: 계층 레벨 (예: Service, Module, Architecture)
- `parent_id`: 상위 카테고리 ID (FK)
- `custom_prompt`: AI 정보 추출 시 반영할 맞춤형 프롬프트 (예: "DB 트러블슈팅 시 인덱스 관련 항목 강조")

### 2.2 knowledge_wiki 테이블
AI 파이프라인을 거친 추출 지식 및 문서를 관리합니다.
- `id` (PK)
- `title`: 문서 요약 제목 (한국어)
- `content`: 요약 본문 (한국어)
- `category_id`: 참조하는 카테고리 ID (FK)
- `status`: 문서 상태 (`DRAFT` 또는 `PUBLISHED`)
- `embedding`: 문서 벡터 임베딩 데이터 (pgvector 타입)
- `created_at`: 생성 일시
- `updated_at`: 수정 일시

## 3. 인덱스 (Index)
- **Vector Index**: `knowledge_wiki` 테이블의 `embedding` 컬럼에 대해 코사인 유사도 기반 검색 성능 최적화를 위한 **HNSW (Hierarchical Navigable Small World)** 인덱스 적용.

## 4. 데이터베이스 마이그레이션 정책
- DB 모델 변경 시 반드시 **Alembic** 마이그레이션 스크립트를 작성해야 합니다.
- 스키마 초기화 및 배포 시 `CREATE EXTENSION IF NOT EXISTS vector;` 구문을 필수적으로 포함하여 `pgvector` 확장을 초기화해야 합니다.
