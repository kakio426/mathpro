"use client";

import type { LoadedActivitySpec } from "@/types/content";
import type { ActivityRendererProps, FractionBarsValue } from "../types";
import { cn } from "@/lib/utils";

type FractionBarsActivity = Extract<LoadedActivitySpec, { kind: "fraction-bars" }>;

export function FractionBarsRenderer({
  activity,
  value,
  disabled,
  onChange,
  onTrack,
}: ActivityRendererProps<FractionBarsActivity>) {
  const typedValue = value as FractionBarsValue;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-white/80 p-4">
        <p className="text-sm font-medium text-foreground">
          {activity.props.wholeLabel}
        </p>
        <div className="mt-4 flex overflow-hidden rounded-xl border border-border">
          {Array.from({ length: activity.props.partitionCount }, (_, index) => {
            const selected = typedValue.selectedParts.includes(index);
            const selectable = index < activity.props.selectableParts;

            return (
              <button
                key={index}
                type="button"
                aria-label={`${index + 1}번째 조각 선택`}
                aria-pressed={selected}
                disabled={disabled || !selectable}
                className={cn(
                  "min-h-20 flex-1 border-r border-border transition last:border-r-0",
                  selected ? "bg-accent/70" : "bg-white hover:bg-surface",
                  (!selectable || disabled) && "cursor-not-allowed opacity-70",
                )}
                onClick={() => {
                  const selectedParts = typedValue.selectedParts.includes(index)
                    ? typedValue.selectedParts.filter((part) => part !== index)
                    : [...typedValue.selectedParts, index].sort((left, right) => left - right);

                  onChange({
                    kind: "fraction-bars",
                    selectedParts,
                  });
                  onTrack({
                    eventType: "select",
                    payload: {
                      kind: activity.kind,
                      selectedParts,
                    },
                  });
                }}
              >
                <span className="text-xs font-semibold text-foreground/80">
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activity.props.allowUnequalPreview ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/80 p-4">
          <p className="text-sm font-medium text-foreground">
            같은 크기가 아니면 분수로 말하기 어려워요
          </p>
          <div className="mt-3 flex overflow-hidden rounded-xl border border-border">
            {[1, 1.6, 1, 1.3].map((ratio, index, ratios) => {
              const total = ratios.reduce((sum, current) => sum + current, 0);

              return (
                <div
                  key={index}
                  className="min-h-10 border-r border-border bg-white/80 last:border-r-0"
                  style={{ width: `${(ratio / total) * 100}%` }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            조각의 크기가 다르면 2조각을 골라도 같은 의미의 분수가 되지 않아요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
