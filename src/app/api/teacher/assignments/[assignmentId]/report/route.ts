import {
  createAppTeacherService,
  teacherErrorResponse,
} from "@/features/teacher";

type TeacherAssignmentReportRouteContext = {
  params: Promise<{ assignmentId: string }>;
};

export async function GET(
  _request: Request,
  { params }: TeacherAssignmentReportRouteContext,
) {
  try {
    const { assignmentId } = await params;
    const teacherService = createAppTeacherService();
    const report = await teacherService.getTeacherReport(assignmentId);

    return Response.json({
      report,
    });
  } catch (error) {
    return teacherErrorResponse(error);
  }
}
