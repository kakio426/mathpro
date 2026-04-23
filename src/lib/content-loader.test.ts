import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ContentValidationError,
  DEFAULT_CONTENT_ROOT,
  loadContentBundle,
  loadLessonSpec,
  validateContentRoot,
} from "./content-loader";

const validFixtureRoot = path.resolve(
  process.cwd(),
  "tests/fixtures/content-valid",
);
const invalidFixtureRoot = path.resolve(
  process.cwd(),
  "tests/fixtures/content-invalid",
);

function cloneFixture(sourceRoot: string) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codemini-content-"));
  fs.cpSync(sourceRoot, tempRoot, { recursive: true });
  return tempRoot;
}

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

describe("content-loader", () => {
  it("loads a valid content bundle", () => {
    const bundle = loadContentBundle(validFixtureRoot);

    expect(bundle.module.id).toBe("fixture-fraction-lab");
    expect(bundle.lessons).toHaveLength(1);
    expect(bundle.lessons[0]?.copy.intro).toContain("분수는");
  });

  it("returns lessons in module.lessonOrder", () => {
    const bundle = loadContentBundle(DEFAULT_CONTENT_ROOT);

    expect(bundle.lessons.map((lesson) => lesson.slug)).toEqual(
      bundle.module.lessonOrder,
    );
  });

  it("fails when a misconception rule reference is missing", () => {
    const root = cloneFixture(validFixtureRoot);
    const lessonPath = path.join(root, "lessons", "whole-and-part", "lesson.json");
    const lesson = readJson<Record<string, unknown>>(lessonPath);
    const activities = lesson.activities as Array<Record<string, unknown>>;

    activities[0] = {
      ...activities[0],
      misconceptionRuleIds: ["M999"],
    };

    writeJson(lessonPath, { ...lesson, activities });

    try {
      validateContentRoot(root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("Unknown misconception rule id");
      expect(String(error)).toContain("M999");
    }
  });

  it("fails when a concept reference is missing", () => {
    const root = cloneFixture(validFixtureRoot);
    const lessonPath = path.join(root, "lessons", "whole-and-part", "lesson.json");
    const lesson = readJson<Record<string, unknown>>(lessonPath);

    writeJson(lessonPath, {
      ...lesson,
      conceptIds: ["C999"],
    });

    try {
      validateContentRoot(root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("Unknown concept id");
      expect(String(error)).toContain("C999");
    }
  });

  it("fails to load a single lesson when concept references are invalid", () => {
    const root = cloneFixture(validFixtureRoot);
    const lessonPath = path.join(root, "lessons", "whole-and-part", "lesson.json");
    const lesson = readJson<Record<string, unknown>>(lessonPath);

    writeJson(lessonPath, {
      ...lesson,
      conceptIds: ["C999"],
    });

    try {
      loadLessonSpec("whole-and-part", root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("Unknown concept id");
      expect(String(error)).toContain("C999");
    }
  });

  it("fails when kind-specific props are missing", () => {
    const root = cloneFixture(validFixtureRoot);
    const lessonPath = path.join(root, "lessons", "whole-and-part", "lesson.json");
    const lesson = readJson<Record<string, unknown>>(lessonPath);
    const activities = lesson.activities as Array<Record<string, unknown>>;
    const props = {
      ...((activities[1]?.props as Record<string, unknown>) ?? {}),
    };

    delete props.partitionCount;

    activities[1] = {
      ...activities[1],
      props,
    };

    writeJson(lessonPath, { ...lesson, activities });

    try {
      validateContentRoot(root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("partitionCount");
    }
  });

  it("fails when a markdown file is missing", () => {
    const root = cloneFixture(validFixtureRoot);
    const lessonPath = path.join(root, "lessons", "whole-and-part", "lesson.json");
    const lesson = readJson<Record<string, unknown>>(lessonPath);

    writeJson(lessonPath, {
      ...lesson,
      copy: {
        intro: "copy/missing.md",
      },
    });

    try {
      validateContentRoot(root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("Referenced markdown file does not exist");
    }
  });

  it("fails when lesson slugs are duplicated", () => {
    const root = cloneFixture(validFixtureRoot);
    const modulePath = path.join(root, "module.json");
    const duplicateDir = path.join(root, "lessons", "whole-and-part-copy");

    fs.cpSync(path.join(root, "lessons", "whole-and-part"), duplicateDir, {
      recursive: true,
    });

    const moduleJson = readJson<Record<string, unknown>>(modulePath);
    const lessonOrder = moduleJson.lessonOrder as string[];
    writeJson(modulePath, {
      ...moduleJson,
      lessonOrder: [...lessonOrder, "whole-and-part-copy"],
    });

    try {
      validateContentRoot(root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("Duplicate lesson slug");
    }
  });

  it("fails when the frozen stage flow is incomplete", () => {
    const root = cloneFixture(validFixtureRoot);
    const lessonPath = path.join(root, "lessons", "whole-and-part", "lesson.json");
    const lesson = readJson<Record<string, unknown>>(lessonPath);
    const activities = lesson.activities as Array<Record<string, unknown>>;

    writeJson(lessonPath, {
      ...lesson,
      activities: [activities[0]],
    });

    try {
      validateContentRoot(root);
      throw new Error("Expected validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect(String(error)).toContain("exactly one activity for each stage");
      expect(String(error)).toContain("pre-diagnosis -> manipulation -> prediction");
    }
  });

  it("passes CLI validation for a valid root", () => {
    const result = spawnSync(
      "npm",
      ["run", "content:check", "--", "--root", validFixtureRoot],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Validated content root");
  });

  it("fails CLI validation for an invalid root", () => {
    const result = spawnSync(
      "npm",
      ["run", "content:check", "--", "--root", invalidFixtureRoot],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "tests/fixtures/content-invalid/lessons/broken-whole-and-part/lesson.json",
    );
    expect(result.stderr).toContain("partitionCount");
  });
});
