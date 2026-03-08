import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { markChatbotSessionHandedOff } from "@/lib/whatsapp/chatbot-flow";

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
      return apiError("Unauthorized", admin.response.status || 401);
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
    console.error("[whatsapp/chatbot-sessions/:id] unexpected error:", error);
    return apiError("Failed to update chatbot session", 500);
  }
}
