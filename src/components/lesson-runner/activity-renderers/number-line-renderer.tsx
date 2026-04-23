"use client";

import type { LoadedActivitySpec } from "@/types/content";
import type { ActivityRendererProps, NumberLineValue } from "../types";
import { Input } from "@/components/ui/input";

type NumberLineActivity = Extract<LoadedActivitySpec, { kind: "number-line" }>;

export function NumberLineRenderer({
  activity,
  value,
  disabled,
  onChange,
  onTrack,
}: ActivityRendererProps<NumberLineActivity>) {
  const typedValue = value as NumberLineValue;

  const commitDrag = (selectedStep: number | null) => {
    if (selectedStep === null) {
      return;
    }

    onTrack({
      eventType: "drag-end",
      payload: {
        kind: activity.kind,
        selectedStep,
        partitionCount: activity.props.partitionCount,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-white/80 p-4">
        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <span>{activity.props.min}</span>
          <span>
            목표: {activity.props.targetNumerator}/{activity.props.targetDenominator}
          </span>
          <span>{activity.props.max}</span>
        </div>

        <Input
          type="range"
          min={0}
          max={activity.props.partitionCount}
          step={1}
          value={typedValue.selectedStep ?? 0}
          disabled={disabled}
          aria-label={`${activity.props.targetNumerator}/${activity.props.targetDenominator} 위치 슬라이더`}
          className="mt-4 h-12 cursor-pointer px-0"
          onChange={(event) => {
            onChange({
              kind: "number-line",
              selectedStep: Number(event.currentTarget.value),
            });
          }}
          onMouseUp={(event) => {
            commitDrag(Number(event.currentTarget.value));
          }}
          onTouchEnd={(event) => {
            commitDrag(Number(event.currentTarget.value));
          }}
          onKeyUp={(event) => {
            commitDrag(Number((event.currentTarget as HTMLInputElement).value));
          }}
        />

        <div
          className="mt-4 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${activity.props.partitionCount + 1}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: activity.props.partitionCount + 1 }, (_, index) => (
            <div key={index} className="space-y-2 text-center">
              <div className="mx-auto h-3 w-px bg-border" />
              {activity.props.showLabels ? (
                <span className="text-xs text-muted">
                  {index}/{activity.props.partitionCount}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm leading-6 text-muted">
        {typedValue.selectedStep === null
          ? "아직 위치를 정하지 않았어요."
          : `지금은 ${typedValue.selectedStep}/${activity.props.partitionCount} 지점을 가리키고 있어요.`}
      </p>
    </div>
  );
}
