"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  toFriendlyActivityTitle,
  toFriendlyHtmlArtifactSource,
  toStudentActivityInstruction,
} from "@/features/teacher/display";
import type { JsonObject, JsonValue, TrackedSessionEventType } from "@/types/session";
import type {
  ActivityBlock,
  HtmlArtifactEventType,
  PublishedAssignment,
} from "@/types/teacher";
import { useLessonSession } from "@/components/lesson-runner/use-lesson-session";

type HtmlArtifactRunnerProps = {
  assignment: PublishedAssignment;
  block: ActivityBlock;
};

type ArtifactLogEntry = {
  eventType: HtmlArtifactEventType;
  receivedAt: string;
};

const artifactSessionEventTypes = new Set<TrackedSessionEventType>([
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

const defaultAllowedEvents: HtmlArtifactEventType[] = [
  "ready",
  "interaction",
  "select",
  "drag-end",
  "hint-open",
  "retry",
  "submit",
  "complete",
];

function makeArtifactClientEventId(
  blockId: string,
  eventType: string,
  sequence: number,
) {
  return `${blockId}:${eventType}:artifact:${sequence}:${crypto.randomUUID()}`;
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        toJsonValue(entry),
      ]),
    );
  }

  return null;
}

function toJsonObject(value: unknown): JsonObject {
  const jsonValue = toJsonValue(value);

  if (
    jsonValue &&
    typeof jsonValue === "object" &&
    !Array.isArray(jsonValue)
  ) {
    return jsonValue;
  }

  return {
    value: jsonValue,
  };
}

function readArtifactEventType(data: unknown): HtmlArtifactEventType | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const rawType = record.eventType ?? record.type ?? record.mathproEvent;

  if (typeof rawType !== "string") {
    return null;
  }

  if (!defaultAllowedEvents.includes(rawType as HtmlArtifactEventType)) {
    return null;
  }

  return rawType as HtmlArtifactEventType;
}

function readArtifactPayload(data: unknown): JsonObject {
  if (!data || typeof data !== "object") {
    return {};
  }

  const record = data as Record<string, unknown>;
  return toJsonObject(record.payload ?? record);
}

function artifactStateLabel(
  state: "booting" | "ready" | "running" | "completed" | "error",
) {
  switch (state) {
    case "booting":
      return "세션 준비";
    case "ready":
      return "자료 준비 완료";
    case "running":
      return "조작 기록 중";
    case "completed":
      return "활동 완료";
    case "error":
      return "저장 확인 필요";
  }
}

function artifactEventLabel(eventType: HtmlArtifactEventType) {
  switch (eventType) {
    case "ready":
      return "자료 열림";
    case "interaction":
      return "조작";
    case "select":
      return "선택";
    case "drag-end":
      return "움직임";
    case "submit":
      return "제출";
    case "hint-open":
      return "도움 보기";
    case "retry":
      return "다시 시도";
    case "complete":
      return "완료";
  }
}

export function HtmlArtifactRunner({
  assignment,
  block,
}: HtmlArtifactRunnerProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const eventSequenceRef = useRef(0);
  const session = useLessonSession(assignment.document.sourceLessonSlug, {
    key: `assignment:${assignment.code}`,
    endpoint: `/api/assignments/${assignment.code}/sessions`,
    body: {},
  });
  const [artifactState, setArtifactState] = useState<
    "booting" | "ready" | "running" | "completed" | "error"
  >("booting");
  const [eventLog, setEventLog] = useState<ArtifactLogEntry[]>([]);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const allowedEvents = block.allowedEvents?.length
    ? block.allowedEvents
    : defaultAllowedEvents;
  const activityTitle = toFriendlyActivityTitle(
    block.title,
    assignment.document.concept,
  );
  const activityInstruction = toStudentActivityInstruction(
    block.instruction,
    assignment.document.concept,
  );
  const artifactSource = toFriendlyHtmlArtifactSource(
    block.html ?? "",
    assignment.document.concept,
  );

  const receiveArtifactMessage = useEffectEvent((event: MessageEvent) => {
    const iframeWindow = iframeRef.current?.contentWindow;

    if (!iframeWindow || event.source !== iframeWindow) {
      return;
    }

    const eventType = readArtifactEventType(event.data);

    if (!eventType || !allowedEvents.includes(eventType)) {
      return;
    }

    const payload = {
      ...readArtifactPayload(event.data),
      artifactEventType: eventType,
      blockId: block.id,
      assignmentCode: assignment.code,
    };

    if (!session.sessionId) {
      return;
    }

    const receivedAt = new Date().toISOString();
    eventSequenceRef.current += 1;
    const sequence = eventSequenceRef.current;

    setEventLog((current) =>
      [{ eventType, receivedAt }, ...current].slice(0, 6),
    );
    setBridgeError(null);

    if (eventType === "ready") {
      setArtifactState("ready");
    } else {
      setArtifactState("running");
    }

    if (eventType === "complete") {
      void session
        .completeSession({
          clientEventId: makeArtifactClientEventId(
            block.id,
            eventType,
            sequence,
          ),
          clientTs: receivedAt,
        })
        .then((completed) => {
          setArtifactState("completed");
          startTransition(() => {
            router.push(`/report/${completed.sessionId}` as Route);
          });
        })
        .catch((error) => {
          setArtifactState("error");
          setBridgeError(
            error instanceof Error
              ? error.message
              : "완료 이벤트를 저장하지 못했어요.",
          );
        });
      return;
    }

    if (!artifactSessionEventTypes.has(eventType as TrackedSessionEventType)) {
      return;
    }

    void session
      .postTrackedEvent({
        clientEventId: makeArtifactClientEventId(block.id, eventType, sequence),
        activityId: block.id,
        eventType: eventType as TrackedSessionEventType,
        payload,
        clientTs: receivedAt,
      })
      .catch((error) => {
        setArtifactState("error");
        setBridgeError(
          error instanceof Error
            ? error.message
            : "상호작용 이벤트를 저장하지 못했어요.",
        );
      });
  });

  useEffect(() => {
    window.addEventListener("message", receiveArtifactMessage);

    return () => {
      window.removeEventListener("message", receiveArtifactMessage);
    };
  }, []);

  if (session.sessionStatus === "starting") {
    return (
      <section className="py-[var(--space-section)]">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>참여 세션을 준비하고 있어요</CardTitle>
              <CardDescription>
                움직이는 수업자료를 열기 전에 저장 세션을 만들고 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </Container>
      </section>
    );
  }

  if (session.sessionStatus === "start-error") {
    return (
      <section className="py-[var(--space-section)]">
        <Container>
          <Card className="border-accent/35">
            <CardHeader>
              <CardTitle>참여 세션을 시작하지 못했어요</CardTitle>
              <CardDescription>
                {session.fatalError ??
                  "세션 생성 중 문제가 생겼습니다. 다시 시작해 주세요."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={session.restart}>
                다시 시작
              </Button>
            </CardContent>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8">
      <Container className="max-w-[1500px] space-y-5">
        <div className="rounded-[2rem] border border-border bg-[#12312e] p-5 text-white shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">
                  오늘의 활동
                </Badge>
                <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                  참여 코드 {assignment.code}
                </Badge>
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {activityTitle}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-teal-50/80">
                  {activityInstruction}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
              <p className="text-teal-100/70">현재 상태</p>
              <p className="mt-1 font-semibold">
                {artifactStateLabel(artifactState)}
              </p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] bg-[#fefbf5]">
          <CardContent className="space-y-4 p-3 sm:p-4">
            <div className="overflow-hidden rounded-[1.6rem] border border-border bg-white shadow-soft">
              <iframe
                ref={iframeRef}
                title={`${activityTitle} 화면`}
                allow=""
                referrerPolicy="no-referrer"
                sandbox="allow-scripts"
                srcDoc={artifactSource}
                className="h-[72vh] min-h-[560px] w-full bg-white"
              />
            </div>

            <details className="group rounded-[1.25rem] border border-border bg-white/70 p-4 text-sm leading-6 text-muted">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                <span>활동 진행 상태 보기</span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted">
                  기록 {eventLog.length}개
                </span>
              </summary>
              <Separator className="my-4" />
              <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-2">
                  <p>
                    활동 중 선택과 제출 과정을 안전하게 기록합니다. 활동이 끝나면
                    오늘의 결과 화면으로 이동합니다.
                  </p>
                  {bridgeError ? (
                    <p className="text-red-700">{bridgeError}</p>
                  ) : null}
                </div>
                <div className="space-y-2 rounded-2xl bg-secondary/55 p-4">
                  <p className="font-semibold text-foreground">최근 조작 기록</p>
                  {eventLog.length > 0 ? (
                    eventLog.map((entry) => (
                      <p key={`${entry.eventType}:${entry.receivedAt}`}>
                        {artifactEventLabel(entry.eventType)} ·{" "}
                        {new Date(entry.receivedAt).toLocaleTimeString("ko-KR")}
                      </p>
                    ))
                  ) : (
                    <p>아직 저장된 조작 기록이 없습니다.</p>
                  )}
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
