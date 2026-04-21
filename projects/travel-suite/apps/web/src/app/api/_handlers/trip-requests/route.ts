import { apiError, apiSuccess } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";
import { listOperatorTripRequestsForOrganization } from "@/lib/whatsapp/trip-intake.server";
import { resolveTripRequestRouteContext } from "./shared";

export async function GET() {
  try {
    const result = await resolveTripRequestRouteContext();
    if (result.response) {
      return result.response;
    }

    const requests = await listOperatorTripRequestsForOrganization(result.context.organization.id, 80);

    return apiSuccess({
      requests,
      organizationName: result.context.organization.name ?? "Your organization",
    });
  } catch (error) {
    logError("[trip-requests] failed to list requests", error);
    return apiError("Failed to load trip requests", 500);
  }
}
