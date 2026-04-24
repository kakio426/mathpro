import { loadLessonSpec } from "@/features/content";
import { resolveGuestIdentity, type GuestCookieStore } from "@/features/auth";
import type { SessionStore } from "@/features/session";
import { createTeacherActivityDraft } from "@/features/teacher/draft";
import {
  getBlockedHtmlArtifactWarnings,
  withDocumentHtmlSafety,
} from "@/features/teacher/safety";
import type { TeacherStore } from "@/features/teacher/store";
import type {
  AssignmentStartSessionResponse,
  CreateTeacherDraftRequest,
  PublishedAssignment,
  TeacherActivityDocument,
  TeacherReportSummary,
} from "@/types/teacher";

export class TeacherServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "TeacherServiceError";
    this.status = status;
    this.code = code;
  }
}

function notFound(message: string) {
  return new TeacherServiceError(404, "not_found", message);
}

export function createTeacherService({
  teacherStore,
  sessionStore,
}: {
  teacherStore: TeacherStore;
  sessionStore: SessionStore;
}) {
  return {
    createDraft(input: CreateTeacherDraftRequest): TeacherActivityDocument {
      return createTeacherActivityDraft(input);
    },

    async publishActivity({
      document,
      origin,
    }: {
      document: TeacherActivityDocument;
      origin: string;
    }): Promise<PublishedAssignment> {
      const safeDocument = withDocumentHtmlSafety(document);
      const blockedWarnings = getBlockedHtmlArtifactWarnings(safeDocument);

      if (blockedWarnings.length > 0) {
        throw new TeacherServiceError(
          400,
          "html_artifact_blocked",
          `HTML 안전 검사에서 차단되었습니다. ${blockedWarnings.join(" ")}`,
        );
      }

      loadLessonSpec(safeDocument.sourceLessonSlug);
      return teacherStore.publishActivity({ document: safeDocument, origin });
    },

    async getAssignmentByCode(code: string): Promise<PublishedAssignment> {
      const assignment = await teacherStore.findAssignmentByCode(code);

      if (!assignment) {
        throw notFound("Assignment not found.");
      }

      return assignment;
    },

    async startAssignmentSession({
      code,
      cookieStore,
    }: {
      code: string;
      cookieStore: GuestCookieStore;
    }): Promise<AssignmentStartSessionResponse> {
      const assignment = await teacherStore.findAssignmentByCode(code);

      if (!assignment) {
        throw notFound("Assignment not found.");
      }

      const { guestId } = resolveGuestIdentity(cookieStore);
      const profile = await sessionStore.upsertGuestProfile({ guestId });
      const session = await sessionStore.createLearningSession({
        profileId: profile.id,
        moduleId: "teacher-activity",
        moduleVersion: "v1",
        lessonSlug: assignment.document.sourceLessonSlug,
        assignmentId: assignment.id,
      });
      await sessionStore.createSessionReport({ sessionId: session.id });

      return {
        sessionId: session.id,
        guestId,
        lessonSlug: session.lessonSlug,
        assignmentId: assignment.id,
        assignmentCode: assignment.code,
        status: "started",
        reportStatus: "pending",
      };
    },

    async getTeacherReport(assignmentId: string): Promise<TeacherReportSummary> {
      const summary = await teacherStore.summarizeAssignment(assignmentId);

      if (!summary) {
        throw notFound("Assignment report not found.");
      }

      return summary;
    },
  };
}
