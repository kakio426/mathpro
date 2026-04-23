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
