import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { markChatbotSessionHandedOff } from "@/lib/whatsapp/chatbot-flow";
import { logError } from "@/lib/observability/logger";

const PatchChatbotSessionSchema = z.object({
  state: z.literal("handed_off"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) {
      return admin.response;
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: 30,
      windowMs: 60_000,
      prefix: "api:whatsapp:chatbot-sessions:patch",
    });
    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429);
    }

    if (!passesMutationCsrfGuard(request)) {
      return apiError("CSRF validation failed for admin mutation", 403);
    }

    if (!admin.organizationId) {
      return apiError("Organization not found", 404);
    }

    const body = await request.json().catch(() => null);
    const parsed = PatchChatbotSessionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid chatbot session update", 400, {
        details: parsed.error.flatten(),
      });
    }

    const { id } = await params;
    const updated = await markChatbotSessionHandedOff({
      sessionId: id,
      organizationId: admin.organizationId,
    });

    if (!updated) {
      return apiError("Chatbot session not found", 404);
    }

    return apiSuccess({ session: updated });
  } catch (error) {
    logError("[whatsapp/chatbot-sessions/:id] unexpected error", error);
    return apiError("Failed to update chatbot session", 500);
  }
}
