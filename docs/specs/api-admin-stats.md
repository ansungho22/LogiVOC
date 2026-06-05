# API Specification: Admin Dashboard Statistics

## 1. 개요
본 문서는 LogiVOC 플랫폼의 System Admin 대시보드 화면을 구성하기 위한 통계 데이터 및 활동 로그 조회 API 명세서입니다. 전체 문서 수, 카테고리별 통계 차트, 그리고 최신 활동 내역(타임라인)을 클라이언트(프론트엔드)에 제공합니다.

## 2. API 엔드포인트 명세

### 2.1 대시보드 요약 지표 (Overview Statistics)
- **Endpoint**: `GET /api/v1/admin/stats/overview`
- **Description**: 시스템에 등록된 전체 문서 수와 문서 상태별(승인, 대기, 반려) 통계를 요약하여 제공합니다. KPI 위젯 구성에 사용됩니다.
- **Query Parameters**: 없음 (권한 인증 필요)
  
- **Response (200 OK)**:
```json
{
  "total_documents": 500,
  "status_counts": {
    "PUBLISHED": 420,
    "DRAFT": 55,
    "REJECTED": 25
  }
}
```

### 2.2 카테고리별 통계 (Category Statistics)
- **Endpoint**: `GET /api/v1/admin/stats/categories`
- **Description**: 카테고리별로 등록된 문서들의 분포를 제공합니다. 프론트엔드의 파이/도넛 차트 렌더링에 사용됩니다.
- **Query Parameters**:
  - `status` (string, optional): 특정 상태(예: `PUBLISHED`)의 문서만 카운트할 경우 사용.
  
- **Response (200 OK)**:
```json
{
  "data": [
    {
      "category_id": 1,
      "category_name": "Network",
      "count": 150
    },
    {
      "category_id": 2,
      "category_name": "Database",
      "count": 200
    },
    {
      "category_id": 3,
      "category_name": "Application",
      "count": 150
    }
  ]
}
```

### 2.3 최근 활동 내역 (Recent Activities)
- **Endpoint**: `GET /api/v1/admin/activities/recent`
- **Description**: 문서 등록, 승인, 상태 변경 등 시스템에서 발생한 최근 활동 로그를 반환합니다. 타임라인 또는 리스트 형태의 위젯에 사용됩니다.
- **Query Parameters**:
  - `limit` (integer, optional): 반환할 활동 이력의 개수 (기본값: 10)
  
- **Response (200 OK)**:
```json
{
  "data": [
    {
      "activity_id": 1001,
      "event_type": "DOCUMENT_CREATED",
      "document_id": 501,
      "document_title": "신규 VPN 설정 가이드",
      "user_name": "operator_kim",
      "timestamp": "2026-06-05T14:15:00Z"
    },
    {
      "activity_id": 1000,
      "event_type": "STATUS_CHANGED",
      "document_id": 490,
      "document_title": "DB 접속 장애 트러블슈팅",
      "old_status": "DRAFT",
      "new_status": "PUBLISHED",
      "user_name": "admin_lee",
      "timestamp": "2026-06-05T13:30:00Z"
    }
  ]
}
```

## 3. 구현 주의사항
- 대시보드용 API는 호출 빈도가 높거나, 전체 테이블 풀스캔이 발생할 가능성이 있습니다. 응답 속도 향상을 위해 통계 데이터는 필요한 경우 캐싱(Redis 등 활용)을 고려하거나, 효율적인 COUNT 쿼리로 최적화해야 합니다.
- 관리자 권한(`ADMIN`)을 가진 사용자만 위 API들을 호출할 수 있도록 라우터 단에서 권한 검증 미들웨어가 필수적으로 적용되어야 합니다.
