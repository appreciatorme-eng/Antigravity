/* ------------------------------------------------------------------
 * GET /api/whatsapp/conversations
 * Returns real WhatsApp conversations grouped by contact (wa_id).
 * Reads from whatsapp_webhook_events filtered to the caller's org session.
 * Requires admin role — the unified inbox contains full org conversation history.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { formatLocalTime, resolveAppTimezone } from "@/lib/date/tz";
import { createClient } from "@/lib/supabase/server";
import { getChatbotSessionsForPhones } from "@/lib/whatsapp/chatbot-flow";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppEvent {
    readonly id: string;
    readonly received_at: string;
    readonly wa_id: string;
    readonly event_type: string;
    readonly metadata: {
        readonly session?: string;
        readonly body_preview?: string;
        readonly direction?: string;
    } | null;
}

interface ContactProfile {
    readonly id: string;
    readonly full_name: string | null;
    readonly phone_normalized: string | null;
    readonly role: string | null;
}

function phoneCandidates(waId: string): string[] {
    return Array.from(new Set([waId, `+${waId}`]));
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  try {
      const auth = await requireAdmin(request, { requireOrganization: true });
      if (!auth.ok) return auth.response;

      const { organizationId, adminClient } = auth;
      const orgId = organizationId!;

      // Business-only filter: hide personal contacts (default: true)
      const url = new URL(request.url);
      const businessOnly = url.searchParams.get("business_only") !== "false";

      // Resolve caller timezone from their auth metadata for display formatting
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userTimezone = resolveAppTimezone(
        typeof user?.user_metadata?.timezone === "string" ? user.user_metadata.timezone : null
      );

      const sessionName = `org_${orgId.replace(/-/g, "").slice(0, 8)}`;

      // Fetch the last 1000 text + voice events for this org's session (newest first)
      const { data: events, error } = await adminClient
          .from("whatsapp_webhook_events")
          .select("id, received_at, wa_id, event_type, metadata")
          .filter("metadata->>session", "eq", sessionName)
          .in("event_type", ["text", "voice"])
          .order("received_at", { ascending: false })
          .limit(1000);

      if (error) {
          // table may not exist in all environments
          if (error.code === "PGRST205" || error.code === "42P01") {
              return NextResponse.json({ conversations: [] });
          }
          throw error;
      }
      if (!events || events.length === 0) {
          return NextResponse.json({ conversations: [] });
      }

      const typedEvents = events as WhatsAppEvent[];

      // Group by wa_id — Map preserves insertion order (newest contact first)
      const grouped = new Map<string, WhatsAppEvent[]>();
      for (const ev of typedEvents) {
          const bucket = grouped.get(ev.wa_id);
          if (bucket) {
              bucket.push(ev);
          } else {
              grouped.set(ev.wa_id, [ev]);
          }
      }

      // Look up contact profiles for all unique wa_ids
      const waIds = Array.from(grouped.keys());
      const phones = Array.from(new Set(waIds.flatMap((id) => phoneCandidates(id))));

      const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, phone_normalized, role")
          .in("phone_normalized", phones);

      const profileMap = new Map<string, ContactProfile>();
      for (const p of (profiles ?? []) as ContactProfile[]) {
          if (p.phone_normalized) {
              profileMap.set(p.phone_normalized, p);
          }
      }

      // Find wa_ids that have outbound messages (operator replied from TripBuilt)
      const outboundWaIdSet = new Set<string>();
      if (businessOnly && waIds.length > 0) {
          const { data: outboundEvents } = await adminClient
              .from("whatsapp_webhook_events")
              .select("wa_id")
              .filter("metadata->>session", "eq", sessionName)
              .filter("metadata->>direction", "eq", "out")
              .in("wa_id", waIds);
          for (const ev of outboundEvents ?? []) {
              if (ev.wa_id) outboundWaIdSet.add(ev.wa_id);
          }
      }

      // Business filter: keep contacts that are saved profiles OR have outbound messages
      const filteredWaIds = businessOnly
          ? waIds.filter((waId) => {
                const phone = "+" + waId;
                const hasProfile = profileMap.has(phone) || profileMap.has(waId);
                const hasOutbound = outboundWaIdSet.has(waId);
                return hasProfile || hasOutbound;
            })
          : waIds;

      const chatbotSessions = await getChatbotSessionsForPhones(
        orgId,
        filteredWaIds.map((waId) => `+${waId}`),
      );

      // Build ChannelConversation array (one entry per unique wa_id)
      const conversations = filteredWaIds.map((waId, idx) => {
          // Reverse so messages render oldest → newest in the thread view
          const evs = (grouped.get(waId) ?? []).slice().reverse();
          const phone = "+" + waId;
          const contactProfile = profileMap.get(phone) ?? profileMap.get(waId);
          const chatbotSession = chatbotSessions.get(phone) ?? null;

          // Determine contact type from profile role
          let contactType: "client" | "driver" | "lead" = "lead";
          if (contactProfile?.role === "driver") contactType = "driver";
          else if (contactProfile) contactType = "client";

          // Format phone for display: +91 98765 43210
          const displayPhone =
              waId.length >= 10
                  ? `+${waId.slice(0, 2)} ${waId.slice(2, 7)} ${waId.slice(7)}`
                  : phone;

          const messages = evs.map((ev) => {
              const isVoice = ev.event_type === "voice";
              const meta = ev.metadata as Record<string, unknown> | null;
              return {
                  id: ev.id,
                  type: (isVoice ? "voice" : "text") as "text" | "voice",
                  direction: (meta?.direction ?? "in") as "in" | "out",
                  body: (meta?.body_preview as string) ?? "",
                  timestamp: formatLocalTime(ev.received_at, userTimezone),
                  status: "delivered" as const,
                  ...(isVoice ? {
                      voiceDuration: (meta?.voice_duration as string) ?? undefined,
                      transcript: (meta?.transcript as string) ?? undefined,
                      tripIntent: meta?.trip_intent ?? undefined,
                  } : {}),
              };
          });

          // Unread = all inbound messages (no read-tracking yet)
          const unreadCount = messages.filter((m) => m.direction === "in").length;

          return {
              id: `wpp_${waId}_${idx}`,
              channel: "whatsapp" as const,
              chatbotSession,
              contact: {
                  id: contactProfile?.id ?? `unknown_${waId}`,
                  name: contactProfile?.full_name ?? displayPhone,
                  phone: displayPhone,
                  type: contactType,
              },
              messages,
              unreadCount,
          };
      });

      return NextResponse.json({ conversations });
  } catch (error) {
    logError("[/api/whatsapp/conversations:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
