# LogiVOC API 스펙

## 1. 개요
LogiVOC 플랫폼의 백엔드(FastAPI) API 명세입니다.

## 2. API 엔드포인트

### 2.1 인증 (Auth)
- **POST /auth/login**
  - **Description**: 사용자 로그인을 통해 JWT 토큰을 발급받습니다.
  - **Payload**: `username`, `password` (프론트엔드와 엄격한 스키마 일치 필요)
  - **Response**: `access_token`, `token_type`

### 2.2 문서 업로드 (File Upload)
- **POST /api/v1/files/upload**
  - **Description**: IT 운영 문서 및 로그 파일을 업로드합니다.
  - **Process**: Celery 백그라운드 태스크로 이관되며 비동기로 파싱 및 AI 분석(요약, 구조화)이 진행됩니다.
  - **Response**: HTTP 202 Accepted, Task ID 반환

### 2.3 태스크 상태 조회 (Task Status)
- **GET /api/v1/tasks/{task_id}**
  - **Description**: 비동기 파이프라인의 진행 상태를 조회합니다.
  - **Response**: 상태 (PENDING, PROCESSING, COMPLETED 등) 및 완료 시 DRAFT 데이터

### 2.4 지식 검증 및 발행 (Verification)
- **POST /api/v1/wiki/{id}/verify**
  - **Description**: DRAFT 상태의 지식을 승인(GO) 또는 반려(STOP) 처리합니다.
  - **Payload**: `action` ('GO' 또는 'STOP')
  - **Process**: 승인 시 임베딩(Vector) 추출 후 DB 상태를 PUBLISHED로 업데이트합니다.

### 2.5 검색 (Search)
- **GET /api/v1/wiki/search**
  - **Description**: 자연어 쿼리를 입력받아 코사인 유사도 기반으로 PUBLISHED 상태의 지식을 검색합니다.
  - **Params**: `q` (검색어)

### 2.6 카테고리 관리 (Category)
- **GET /api/v1/categories** : 카테고리 목록 조회
- **POST /api/v1/categories** : 카테고리 생성 (Service, Module, Architecture 3단계 구조)
