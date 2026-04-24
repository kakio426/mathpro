# H7 Release Checklist

수학프로 v0는 `교사용 HTML 인터랙티브 수업자료 런타임`으로 배포한다. 이 문서는 배포 직전에 반복 확인할 최소 체크리스트다.

## Runtime Scope

- 교사는 Gemini/LLM에서 만든 단일 HTML을 붙여넣고 미리본 뒤 발행한다.
- 학생은 참여 코드 또는 `/play/[code]` 링크로 들어와 sandbox iframe 안에서 HTML 자료를 실행한다.
- HTML 자료는 `window.parent.postMessage`로만 이벤트를 전달한다.
- 수학프로는 `ready`, `interaction`, `select`, `drag-end`, `drop`, `submit`, `hint-open`, `retry`, `complete` 이벤트를 저장한다.
- `complete` 이벤트가 오면 세션을 완료하고 학생 리포트로 이동한다.

## Security Guardrails

- iframe은 `sandbox="allow-scripts"`만 사용한다.
- iframe은 `allow=""`와 `referrerPolicy="no-referrer"`를 사용한다.
- 발행 전 HTML safety validator가 서버에서 다시 실행된다.
- blocked HTML은 발행할 수 없다.
- 외부 script/resource, `javascript:` URL, form/file input, network request, browser storage, 권한 API, top navigation, dynamic code execution은 차단한다.
- `postMessage` 또는 `complete` 이벤트가 없으면 warning으로 교사에게 알려준다.
- `MATHPRO_E2E_FIXTURES`는 production에서 무시된다.

## Required Verification

배포 전 아래 명령을 한 번에 실행한다.

```bash
npm run release:check
```

이 명령은 다음을 순서대로 실행한다.

- `npm run lint`
- `npm run typecheck`
- `npm run content:check`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`

## Supabase Checklist

- `supabase/migrations/20260424043000_teacher_assignments.sql` 적용 확인
- `supabase/migrations/20260424070000_html_artifact_events.sql` 적용 확인
- 배포 환경에 `NEXT_PUBLIC_SUPABASE_URL` 설정
- 배포 환경에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- 배포 환경에 `SUPABASE_SERVICE_ROLE_KEY` 설정
- service role key는 브라우저 번들에 노출하지 않는다.

## Manual Smoke

- 자동 확인이 필요하면 아래 명령으로 배포 URL에 실제 QA 데이터를 생성해 전체 흐름을 검사한다.

```bash
npm run qa:t6 -- --base-url https://your-app.vercel.app --confirm-write
```

- 홈에서 HTML 자료 문서를 만든다.
- 안전 검사 통과/경고/차단 문구가 의도대로 보이는지 확인한다.
- 자료를 발행하고 참여 코드를 확인한다.
- `/play/[code]`에서 학생 활동을 실행한다.
- HTML 내부 조작 후 이벤트 로그가 갱신되는지 확인한다.
- complete 후 `/report/[sessionId]`로 이동하는지 확인한다.
- 교사 리포트 `/teacher/assignments/[assignmentId]`에서 4블록 요약이 보이는지 확인한다.

## Field Test Docs

- 실제 선생님 테스트 진행 대본: `docs/product/teacher-field-test-playbook.md`
- AI 수업자료 제작 가이드: `docs/product/teacher-material-authoring-guide.md`
- 교사용 용어 설명 기준: `docs/product/teacher-help-glossary.md`
- 첫 방문 안내 모달 정책: `docs/product/onboarding-modal-policy.md`
