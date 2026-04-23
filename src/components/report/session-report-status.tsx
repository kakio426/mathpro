"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import {
  sessionReportResponseSchema,
  type SessionReportSummary,
  type SessionReportResponse,
} from "@/types/session";

type ReportLoadState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "loaded";
      report: SessionReportResponse;
    };

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

const reportSummaryFallback = "진단 결과가 아직 준비되지 않았습니다.";

function formatReportStatusLabel(status: SessionReportResponse["status"]) {
  switch (status) {
    case "pending":
      return "준비 중";
    case "ready":
      return "준비 완료";
    case "failed":
      return "생성 실패";
    default:
      return status;
  }
}

function renderSummaryBlock(summaryJson: SessionReportSummary | null, block: string) {
  if (!summaryJson) {
    return reportSummaryFallback;
  }

  const normalizedBlock = block.toLowerCase();

  if (normalizedBlock.includes("이해")) {
    const items = summaryJson.understoodConcepts;
    if (Array.isArray(items) && items.length > 0) {
      return items.join(", ");
    }
  }

  if (normalizedBlock.includes("오개념")) {
    const items = summaryJson.watchMisconceptions;
    if (Array.isArray(items) && items.length > 0) {
      return items.join(", ");
    }
  }

  if (normalizedBlock.includes("설명")) {
    const text = summaryJson.explanationSummary;
    if (typeof text === "string" && text.length > 0) {
      return text;
    }
  }

  if (normalizedBlock.includes("다음")) {
    const text =
      summaryJson.recommendedNextLessonTitle ||
      summaryJson.recommendedNextLessonId;
    if (typeof text === "string" && text.length > 0) {
      return text;
    }
  }

  return reportSummaryFallback;
}

export function SessionReportStatus({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<ReportLoadState>({
    status: "loading",
  });

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setState({
          status: "loading",
        });

        const response = await fetch(`/api/reports/${sessionId}`);
        const payload = (await response.json().catch(() => null)) as
          | ApiErrorResponse
          | SessionReportResponse
          | null;

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload
              ? payload.error?.message ?? "리포트를 불러오지 못했어요."
              : "리포트를 불러오지 못했어요.",
          );
        }

        const report = sessionReportResponseSchema.parse(payload);

        if (ignore) {
          return;
        }

        setState({
          status: "loaded",
          report,
        });
      } catch (error) {
        if (ignore) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "리포트를 불러오지 못했어요.",
        });
      }
    }

    void run();

    return () => {
      ignore = true;
    };
  }, [sessionId]);

  if (state.status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>리포트를 준비하고 있어요</CardTitle>
          <CardDescription>
            방금 저장한 학습 기록을 확인하고 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted">
          세션 `{sessionId}`의 준비 상태를 불러오는 중입니다.
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card className="border-accent/35">
        <CardHeader>
          <CardTitle>리포트를 불러오지 못했어요</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted">
          현재 게스트 세션에서 접근 가능한 결과인지 다시 확인해 주세요.
        </CardContent>
      </Card>
    );
  }

  const { report } = state;
  const isPending = report.status === "pending";
  const isFailed = report.status === "failed";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>세션 상태</CardTitle>
            <Badge variant={isPending ? "accent" : "default"}>
              {formatReportStatusLabel(report.status)}
            </Badge>
          </div>
          <CardDescription>
            {isPending
              ? "학습 기록은 저장되었고, 진단 리포트를 준비하는 중입니다."
              : isFailed
                ? "리포트 생성 중 오류가 발생했습니다."
                : "리포트가 준비되었습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted">
          <p>sessionId: {report.sessionId}</p>
          <p>
            generatedAt: {report.generatedAt ?? (isPending ? "아직 생성 전" : "없음")}
          </p>
        </CardContent>
      </Card>

      <div data-shell-grid="two">
        {siteConfig.reportBlocks.map((block) => (
          <Card key={block}>
            <CardHeader>
              <CardTitle className="text-lg">{block}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted">
              {isPending
                ? "이 블록은 진단 엔진이 결과를 정리하는 대로 채워집니다."
                : renderSummaryBlock(report.summaryJson, block)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
