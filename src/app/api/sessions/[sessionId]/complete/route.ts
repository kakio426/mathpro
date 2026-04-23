import { cookies } from "next/headers";
import { readGuestIdentity } from "@/features/auth";
import {
  createAppSessionService,
  parseJsonBody,
  SessionServiceError,
  sessionErrorResponse,
  toGuestCookieStore,
} from "@/features/session";
import { sessionCompleteInputSchema } from "@/types/session";

type SessionCompleteRouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(
  request: Request,
  { params }: SessionCompleteRouteContext,
) {
  try {
    const { sessionId } = await params;
    const body = await parseJsonBody(request, sessionCompleteInputSchema);
    const guestId = readGuestIdentity(toGuestCookieStore(await cookies()));

    if (!guestId) {
      throw new SessionServiceError(404, "not_found", "Session not found.");
    }

    const sessionService = createAppSessionService();
    const response = await sessionService.completeSession({
      guestId,
      sessionId,
      clientEventId: body.clientEventId,
      clientTs: body.clientTs,
    });

    return Response.json(response);
  } catch (error) {
    return sessionErrorResponse(error);
  }
}
