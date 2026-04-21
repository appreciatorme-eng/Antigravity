import { apiError, apiSuccess } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";
import {
  regenerateTripRequestItinerary,
  resendTripRequestCompletionToClient,
  resendTripRequestCompletionToOperator,
  retryTripRequestFromOperator,
} from "@/lib/whatsapp/trip-intake.server";
import { resolveTripRequestRouteContext } from "../../shared";

type TripRequestAction = "regenerate_itinerary" | "resend_operator" | "resend_client" | "retry_request";

function isTripRequestAction(value: unknown): value is TripRequestAction {
  return (
    value === "regenerate_itinerary"
    || value === "resend_operator"
    || value === "resend_client"
    || value === "retry_request"
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  try {
    const result = await resolveTripRequestRouteContext();
    if (result.response) {
      return result.response;
    }

    const { id } = await params;
    if (!id) {
      return apiError("Missing trip request id", 400);
    }

    const body = await req.json().catch(() => null) as { action?: unknown } | null;
    const action = body?.action;
    if (!isTripRequestAction(action)) {
      return apiError("Invalid trip request action", 400);
    }

    const organizationId = result.context.organization.id;
    const outcome =
      action === "regenerate_itinerary"
        ? await regenerateTripRequestItinerary({ organizationId, draftId: id })
        : action === "retry_request"
          ? await retryTripRequestFromOperator({ organizationId, draftId: id })
        : action === "resend_operator"
          ? await resendTripRequestCompletionToOperator({ organizationId, draftId: id })
          : await resendTripRequestCompletionToClient({ organizationId, draftId: id });

    if (!outcome.success) {
      return apiError(outcome.message, 400);
    }

    return apiSuccess({
      ok: true,
      action,
      message: outcome.message,
    });
  } catch (error) {
    logError("[trip-requests] failed to run action", error);
    return apiError("Failed to run trip request action", 500);
  }
}
