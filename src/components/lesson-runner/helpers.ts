import type { LoadedActivitySpec } from "@/types/content";
import type { JsonObject } from "@/types/session";
import type {
  ActivityFeedbackState,
  ActivityValue,
  FractionBarsValue,
  FreeTextValue,
  MultipleChoiceValue,
  NumberLineValue,
} from "./types";

function sortNumbers(values: number[]) {
  return [...values].sort((left, right) => left - right);
}

export function createInitialActivityValue(activity: LoadedActivitySpec): ActivityValue {
  switch (activity.kind) {
    case "multiple-choice":
      return {
        kind: "multiple-choice",
        selectedOptionId: null,
      };
    case "fraction-bars":
      return {
        kind: "fraction-bars",
        selectedParts: [],
      };
    case "number-line":
      return {
        kind: "number-line",
        selectedStep: null,
      };
    case "free-text":
      return {
        kind: "free-text",
        text: "",
      };
  }
}

export type ActivityEvaluation =
  | {
      canSubmit: false;
      feedbackState: ActivityFeedbackState;
    }
  | {
      canSubmit: true;
      eventType: "submit" | "free-text-submit";
      payload: JsonObject;
      feedbackState: ActivityFeedbackState;
      isCorrect: boolean;
    };

export function evaluateActivity(
  activity: LoadedActivitySpec,
  value: ActivityValue,
): ActivityEvaluation {
  switch (activity.kind) {
    case "multiple-choice": {
      const typedValue = value as MultipleChoiceValue;

      if (!typedValue.selectedOptionId) {
        return {
          canSubmit: false,
          feedbackState: {
            status: "invalid",
            message: "먼저 하나를 고른 뒤 제출해 주세요.",
          },
        };
      }

      const isCorrect =
        typedValue.selectedOptionId === activity.props.correctOptionId;

      return {
        canSubmit: true,
        eventType: "submit",
        payload: {
          kind: activity.kind,
          response: {
            selectedOptionId: typedValue.selectedOptionId,
          },
          isCorrect,
        },
        feedbackState: isCorrect
          ? {
              status: "correct",
              message: "잘했어요. 다음 단계로 넘어가 볼까요?",
            }
          : {
              status: "incorrect",
              message: "조각의 의미를 다시 보고 한 번 더 생각해 볼까요?",
            },
        isCorrect,
      };
    }
    case "fraction-bars": {
      const typedValue = value as FractionBarsValue;

      if (typedValue.selectedParts.length === 0) {
        return {
          canSubmit: false,
          feedbackState: {
            status: "invalid",
            message: "조각을 선택한 뒤 제출해 주세요.",
          },
        };
      }

      const selectedParts = sortNumbers(typedValue.selectedParts);
      const correctParts = sortNumbers(activity.props.correctParts);
      const isCorrect =
        selectedParts.length === correctParts.length &&
        selectedParts.every((part, index) => part === correctParts[index]);

      return {
        canSubmit: true,
        eventType: "submit",
        payload: {
          kind: activity.kind,
          response: {
            selectedParts,
          },
          isCorrect,
        },
        feedbackState: isCorrect
          ? {
              status: "correct",
              message: "좋아요. 선택한 조각과 분수 기호가 잘 연결됐어요.",
            }
          : {
              status: "incorrect",
              message: "전체를 같은 크기로 나누고, 알맞은 개수만 골랐는지 다시 볼까요?",
            },
        isCorrect,
      };
    }
    case "number-line": {
      const typedValue = value as NumberLineValue;

      if (typedValue.selectedStep === null) {
        return {
          canSubmit: false,
          feedbackState: {
            status: "invalid",
            message: "표시를 움직여 위치를 정한 뒤 제출해 주세요.",
          },
        };
      }

      const targetStep =
        (activity.props.targetNumerator / activity.props.targetDenominator) *
        activity.props.partitionCount;
      const isCorrect = typedValue.selectedStep === targetStep;

      return {
        canSubmit: true,
        eventType: "submit",
        payload: {
          kind: activity.kind,
          response: {
            selectedStep: typedValue.selectedStep,
            partitionCount: activity.props.partitionCount,
          },
          isCorrect,
        },
        feedbackState: isCorrect
          ? {
              status: "correct",
              message: "좋아요. 같은 간격을 기준으로 분수 위치를 찾았어요.",
            }
          : {
              status: "incorrect",
              message: "0과 1 사이를 몇 등분했는지 다시 확인해 볼까요?",
            },
        isCorrect,
      };
    }
    case "free-text": {
      const typedValue = value as FreeTextValue;
      const text = typedValue.text.trim();
      const isLengthValid = text.length >= activity.props.minLength;

      return {
        canSubmit: true,
        eventType: "free-text-submit",
        payload: {
          kind: activity.kind,
          text,
          textLength: text.length,
          isLengthValid,
        },
        feedbackState: isLengthValid
          ? {
              status: "correct",
              message: "좋아요. 이제 이 생각을 다음 상황에도 적용해 볼까요?",
            }
          : {
              status: "invalid",
              message: `설명을 조금만 더 써 볼까요? 최소 ${activity.props.minLength}자 이상이면 됩니다.`,
            },
        isCorrect: isLengthValid,
      };
    }
  }
}

export function makeClientEventId(
  activityId: string,
  eventType: string,
  attempt: number,
) {
  const nonce =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${activityId}:${eventType}:${attempt}:${nonce}`;
}
