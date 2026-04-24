import { notFound } from "next/navigation";
import { TeacherReportView } from "@/components/teacher/teacher-report-view";
import { createAppTeacherService, TeacherServiceError } from "@/features/teacher";

export const dynamic = "force-dynamic";

type TeacherAssignmentPageProps = {
  params: Promise<{ assignmentId: string }>;
};

async function loadTeacherReport(assignmentId: string) {
  const teacherService = createAppTeacherService();

  return teacherService.getTeacherReport(assignmentId);
}

export default async function TeacherAssignmentPage({
  params,
}: TeacherAssignmentPageProps) {
  const { assignmentId } = await params;
  let report: Awaited<ReturnType<typeof loadTeacherReport>>;

  try {
    report = await loadTeacherReport(assignmentId);
  } catch (error) {
    if (error instanceof TeacherServiceError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return <TeacherReportView report={report} />;
}
