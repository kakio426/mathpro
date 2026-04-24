# T6 Production QA

수학프로 T6의 목표는 실제 실행 환경에서 `제작 -> 발행 -> 학생 참여 -> 이벤트 저장 -> 완료 -> 학생/교사 리포트 -> 자료 재사용` 흐름을 한 번에 확인하는 것이다.

## Automated Smoke

아래 명령은 지정한 배포 URL에 실제 테스트 자료와 세션을 만든다. 운영 DB에 QA 데이터가 남으므로 대상 URL을 확인한 뒤 `--confirm-write`를 붙인다.

```bash
npm run qa:t6 -- --base-url https://your-app.vercel.app --confirm-write
```

로컬 production 서버에서 먼저 확인할 때는 아래 순서로 실행한다.

```bash
npm run build
npm run start -- -p 3010
npm run qa:t6 -- --base-url http://127.0.0.1:3010 --confirm-write
```

## Smoke Coverage

- `/` 제작실 접근
- `/join` 참여 코드 화면 접근
- `POST /api/teacher/activities/draft`
- `POST /api/teacher/activities/publish`
- `GET /api/assignments/[code]`
- `/play/[code]` 학생 실행 화면 접근
- `POST /api/assignments/[code]/sessions`
- `POST /api/sessions/[sessionId]/events`
- `POST /api/sessions/[sessionId]/complete`
- `GET /api/reports/[sessionId]`
- `GET /api/teacher/assignments/[assignmentId]/report`
- `/teacher/assignments/[assignmentId]` 교사 리포트 화면 접근
- `/?reuseAssignmentId=[assignmentId]` 자료 재사용 진입

## Manual Browser QA

자동 smoke가 통과한 뒤 브라우저에서 아래만 눈으로 확인한다.

1. 제작실에서 HTML 미리보기가 깨지지 않는다.
2. 발행 후 참여 코드가 교실에서 읽기 쉬운 크기로 보인다.
3. 학생 화면에서 조작 자료가 큰 무대처럼 보이고, 개발자용 설명이 노출되지 않는다.
4. 완료 후 학생 리포트로 이동한다.
5. 교사 리포트에 4블록 요약, 학생별 참여, 활동별 로그가 보인다.
6. `다시 수정해서 쓰기` 또는 `복제해서 수정`으로 제작실에 원본이 채워진다.

실제 선생님과 함께 테스트할 때는 `docs/product/teacher-field-test-playbook.md`의 진행 대본을 사용한다. 테스트용 HTML을 새로 만들 때는 `docs/product/teacher-material-authoring-guide.md`의 자료 제작 기준을 먼저 확인한다.

## Pass 기준

- 자동 smoke가 `T6 smoke completed.`로 끝난다.
- Supabase `published_assignments`, `learning_sessions`, `session_events`, `session_reports`에 QA 데이터가 생성된다.
- 브라우저 수동 QA에서 막히는 화면이 없다.

## Known Limits

- 현재는 교사 로그인과 자료 삭제가 없으므로 QA 데이터 정리는 Supabase에서 직접 수행한다.
- 교사 로그인, 자료 삭제, 학생 이름표, 학급 roster는 아직 범위 밖이다.
- Vercel 등 실제 배포 URL이 생기면 같은 smoke를 배포 환경에서 한 번 더 실행한다.
