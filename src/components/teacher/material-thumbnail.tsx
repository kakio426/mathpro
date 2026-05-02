import { MonitorPlay } from "lucide-react";
import { toFriendlyHtmlArtifactSource } from "@/features/teacher/display";
import type { PublishedAssignmentListItem } from "@/types/teacher";

type MaterialThumbnailProps = {
  assignment: PublishedAssignmentListItem;
  title: string;
};

export function MaterialThumbnail({ assignment, title }: MaterialThumbnailProps) {
  const previewSource = assignment.previewHtml
    ? toFriendlyHtmlArtifactSource(assignment.previewHtml, assignment.concept)
    : "";

  return (
    <div className="p-4 pb-0">
      <div className="relative overflow-hidden rounded-[1.65rem] border border-slate-900/15 bg-slate-950 p-3 shadow-soft">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem] bg-white">
          {previewSource ? (
            <iframe
              allow=""
              className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white"
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts"
              srcDoc={previewSource}
              title={`${title} 썸네일`}
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(15,118,110,0.16),transparent_34%),linear-gradient(135deg,#fffaf0,#eef7f4)] p-6 text-center">
              <div className="space-y-2">
                <MonitorPlay className="mx-auto size-9 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  미리보기 준비 중
                </p>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/55 to-transparent" />
          <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {assignment.status === "active" ? "배포 중" : "참여 종료"}
          </div>
        </div>
      </div>
    </div>
  );
}
