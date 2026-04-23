import Link from "next/link";
import { ArrowRight, BookOpen, ChartNoAxesColumn, Layers3 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/site";

export function HomeHero() {
  return (
    <section className="py-[var(--space-section)]">
      <Container className="space-y-8">
        <div className="space-y-5">
          <Badge variant="accent">{siteConfig.name} | {siteConfig.moduleName}</Badge>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              분수 개념을 문제풀이가 아니라 사고의 흐름으로 설계하는 {siteConfig.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              {siteConfig.description} 지금 단계는 S1 골격이라서 실제 학습 로직 대신,
              이후 S2 타입 계약과 S4 세션 러너가 올라갈 빈 구조를 먼저 준비합니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/lab/whole-and-part">
                학습 셸 보기
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/report/demo-session">리포트 셸 보기</Link>
            </Button>
          </div>
        </div>

        <div data-shell-grid="two">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="size-5 text-primary" />
                학습 세션 골격
              </CardTitle>
              <CardDescription>
                모든 lesson은 사전진단부터 결과 리포트까지 같은 흐름을 유지합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="grid gap-3 sm:grid-cols-2">
                {siteConfig.sessionFlow.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-lg border border-border bg-white/70 px-4 py-3 text-sm"
                  >
                    <span className="mr-2 font-mono text-xs text-muted">
                      0{index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                동결된 첫 4개 lesson
              </CardTitle>
              <CardDescription>
                S0에서 고정한 {siteConfig.name}의 첫 모듈, {siteConfig.moduleName} 범위만 보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {siteConfig.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="rounded-lg border border-border bg-white/70 px-4 py-3"
                  >
                    <p className="font-medium text-foreground">
                      {lesson.id}. {lesson.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {lesson.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartNoAxesColumn className="size-5 text-primary" />
              보호자 리포트 4블록 계약
            </CardTitle>
            <CardDescription>
              점수 대신 개념 이해와 오개념 문장을 중심으로 보여주는 결과 화면 골격입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div data-shell-grid="two">
              {siteConfig.reportBlocks.map((block) => (
                <div
                  key={block}
                  className="rounded-lg border border-border bg-white/75 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-foreground">{block}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    이후 S5와 P4에서 실제 진단 데이터와 문장형 요약이 연결됩니다.
                  </p>
                </div>
              ))}
            </div>
            <Separator />
            <p className="text-sm leading-6 text-muted">
              이 홈 화면은 제품 소개와 진입 CTA만 담당합니다. 세션 로직, 콘텐츠
              스키마, API 라우트는 아직 연결하지 않습니다.
            </p>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
