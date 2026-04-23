import { cookies } from "next/headers";
import { readGuestIdentity } from "@/features/auth";
import {
  createAppSessionService,
  parseJsonBody,
  SessionServiceError,
  sessionErrorResponse,
  toGuestCookieStore,
} from "@/features/session";
import { sessionEventInputSchema } from "@/types/session";

type SessionEventsRouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(
  request: Request,
  { params }: SessionEventsRouteContext,
) {
  try {
    const { sessionId } = await params;
    const body = await parseJsonBody(request, sessionEventInputSchema);
    const guestId = readGuestIdentity(toGuestCookieStore(await cookies()));

    if (!guestId) {
      throw new SessionServiceError(404, "not_found", "Session not found.");
    }

    const sessionService = createAppSessionService();
    const response = await sessionService.appendSessionEvent({
      guestId,
      sessionId,
      event: body,
    });

    return Response.json(response);
  } catch (error) {
    return sessionErrorResponse(error);
  }
}
