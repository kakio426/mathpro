import { describe, expect, it } from "vitest";
import {
  validateHtmlArtifactSafety,
  withHtmlArtifactSafety,
} from "./safety";
import type { ActivityBlock } from "@/types/teacher";

const safeHtml = `<!doctype html>
<html>
  <body>
    <button id="submit">제출</button>
    <script>
      window.parent.postMessage({
        source: "mathpro-html-activity",
        eventType: "complete",
        payload: { isCorrect: true }
      }, "*");
    </script>
  </body>
</html>`;

function makeHtmlBlock(html: string): ActivityBlock {
  return {
    id: "html-artifact-1",
    type: "html-artifact",
    title: "HTML 자료",
    instruction: "자료를 실행합니다.",
    interactionKind: "html-artifact",
    html,
    analysisHooks: [
      {
        id: "html-artifact-1:manipulation-pattern",
        signal: "manipulation-pattern",
        label: "조작 패턴",
      },
    ],
  };
}

describe("validateHtmlArtifactSafety", () => {
  it("passes a self-contained artifact that only reports through postMessage", () => {
    const result = validateHtmlArtifactSafety(safeHtml);

    expect(result.status).toBe("passed");
    expect(result.warnings).toHaveLength(0);
  });

  it("blocks external network and storage access", () => {
    const result = validateHtmlArtifactSafety(`
      <script>
        localStorage.setItem("answer", "1/2");
        fetch("https://example.com/collect");
      </script>
    `);

    expect(result.status).toBe("blocked");
    expect(result.warnings.join(" ")).toContain("외부 네트워크 요청");
    expect(result.warnings.join(" ")).toContain("브라우저 저장소");
  });

  it("blocks external resources, javascript URLs, and automatic navigation", () => {
    const result = validateHtmlArtifactSafety(`
      <base href="https://example.com/" />
      <meta http-equiv="refresh" content="0;url=https://example.com" />
      <a href="javascript:alert('x')">실행</a>
      <img src="https://example.com/fraction.png" />
      <style>@import "https://example.com/theme.css";</style>
    `);

    expect(result.status).toBe("blocked");
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "base-tag",
        "external-resource",
        "javascript-url",
        "meta-refresh",
      ]),
    );
  });

  it("blocks browser permission APIs and hidden dynamic execution", () => {
    const result = validateHtmlArtifactSafety(`
      <button onclick="navigator.clipboard.writeText('answer')">복사</button>
      <script>
        document.write("<p>late</p>");
        setTimeout("alert(1)", 10);
        navigator.geolocation.getCurrentPosition(() => {});
      </script>
    `);

    expect(result.status).toBe("blocked");
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "browser-permission-api",
        "dynamic-code-execution",
        "inline-event-handler",
      ]),
    );
  });

  it("warns when artifact events are missing or incomplete", () => {
    const noBridge = validateHtmlArtifactSafety(`
      <button>분수 막대 선택</button>
    `);
    const noComplete = validateHtmlArtifactSafety(`
      <script>
        window.parent.postMessage({
          source: "mathpro-html-activity",
          eventType: "select",
          payload: { selectedParts: [1] }
        }, "*");
      </script>
    `);
    const missingSource = validateHtmlArtifactSafety(`
      <script>
        window.parent.postMessage({ eventType: "complete" }, "*");
      </script>
    `);

    expect(noBridge.status).toBe("warning");
    expect(noBridge.issues.map((issue) => issue.code)).toContain(
      "missing-postmessage",
    );
    expect(noComplete.status).toBe("warning");
    expect(noComplete.issues.map((issue) => issue.code)).toContain(
      "missing-complete-event",
    );
    expect(missingSource.status).toBe("warning");
    expect(missingSource.issues.map((issue) => issue.code)).toContain(
      "missing-postmessage-source",
    );
  });

  it("adds safety fields to html artifact blocks", () => {
    const block = withHtmlArtifactSafety(makeHtmlBlock(safeHtml));

    expect(block.safetyStatus).toBe("passed");
    expect(block.safetyWarnings).toEqual([]);
  });
});
