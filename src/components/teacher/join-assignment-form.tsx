"use client";

import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  History,
  Loader2,
  MonitorPlay,
  Sparkles,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  GuidedTour,
  type GuidedTourStep,
} from "@/components/onboarding/guided-tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RECENT_CODES_STORAGE_KEY = "mathpro:recent-assignment-codes";
const MIN_CODE_LENGTH = 4;
const MAX_CODE_LENGTH = 12;

const joinTourSteps: GuidedTourStep[] = [
  {
    eyebrow: "참여 코드 안내",
    title: "선생님이 알려준 코드를 그대로 넣으면 됩니다",
    body: "칠판, 화면, 학급 채팅방에 있는 참여 코드를 입력하면 오늘 활동 화면으로 이동합니다.",
    detail:
      "소문자나 띄어쓰기가 섞여 있어도 수학프로가 자동으로 정리합니다.",
  },
  {
    eyebrow: "로그인 없음",
    title: "학생 계정 없이 바로 들어갑니다",
    body: "이 화면에서는 이름, 이메일, 비밀번호를 묻지 않습니다. 코드를 확인한 뒤 바로 활동을 시작합니다.",
  },
  {
    eyebrow: "최근 참여",
    title: "같은 기기에서는 최근 코드를 다시 고를 수 있습니다",
    body: "한번 들어간 활동 코드는 이 브라우저에만 저장됩니다. 같은 태블릿이나 노트북에서 다시 들어갈 때 빠르게 선택할 수 있습니다.",
  },
];

function normalizeJoinCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function formatCodeForDisplay(value: string) {
  const normalized = normalizeJoinCode(value);

  if (normalized.length <= 3) {
    return normalized;
  }

  return normalized.match(/.{1,3}/g)?.join(" ") ?? normalized;
}

function readRecentCodes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_CODES_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => normalizeJoinCode(String(entry)))
      .filter((entry) => entry.length >= MIN_CODE_LENGTH)
      .slice(0, 4);
  } catch {
    return [];
  }
}

function persistRecentCode(code: string) {
  try {
    const nextCodes = [
      code,
      ...readRecentCodes().filter((recentCode) => recentCode !== code),
    ].slice(0, 4);

    window.localStorage.setItem(
      RECENT_CODES_STORAGE_KEY,
      JSON.stringify(nextCodes),
    );
  } catch {
    // 최근 참여 코드는 편의 기능이라 저장 실패가 입장을 막으면 안 됩니다.
  }
}

export function JoinAssignmentForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [recentCodes, setRecentCodes] = useState<string[]>(readRecentCodes);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayCode = useMemo(() => formatCodeForDisplay(code), [code]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCode = normalizeJoinCode(code);

    if (nextCode.length < MIN_CODE_LENGTH) {
      setErrorMessage("참여 코드는 보통 6자리예요. 선생님이 알려준 코드를 다시 확인해 주세요.");
      return;
    }

    if (nextCode.length > MAX_CODE_LENGTH) {
      setErrorMessage("코드가 너무 길어요. 참여 코드 부분만 다시 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/assignments/${encodeURIComponent(nextCode)}`, {
        method: "GET",
      });

      if (response.status === 404) {
        setErrorMessage(
          "코드를 찾지 못했어요. 숫자와 영문자가 맞는지 선생님 화면과 한 번만 비교해 주세요.",
        );
        return;
      }

      if (!response.ok) {
        setErrorMessage(
          "참여 코드를 확인하는 중 잠시 문제가 생겼어요. 잠깐 뒤 다시 눌러 주세요.",
        );
        return;
      }

      persistRecentCode(nextCode);
      setRecentCodes(readRecentCodes());
      router.push(`/play/${nextCode}` as Route);
    } catch {
      setErrorMessage(
        "인터넷 연결이나 서버 상태 때문에 코드를 확인하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center lg:py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-panel p-5 shadow-card sm:p-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_18%_18%,rgba(13,148,136,0.22),transparent_36%),radial-gradient(circle_at_82%_6%,rgba(217,138,8,0.24),transparent_32%)]"
        />
        <div className="relative space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="accent">학생 참여</Badge>
            <GuidedTour
              autoOpen
              startLabel="참여 방법 보기"
              steps={joinTourSteps}
              storageKey="mathpro:tour:join"
            />
          </div>

          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold tracking-[0.18em] text-muted uppercase">
              MathPro Classroom Entry
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              선생님이 알려준 코드로 바로 활동해요
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted">
              로그인 없이 참여 코드를 확인하고, 오늘의 움직이는 수학 자료로
              이동합니다. 활동 중 선택과 제출 과정은 선생님이 수업을 더 잘
              도와줄 수 있도록 저장됩니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "1. 코드 받기",
                body: "칠판이나 학급 채팅방의 코드를 확인해요.",
              },
              {
                title: "2. 바로 입장",
                body: "영문 대소문자와 띄어쓰기는 걱정하지 않아도 돼요.",
              },
              {
                title: "3. 만져 보기",
                body: "자료를 눌러 보고 움직이며 생각을 남겨요.",
              },
            ].map((item) => (
              <article
                className="rounded-3xl border border-border bg-white/72 p-4"
                key={item.title}
              >
                <h2 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-surface p-5 shadow-soft sm:p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
              <MonitorPlay className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                입장 준비
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                참여 코드 입력
              </h2>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-foreground">
            선생님이 알려준 코드
            <Input
              aria-describedby="join-code-help join-code-error"
              autoCapitalize="characters"
              autoComplete="off"
              className="h-14 rounded-2xl text-center font-mono text-2xl font-semibold tracking-[0.26em]"
              inputMode="text"
              maxLength={MAX_CODE_LENGTH + 4}
              value={displayCode}
              placeholder="ABC 123"
              onChange={(event) => {
                setCode(normalizeJoinCode(event.target.value));
                setErrorMessage(null);
              }}
            />
          </label>

          <p
            className="flex items-start gap-2 rounded-2xl bg-secondary/60 p-3 text-sm leading-6 text-muted"
            id="join-code-help"
          >
            <HelpCircle className="mt-0.5 size-4 shrink-0 text-accent" />
            보통 영문과 숫자가 섞인 6자리 코드입니다. 예: ABC123
          </p>

          {errorMessage ? (
            <p
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              id="join-code-error"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <Button
            className="h-12 w-full"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                코드 확인 중
              </>
            ) : (
              <>
                활동 화면으로 입장
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        {recentCodes.length > 0 ? (
          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="size-4 text-accent" />
              최근 참여 코드
            </div>
            <div className="flex flex-wrap gap-2">
              {recentCodes.map((recentCode) => (
                <button
                  className="rounded-full border border-border bg-white/78 px-4 py-2 font-mono text-sm font-semibold tracking-[0.18em] text-foreground transition hover:-translate-y-0.5 hover:bg-white"
                  key={recentCode}
                  type="button"
                  onClick={() => {
                    setCode(recentCode);
                    setErrorMessage(null);
                  }}
                >
                  {formatCodeForDisplay(recentCode)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-white/55 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 size-5 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-muted">
                처음 참여하는 기기예요. 활동에 들어가면 다음부터 최근 코드가
                여기에 표시됩니다.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          학생 계정 없이 시작합니다. 이름표나 학급 명단 연결은 선생님이
          필요할 때 다음 단계에서 확장합니다.
        </div>
      </section>
    </main>
  );
}
