/* ------------------------------------------------------------------
 * GET /api/admin/setup-progress
 * Returns onboarding checklist progress for the dashboard widget.
 * ------------------------------------------------------------------ */

import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: string;
}

interface SetupProgressResponse {
  items: ChecklistItem[];
  completionPct: number;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient, userId } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    // Fetch all data in parallel
    const [orgResult, tripResult, profileResult, sharedResult] =
      await Promise.all([
        adminClient
          .from("organizations")
          .select("logo_url")
          .eq("id", organizationId)
          .maybeSingle(),
        adminClient
          .from("trips")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
        adminClient
          .from("profiles")
          .select("phone_whatsapp")
          .eq("id", userId)
          .maybeSingle(),
        adminClient
          .from("shared_itineraries")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
      ]);

    if (orgResult.error) {
      logError("[admin/setup-progress] org query error", orgResult.error);
      return apiError("Failed to fetch setup progress", 500);
    }

    const hasLogo = !!orgResult.data?.logo_url;
    const tripCount = tripResult.count ?? 0;
    const hasWhatsApp = !!profileResult.data?.phone_whatsapp;
    const sharedCount = sharedResult.count ?? 0;

    const items: ChecklistItem[] = [
      {
        id: "workspace",
        title: "Create your workspace",
        description: "Account setup complete",
        completed: true,
        href: "#",
        icon: "building",
      },
      {
        id: "brand",
        title: "Add your brand",
        description: "Upload logo and set colors",
        completed: hasLogo,
        href: "/admin/settings?setup=brand",
        icon: "palette",
      },
      {
        id: "itinerary",
        title: "Create your first itinerary",
        description: "Build a trip with AI",
        completed: tripCount > 0,
        href: "/planner?setup=itinerary",
        icon: "plane",
      },
      {
        id: "whatsapp",
        title: "Connect WhatsApp",
        description: "Chat with clients",
        completed: hasWhatsApp,
        href: "/admin/settings?setup=whatsapp",
        icon: "message-circle",
      },
      {
        id: "share",
        title: "Send your first proposal",
        description: "Share an itinerary with a client",
        completed: sharedCount > 0,
        href: "/trips?setup=share",
        icon: "send",
      },
    ];

    const completedCount = items.filter((item) => item.completed).length;
    const completionPct = Math.round((completedCount / items.length) * 100);

    const response: SetupProgressResponse = { items, completionPct };
    return apiSuccess(response);
  } catch (error) {
    logError("[/api/admin/setup-progress:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
