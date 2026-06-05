# DB 스키마 변경 사항: 워크스페이스 고도화 및 관리자 기능 확장

## 1. 개요
본 문서는 `prd-workspace-enhancement.md`에 정의된 요구사항(사용자 정의 카테고리 동적 추가, 커스텀 프롬프트 저장 및 이력 관리, 시스템 관리자 전체 데이터 조회 등)을 지원하기 위한 데이터베이스 스키마 변경 및 신규 테이블 설계를 정의합니다.

## 2. 기존 테이블 변경 (Alter Tables)

### 2.1 `categories` 테이블
사용자가 데이터 등록 시 직접 신규 카테고리를 추가할 수 있도록 메타데이터 속성을 추가합니다.
- **추가 컬럼:**
  - `is_custom` (Boolean, Default: `false`): 사용자 정의 카테고리 여부. 관리자가 등록한 온톨로지(false)와 사용자가 동적으로 추가한 카테고리(true)를 구분합니다.
  - `author_id` (UUID, Nullable, FK `users.id`): 커스텀 카테고리를 생성한 사용자의 ID.

### 2.2 `knowledge_wiki` 테이블
데이터 등록 탭 분리 및 커스텀 프롬프트 주입 기능에 따라, 데이터 생성 시점의 문맥과 원본 소스에 대한 추적성을 강화합니다.
- **추가 컬럼:**
  - `source_file_name` (String, Nullable): 사용자가 업로드한 원본 파일의 이름 (데이터 등록 화면에서 원본 문서 뷰어와 매핑).
  - `custom_prompt_used` (String, Nullable): 해당 지식(Wiki) 생성(AI 파이프라인 실행)에 실제로 사용/주입된 커스텀 프롬프트 내용. 이력 보존 및 디버깅 목적.

## 3. 신규 테이블 (New Tables)

### 3.1 `prompt_templates` 테이블
사용자가 입력한 '추출 및 정리 방식'(커스텀 프롬프트)을 저장하고 향후 재사용할 수 있도록 관리합니다.
- **컬럼 정의:**
  - `id` (UUID, PK, Default: `uuid.uuid4`)
  - `author_id` (UUID, FK `users.id`, Index): 프롬프트를 생성 및 저장한 사용자 ID
  - `title` (String): 프롬프트 템플릿의 제목 (예: "장애 발생 보고서 요약용")
  - `content` (String): 프롬프트 본문 내용 (LangGraph 컨텍스트로 주입될 지시사항)
  - `is_public` (Boolean, Default: `false`): 다른 사용자와 공유할 수 있는 공용 템플릿인지 여부
  - `created_at` (DateTime, Default: `now()`)
  - `updated_at` (DateTime, OnUpdate: `now()`)

## 4. 관계 및 제약 사항 (Relations & Constraints)
- `categories.author_id`는 `users` 테이블을 참조하며, 사용자가 삭제될 경우 `SET NULL` 또는 `CASCADE` 정책을 적용합니다. (공용 카테고리로 남길 경우 `SET NULL` 권장)
- `prompt_templates.author_id`는 `users` 테이블을 참조하며, `CASCADE` 정책을 적용하여 사용자 삭제 시 프롬프트 템플릿도 함께 삭제되도록 구성합니다.
- 데이터 조회 및 필터링(어드민 대시보드 용) 성능을 위해 새로 추가되는 외래키(`author_id`)에는 인덱스를 적용합니다.

## 5. 모델 반영 계획 (Next Steps)
- `backend/app/models.py`에 위 변경 사항 및 신규 클래스(`PromptTemplate`)를 업데이트합니다.
- Alembic 마이그레이션 스크립트를 생성(`alembic revision --autogenerate`)하여 DB 변경 이력을 남기고 DB 스키마를 최신화합니다.
