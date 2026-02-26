import { sanitizeText } from "@/lib/security/sanitize";

export type RiskLevel = "low" | "medium" | "high";

export interface ProposalRiskInput {
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  viewedAt: string | null;
  totalPrice: number | null;
  orgMedianPrice: number;
}

export interface ProposalRiskScore {
  score: number;
  level: RiskLevel;
  reasons: string[];
  nextAction: string;
}

export function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

export function daysSince(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export function safeTitle(value: unknown, fallback = "Untitled"): string {
  return sanitizeText(value, { maxLength: 160 }) || fallback;
}

export function normalizeStatus(value: unknown, fallback = "draft"): string {
  const status = sanitizeText(value, { maxLength: 40 }).toLowerCase();
  return status || fallback;
}

function percentile50(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function medianPrice(values: Array<number | null | undefined>): number {
  const cleaned = values
    .map((value) => toNumber(value, NaN))
    .filter((value) => Number.isFinite(value) && value > 0);
  return percentile50(cleaned);
}

export function computeProposalRisk(input: ProposalRiskInput): ProposalRiskScore {
  const status = normalizeStatus(input.status);
  const expiringIn = daysUntil(input.expiresAt);
  const ageDays = daysSince(input.createdAt);
  const staleDays = daysSince(input.updatedAt || input.createdAt);
  const viewedAgeDays = daysSince(input.viewedAt);
  const price = toNumber(input.totalPrice, 0);
  const median = input.orgMedianPrice > 0 ? input.orgMedianPrice : price;

  let score = 0;
  const reasons: string[] = [];

  if (["draft", "sent", "viewed"].includes(status) && expiringIn !== null && expiringIn <= 3) {
    score += 35;
    reasons.push("Proposal expires within 72 hours");
  }

  if (!input.viewedAt && ageDays !== null && ageDays >= 2) {
    score += 22;
    reasons.push("Client has not viewed the proposal");
  }

  if (staleDays !== null && staleDays >= 7 && ["draft", "sent", "viewed"].includes(status)) {
    score += 18;
    reasons.push("No update activity in over a week");
  }

  if (median > 0 && price >= median * 1.35) {
    score += 14;
    reasons.push("Price is significantly above org median");
  }

  if (status === "rejected") {
    score += 45;
    reasons.push("Proposal was rejected");
  }

  if (status === "approved" || status === "converted") {
    score = Math.max(0, score - 45);
  }

  if (viewedAgeDays !== null && viewedAgeDays > 10 && status === "viewed") {
    score += 10;
    reasons.push("Viewed but not followed up for 10+ days");
  }

  score = clamp(Math.round(score), 0, 100);
  const level: RiskLevel = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  let nextAction = "Monitor";
  if (level === "high") {
    nextAction = "Follow up today with revised options and urgency note";
  } else if (level === "medium") {
    nextAction = "Schedule follow-up and offer one tailored adjustment";
  } else if (status === "approved") {
    nextAction = "Convert to trip and trigger onboarding workflow";
  }

  return {
    score,
    level,
    reasons,
    nextAction,
  };
}

