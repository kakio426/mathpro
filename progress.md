# Progress

이 문서는 수학프로의 실제 구현 상태판이다. 제품 방향은 `교사용 HTML 인터랙티브 수업자료 런타임`으로 재동결한다.

## 현재 제품 기준

- 핵심 사용자: 교사
- 핵심 흐름: `LLM 프롬프트 생성 -> Gemini/LLM에서 HTML 생성 -> HTML 붙여넣기 -> iframe 미리보기 -> 발행 -> 코드/링크 배포 -> 학생 실행 -> 이벤트 분석 리포트`
- 현재 v0 엔진은 재사용한다:
  - Supabase 연결
  - guest session
  - `session_events`
  - assignment code
  - publish flow
  - report route
- 기존 `fraction-bars`, `number-line`, `multiple-choice`, `free-text`는 보조 템플릿으로 내린다.
- 새 source of truth는 `TeacherActivityDocument.blocks[]` 안의 `html-artifact` block이다.

## 직렬 태스크

| Track | Status | Notes |
| --- | --- | --- |
| `H0 제품 기준 재동결` | done | 수학프로를 HTML 인터랙티브 수업자료 런타임으로 고정 |
| `H1 HTML Artifact 데이터 계약` | done | `html-artifact`, `html`, `allowedEvents`, `analysisSchema`, `promptTemplate`, `safetyStatus` 계약 추가 |
| `H2 교사용 HTML 붙여넣기/미리보기 화면` | done | Gemini용 프롬프트, HTML 붙여넣기, iframe 미리보기, 발행 흐름 구현 |
| `H3 iframe Sandbox Runner` | done | `/play/[code]`에서 HTML artifact를 sandbox iframe으로 실행하고 route/unit/E2E 테스트로 고정 |
| `H4 postMessage Event Bridge` | done | iframe 내부 `postMessage`를 `session_events`와 `complete`에 연결, 허용 이벤트/iframe origin/unit/E2E 테스트로 고정 |
| `H5 Gemini/LLM 프롬프트 템플릿` | done | 화면에서 복사 가능한 프롬프트 템플릿 제공 |
| `H6 교사 리포트 분석 고도화` | done | HTML artifact 이벤트를 블록별 조작 세션/제출/완료/오답/응답 예시/힌트/재시도 기반 4블록 리포트로 요약 |
| `H7 운영/배포 하드닝` | done | production fixture 차단, iframe 보안 속성, release 체크 명령, 배포 체크리스트 정리 |
| `H8 Studio OS UI/온보딩` | done | 제작실/학생 실행/교사 리포트 화면을 Studio OS 톤으로 정리하고 단계형 안내 모달 추가 |

## 병렬 태스크

| Track | Status | Notes |
| --- | --- | --- |
| `P1 HTML Safety Validator` | done | 외부 리소스, 자동 이동, 권한 API, 동적 실행, postMessage/complete 누락 안내까지 안전 검사 고정 |
| `P2 Artifact UX/Editor Polish` | done | 코드 붙여넣기, 미리보기, prompt 복사, 안전 상태 안내 UX 기본 마감 |
| `P3 Sample HTML Templates` | done | 분수 막대 샘플 HTML과 E2E HTML fixture로 기본 템플릿 검증 |
| `P4 Report Copy/Diagnosis Rules` | done | artifact event payload를 교사용 4블록 문장과 다음 수업 보완점으로 변환 |
| `P5 테스트 자동화` | done | HTML 붙여넣기, 발행, play iframe bridge, report 4블록, release 체크 명령까지 자동화 |
| `P6 Friendly Copy Pass` | done | 개발자용/코딩용 문구를 교사용 언어로 낮추고 필요한 용어는 안내 모달에서 설명 |

## 다음 제품화 태스크

### 직렬 태스크

| Track | Status | Notes |
| --- | --- | --- |
| `T1 내 자료/발행 목록 MVP` | done | `/teacher/activities`에서 발행 자료 목록, 참여 코드, 학생 링크, 교사 리포트 링크, 참여/완료 수를 확인 |
| `T2 메뉴 IA 실제 연결` | done | `/teacher/activities`, `/teacher/distribution`, `/teacher/reports`를 실제 메뉴로 연결하고 각 보드의 빈 상태/로딩/오류 상태 설계 |
| `T3 학생 참여 코드 화면 고도화` | next | `/join`을 더 친절하게 정리하고 참여 코드 입력, 최근 참여, 오류 안내를 실제 사용자 언어로 개선 |
| `T4 교사 리포트 상세화` | pending | assignment 단위 리포트에서 학생별 세션 목록, 활동별 조작 로그 요약, 다음 수업 액션을 더 구체화 |
| `T5 자료 재사용/복제 흐름` | pending | 기존 자료를 복제해서 다른 개념/차시에 맞게 수정할 수 있는 기본 흐름 추가 |
| `T6 실제 배포 수동 QA` | pending | Supabase/Vercel 실환경에서 제작 -> 발행 -> 학생 참여 -> 리포트 확인까지 수동 smoke 수행 |

### 병렬 태스크

| Track | Status | Notes |
| --- | --- | --- |
| `Q1 QR/공유 UX` | pending | 발행 패널에 QR 이미지, 링크 복사, 참여 코드 크게 보기 등 교실 배포 편의 기능 추가 |
| `Q2 샘플 템플릿 확장` | pending | 분수 막대 외 수직선/분류/매칭 예시 HTML 템플릿을 추가해 교사가 바로 참고 가능하게 함 |
| `Q3 안내 모달 고도화` | pending | 최초 방문 자동 안내 여부, 다시 보지 않기, 화면별 짧은 도움말을 UX 정책으로 정리 |
| `Q4 용어집/도움말` | pending | HTML, AI 요청문, 안전 검사, 조작 기록 같은 용어를 교사용 도움말 카드로 설명 |
| `Q5 리포트 문장 품질` | pending | 오개념 신호와 다음 수업 액션 문장을 더 자연스럽고 교실에서 바로 쓸 수 있게 다듬기 |
| `Q6 운영 문서 보강` | pending | 실제 선생님 테스트용 시나리오, 실패 대응, 자료 제작 가이드 문서화 |

## 공개 계약

- 교사 저작 API:
  - `POST /api/teacher/activities/draft`
  - `POST /api/teacher/activities/publish`
- 배포/참여 API:
  - `GET /api/assignments/[code]`
  - `POST /api/assignments/[code]/sessions`
- 학생 활동 API:
  - `POST /api/sessions/[sessionId]/events`
  - `POST /api/sessions/[sessionId]/complete`
- 교사 리포트 API:
  - `GET /api/teacher/assignments/[assignmentId]/report`

## 다음 순서

1. `T3 학생 참여 코드 화면 고도화`로 학생 진입 UX를 더 친절하게 만든다.
2. `T4 교사 리포트 상세화`로 학생별 세션 목록과 활동별 조작 로그 요약을 확장한다.
3. 병렬로 `Q1 QR/공유 UX`, `Q2 샘플 템플릿 확장`, `Q4 용어집/도움말`을 준비한다.
4. 제품화 흐름이 안정되면 `T6 실제 배포 수동 QA`를 수행한다.

## Blockers

- 없음. `teacher_activities.document_json` 구조라 HTML artifact 필드는 추가 migration 없이 저장 가능하다.
