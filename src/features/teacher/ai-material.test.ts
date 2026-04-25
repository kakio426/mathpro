import { describe, expect, it } from "vitest";
import {
  buildEducationalSimulationPrompt,
  extractFirstHtmlDocument,
  parseAiMaterialOutput,
} from "./ai-material";

const promptInput = {
  concept: "mm, cm, m, km의 길이 감각을 주변 물건과 건물로 비교하기",
  difficulty: "standard",
  goal: "학생이 주변 사물과 길이 단위를 비교하며 양감을 얻는다.",
  gradeBand: "3-4",
  interactionKind: "html-artifact",
} as const;

describe("buildEducationalSimulationPrompt", () => {
  it("creates an educational simulation prompt from only the teaching topic", () => {
    const prompt = buildEducationalSimulationPrompt(promptInput);

    expect(prompt).toContain("엘리트 에듀테크 교사 & 풀스택 개발자");
    expect(prompt).toContain(promptInput.concept);
    expect(prompt).toContain("교사용 한 줄");
    expect(prompt).toContain("HTML 코드");
    expect(prompt).toContain("학습 질문");
    expect(prompt).toContain("대시보드");
    expect(prompt).toContain("재생/일시정지");
    expect(prompt).toContain("배속 조절");
    expect(prompt).toContain("window.parent.postMessage");
    expect(prompt).toContain("cdn.tailwindcss.com");
    expect(prompt).toContain("외부 이미지는 사용하지");
  });
});

describe("parseAiMaterialOutput", () => {
  it("extracts the teacher guide, html code block, and three learning questions", () => {
    const raw = `
1. 교사용 한 줄: 길이 단위를 교실 물건과 건물 크기에 빗대어 움직이며 비교하게 합니다.

2. HTML 코드:
\`\`\`html
<!doctype html>
<html lang="ko">
  <body>
    <h1>길이 단위 감각</h1>
  </body>
</html>
\`\`\`

3. 학습 질문:
1. mm와 cm는 어떤 물건으로 비교할 수 있나요?
2. m와 km를 같은 그림 안에서 비교하면 무엇이 달라 보이나요?
3. 단위가 커질수록 숫자는 어떻게 바뀌나요?
`;

    const parsed = parseAiMaterialOutput(raw);

    expect(parsed.teacherGuide).toBe(
      "길이 단위를 교실 물건과 건물 크기에 빗대어 움직이며 비교하게 합니다.",
    );
    expect(parsed.html).toContain("<h1>길이 단위 감각</h1>");
    expect(parsed.learningQuestions).toEqual([
      "mm와 cm는 어떤 물건으로 비교할 수 있나요?",
      "m와 km를 같은 그림 안에서 비교하면 무엇이 달라 보이나요?",
      "단위가 커질수록 숫자는 어떻게 바뀌나요?",
    ]);
    expect(parsed.rawText).toBe(raw);
  });

  it("extracts a raw html document even when it is not inside a code fence", () => {
    const html = `<!doctype html><html><body>자료</body></html>`;

    expect(extractFirstHtmlDocument(`여기부터 실행 자료입니다.\n${html}`)).toBe(
      html,
    );
  });

  it("returns a null html value when the AI response has no runnable document", () => {
    const parsed = parseAiMaterialOutput("교사용 한 줄: 아직 HTML이 없습니다.");

    expect(parsed.html).toBeNull();
  });
});
