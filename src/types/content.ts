import { z } from "zod";

export const gradeBandSchema = z.literal("3-4");
export type GradeBand = z.infer<typeof gradeBandSchema>;

export const mathDomainSchema = z.literal("number-and-operations");
export type MathDomain = z.infer<typeof mathDomainSchema>;

export const sessionStageSchema = z.enum([
  "pre-diagnosis",
  "manipulation",
  "prediction",
  "explanation",
  "generalization",
  "report",
]);
export type SessionStage = z.infer<typeof sessionStageSchema>;

export const lessonActivityStageSchema = z.enum([
  "pre-diagnosis",
  "manipulation",
  "prediction",
  "explanation",
  "generalization",
]);
export type LessonActivityStage = z.infer<typeof lessonActivityStageSchema>;

export const requiredLessonActivityStages = [
  "pre-diagnosis",
  "manipulation",
  "prediction",
  "explanation",
  "generalization",
] as const satisfies readonly LessonActivityStage[];

export const activityKindSchema = z.enum([
  "fraction-bars",
  "number-line",
  "multiple-choice",
  "free-text",
]);
export type ActivityKind = z.infer<typeof activityKindSchema>;

export const semanticEventTypeSchema = z.enum([
  "select",
  "drag-end",
  "drop",
  "submit",
  "hint-open",
  "retry",
  "free-text-submit",
  "complete",
]);
export type SemanticEventType = z.infer<typeof semanticEventTypeSchema>;

export const diagnosticSignalSchema = z.enum([
  "correctness",
  "attempt-count",
  "time-to-first-submit",
  "hint-usage-count",
  "self-correction-after-retry",
  "explanation-submitted",
]);
export type DiagnosticSignal = z.infer<typeof diagnosticSignalSchema>;

export const markdownRefMapSchema = z.record(
  z.string().min(1),
  z.string().min(1),
);
export type MarkdownRefMap = z.infer<typeof markdownRefMapSchema>;

export const markdownContentMapSchema = z.record(
  z.string().min(1),
  z.string(),
);
export type MarkdownContentMap = z.infer<typeof markdownContentMapSchema>;

export const sessionFlowSchema = z
  .array(sessionStageSchema)
  .length(6)
  .superRefine((value, ctx) => {
    const expected = sessionStageSchema.options;
    const exactMatch =
      value.length === expected.length &&
      value.every((item, index) => item === expected[index]);

    if (!exactMatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Session flow must exactly match ${expected.join(" -> ")}.`,
      });
    }
  });

export const conceptNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  gradeBand: gradeBandSchema,
  domain: mathDomainSchema,
  summary: z.string().min(1),
  prerequisiteIds: z.array(z.string().min(1)),
});
export type ConceptNode = z.infer<typeof conceptNodeSchema>;

export const misconceptionRuleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  allowedSignals: z.array(diagnosticSignalSchema).min(1),
  appliesToKinds: z.array(activityKindSchema).min(1),
  diagnosisTextTemplate: z.string().min(1),
  nextLessonSlug: z.string().min(1).optional(),
});
export type MisconceptionRule = z.infer<typeof misconceptionRuleSchema>;

const activityBaseSchema = z.object({
  id: z.string().min(1),
  stage: lessonActivityStageSchema,
  prompt: z.string().min(1),
  copy: markdownRefMapSchema.default({}),
  misconceptionRuleIds: z.array(z.string().min(1)),
  analyticsLabel: z.string().min(1).optional(),
});

const loadedActivityBaseSchema = z.object({
  id: z.string().min(1),
  stage: lessonActivityStageSchema,
  prompt: z.string().min(1),
  copy: markdownContentMapSchema,
  misconceptionRuleIds: z.array(z.string().min(1)),
  analyticsLabel: z.string().min(1).optional(),
});

function validateLessonStageFlow(
  activities: Array<{ stage: LessonActivityStage }>,
  ctx: z.RefinementCtx,
) {
  const actualStages = activities.map((activity) => activity.stage);
  const expectedStages = [...requiredLessonActivityStages];

  if (actualStages.length !== expectedStages.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["activities"],
      message: `Lessons must contain exactly one activity for each stage in this order: ${expectedStages.join(" -> ")}.`,
    });
    return;
  }

  actualStages.forEach((stage, index) => {
    if (stage !== expectedStages[index]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activities", index, "stage"],
        message: `Expected stage "${expectedStages[index]}" at position ${index + 1}, received "${stage}".`,
      });
    }
  });
}

const fractionBarsPropsSchema = z
  .object({
    wholeLabel: z.string().min(1),
    partitionCount: z.number().int().positive(),
    selectableParts: z.number().int().positive(),
    correctParts: z.array(z.number().int().nonnegative()).min(1),
    allowUnequalPreview: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.selectableParts > value.partitionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectableParts"],
        message: "Selectable parts cannot exceed partitionCount.",
      });
    }

    value.correctParts.forEach((part, index) => {
      if (part >= value.partitionCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctParts", index],
          message: "Correct part index must be smaller than partitionCount.",
        });
      }
    });
  });

const numberLinePropsSchema = z
  .object({
    min: z.number(),
    max: z.number(),
    partitionCount: z.number().int().positive(),
    targetNumerator: z.number().int().nonnegative(),
    targetDenominator: z.number().int().positive(),
    showLabels: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.max <= value.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max"],
        message: "max must be larger than min.",
      });
    }
  });

const multipleChoiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

const multipleChoicePropsSchema = z
  .object({
    options: z.array(multipleChoiceOptionSchema).min(2),
    correctOptionId: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (!value.options.some((option) => option.id === value.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctOptionId"],
        message: "correctOptionId must reference one of the options.",
      });
    }
  });

const freeTextPropsSchema = z
  .object({
    placeholder: z.string().min(1),
    minLength: z.number().int().nonnegative(),
    maxLength: z.number().int().positive(),
    rubricKeywords: z.array(z.string().min(1)).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.maxLength < value.minLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxLength"],
        message: "maxLength must be greater than or equal to minLength.",
      });
    }
  });

export const activitySpecSchema = z.discriminatedUnion("kind", [
  activityBaseSchema.extend({
    kind: z.literal("fraction-bars"),
    props: fractionBarsPropsSchema,
  }),
  activityBaseSchema.extend({
    kind: z.literal("number-line"),
    props: numberLinePropsSchema,
  }),
  activityBaseSchema.extend({
    kind: z.literal("multiple-choice"),
    props: multipleChoicePropsSchema,
  }),
  activityBaseSchema.extend({
    kind: z.literal("free-text"),
    props: freeTextPropsSchema,
  }),
]);
export type ActivitySpec = z.infer<typeof activitySpecSchema>;

export const loadedActivitySpecSchema = z.discriminatedUnion("kind", [
  loadedActivityBaseSchema.extend({
    kind: z.literal("fraction-bars"),
    props: fractionBarsPropsSchema,
  }),
  loadedActivityBaseSchema.extend({
    kind: z.literal("number-line"),
    props: numberLinePropsSchema,
  }),
  loadedActivityBaseSchema.extend({
    kind: z.literal("multiple-choice"),
    props: multipleChoicePropsSchema,
  }),
  loadedActivityBaseSchema.extend({
    kind: z.literal("free-text"),
    props: freeTextPropsSchema,
  }),
]);
export type LoadedActivitySpec = z.infer<typeof loadedActivitySpecSchema>;

export const lessonSpecSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  goal: z.string().min(1),
  gradeBand: gradeBandSchema,
  domain: mathDomainSchema,
  conceptIds: z.array(z.string().min(1)).min(1),
  copy: markdownRefMapSchema.default({}),
  activities: z.array(activitySpecSchema).min(1),
}).superRefine((lesson, ctx) => {
  validateLessonStageFlow(lesson.activities, ctx);
});
export type LessonSpec = z.infer<typeof lessonSpecSchema>;

export const loadedLessonSpecSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  goal: z.string().min(1),
  gradeBand: gradeBandSchema,
  domain: mathDomainSchema,
  conceptIds: z.array(z.string().min(1)).min(1),
  copy: markdownContentMapSchema,
  activities: z.array(loadedActivitySpecSchema).min(1),
  sourcePath: z.string().min(1),
  sourceDir: z.string().min(1),
}).superRefine((lesson, ctx) => {
  validateLessonStageFlow(lesson.activities, ctx);
});
export type LoadedLessonSpec = z.infer<typeof loadedLessonSpecSchema>;

export const moduleManifestSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  gradeBand: gradeBandSchema,
  domain: mathDomainSchema,
  sessionFlow: sessionFlowSchema,
  lessonOrder: z.array(z.string().min(1)).min(1),
});
export type ModuleManifest = z.infer<typeof moduleManifestSchema>;

export const contentBundleSchema = z.object({
  root: z.string().min(1),
  module: moduleManifestSchema,
  concepts: z.array(conceptNodeSchema),
  misconceptions: z.array(misconceptionRuleSchema),
  lessons: z.array(loadedLessonSpecSchema),
});
export type ContentBundle = z.infer<typeof contentBundleSchema>;
