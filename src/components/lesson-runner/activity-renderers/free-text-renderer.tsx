"use client";

import type { LoadedActivitySpec } from "@/types/content";
import type { ActivityRendererProps, FreeTextValue } from "../types";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type FreeTextActivity = Extract<LoadedActivitySpec, { kind: "free-text" }>;

export function FreeTextRenderer({
  activity,
  value,
  disabled,
  onChange,
}: ActivityRendererProps<FreeTextActivity>) {
  const typedValue = value as FreeTextValue;
  const trimmedLength = typedValue.text.trim().length;

  return (
    <div className="space-y-4">
      <Textarea
        aria-label="설명 입력"
        disabled={disabled}
        maxLength={activity.props.maxLength}
        placeholder={activity.props.placeholder}
        value={typedValue.text}
        onChange={(event) => {
          onChange({
            kind: "free-text",
            text: event.currentTarget.value,
          });
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span>
          최소 {activity.props.minLength}자, 최대 {activity.props.maxLength}자
        </span>
        <span>
          현재 {trimmedLength}자 / {activity.props.maxLength}자
        </span>
      </div>

      {activity.props.rubricKeywords?.length ? (
        <div className="flex flex-wrap gap-2">
          {activity.props.rubricKeywords.map((keyword) => (
            <Badge key={keyword} variant="accent">
              {keyword}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
