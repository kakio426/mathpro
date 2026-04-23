"use client";

import { useEffect, useState } from "react";
import {
  appendSessionEventResponseSchema,
  completeSessionResponseSchema,
  sessionEventInputSchema,
  startSessionResponseSchema,
  type AppendSessionEventResponse,
  type CompleteSessionResponse,
  type SessionEventInput,
  type StartSessionResponse,
} from "@/types/session";

const pendingSessionStarts = new Map<string, Promise<StartSessionResponse>>();

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

async function parseApiResponse<T>(
  response: Response,
  schema: { parse: (value: unknown) => T },
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? fallbackMessage);
  }

  return schema.parse(payload);
}

async function startLessonSession(
  lessonSlug: string,
): Promise<StartSessionResponse> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lessonSlug,
    }),
  });

  return parseApiResponse(
    response,
    startSessionResponseSchema,
    "학습 세션을 시작하지 못했어요.",
  );
}

function getOrStartLessonSession(lessonSlug: string) {
  const existing = pendingSessionStarts.get(lessonSlug);

  if (existing) {
    return existing;
  }

  const request = startLessonSession(lessonSlug).finally(() => {
    const current = pendingSessionStarts.get(lessonSlug);

    if (current === request) {
      pendingSessionStarts.delete(lessonSlug);
    }
  });

  pendingSessionStarts.set(lessonSlug, request);

  return request;
}

export function __resetPendingSessionStartsForTests() {
  pendingSessionStarts.clear();
}

async function appendTrackedEvent(
  sessionId: string,
  event: SessionEventInput,
): Promise<AppendSessionEventResponse> {
  const parsedEvent = sessionEventInputSchema.parse(event);
  const response = await fetch(`/api/sessions/${sessionId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsedEvent),
  });

  return parseApiResponse(
    response,
    appendSessionEventResponseSchema,
    "이 답안을 저장하지 못했어요.",
  );
}

async function completeTrackedSession(
  sessionId: string,
  input: { clientEventId: string; clientTs: string },
): Promise<CompleteSessionResponse> {
  const response = await fetch(`/api/sessions/${sessionId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseApiResponse(
    response,
    completeSessionResponseSchema,
    "마지막 완료 처리를 저장하지 못했어요.",
  );
}

export function useLessonSession(lessonSlug: string) {
  const [sessionStatus, setSessionStatus] = useState<
    "starting" | "ready" | "start-error"
  >("starting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [startSeed, setStartSeed] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setSessionStatus("starting");
        setFatalError(null);
        setSessionId(null);

        const response = await getOrStartLessonSession(lessonSlug);

        if (ignore) {
          return;
        }

        setSessionId(response.sessionId);
        setSessionStatus("ready");
      } catch (error) {
        if (ignore) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "학습 세션을 시작하지 못했어요.";

        setSessionStatus("start-error");
        setFatalError(message);
      }
    }

    void run();

    return () => {
      ignore = true;
    };
  }, [lessonSlug, startSeed]);

  return {
    sessionStatus,
    sessionId,
    fatalError,
    restart() {
      setStartSeed((current) => current + 1);
    },
    async postTrackedEvent(event: SessionEventInput) {
      if (!sessionId) {
        throw new Error("세션이 아직 준비되지 않았어요.");
      }

      return appendTrackedEvent(sessionId, event);
    },
    async completeSession(input: { clientEventId: string; clientTs: string }) {
      if (!sessionId) {
        throw new Error("세션이 아직 준비되지 않았어요.");
      }

      return completeTrackedSession(sessionId, input);
    },
  };
}
