# QA 리포트

- **작성자:** devops_mlops
- **작성일시:** 2026-06-05 10:28:08
- **리포트 유형:** QA

---

## 요약 (Summary)
Phase 3 데이터 구조화 파이프라인 (분기형 라우터 포함) 코드에 대한 무결성 검증, 빌드 및 환경 테스트를 수행하였습니다.
- 백엔드 단위 테스트(pytest) 수행: `tests/test_pipeline_structure.py` 등 테스트 100% 통과 확인.
- 테스트 환경에서의 파이프라인 Fallback 예외(Azure DI mock 에러로 인한 `AttributeError: 'str' object has no attribute 'hex'`) 현상을 확인하고, `app/pipeline/nodes.py`의 `extract_text_node`에서 CSV/Excel 파일의 경우 Pandas를 직접 사용하도록 수정하여 파이프라인 라우팅 버그를 픽스했습니다.
- 프롬프트/프론트엔드 환경 연동을 위한 E2E 빌드 테스트(`run_test.sh`)를 점검하였습니다.

## 테스트 환경 (Environment)
- **OS:** Mac
- **Backend:** Python 3.12, FastAPI, Celery, LangGraph
- **Frontend:** Node.js, Vite, Playwright
- **테스트 스크립트:** `run_test.sh`, `pytest`

## 발견 사항 (Findings)

| # | 심각도 | 항목 | 설명 | 재현 경로 |
|---|--------|------|------|-----------|
| 1 | High   | 파이프라인 라우팅 오류 | CSV 파일을 처리할 때 불필요하게 Azure DI를 호출하여 테스트 환경에서 타임아웃 및 mock 도메인 오류 발생. 해당 오류가 Fallback으로 전달되면서 `str object has no attribute hex` 오류 유발. | CSV 데이터 업로드 시 라우팅 |

*수정 완료:* `app/pipeline/nodes.py`에서 확장자를 확인하여 CSV/Excel은 Pandas를 사용하도록 수정.

## 결론 (Conclusion)
**PASSED**

---
*이 리포트는 `.agents/skills/report/run.sh`에 의해 자동 생성되었습니다.*
