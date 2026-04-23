import { RouteShell } from "@/components/placeholder/route-shell";
import { siteConfig } from "@/lib/site";

type LabPageProps = {
  params: Promise<{ lessonSlug: string }>;
};

export default async function LabLessonPage({ params }: LabPageProps) {
  const { lessonSlug } = await params;
  const lesson = siteConfig.lessons.find((entry) => entry.slug === lessonSlug);

  return (
    <RouteShell
      eyebrow="학습 라우트 셸"
      title={lesson ? `${lesson.title} lesson shell` : "lesson shell"}
      description="이 화면은 S4 세션 러너가 들어갈 자리입니다. 지금은 동적 라우트, 레이아웃, 반응형 카드 구조만 확인합니다."
      routeValue={`/lab/${lessonSlug}`}
      highlights={siteConfig.sessionFlow}
      footer={
        <>
          lesson 콘텐츠는 아직 연결되지 않았습니다. 이후 S2에서 콘텐츠 타입 계약을
          고정하고, S4에서 이 페이지에 session runner를 넣습니다.
        </>
      }
    />
  );
}
