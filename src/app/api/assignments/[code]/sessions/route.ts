import { cookies } from "next/headers";
import {
  createAppTeacherService,
  teacherErrorResponse,
} from "@/features/teacher";
import { toGuestCookieStore } from "@/features/session";

type AssignmentSessionsRouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(
  _request: Request,
  { params }: AssignmentSessionsRouteContext,
) {
  try {
    const { code } = await params;
    const teacherService = createAppTeacherService();
    const response = await teacherService.startAssignmentSession({
      code,
      cookieStore: toGuestCookieStore(await cookies()),
    });

    return Response.json(response, {
      status: 201,
    });
  } catch (error) {
    return teacherErrorResponse(error);
  }
}
