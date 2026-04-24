import { describe, expect, it } from "vitest";
import { validateHtmlArtifactSafety } from "./safety";
import {
  createDraftRequestFromTemplate,
  teacherHtmlTemplates,
} from "./html-templates";

describe("teacherHtmlTemplates", () => {
  it("includes the core classroom-ready sample set", () => {
    expect(teacherHtmlTemplates.map((template) => template.id)).toEqual([
      "fraction-bars",
      "number-line",
      "same-whole-sort",
      "symbol-meaning-matching",
    ]);
  });

  it("keeps every sample publishable by the HTML safety checker", () => {
    for (const template of teacherHtmlTemplates) {
      expect(validateHtmlArtifactSafety(template.html)).toMatchObject({
        status: "passed",
        warnings: [],
      });
    }
  });

  it("turns a template into a draft request with editable HTML", () => {
    const numberLineTemplate = teacherHtmlTemplates.find(
      (template) => template.id === "number-line",
    );

    expect(numberLineTemplate).toBeDefined();

    const draft = createDraftRequestFromTemplate(numberLineTemplate!);

    expect(draft).toMatchObject({
      concept: "수직선 위 분수",
      interactionKind: "number-line",
      sourceLessonSlug: "fractions-on-a-number-line",
    });
    expect(draft.html).toContain("수직선에서 3/4 찾기");
  });
});

