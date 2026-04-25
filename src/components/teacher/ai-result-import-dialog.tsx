"use client";

import { ClipboardPaste, X } from "lucide-react";
import { useEffect, useId } from "react";
import { TeacherHelpGlossary } from "@/components/teacher/teacher-help-glossary";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type AiResultImportDialogProps = {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onUseResult: () => void;
};

export function AiResultImportDialog({
  open,
  value,
  onChange,
  onClose,
  onUseResult,
}: AiResultImportDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const hasResult = value.trim().length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[#10201d]/58 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/45 bg-surface shadow-soft"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_18%_18%,rgba(13,148,136,0.22),transparent_36%),radial-gradient(circle_at_84%_14%,rgba(217,138,8,0.24),transparent_34%)]"
        />
        <div className="relative space-y-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                <ClipboardPaste className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                  AI 결과 가져오기
                </p>
                <h2
                  className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
                  id={titleId}
                >
                  Gemini가 만든 자료를 붙여넣어 주세요
                </h2>
              </div>
            </div>
            <button
              aria-label="AI 결과 가져오기 닫기"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-white/75 text-muted transition hover:bg-white hover:text-foreground"
              type="button"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-white/72 p-5">
            <p className="text-sm leading-7 text-foreground" id={descriptionId}>
              Gemini 답변 전체를 그대로 붙여넣으면 수학프로가 학생 화면으로
              바꿔 보여줍니다.
            </p>
            <p className="mt-3 rounded-2xl bg-secondary/65 px-4 py-3 text-xs leading-5 text-muted">
              복사가 안 되면 요청문을 직접 선택해 복사해 주세요. 붙여넣은 뒤에는
              먼저 학생 화면으로 확인합니다.
            </p>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-foreground">
            AI가 만든 자료
            <Textarea
              className="min-h-72 rounded-[1.25rem] bg-white/90 text-sm leading-6"
              placeholder="Gemini가 만들어 준 답변 전체를 여기에 붙여넣어 주세요."
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
          </label>

          <details className="rounded-[1.25rem] border border-border bg-white/72 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
              문제가 생겼나요?
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-muted">
                학생 화면이 비어 있거나 움직이지 않으면 Gemini 답변을 빠짐없이
                다시 붙여넣어 보세요.
              </p>
              <TeacherHelpGlossary />
            </div>
          </details>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              나중에 하기
            </Button>
            <Button disabled={!hasResult} type="button" onClick={onUseResult}>
              미리보기로 가져오기
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
