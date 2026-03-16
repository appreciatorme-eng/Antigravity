import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentLinkByToken } from "@/lib/payments/payment-links.server";
import type { PaymentLinkData } from "@/lib/payments/payment-links";

/**
 * Fetches payment portal data for a given token.
 *
 * This function encapsulates the admin client usage so that page-level
 * components never import `createAdminClient` directly. Keeping the
 * admin client behind this boundary prevents accidental leakage into
 * client component contexts.
 */
export async function getPortalPaymentData(
  token: string,
  baseUrl?: string,
): Promise<PaymentLinkData | null> {
  const admin = createAdminClient();
  return getPaymentLinkByToken(admin, token, baseUrl);
}
