"use client";

import type { LoadedActivitySpec } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ActivityRendererProps } from "../types";
import { FractionBarsRenderer } from "./fraction-bars-renderer";
import { FreeTextRenderer } from "./free-text-renderer";
import { MultipleChoiceRenderer } from "./multiple-choice-renderer";
import { NumberLineRenderer } from "./number-line-renderer";

export function ActivityRenderer(props: ActivityRendererProps) {
  let renderer = null;

  switch (props.activity.kind) {
    case "multiple-choice":
      renderer = (
        <MultipleChoiceRenderer
          {...(props as ActivityRendererProps<
            Extract<LoadedActivitySpec, { kind: "multiple-choice" }>
          >)}
        />
      );
      break;
    case "fraction-bars":
      renderer = (
        <FractionBarsRenderer
          {...(props as ActivityRendererProps<
            Extract<LoadedActivitySpec, { kind: "fraction-bars" }>
          >)}
        />
      );
      break;
    case "number-line":
      renderer = (
        <NumberLineRenderer
          {...(props as ActivityRendererProps<
            Extract<LoadedActivitySpec, { kind: "number-line" }>
          >)}
        />
      );
      break;
    case "free-text":
      renderer = (
        <FreeTextRenderer
          {...(props as ActivityRendererProps<
            Extract<LoadedActivitySpec, { kind: "free-text" }>
          >)}
        />
      );
      break;
  }

  return (
    <div className="space-y-5">
      {renderer}

      <div className="space-y-3">
        {props.feedbackState.status !== "idle" ? (
          <Card
            className={
              props.feedbackState.status === "correct"
                ? "border-primary/25 bg-primary/10"
                : props.feedbackState.status === "incorrect"
                  ? "border-accent/35 bg-accent/10"
                  : "border-border bg-white/70"
            }
          >
            <CardContent className="pt-6 text-sm leading-6 text-foreground">
              {props.feedbackState.message}
            </CardContent>
          </Card>
        ) : null}

        {props.submitError ? (
          <p className="text-sm leading-6 text-red-700">{props.submitError}</p>
        ) : null}

        {props.hintOpen && props.activity.copy.hint ? (
          <Card className="border-dashed border-primary/35 bg-primary/5">
            <CardContent className="pt-6 text-sm leading-6 whitespace-pre-line text-foreground">
              {props.activity.copy.hint}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={props.disabled || props.feedbackState.status === "correct"}
            onClick={props.onSubmit}
          >
            {props.isBusy ? "처리 중..." : "제출하기"}
          </Button>

          {props.feedbackState.status === "incorrect" &&
          props.activity.copy.hint &&
          !props.hintOpen ? (
            <Button
              type="button"
              variant="secondary"
              disabled={props.disabled}
              onClick={props.onHintOpen}
            >
              힌트 보기
            </Button>
          ) : null}

          {props.feedbackState.status === "incorrect" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={props.disabled}
              onClick={props.onRetry}
            >
              다시 시도
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
