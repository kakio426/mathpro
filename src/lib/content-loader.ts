import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  conceptNodeSchema,
  contentBundleSchema,
  lessonSpecSchema,
  loadedActivitySpecSchema,
  loadedLessonSpecSchema,
  markdownContentMapSchema,
  misconceptionRuleSchema,
  moduleManifestSchema,
  type ConceptNode,
  type ContentBundle,
  type LessonSpec,
  type LoadedActivitySpec,
  type LoadedLessonSpec,
  type MarkdownContentMap,
  type MarkdownRefMap,
  type MisconceptionRule,
  type ModuleManifest,
} from "../types/content";

export const DEFAULT_CONTENT_ROOT = path.resolve(process.cwd(), "content/v1");

export type ContentValidationIssue = {
  filePath: string;
  fieldPath: string;
  message: string;
};

export class ContentValidationError extends Error {
  issues: ContentValidationIssue[];

  constructor(issues: ContentValidationIssue[]) {
    super(formatValidationIssues(issues));
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

function toDisplayPath(filePath: string) {
  const relative = path.relative(process.cwd(), filePath);
  return relative && !relative.startsWith("..") ? relative : filePath;
}

function zodPathToString(pathValue: PropertyKey[]) {
  if (pathValue.length === 0) {
    return "";
  }

  return pathValue.map((segment) => String(segment)).join(".");
}

function pushIssue(
  issues: ContentValidationIssue[],
  filePath: string,
  fieldPath: string,
  message: string,
) {
  issues.push({
    filePath: toDisplayPath(filePath),
    fieldPath,
    message,
  });
}

export function formatValidationIssues(issues: ContentValidationIssue[]) {
  return issues
    .map((issue) => `${issue.filePath} :: ${issue.fieldPath || "<root>"} :: ${issue.message}`)
    .join("\n");
}

function readTextFile(filePath: string, issues: ContentValidationIssue[]) {
  if (!fs.existsSync(filePath)) {
    pushIssue(issues, filePath, "", "File does not exist.");
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}

function parseJsonFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  issues: ContentValidationIssue[],
) {
  const raw = readTextFile(filePath, issues);

  if (raw === null) {
    return null;
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    pushIssue(issues, filePath, "", message);
    return null;
  }

  const parsed = schema.safeParse(parsedJson);

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      pushIssue(issues, filePath, zodPathToString(issue.path), issue.message);
    });
    return null;
  }

  return parsed.data;
}

function assertNoIssues<T>(issues: ContentValidationIssue[], value: T) {
  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  return value;
}

function contentRootPaths(root: string) {
  const resolvedRoot = path.resolve(root);

  return {
    root: resolvedRoot,
    moduleFile: path.join(resolvedRoot, "module.json"),
    conceptsFile: path.join(resolvedRoot, "concepts.json"),
    misconceptionsFile: path.join(resolvedRoot, "misconceptions.json"),
    lessonsRoot: path.join(resolvedRoot, "lessons"),
  };
}

function checkUniqueIds(
  items: Array<{ id: string }>,
  filePath: string,
  collectionName: string,
  issues: ContentValidationIssue[],
) {
  const seen = new Set<string>();

  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      pushIssue(
        issues,
        filePath,
        `${collectionName}.${index}.id`,
        `Duplicate id "${item.id}" is not allowed.`,
      );
      return;
    }

    seen.add(item.id);
  });
}

function resolveMarkdownMap(
  refs: MarkdownRefMap,
  lessonDir: string,
  lessonFile: string,
  fieldBase: string,
  issues: ContentValidationIssue[],
) {
  const resolved: MarkdownContentMap = {};

  Object.entries(refs).forEach(([key, ref]) => {
    const fieldPath = fieldBase ? `${fieldBase}.${key}` : key;

    if (path.isAbsolute(ref)) {
      pushIssue(
        issues,
        lessonFile,
        fieldPath,
        "Markdown reference must be a relative path inside the lesson folder.",
      );
      return;
    }

    if (!ref.endsWith(".md")) {
      pushIssue(issues, lessonFile, fieldPath, "Markdown reference must end with .md.");
      return;
    }

    const resolvedPath = path.resolve(lessonDir, ref);
    const relative = path.relative(lessonDir, resolvedPath);

    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      pushIssue(
        issues,
        lessonFile,
        fieldPath,
        "Markdown reference cannot escape the lesson folder.",
      );
      return;
    }

    if (!fs.existsSync(resolvedPath)) {
      pushIssue(
        issues,
        resolvedPath,
        fieldPath,
        "Referenced markdown file does not exist.",
      );
      return;
    }

    resolved[key] = fs.readFileSync(resolvedPath, "utf8");
  });

  return resolved;
}

function loadLessonFromDirectory(
  lessonDir: string,
  issues: ContentValidationIssue[],
) {
  const lessonFile = path.join(lessonDir, "lesson.json");
  const lesson = parseJsonFile(lessonFile, lessonSpecSchema, issues);

  if (!lesson) {
    return null;
  }

  const lessonCopy = resolveMarkdownMap(
    lesson.copy,
    lessonDir,
    lessonFile,
    "copy",
    issues,
  );

  const activities: LoadedActivitySpec[] = lesson.activities.map((activity, index) =>
    loadedActivitySpecSchema.parse({
      ...activity,
      copy: resolveMarkdownMap(
        activity.copy,
        lessonDir,
        lessonFile,
        `activities.${index}.copy`,
        issues,
      ),
    }),
  );

  const loadedLesson = loadedLessonSpecSchema.parse({
    ...lesson,
    copy: markdownContentMapSchema.parse(lessonCopy),
    activities,
    sourcePath: toDisplayPath(lessonFile),
    sourceDir: toDisplayPath(lessonDir),
  });

  return {
    lesson,
    loadedLesson,
    lessonFile,
    lessonDir,
  };
}

function listLessonDirectories(lessonsRoot: string) {
  if (!fs.existsSync(lessonsRoot)) {
    return [];
  }

  return fs
    .readdirSync(lessonsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function compareManifestLessons(
  manifest: ModuleManifest,
  lessonDirs: string[],
  moduleFile: string,
  lessonsRoot: string,
  issues: ContentValidationIssue[],
) {
  const manifestSet = new Set(manifest.lessonOrder);
  const actualSet = new Set(lessonDirs);

  manifest.lessonOrder.forEach((slug, index) => {
    if (!actualSet.has(slug)) {
      pushIssue(
        issues,
        moduleFile,
        `lessonOrder.${index}`,
        `Lesson "${slug}" is listed in module.json but no lesson folder exists.`,
      );
    }
  });

  lessonDirs.forEach((slug) => {
    if (!manifestSet.has(slug)) {
      pushIssue(
        issues,
        path.join(lessonsRoot, slug),
        "",
        `Lesson folder "${slug}" is not declared in module.json lessonOrder.`,
      );
    }
  });
}

function validateCrossReferences(
  root: string,
  concepts: ConceptNode[],
  misconceptions: MisconceptionRule[],
  lessons: Array<{
    lesson: LessonSpec;
    loadedLesson: LoadedLessonSpec;
    lessonFile: string;
    lessonDir: string;
  }>,
  issues: ContentValidationIssue[],
) {
  const conceptsFile = path.join(root, "concepts.json");
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const misconceptionIds = new Set(
    misconceptions.map((misconception) => misconception.id),
  );
  const lessonSlugSources = new Map<string, string>();

  concepts.forEach((concept, conceptIndex) => {
    concept.prerequisiteIds.forEach((prerequisiteId, prerequisiteIndex) => {
      if (!conceptIds.has(prerequisiteId)) {
        pushIssue(
          issues,
          conceptsFile,
          `${conceptIndex}.prerequisiteIds.${prerequisiteIndex}`,
          `Unknown prerequisite concept id "${prerequisiteId}".`,
        );
      }
    });
  });

  lessons.forEach(({ lesson, lessonDir, lessonFile }) => {
    const folderName = path.basename(lessonDir);

    if (folderName !== lesson.slug) {
      pushIssue(
        issues,
        lessonFile,
        "slug",
        `Lesson slug "${lesson.slug}" must match its folder name "${folderName}".`,
      );
    }

    const existingPath = lessonSlugSources.get(lesson.slug);
    if (existingPath) {
      pushIssue(
        issues,
        lessonFile,
        "slug",
        `Duplicate lesson slug "${lesson.slug}" also appears in ${existingPath}.`,
      );
    } else {
      lessonSlugSources.set(lesson.slug, toDisplayPath(lessonFile));
    }

    lesson.conceptIds.forEach((conceptId, conceptIndex) => {
      if (!conceptIds.has(conceptId)) {
        pushIssue(
          issues,
          lessonFile,
          `conceptIds.${conceptIndex}`,
          `Unknown concept id "${conceptId}".`,
        );
      }
    });

    lesson.activities.forEach((activity, activityIndex) => {
      activity.misconceptionRuleIds.forEach((ruleId, ruleIndex) => {
        if (!misconceptionIds.has(ruleId)) {
          pushIssue(
            issues,
            lessonFile,
            `activities.${activityIndex}.misconceptionRuleIds.${ruleIndex}`,
            `Unknown misconception rule id "${ruleId}".`,
          );
        }
      });
    });
  });
}

export function loadModuleManifest(root: string = DEFAULT_CONTENT_ROOT) {
  const issues: ContentValidationIssue[] = [];
  const { moduleFile } = contentRootPaths(root);
  const manifest = parseJsonFile(moduleFile, moduleManifestSchema, issues);

  return assertNoIssues(issues, manifest) as ModuleManifest;
}

export function loadLessonSpec(
  lessonSlug: string,
  root: string = DEFAULT_CONTENT_ROOT,
) {
  const bundle = loadContentBundle(root);
  const lesson = bundle.lessons.find((entry) => entry.slug === lessonSlug);

  if (!lesson) {
    const { lessonsRoot } = contentRootPaths(root);
    throw new ContentValidationError([
      {
        filePath: toDisplayPath(path.join(lessonsRoot, lessonSlug)),
        fieldPath: "slug",
        message: `Lesson "${lessonSlug}" was not found in module.json lessonOrder.`,
      },
    ]);
  }

  return lesson;
}

export function loadContentBundle(root: string = DEFAULT_CONTENT_ROOT) {
  const issues: ContentValidationIssue[] = [];
  const { root: resolvedRoot, moduleFile, conceptsFile, misconceptionsFile, lessonsRoot } =
    contentRootPaths(root);

  const manifest = parseJsonFile(moduleFile, moduleManifestSchema, issues);
  const concepts = parseJsonFile(conceptsFile, z.array(conceptNodeSchema), issues);
  const misconceptions = parseJsonFile(
    misconceptionsFile,
    z.array(misconceptionRuleSchema),
    issues,
  );

  if (!manifest || !concepts || !misconceptions) {
    throw new ContentValidationError(issues);
  }

  checkUniqueIds(concepts, conceptsFile, "concepts", issues);
  checkUniqueIds(misconceptions, misconceptionsFile, "misconceptions", issues);

  const lessonDirNames = listLessonDirectories(lessonsRoot);
  compareManifestLessons(manifest, lessonDirNames, moduleFile, lessonsRoot, issues);

  const lessonDirSet = new Set(lessonDirNames);
  const orderedLessonDirNames = manifest.lessonOrder.filter((lessonSlug) =>
    lessonDirSet.has(lessonSlug),
  );

  const lessons = orderedLessonDirNames
    .map((lessonDirName) =>
      loadLessonFromDirectory(path.join(lessonsRoot, lessonDirName), issues),
    )
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  validateCrossReferences(
    resolvedRoot,
    concepts,
    misconceptions,
    lessons,
    issues,
  );

  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  return contentBundleSchema.parse({
    root: resolvedRoot,
    module: manifest,
    concepts,
    misconceptions,
    lessons: lessons.map((entry) => entry.loadedLesson),
  }) as ContentBundle;
}

export function validateContentRoot(root: string = DEFAULT_CONTENT_ROOT) {
  return loadContentBundle(root);
}
