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

## 병렬 태스크

| Track | Status | Notes |
| --- | --- | --- |
| `P1 HTML Safety Validator` | done | 외부 리소스, 자동 이동, 권한 API, 동적 실행, postMessage/complete 누락 안내까지 안전 검사 고정 |
| `P2 Artifact UX/Editor Polish` | done | 코드 붙여넣기, 미리보기, prompt 복사, 안전 상태 안내 UX 기본 마감 |
| `P3 Sample HTML Templates` | done | 분수 막대 샘플 HTML과 E2E HTML fixture로 기본 템플릿 검증 |
| `P4 Report Copy/Diagnosis Rules` | done | artifact event payload를 교사용 4블록 문장과 다음 수업 보완점으로 변환 |
| `P5 테스트 자동화` | done | HTML 붙여넣기, 발행, play iframe bridge, report 4블록, release 체크 명령까지 자동화 |

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

1. GitHub에 현재 재설계 결과를 커밋/푸시한다.
2. 실제 Supabase 프로젝트와 배포 환경에서 `docs/product/h7-release-checklist.md` 기준으로 수동 smoke를 수행한다.
3. 다음 제품 사이클에서는 교사 계정, 자료 목록, QR 이미지, AI 초안 API 중 우선순위를 정한다.

## Blockers

- 없음. `teacher_activities.document_json` 구조라 HTML artifact 필드는 추가 migration 없이 저장 가능하다.
