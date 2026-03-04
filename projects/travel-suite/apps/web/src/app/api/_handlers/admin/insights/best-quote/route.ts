import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { medianPrice, safeTitle, toNumber } from "@/lib/admin/insights";

const BodySchema = z.object({
  proposalId: z.string().uuid().optional(),
  travelerCount: z.coerce.number().int().min(1).max(50).default(2),
  targetMarginPct: z.coerce.number().min(5).max(80).default(28),
});

type AddOnRow = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
};

function roundPrice(value: number): number {
  return Math.round(value / 10) * 10;
}

function withFallback<T>(list: T[], count: number): T[] {
  if (list.length >= count) return list.slice(0, count);
  return list;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { proposalId, travelerCount, targetMarginPct } = parsed.data;

  const { data: addOnData, error: addOnError } = await admin.adminClient
    .from("add_ons")
    .select("id,name,category,price,is_active")
    .eq("organization_id", admin.organizationId)
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (addOnError) {
    return NextResponse.json({ error: addOnError.message }, { status: 500 });
  }

  const addOns = (addOnData || []) as AddOnRow[];

  let baseProposal: {
    id: string;
    title: string;
    total_price: number | null;
    client_selected_price: number | null;
    status: string | null;
  } | null = null;

  let selectedFromProposal = new Set<string>();
  if (proposalId) {
    const { data: proposal } = await admin.adminClient
      .from("proposals")
      .select("id,title,total_price,client_selected_price,status")
      .eq("organization_id", admin.organizationId)
      .eq("id", proposalId)
      .maybeSingle();
    baseProposal = proposal || null;

    const { data: selectedAddOns } = await admin.adminClient
      .from("proposal_add_ons")
      .select("add_on_id,is_selected")
      .eq("proposal_id", proposalId)
      .eq("is_selected", true);
    selectedFromProposal = new Set(
      (selectedAddOns || [])
        .map((row) => row.add_on_id)
        .filter((value): value is string => Boolean(value))
    );
  }

  if (!baseProposal) {
    const { data: proposals } = await admin.adminClient
      .from("proposals")
      .select("id,title,total_price,client_selected_price,status")
      .eq("organization_id", admin.organizationId)
      .order("created_at", { ascending: false })
      .limit(30);

    const median = medianPrice((proposals || []).map((row) => row.client_selected_price ?? row.total_price));
    baseProposal = {
      id: "new-quote",
      title: "New Quote",
      total_price: median || 1200,
      client_selected_price: null,
      status: "draft",
    };
  }

  const basePrice = Math.max(300, toNumber(baseProposal.client_selected_price ?? baseProposal.total_price, 1200));
  const sorted = [...addOns].sort((a, b) => toNumber(a.price, 0) - toNumber(b.price, 0));

  const cheapAddOns = withFallback(sorted, 2);
  const premiumAddOns = [...sorted].reverse().slice(0, Math.min(4, sorted.length));
  const balancedAddOns =
    selectedFromProposal.size > 0
      ? sorted.filter((addon) => selectedFromProposal.has(addon.id))
      : sorted.slice(0, Math.min(3, sorted.length));

  const travelerMultiplier = travelerCount >= 4 ? 1.08 : 1;
  const marginMultiplier = 1 + targetMarginPct / 100;

  const valuePrice = roundPrice(basePrice * travelerMultiplier * 0.92);
  const balancedPrice = roundPrice(basePrice * travelerMultiplier);
  const premiumBase = basePrice * travelerMultiplier * Math.max(1.16, marginMultiplier * 1.08);
  const premiumPrice = roundPrice(premiumBase);

  const makePackage = (name: string, price: number, list: AddOnRow[], tone: string) => ({
    name,
    price_usd: price,
    per_traveler_usd: roundPrice(price / travelerCount),
    included_add_ons: list.map((addon) => ({
      id: addon.id,
      name: safeTitle(addon.name),
      category: safeTitle(addon.category, "General"),
      list_price_usd: toNumber(addon.price, 0),
    })),
    positioning: tone,
  });

  const packages = [
    makePackage(
      "Value",
      valuePrice,
      cheapAddOns,
      "Best for price-sensitive travelers. Keeps core experiences while reducing close risk."
    ),
    makePackage(
      "Balanced",
      balancedPrice,
      balancedAddOns,
      "Most likely to convert. Recommended default with practical add-ons."
    ),
    makePackage(
      "Premium",
      premiumPrice,
      premiumAddOns,
      "Highest margin option for high-intent travelers and special occasions."
    ),
  ];

  return NextResponse.json({
    proposal: {
      id: baseProposal.id,
      title: safeTitle(baseProposal.title),
      status: baseProposal.status || "draft",
      base_price_usd: roundPrice(basePrice),
    },
    assumptions: {
      traveler_count: travelerCount,
      target_margin_pct: targetMarginPct,
    },
    recommended_package: "Balanced",
    packages,
    sales_script: [
      "Present Balanced first, then anchor with Premium before offering Value.",
      "Frame add-ons as convenience and certainty, not optional extras.",
      "Offer a 24-hour hold for the selected package to improve close velocity.",
    ],
  });
}

