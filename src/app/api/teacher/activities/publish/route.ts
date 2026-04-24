import {
  createAppTeacherService,
  parseTeacherJsonBody,
  teacherErrorResponse,
} from "@/features/teacher";
import { publishTeacherActivityRequestSchema } from "@/types/teacher";

export async function POST(request: Request) {
  try {
    const body = await parseTeacherJsonBody(
      request,
      publishTeacherActivityRequestSchema,
    );
    const origin = new URL(request.url).origin;
    const teacherService = createAppTeacherService();
    const assignment = await teacherService.publishActivity({
      document: body.document,
      origin,
    });

    return Response.json(
      {
        assignment,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return teacherErrorResponse(error);
  }
}
