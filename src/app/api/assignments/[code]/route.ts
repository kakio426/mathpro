import {
  createAppTeacherService,
  teacherErrorResponse,
} from "@/features/teacher";

type AssignmentRouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, { params }: AssignmentRouteContext) {
  try {
    const { code } = await params;
    const teacherService = createAppTeacherService();
    const assignment = await teacherService.getAssignmentByCode(code);

    return Response.json({
      assignment,
    });
  } catch (error) {
    return teacherErrorResponse(error);
  }
}
