# API Specification - 관리자(Admin) 페이지 기능

본 문서는 `LogiVOC` 시스템의 Phase 1 PRD(`prd-workspace-fixes.md`)에서 요구한 관리자 대시보드 및 사용자 관리 기능을 지원하기 위한 API 명세입니다.

## 1. 대시보드 통계 API (Dashboard Stats)

시스템의 전체적인 요약 통계를 제공합니다.

### 1.1 시스템 요약 통계 조회
- **Endpoint:** `GET /api/v1/admin/dashboard/summary`
- **Description:** 총 사용자 수, 활성 카테고리(워크스페이스) 수, 등록된 전체 데이터 수 등 대시보드 위젯에 필요한 요약 데이터를 반환합니다.
- **Roles Allowed:** `ADMIN`

**Request:**
```http
GET /api/v1/admin/dashboard/summary HTTP/1.1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "total_users": 15,
  "total_categories": 8,
  "total_wiki_data": 342,
  "recent_drafts_count": 5,
  "recent_published_count": 12,
  "system_health": "stable"
}
```

### 1.2 최근 활동 데이터 조회
- **Endpoint:** `GET /api/v1/admin/dashboard/recent-activities`
- **Description:** 최근 시스템에 등록된 문서(데이터) 이력이나 주요 활동 내역을 제공합니다.
- **Roles Allowed:** `ADMIN`
- **Query Parameters:**
  - `limit` (int, optional): 반환할 최대 레코드 수 (기본값: 5)

**Response (200 OK):**
```json
[
  {
    "id": 105,
    "activity_type": "WIKI_UPLOAD",
    "description": "네트워크 트러블슈팅 가이드 초안 등록",
    "created_at": "2026-06-04T10:00:00Z",
    "user_id": 3
  }
]
```

## 2. 사용자 관리 API (User Management)

사용자 목록 조회, 역할(Role) 수정 및 상태 관리 기능을 제공합니다.

### 2.1 사용자 목록 조회
- **Endpoint:** `GET /api/v1/admin/users`
- **Description:** 시스템에 등록된 모든 사용자 목록을 페이징하여 반환합니다.
- **Roles Allowed:** `ADMIN`
- **Query Parameters:**
  - `skip` (int, optional): 건너뛸 레코드 수 (기본값: 0)
  - `limit` (int, optional): 반환할 최대 레코드 수 (기본값: 20)
  - `search` (string, optional): 이름 또는 이메일 검색어

**Response (200 OK):**
```json
{
  "total_count": 15,
  "items": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@logivoc.com",
      "role": "ADMIN",
      "is_active": true,
      "created_at": "2026-05-01T00:00:00Z"
    },
    {
      "id": 2,
      "username": "operator1",
      "email": "op1@logivoc.com",
      "role": "OPERATOR",
      "is_active": true,
      "created_at": "2026-05-15T00:00:00Z"
    }
  ]
}
```

### 2.2 사용자 권한(Role) 및 상태 수정
- **Endpoint:** `PATCH /api/v1/admin/users/{user_id}`
- **Description:** 특정 사용자의 권한(Role)이나 활성 상태(is_active)를 변경합니다.
- **Roles Allowed:** `ADMIN`

**Request:**
```json
{
  "role": "OPERATOR",
  "is_active": false
}
```

**Response (200 OK):**
```json
{
  "id": 2,
  "username": "operator1",
  "email": "op1@logivoc.com",
  "role": "OPERATOR",
  "is_active": false,
  "updated_at": "2026-06-04T15:30:00Z"
}
```

## 3. 에러 응답 규격 (공통)

모든 어드민 API는 권한 부족 시 아래와 같은 공통 403 Forbidden 응답을 반환합니다.

**Response (403 Forbidden):**
```json
{
  "detail": "Not enough permissions"
}
```
