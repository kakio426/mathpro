import { z } from "zod";

export const sessionStatusSchema = z.enum([
  "started",
  "completed",
  "abandoned",
]);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const reportStatusSchema = z.enum(["pending", "ready", "failed"]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const trackedSessionEventTypeSchema = z.enum([
  "ready",
  "interaction",
  "select",
  "drag-end",
  "drop",
  "submit",
  "hint-open",
  "retry",
  "free-text-submit",
]);
export type TrackedSessionEventType = z.infer<
  typeof trackedSessionEventTypeSchema
>;

export const storedSessionEventTypeSchema = z.union([
  trackedSessionEventTypeSchema,
  z.literal("complete"),
]);
export type StoredSessionEventType = z.infer<typeof storedSessionEventTypeSchema>;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);
export type JsonObject = z.infer<typeof jsonObjectSchema>;

export const guestProfileSchema = z.object({
  id: z.string().min(1),
  guestId: z.string().min(1),
  supabaseUserId: z.string().nullable(),
  kind: z.literal("guest"),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  lastSeenAt: z.string().min(1),
});
export type GuestProfile = z.infer<typeof guestProfileSchema>;

export const learningSessionSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  moduleId: z.string().min(1),
  moduleVersion: z.string().min(1),
  lessonSlug: z.string().min(1),
  status: sessionStatusSchema,
  startedAt: z.string().min(1),
  completedAt: z.string().nullable(),
  latestEventAt: z.string().nullable(),
});
export type LearningSession = z.infer<typeof learningSessionSchema>;

export const sessionReportSummarySchema = z.object({
  understoodConcepts: z.array(z.string().min(1)).min(1),
  watchMisconceptions: z.array(z.string().min(1)).min(1),
  explanationSummary: z.string().min(1),
  recommendedNextLessonId: z.string().min(1),
  recommendedNextLessonTitle: z.string().min(1),
});
export type SessionReportSummary = z.infer<typeof sessionReportSummarySchema>;

export const trackedSessionEventRecordSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  clientEventId: z.string().min(1),
  activityId: z.string().min(1),
  eventType: storedSessionEventTypeSchema,
  payload: jsonObjectSchema,
  clientTs: z.string().min(1),
  receivedAt: z.string().min(1),
});
export type TrackedSessionEventRecord = z.infer<
  typeof trackedSessionEventRecordSchema
>;

export const sessionReportSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  status: reportStatusSchema,
  summaryJson: sessionReportSummarySchema.nullable(),
  generatedAt: z.string().nullable(),
  generatorVersion: z.string().nullable(),
});
export type SessionReport = z.infer<typeof sessionReportSchema>;

export const createSessionRequestSchema = z.object({
  lessonSlug: z.string().min(1),
});
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

export const sessionEventInputSchema = z.object({
  clientEventId: z.string().min(1),
  activityId: z.string().min(1),
  eventType: trackedSessionEventTypeSchema,
  payload: jsonObjectSchema.default({}),
  clientTs: z.string().datetime({ offset: true }),
});
export type SessionEventInput = z.infer<typeof sessionEventInputSchema>;

export const sessionCompleteInputSchema = z.object({
  clientEventId: z.string().min(1),
  clientTs: z.string().datetime({ offset: true }),
});
export type SessionCompleteInput = z.infer<typeof sessionCompleteInputSchema>;

export const startSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  guestId: z.string().min(1),
  lessonSlug: z.string().min(1),
  status: z.literal("started"),
  reportStatus: z.literal("pending"),
});
export type StartSessionResponse = z.infer<typeof startSessionResponseSchema>;

export const appendSessionEventResponseSchema = z.object({
  ok: z.literal(true),
  duplicated: z.boolean(),
});
export type AppendSessionEventResponse = z.infer<
  typeof appendSessionEventResponseSchema
>;

export const completeSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
  status: z.literal("completed"),
  reportStatus: reportStatusSchema,
});
export type CompleteSessionResponse = z.infer<
  typeof completeSessionResponseSchema
>;

export const sessionReportResponseSchema = z.object({
  sessionId: z.string().min(1),
  status: reportStatusSchema,
  summaryJson: sessionReportSummarySchema.nullable(),
  generatedAt: z.string().nullable(),
});
export type SessionReportResponse = z.infer<
  typeof sessionReportResponseSchema
>;
