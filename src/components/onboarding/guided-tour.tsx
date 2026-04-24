"use client";

import { ArrowLeft, ArrowRight, HelpCircle, Sparkles, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GuidedTourStep = {
  eyebrow: string;
  title: string;
  body: string;
  detail?: string;
};

type GuidedTourProps = {
  storageKey: string;
  steps: GuidedTourStep[];
  startLabel?: string;
  className?: string;
};

export function GuidedTour({
  storageKey,
  steps,
  startLabel = "화면 안내 보기",
  className,
}: GuidedTourProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function openTour() {
    setCurrentIndex(0);
    setIsOpen(true);

    try {
      window.localStorage.setItem(storageKey, "opened");
    } catch {
      // 안내 모달은 저장 실패와 무관하게 열려야 합니다.
    }
  }

  if (steps.length === 0 || !currentStep) {
    return null;
  }

  return (
    <>
      <Button
        className={cn("shadow-card", className)}
        type="button"
        variant="secondary"
        onClick={openTour}
      >
        <HelpCircle className="size-4" />
        {startLabel}
      </Button>

      {isOpen ? (
        <div
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-[#10201d]/58 px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="guided-tour-dialog relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/45 bg-surface shadow-soft">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_20%_20%,rgba(13,148,136,0.22),transparent_36%),radial-gradient(circle_at_84%_16%,rgba(217,138,8,0.24),transparent_34%)]"
            />
            <div className="relative space-y-6 p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                      {currentStep.eyebrow}
                    </p>
                    <h2
                      className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
                      id={titleId}
                    >
                      {currentStep.title}
                    </h2>
                  </div>
                </div>
                <button
                  aria-label="안내 닫기"
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-white/75 text-muted transition hover:bg-white hover:text-foreground"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-white/72 p-5">
                <p
                  className="text-base leading-8 text-foreground"
                  id={descriptionId}
                >
                  {currentStep.body}
                </p>
                {currentStep.detail ? (
                  <p className="mt-4 rounded-2xl bg-secondary/65 px-4 py-3 text-sm leading-6 text-muted">
                    {currentStep.detail}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${((currentIndex + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-muted">
                    {currentIndex + 1} / {steps.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={isFirst}
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setCurrentIndex((index) => Math.max(index - 1, 0))
                      }
                    >
                      <ArrowLeft className="size-4" />
                      이전
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (isLast) {
                          setIsOpen(false);
                          return;
                        }

                        setCurrentIndex((index) =>
                          Math.min(index + 1, steps.length - 1),
                        );
                      }}
                    >
                      {isLast ? "안내 닫기" : "다음"}
                      {!isLast ? <ArrowRight className="size-4" /> : null}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
