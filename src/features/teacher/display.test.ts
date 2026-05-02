import { describe, expect, it } from "vitest";
import { toFriendlyHtmlArtifactSource } from "./display";

describe("teacher display helpers", () => {
  it("adds embedded fit rules that keep direct-manipulative artifact labels contained", () => {
    const html = `<!doctype html>
<html lang="ko">
<head></head>
<body>
  <main class="mp-app">
    <button type="button">활동 완료</button>
    <button type="button" class="pie"><strong>35%</strong></button>
  </main>
  <script>
    window.parent.postMessage({ source: "mathpro-html-activity", eventType: "ready" }, "*");
  </script>
</body>
</html>`;

    const source = toFriendlyHtmlArtifactSource(html, "원그래프와 중심각");

    expect(source).toContain("data-mathpro-embed-fit");
    expect(source).toContain(".mp-app button");
    expect(source).toContain("white-space: nowrap");
    expect(source).toContain(".mp-app .pie strong");
    expect(source).toContain("width: 68%");
  });
});
