"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  Blocks,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileCode2,
  MonitorPlay,
  Play,
  QrCode,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GuidedTour,
  type GuidedTourStep,
} from "@/components/onboarding/guided-tour";
import { Textarea } from "@/components/ui/textarea";
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

const sampleDraft: CreateTeacherDraftRequest = {
  gradeBand: "3-4",
  concept: "분수의 의미",
  goal: "전체를 같은 크기로 나눈 것 중 일부라는 분수의 의미를 조작으로 설명한다.",
  interactionKind: "html-artifact",
  difficulty: "standard",
  sourceLessonSlug: "whole-and-part",
};

const sampleHtmlArtifact = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f8fafc; color: #172554; }
    main { max-width: 760px; margin: 0 auto; padding: 24px; }
    button { border: 1px solid #0f766e; border-radius: 8px; background: white; padding: 14px; cursor: pointer; }
    .bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 24px 0; }
    .piece.selected { background: #5eead4; }
  </style>
</head>
<body>
  <main>
    <h1>분수 막대 만들기</h1>
    <p>초코바 1개를 4등분했다고 생각하고 2칸을 골라 2/4를 만들어 보세요.</p>
    <div class="bar">
      <button class="piece" data-index="0">1</button>
      <button class="piece" data-index="1">2</button>
      <button class="piece" data-index="2">3</button>
      <button class="piece" data-index="3">4</button>
    </div>
    <button id="submit">제출하기</button>
    <button id="complete">활동 완료</button>
    <p id="feedback"></p>
  </main>
  <script>
    const selected = new Set();
    const send = (eventType, payload) => {
      window.parent.postMessage({
        source: "mathpro-html-activity",
        type: eventType,
        eventType,
        blockId: "fraction-bar-html",
        payload
      }, "*");
    };

    send("ready", { title: "분수 막대 만들기" });

    document.querySelectorAll(".piece").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        selected.has(index) ? selected.delete(index) : selected.add(index);
        button.classList.toggle("selected");
        send("select", { selectedParts: Array.from(selected).sort() });
      });
    });

    document.querySelector("#submit").addEventListener("click", () => {
      const answer = Array.from(selected).sort().join(",");
      const isCorrect = answer === "0,1";
      document.querySelector("#feedback").textContent = isCorrect
        ? "좋아요. 4조각 중 2조각을 골랐어요."
        : "전체를 4등분했는지, 몇 조각을 골랐는지 다시 확인해 보세요.";
      send("submit", {
        isCorrect,
        response: Array.from(selected).sort(),
        misconceptionSignal: isCorrect ? null : "selected-parts-mismatch"
      });
    });

    document.querySelector("#complete").addEventListener("click", () => {
      send("complete", { isCorrect: true });
    });
  </script>
</body>
</html>`;

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
    title: "목표 설정",
    description: "개념, 목표, 난이도를 정합니다.",
  },
  {
    id: "02",
    title: "AI 요청문 복사",
    description: "Gemini에 넣을 생성 지시문을 준비합니다.",
  },
  {
    id: "03",
    title: "자료 붙여넣기",
    description: "Gemini가 만든 자료 원본을 붙여넣습니다.",
  },
  {
    id: "04",
    title: "검토 후 발행",
    description: "미리보기와 안전 검사를 확인합니다.",
  },
];

const teacherWorkspaceTourSteps: GuidedTourStep[] = [
  {
    eyebrow: "처음 1분 안내",
    title: "이곳은 선생님의 수업자료 작업대입니다",
    body: "왼쪽에서 수업 목표를 정하고, 가운데에는 AI가 만든 자료 원본을 붙여넣고, 오른쪽에서 학생에게 보일 화면을 미리 확인합니다.",
    detail:
      "코딩을 직접 하라는 뜻이 아닙니다. Gemini가 만들어 준 결과물을 이곳에 붙여넣고 수학프로가 안전하게 실행하는 구조입니다.",
  },
  {
    eyebrow: "AI 요청문",
    title: "프롬프트는 AI에게 보내는 요청서입니다",
    body: "수업 목표를 적으면 수학프로가 Gemini에 보낼 요청문을 미리 만들어 둡니다. 복사해서 Gemini에 붙여넣으면 움직이는 수업자료 초안을 받을 수 있습니다.",
    detail:
      "어려운 지시문을 외울 필요 없이, 선생님은 개념과 수업 목표만 다듬으면 됩니다.",
  },
  {
    eyebrow: "자료 원본",
    title: "HTML은 학생 화면에서 움직이는 자료 파일입니다",
    body: "Gemini가 준 HTML 전체를 가운데 작업대에 붙여넣고 자료 문서를 만들면, 수학프로가 미리보기와 안전 검사를 함께 실행합니다.",
    detail:
      "HTML이라는 말이 낯설어도 괜찮습니다. 여기서는 '학생이 눌러 보고 움직일 수 있는 한 장짜리 수업자료'라고 이해하면 됩니다.",
  },
  {
    eyebrow: "발행",
    title: "안전 미리보기 후 참여 코드로 공유합니다",
    body: "오른쪽에서 자료가 잘 열리는지 확인하고 발행하면 참여 코드와 학생 링크가 만들어집니다. 학생은 로그인 없이 코드나 링크로 들어옵니다.",
    detail:
      "학생의 선택, 제출, 완료 과정은 자동으로 저장되어 이후 교사 리포트에서 확인할 수 있습니다.",
  },
];

function buildGeminiPrompt(form: CreateTeacherDraftRequest) {
  return [
    "초등학교 3-4학년 수학 수업에서 사용할 단일 HTML 인터랙티브 자료를 만들어줘.",
    `개념: ${form.concept}`,
    `수업 목표: ${form.goal}`,
    `난이도: ${form.difficulty}`,
    "요구사항:",
    "- HTML, CSS, JavaScript를 하나의 HTML 파일 안에 모두 포함해줘.",
    "- 외부 CDN, 외부 이미지, 외부 스크립트는 사용하지 마.",
    "- fetch, WebSocket, localStorage, cookie, geolocation, camera, microphone, clipboard, eval, document.write는 사용하지 마.",
    "- 모바일과 태블릿에서 터치로 조작할 수 있게 만들어줘.",
    "- 문제풀이보다 학생이 직접 조작하고 관찰하는 활동으로 만들어줘.",
    "- 활동 시작 시 ready 이벤트를 보내줘.",
    "- 활동 완료 버튼을 만들고 complete 이벤트를 반드시 보내줘.",
    "- 학생의 선택, 드래그, 힌트, 재시도, 제출, 완료를 window.parent.postMessage로 보내줘.",
    "- postMessage payload는 반드시 source: 'mathpro-html-activity', eventType, blockId, payload를 포함해줘.",
    "- 제출 이벤트 payload에는 isCorrect, response, misconceptionSignal을 포함해줘.",
    "예시:",
    "window.parent.postMessage({ source: 'mathpro-html-activity', type: 'submit', eventType: 'submit', blockId: 'main-activity', payload: { isCorrect: true, response: '2/4', misconceptionSignal: null } }, '*');",
  ].join("\n");
}

function safetyStatusLabel(status: NonNullable<TeacherActivityDocument["blocks"][number]["safetyStatus"]>) {
  switch (status) {
    case "passed":
      return "안전 검사 통과";
    case "warning":
      return "확인 필요";
    case "blocked":
      return "발행 차단";
    case "unchecked":
      return "검사 전";
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

export function TeacherWorkspace() {
  const [form, setForm] = useState<CreateTeacherDraftRequest>({
    ...sampleDraft,
    html: sampleHtmlArtifact,
    promptTemplate: buildGeminiPrompt(sampleDraft),
  });
  const [document, setDocument] = useState<TeacherActivityDocument | null>(null);
  const [assignment, setAssignment] = useState<PublishedAssignment | null>(null);
  const [status, setStatus] = useState<"idle" | "drafting" | "publishing">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const geminiPrompt = buildGeminiPrompt(form);
  const documentHasBlockedHtml = Boolean(
    document?.blocks.some((block) => block.safetyStatus === "blocked"),
  );

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("drafting");
    setError(null);
    setAssignment(null);

    try {
      const response = await fetch("/api/teacher/activities/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          promptTemplate: geminiPrompt,
        }),
      });
      const payload = await parseApiJson<DraftResponse>(
        response,
        "초안을 만들지 못했습니다.",
      );

      setDocument(payload.document);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "초안을 만들지 못했습니다.",
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

  return (
    <main className="relative isolate min-h-[calc(100vh-8rem)] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(15,118,110,0.2),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(245,158,11,0.2),transparent_24%)]"
      />
      <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-[2rem] border border-border bg-[#12312e] px-5 py-6 text-white shadow-soft sm:px-7 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">
                  제작 스튜디오
                </Badge>
                <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                  움직이는 수업자료
                </Badge>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-[0.18em] text-teal-100 uppercase">
                  수학프로 제작실
                </p>
                <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight [word-break:keep-all] sm:text-5xl">
                  AI로 만든 움직이는 수업자료
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-teal-50/80 sm:text-base">
                  Gemini 같은 AI에서 만든 움직이는 자료를 붙여넣고, 안전한 미리보기로 확인한 뒤 참여 코드로 배포합니다.
                </p>
                <GuidedTour
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  startLabel="처음 사용하는 선생님 안내"
                  steps={teacherWorkspaceTourSteps}
                  storageKey="mathpro:tour:teacher-workspace"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-teal-100/75">현재 모드</p>
                <p className="mt-2 font-semibold">교사용 제작 스튜디오</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-teal-100/75">배포 방식</p>
                <p className="mt-2 font-semibold">코드 / 링크 참여</p>
              </div>
            </div>
          </div>
        </section>

        <form
          className="grid gap-5 xl:grid-cols-[320px_minmax(420px,1fr)_410px]"
          onSubmit={handleCreateDraft}
        >
          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-border bg-panel p-4 shadow-card">
              <Link className="flex items-center gap-3" href="/">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                  수
                </span>
                <span>
                  <span className="block text-lg font-semibold tracking-tight">
                    수학프로
                  </span>
                  <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    교사용 제작실
                  </span>
                </span>
              </Link>
              <nav className="mt-5 grid gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition ${
                        item.active
                          ? "bg-primary text-primary-foreground shadow-card"
                          : "text-foreground hover:bg-white/80"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <section className="rounded-[1.5rem] border border-border bg-surface p-4 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="size-4 text-primary" />
                <h2 className="font-semibold tracking-tight">제작 흐름</h2>
              </div>
              <ol className="space-y-3">
                {studioSteps.map((step) => (
                  <li
                    className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-2xl bg-white/70 p-3"
                    key={step.id}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-accent/18 font-mono text-xs font-semibold text-accent-foreground">
                      {step.id}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {step.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-panel p-4 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <h2 className="font-semibold tracking-tight">1. 목표 설정</h2>
              </div>
              <div className="space-y-4">
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
                  수업 목표
                  <Textarea
                    className="min-h-28"
                    value={form.goal}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        goal: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="grid gap-2 text-sm font-semibold text-foreground">
                    활동 타입
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
                      <option value="html-artifact">움직이는 HTML 자료</option>
                      <option value="fraction-bars">분수 막대</option>
                      <option value="number-line">수직선</option>
                      <option value="drag-sort">드래그 분류</option>
                      <option value="matching">매칭</option>
                      <option value="visual-choice">시각 선택</option>
                    </select>
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
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-[#fff6dd] p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    2단계
                  </p>
                  <h2 className="text-base font-semibold tracking-tight">
                    Gemini에 보낼 요청문
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    요청문은 AI에게 원하는 수업자료를 설명하는 글입니다.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(geminiPrompt);
                  }}
                >
                  <Copy className="size-4" />
                  복사
                </Button>
              </div>
              <Textarea
                className="min-h-52 border-amber-200/70 bg-white/80 font-mono text-[11px] leading-5"
                readOnly
                value={geminiPrompt}
              />
            </section>
          </aside>

          <section className="min-w-0 rounded-[1.75rem] border border-border bg-[#111c1a] p-4 text-white shadow-soft">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="border-white/15 bg-white/10 text-white">
                  3단계
                </Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  자료 원본 붙여넣기
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  AI가 만든 자료 원본을 그대로 붙여넣습니다. 제출하면 수학프로 자료 문서로 변환하고 안전 검사를 실행합니다.
                </p>
              </div>
              <Button disabled={status === "drafting"} type="submit">
                <Wand2 className="size-4" />
                {status === "drafting"
                  ? "자료 문서 생성 중"
                  : "자료 문서 만들기"}
              </Button>
            </div>
            <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0b1110]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/64">
                  <FileCode2 className="size-4 text-teal-200" />
                  interactive-lesson.html
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-red-300" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-emerald-300" />
                </div>
              </div>
              <Textarea
                className="min-h-[690px] resize-y border-0 bg-transparent p-4 font-mono text-xs leading-5 text-teal-50 shadow-none outline-none focus-visible:ring-0"
                value={form.html ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    html: event.target.value,
                    promptTemplate: geminiPrompt,
                  }))
                }
              />
            </div>
            {error ? (
              <p className="mt-4 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[1.5rem] border border-border bg-surface p-4 shadow-card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    4단계
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    안전 미리보기
                  </h2>
                </div>
                <Badge variant="accent">안전 모드</Badge>
              </div>
              <div className="overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-soft">
                <iframe
                  className="h-[430px] w-full bg-white"
                  allow=""
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts"
                  srcDoc={form.html ?? ""}
                  title="HTML artifact preview"
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-panel p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    자료 문서
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    {document?.title ?? "초안이 아직 없습니다"}
                  </h2>
                </div>
                {document ? (
                  <Button
                    disabled={status === "publishing" || documentHasBlockedHtml}
                    type="button"
                    onClick={handlePublish}
                  >
                    <Send className="size-4" />
                    {documentHasBlockedHtml
                      ? "안전 검사 필요"
                      : status === "publishing"
                        ? "발행 중"
                        : "발행하기"}
                  </Button>
                ) : null}
              </div>

              {documentHasBlockedHtml ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  위험한 실행 방식이 감지되어 발행을 막았습니다. 자료 원본을 수정한 뒤 다시 문서를 만들어 주세요.
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                {(document?.blocks ?? []).length > 0 ? (
                  document?.blocks.map((block, index) => (
                    <article
                      key={block.id}
                      className="rounded-2xl border border-border bg-white/80 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Badge>{block.type}</Badge>
                        {block.interactionKind ? (
                          <Badge variant="accent">{block.interactionKind}</Badge>
                        ) : null}
                        {block.safetyStatus ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${safetyBadgeClassName(block.safetyStatus)}`}
                          >
                            {block.safetyStatus === "passed" ? (
                              <ShieldCheck className="mr-1.5 size-3.5" />
                            ) : (
                              <ShieldAlert className="mr-1.5 size-3.5" />
                            )}
                            {safetyStatusLabel(block.safetyStatus)}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">
                        {block.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {block.instruction}
                      </p>
                      {block.allowedEvents ? (
                        <p className="mt-3 text-xs leading-5 text-muted">
                          저장되는 조작 신호: {block.allowedEvents.join(", ")}
                        </p>
                      ) : null}
                      {block.safetyWarnings?.length ? (
                        <div
                          className={`mt-3 rounded-2xl border px-3 py-2 text-xs leading-5 ${safetyGuideClassName(block.safetyStatus)}`}
                        >
                          <p className="mb-1 flex items-center gap-2 font-semibold">
                            <ShieldAlert className="size-3.5" />
                            자료 안전 검사 안내
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
                    자료 문서를 만들면 이곳에 안전 검사와 발행 준비 상태가 표시됩니다.
                  </div>
                )}
              </div>
            </section>

            {assignment ? (
              <section className="rounded-[1.5rem] border border-primary/25 bg-[#12312e] p-5 text-white shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-teal-100/70 uppercase">
                      참여 코드
                    </p>
                    <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.14em]">
                      {assignment.code}
                    </p>
                  </div>
                  <CheckCircle2 className="size-6 text-emerald-200" />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  <Button
                    className="bg-white text-[#12312e] hover:bg-teal-50"
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard?.writeText(assignment.shareUrl);
                    }}
                  >
                    <Copy className="size-4" />
                    링크 복사
                  </Button>
                  <Button asChild>
                    <Link href={`/play/${assignment.code}` as Route}>
                      <Play className="size-4" />
                      학생 화면
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/teacher/assignments/${assignment.id}` as Route}>
                      <ExternalLink className="size-4" />
                      결과 보기
                    </Link>
                  </Button>
                </div>
              </section>
            ) : (
              <section className="rounded-[1.5rem] border border-border bg-white/70 p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <MonitorPlay className="mt-1 size-5 text-primary" />
                  <div>
                    <h2 className="font-semibold tracking-tight">
                      발행 후 바로 학생에게 공유
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      안전 검사를 통과하면 참여 코드와 학생 링크가 이 패널에 표시됩니다.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </form>
      </div>
    </main>
  );
}
