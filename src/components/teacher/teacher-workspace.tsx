"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  Blocks,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  MonitorPlay,
  QrCode,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  GuidedTour,
  type GuidedTourStep,
} from "@/components/onboarding/guided-tour";
import { AiResultImportDialog } from "@/components/teacher/ai-result-import-dialog";
import { AssignmentShareCard } from "@/components/teacher/assignment-share-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildEducationalSimulationPrompt,
  parseAiMaterialOutput,
} from "@/features/teacher/ai-material";
import {
  createDraftRequestFromTemplate,
  teacherHtmlTemplates,
} from "@/features/teacher/html-templates";
import type {
  CreateTeacherDraftRequest,
  PublishedAssignment,
  TeacherActivityDocument,
} from "@/types/teacher";

type DraftResponse = {
  document: TeacherActivityDocument;
};

type PublishResponse = {
  assignment: PublishedAssignment;
};

export type TeacherWorkspaceReuseSource = {
  assignmentId: string;
  code: string;
  title: string;
  document: TeacherActivityDocument;
};

type TeacherWorkspaceProps = {
  reuseSource?: TeacherWorkspaceReuseSource | null;
  reuseLoadError?: string | null;
};

export type TeacherWorkspaceStep =
  | "empty"
  | "prompt-ready"
  | "import-open"
  | "preview-ready"
  | "draft-ready"
  | "published";

const defaultTemplate = teacherHtmlTemplates[0];

const navItems = [
  { label: "자료 만들기", href: "/" as Route, icon: Wand2, active: true },
  {
    label: "내 자료",
    href: "/teacher/activities" as Route,
    icon: Blocks,
    active: false,
  },
  {
    label: "배포/참여",
    href: "/teacher/distribution" as Route,
    icon: QrCode,
    active: false,
  },
  {
    label: "결과 보기",
    href: "/teacher/reports" as Route,
    icon: BarChart3,
    active: false,
  },
];

const studioSteps = [
  {
    id: "01",
    title: "주제 입력",
    description: "만들고 싶은 수업자료를 한 문장으로 적습니다.",
  },
  {
    id: "02",
    title: "AI 요청문 복사",
    description: "Gemini에 붙여넣을 요청문을 자동으로 만듭니다.",
  },
  {
    id: "03",
    title: "미리보기 후 발행",
    description: "학생 화면을 확인하고 참여 코드로 공유합니다.",
  },
];

const teacherWorkspaceTourSteps: GuidedTourStep[] = [
  {
    eyebrow: "처음 1분 안내",
    title: "주제만 적고 시작합니다",
    body: "먼저 만들고 싶은 수업자료를 한 문장으로 적습니다. 예를 들어 '초등 4학년 수직선에서 3/4 찾기'처럼 쓰면 됩니다.",
    detail:
      "세부 조건은 나중에 열어볼 수 있습니다. 처음에는 수업 장면만 떠올리면 충분합니다.",
  },
  {
    eyebrow: "AI 요청문",
    title: "수학프로가 Gemini에 보낼 요청문을 만들어 줍니다",
    body: "주제를 바탕으로 움직이는 수업자료를 만들기 위한 요청문을 준비합니다. 복사해서 Gemini에 붙여넣으면 됩니다.",
  },
  {
    eyebrow: "미리보기",
    title: "기본 화면은 학생에게 보일 모습만 보여줍니다",
    body: "어려운 원본은 접어 두고, 선생님은 학생 화면이 잘 보이는지 먼저 확인합니다.",
    detail:
      "AI가 만든 결과를 붙여넣어야 할 때만 AI 결과 가져오기 창을 열면 됩니다.",
  },
  {
    eyebrow: "발행",
    title: "확인한 자료를 참여 코드로 공유합니다",
    body: "미리보기가 괜찮으면 발행 준비를 하고, 참여 코드와 QR 또는 링크로 학생에게 공유합니다.",
  },
];

function findHtmlArtifactBlock(document: TeacherActivityDocument) {
  return document.blocks.find(
    (block) => block.type === "html-artifact" && block.html,
  );
}

function buildPromptForForm(form: CreateTeacherDraftRequest) {
  return buildEducationalSimulationPrompt({
    concept: form.concept,
    difficulty: form.difficulty,
    goal: form.goal,
    gradeBand: form.gradeBand,
    interactionKind: form.interactionKind,
  });
}

function topicToDraftForm(topic: string, current: CreateTeacherDraftRequest) {
  const trimmedTopic = topic.trim();

  if (!trimmedTopic) {
    return current;
  }

  return {
    ...current,
    concept: trimmedTopic,
    goal: `${trimmedTopic}를 학생이 직접 조작하고 관찰하며 설명한다.`,
  };
}

function createInitialForm(
  reuseSource: TeacherWorkspaceReuseSource | null,
): CreateTeacherDraftRequest {
  if (!reuseSource) {
    const draft = createDraftRequestFromTemplate(defaultTemplate);
    const blankStarter: CreateTeacherDraftRequest = {
      ...draft,
      concept: "분수 탐구",
      goal: "학생이 직접 조작하고 관찰하며 분수 개념을 탐구한다.",
      interactionKind: "html-artifact",
      html: "",
    };

    return {
      ...blankStarter,
      promptTemplate: buildPromptForForm(blankStarter),
    };
  }

  const sourceDocument = reuseSource.document;
  const htmlBlock = findHtmlArtifactBlock(sourceDocument);
  const fallbackDraft = createDraftRequestFromTemplate(defaultTemplate);
  const nextForm: CreateTeacherDraftRequest = {
    gradeBand: sourceDocument.gradeBand,
    concept: sourceDocument.concept,
    goal: sourceDocument.goal,
    interactionKind: htmlBlock?.interactionKind ?? "html-artifact",
    difficulty: sourceDocument.difficulty,
    sourceLessonSlug: sourceDocument.sourceLessonSlug,
    html: htmlBlock?.html ?? fallbackDraft.html,
    promptTemplate: htmlBlock?.promptTemplate,
    teacherGuide: sourceDocument.teacherGuide,
    learningQuestions: sourceDocument.learningQuestions,
    aiOutputRaw: sourceDocument.aiOutputRaw,
  };

  return {
    ...nextForm,
    promptTemplate: nextForm.promptTemplate ?? buildPromptForForm(nextForm),
  };
}

function createInitialTopic(
  reuseSource: TeacherWorkspaceReuseSource | null,
  form: CreateTeacherDraftRequest,
) {
  if (reuseSource) {
    return form.concept;
  }

  return "";
}

function safetyStatusLabel(
  status: NonNullable<TeacherActivityDocument["blocks"][number]["safetyStatus"]>,
) {
  switch (status) {
    case "passed":
      return "학생 화면 보호 확인 완료";
    case "warning":
      return "확인할 점 있음";
    case "blocked":
      return "발행 전 수정 필요";
    case "unchecked":
      return "확인 전";
  }
}

function safetyBadgeClassName(
  status: TeacherActivityDocument["blocks"][number]["safetyStatus"],
) {
  if (status === "passed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "blocked") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-border bg-secondary/60 text-muted";
}

function safetyGuideClassName(
  status: TeacherActivityDocument["blocks"][number]["safetyStatus"],
) {
  if (status === "blocked") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-border bg-secondary/50 text-muted";
}

async function parseApiJson<T>(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | T
    | null;

  if (!response.ok) {
    throw new Error(
      (payload as { error?: { message?: string } } | null)?.error?.message ??
        fallbackMessage,
    );
  }

  return payload as T;
}

export function TeacherWorkspace({
  reuseSource = null,
  reuseLoadError = null,
}: TeacherWorkspaceProps) {
  const initialForm = createInitialForm(reuseSource);
  const [form, setForm] = useState<CreateTeacherDraftRequest>(initialForm);
  const [topic, setTopic] = useState(() =>
    createInitialTopic(reuseSource, initialForm),
  );
  const [document, setDocument] = useState<TeacherActivityDocument | null>(null);
  const [assignment, setAssignment] = useState<PublishedAssignment | null>(null);
  const [status, setStatus] = useState<"idle" | "drafting" | "publishing">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [promptReady, setPromptReady] = useState(Boolean(reuseSource));
  const [isImportOpen, setIsImportOpen] = useState(false);
  const geminiPrompt = form.promptTemplate ?? buildPromptForForm(form);
  const aiImportValue = form.aiOutputRaw ?? form.html ?? "";
  const hasTopic = topic.trim().length > 0;
  const hasPastedResult = Boolean(form.html?.trim());
  const learningQuestions = form.learningQuestions?.slice(0, 3) ?? [];
  const documentHasBlockedHtml = Boolean(
    document?.blocks.some((block) => block.safetyStatus === "blocked"),
  );
  const workspaceStep: TeacherWorkspaceStep = isImportOpen
    ? "import-open"
    : assignment
      ? "published"
      : document
        ? "draft-ready"
        : hasPastedResult
          ? "preview-ready"
          : promptReady
            ? "prompt-ready"
            : "empty";

  function handleTopicChange(value: string) {
    setTopic(value);
    setPromptReady(false);
    setDocument(null);
    setAssignment(null);
    setError(null);
    setImportError(null);
    setIsImportOpen(false);
    setForm((current) => ({
      ...topicToDraftForm(value, current),
      html: "",
      teacherGuide: undefined,
      learningQuestions: undefined,
      aiOutputRaw: undefined,
    }));
  }

  function handlePreparePrompt() {
    const nextForm = topicToDraftForm(topic, form);

    setForm({
      ...nextForm,
      promptTemplate: buildPromptForForm(nextForm),
    });
    setPromptReady(true);
    setDocument(null);
    setAssignment(null);
    setError(null);
    setImportError(null);
    setIsImportOpen(false);
  }

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextForm = topicToDraftForm(topic, form);

    setStatus("drafting");
    setError(null);
    setAssignment(null);
    setForm(nextForm);

    try {
      const response = await fetch("/api/teacher/activities/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...nextForm,
          promptTemplate: nextForm.promptTemplate ?? buildPromptForForm(nextForm),
        }),
      });
      const payload = await parseApiJson<DraftResponse>(
        response,
        "자료를 준비하지 못했습니다.",
      );

      setDocument(payload.document);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "자료를 준비하지 못했습니다.",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function handlePublish() {
    if (!document) {
      return;
    }

    setStatus("publishing");
    setError(null);

    try {
      const response = await fetch("/api/teacher/activities/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document }),
      });
      const payload = await parseApiJson<PublishResponse>(
        response,
        "자료를 발행하지 못했습니다.",
      );

      setAssignment(payload.assignment);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "자료를 발행하지 못했습니다.",
      );
    } finally {
      setStatus("idle");
    }
  }

  function handleApplyTemplate(template: (typeof teacherHtmlTemplates)[number]) {
    const nextForm = createDraftRequestFromTemplate(template);

    setTopic(template.title);
    setForm({
      ...nextForm,
      promptTemplate: buildPromptForForm(nextForm),
      teacherGuide: `${template.title}을 학생 화면으로 바로 실행해 조작 과정을 함께 관찰합니다.`,
      learningQuestions: [
        "학생이 처음 선택한 조작은 무엇이었나요?",
        "어느 지점에서 생각을 바꾸거나 다시 시도했나요?",
        "이 활동을 다른 예시로 바꾸면 어떤 점이 달라질까요?",
      ],
      aiOutputRaw: undefined,
    });
    setPromptReady(true);
    setDocument(null);
    setAssignment(null);
    setError(null);
    setImportError(null);
    setIsImportOpen(false);
  }

  function handleImportedResultChange(value: string) {
    const parsed = parseAiMaterialOutput(value);

    setForm((current) => ({
      ...current,
      html: parsed.html ?? "",
      teacherGuide: parsed.teacherGuide,
      learningQuestions: parsed.learningQuestions,
      aiOutputRaw: value,
      promptTemplate: current.promptTemplate ?? geminiPrompt,
    }));
    setDocument(null);
    setAssignment(null);
    setError(null);
    setImportError(
      parsed.html || !value.trim()
        ? null
        : "HTML 부분을 찾지 못했어요. Gemini 답변 전체를 다시 붙여넣어 주세요.",
    );
  }

  function handleUseImportedResult() {
    if (!form.html?.trim()) {
      setImportError(
        "HTML 부분을 찾지 못했어요. Gemini 답변 전체를 다시 붙여넣어 주세요.",
      );
      return;
    }

    setIsImportOpen(false);
    setDocument(null);
    setAssignment(null);
    setError(null);
    setImportError(null);
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard?.writeText(geminiPrompt);
    } catch {
      // 브라우저 권한이 막혀도 제작 흐름은 계속 진행됩니다.
    }
  }

  return (
    <main
      className="relative isolate min-h-[calc(100vh-8rem)] overflow-hidden"
      data-workspace-step={workspaceStep}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(15,118,110,0.18),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(245,158,11,0.18),transparent_24%)]"
      />
      <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-[2rem] border border-border bg-[#12312e] px-5 py-6 text-white shadow-soft sm:px-7 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">
                  AI 수업자료 메이커
                </Badge>
                <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                  주제만 넣고 시작
                </Badge>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-[0.18em] text-teal-100 uppercase">
                  수학프로 제작실
                </p>
                <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight [word-break:keep-all] sm:text-5xl">
                  어떤 수업자료를 만들까요?
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-teal-50/80 sm:text-base">
                  주제만 적으면 수학프로가 Gemini에 넣을 요청문을 준비합니다.
                  선생님은 학생에게 보일 화면만 확인하고 공유하면 됩니다.
                </p>
                <GuidedTour
                  autoOpen
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  startLabel="처음 사용하는 선생님 안내"
                  steps={teacherWorkspaceTourSteps}
                  storageKey="mathpro:tour:teacher-workspace"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {studioSteps.map((step) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                  key={step.id}
                >
                  <p className="font-mono text-xs text-teal-100/70">{step.id}</p>
                  <p className="mt-2 font-semibold">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {reuseSource ? (
          <section className="mb-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900 shadow-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold">불러온 자료로 다시 만들기</p>
                <p className="mt-1">
                  “{reuseSource.title}” 자료를 새 수업자료의 출발점으로 불러왔습니다.
                  주제나 학생 화면을 조금 바꾼 뒤 다시 발행할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-300 bg-white/70 text-emerald-900">
                  원본 참여 코드 {reuseSource.code}
                </Badge>
                <Button asChild size="sm" variant="secondary">
                  <Link href={"/" as Route}>새 자료로 시작</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {reuseLoadError ? (
          <section className="mb-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-card">
            <p className="font-semibold">기존 자료를 불러오지 못했어요.</p>
            <p className="mt-1">{reuseLoadError}</p>
          </section>
        ) : null}

        <form
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_430px]"
          onSubmit={handleCreateDraft}
        >
          <section className="space-y-5">
            <section className="rounded-[1.75rem] border border-border bg-panel p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-3">
                  <Badge variant="accent">1단계</Badge>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    수업자료 주제 입력
                  </h2>
                  <p className="text-sm leading-7 text-muted">
                    주제만 적으면 됩니다. 수업 목표와 세부 요청은 수학프로가
                    선생님 대신 정리합니다.
                  </p>
                </div>
                <nav className="flex flex-wrap gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                          item.active
                            ? "bg-primary text-primary-foreground shadow-card"
                            : "bg-white/70 text-foreground hover:bg-white"
                        }`}
                        href={item.href}
                        key={item.label}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  만들고 싶은 자료
                  <Input
                    className="h-14 rounded-2xl text-base"
                    placeholder="예: 초등 4학년 수직선에서 3/4 찾기"
                    value={topic}
                    onChange={(event) => handleTopicChange(event.target.value)}
                  />
                </label>
                <div className="flex flex-col gap-2 self-end sm:flex-row">
                  <Button
                    disabled={!hasTopic}
                    type="button"
                    onClick={handlePreparePrompt}
                  >
                    <Sparkles className="size-4" />
                    AI 요청문 만들기
                  </Button>
                  <Button asChild type="button" variant="secondary">
                    <a href="#sample-lessons">샘플 수업자료 보기</a>
                  </Button>
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-border bg-white/72 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground">
                  <SlidersHorizontal className="size-4 text-primary" />
                  수업 조건 더 보기
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    개념
                    <Input
                      value={form.concept}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          concept: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    활동 유형
                    <select
                      className="h-11 rounded-xl border border-border bg-white/90 px-4 text-sm shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-ring"
                      value={form.interactionKind}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          interactionKind: event.target
                            .value as CreateTeacherDraftRequest["interactionKind"],
                        }))
                      }
                    >
                      <option value="html-artifact">움직이는 조작자료</option>
                      <option value="fraction-bars">분수 막대</option>
                      <option value="number-line">수직선</option>
                      <option value="drag-sort">드래그 분류</option>
                      <option value="matching">매칭</option>
                      <option value="visual-choice">시각 선택</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-foreground md:col-span-2">
                    수업 목표
                    <Textarea
                      className="min-h-24"
                      value={form.goal}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          goal: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    난이도
                    <select
                      className="h-11 rounded-xl border border-border bg-white/90 px-4 text-sm shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-ring"
                      value={form.difficulty}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          difficulty: event.target
                            .value as CreateTeacherDraftRequest["difficulty"],
                        }))
                      }
                    >
                      <option value="easy">기초</option>
                      <option value="standard">표준</option>
                      <option value="challenge">도전</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    기준 단원
                    <select
                      className="h-11 rounded-xl border border-border bg-white/90 px-4 text-sm shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-ring"
                      value={form.sourceLessonSlug}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceLessonSlug: event.target.value,
                        }))
                      }
                    >
                      <option value="whole-and-part">전체와 부분</option>
                      <option value="denominator-and-numerator">분모와 분자</option>
                      <option value="compare-fractions-same-whole">
                        같은 전체에서 비교
                      </option>
                      <option value="fractions-on-a-number-line">
                        수직선 위 분수
                      </option>
                    </select>
                  </label>
                </div>
              </details>
            </section>

            <section className="rounded-[1.75rem] border border-border bg-[#fff6dd] p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <Badge variant="accent">2단계</Badge>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Gemini에 넣을 요청문
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted">
                    주제를 바탕으로 움직이는 수업자료를 만들어 달라는 요청문을
                    준비합니다. 복사해서 Gemini에 붙여넣으세요.
                  </p>
                </div>
                {promptReady ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        void handleCopyPrompt();
                      }}
                    >
                      <Copy className="size-4" />
                      요청문 복사하기
                    </Button>
                    <Button type="button" onClick={() => setIsImportOpen(true)}>
                      <MonitorPlay className="size-4" />
                      AI 결과 가져오기
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="mt-5 rounded-3xl border border-amber-200/70 bg-white/80 p-5">
                {promptReady ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      요청문이 준비됐습니다.
                    </p>
                    <p className="text-sm leading-7 text-muted">
                      요청문을 복사해 Gemini에 붙여넣고, 결과를 받으면
                      <strong> AI 결과 가져오기</strong>를 눌러 주세요.
                    </p>
                    <div className="grid gap-2 rounded-2xl bg-secondary/70 px-4 py-3 text-sm leading-6 text-muted">
                      <p>
                        <span className="font-semibold text-foreground">
                          주제:
                        </span>{" "}
                        {form.concept}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          활동:
                        </span>{" "}
                        학생이 직접 눌러 보고 움직이며 개념을 발견하는 자료
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">
                          준비:
                        </span>{" "}
                        복사 버튼을 누르면 필요한 제작 조건까지 함께 담깁니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-muted">
                    먼저 수업자료 주제를 적고 <strong>AI 요청문 만들기</strong>를
                    눌러 주세요.
                  </p>
                )}
              </div>
            </section>

            <section
              className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-card sm:p-6"
              id="sample-lessons"
            >
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <Badge variant="accent">샘플</Badge>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    바로 체험하는 샘플 수업자료
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted">
                    아직 Gemini 결과가 없어도 샘플을 눌러 학생 화면을 먼저
                    확인할 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {teacherHtmlTemplates.map((template) => {
                  const isActive = form.html === template.html;

                  return (
                    <button
                      aria-label={`${template.title} 샘플 사용하기`}
                      className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card ${
                        isActive
                          ? "border-primary bg-teal-50 text-primary"
                          : "border-border bg-white/82 text-foreground hover:border-primary/35"
                      }`}
                      key={template.id}
                      type="button"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-base font-semibold">
                          {template.title}
                        </span>
                        <Badge
                          className={
                            isActive
                              ? "border-primary/20 bg-white text-primary"
                              : undefined
                          }
                          variant={isActive ? "default" : "accent"}
                        >
                          {isActive ? "미리보기 중" : "샘플 보기"}
                        </Badge>
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-muted">
                        {template.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[1.75rem] border border-border bg-panel p-5 shadow-card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="accent">3단계</Badge>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    학생에게 보일 미리보기
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <Eye className="size-3.5" />
                  학생 화면 중심
                </div>
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-soft">
                {hasPastedResult ? (
                  <iframe
                    className="h-[520px] w-full bg-white"
                    allow=""
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts"
                    srcDoc={form.html ?? ""}
                    title="학생에게 보일 수업자료 미리보기"
                  />
                ) : (
                  <div className="grid min-h-[420px] place-items-center bg-white/80 p-8">
                    <div className="w-full max-w-sm space-y-4 text-center">
                      <MonitorPlay className="mx-auto size-10 text-primary" />
                      <p className="font-semibold text-foreground">
                        학생 화면은 자료를 가져오면 바로 나타납니다.
                      </p>
                      <div className="grid gap-2 text-left text-sm leading-6 text-muted">
                        <p className="rounded-2xl bg-secondary/70 px-4 py-3">
                          1. 주제를 적고 요청문을 만듭니다.
                        </p>
                        <p className="rounded-2xl bg-secondary/70 px-4 py-3">
                          2. Gemini에서 만든 자료를 가져옵니다.
                        </p>
                        <p className="rounded-2xl bg-secondary/70 px-4 py-3">
                          3. 학생 화면을 확인하고 참여 코드로 공유합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {hasPastedResult && (form.teacherGuide || learningQuestions.length) ? (
              <section className="rounded-[1.75rem] border border-amber-200 bg-[#fff8e7] p-5 shadow-card">
                <Badge variant="accent">교사용 메모</Badge>
                {form.teacherGuide ? (
                  <div className="mt-3 rounded-2xl bg-white/78 px-4 py-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-amber-700 uppercase">
                      수업에서 이렇게 활용하세요
                    </p>
                    <p className="mt-2 text-sm leading-7 text-foreground">
                      {form.teacherGuide}
                    </p>
                  </div>
                ) : null}
                {learningQuestions.length ? (
                  <div className="mt-3 rounded-2xl bg-white/78 px-4 py-3">
                    <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                      학습 질문
                    </p>
                    <ol className="mt-2 space-y-2 text-sm leading-6 text-foreground">
                      {learningQuestions.map((question, index) => (
                        <li className="flex gap-2" key={question}>
                          <span className="font-mono text-xs text-muted">
                            {index + 1}
                          </span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-[1.75rem] border border-border bg-panel p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant="accent">4단계</Badge>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    발행 준비
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    미리보기를 확인한 뒤 학생에게 공유할 참여 코드를 만듭니다.
                  </p>
                </div>
                <Button
                  disabled={status === "drafting" || !hasPastedResult}
                  type="submit"
                >
                  <Wand2 className="size-4" />
                  {status === "drafting" ? "준비 중" : "발행 준비하기"}
                </Button>
              </div>

              {error ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </p>
              ) : null}

              {documentHasBlockedHtml ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  학생 화면 보호 확인에서 수정이 필요한 부분이 발견됐습니다.
                  AI 결과 가져오기에서 자료를 다시 붙여넣은 뒤 준비해 주세요.
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                {(document?.blocks ?? []).length > 0 ? (
                  document?.blocks.map((block, index) => (
                    <article
                      className="rounded-2xl border border-border bg-white/80 px-4 py-4"
                      key={block.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {block.safetyStatus ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${safetyBadgeClassName(block.safetyStatus)}`}
                          >
                            <ShieldAlert className="mr-1.5 size-3.5" />
                            {safetyStatusLabel(block.safetyStatus)}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">
                        {block.title.replace(/\s*HTML\s*자료$/i, " 자료")}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        학생에게 보일 화면과 조작 흐름을 확인했습니다.
                      </p>
                      {block.safetyWarnings?.length ? (
                        <div
                          className={`mt-3 rounded-2xl border px-3 py-2 text-xs leading-5 ${safetyGuideClassName(block.safetyStatus)}`}
                        >
                          <p className="mb-1 flex items-center gap-2 font-semibold">
                            <ShieldAlert className="size-3.5" />
                            학생 화면 보호 안내
                          </p>
                          <ul className="space-y-1">
                            {block.safetyWarnings.map((warning) => (
                              <li key={warning}>- {warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-white/55 p-5 text-sm leading-6 text-muted">
                    아직 발행 준비 전입니다. 미리보기 확인 후 <strong>발행 준비하기</strong>를 눌러 주세요.
                  </div>
                )}
              </div>

              {document ? (
                <Button
                  className="mt-4 w-full"
                  disabled={status === "publishing" || documentHasBlockedHtml}
                  type="button"
                  onClick={handlePublish}
                >
                  <Send className="size-4" />
                  {documentHasBlockedHtml
                    ? "수정 후 발행 가능"
                    : status === "publishing"
                      ? "발행 중"
                      : "참여 코드 만들기"}
                </Button>
              ) : null}
            </section>

            {assignment ? (
              <div className="space-y-3">
                <AssignmentShareCard
                  code={assignment.code}
                  shareUrl={assignment.shareUrl}
                  title="발행 완료"
                  tone="dark"
                />
                <section className="rounded-[1.5rem] border border-primary/25 bg-[#12312e] p-4 text-white shadow-card">
                  <div className="flex items-center gap-2 text-sm text-teal-50/80">
                    <CheckCircle2 className="size-4 text-emerald-200" />
                    발행이 끝났습니다. QR, 코드, 링크 중 편한 방식으로 학생에게 공유하세요.
                  </div>
                  <Button asChild variant="secondary">
                    <Link href={`/teacher/assignments/${assignment.id}` as Route}>
                      <ExternalLink className="size-4" />
                      결과 보기
                    </Link>
                  </Button>
                </section>
              </div>
            ) : null}
          </aside>
        </form>
      </div>
      <AiResultImportDialog
        open={isImportOpen}
        value={aiImportValue}
        error={importError}
        onChange={handleImportedResultChange}
        onClose={() => setIsImportOpen(false)}
        onUseResult={handleUseImportedResult}
      />
    </main>
  );
}
