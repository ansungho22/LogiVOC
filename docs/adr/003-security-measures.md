# ADR 003: Prompt Injection 및 DoS 방어 아키텍처 도입

## Status
Accepted

## Context
워크스페이스 고도화 PRD(`prd-workspace-enhancement.md`)에 따라, AI 파이프라인에 사용자가 직접 '커스텀 프롬프트'를 주입하는 기능과 파일 업로드 기능이 확장되었습니다. 이러한 외부 입력의 확장은 시스템 보안(특히 Prompt Injection)과 자원 고갈(DoS) 측면에서 심각한 취약점을 야기할 수 있습니다.
*   **Prompt Injection**: 악의적인 사용자가 교묘한 지시어를 입력하여 LangGraph의 기본 시스템 지시어를 우회(Jailbreak)하거나, 의도하지 않은 정보를 추출/파괴할 수 있습니다.
*   **DoS (Denial of Service)**: 악의적인 사용자가 초대용량 파일을 지속적으로 업로드하거나 빈번하게 요청을 보낼 경우, Celery Worker 자원이 고갈되고 DB I/O 병목이 발생하여 전체 시스템 장애로 이어질 수 있습니다.

## Decision
위의 위협을 완화하기 위해 다음과 같은 보안 아키텍처 원칙을 시스템 전반에 도입하기로 결정했습니다.

### 1. Prompt Injection 방어
1.  **입력 길이 제한 (Length Limitation)**: 
    - `custom_prompt`의 최대 길이를 500자로 제한합니다. (API 레벨 400 Bad Request 반환)
2.  **입력 필터링 (Input Filtering)**: 
    - API 게이트웨이 및 미들웨어 레벨에서 시스템 지시어를 우회하려는 특수 기호나 알려진 Jailbreak 키워드 패턴을 정규식으로 검증하여 차단합니다.
3.  **시스템 프롬프트 격리 (System Prompt Isolation)**: 
    - LangGraph 실행 시, 메인 시스템 지시어는 `SystemMessage`로, 사용자의 커스텀 프롬프트는 `HumanMessage`로 엄격하게 분리하여 주입합니다. 사용자의 입력이 시스템 문맥을 절대 덮어쓰지 못하도록 아키텍처를 구성합니다.

### 2. DoS (Denial of Service) 공격 방어
1.  **업로드 파일 크기 제한 (Payload Limit)**: 
    - 단일 업로드 파일의 크기를 최대 5MB로 제한합니다. (API 레벨 413 Payload Too Large 반환)
2.  **Rate Limiting 적용**: 
    - 파일 업로드 및 AI 파이프라인 실행 API에 대해 사용자당 분당 10회로 호출 빈도를 제한합니다. (API 레벨 429 Too Many Requests 반환)
3.  **Celery 워커 타임아웃 제한 (Worker Timeout)**: 
    - 악의적인 파일 파싱이나 무한 루프로 인한 워커 스레드 고갈을 방지하기 위해 Celery 태스크에 `Soft Time Limit`(60초) 및 `Hard Time Limit`(90초)을 설정합니다.

## Consequences
*   **Positive**: 
    - 시스템 프롬프트 격리와 입력 제한을 통해 악의적인 프롬프트 인젝션 시도를 근본적으로 차단할 수 있습니다.
    - 파일 크기 및 API 호출 제한을 통해 서버 및 워커 자원 고갈(DoS) 위협을 완화하고 시스템 안정성을 보장할 수 있습니다.
*   **Negative**: 
    - 파일 크기가 5MB를 초과하는 정상적인 대용량 매뉴얼 업로드가 제한될 수 있습니다. 필요시 향후 Chunking 방식의 분할 업로드 또는 관리자 전용 대용량 업로드 우회 경로를 고려해야 합니다.
    - Rate Limit 적용을 위해 Redis 등에서 요청 카운트 관리를 위한 추가적인 메모리와 로직 관리가 필요합니다.
