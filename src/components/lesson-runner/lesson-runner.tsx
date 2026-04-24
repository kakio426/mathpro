"use client";

import { startTransition, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ActivityRenderer } from "@/components/lesson-runner/activity-renderers/activity-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createInitialActivityValue, evaluateActivity, makeClientEventId } from "./helpers";
import type {
  ActivityFeedbackState,
  ActivityInteraction,
  ActivityValue,
  LessonRunnerProps,
  LessonRunnerState,
} from "./types";
import { useLessonSession } from "./use-lesson-session";

function formatStageLabel(stage: string) {
  switch (stage) {
    case "pre-diagnosis":
      return "사전진단";
    case "manipulation":
      return "조작";
    case "prediction":
      return "예측";
    case "explanation":
      return "설명";
    case "generalization":
      return "일반화";
    default:
      return stage;
  }
}

export function LessonRunner({
  lesson,
  moduleTitle,
  sessionStart,
  completionRedirectBasePath = "/report",
}: LessonRunnerProps) {
  const router = useRouter();
  const session = useLessonSession(lesson.slug, sessionStart);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [feedbackState, setFeedbackState] = useState<ActivityFeedbackState>({
    status: "idle",
  });
  const [activityValue, setActivityValue] = useState<ActivityValue>(
    createInitialActivityValue(lesson.activities[0]),
  );
  const [hintOpen, setHintOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentActivity = lesson.activities[currentIndex];
  const currentActivityValue =
    activityValue.kind === currentActivity.kind
      ? activityValue
      : createInitialActivityValue(currentActivity);
  const isLastActivity = currentIndex === lesson.activities.length - 1;

  const runnerState: LessonRunnerState = {
    sessionStatus: session.sessionStatus,
    sessionId: session.sessionId,
    currentIndex,
    attempt,
    feedbackState,
    activityValue: currentActivityValue,
  };

  function moveToNextActivity() {
    const nextIndex = currentIndex + 1;
    const nextActivity = lesson.activities[nextIndex];

    if (!nextActivity) {
      return;
    }

    setCurrentIndex(nextIndex);
    setAttempt(1);
    setFeedbackState({ status: "idle" });
    setActivityValue(createInitialActivityValue(nextActivity));
    setHintOpen(false);
    setSubmitError(null);
    setCompleteError(null);
    setIsSubmitting(false);
    setIsCompleting(false);
  }

  async function postTrackedInteraction(interaction: ActivityInteraction) {
    await session.postTrackedEvent({
      clientEventId: makeClientEventId(
        currentActivity.id,
        interaction.eventType,
        attempt,
      ),
      activityId: currentActivity.id,
      eventType: interaction.eventType,
      payload: interaction.payload,
      clientTs: new Date().toISOString(),
    });
  }

  function emitBackgroundInteraction(interaction: ActivityInteraction) {
    void postTrackedInteraction(interaction).catch((error) => {
      console.error(error);
    });
  }

  async function handleSubmit() {
    setSubmitError(null);
    setCompleteError(null);

    const evaluation = evaluateActivity(currentActivity, currentActivityValue);

    if (!evaluation.canSubmit) {
      setFeedbackState(evaluation.feedbackState);
      return;
    }

    setIsSubmitting(true);

    try {
      await session.postTrackedEvent({
        clientEventId: makeClientEventId(
          currentActivity.id,
          evaluation.eventType,
          attempt,
        ),
        activityId: currentActivity.id,
        eventType: evaluation.eventType,
        payload: evaluation.payload,
        clientTs: new Date().toISOString(),
      });

      setFeedbackState(evaluation.feedbackState);

      if (evaluation.isCorrect && isLastActivity) {
        await handleComplete();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "제출을 저장하지 못했어요. 다시 제출해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    setIsCompleting(true);
    setCompleteError(null);

    try {
      const completed = await session.completeSession({
        clientEventId: makeClientEventId(currentActivity.id, "complete", attempt),
        clientTs: new Date().toISOString(),
      });

      startTransition(() => {
        router.push(
          `${completionRedirectBasePath}/${completed.sessionId}` as Route,
        );
      });
    } catch (error) {
      setCompleteError(
        error instanceof Error
          ? error.message
          : "완료 처리를 저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setIsCompleting(false);
    }
  }

  if (session.sessionStatus === "starting") {
    return (
      <section className="py-[var(--space-section)]">
        <Container className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>학습 세션을 준비하고 있어요</CardTitle>
              <CardDescription>
                새 게스트 세션을 만들고 현재 lesson을 시작하는 중입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted">
              잠시만 기다리면 첫 활동이 바로 열립니다.
            </CardContent>
          </Card>
        </Container>
      </section>
    );
  }

  if (session.sessionStatus === "start-error") {
    return (
      <section className="py-[var(--space-section)]">
        <Container className="space-y-6">
          <Card className="border-accent/35">
            <CardHeader>
              <CardTitle>학습 세션을 시작하지 못했어요</CardTitle>
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
    <section className="py-[var(--space-section)]">
      <Container className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">{moduleTitle}</Badge>
          <Badge>{formatStageLabel(currentActivity.stage)}</Badge>
          <span className="text-sm text-muted">
            {runnerState.currentIndex + 1} / {lesson.activities.length}
          </span>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                <CardDescription>{lesson.goal}</CardDescription>
              </div>
              <div className="text-right text-sm leading-6 text-muted">
                <p>sessionId</p>
                <p className="font-mono text-xs">{runnerState.sessionId}</p>
              </div>
            </div>

            <div
              className="grid h-2 gap-2 rounded-full"
              style={{
                gridTemplateColumns: `repeat(${lesson.activities.length}, minmax(0, 1fr))`,
              }}
            >
              {lesson.activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "rounded-full bg-border",
                    index <= runnerState.currentIndex && "bg-primary",
                  )}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                {formatStageLabel(currentActivity.stage)}
              </p>
              <p className="text-lg leading-8 text-foreground">
                {currentActivity.prompt}
              </p>
            </div>

            <Separator />

            <ActivityRenderer
              activity={currentActivity}
              value={runnerState.activityValue}
              submitted={runnerState.feedbackState.status !== "idle"}
              disabled={isSubmitting || isCompleting}
              feedbackState={runnerState.feedbackState}
              hintOpen={hintOpen}
              submitError={submitError}
              isBusy={isSubmitting || isCompleting}
              onChange={(nextValue) => {
                setActivityValue(nextValue);
              }}
              onSubmit={handleSubmit}
              onHintOpen={() => {
                setHintOpen(true);
                emitBackgroundInteraction({
                  eventType: "hint-open",
                  payload: {
                    kind: currentActivity.kind,
                    hasHint: Boolean(currentActivity.copy.hint),
                  },
                });
              }}
              onRetry={() => {
                setAttempt((current) => current + 1);
                setFeedbackState({ status: "idle" });
                setHintOpen(false);
                setSubmitError(null);
                emitBackgroundInteraction({
                  eventType: "retry",
                  payload: {
                    kind: currentActivity.kind,
                    attempt: attempt + 1,
                  },
                });
              }}
              onTrack={(interaction) => {
                emitBackgroundInteraction(interaction);
              }}
            />

            {runnerState.feedbackState.status === "correct" && !isLastActivity ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={moveToNextActivity}
                >
                  다음
                </Button>
                <p className="text-sm leading-6 text-muted">
                  지금 답안은 저장되었습니다. 다음 단계로 넘어가 볼까요?
                </p>
              </div>
            ) : null}

            {isLastActivity && runnerState.feedbackState.status === "correct" ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-muted">
                  {isCompleting
                    ? "마지막 완료 처리를 저장한 뒤 리포트로 이동하고 있어요."
                    : "마지막 활동을 통과했습니다."}
                </p>
                {completeError ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm leading-6 text-red-700">{completeError}</p>
                    <Button
                      type="button"
                      disabled={isCompleting}
                      onClick={() => {
                        void handleComplete();
                      }}
                    >
                      완료 처리 재시도
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
