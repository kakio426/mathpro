import { describe, expect, it } from "vitest";
import type { ModuleManifest } from "@/types/content";
import type {
  GuestProfile,
  JsonObject,
  LearningSession,
  ReportStatus,
  SessionReport,
  SessionReportSummary,
  TrackedSessionEventRecord,
} from "@/types/session";
import { createSessionService, SessionServiceError } from "./service";
import type { SessionStore } from "./store";

class MemorySessionStore implements SessionStore {
  profiles = new Map<string, GuestProfile>();
  sessions = new Map<string, LearningSession>();
  reports = new Map<string, SessionReport>();
  events = new Map<string, TrackedSessionEventRecord[]>();
  eventIds = new Map<string, Set<string>>();
  private profileCount = 0;
  private sessionCount = 0;
  private reportCount = 0;
  private eventCount = 0;

  async upsertGuestProfile({ guestId }: { guestId: string }) {
    const existing = this.profiles.get(guestId);

    if (existing) {
      const updated = {
        ...existing,
        lastSeenAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.profiles.set(guestId, updated);
      return updated;
    }

    const id = `profile-${++this.profileCount}`;
    const now = new Date().toISOString();
    const created: GuestProfile = {
      id,
      guestId,
      supabaseUserId: null,
      kind: "guest",
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    };

    this.profiles.set(guestId, created);
    return created;
  }

  async findProfileByGuestId(guestId: string) {
    return this.profiles.get(guestId) ?? null;
  }

  async createLearningSession(input: {
    profileId: string;
    moduleId: string;
    moduleVersion: string;
    lessonSlug: string;
  }) {
    const id = `session-${++this.sessionCount}`;
    const now = new Date().toISOString();
    const session: LearningSession = {
      id,
      profileId: input.profileId,
      moduleId: input.moduleId,
      moduleVersion: input.moduleVersion,
      lessonSlug: input.lessonSlug,
      status: "started",
      startedAt: now,
      completedAt: null,
      latestEventAt: null,
    };

    this.sessions.set(id, session);
    this.events.set(id, []);
    this.eventIds.set(id, new Set());
    return session;
  }

  async findLearningSessionById(sessionId: string) {
    return this.sessions.get(sessionId) ?? null;
  }

  async touchLearningSessionLatestEvent(sessionId: string, latestEventAt: string) {
    const session = this.sessions.get(sessionId);

    if (session) {
      if (
        session.latestEventAt === null ||
        new Date(latestEventAt).getTime() > new Date(session.latestEventAt).getTime()
      ) {
        session.latestEventAt = latestEventAt;
      }
      this.sessions.set(sessionId, session);
    }
  }

  async markLearningSessionCompleted(sessionId: string, completedAt: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error("Session missing.");
    }

    const updated: LearningSession = {
      ...session,
      status: "completed",
      completedAt,
      latestEventAt: completedAt,
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  async insertSessionEvent(input: {
    sessionId: string;
    clientEventId: string;
    activityId: string;
    eventType: "select" | "drag-end" | "drop" | "submit" | "hint-open" | "retry" | "free-text-submit" | "complete";
    payload: JsonObject;
    clientTs: string;
  }) {
    const sessionEvents = this.events.get(input.sessionId);
    const sessionEventIds = this.eventIds.get(input.sessionId);

    if (!sessionEvents || !sessionEventIds) {
      throw new Error("Event store missing.");
    }

    if (sessionEventIds.has(input.clientEventId)) {
      return {
        duplicated: true,
      };
    }

    sessionEventIds.add(input.clientEventId);
    sessionEvents.push({
      id: `event-${++this.eventCount}`,
      sessionId: input.sessionId,
      clientEventId: input.clientEventId,
      activityId: input.activityId,
      eventType: input.eventType,
      payload: input.payload,
      clientTs: input.clientTs,
      receivedAt: input.clientTs,
    });
    return {
      duplicated: false,
    };
  }

  async listSessionEventsBySessionId(sessionId: string) {
    return [...(this.events.get(sessionId) ?? [])];
  }

  async createSessionReport(input: {
    sessionId: string;
    status?: ReportStatus;
  }) {
    const id = `report-${++this.reportCount}`;
    const report: SessionReport = {
      id,
      sessionId: input.sessionId,
      status: input.status ?? "pending",
      summaryJson: null,
      generatedAt: null,
      generatorVersion: null,
    };

    this.reports.set(input.sessionId, report);
    return report;
  }

  async findSessionReportBySessionId(sessionId: string) {
    return this.reports.get(sessionId) ?? null;
  }

  async updateSessionReport(input: {
    sessionId: string;
    status: ReportStatus;
    summaryJson: SessionReportSummary | null;
    generatedAt: string | null;
    generatorVersion: string | null;
  }) {
    const report = this.reports.get(input.sessionId);

    if (!report) {
      throw new Error("Report missing.");
    }

    const updated: SessionReport = {
      ...report,
      status: input.status,
      summaryJson: input.summaryJson,
      generatedAt: input.generatedAt,
      generatorVersion: input.generatorVersion,
    };

    this.reports.set(input.sessionId, updated);
    return updated;
  }
}

function createManifest(lessonOrder: string[]): ModuleManifest {
  return {
    id: "fraction-lab-grades-3-4-v1",
    version: "1.0.0",
    title: "수학프로 | 분수 탐험실 v1",
    gradeBand: "3-4",
    domain: "number-and-operations",
    sessionFlow: [
      "pre-diagnosis",
      "manipulation",
      "prediction",
      "explanation",
      "generalization",
      "report",
    ],
    lessonOrder,
  };
}

function createSummary(
  overrides: Partial<SessionReportSummary> = {},
): SessionReportSummary {
  return {
    understoodConcepts: ["전체와 같은 크기 부분"],
    watchMisconceptions: ["현재 뚜렷한 오개념 없음"],
    explanationSummary: "전체를 같은 크기로 나눈 뒤 일부를 고른 상황이에요.",
    recommendedNextLessonId: "denominator-and-numerator",
    recommendedNextLessonTitle: "분모와 분자",
    ...overrides,
  };
}

describe("session-service", () => {
  it("starts a guest session and creates a pending report", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });

    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    expect(started.status).toBe("started");
    expect(started.reportStatus).toBe("pending");
    expect(store.profiles.size).toBe(1);
    expect(store.sessions.size).toBe(1);
    expect(store.reports.size).toBe(1);
  });

  it("reuses the same guest profile across multiple sessions", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });

    const first = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });
    const second = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    expect(store.profiles.size).toBe(1);
    expect(first.sessionId).not.toBe(second.sessionId);
    expect(store.sessions.size).toBe(2);
  });

  it("rejects an unknown lesson slug", async () => {
    const service = createSessionService({
      store: new MemorySessionStore(),
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });

    await expect(
      service.startGuestSession({
        guestId: "guest-1",
        lessonSlug: "unknown-lesson",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "unknown_lesson",
    } satisfies Partial<SessionServiceError>);
  });

  it("treats duplicate client event ids as idempotent", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });
    const firstTimestamp = "2026-01-01T00:00:10.000Z";
    const duplicateReplayTimestamp = "2026-01-01T00:00:05.000Z";

    const first = await service.appendSessionEvent({
      guestId: "guest-1",
      sessionId: started.sessionId,
      event: {
        clientEventId: "event-1",
        activityId: "L1-A1",
        eventType: "submit",
        payload: {},
        clientTs: firstTimestamp,
      },
    });
    const second = await service.appendSessionEvent({
      guestId: "guest-1",
      sessionId: started.sessionId,
      event: {
        clientEventId: "event-1",
        activityId: "L1-A1",
        eventType: "submit",
        payload: {},
        clientTs: duplicateReplayTimestamp,
      },
    });

    expect(first).toEqual({ ok: true, duplicated: false });
    expect(second).toEqual({ ok: true, duplicated: true });
    expect(store.sessions.get(started.sessionId)?.latestEventAt).toBe(firstTimestamp);
  });

  it("does not rewind latest event time for older non-duplicate events", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    await service.appendSessionEvent({
      guestId: "guest-1",
      sessionId: started.sessionId,
      event: {
        clientEventId: "event-1",
        activityId: "L1-A1",
        eventType: "submit",
        payload: {},
        clientTs: "2026-01-01T00:00:10.000Z",
      },
    });

    await service.appendSessionEvent({
      guestId: "guest-1",
      sessionId: started.sessionId,
      event: {
        clientEventId: "event-2",
        activityId: "L1-A1",
        eventType: "select",
        payload: {},
        clientTs: "2026-01-01T00:00:05.000Z",
      },
    });

    expect(store.sessions.get(started.sessionId)?.latestEventAt).toBe(
      "2026-01-01T00:00:10.000Z",
    );
  });

  it("stores a ready report summary when completeSession succeeds", async () => {
    const store = new MemorySessionStore();
    const summary = createSummary({
      watchMisconceptions: [
        "분모를 전체를 나눈 수가 아니라 고른 조각 수처럼 해석하고 있습니다.",
      ],
    });
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part", "denominator-and-numerator"]),
      generateSessionReportSummary: async () => summary,
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    const completed = await service.completeSession({
      guestId: "guest-1",
      sessionId: started.sessionId,
      clientEventId: "complete-1",
      clientTs: "2026-04-23T12:00:00.000Z",
    });

    expect(completed.reportStatus).toBe("ready");
    expect(store.reports.get(started.sessionId)).toMatchObject({
      status: "ready",
      summaryJson: summary,
      generatedAt: "2026-04-23T12:00:00.000Z",
      generatorVersion: "s5-rules-v1",
    });
  });

  it("keeps the session completed and marks the report as failed when diagnostics fail", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
      generateSessionReportSummary: async () => {
        throw new Error("diagnostics failed");
      },
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    const completed = await service.completeSession({
      guestId: "guest-1",
      sessionId: started.sessionId,
      clientEventId: "complete-1",
      clientTs: "2026-04-23T12:00:00.000Z",
    });

    expect(completed.reportStatus).toBe("failed");
    expect(store.sessions.get(started.sessionId)?.status).toBe("completed");
    expect(store.reports.get(started.sessionId)).toMatchObject({
      status: "failed",
      summaryJson: null,
      generatedAt: null,
      generatorVersion: "s5-rules-v1",
    });
  });

  it("blocks new events after the session is completed", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    await service.completeSession({
      guestId: "guest-1",
      sessionId: started.sessionId,
      clientEventId: "complete-1",
      clientTs: new Date().toISOString(),
    });

    await expect(
      service.appendSessionEvent({
        guestId: "guest-1",
        sessionId: started.sessionId,
        event: {
          clientEventId: "event-2",
          activityId: "L1-A2",
          eventType: "submit",
          payload: {},
          clientTs: new Date().toISOString(),
        },
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "session_not_started",
    } satisfies Partial<SessionServiceError>);
  });

  it("returns a stored ready report summary for the owning guest", async () => {
    const store = new MemorySessionStore();
    const summary = createSummary({
      recommendedNextLessonId: "compare-fractions-same-whole",
      recommendedNextLessonTitle: "같은 전체에서 크기 비교",
    });
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part", "compare-fractions-same-whole"]),
      generateSessionReportSummary: async () => summary,
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    await service.completeSession({
      guestId: "guest-1",
      sessionId: started.sessionId,
      clientEventId: "complete-1",
      clientTs: "2026-04-23T12:00:00.000Z",
    });

    await expect(
      service.getSessionReport({
        guestId: "guest-1",
        sessionId: started.sessionId,
      }),
    ).resolves.toMatchObject({
      sessionId: started.sessionId,
      status: "ready",
      summaryJson: summary,
    });
  });

  it("returns 404 when another guest requests the report", async () => {
    const store = new MemorySessionStore();
    const service = createSessionService({
      store,
      validateLesson: () => undefined,
      loadManifest: () => createManifest(["whole-and-part"]),
    });
    const started = await service.startGuestSession({
      guestId: "guest-1",
      lessonSlug: "whole-and-part",
    });

    await expect(
      service.getSessionReport({
        guestId: "guest-2",
        sessionId: started.sessionId,
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    } satisfies Partial<SessionServiceError>);
  });
});
