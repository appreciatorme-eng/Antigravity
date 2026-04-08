import type { Json } from "@/lib/database.types";
import { formatPaymentAmount } from "@/lib/payments/payment-links";

export const SHARE_PAYMENT_DEPOSIT_PRESETS = [25, 30, 50] as const;

export type SharePaymentDepositPreset = (typeof SHARE_PAYMENT_DEPOSIT_PRESETS)[number];
export type SharePaymentMode = "full_only" | "deposit_only" | "client_choice";
export type SharePaymentOption = "full" | "deposit";

export interface SharePaymentConfig {
  enabled: boolean;
  mode: SharePaymentMode;
  currency: "INR";
  full_amount_paise: number;
  deposit_percent?: SharePaymentDepositPreset;
  deposit_amount_paise?: number;
  title?: string;
  notes?: string;
}

export interface SharePaymentSummary {
  config: SharePaymentConfig;
  latest_status: "pending" | "viewed" | "paid" | "expired" | "cancelled" | null;
  latest_paid_at: string | null;
}

export interface SharePaymentDefaults {
  full_amount_paise: number;
  currency: "INR";
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  title?: string | null;
  notes?: string | null;
}

export function isSharePaymentDepositPreset(value: unknown): value is SharePaymentDepositPreset {
  return (
    typeof value === "number" &&
    SHARE_PAYMENT_DEPOSIT_PRESETS.includes(value as SharePaymentDepositPreset)
  );
}

export function computeDepositAmountPaise(
  fullAmountPaise: number,
  depositPercent: SharePaymentDepositPreset,
): number {
  return Math.round((fullAmountPaise * depositPercent) / 100);
}

export function normalizeSharePaymentConfig(value: Json | unknown): SharePaymentConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const enabled = record.enabled === true;
  const mode =
    record.mode === "full_only" || record.mode === "deposit_only" || record.mode === "client_choice"
      ? record.mode
      : null;
  const currency = record.currency === "INR" ? "INR" : null;
  const fullAmountPaise =
    typeof record.full_amount_paise === "number" && Number.isFinite(record.full_amount_paise)
      ? Math.round(record.full_amount_paise)
      : 0;

  if (!enabled || !mode || !currency || fullAmountPaise <= 0) {
    return null;
  }

  const depositPercent = isSharePaymentDepositPreset(record.deposit_percent)
    ? record.deposit_percent
    : undefined;
  const depositAmountPaise =
    typeof record.deposit_amount_paise === "number" && Number.isFinite(record.deposit_amount_paise)
      ? Math.round(record.deposit_amount_paise)
      : depositPercent
        ? computeDepositAmountPaise(fullAmountPaise, depositPercent)
        : undefined;

  if ((mode === "deposit_only" || mode === "client_choice") && (!depositPercent || !depositAmountPaise)) {
    return null;
  }

  return {
    enabled: true,
    mode,
    currency,
    full_amount_paise: fullAmountPaise,
    deposit_percent: depositPercent,
    deposit_amount_paise: depositAmountPaise,
    title: typeof record.title === "string" && record.title.trim() ? record.title.trim() : undefined,
    notes: typeof record.notes === "string" && record.notes.trim() ? record.notes.trim() : undefined,
  };
}

export function buildSharePaymentSummaryLabel(summary: SharePaymentSummary | null): string | null {
  if (!summary) return null;

  const { config, latest_status: latestStatus } = summary;
  const modeLabel =
    config.mode === "full_only"
      ? `Full ${formatPaymentAmount(config.full_amount_paise)}`
      : config.mode === "deposit_only"
        ? `Deposit ${formatPaymentAmount(config.deposit_amount_paise || 0)}`
        : `Full or deposit ${config.deposit_percent}%`;

  const statusLabel =
    latestStatus === "paid"
      ? "Paid"
      : latestStatus === "viewed"
        ? "Viewed"
        : latestStatus === "pending"
          ? "Awaiting payment"
          : latestStatus === "expired"
            ? "Link expired"
            : latestStatus === "cancelled"
              ? "Cancelled"
              : "Payment enabled";

  return `${modeLabel} · ${statusLabel}`;
}

export function getSharePaymentAmountForOption(
  config: SharePaymentConfig,
  option: SharePaymentOption,
): number {
  if (option === "deposit") {
    return config.deposit_amount_paise || 0;
  }
  return config.full_amount_paise;
}
