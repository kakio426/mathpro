import { notFound } from "next/navigation";
import { TeacherActivityPreview } from "@/components/teacher/teacher-activity-preview";
import { createAppTeacherService, TeacherServiceError } from "@/features/teacher";

export const dynamic = "force-dynamic";

type TeacherActivityPreviewPageProps = {
  params: Promise<{ assignmentId: string }>;
};

async function loadTeacherActivityPreview(assignmentId: string) {
  const teacherService = createAppTeacherService();

  return teacherService.getAssignmentById(assignmentId);
}

export default async function TeacherActivityPreviewPage({
  params,
}: TeacherActivityPreviewPageProps) {
  const { assignmentId } = await params;
  let assignment: Awaited<ReturnType<typeof loadTeacherActivityPreview>>;

  try {
    assignment = await loadTeacherActivityPreview(assignmentId);
  } catch (error) {
    if (error instanceof TeacherServiceError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return <TeacherActivityPreview assignment={assignment} />;
}
