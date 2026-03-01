export type OutcomePackageKey = "ai_credits" | "whatsapp_volume" | "premium_templates";

export type OutcomePackage = {
  key: OutcomePackageKey;
  name: string;
  description: string;
  price_label: string;
  expected_impact: string;
};

export type OutcomeUpgradePrompt = {
  id: string;
  title: string;
  detail: string;
  trigger_metric_label: string;
  trigger_metric_value: string;
  threshold_label: string;
  priority: number;
  recommended_plan_id: string | null;
  recommended_package_key: OutcomePackageKey | null;
  cta_label: string;
};

export type OutcomeUpgradeInputs = {
  currentPlanId: string;
  usageHealth: {
    clientsPct: number;
    proposalsPct: number;
    aiPct: number;
  };
  usage: {
    clientsUsed: number;
    proposalsUsed: number;
    aiRequestsUsed: number;
  };
  recoveredRevenueInr: number;
  unpaidInvoiceCount: number;
  pendingFollowUps: number;
};

export const OUTCOME_PACKAGES: Record<OutcomePackageKey, OutcomePackage> = {
  ai_credits: {
    key: "ai_credits",
    name: "AI Credits Pack",
    description: "Extra AI generation credits for high-volume itinerary and proposal creation.",
    price_label: "₹2,999/month",
    expected_impact: "Avoid AI throttling during peak sales periods.",
  },
  whatsapp_volume: {
    key: "whatsapp_volume",
    name: "WhatsApp Volume Pack",
    description: "Higher message volume and advanced reminder automation for follow-ups and payment nudges.",
    price_label: "₹1,999/month",
    expected_impact: "Reduce overdue follow-ups and improve payment recovery speed.",
  },
  premium_templates: {
    key: "premium_templates",
    name: "Premium Templates Pack",
    description: "Outcome-focused proposal templates with conversion and upsell modules.",
    price_label: "₹1,499/month",
    expected_impact: "Lift close-rates on high-value itineraries.",
  },
};

function normalizePct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatPct(value: number): string {
  return `${Math.round(normalizePct(value))}%`;
}

function getScalePlan(currentPlanId: string): string | null {
  if (currentPlanId === "enterprise") return null;
  if (currentPlanId.startsWith("pro")) return "enterprise";
  return "pro_monthly";
}

export function buildOutcomeUpgradePrompts(input: OutcomeUpgradeInputs): OutcomeUpgradePrompt[] {
  const prompts: OutcomeUpgradePrompt[] = [];
  const nextPlan = getScalePlan(input.currentPlanId);

  const proposalsPct = normalizePct(input.usageHealth.proposalsPct);
  if (proposalsPct >= 80) {
    prompts.push({
      id: "proposal-capacity",
      title: "Proposal demand is near plan capacity",
      detail:
        "Proposal creation is close to your plan limit. Upgrade before peak inquiries slow down your sales cycle.",
      trigger_metric_label: "Proposal utilization",
      trigger_metric_value: formatPct(proposalsPct),
      threshold_label: "Trigger at >=80%",
      priority: 1,
      recommended_plan_id: nextPlan,
      recommended_package_key: "premium_templates",
      cta_label: nextPlan ? "Scale proposal capacity" : "Review add-ons",
    });
  }

  const aiPct = normalizePct(input.usageHealth.aiPct);
  if (aiPct >= 75) {
    prompts.push({
      id: "ai-capacity",
      title: "AI workload is approaching cap",
      detail:
        "AI usage is high and likely to throttle generation quality or speed during busy hours.",
      trigger_metric_label: "AI utilization",
      trigger_metric_value: formatPct(aiPct),
      threshold_label: "Trigger at >=75%",
      priority: 2,
      recommended_plan_id: nextPlan,
      recommended_package_key: "ai_credits",
      cta_label: nextPlan ? "Unlock more AI capacity" : "Add AI credits",
    });
  }

  const clientsPct = normalizePct(input.usageHealth.clientsPct);
  if (clientsPct >= 85) {
    prompts.push({
      id: "client-capacity",
      title: "Client capacity is tight",
      detail:
        "You are operating close to your client limit, which can block onboarding new leads.",
      trigger_metric_label: "Client utilization",
      trigger_metric_value: formatPct(clientsPct),
      threshold_label: "Trigger at >=85%",
      priority: 2,
      recommended_plan_id: nextPlan,
      recommended_package_key: null,
      cta_label: nextPlan ? "Expand client capacity" : "Capacity already maxed",
    });
  }

  if (input.unpaidInvoiceCount >= 5 || input.pendingFollowUps >= 10) {
    prompts.push({
      id: "collections-pressure",
      title: "Collections workload needs automation",
      detail:
        "Payment follow-ups are accumulating. Automated WhatsApp reminders can recover revenue faster.",
      trigger_metric_label: "Open collections tasks",
      trigger_metric_value: `${input.unpaidInvoiceCount} unpaid / ${input.pendingFollowUps} follow-ups`,
      threshold_label: "Trigger at >=5 unpaid or >=10 follow-ups",
      priority: 1,
      recommended_plan_id: null,
      recommended_package_key: "whatsapp_volume",
      cta_label: "Add reminder automation",
    });
  }

  if (
    input.recoveredRevenueInr >= 150000 &&
    input.currentPlanId !== "pro_annual" &&
    input.currentPlanId !== "enterprise"
  ) {
    prompts.push({
      id: "roi-upgrade",
      title: "Revenue recovery indicates clear upgrade ROI",
      detail:
        "Current usage has generated enough recovered revenue to justify annual savings and faster payback.",
      trigger_metric_label: "Recovered revenue",
      trigger_metric_value: `₹${Math.round(input.recoveredRevenueInr).toLocaleString("en-IN")}`,
      threshold_label: "Trigger at >=₹1,50,000",
      priority: 3,
      recommended_plan_id: "pro_annual",
      recommended_package_key: null,
      cta_label: "Switch to annual savings",
    });
  }

  return prompts.sort((a, b) => a.priority - b.priority);
}

export function getPromptPackages(prompts: OutcomeUpgradePrompt[]): OutcomePackage[] {
  const keys = Array.from(
    new Set(prompts.map((prompt) => prompt.recommended_package_key).filter(Boolean))
  ) as OutcomePackageKey[];

  return keys.map((key) => OUTCOME_PACKAGES[key]);
}
