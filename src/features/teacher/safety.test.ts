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

  it("recognizes a helper call that sends the complete event", () => {
    const result = validateHtmlArtifactSafety(`
      <script>
        const send = (eventType, payload) => {
          window.parent.postMessage({
            source: "mathpro-html-activity",
            type: eventType,
            eventType,
            payload
          }, "*");
        };

        send("complete", { isCorrect: true });
      </script>
    `);

    expect(result.status).toBe("passed");
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

  it("blocks javascript URLs and automatic navigation", () => {
    const result = validateHtmlArtifactSafety(`
      <base href="https://example.com/" />
      <meta http-equiv="refresh" content="0;url=https://example.com" />
      <a href="javascript:alert('x')">실행</a>
    `);

    expect(result.status).toBe("blocked");
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "base-tag",
        "javascript-url",
        "meta-refresh",
      ]),
    );
  });

  it("allows CDN and external resources without blocking publish", () => {
    const result = validateHtmlArtifactSafety(`
      <!doctype html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
          <script src="https://unpkg.com/some-library/index.js"></script>
          <link rel="stylesheet" href="https://example.com/theme.css" />
        </head>
        <body>
          <img src="https://example.com/ruler.png" alt="자" />
          <button id="complete">완료</button>
          <script>
            window.parent.postMessage({
              source: "mathpro-html-activity",
              eventType: "complete",
              payload: { isCorrect: true }
            }, "*");
          </script>
        </body>
      </html>
    `);

    expect(result.status).toBe("warning");
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["external-script", "external-resource"]),
    );
    expect(result.warnings.join(" ")).toContain("인터넷 연결이 필요할 수 있습니다");
  });

  it("allows ordinary CSS position words while still blocking top window access", () => {
    const cssOnly = validateHtmlArtifactSafety(`
      <style>
        .marker { position: absolute; top: 12px; margin-top: 8px; }
      </style>
      <script>
        const send = (eventType, payload) => {
          window.parent.postMessage({
            source: "mathpro-html-activity",
            eventType,
            payload
          }, "*");
        };
        send("complete", {});
      </script>
    `);
    const topWindowAccess = validateHtmlArtifactSafety(`
      <script>
        window.top.location.href = "https://example.com";
      </script>
    `);

    expect(cssOnly.status).toBe("passed");
    expect(topWindowAccess.status).toBe("blocked");
    expect(topWindowAccess.issues.map((issue) => issue.code)).toContain(
      "top-navigation",
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
