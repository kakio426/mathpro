# Progress

이 문서는 초등 수학 플랫폼 v1의 실행 상태판이다. 긴 기획서를 반복하지 않고, 지금 레포가 어디까지 구현됐는지와 다음 직렬 태스크가 무엇인지 빠르게 공유하는 데 목적이 있다.

## 현재 제품 상태

- 대상 모듈: `3~4학년군 분수 탐험실`
- 고정 lesson 4개:
  - `whole-and-part`
  - `denominator-and-numerator`
  - `compare-fractions-same-whole`
  - `fractions-on-a-number-line`
- 고정 세션 흐름:
  - `pre-diagnosis`
  - `manipulation`
  - `prediction`
  - `explanation`
  - `generalization`
  - `report`
- 현재 사용자 여정:
  - `/lab/[lessonSlug]`에서 항상 새 게스트 세션 시작
  - 활동별 event 즉시 저장
  - lesson 완료 후 `/report/[sessionId]`로 이동
  - report route에서 `pending | ready | failed` 상태 조회

## 트랙 상태

| Track | Status | Notes |
| --- | --- | --- |
| `S0 범위 동결` | done | `docs/product/s0-scope-freeze.md`, `docs/product/s0-scope-contract.json` 기준 유지 |
| `S1 프로젝트 골격` | done | Next, TS, Tailwind, Supabase, Vitest, Playwright, 기본 라우트와 env 검증 준비 완료 |
| `S2 콘텐츠/데이터 계약 락` | done | `src/types/content.ts`, `src/lib/content-loader.ts`, `scripts/content-check.ts`로 콘텐츠 계약과 빌드 전 검증 잠금 완료 |
| `S3 세션/저장소 기반` | done | guest session API, migration, store/service, monotonic `latest_event_at`, pending report row 구현 완료 |
| `S4 세션 러너` | done | 4종 renderer, lesson runner, strict mode-safe session start, report status 화면까지 연결 완료 |
| `S5 진단 엔진` | not-started | misconception 평가, summary JSON 생성, 추천 lesson 계산 미구현 |
| `S6 결과/계정 전환/출시 하드닝` | not-started | guest upgrade, 누적 history, launch QA 미구현 |
| `P1 콘텐츠 작성` | done | 4개 lesson JSON/MD가 현재 러너에서 실제 사용 중 |
| `P2 인터랙션 컴포넌트` | done | `fraction-bars`, `number-line`, `multiple-choice`, `free-text` renderer 사용 중 |
| `P3 UI/반응형 경험` | active | 홈/리포트 문구와 polish는 진행 중, 학습 핵심 흐름은 동작 |
| `P4 리포트 문장화` | not-started | template/AI 보조 계층은 S5 summary 이후 연결 예정 |
| `P5 테스트 자동화` | active | content, session, runner, report, smoke test 운영 중 |

## 공개 계약

- 콘텐츠 source of truth:
  - `content/v1/module.json`
  - `content/v1/concepts.json`
  - `content/v1/misconceptions.json`
  - `content/v1/lessons/<lessonSlug>/lesson.json`
- 세션 API:
  - `POST /api/sessions`
  - `POST /api/sessions/[sessionId]/events`
  - `POST /api/sessions/[sessionId]/complete`
  - `GET /api/reports/[sessionId]`
- report 상태 계약:
  - `pending`: 학습 기록 저장 완료, 진단 전
  - `ready`: S5가 summary를 채운 상태
  - `failed`: 생성 실패

## Current Task

- 태스크: `S5 진단 엔진 착수 준비`
- 완료 기준:
  - session event를 misconception rule 평가 입력으로 집계하는 방식이 정리된다.
  - `session_reports.summary_json`의 최소 출력 shape가 고정된다.
  - `pending -> ready | failed` 전환 책임과 실행 지점이 명확해진다.

## 다음 순서

1. `S5`에서 event 집계와 misconception rule evaluation을 구현한다.
2. `summary_json`을 4블록 리포트와 자연스럽게 연결한다.
3. `P4`에서 문장형 리포트 계층을 붙인다.
4. 이후 `S6`에서 guest upgrade, history, 출시 QA를 진행한다.

## Blockers

- 없음
