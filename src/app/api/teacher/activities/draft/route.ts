import {
  parseTeacherJsonBody,
  teacherErrorResponse,
} from "@/features/teacher";
import { createTeacherActivityDraft } from "@/features/teacher/draft";
import { createTeacherDraftRequestSchema } from "@/types/teacher";

export async function POST(request: Request) {
  try {
    const body = await parseTeacherJsonBody(
      request,
      createTeacherDraftRequestSchema,
    );

    return Response.json({
      document: createTeacherActivityDraft(body),
    });
  } catch (error) {
    return teacherErrorResponse(error);
  }
}
