"use client";

import type { LoadedActivitySpec } from "@/types/content";
import type { ActivityRendererProps, MultipleChoiceValue } from "../types";
import { cn } from "@/lib/utils";

type MultipleChoiceActivity = Extract<LoadedActivitySpec, { kind: "multiple-choice" }>;

export function MultipleChoiceRenderer({
  activity,
  value,
  disabled,
  onChange,
  onTrack,
}: ActivityRendererProps<MultipleChoiceActivity>) {
  const typedValue = value as MultipleChoiceValue;

  return (
    <div className="space-y-3">
      {activity.props.options.map((option) => {
        const selected = typedValue.selectedOptionId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            className={cn(
              "w-full rounded-xl border px-4 py-4 text-left transition",
              selected
                ? "border-primary bg-primary/10 shadow-soft"
                : "border-border bg-white/80 hover:bg-white",
              disabled && "cursor-not-allowed opacity-70",
            )}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => {
              const nextValue: MultipleChoiceValue = {
                kind: "multiple-choice",
                selectedOptionId: option.id,
              };

              onChange(nextValue);
              onTrack({
                eventType: "select",
                payload: {
                  kind: activity.kind,
                  optionId: option.id,
                },
              });
            }}
          >
            <span className="block text-sm font-semibold text-foreground">
              {option.id}
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted">
              {option.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
