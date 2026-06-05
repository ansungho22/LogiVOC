# ADR 006: Data Cleansing and Structuring Pipeline (Branching LangGraph)

## 1. Context (배경)
현재 LogiVOC 시스템의 AI 파이프라인은 주로 문서의 텍스트를 추출하여 단순 요약하는 단일 흐름(선형) LangGraph 파이프라인으로 구성되어 있습니다.
그러나 현업에서 다량의 로그성 데이터나 엑셀/CSV 등 중복이 많고 정형화가 필요한 데이터(표, 구조화 문서)가 업로드될 경우, 단순 요약만으로는 원본 데이터의 손실이 발생하고 결과물을 시스템적으로 재사용하기 어렵다는 한계가 발견되었습니다.

## 2. Decision (결정 사항)
기존 선형 파이프라인을 **분기형(Branching) LangGraph 구조로 개편**합니다.
1. **조건부 라우터(Router) 도입:** 업로드된 파일의 형태(문서형 vs 스프레드시트형) 및 사용자 의도(단순 요약 vs 표/구조화 요청)를 파악하여 파이프라인 경로를 동적으로 결정(`pipeline_route`)하는 `router_node`를 추가합니다.
2. **구조화 전용 노드 체인 구성:** `structure` 경로로 라우팅 시, 다음의 전용 노드 체인을 순차적으로 실행합니다.
   - `cleanse_node`: 노이즈 제거 및 데이터 정규화 수행 (LLM 및 Pandas 결합)
   - `merge_node`: 정규화된 데이터 기반 중복 식별 및 카운트(Count) 병합
   - `structure_node`: 병합된 결과를 JSON 또는 Markdown Table 형태의 정형 데이터로 변환
3. **GraphState 확장:** 분기 및 구조화 데이터를 관리하기 위해 `file_type`, `pipeline_route`, `filtered_data`, `merged_data`, `structured_output_json` 등의 상태 필드를 `GraphState`에 추가합니다.

## 3. Rationale (결정 사유)
- **원본 보존 및 활용도 증대:** 불필요한 노이즈만 제거하고 중복 데이터를 논리적으로 병합함으로써 데이터 손실을 최소화합니다.
- **포맷 유연성:** 구조화 파이프라인을 거친 결과는 JSON 포맷으로 도출되므로 향후 UI에서 표나 차트로 렌더링하기에 용이합니다.
- **확장 가능한 모듈형 그래프:** 분기형 라우터 노드를 도입함으로써, 추후 '이미지 분석'이나 '다국어 번역' 등 새로운 파이프라인 경로를 쉽게 덧붙일 수 있는 구조적 기반을 마련합니다.

## 4. Consequences (결과 및 영향)
- **개발 요소:** `backend/app/pipeline/` 디렉토리 내의 `state.py`, `nodes.py`, `edges.py`를 대대적으로 수정해야 하며, 기존 `summarize` 노드 외에 신규 노드 함수를 구현해야 합니다.
- **처리량 및 메모리 고려:** 정제/병합 과정에서 데이터 프레임(Pandas) 처리가 필요할 수 있으므로, 해당 노드에서는 대용량 텍스트 컨텍스트 초과를 막기 위해 Chunking 또는 코드 기반 전처리가 병행되어야 합니다.
- **아키텍처 문서 반영:** 본 결정 사항에 따라 `docs/specs/architecture.md`의 파이프라인 설계 및 시각화 다이어그램을 업데이트합니다.
