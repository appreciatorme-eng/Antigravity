import { apiError, apiSuccess } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";
import { updateTripRequestDraftForOperator, type OperatorTripRequestUpdateInput } from "@/lib/whatsapp/trip-intake.server";
import { resolveTripRequestRouteContext } from "../shared";

type TripRequestPatchBody = Partial<OperatorTripRequestUpdateInput>;

export async function PATCH(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  try {
    const result = await resolveTripRequestRouteContext();
    if (result.response) {
      return result.response;
    }

    const { id } = await params;
    if (!id) {
      return apiError("Missing trip request id", 400);
    }

    const body = await req.json().catch(() => null) as TripRequestPatchBody | null;
    if (!body) {
      return apiError("Invalid request body", 400);
    }

    const outcome = await updateTripRequestDraftForOperator({
      organizationId: result.context.organization.id,
      operatorUserId: result.context.user.id,
      draftId: id,
      input: {
        destination: body.destination ?? "",
        durationDays: typeof body.durationDays === "number" ? body.durationDays : 0,
        clientName: body.clientName ?? "",
        clientEmail: body.clientEmail ?? null,
        clientPhone: body.clientPhone ?? null,
        travelerCount: typeof body.travelerCount === "number" ? body.travelerCount : 0,
        startDate: body.startDate ?? "",
        endDate: body.endDate ?? "",
        budget: body.budget ?? null,
        hotelPreference: body.hotelPreference ?? null,
        interests: Array.isArray(body.interests) ? body.interests : [],
        originCity: body.originCity ?? null,
      },
    });

    if (!outcome.success) {
      return apiError(outcome.message, 400);
    }

    return apiSuccess({
      request: outcome.request ?? null,
      message: outcome.message,
    });
  } catch (error) {
    logError("[trip-requests] failed to patch request", error);
    return apiError("Failed to update trip request", 500);
  }
}
