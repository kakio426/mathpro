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

export type LessonSessionStartConfig = {
  key: string;
  endpoint: string;
  body: Record<string, string>;
};

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
  startConfig: LessonSessionStartConfig,
): Promise<StartSessionResponse> {
  const response = await fetch(startConfig.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(startConfig.body),
  });

  return parseApiResponse(
    response,
    startSessionResponseSchema,
    "학습 세션을 시작하지 못했어요.",
  );
}

function getOrStartLessonSession(startConfig: LessonSessionStartConfig) {
  const existing = pendingSessionStarts.get(startConfig.key);

  if (existing) {
    return existing;
  }

  const request = startLessonSession(startConfig).finally(() => {
    const current = pendingSessionStarts.get(startConfig.key);

    if (current === request) {
      pendingSessionStarts.delete(startConfig.key);
    }
  });

  pendingSessionStarts.set(startConfig.key, request);

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

export function useLessonSession(
  lessonSlug: string,
  startConfig?: LessonSessionStartConfig,
) {
  const startKey = startConfig?.key ?? `lesson:${lessonSlug}`;
  const startEndpoint = startConfig?.endpoint ?? "/api/sessions";
  const startBodyKey = JSON.stringify(startConfig?.body ?? { lessonSlug });
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

        const response = await getOrStartLessonSession({
          key: startKey,
          endpoint: startEndpoint,
          body: JSON.parse(startBodyKey) as Record<string, string>,
        });

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
  }, [lessonSlug, startSeed, startKey, startEndpoint, startBodyKey]);

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
