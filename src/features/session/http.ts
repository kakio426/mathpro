import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import type { GuestCookieStore } from "@/features/auth";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";
import { createSessionService, SessionServiceError } from "./service";
import { createSupabaseSessionStore } from "./store";

export function createAppSessionService() {
  return createSessionService({
    store: createSupabaseSessionStore(createServerSupabaseAdminClient()),
  });
}

export function toGuestCookieStore(cookieStore: {
  get(name: string): { value: string } | undefined;
  set(
    name: string,
    value: string,
    options: {
      path: string;
      sameSite: "lax";
      maxAge: number;
      secure: boolean;
    },
  ): void;
}) {
  return {
    get(name: string) {
      return cookieStore.get(name);
    },
    set(
      name: string,
      value: string,
      options: {
        path: string;
        sameSite: "lax";
        maxAge: number;
        secure: boolean;
      },
    ) {
      cookieStore.set(name, value, options);
    },
  } satisfies GuestCookieStore;
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new SessionServiceError(
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new SessionServiceError(
      400,
      "invalid_request",
      parsed.error.issues.map((issue) => issue.message).join(" "),
    );
  }

  return parsed.data;
}

export function sessionErrorResponse(error: unknown) {
  if (error instanceof SessionServiceError) {
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
