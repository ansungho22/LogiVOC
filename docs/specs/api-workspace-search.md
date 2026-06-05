# API Specification: Workspace Search & Viewer

## 1. 개요
본 문서는 LogiVOC의 `Workspace` 탭 통합 문서 검색 포털 개편을 지원하기 위한 백엔드 API 명세서입니다. `pgvector`를 활용한 인공지능 시맨틱(벡터 유사도) 검색 기능과 다중 메타데이터 필터링(카테고리, 상태, 날짜)을 함께 제공하며, 상세 뷰어에 필요한 원본, AI 요약 및 구조화된 JSON 데이터 서빙 엔드포인트를 정의합니다.

## 2. API 엔드포인트 명세

### 2.1 통합 문서 검색 (Semantic Search & Multi-Filter)
- **Endpoint**: `GET /api/v1/documents/search`
- **Description**: 
  - `query`가 주어질 경우 `pgvector` 기반 코사인 유사도 점수(`semantic_score`)를 계산하여 연관도 순으로 정렬합니다. 
  - `query`가 없으면 단순 필터 기반으로 최신순 정렬하여 반환합니다.
- **Query Parameters**:
  - `query` (string, optional): 시맨틱 검색용 자연어 쿼리
  - `category_id` (integer, optional): 특정 카테고리 ID 필터
  - `status` (string, optional): 상태 필터 (`PUBLISHED`, `DRAFT`, `REJECTED` 등). 기본적으로 일반 사용자에게는 `PUBLISHED`만 노출되나, 권한에 따라 전체 조회가 가능해야 합니다.
  - `start_date` (string, optional): 날짜 필터 시작일 (YYYY-MM-DD 형식)
  - `end_date` (string, optional): 날짜 필터 종료일 (YYYY-MM-DD 형식)
  - `page` (integer, optional): 페이지 번호 (기본값: 1)
  - `limit` (integer, optional): 페이지 당 항목 수 (기본값: 20)

- **Response (200 OK)**:
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": 42,
      "title": "Oracle DB Listener 접속 에러 해결 가이드",
      "summary": "ORA-12170 에러 발생 시 방화벽 포트(1521) 및 리스너 상태 확인 절차 요약.",
      "category": {
        "id": 3,
        "name": "Database"
      },
      "status": "PUBLISHED",
      "semantic_score": 0.92,
      "created_at": "2026-06-04T10:30:00Z"
    }
  ]
}
```

### 2.2 문서 상세 정보 조회 (Document Details for Viewer)
- **Endpoint**: `GET /api/v1/documents/{document_id}`
- **Description**: 검색된 문서 항목 클릭 시 노출될 상세 뷰어(모달/슬라이드 오버)에 필요한 전체 데이터를 제공합니다.
- **Path Variables**:
  - `document_id` (integer): `knowledge_wiki` 테이블의 PK
  
- **Response (200 OK)**:
```json
{
  "id": 42,
  "title": "Oracle DB Listener 접속 에러 해결 가이드",
  "original_text": "본 문서는 Oracle DB 접속 시 ORA-12170 에러가 났을 때의 해결 방법을 담고 있습니다...",
  "summary": "ORA-12170 에러 발생 시 방화벽 포트(1521) 및 리스너 상태 확인 절차 요약.",
  "structured_data": {
    "Error Code": "ORA-12170",
    "Root Cause": "Network Timeout / Firewall Block",
    "Resolution": "1. iptables 1521 port open\n2. lsnrctl status check"
  },
  "category": {
    "id": 3,
    "name": "Database"
  },
  "status": "PUBLISHED",
  "created_at": "2026-06-04T10:30:00Z",
  "updated_at": "2026-06-04T10:35:00Z"
}
```

- **Error Responses**:
  - `404 Not Found`: 해당 ID의 문서가 존재하지 않음
  - `403 Forbidden`: 해당 문서 조회 권한이 없음 (예: 다른 사용자의 DRAFT 상태 문서 등)

## 3. 구현 주의사항
- 시맨틱 검색 파이프라인에서 입력받은 `query`는 먼저 OpenAI 혹은 적용된 임베딩 모델을 통해 벡터(Vector)로 변환되어야 하며, 이후 `pgvector`의 코사인 유사도 연산(`<=>`)을 사용하여 DB와 조회해야 합니다.
- 검색 성능 확보를 위해 `pgvector`의 HNSW 인덱스가 제대로 적용되어 있는지 검토되어야 합니다.
