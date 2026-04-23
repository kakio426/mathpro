import { expect, test } from "@playwright/test";

test("home, lab, and report shells render", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "분수 개념을 문제풀이가 아니라 사고의 흐름으로 설계하는 수학프로",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "학습 셸 보기" }).click();
  await expect(page).toHaveURL(/\/lab\/whole-and-part$/);
  await expect(
    page.getByRole("heading", { name: "전체와 부분 | 수학프로 학습 셸" }),
  ).toBeVisible();

  await page.goto("/report/demo-session");
  await expect(
    page.getByRole("heading", { name: "수학프로 학습 리포트" }),
  ).toBeVisible();
  await expect(page.getByText("/report/demo-session")).toBeVisible();
});
