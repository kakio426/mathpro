import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  publishedAssignmentSchema,
  publishedAssignmentListItemSchema,
  teacherActivityDocumentSchema,
  teacherReportSummarySchema,
  type PublishedAssignment,
  type PublishedAssignmentListItem,
  type TeacherActivityDocument,
  type TeacherReportSummary,
} from "@/types/teacher";
import type { JsonObject } from "@/types/session";
import {
  createTeacherReportSummary,
  type TeacherAssignmentEventRecord,
  type TeacherAssignmentSessionRecord,
} from "./report";

type TeacherActivityRow = {
  id: string;
  document_json: TeacherActivityDocument;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

type PublishedAssignmentRow = {
  id: string;
  activity_id: string;
  code: string;
  status: "active" | "closed";
  published_at: string;
  share_url: string;
  teacher_activities: TeacherActivityRow | null;
};

type LearningSessionSummaryRow = {
  id: string;
  status: "started" | "completed" | "abandoned";
  started_at: string | null;
  completed_at: string | null;
  latest_event_at: string | null;
};

type LearningSessionAssignmentSummaryRow = {
  assignment_id: string | null;
  status: "started" | "completed" | "abandoned";
};

type AssignmentSessionEventRow = {
  session_id: string;
  activity_id: string;
  event_type: string;
  payload: JsonObject;
  client_ts: string;
};

const teacherActivityRowSchema = z.object({
  id: z.string().min(1),
  document_json: teacherActivityDocumentSchema,
  status: z.enum(["draft", "published"]),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

const publishedAssignmentRowSchema = z.object({
  id: z.string().min(1),
  activity_id: z.string().min(1),
  code: z.string().min(4),
  status: z.enum(["active", "closed"]),
  published_at: z.string().min(1),
  share_url: z.string().url(),
  teacher_activities: teacherActivityRowSchema.nullable(),
});

function toPublishedAssignment(row: PublishedAssignmentRow): PublishedAssignment {
  const parsed = publishedAssignmentRowSchema.parse(row);

  if (!parsed.teacher_activities) {
    throw new Error("Published assignment is missing its activity document.");
  }

  return publishedAssignmentSchema.parse({
    id: parsed.id,
    activityId: parsed.activity_id,
    code: parsed.code,
    status: parsed.status,
    publishedAt: parsed.published_at,
    shareUrl: parsed.share_url,
    document: parsed.teacher_activities.document_json,
  });
}

function makeAssignmentCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
}

function formatStoreError(context: string, message: string) {
  return `${context}: ${message}`;
}

export type TeacherStore = {
  publishActivity(input: {
    document: TeacherActivityDocument;
    origin: string;
  }): Promise<PublishedAssignment>;
  listPublishedAssignments(): Promise<PublishedAssignmentListItem[]>;
  findAssignmentById(assignmentId: string): Promise<PublishedAssignment | null>;
  findAssignmentByCode(code: string): Promise<PublishedAssignment | null>;
  summarizeAssignment(assignmentId: string): Promise<TeacherReportSummary | null>;
};

export function createSupabaseTeacherStore(
  supabase: SupabaseClient,
): TeacherStore {
  return {
    async publishActivity({ document, origin }) {
      const publishedDocument = teacherActivityDocumentSchema.parse({
        ...document,
        id: crypto.randomUUID(),
        status: "published",
        updatedAt: new Date().toISOString(),
      });

      const { data: activity, error: activityError } = await supabase
        .from("teacher_activities")
        .insert({
          title: publishedDocument.title,
          grade_band: publishedDocument.gradeBand,
          concept: publishedDocument.concept,
          goal: publishedDocument.goal,
          difficulty: publishedDocument.difficulty,
          source_lesson_slug: publishedDocument.sourceLessonSlug,
          document_json: publishedDocument,
          status: "published",
        })
        .select("*")
        .single();

      if (activityError) {
        throw new Error(
          formatStoreError("Failed to publish teacher activity", activityError.message),
        );
      }

      const activityId = (activity as TeacherActivityRow).id;
      let assignment: PublishedAssignmentRow | null = null;
      let lastError: string | null = null;

      for (let attempt = 0; attempt < 5 && !assignment; attempt += 1) {
        const code = makeAssignmentCode();
        const shareUrl = `${origin}/play/${code}`;
        const { data, error } = await supabase
          .from("published_assignments")
          .insert({
            activity_id: activityId,
            code,
            status: "active",
            share_url: shareUrl,
          })
          .select("*, teacher_activities(*)")
          .single();

        if (!error) {
          assignment = data as PublishedAssignmentRow;
          break;
        }

        lastError = error.message;

        if (error.code !== "23505") {
          break;
        }
      }

      if (!assignment) {
        throw new Error(
          formatStoreError(
            "Failed to create published assignment",
            lastError ?? "unknown error",
          ),
        );
      }

      return toPublishedAssignment(assignment);
    },

    async listPublishedAssignments() {
      const { data, error } = await supabase
        .from("published_assignments")
        .select("*, teacher_activities(*)")
        .order("published_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(
          formatStoreError("Failed to list published assignments", error.message),
        );
      }

      const rows = (data ?? []) as PublishedAssignmentRow[];
      const assignments = rows.map((row) => toPublishedAssignment(row));
      const assignmentIds = assignments.map((assignment) => assignment.id);
      const countsByAssignmentId = new Map<
        string,
        { participantCount: number; completedCount: number }
      >();

      if (assignmentIds.length > 0) {
        const { data: sessions, error: sessionsError } = await supabase
          .from("learning_sessions")
          .select("assignment_id, status")
          .in("assignment_id", assignmentIds);

        if (sessionsError) {
          throw new Error(
            formatStoreError(
              "Failed to list assignment sessions",
              sessionsError.message,
            ),
          );
        }

        ((sessions ?? []) as LearningSessionAssignmentSummaryRow[]).forEach(
          (session) => {
            if (!session.assignment_id) {
              return;
            }

            const current = countsByAssignmentId.get(session.assignment_id) ?? {
              participantCount: 0,
              completedCount: 0,
            };

            current.participantCount += 1;

            if (session.status === "completed") {
              current.completedCount += 1;
            }

            countsByAssignmentId.set(session.assignment_id, current);
          },
        );
      }

      return assignments.map((assignment) => {
        const counts = countsByAssignmentId.get(assignment.id) ?? {
          participantCount: 0,
          completedCount: 0,
        };

        return publishedAssignmentListItemSchema.parse({
          id: assignment.id,
          activityId: assignment.activityId,
          code: assignment.code,
          status: assignment.status,
          publishedAt: assignment.publishedAt,
          shareUrl: assignment.shareUrl,
          title: assignment.document.title,
          concept: assignment.document.concept,
          goal: assignment.document.goal,
          gradeBand: assignment.document.gradeBand,
          difficulty: assignment.document.difficulty,
          sourceLessonSlug: assignment.document.sourceLessonSlug,
          blockCount: assignment.document.blocks.length,
          participantCount: counts.participantCount,
          completedCount: counts.completedCount,
        });
      });
    },

    async findAssignmentById(assignmentId) {
      const { data, error } = await supabase
        .from("published_assignments")
        .select("*, teacher_activities(*)")
        .eq("id", assignmentId)
        .maybeSingle();

      if (error) {
        throw new Error(formatStoreError("Failed to load assignment", error.message));
      }

      return data ? toPublishedAssignment(data as PublishedAssignmentRow) : null;
    },

    async findAssignmentByCode(code) {
      const { data, error } = await supabase
        .from("published_assignments")
        .select("*, teacher_activities(*)")
        .eq("code", code.toUpperCase())
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        throw new Error(formatStoreError("Failed to load assignment", error.message));
      }

      return data ? toPublishedAssignment(data as PublishedAssignmentRow) : null;
    },

    async summarizeAssignment(assignmentId) {
      const { data: assignment, error: assignmentError } = await supabase
        .from("published_assignments")
        .select("*, teacher_activities(*)")
        .eq("id", assignmentId)
        .maybeSingle();

      if (assignmentError) {
        throw new Error(
          formatStoreError("Failed to load assignment report", assignmentError.message),
        );
      }

      if (!assignment) {
        return null;
      }

      const parsedAssignment = toPublishedAssignment(
        assignment as PublishedAssignmentRow,
      );

      const { data: sessions, error: sessionsError } = await supabase
        .from("learning_sessions")
        .select("id, status, started_at, completed_at, latest_event_at")
        .eq("assignment_id", assignmentId);

      if (sessionsError) {
        throw new Error(
          formatStoreError("Failed to load assignment sessions", sessionsError.message),
        );
      }

      const parsedSessions = ((sessions ?? []) as LearningSessionSummaryRow[]).map(
        (session) => ({
          id: session.id,
          status: session.status,
          startedAt: session.started_at,
          completedAt: session.completed_at,
          latestEventAt: session.latest_event_at,
        }),
      );
      const sessionIds = parsedSessions.map((session) => session.id);
      let events: TeacherAssignmentEventRecord[] = [];

      if (sessionIds.length > 0) {
        const { data: eventRows, error: eventError } = await supabase
          .from("session_events")
          .select("session_id, activity_id, event_type, payload, client_ts")
          .in("session_id", sessionIds)
          .order("client_ts", { ascending: true });

        if (eventError) {
          throw new Error(
            formatStoreError("Failed to load assignment events", eventError.message),
          );
        }

        events = ((eventRows ?? []) as AssignmentSessionEventRow[]).map((event) => ({
          sessionId: event.session_id,
          activityId: event.activity_id,
          eventType: event.event_type,
          payload: event.payload,
          clientTs: event.client_ts,
        }));
      }

      return teacherReportSummarySchema.parse(
        createTeacherReportSummary({
          assignment: parsedAssignment,
          sessions: parsedSessions satisfies TeacherAssignmentSessionRecord[],
          events,
        }),
      );
    },
  };
}
