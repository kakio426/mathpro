import { z } from "zod";
import { gradeBandSchema } from "@/types/content";

export const teacherDifficultySchema = z.enum(["easy", "standard", "challenge"]);
export type TeacherDifficulty = z.infer<typeof teacherDifficultySchema>;

export const interactiveBlockKindSchema = z.enum([
  "html-artifact",
  "fraction-bars",
  "number-line",
  "drag-sort",
  "matching",
  "visual-choice",
]);
export type InteractiveBlockKind = z.infer<typeof interactiveBlockKindSchema>;

export const activityBlockTypeSchema = z.enum([
  "intro",
  "html-artifact",
  "manipulation",
  "prediction",
  "explanation",
  "wrap-up",
]);
export type ActivityBlockType = z.infer<typeof activityBlockTypeSchema>;

export const analysisHookSchema = z.object({
  id: z.string().min(1),
  signal: z.enum([
    "incorrect-final",
    "slow-first-submit",
    "hint-opened",
    "retry-after-feedback",
    "manipulation-pattern",
  ]),
  label: z.string().min(1),
});
export type AnalysisHook = z.infer<typeof analysisHookSchema>;

export const htmlArtifactEventTypeSchema = z.enum([
  "ready",
  "interaction",
  "drag-end",
  "select",
  "hint-open",
  "retry",
  "submit",
  "complete",
]);
export type HtmlArtifactEventType = z.infer<typeof htmlArtifactEventTypeSchema>;

export const htmlArtifactSafetyStatusSchema = z.enum([
  "unchecked",
  "passed",
  "warning",
  "blocked",
]);
export type HtmlArtifactSafetyStatus = z.infer<
  typeof htmlArtifactSafetyStatusSchema
>;

export const activityBlockSchema = z.object({
  id: z.string().min(1),
  type: activityBlockTypeSchema,
  title: z.string().min(1),
  instruction: z.string().min(1),
  interactionKind: interactiveBlockKindSchema.optional(),
  html: z.string().min(1).optional(),
  allowedEvents: z.array(htmlArtifactEventTypeSchema).optional(),
  analysisSchema: z.record(z.string(), z.unknown()).optional(),
  promptTemplate: z.string().min(1).optional(),
  safetyStatus: htmlArtifactSafetyStatusSchema.optional(),
  safetyWarnings: z.array(z.string().min(1)).optional(),
  sourceActivityId: z.string().min(1).optional(),
  analysisHooks: z.array(analysisHookSchema).min(1),
  teacherNotes: z.string().optional(),
});
export type ActivityBlock = z.infer<typeof activityBlockSchema>;

export const teacherActivityDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  gradeBand: gradeBandSchema,
  concept: z.string().min(1),
  goal: z.string().min(1),
  difficulty: teacherDifficultySchema,
  sourceLessonSlug: z.string().min(1),
  teacherGuide: z.string().min(1).optional(),
  learningQuestions: z.array(z.string().min(1)).max(3).optional(),
  aiOutputRaw: z.string().min(1).optional(),
  blocks: z.array(activityBlockSchema).min(1),
  status: z.enum(["draft", "published"]),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type TeacherActivityDocument = z.infer<
  typeof teacherActivityDocumentSchema
>;

export const createTeacherDraftRequestSchema = z.object({
  gradeBand: gradeBandSchema.default("3-4"),
  concept: z.string().min(1),
  goal: z.string().min(1),
  interactionKind: interactiveBlockKindSchema.default("fraction-bars"),
  difficulty: teacherDifficultySchema.default("standard"),
  sourceLessonSlug: z.string().min(1).default("whole-and-part"),
  html: z.string().min(1).optional(),
  promptTemplate: z.string().min(1).optional(),
  teacherGuide: z.string().min(1).optional(),
  learningQuestions: z.array(z.string().min(1)).max(3).optional(),
  aiOutputRaw: z.string().min(1).optional(),
});
export type CreateTeacherDraftRequest = z.infer<
  typeof createTeacherDraftRequestSchema
>;

export const publishTeacherActivityRequestSchema = z.object({
  document: teacherActivityDocumentSchema,
});
export type PublishTeacherActivityRequest = z.infer<
  typeof publishTeacherActivityRequestSchema
>;

export const publishedAssignmentSchema = z.object({
  id: z.string().min(1),
  activityId: z.string().min(1),
  code: z.string().min(4),
  status: z.enum(["active", "closed"]),
  publishedAt: z.string().datetime({ offset: true }),
  shareUrl: z.string().url(),
  document: teacherActivityDocumentSchema,
});
export type PublishedAssignment = z.infer<typeof publishedAssignmentSchema>;

export const publishedAssignmentListItemSchema = z.object({
  id: z.string().min(1),
  activityId: z.string().min(1),
  code: z.string().min(4),
  status: z.enum(["active", "closed"]),
  publishedAt: z.string().datetime({ offset: true }),
  shareUrl: z.string().url(),
  title: z.string().min(1),
  concept: z.string().min(1),
  goal: z.string().min(1),
  gradeBand: gradeBandSchema,
  difficulty: teacherDifficultySchema,
  sourceLessonSlug: z.string().min(1),
  blockCount: z.number().int().nonnegative(),
  participantCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
});
export type PublishedAssignmentListItem = z.infer<
  typeof publishedAssignmentListItemSchema
>;

export const assignmentStartSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  guestId: z.string().min(1),
  lessonSlug: z.string().min(1),
  assignmentId: z.string().min(1),
  assignmentCode: z.string().min(4),
  status: z.literal("started"),
  reportStatus: z.literal("pending"),
});
export type AssignmentStartSessionResponse = z.infer<
  typeof assignmentStartSessionResponseSchema
>;

export const teacherReportSessionDetailSchema = z.object({
  sessionId: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["started", "completed", "abandoned"]),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  latestEventAt: z.string().nullable(),
  eventCount: z.number().int().nonnegative(),
  submitCount: z.number().int().nonnegative(),
  incorrectSubmitCount: z.number().int().nonnegative(),
  hintCount: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
  firstEventAt: z.string().nullable(),
  lastEventAt: z.string().nullable(),
  topActivityTitle: z.string().min(1),
  lastResponse: z.string().nullable(),
  observation: z.string().min(1),
});
export type TeacherReportSessionDetail = z.infer<
  typeof teacherReportSessionDetailSchema
>;

export const teacherReportActivitySummarySchema = z.object({
  activityId: z.string().min(1),
  title: z.string().min(1),
  blockType: activityBlockTypeSchema,
  eventCount: z.number().int().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  submitCount: z.number().int().nonnegative(),
  incorrectSubmitCount: z.number().int().nonnegative(),
  hintCount: z.number().int().nonnegative(),
  retryCount: z.number().int().nonnegative(),
  completeCount: z.number().int().nonnegative(),
  firstEventAt: z.string().nullable(),
  lastEventAt: z.string().nullable(),
  summary: z.string().min(1),
  nextAction: z.string().min(1),
});
export type TeacherReportActivitySummary = z.infer<
  typeof teacherReportActivitySummarySchema
>;

export const teacherReportSummarySchema = z.object({
  assignmentId: z.string().min(1),
  code: z.string().min(4),
  activityTitle: z.string().min(1),
  participantCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  eventCount: z.number().int().nonnegative(),
  manipulationPatterns: z.array(z.string().min(1)).min(1),
  dwellPatterns: z.array(z.string().min(1)).min(1),
  misconceptionSignals: z.array(z.string().min(1)).min(1),
  nextTeachingMoves: z.array(z.string().min(1)).min(1),
  sessionDetails: z.array(teacherReportSessionDetailSchema),
  activitySummaries: z.array(teacherReportActivitySummarySchema),
});
export type TeacherReportSummary = z.infer<typeof teacherReportSummarySchema>;
