import {
  ContentValidationError,
  loadContentBundle,
  loadLessonSpec,
  loadModuleManifest,
} from "@/features/content";
import {
  createSessionReportSummary,
  REPORT_GENERATOR_VERSION,
} from "@/features/report";
import type {
  AppendSessionEventResponse,
  CompleteSessionResponse,
  ReportStatus,
  SessionReportSummary,
  SessionEventInput,
  SessionReportResponse,
  StartSessionResponse,
} from "@/types/session";
import type { SessionStore } from "./store";

const SESSION_COMPLETE_ACTIVITY_ID = "__session__";

type StartGuestSessionInput = {
  guestId: string;
  lessonSlug: string;
};

type AppendSessionEventInput = {
  guestId: string;
  sessionId: string;
  event: SessionEventInput;
};

type CompleteSessionInput = {
  guestId: string;
  sessionId: string;
  clientEventId: string;
  clientTs: string;
};

type GetSessionReportInput = {
  guestId: string;
  sessionId: string;
};

export class SessionServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SessionServiceError";
    this.status = status;
    this.code = code;
  }
}

function badRequest(code: string, message: string) {
  return new SessionServiceError(400, code, message);
}

function notFound(message: string) {
  return new SessionServiceError(404, "not_found", message);
}

function conflict(code: string, message: string) {
  return new SessionServiceError(409, code, message);
}

function invariant(message: string) {
  return new SessionServiceError(500, "invariant_failed", message);
}

async function getOwnedSessionOrThrow(
  store: SessionStore,
  guestId: string,
  sessionId: string,
) {
  const profile = await store.findProfileByGuestId(guestId);

  if (!profile) {
    throw notFound("Session not found.");
  }

  const session = await store.findLearningSessionById(sessionId);

  if (!session || session.profileId !== profile.id) {
    throw notFound("Session not found.");
  }

  return {
    profile,
    session,
  };
}

async function getRequiredReportStatus(
  store: SessionStore,
  sessionId: string,
): Promise<ReportStatus> {
  const report = await store.findSessionReportBySessionId(sessionId);

  if (!report) {
    throw invariant("Pending report placeholder is missing.");
  }

  return report.status;
}

async function defaultGenerateSessionReportSummary({
  sessionId,
  lessonSlug,
  store,
}: {
  sessionId: string;
  lessonSlug: string;
  store: SessionStore;
}): Promise<SessionReportSummary> {
  const bundle = loadContentBundle();
  const events = await store.listSessionEventsBySessionId(sessionId);

  return createSessionReportSummary({
    bundle,
    lessonSlug,
    events,
  });
}

export function createSessionService({
  store,
  validateLesson = loadLessonSpec,
  loadManifest = loadModuleManifest,
  generateSessionReportSummary = defaultGenerateSessionReportSummary,
}: {
  store: SessionStore;
  validateLesson?: (lessonSlug: string) => void;
  loadManifest?: typeof loadModuleManifest;
  generateSessionReportSummary?: (input: {
    sessionId: string;
    lessonSlug: string;
    store: SessionStore;
  }) => Promise<SessionReportSummary>;
}) {
  return {
    async startGuestSession({
      guestId,
      lessonSlug,
    }: StartGuestSessionInput): Promise<StartSessionResponse> {
      const manifest = loadManifest();

      if (!manifest.lessonOrder.includes(lessonSlug)) {
        throw badRequest(
          "unknown_lesson",
          `Unknown lesson slug "${lessonSlug}".`,
        );
      }

      try {
        validateLesson(lessonSlug);
      } catch (error) {
        if (error instanceof ContentValidationError) {
          throw badRequest(
            "invalid_lesson",
            `Lesson "${lessonSlug}" is not available for session start.`,
          );
        }

        throw error;
      }

      const profile = await store.upsertGuestProfile({ guestId });
      const session = await store.createLearningSession({
        profileId: profile.id,
        moduleId: manifest.id,
        moduleVersion: manifest.version,
        lessonSlug,
      });
      await store.createSessionReport({
        sessionId: session.id,
      });

      return {
        sessionId: session.id,
        guestId,
        lessonSlug,
        status: "started",
        reportStatus: "pending",
      };
    },

    async appendSessionEvent({
      guestId,
      sessionId,
      event,
    }: AppendSessionEventInput): Promise<AppendSessionEventResponse> {
      const { session } = await getOwnedSessionOrThrow(store, guestId, sessionId);

      if (session.status !== "started") {
        throw conflict(
          "session_not_started",
          "Only started sessions can receive new events.",
        );
      }

      const result = await store.insertSessionEvent({
        sessionId,
        clientEventId: event.clientEventId,
        activityId: event.activityId,
        eventType: event.eventType,
        payload: event.payload,
        clientTs: event.clientTs,
      });

      if (!result.duplicated) {
        await store.touchLearningSessionLatestEvent(sessionId, event.clientTs);
      }

      return {
        ok: true,
        duplicated: result.duplicated,
      };
    },

    async completeSession({
      guestId,
      sessionId,
      clientEventId,
      clientTs,
    }: CompleteSessionInput): Promise<CompleteSessionResponse> {
      const { session } = await getOwnedSessionOrThrow(store, guestId, sessionId);
      const reportStatus = await getRequiredReportStatus(store, sessionId);

      if (session.status === "completed") {
        return {
          sessionId,
          status: "completed",
          reportStatus,
        };
      }

      if (session.status !== "started") {
        throw conflict(
          "session_not_started",
          "Only started sessions can be completed.",
        );
      }

      await store.insertSessionEvent({
        sessionId,
        clientEventId,
        activityId: SESSION_COMPLETE_ACTIVITY_ID,
        eventType: "complete",
        payload: {},
        clientTs,
      });
      await store.markLearningSessionCompleted(sessionId, clientTs);

      let nextReportStatus: ReportStatus = reportStatus;

      try {
        const summary = await generateSessionReportSummary({
          sessionId,
          lessonSlug: session.lessonSlug,
          store,
        });
        const updatedReport = await store.updateSessionReport({
          sessionId,
          status: "ready",
          summaryJson: summary,
          generatedAt: clientTs,
          generatorVersion: REPORT_GENERATOR_VERSION,
        });

        nextReportStatus = updatedReport.status;
      } catch (error) {
        console.error(error);

        try {
          const updatedReport = await store.updateSessionReport({
            sessionId,
            status: "failed",
            summaryJson: null,
            generatedAt: null,
            generatorVersion: REPORT_GENERATOR_VERSION,
          });

          nextReportStatus = updatedReport.status;
        } catch (reportUpdateError) {
          console.error(reportUpdateError);
          nextReportStatus = "failed";
        }
      }

      return {
        sessionId,
        status: "completed",
        reportStatus: nextReportStatus,
      };
    },

    async getSessionReport({
      guestId,
      sessionId,
    }: GetSessionReportInput): Promise<SessionReportResponse> {
      await getOwnedSessionOrThrow(store, guestId, sessionId);
      const report = await store.findSessionReportBySessionId(sessionId);

      if (!report) {
        throw invariant("Pending report placeholder is missing.");
      }

      return {
        sessionId,
        status: report.status,
        summaryJson: report.summaryJson,
        generatedAt: report.generatedAt,
      };
    },
  };
}

export type SessionService = ReturnType<typeof createSessionService>;
