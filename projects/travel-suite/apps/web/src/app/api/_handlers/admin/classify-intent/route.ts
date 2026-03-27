/* ------------------------------------------------------------------
 * POST /api/admin/classify-intent
 * Classify inbound message into travel-specific intent categories.
 * Returns intent label + confidence score.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { classifyMessage } from "@/lib/ai/classify-intent";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

interface ClassifyBody {
    message: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const raw = (await request.json()) as Partial<ClassifyBody>;

        if (!raw.message || typeof raw.message !== "string") {
            return apiError("'message' is required", 400);
        }

        const result = await classifyMessage(raw.message);
        return apiSuccess(result);
    } catch (err) {
        logError("[classify-intent] Failed", err);
        return apiError("Failed to classify message", 500);
    }
}
