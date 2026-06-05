# UI/UX Design Spec - 워크스페이스 및 시스템 개선

## 1. 개요
본 문서는 `prd-workspace-fixes.md` 요구사항을 바탕으로 프론트엔드 화면의 시각적 명확성을 높이고, 관리자 페이지의 세부 화면을 설계하며, 일관된 폴더 구조를 확립하기 위한 UI/UX 가이드라인 및 프론트엔드 구조 규칙을 정의합니다.

## 2. 탭 네이밍 및 화면 차별화 가이드

### 2.1 메인 탭 네이밍 통일
모든 메인 내비게이션 탭의 네이밍을 영문으로 통일하여 글로벌 스탠다드 및 언어적 일관성을 확보합니다.
- **Data Registration** (기존: 데이터 등록)
  - 툴팁/서브타이틀: "Register and manage your raw data"
- **Workspaces** (기존: Workspace)
  - 툴팁/서브타이틀: "Manage your logic workspaces"
- **Admin** (기존: Admin)
  - 툴팁/서브타이틀: "System administration and settings"

### 2.2 화면 간 시각적 차별화
Data Registration과 Workspaces 탭이 동일하게 보이는 문제를 해결하기 위해, 각 페이지별 고유의 레이아웃 패턴과 컬러 테마를 적용합니다.

- **Data Registration 페이지**
  - **레이아웃:** 데이터를 입력하고 업로드하는 폼(Form) 위주의 1단 레이아웃. 중앙 정렬된 카드 컴포넌트 사용.
  - **아이콘 및 컬러:** 업로드, 추가(Add), 파일(File)과 관련된 아이콘 사용. Primary 액션 버튼은 강조 색상(예: Blue) 적용.
  - **헤더:** "Upload & Register Data" 타이틀과 간략한 설명 영역 포함.

- **Workspaces 페이지**
  - **레이아웃:** 여러 워크스페이스를 한눈에 볼 수 있는 그리드(Grid) 뷰 또는 리스트(List) 뷰 제공. (검색 및 필터 영역 상단 배치)
  - **아이콘 및 컬러:** 폴더, 프로젝트, 상태(Active/Inactive) 등을 나타내는 아이콘 사용. 배경색을 미세하게 조정하여 작업 공간의 독립된 느낌 부여.
  - **헤더:** "Your Workspaces" 타이틀 및 'Create New Workspace' 버튼 배치.

## 3. System Admin 페이지 화면 설계

관리자(Admin) 페이지는 좌측 사이드바(또는 상단 서브 탭)를 통해 서브 메뉴 간 이동이 가능하도록 구성합니다.

### 3.1 Dashboard 탭
시스템의 전체적인 상태를 한눈에 파악할 수 있는 요약 위젯 화면입니다.

- **레이아웃:** 상단 요약 카드(KPI) 영역과 하단 상세 차트/목록 영역으로 분리.
- **주요 위젯 구성:**
  - **Total Workspaces:** 전체 생성된 워크스페이스 수 (숫자 강조 위젯)
  - **Total Registered Data:** 등록된 전체 데이터 수 (숫자 강조 위젯)
  - **Recent Activities:** 최근 워크스페이스 생성 및 데이터 등록 이력을 타임라인 형태로 제공.
- **UI 컴포넌트:** 카드(Card), 통계(Statistic), 타임라인(Timeline) 컴포넌트 조합.

### 3.2 User Management 탭
사용자 목록 조회 및 권한 설정을 위한 관리 화면입니다.

- **레이아웃:** 상단 검색/필터 바 및 우측 상단 'Add User' 버튼, 중앙 데이터 테이블, 하단 페이지네이션.
- **주요 기능 및 요소:**
  - **검색 및 필터:** 이름, 이메일, 역할(Role) 기반 검색.
  - **데이터 테이블 컬럼:**
    - `ID` (사용자 식별자)
    - `Name / Email` (사용자 정보)
    - `Role` (Admin, Manager, User 등 - 드롭다운으로 즉시 변경 가능하거나 모달을 통한 수정 지원)
    - `Status` (Active, Suspended)
    - `Actions` (Edit, Delete 버튼)
  - **권한 설정 모달 (Mock):** 특정 사용자 행의 Edit 클릭 시, 권한(Role)을 수정할 수 있는 모달 팝업 제공.

## 4. 프론트엔드 폴더 구조 분리 규칙 명문화

유지보수성과 가독성을 위해 React(프론트엔드) 프로젝트의 `src` 내 디렉터리 구조를 목적에 따라 명확히 분리합니다. 

```text
src/
├── api/          # 백엔드 통신 로직 및 Axios 인스턴스 (예: authApi.ts, workspaceApi.ts)
├── components/   # 재사용 가능한 UI 컴포넌트 (페이지에 종속되지 않은 공통 요소)
│   ├── common/   # 버튼, 인풋, 모달 등 범용 컴포넌트
│   └── layout/   # 헤더, 사이드바, 푸터 등 레이아웃 요소
├── pages/        # 각 라우트에 매핑되는 최상위 페이지 컴포넌트
│   ├── DataRegistration/
│   ├── Workspaces/
│   └── Admin/
│       ├── Dashboard/
│       └── UserManagement/
└── types/        # TypeScript 타입 및 인터페이스 선언 파일 (예: user.types.ts, api.types.ts)
```

### 4.1 세부 규칙
- **Pages:** 라우팅 처리의 엔드포인트 역할을 하며, 비즈니스 로직(상태 관리, API 호출 조합)과 뷰를 연결합니다.
- **Components:** 순수(UI 중심) 컴포넌트를 지향하며, props로 데이터를 전달받아 렌더링합니다.
- **API:** 백엔드 서버(REST API 등)와 통신하는 함수들만 모아 관리하여, UI 컴포넌트에서 비동기 호출 로직을 분리합니다.
- **Types:** 전역적으로 사용되는 스키마 응답 타입이나 도메인 모델 인터페이스를 중앙 집중화하여 선언합니다.
