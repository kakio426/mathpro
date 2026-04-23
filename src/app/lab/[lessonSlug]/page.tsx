import { notFound } from "next/navigation";
import { LessonRunner } from "@/components/lesson-runner/lesson-runner";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadLessonSpec, loadModuleManifest } from "@/features/content";

type LabPageProps = {
  params: Promise<{ lessonSlug: string }>;
};

export default async function LabLessonPage({ params }: LabPageProps) {
  const { lessonSlug } = await params;
  const manifest = loadModuleManifest();

  if (!manifest.lessonOrder.includes(lessonSlug)) {
    notFound();
  }

  const lesson = loadLessonSpec(lessonSlug);

  return (
    <>
      <section className="pt-[var(--space-section)]">
        <Container className="space-y-6">
          <div className="space-y-4">
            <Badge variant="accent">
              {manifest.title} | {lesson.title}
            </Badge>
            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {lesson.title} | 수학프로 학습
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                {lesson.summary}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>이번 lesson에서 다루는 개념</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.copy.intro ? (
                <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                  {lesson.copy.intro}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-white/80 px-4 py-4">
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    목표
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {lesson.goal}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/80 px-4 py-4">
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    활동 수
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {lesson.activities.length}개 활동
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/80 px-4 py-4">
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
                    학년군
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    초등 {lesson.gradeBand}학년군
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <LessonRunner lesson={lesson} moduleTitle={manifest.title} />
    </>
  );
}
