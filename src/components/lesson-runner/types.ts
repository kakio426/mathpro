import type { LoadedActivitySpec, LoadedLessonSpec } from "@/types/content";
import type { JsonObject, TrackedSessionEventType } from "@/types/session";

export type MultipleChoiceValue = {
  kind: "multiple-choice";
  selectedOptionId: string | null;
};

export type FractionBarsValue = {
  kind: "fraction-bars";
  selectedParts: number[];
};

export type NumberLineValue = {
  kind: "number-line";
  selectedStep: number | null;
};

export type FreeTextValue = {
  kind: "free-text";
  text: string;
};

export type ActivityValue =
  | MultipleChoiceValue
  | FractionBarsValue
  | NumberLineValue
  | FreeTextValue;

export type ActivityFeedbackState = {
  status: "idle" | "correct" | "incorrect" | "invalid";
  message?: string;
};

export type LessonRunnerProps = {
  lesson: LoadedLessonSpec;
  moduleTitle: string;
  sessionStart?: {
    key: string;
    endpoint: string;
    body: Record<string, string>;
  };
  completionRedirectBasePath?: string;
};

export type LessonRunnerState = {
  sessionStatus: "starting" | "ready" | "start-error";
  sessionId: string | null;
  currentIndex: number;
  attempt: number;
  feedbackState: ActivityFeedbackState;
  activityValue: ActivityValue;
};

export type ActivityInteraction = {
  eventType: TrackedSessionEventType;
  payload: JsonObject;
};

export type ActivityRendererProps<TActivity extends LoadedActivitySpec = LoadedActivitySpec> = {
  activity: TActivity;
  value: ActivityValue;
  submitted: boolean;
  disabled: boolean;
  feedbackState: ActivityFeedbackState;
  hintOpen: boolean;
  submitError?: string | null;
  isBusy?: boolean;
  onChange: (value: ActivityValue) => void;
  onSubmit: () => void;
  onHintOpen: () => void;
  onRetry: () => void;
  onTrack: (interaction: ActivityInteraction) => void;
};
