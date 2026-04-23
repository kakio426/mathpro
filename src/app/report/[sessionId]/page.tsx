import { RouteShell } from "@/components/placeholder/route-shell";
import { siteConfig } from "@/lib/site";

type ReportPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { sessionId } = await params;

  return (
    <RouteShell
      eyebrow="수학프로 리포트 셸"
      title="수학프로 학습 리포트"
      description="이 화면은 수학프로의 S5 진단 엔진과 P4 문장화 계층이 들어갈 자리입니다. 지금은 4블록 결과 구조와 동적 session route만 유지합니다."
      routeValue={`/report/${sessionId}`}
      highlights={siteConfig.reportBlocks}
      footer={
        <>
          현재는 세션 저장이나 진단 데이터가 없으므로 placeholder만 노출합니다. 이후
          게스트 세션이 생기면 이 route가 실제 수학프로 결과 조회 페이지가 됩니다.
        </>
      }
    />
  );
}
