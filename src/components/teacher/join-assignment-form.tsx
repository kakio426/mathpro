"use client";

import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinAssignmentForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode.length > 0) {
      router.push(`/play/${normalizedCode}` as Route);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-lg flex-col justify-center px-4 py-10">
      <form
        className="space-y-5 rounded-lg border border-border bg-panel p-6 shadow-card"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">참여 코드 입력</h1>
          <p className="text-sm leading-6 text-muted">
            교사가 발행한 수학프로 활동 코드로 바로 입장합니다.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-foreground">
          참여 코드
          <Input
            autoCapitalize="characters"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="예: A1B2C3"
          />
        </label>
        <Button className="w-full" type="submit">
          학생 화면으로 이동
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </main>
  );
}
