/* ------------------------------------------------------------------
 * GET /api/whatsapp/conversations
 * Returns real WhatsApp conversations grouped by contact (wa_id).
 * Reads from whatsapp_webhook_events filtered to the caller's org session.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";

import { formatLocalTime, resolveAppTimezone } from "@/lib/date/tz";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getChatbotSessionsForPhones } from "@/lib/whatsapp/chatbot-flow";
import { sessionNameFromOrgId } from "@/lib/whatsapp-waha.server";

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

export async function GET(): Promise<Response> {
  try {
      const supabase = await createClient();
      const {
          data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

      if (!profile?.organization_id) {
          return NextResponse.json({ conversations: [] });
      }

      const orgId = profile.organization_id as string;
      const userTimezone = resolveAppTimezone(
        typeof user.user_metadata?.timezone === "string" ? user.user_metadata.timezone : null
      );
      const sessionName = sessionNameFromOrgId(orgId);
      const admin = createAdminClient();

      // Fetch the last 300 text events for this org's session (newest first)
      const { data: events, error } = await admin
          .from("whatsapp_webhook_events")
          .select("id, received_at, wa_id, event_type, metadata")
          .filter("metadata->>session", "eq", sessionName)
          .eq("event_type", "text")
          .order("received_at", { ascending: false })
          .limit(300);

      if (error || !events || events.length === 0) {
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

      const { data: profiles } = await admin
          .from("profiles")
          .select("id, full_name, phone_normalized, role")
          .in("phone_normalized", phones);

      const profileMap = new Map<string, ContactProfile>();
      for (const p of (profiles ?? []) as ContactProfile[]) {
          if (p.phone_normalized) {
              profileMap.set(p.phone_normalized, p);
          }
      }

      const chatbotSessions = await getChatbotSessionsForPhones(
        orgId,
        waIds.map((waId) => `+${waId}`),
      );

      // Build ChannelConversation array (one entry per unique wa_id)
      const conversations = waIds.map((waId, idx) => {
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

          const messages = evs.map((ev) => ({
              id: ev.id,
              type: "text" as const,
              direction: (ev.metadata?.direction ?? "in") as "in" | "out",
              body: ev.metadata?.body_preview ?? "",
              timestamp: formatLocalTime(ev.received_at, userTimezone),
              status: "delivered" as const,
          }));

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
    console.error("[/api/whatsapp/conversations:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
