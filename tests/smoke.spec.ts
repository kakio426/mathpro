import { expect, test, type Page } from "@playwright/test";

async function mockLessonSession(
  page: Page,
  options: {
    sessionId: string;
    lessonSlug: string;
    reportStatus: "ready" | "failed";
  },
) {
  const { sessionId, lessonSlug, reportStatus } = options;

  await page.route("**/api/sessions", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId,
        guestId: "guest-e2e",
        lessonSlug,
        status: "started",
        reportStatus: "pending",
      }),
    });
  });

  await page.route(`**/api/sessions/${sessionId}/events`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        duplicated: false,
      }),
    });
  });

  await page.route(`**/api/sessions/${sessionId}/complete`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId,
        status: "completed",
        reportStatus,
      }),
    });
  });

  await page.route(`**/api/reports/${sessionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        reportStatus === "ready"
          ? {
              sessionId,
              status: "ready",
              summaryJson: {
                understoodConcepts: ["전체와 같은 크기 부분"],
                watchMisconceptions: ["현재 뚜렷한 오개념 없음"],
                explanationSummary:
                  "전체를 같은 크기로 나누고 일부를 고른 상황이에요.",
                recommendedNextLessonId: "denominator-and-numerator",
                recommendedNextLessonTitle: "분모와 분자",
              },
              generatedAt: "2026-04-23T12:00:00.000Z",
            }
          : {
              sessionId,
              status: "failed",
              summaryJson: null,
              generatedAt: null,
            },
      ),
    });
  });
}

async function dismissAutoGuideIfVisible(page: Page) {
  const dialog = page.getByRole("dialog");

  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
}

test("whole-and-part lesson runs end-to-end and redirects to report", async ({ page }) => {
  await mockLessonSession(page, {
    sessionId: "session-whole",
    lessonSlug: "whole-and-part",
    reportStatus: "ready",
  });
  await page.goto("/lab/whole-and-part");

  await expect(
    page.getByRole("heading", { name: "전체와 부분 | 수학프로 학습" }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: /전체를 같은 크기로 나누고 일부를 고른다\./,
    })
    .click();
  await page.getByRole("button", { name: "제출하기" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByRole("button", { name: "1번째 조각 선택" }).click();
  await page.getByRole("button", { name: "2번째 조각 선택" }).click();
  await page.getByRole("button", { name: "제출하기" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByRole("button", { name: /2\/4/ }).click();
  await page.getByRole("button", { name: "제출하기" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await page.getByRole("textbox", { name: "설명 입력" }).fill(
    "전체를 4조각으로 똑같이 나누고 2조각을 골랐기 때문이에요.",
  );
  await page.getByRole("button", { name: "제출하기" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await page
    .getByRole("button", {
      name: /A 같은 크기로 나눈 전체 중 일부를 고른 상황/,
    })
    .click();
  await page.getByRole("button", { name: "제출하기" }).click();

  await expect(page).toHaveURL(/\/report\/session-whole$/);
  await expect(
    page.getByRole("heading", { name: "수학프로 학습 리포트" }),
  ).toBeVisible();
  await expect(page.getByText("준비 완료")).toBeVisible();
  await expect(page.getByText("분모와 분자")).toBeVisible();
});

test("teacher creates a draft and publishes an assignment code", async ({ page }) => {
  const now = "2026-04-24T00:00:00.000Z";
  let draftRequest: Record<string, unknown> | null = null;
  let publishRequest: unknown = null;
  const document = {
    id: "draft-e2e",
    title: "분수의 의미 인터랙티브 탐구",
    gradeBand: "3-4",
    concept: "분수의 의미",
    goal: "전체를 같은 크기로 나눈 것 중 일부라는 분수의 의미를 조작으로 설명한다.",
    difficulty: "standard",
    sourceLessonSlug: "whole-and-part",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: "L1-A1",
        type: "intro",
        title: "출발점 확인",
        instruction: "분수가 되려면 어떤 설명이 먼저 맞아야 할까요?",
        sourceActivityId: "L1-A1",
        analysisHooks: [
          {
            id: "L1-A1:incorrect-final",
            signal: "incorrect-final",
            label: "마지막 제출에서 개념 연결이 흔들림",
          },
        ],
      },
      {
        id: "L1-A2",
        type: "manipulation",
        title: "직접 만져보는 탐구",
        instruction: "막대를 4등분한 뒤 2칸을 선택해 2/4를 만들어 보세요.",
        interactionKind: "fraction-bars",
        sourceActivityId: "L1-A2",
        analysisHooks: [
          {
            id: "L1-A2:manipulation-pattern",
            signal: "manipulation-pattern",
            label: "조작 순서와 선택 패턴 관찰",
          },
        ],
      },
    ],
  };

  await page.route("**/api/teacher/activities/draft", async (route) => {
    draftRequest = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        document: {
          ...document,
          creatorName: draftRequest.creatorName,
        },
      }),
    });
  });

  await page.route("**/api/teacher/activities/publish", async (route) => {
    publishRequest = route.request().postDataJSON();
    const publishPayload = publishRequest as {
      document?: Record<string, unknown>;
    };
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        assignment: {
          id: "assignment-e2e",
          activityId: "activity-e2e",
          code: "ABC123",
          status: "active",
          publishedAt: now,
          shareUrl: "http://localhost:3000/play/ABC123",
          document: {
            ...document,
            id: "activity-e2e",
            creatorName: publishPayload.document?.creatorName,
            status: "published",
          },
        },
      }),
    });
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("mathpro:tour:teacher-workspace", "seen");
  });
  await page.goto("/");
  await dismissAutoGuideIfVisible(page);

  await expect(
    page.getByRole("heading", {
      name: "어떤 수업자료를 만들까요?",
    }),
  ).toBeVisible();
  await expect(page.getByText("고급 설정")).toHaveCount(0);
  await page
    .getByLabel("만들고 싶은 자료")
    .fill("초등 4학년 분수 막대 만들기");
  await page.getByRole("button", { name: "AI 요청문 만들기" }).click();
  await expect(page.getByText("요청문이 준비됐습니다.")).toBeVisible();
  await page.getByRole("button", { name: "요청문 복사하기" }).click();
  await page.getByRole("button", { name: "AI 결과 가져오기" }).click();
  await page.getByLabel("AI가 만든 자료").fill(`
    1. 교사용 한 줄: 분수 막대를 직접 눌러 전체와 부분의 관계를 확인하게 합니다.

    2. HTML 코드:
    \`\`\`html
    <!doctype html>
    <html>
      <body>
        <main>
          <h1>분수 막대 만들기</h1>
          <button>완료하기</button>
        </main>
      </body>
    </html>
    \`\`\`

    3. 학습 질문:
    1. 전체는 몇 조각으로 나누어져 있나요?
    2. 선택한 부분은 전체 중 얼마인가요?
    3. 조각의 크기가 같지 않으면 왜 분수로 말하기 어려울까요?
  `);
  await page.getByRole("button", { name: "미리보기로 가져오기" }).click();
  await expect(page.getByText("수업에서 이렇게 활용하세요")).toBeVisible();
  await expect(page.getByText("학습 질문")).toBeVisible();
  await page.getByText("공유 자료실 표시 이름 바꾸기").click();
  await page
    .getByLabel("공유 자료실 표시 이름")
    .fill("김수학 선생님");
  await page.getByRole("button", { name: /발행 준비하기/ }).click();
  await expect(page.getByRole("button", { name: /참여 코드 만들기/ })).toBeVisible();
  await page.getByRole("button", { name: /참여 코드 만들기/ }).click();
  expect(draftRequest).toMatchObject({
    creatorName: "김수학 선생님",
  });
  expect(
    (publishRequest as { document?: Record<string, unknown> } | null)?.document
      ?.creatorName,
  ).toBe("김수학 선생님");
  await expect(page.getByText("ABC123")).toBeVisible();
  await expect(page.getByText("내 자료에 저장됐습니다")).toBeVisible();
  await expect(page.getByRole("link", { name: /공유 자료실 보기/ })).toHaveAttribute(
    "href",
    "/library",
  );
  await expect(page.getByRole("link", { name: /내 자료에서 보기/ })).toHaveAttribute(
    "href",
    "/teacher/activities/assignment-e2e",
  );
  await expect(page.locator('a[href="/play/ABC123"]').first()).toHaveAttribute(
    "href",
    "/play/ABC123",
  );
});

test("HTML artifact play route stores iframe events and completes through the bridge", async ({
  page,
}) => {
  const sessionId = "session-html-e2e";
  const eventRequests: unknown[] = [];
  const completeRequests: unknown[] = [];

  await page.route("**/api/assignments/HTML01/sessions", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId,
        guestId: "guest-html-e2e",
        lessonSlug: "whole-and-part",
        assignmentId: "assignment-html-e2e",
        assignmentCode: "HTML01",
        status: "started",
        reportStatus: "pending",
      }),
    });
  });

  await page.route(`**/api/sessions/${sessionId}/events`, async (route) => {
    eventRequests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        duplicated: false,
      }),
    });
  });

  await page.route(`**/api/sessions/${sessionId}/complete`, async (route) => {
    completeRequests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId,
        status: "completed",
        reportStatus: "ready",
      }),
    });
  });

  await page.route(`**/api/reports/${sessionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId,
        status: "ready",
        summaryJson: {
          understoodConcepts: ["전체와 부분"],
          watchMisconceptions: ["현재 뚜렷한 오개념 없음"],
          explanationSummary:
            "HTML 자료 안에서 분수 막대를 조작해 전체와 부분을 연결했습니다.",
          recommendedNextLessonId: "denominator-and-numerator",
          recommendedNextLessonTitle: "분모와 분자",
        },
        generatedAt: "2026-04-24T00:00:00.000Z",
      }),
    });
  });

  await page.goto("/play/HTML01");
  await dismissAutoGuideIfVisible(page);

  await expect(
    page.getByRole("heading", { name: "분수 막대 조작 자료" }),
  ).toBeVisible();

  const artifactFrame = page.frameLocator(
    'iframe[title="분수 막대 실험 화면"]',
  );
  await artifactFrame.getByRole("button", { name: "첫 번째 조각 선택" }).click();

  await expect
    .poll(
      () =>
        eventRequests.some(
          (request) =>
            typeof request === "object" &&
            request !== null &&
            "eventType" in request &&
            request.eventType === "select",
        ),
    )
    .toBe(true);
  const selectRequest = eventRequests.find(
    (request) =>
      typeof request === "object" &&
      request !== null &&
      "eventType" in request &&
      request.eventType === "select",
  );

  expect(selectRequest).toMatchObject({
    activityId: "html-artifact-e2e",
    eventType: "select",
    payload: {
      selectedParts: [1],
      response: "1/4",
      artifactEventType: "select",
      blockId: "html-artifact-e2e",
      assignmentCode: "HTML01",
    },
  });

  await artifactFrame.getByRole("button", { name: "완료하기" }).click();

  await expect.poll(() => completeRequests.length).toBe(1);
  await expect(page).toHaveURL(/\/report\/session-html-e2e$/);
  await expect(page.getByText("준비 완료")).toBeVisible();
  await expect(page.getByText("분모와 분자")).toBeVisible();
});

test("fractions-on-a-number-line lesson handles the slider interaction and advances into prediction", async ({
  page,
}) => {
  await mockLessonSession(page, {
    sessionId: "session-number-line",
    lessonSlug: "fractions-on-a-number-line",
    reportStatus: "ready",
  });
  await page.goto("/lab/fractions-on-a-number-line");

  await page.getByRole("button", { name: /가운데 지점/ }).click();
  await page.getByRole("button", { name: "제출하기" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  const slider = page.getByRole("slider", { name: "3/4 위치 슬라이더" });
  await slider.focus();
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await expect(page.getByText("지금은 3/4 지점을 가리키고 있어요.")).toBeVisible();
  await page.getByRole("button", { name: "제출하기" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await expect(
    page.getByText("0과 1 사이를 5등분했다면 1/5는 어디에 가장 가까울까요?"),
  ).toBeVisible();
  await page.getByRole("button", { name: /0 바로 다음 칸/ }).click();
  await page.getByRole("button", { name: "제출하기" }).click();
  await expect(
    page.getByText("잘했어요. 다음 단계로 넘어가 볼까요?"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "다음", exact: true }),
  ).toBeVisible();
});

test("report page shows the failed diagnostics state", async ({ page }) => {
  await page.route("**/api/reports/session-failed", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: "session-failed",
        status: "failed",
        summaryJson: null,
        generatedAt: null,
      }),
    });
  });

  await page.goto("/report/session-failed");

  await expect(
    page.getByRole("heading", { name: "수학프로 학습 리포트" }),
  ).toBeVisible();
  await expect(page.getByText("생성 실패")).toBeVisible();
  await expect(
    page.getByText("리포트 생성 중 오류가 발생했습니다."),
  ).toBeVisible();
});
