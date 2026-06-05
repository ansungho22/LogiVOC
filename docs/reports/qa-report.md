# QA 리포트

- **작성자:** qa_engineer
- **작성일시:** 2026-06-05 14:44:00
- **리포트 유형:** QA (E2E & Logic Validation)

---

## 요약 (Summary)
Phase 3 개발 내용(Workspace 통합검색 및 Admin 대시보드 통계)에 대하여 백엔드 `pytest` 및 프론트엔드 통합 E2E 테스트(Playwright)를 수행했습니다. 테스트 과정에서 의존성 주입 누수, 프론트엔드 로케이터 매칭 오류, 그리고 React의 Promise.all() 동시 호출로 인한 Auth 동시성 오류(Race Condition)가 발견되어 모두 직접 픽스 후 테스트를 100% 통과시켰습니다.

## 테스트 환경 (Environment)
- **OS:** macOS
- **테스트 프레임워크:** `pytest` (Backend), `@playwright/test` (Frontend)
- **대상 기능:**
  - Workspace 통합 문서 시맨틱 검색 (검색어 입력)
  - Admin 대시보드 통계 조회 (총 문서 수, 카테고리별 현황, 활동 내역 등)

## 발견 사항 (Findings)

| # | 심각도 | 항목 | 설명 | 재현 경로 / 조치 내용 |
|---|--------|------|------|-----------|
| 1 | High | Backend Auth Race Condition | 프론트엔드에서 API 토큰 획득 시 동시성 제어가 없어 여러 탭(대시보드 통계) 로딩 시 `auto-login` 중복 회원가입 500 에러 발생 | `frontend/src/api/index.ts`의 `getToken`에 Promise Lock 로직 추가하여 수정 완료 (Fixed) |
| 2 | Medium | 테스트 의존성 누수 | `test_wiki_verify.py`에서 `app.dependency_overrides`를 전역으로 덮어써서 다른 테스트들의 인증 로직이 우회되는 결함 | Pytest fixture `yield` 구문을 사용해 오버라이드 해제(clear)하도록 수정 완료 (Fixed) |
| 3 | Low | E2E Locator 불일치 | 프론트엔드 텍스트가 한글화 됨에 따라 기존 E2E 테스트(`Your Workspaces` 등) 실패 | `phase3.spec.ts` 및 신규 작성한 `phase3-search-stats.spec.ts` 로케이터를 실제 한글 텍스트로 업데이트 완료 (Fixed) |
| 4 | Info | 신규 E2E 테스트 추가 | Workspace 통합검색 및 Admin 대시보드 통계를 위한 신규 E2E 테스트 파일 작성 및 검증 통과 | `frontend/tests/phase3-search-stats.spec.ts` 100% Pass |

## 결론 (Conclusion)
**PASSED**
- 통합 검색 포털 및 대시보드 통계 기능이 프론트/백엔드 모두 정상적으로 통신하며 요구사항대로 동작함을 E2E로 검증 완료.
- 발견된 논리적 결함(Auth 500 오류 등)은 모두 픽스되었습니다.
- Phase 5(UAT 모의 사용자 테스트) 진행이 가능한 상태입니다.

---
*이 리포트는 QA 에이전트에 의해 작성되었습니다.*
