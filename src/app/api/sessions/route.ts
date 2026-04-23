import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveGuestIdentity } from "@/features/auth";
import {
  createAppSessionService,
  parseJsonBody,
  sessionErrorResponse,
  toGuestCookieStore,
} from "@/features/session";
import { createSessionRequestSchema } from "@/types/session";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, createSessionRequestSchema);
    const cookieStore = toGuestCookieStore(await cookies());
    const { guestId } = resolveGuestIdentity(cookieStore);
    const sessionService = createAppSessionService();
    const response = await sessionService.startGuestSession({
      guestId,
      lessonSlug: body.lessonSlug,
    });

    return NextResponse.json(response, {
      status: 201,
    });
  } catch (error) {
    return sessionErrorResponse(error);
  }
}
