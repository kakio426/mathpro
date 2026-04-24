"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  Blocks,
  Copy,
  ExternalLink,
  ShieldAlert,
  Play,
  QrCode,
  Send,
  Wand2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  </script>
</body>
</html>`;

const navItems = [
  { label: "자료 만들기", icon: Wand2 },
  { label: "내 자료", icon: Blocks },
  { label: "배포/참여", icon: QrCode },
  { label: "결과 보기", icon: BarChart3 },
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
    <main className="min-h-[calc(100vh-8rem)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="border-b border-border pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <Link className="block text-xl font-semibold tracking-tight" href="/">
            수학프로
          </Link>
          <p className="mt-2 text-sm leading-6 text-muted">
            교사용 인터랙티브 자료 제작
          </p>
          <nav className="mt-6 grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  className="flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-foreground transition hover:bg-white/70"
                  type="button"
                >
                  <Icon className="size-4 text-primary" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="grid gap-6 xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="space-y-3">
              <Badge variant="accent">HTML Artifact Runtime</Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                HTML 인터랙티브 자료 만들기
              </h1>
              <p className="text-sm leading-6 text-muted">
                Gemini 같은 LLM에서 만든 HTML을 붙여넣고, 미리본 뒤 참여 코드로 배포합니다.
              </p>
            </div>

            <form
              className="space-y-4 rounded-lg border border-border bg-panel p-5 shadow-card"
              onSubmit={handleCreateDraft}
            >
              <label className="grid gap-2 text-sm font-medium text-foreground">
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
              <label className="grid gap-2 text-sm font-medium text-foreground">
                수업 목표
                <Textarea
                  value={form.goal}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      goal: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  활동 타입
                  <select
                    className="h-11 rounded-lg border border-border bg-white/90 px-4 text-sm shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-ring"
                    value={form.interactionKind}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        interactionKind: event.target
                          .value as CreateTeacherDraftRequest["interactionKind"],
                      }))
                    }
                  >
                    <option value="html-artifact">HTML Artifact</option>
                    <option value="fraction-bars">분수 막대</option>
                    <option value="number-line">수직선</option>
                    <option value="drag-sort">드래그 분류</option>
                    <option value="matching">매칭</option>
                    <option value="visual-choice">시각 선택</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  난이도
                  <select
                    className="h-11 rounded-lg border border-border bg-white/90 px-4 text-sm shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-ring"
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
              <div className="space-y-2 rounded-md border border-border bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    Gemini용 프롬프트
                  </p>
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
                  className="min-h-40 font-mono text-xs"
                  readOnly
                  value={geminiPrompt}
                />
              </div>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                HTML 코드 붙여넣기
                <Textarea
                  className="min-h-72 font-mono text-xs"
                  value={form.html ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      html: event.target.value,
                      promptTemplate: geminiPrompt,
                    }))
                  }
                />
              </label>
              <Button disabled={status === "drafting"} type="submit">
                <Wand2 className="size-4" />
                {status === "drafting" ? "자료 문서 생성 중" : "HTML 자료 문서 만들기"}
              </Button>
            </form>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Preview
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    iframe 미리보기
                  </h2>
                </div>
                <Badge variant="accent">sandbox</Badge>
              </div>
              <iframe
                className="h-[420px] w-full rounded-md border border-border bg-white"
                allow=""
                referrerPolicy="no-referrer"
                sandbox="allow-scripts"
                srcDoc={form.html ?? ""}
                title="HTML artifact preview"
              />
            </div>

            <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Activity Document
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
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
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  위험 HTML 패턴이 감지되어 발행을 막았습니다. 아래 안내를 확인하고 HTML을 수정한 뒤 다시 문서를 만들어 주세요.
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                {(document?.blocks ?? []).map((block, index) => (
                  <article
                    key={block.id}
                    className="rounded-md border border-border bg-white/80 px-4 py-4"
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
                        <Badge
                          variant={
                            block.safetyStatus === "passed"
                              ? "accent"
                              : undefined
                          }
                        >
                          {safetyStatusLabel(block.safetyStatus)}
                        </Badge>
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
                        이벤트: {block.allowedEvents.join(", ")}
                      </p>
                    ) : null}
                    {block.safetyWarnings?.length ? (
                      <div
                        className={`mt-3 rounded-md border px-3 py-2 text-xs leading-5 ${safetyGuideClassName(block.safetyStatus)}`}
                      >
                        <p className="mb-1 flex items-center gap-2 font-semibold">
                          <ShieldAlert className="size-3.5" />
                          HTML 안전 검사 안내
                        </p>
                        <ul className="space-y-1">
                          {block.safetyWarnings.map((warning) => (
                            <li key={warning}>- {warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            {assignment ? (
              <div className="rounded-lg border border-primary/25 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      참여 코드
                    </p>
                    <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.12em]">
                      {assignment.code}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
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
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
