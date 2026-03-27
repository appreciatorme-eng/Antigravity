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
        readonly push_name?: string;
        readonly ai_classification?: string;
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

/** Reject push names that are just phone numbers, "Você", "You", etc. */
function isValidPushName(name: string, waId: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    // Reject if it's the contact's own phone number
    if (trimmed === waId || trimmed === `+${waId}`) return false;
    // Reject common garbage values from Baileys
    const garbage = ["você", "you", "unknown", "null", "undefined"];
    if (garbage.includes(trimmed.toLowerCase())) return false;
    // Reject if it's all digits (another phone number variant)
    if (/^\+?\d[\d\s-]+$/.test(trimmed)) return false;
    return true;
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

      // Match all session names for this org (old deterministic + unique suffixed)
      const baseSessionName = `org_${orgId.replace(/-/g, "").slice(0, 8)}`;

      // Fetch the last 1000 text + voice events for this org's session (newest first)
      const { data: events, error } = await adminClient
          .from("whatsapp_webhook_events")
          .select("id, received_at, wa_id, event_type, metadata")
          .filter("metadata->>session", "like", `${baseSessionName}%`)
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

      // Build pushName map from most recent INBOUND event metadata for each waId
      // (outbound messages have the operator's pushName, not the contact's)
      const pushNameMap = new Map<string, string>();
      for (const [waId, evs] of grouped) {
          for (const ev of evs) {
              const meta = ev.metadata as Record<string, unknown> | null;
              if (meta?.direction !== "in") continue;
              const pn = (meta?.push_name ?? meta?.pushName) as string | undefined;
              if (pn && typeof pn === "string" && isValidPushName(pn, waId)) {
                  pushNameMap.set(waId, pn);
                  break;
              }
          }
      }

      // Look up contact profiles for all unique wa_ids
      const waIds = Array.from(grouped.keys());
      const phones = Array.from(new Set(waIds.flatMap((id) => phoneCandidates(id))));

      // Load custom names and stored pushNames from contact_names table
      // Table pending type generation -- use untyped access until `npx supabase gen types` runs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const untypedClient = adminClient as any;
      const { data: contactNames } = await untypedClient
          .from("whatsapp_contact_names")
          .select("wa_id, custom_name, push_name, is_personal")
          .eq("org_id", orgId)
          .in("wa_id", waIds) as { data: ReadonlyArray<{ wa_id: string; custom_name: string | null; push_name: string | null; is_personal: boolean }> | null };

      const customNameMap = new Map<string, string>();
      const storedPushNameMap = new Map<string, string>();
      const personalSet = new Set<string>();
      for (const cn of contactNames ?? []) {
          if (cn.custom_name) customNameMap.set(cn.wa_id, cn.custom_name);
          if (cn.push_name) storedPushNameMap.set(cn.wa_id, cn.push_name);
          if (cn.is_personal) personalSet.add(cn.wa_id);
      }

      // Also check AI classification from webhook metadata for contacts not manually classified
      for (const [waId, evs] of grouped) {
          if (personalSet.has(waId)) continue;
          for (const ev of evs) {
              const meta = ev.metadata as Record<string, unknown> | null;
              if (meta?.ai_classification === "personal") {
                  personalSet.add(waId);
                  break;
              }
          }
      }

      // Upsert pushNames to contact_names table for persistence
      const pushNameUpserts = Array.from(pushNameMap.entries()).map(([waId, pn]) => ({
          org_id: orgId,
          wa_id: waId,
          push_name: pn,
          updated_at: new Date().toISOString(),
      }));
      if (pushNameUpserts.length > 0) {
          await untypedClient
              .from("whatsapp_contact_names")
              .upsert(pushNameUpserts, { onConflict: "org_id,wa_id", ignoreDuplicates: false })
              .select();
      }

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
              .filter("metadata->>session", "like", `${baseSessionName}%`)
              .filter("metadata->>direction", "eq", "out")
              .in("wa_id", waIds);
          for (const ev of outboundEvents ?? []) {
              if (ev.wa_id) outboundWaIdSet.add(ev.wa_id);
          }
      }

      // Business filter: keep contacts that are saved profiles OR have outbound messages
      // Exclude contacts classified as personal
      const filteredWaIds = businessOnly
          ? waIds.filter((waId) => {
                if (personalSet.has(waId)) return false;
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
      const conversations = filteredWaIds.map((waId) => {
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
                  rawTimestamp: ev.received_at,
                  status: ((meta?.status as string) ?? "delivered") as "sent" | "delivered" | "read" | "pending",
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
              id: `wpp_${waId}`,
              channel: "whatsapp" as const,
              chatbotSession,
              contact: {
                  id: contactProfile?.id ?? `unknown_${waId}`,
                  name: contactProfile?.full_name
                      ?? customNameMap.get(waId)
                      ?? pushNameMap.get(waId)
                      ?? storedPushNameMap.get(waId)
                      ?? displayPhone,
                  phone: displayPhone,
                  type: contactType,
                  isPersonal: personalSet.has(waId),
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
