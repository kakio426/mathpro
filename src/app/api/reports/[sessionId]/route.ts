import { cookies } from "next/headers";
import { readGuestIdentity } from "@/features/auth";
import {
  createAppSessionService,
  SessionServiceError,
  sessionErrorResponse,
  toGuestCookieStore,
} from "@/features/session";

type SessionReportRouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(
  _request: Request,
  { params }: SessionReportRouteContext,
) {
  try {
    const { sessionId } = await params;
    const guestId = readGuestIdentity(toGuestCookieStore(await cookies()));

    if (!guestId) {
      throw new SessionServiceError(404, "not_found", "Session not found.");
    }

    const sessionService = createAppSessionService();
    const response = await sessionService.getSessionReport({
      guestId,
      sessionId,
    });

    return Response.json(response);
  } catch (error) {
    return sessionErrorResponse(error);
  }
}
