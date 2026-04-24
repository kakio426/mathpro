type JsonRecord = Record<string, unknown>;

type SmokeOptions = {
  baseUrl: string;
  confirmWrite: boolean;
};

const sampleHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #fff8ed; color: #18322e; }
    main { max-width: 720px; margin: 0 auto; padding: 24px; }
    button { border: 1px solid #0b5f59; border-radius: 14px; background: white; padding: 14px 18px; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <h1>T6 QA 분수 막대</h1>
    <p>전체를 4칸으로 보고 2칸을 골라 보세요.</p>
    <button id="select" type="button">2칸 선택</button>
    <button id="submit" type="button">제출</button>
    <button id="complete" type="button">완료</button>
  </main>
  <script>
    const source = "mathpro-html-activity";
    const send = (eventType, payload) => {
      window.parent.postMessage({ source, type: eventType, eventType, blockId: "t6-html-artifact", payload }, "*");
    };
    send("ready", { title: "T6 QA 분수 막대" });
    document.querySelector("#select").addEventListener("click", () => send("select", { selectedParts: [0, 1], response: "2/4" }));
    document.querySelector("#submit").addEventListener("click", () => send("submit", { isCorrect: true, response: "2/4", misconceptionSignal: null }));
    document.querySelector("#complete").addEventListener("click", () => send("complete", { isCorrect: true }));
  </script>
</body>
</html>`;

function parseArgs(argv: string[]): SmokeOptions {
  const baseUrlIndex = argv.indexOf("--base-url");
  const baseUrl =
    baseUrlIndex >= 0 ? argv[baseUrlIndex + 1] : process.env.MATHPRO_BASE_URL;
  const confirmWrite =
    argv.includes("--confirm-write") || process.env.MATHPRO_CONFIRM_WRITE === "1";

  if (!baseUrl) {
    throw new Error(
      "Missing --base-url. Example: npm run qa:t6 -- --base-url https://your-app.vercel.app --confirm-write",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    confirmWrite,
  };
}

function requireConfirmedWrite(options: SmokeOptions) {
  if (options.confirmWrite) {
    return;
  }

  throw new Error(
    "T6 smoke creates a real test assignment/session. Re-run with --confirm-write after checking the target URL.",
  );
}

function pathUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJson<T>(response: Response, context: string): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      `${context} failed with ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload as T;
}

async function assertPageOk(url: string, context: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${context} failed with ${response.status}`);
  }

  console.log(`PASS ${context}`);
}

async function postJson<T>({
  url,
  body,
  cookie,
  context,
}: {
  url: string;
  body: JsonRecord;
  cookie?: string;
  context: string;
}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });

  return {
    payload: await readJson<T>(response, context),
    response,
  };
}

function extractCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Session start did not return a guest cookie.");
  }

  return setCookie.split(";")[0] ?? setCookie;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  requireConfirmedWrite(options);

  const startedAt = new Date().toISOString();
  const title = `T6 QA ${startedAt}`;

  console.log(`T6 smoke target: ${options.baseUrl}`);
  await assertPageOk(pathUrl(options.baseUrl, "/"), "home page");
  await assertPageOk(pathUrl(options.baseUrl, "/join"), "join page");

  const draft = await postJson<{
    document: JsonRecord;
  }>({
    url: pathUrl(options.baseUrl, "/api/teacher/activities/draft"),
    context: "create draft",
    body: {
      gradeBand: "3-4",
      concept: "T6 QA 분수의 의미",
      goal: "실제 배포 환경에서 제작, 발행, 참여, 리포트 흐름이 연결되는지 확인한다.",
      interactionKind: "html-artifact",
      difficulty: "standard",
      sourceLessonSlug: "whole-and-part",
      html: sampleHtml,
      promptTemplate: "T6 QA용 HTML 자료를 생성한다.",
    },
  });
  console.log("PASS create draft");

  const document = {
    ...draft.payload.document,
    title,
  };
  const publish = await postJson<{
    assignment: {
      id: string;
      code: string;
      shareUrl: string;
    };
  }>({
    url: pathUrl(options.baseUrl, "/api/teacher/activities/publish"),
    context: "publish assignment",
    body: {
      document,
    },
  });
  const { assignment } = publish.payload;
  console.log(`PASS publish assignment (${assignment.code})`);

  await assertPageOk(
    pathUrl(options.baseUrl, `/api/assignments/${assignment.code}`),
    "load assignment API",
  );
  await assertPageOk(
    pathUrl(options.baseUrl, `/play/${assignment.code}`),
    "student play page",
  );

  const startSession = await postJson<{
    sessionId: string;
    status: "started";
  }>({
    url: pathUrl(options.baseUrl, `/api/assignments/${assignment.code}/sessions`),
    context: "start assignment session",
    body: {},
  });
  const cookie = extractCookie(startSession.response);
  const { sessionId } = startSession.payload;
  console.log(`PASS start assignment session (${sessionId})`);

  const eventTs = new Date().toISOString();
  await postJson({
    url: pathUrl(options.baseUrl, `/api/sessions/${sessionId}/events`),
    context: "append select event",
    cookie,
    body: {
      clientEventId: `t6-select-${Date.now()}`,
      activityId: "t6-html-artifact",
      eventType: "select",
      payload: {
        selectedParts: [0, 1],
        response: "2/4",
        artifactEventType: "select",
        blockId: "t6-html-artifact",
        assignmentCode: assignment.code,
      },
      clientTs: eventTs,
    },
  });
  console.log("PASS append select event");

  await postJson({
    url: pathUrl(options.baseUrl, `/api/sessions/${sessionId}/events`),
    context: "append submit event",
    cookie,
    body: {
      clientEventId: `t6-submit-${Date.now()}`,
      activityId: "t6-html-artifact",
      eventType: "submit",
      payload: {
        isCorrect: true,
        response: "2/4",
        misconceptionSignal: null,
        artifactEventType: "submit",
        blockId: "t6-html-artifact",
        assignmentCode: assignment.code,
      },
      clientTs: new Date().toISOString(),
    },
  });
  console.log("PASS append submit event");

  const complete = await postJson<{
    status: "completed";
    reportStatus: "ready" | "failed" | "pending";
  }>({
    url: pathUrl(options.baseUrl, `/api/sessions/${sessionId}/complete`),
    context: "complete session",
    cookie,
    body: {
      clientEventId: `t6-complete-${Date.now()}`,
      clientTs: new Date().toISOString(),
    },
  });

  if (complete.payload.status !== "completed") {
    throw new Error(`Unexpected session status: ${complete.payload.status}`);
  }
  console.log(`PASS complete session (${complete.payload.reportStatus})`);

  const studentReport = await fetch(
    pathUrl(options.baseUrl, `/api/reports/${sessionId}`),
    {
      headers: {
        Cookie: cookie,
      },
    },
  );
  await readJson(studentReport, "load student report");
  console.log("PASS load student report API");

  const teacherReport = await fetch(
    pathUrl(options.baseUrl, `/api/teacher/assignments/${assignment.id}/report`),
  );
  await readJson(teacherReport, "load teacher report");
  console.log("PASS load teacher report API");

  await assertPageOk(
    pathUrl(options.baseUrl, `/teacher/assignments/${assignment.id}`),
    "teacher report page",
  );
  await assertPageOk(
    pathUrl(options.baseUrl, `/?reuseAssignmentId=${assignment.id}`),
    "reuse source page",
  );

  console.log("T6 smoke completed.");
  console.log(`Assignment code: ${assignment.code}`);
  console.log(`Share URL: ${assignment.shareUrl}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
