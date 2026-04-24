import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { createSupabaseSessionStore } from "@/features/session";
import { TeacherServiceError, createTeacherService } from "@/features/teacher/service";
import { createSupabaseTeacherStore } from "@/features/teacher/store";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export function createAppTeacherService() {
  const supabase = createServerSupabaseAdminClient();

  return createTeacherService({
    teacherStore: createSupabaseTeacherStore(supabase),
    sessionStore: createSupabaseSessionStore(supabase),
  });
}

export async function parseTeacherJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new TeacherServiceError(
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  return schema.parse(payload);
}

export function teacherErrorResponse(error: unknown) {
  if (error instanceof TeacherServiceError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.status,
      },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_request",
          message: error.issues.map((issue) => issue.message).join(" "),
        },
      },
      {
        status: 400,
      },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Unexpected server error.",
      },
    },
    {
      status: 500,
    },
  );
}
