import crypto from "node:crypto";
import { env } from "@/lib/config/env";

function getInvoiceAccessSecret() {
  return process.env.INVOICE_SIGNING_SECRET || env.razorpay.keySecret || env.razorpay.webhookSecret || null;
}

export function signInvoiceAccess(invoiceId: string, paymentId: string) {
  const secret = getInvoiceAccessSecret();
  if (!secret) {
    throw new Error("Invoice access secret is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${invoiceId}:${paymentId}`)
    .digest("hex");
}

export function verifyInvoiceAccessSignature(
  invoiceId: string,
  paymentId: string,
  signature: string,
) {
  const secret = getInvoiceAccessSecret();
  if (!secret) return false;

  const expected = signInvoiceAccess(invoiceId, paymentId);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function buildInvoiceDownloadUrl(
  baseUrl: string,
  invoiceId: string,
  paymentId?: string | null,
) {
  const url = new URL(`/api/bookings/${invoiceId}/invoice`, baseUrl);
  if (paymentId) {
    url.searchParams.set("payment_id", paymentId);
    url.searchParams.set("signature", signInvoiceAccess(invoiceId, paymentId));
  }
  return url.toString();
}
