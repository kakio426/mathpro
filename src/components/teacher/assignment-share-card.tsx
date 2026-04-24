import Link from "next/link";
import type { Route } from "next";
import { MonitorPlay, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { CopyShareLinkButton } from "@/components/teacher/copy-share-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssignmentShareCardProps = {
  code: string;
  shareUrl: string;
  title?: string;
  tone?: "light" | "dark";
  compact?: boolean;
};

function QrSvg({ value, label }: { value: string; label: string }) {
  const qr = QRCode.create(value, {
    errorCorrectionLevel: "M",
  });
  const size = qr.modules.size;
  const cells: React.ReactElement[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!qr.modules.get(row, col)) {
        continue;
      }

      cells.push(
        <rect height="1" key={`${row}:${col}`} width="1" x={col} y={row} />,
      );
    }
  }

  return (
    <svg
      aria-label={label}
      className="size-full"
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${size} ${size}`}
    >
      <rect className="fill-white" height={size} width={size} x="0" y="0" />
      <g className="fill-[#12312e]">{cells}</g>
    </svg>
  );
}

export function AssignmentShareCard({
  code,
  shareUrl,
  title = "교실 공유 카드",
  tone = "light",
  compact = false,
}: AssignmentShareCardProps) {
  const isDark = tone === "dark";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.5rem] border p-4 shadow-card",
        isDark
          ? "border-white/15 bg-[#12312e] text-white"
          : "border-border bg-white/74 text-foreground",
      )}
    >
      <div
        className={cn(
          "grid gap-4",
          compact ? "lg:grid-cols-[180px_minmax(0,1fr)]" : "sm:grid-cols-[180px_minmax(0,1fr)]",
        )}
      >
        <div
          className={cn(
            "rounded-[1.25rem] border p-3",
            isDark ? "border-white/15 bg-white" : "border-border bg-white",
          )}
        >
          <QrSvg label={`${code} 학생 링크 QR`} value={shareUrl} />
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  isDark
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-transparent bg-accent/18 text-accent-foreground",
                )}
              >
                <QrCode className="mr-1.5 size-3.5" />
                QR 입장
              </Badge>
              <Badge
                className={cn(
                  isDark
                    ? "border-amber-200/40 bg-amber-300/15 text-amber-100"
                    : "border-border bg-white/80 text-foreground",
                )}
              >
                코드 입장
              </Badge>
            </div>
            <div>
              <p
                className={cn(
                  "text-xs font-semibold tracking-[0.16em] uppercase",
                  isDark ? "text-teal-100/70" : "text-muted",
                )}
              >
                {title}
              </p>
              <p
                className={cn(
                  "mt-2 break-all font-mono font-semibold tracking-[0.16em]",
                  compact ? "text-4xl" : "text-5xl",
                )}
              >
                {code}
              </p>
              <p
                className={cn(
                  "mt-3 text-sm leading-6",
                  isDark ? "text-teal-50/78" : "text-muted",
                )}
              >
                학생은 QR을 찍거나 참여 코드를 입력해 로그인 없이 바로 들어갑니다.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-2",
              compact ? "sm:grid-cols-3" : "sm:grid-cols-3 xl:grid-cols-1",
            )}
          >
            <CopyShareLinkButton
              className={cn(isDark && "bg-white text-[#12312e] hover:bg-teal-50")}
              copiedLabel="코드 복사 완료"
              copyText={code}
              label="코드 복사"
              shareUrl={shareUrl}
            />
            <CopyShareLinkButton
              className={cn(isDark && "bg-white text-[#12312e] hover:bg-teal-50")}
              label="링크 복사"
              shareUrl={shareUrl}
            />
            <Button asChild variant={isDark ? "secondary" : "default"}>
              <Link href={`/play/${code}` as Route}>
                <MonitorPlay className="size-4" />
                학생 화면
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
