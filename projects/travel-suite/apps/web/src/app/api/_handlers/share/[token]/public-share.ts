import { randomUUID } from "crypto";

import type { Json } from "@/lib/database.types";
import { normalizeSharePaymentConfig } from "@/lib/share/payment-config";
import { sanitizeText } from "@/lib/security/sanitize";

export const SHARE_PUBLIC_STATE_SELECT = [
  "id",
  "itinerary_id",
  "client_comments",
  "expires_at",
  "status",
  "approved_by",
  "approved_at",
  "client_preferences",
  "wishlist_items",
  "self_service_status",
  "offline_pack_ready",
  "payment_config",
].join(", ");

export type ShareComment = {
  id: string;
  author: string;
  comment: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  operator_reply?: string;
  operator_reply_at?: string;
};

export type SharePreferences = {
  budget_preference?: string;
  pace?: string;
  room_preference?: string;
  must_have?: string[];
  avoid?: string[];
  notes?: string;
};

export type ShareRow = {
  id: string;
  itinerary_id: string | null;
  client_comments: Json;
  expires_at: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  client_preferences?: Json;
  wishlist_items?: Json;
  self_service_status?: string | null;
  offline_pack_ready?: boolean | null;
  payment_config?: Json | null;
};

export function parseCommentArray(value: Json | null | undefined): ShareComment[] {
  if (!Array.isArray(value)) return [];

  const comments: ShareComment[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const record = entry as Record<string, unknown>;
    const id = sanitizeText(record.id, { maxLength: 120 }) || randomUUID();
    const author = sanitizeText(record.author, { maxLength: 120 }) || "Guest";
    const comment = sanitizeText(record.comment, {
      maxLength: 2000,
      preserveNewlines: true,
    });
    const createdAt =
      sanitizeText(record.created_at, { maxLength: 80 }) ||
      new Date().toISOString();

    if (!comment) continue;

    const resolved_at =
      sanitizeText(record.resolved_at, { maxLength: 80 }) || undefined;
    const resolved_by =
      sanitizeText(record.resolved_by, { maxLength: 120 }) || undefined;
    const operator_reply =
      sanitizeText(record.operator_reply, {
        maxLength: 2000,
        preserveNewlines: true,
      }) || undefined;
    const operator_reply_at =
      sanitizeText(record.operator_reply_at, { maxLength: 80 }) || undefined;

    comments.push({
      id,
      author,
      comment,
      created_at: createdAt,
      ...(resolved_at && { resolved_at }),
      ...(resolved_by && { resolved_by }),
      ...(operator_reply && { operator_reply }),
      ...(operator_reply_at && { operator_reply_at }),
    });
  }

  return comments;
}

export function parseStringArray(
  value: Json | null | undefined,
  maxLength: number,
  maxItems: number
): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, string>();
  for (const entry of value) {
    const sanitized = sanitizeText(entry, { maxLength });
    if (!sanitized) continue;
    const key = sanitized.toLowerCase();
    if (!unique.has(key)) unique.set(key, sanitized);
    if (unique.size >= maxItems) break;
  }
  return Array.from(unique.values());
}

export function parsePreferences(
  value: Json | null | undefined
): SharePreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    budget_preference:
      sanitizeText(record.budget_preference, { maxLength: 40 }) || undefined,
    pace: sanitizeText(record.pace, { maxLength: 40 }) || undefined,
    room_preference:
      sanitizeText(record.room_preference, { maxLength: 120 }) || undefined,
    must_have: parseStringArray(record.must_have as Json, 80, 20),
    avoid: parseStringArray(record.avoid as Json, 80, 20),
    notes:
      sanitizeText(record.notes, {
        maxLength: 1000,
        preserveNewlines: true,
      }) || undefined,
  };
}

export function buildPublicShareResponse(share: ShareRow) {
  const comments = parseCommentArray(share.client_comments);
  const preferences = parsePreferences(share.client_preferences);
  const wishlistItems = parseStringArray(share.wishlist_items, 160, 50);

  return {
    status: share.status || "viewed",
    approved_by: share.approved_by || null,
    approved_at: share.approved_at || null,
    comments,
    preferences,
    wishlist_items: wishlistItems,
    self_service_status:
      sanitizeText(share.self_service_status, { maxLength: 24 }) || "active",
    offline_pack_ready: share.offline_pack_ready === true,
    expires_at: share.expires_at || null,
    payment_config: normalizeSharePaymentConfig(share.payment_config),
  };
}
