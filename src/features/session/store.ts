import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  sessionReportSummarySchema,
  trackedSessionEventRecordSchema,
  type GuestProfile,
  type JsonObject,
  type LearningSession,
  type ReportStatus,
  type SessionReport,
  type SessionReportSummary,
  type TrackedSessionEventRecord,
  type TrackedSessionEventType,
} from "@/types/session";

type GuestProfileRow = {
  id: string;
  guest_id: string;
  supabase_user_id: string | null;
  kind: "guest";
  created_at: string;
  updated_at: string;
  last_seen_at: string;
};

type LearningSessionRow = {
  id: string;
  profile_id: string;
  module_id: string;
  module_version: string;
  lesson_slug: string;
  status: "started" | "completed" | "abandoned";
  started_at: string;
  completed_at: string | null;
  latest_event_at: string | null;
};

type SessionReportRow = {
  id: string;
  session_id: string;
  status: "pending" | "ready" | "failed";
  summary_json: SessionReportSummary | null;
  generated_at: string | null;
  generator_version: string | null;
};

type SessionEventRow = {
  id: string;
  session_id: string;
  client_event_id: string;
  activity_id: string;
  event_type: TrackedSessionEventType | "complete";
  payload: JsonObject;
  client_ts: string;
  received_at: string;
};

const guestProfileRowSchema = z.object({
  id: z.string().min(1),
  guest_id: z.string().min(1),
  supabase_user_id: z.string().nullable(),
  kind: z.literal("guest"),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  last_seen_at: z.string().min(1),
});

const learningSessionRowSchema = z.object({
  id: z.string().min(1),
  profile_id: z.string().min(1),
  module_id: z.string().min(1),
  module_version: z.string().min(1),
  lesson_slug: z.string().min(1),
  status: z.enum(["started", "completed", "abandoned"]),
  started_at: z.string().min(1),
  completed_at: z.string().nullable(),
  latest_event_at: z.string().nullable(),
});

const sessionReportRowSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  status: z.enum(["pending", "ready", "failed"]),
  summary_json: sessionReportSummarySchema.nullable(),
  generated_at: z.string().nullable(),
  generator_version: z.string().nullable(),
});

const sessionEventRowSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  client_event_id: z.string().min(1),
  activity_id: z.string().min(1),
  event_type: z.union([
    z.enum([
      "ready",
      "interaction",
      "select",
      "drag-end",
      "drop",
      "submit",
      "hint-open",
      "retry",
      "free-text-submit",
    ]),
    z.literal("complete"),
  ]),
  payload: z.record(z.string(), z.unknown()),
  client_ts: z.string().min(1),
  received_at: z.string().min(1),
});

function toGuestProfile(row: GuestProfileRow): GuestProfile {
  const parsed = guestProfileRowSchema.parse(row);
  return {
    id: parsed.id,
    guestId: parsed.guest_id,
    supabaseUserId: parsed.supabase_user_id,
    kind: parsed.kind,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
    lastSeenAt: parsed.last_seen_at,
  };
}

function toLearningSession(row: LearningSessionRow): LearningSession {
  const parsed = learningSessionRowSchema.parse(row);
  return {
    id: parsed.id,
    profileId: parsed.profile_id,
    moduleId: parsed.module_id,
    moduleVersion: parsed.module_version,
    lessonSlug: parsed.lesson_slug,
    status: parsed.status,
    startedAt: parsed.started_at,
    completedAt: parsed.completed_at,
    latestEventAt: parsed.latest_event_at,
  };
}

function toSessionReport(row: SessionReportRow): SessionReport {
  const parsed = sessionReportRowSchema.parse(row);
  return {
    id: parsed.id,
    sessionId: parsed.session_id,
    status: parsed.status,
    summaryJson: parsed.summary_json,
    generatedAt: parsed.generated_at,
    generatorVersion: parsed.generator_version,
  };
}

function toTrackedSessionEventRecord(
  row: SessionEventRow,
): TrackedSessionEventRecord {
  const parsed = sessionEventRowSchema.parse(row);
  return trackedSessionEventRecordSchema.parse({
    id: parsed.id,
    sessionId: parsed.session_id,
    clientEventId: parsed.client_event_id,
    activityId: parsed.activity_id,
    eventType: parsed.event_type,
    payload: parsed.payload,
    clientTs: parsed.client_ts,
    receivedAt: parsed.received_at,
  });
}

function formatStoreError(context: string, message: string) {
  return `${context}: ${message}`;
}

export type SessionStore = {
  upsertGuestProfile(input: { guestId: string }): Promise<GuestProfile>;
  findProfileByGuestId(guestId: string): Promise<GuestProfile | null>;
  createLearningSession(input: {
    profileId: string;
    moduleId: string;
    moduleVersion: string;
    lessonSlug: string;
    assignmentId?: string;
  }): Promise<LearningSession>;
  findLearningSessionById(sessionId: string): Promise<LearningSession | null>;
  touchLearningSessionLatestEvent(
    sessionId: string,
    latestEventAt: string,
  ): Promise<void>;
  markLearningSessionCompleted(
    sessionId: string,
    completedAt: string,
  ): Promise<LearningSession>;
  insertSessionEvent(input: {
    sessionId: string;
    clientEventId: string;
    activityId: string;
    eventType: TrackedSessionEventType | "complete";
    payload: JsonObject;
    clientTs: string;
  }): Promise<{ duplicated: boolean }>;
  listSessionEventsBySessionId(
    sessionId: string,
  ): Promise<TrackedSessionEventRecord[]>;
  createSessionReport(input: {
    sessionId: string;
    status?: ReportStatus;
  }): Promise<SessionReport>;
  findSessionReportBySessionId(sessionId: string): Promise<SessionReport | null>;
  updateSessionReport(input: {
    sessionId: string;
    status: ReportStatus;
    summaryJson: SessionReportSummary | null;
    generatedAt: string | null;
    generatorVersion: string | null;
  }): Promise<SessionReport>;
};

export function createSupabaseSessionStore(
  supabase: SupabaseClient,
): SessionStore {
  return {
    async upsertGuestProfile({ guestId }) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            guest_id: guestId,
            kind: "guest",
            last_seen_at: new Date().toISOString(),
          },
          {
            onConflict: "guest_id",
          },
        )
        .select("*")
        .single();

      if (error) {
        throw new Error(formatStoreError("Failed to upsert profile", error.message));
      }

      return toGuestProfile(data as GuestProfileRow);
    },

    async findProfileByGuestId(guestId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("guest_id", guestId)
        .maybeSingle();

      if (error) {
        throw new Error(formatStoreError("Failed to load profile", error.message));
      }

      return data ? toGuestProfile(data as GuestProfileRow) : null;
    },

    async createLearningSession({
      profileId,
      moduleId,
      moduleVersion,
      lessonSlug,
      assignmentId,
    }) {
      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          profile_id: profileId,
          module_id: moduleId,
          module_version: moduleVersion,
          lesson_slug: lessonSlug,
          assignment_id: assignmentId,
          status: "started",
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(
          formatStoreError("Failed to create learning session", error.message),
        );
      }

      return toLearningSession(data as LearningSessionRow);
    },

    async findLearningSessionById(sessionId) {
      const { data, error } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();

      if (error) {
        throw new Error(formatStoreError("Failed to load learning session", error.message));
      }

      return data ? toLearningSession(data as LearningSessionRow) : null;
    },

    async touchLearningSessionLatestEvent(sessionId, latestEventAt) {
      const { error: nullUpdateError } = await supabase
        .from("learning_sessions")
        .update({
          latest_event_at: latestEventAt,
        })
        .eq("id", sessionId)
        .is("latest_event_at", null);

      if (nullUpdateError) {
        throw new Error(
          formatStoreError(
            "Failed to update latest session event",
            nullUpdateError.message,
          ),
        );
      }

      const { error: monotonicUpdateError } = await supabase
        .from("learning_sessions")
        .update({
          latest_event_at: latestEventAt,
        })
        .eq("id", sessionId)
        .lt("latest_event_at", latestEventAt);

      if (monotonicUpdateError) {
        throw new Error(
          formatStoreError(
            "Failed to update latest session event",
            monotonicUpdateError.message,
          ),
        );
      }
    },

    async markLearningSessionCompleted(sessionId, completedAt) {
      const { data, error } = await supabase
        .from("learning_sessions")
        .update({
          status: "completed",
          completed_at: completedAt,
          latest_event_at: completedAt,
        })
        .eq("id", sessionId)
        .select("*")
        .single();

      if (error) {
        throw new Error(
          formatStoreError("Failed to complete learning session", error.message),
        );
      }

      return toLearningSession(data as LearningSessionRow);
    },

    async insertSessionEvent({
      sessionId,
      clientEventId,
      activityId,
      eventType,
      payload,
      clientTs,
    }) {
      const { error } = await supabase.from("session_events").insert({
        session_id: sessionId,
        client_event_id: clientEventId,
        activity_id: activityId,
        event_type: eventType,
        payload,
        client_ts: clientTs,
      });

      if (error) {
        if (error.code === "23505") {
          return {
            duplicated: true,
          };
        }

        throw new Error(formatStoreError("Failed to insert session event", error.message));
      }

      return {
        duplicated: false,
      };
    },

    async createSessionReport({ sessionId, status = "pending" }) {
      const { data, error } = await supabase
        .from("session_reports")
        .insert({
          session_id: sessionId,
          status,
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(formatStoreError("Failed to create session report", error.message));
      }

      return toSessionReport(data as SessionReportRow);
    },

    async listSessionEventsBySessionId(sessionId) {
      const { data, error } = await supabase
        .from("session_events")
        .select("*")
        .eq("session_id", sessionId)
        .order("client_ts", { ascending: true })
        .order("received_at", { ascending: true });

      if (error) {
        throw new Error(
          formatStoreError("Failed to load session events", error.message),
        );
      }

      return (data as SessionEventRow[]).map((row) =>
        toTrackedSessionEventRecord(row),
      );
    },

    async findSessionReportBySessionId(sessionId) {
      const { data, error } = await supabase
        .from("session_reports")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (error) {
        throw new Error(formatStoreError("Failed to load session report", error.message));
      }

      return data ? toSessionReport(data as SessionReportRow) : null;
    },

    async updateSessionReport({
      sessionId,
      status,
      summaryJson,
      generatedAt,
      generatorVersion,
    }) {
      const { data, error } = await supabase
        .from("session_reports")
        .update({
          status,
          summary_json: summaryJson,
          generated_at: generatedAt,
          generator_version: generatorVersion,
        })
        .eq("session_id", sessionId)
        .select("*")
        .single();

      if (error) {
        throw new Error(
          formatStoreError("Failed to update session report", error.message),
        );
      }

      return toSessionReport(data as SessionReportRow);
    },
  };
}
