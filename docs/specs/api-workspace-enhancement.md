# LogiVOC API 스펙: 워크스페이스 고도화 및 관리자 기능 확장

본 문서는 `prd-workspace-enhancement.md`에 명시된 요구사항을 충족하기 위한 신규 API 및 변경된 API 스펙을 정의합니다.

## 1. 시스템 관리자 (System Admin) API 확장

기존에는 카테고리 관리 등 제한적 기능만 제공하였으나, 전체 데이터 모니터링 및 상태별 관리를 위한 신규 Admin API를 추가합니다.

### 1.1 [GET] 전체 문서 조회 (Admin 전용)
- **Endpoint**: `/api/v1/admin/documents`
- **Description**: 시스템 내 업로드된 모든 문서(DRAFT 및 PUBLISHED 포함)의 상태와 메타데이터를 조회합니다.
- **Headers**: `Authorization: Bearer <JWT_TOKEN>` (ADMIN Role 필요)
- **Query Parameters**:
  - `page` (int, default=1): 페이지 번호
  - `size` (int, default=20): 페이지 당 항목 수
  - `status` (string, optional): 상태 필터 (`DRAFT` | `PUBLISHED` | `ERROR`)
  - `keyword` (string, optional): 파일명 검색
- **Response**:
```json
{
  "total": 150,
  "page": 1,
  "size": 20,
  "items": [
    {
      "id": "doc-uuid-1",
      "file_name": "server-config-manual.pdf",
      "uploader_id": "user-123",
      "status": "DRAFT",
      "created_at": "2026-06-04T10:00:00Z"
    }
  ]
}
```

### 1.2 [GET] 전체 지식 베이스 조회 (Admin 전용)
- **Endpoint**: `/api/v1/admin/knowledge`
- **Description**: DRAFT/PUBLISHED에 상관없이 추출된 모든 단위 지식 레코드를 조회 및 관리합니다.
- **Response**: 문서 조회 API와 유사한 Pagination 및 리스트 형태 응답 제공.

---

## 2. 데이터 등록 (Data Registration) 및 AI 파이프라인 연동 API

새로운 데이터 등록 탭에 맞춰 업로드 API를 확장합니다. 커스텀 프롬프트 주입과 신규 생성된 사용자 정의 카테고리 맵핑을 지원합니다.

### 2.1 [POST] 사용자 정의 카테고리 동적 생성
- **Endpoint**: `/api/v1/categories/custom`
- **Description**: 데이터 등록 시 사용자가 즉석에서 온톨로지 카테고리(Service > Module > Architecture 계층)를 생성합니다.
- **Request Body**:
```json
{
  "name": "Redis-Cluster",
  "parent_id": "cat-module-db",
  "level": 3,
  "description": "Redis 클러스터 트러블슈팅 매뉴얼용 동적 카테고리"
}
```
- **Response** (201 Created):
```json
{
  "id": "cat-arch-redis-new",
  "name": "Redis-Cluster",
  "parent_id": "cat-module-db",
  "level": 3
}
```

### 2.2 [POST] 데이터 등록 및 AI 파이프라인 시작 (수정)
- **Endpoint**: `/api/v1/files/upload`
- **Description**: 기존 파일 업로드 API에 커스텀 프롬프트 파라미터를 추가 반영합니다. Multipart Form-Data로 수신합니다.
- **Request (Multipart/form-data)**:
  - `file`: 업로드할 파일 객체 (PDF, TXT 등). **최대 파일 크기: 5MB**
  - `category_id`: 파일이 매핑될 카테고리 ID (기존 혹은 위 API를 통해 생성된 신규 카테고리 ID)
  - `custom_prompt`: (Optional) AI 파이프라인에 주입할 사용자 맞춤형 추출 프롬프트 문자열 (예: "로그 파일 내 에러 코드 위주로 테이블 형태로 추출해줘.") **최대 길이: 500자**
- **Response** (202 Accepted):
```json
{
  "task_id": "task-uuid-abc-123",
  "message": "AI 파이프라인 시작됨. 상태를 폴링하세요."
}
```

## 3. 에러 코드 및 예외 처리 (Error Handling)
- **403 Forbidden**: 관리자 권한 API를 일반 사용자(`OPERATOR`, `VIEWER`)가 호출한 경우.
- **400 Bad Request**: `custom_prompt` 길이를 초과(500자 초과)하거나 악의적인 명령어 패턴이 탐지된 경우 발생(Prompt Injection Defense).
- **413 Payload Too Large**: 업로드된 파일 크기가 5MB를 초과한 경우 발생(DoS Defense).
- **429 Too Many Requests**: 분당 10회의 API 호출 제한(Rate Limiting)을 초과한 경우 발생.
