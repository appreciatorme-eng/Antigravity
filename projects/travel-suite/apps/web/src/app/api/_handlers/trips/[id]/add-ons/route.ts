import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TripAccessContext =
  | { error: NextResponse }
  | {
      admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;
      tripId: string;
    };

async function requireTripAdminAccess(
  req: Request,
  params: Promise<{ id?: string }>,
): Promise<TripAccessContext> {
  const admin = await requireAdmin(req, { requireOrganization: true });
  if (!admin.ok) {
    return { error: admin.response };
  }

  const { id: tripId } = await params;
  if (!tripId || !UUID_REGEX.test(tripId)) {
    return {
      error: NextResponse.json({ error: "Invalid trip id" }, { status: 400 }),
    };
  }

  let tripQuery = admin.adminClient
    .from("trips")
    .select("id")
    .eq("id", tripId);

  if (!admin.isSuperAdmin) {
    tripQuery = tripQuery.eq("organization_id", admin.organizationId ?? "");
  }

  const { data: trip, error: tripError } = await tripQuery.maybeSingle();

  if (tripError || !trip) {
    return {
      error: NextResponse.json({ error: "Trip not found" }, { status: 404 }),
    };
  }

  return { admin, tripId };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    const access = await requireTripAdminAccess(req, params);
    if ("error" in access) {
      return access.error;
    }

    const { admin, tripId } = access;

    let proposalsQuery = admin.adminClient
      .from("proposals")
      .select("id")
      .eq("trip_id", tripId)
      .limit(100);

    if (!admin.isSuperAdmin) {
      proposalsQuery = proposalsQuery.eq("organization_id", admin.organizationId ?? "");
    }

    const { data: proposals, error: proposalsError } = await proposalsQuery;

    if (proposalsError) {
      console.error("Failed to fetch trip proposals:", proposalsError);
      return NextResponse.json(
        { error: "Failed to fetch proposals" },
        { status: 500 },
      );
    }

    if (!proposals || proposals.length === 0) {
      return NextResponse.json({ addOns: [] });
    }

    const proposalIds = proposals.map((p) => p.id);

    const { data: addOns, error } = await admin.adminClient
      .from("proposal_add_ons")
      .select(
        "id, proposal_id, name, category, unit_price, quantity, is_selected, description, image_url",
      )
      .in("proposal_id", proposalIds)
      .order("category", { ascending: true });

    if (error) {
      console.error("Failed to fetch trip add-ons:", error);
      return NextResponse.json(
        { error: "Failed to fetch add-ons" },
        { status: 500 },
      );
    }

    return NextResponse.json({ addOns: addOns || [] });
  } catch (error) {
    console.error("Trip add-ons error:", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Request failed"),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    const access = await requireTripAdminAccess(req, params);
    if ("error" in access) {
      return access.error;
    }

    const { admin, tripId } = access;

    const body = await req.json().catch(() => null);
    if (!body || typeof body.addOnId !== "string" || !UUID_REGEX.test(body.addOnId)) {
      return NextResponse.json(
        { error: "Missing or invalid addOnId" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity);
      if (!Number.isFinite(quantity) || quantity < 0) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
      updates.quantity = quantity;
    }

    if (body.unit_price !== undefined) {
      const unitPrice = Number(body.unit_price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: "Invalid unit_price" }, { status: 400 });
      }
      updates.unit_price = unitPrice;
    }

    if (body.is_selected !== undefined) {
      updates.is_selected = Boolean(body.is_selected);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const { data: addOnRow, error: addOnLookupError } = await admin.adminClient
      .from("proposal_add_ons")
      .select("id, proposal_id")
      .eq("id", body.addOnId)
      .maybeSingle();

    if (addOnLookupError || !addOnRow) {
      return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
    }

    let proposalScopeQuery = admin.adminClient
      .from("proposals")
      .select("id")
      .eq("id", addOnRow.proposal_id)
      .eq("trip_id", tripId);

    if (!admin.isSuperAdmin) {
      proposalScopeQuery = proposalScopeQuery.eq("organization_id", admin.organizationId ?? "");
    }

    const { data: scopedProposal, error: scopeError } = await proposalScopeQuery.maybeSingle();

    if (scopeError || !scopedProposal) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error } = await admin.adminClient
      .from("proposal_add_ons")
      .update(updates)
      .eq("id", body.addOnId)
      .eq("proposal_id", addOnRow.proposal_id)
      .select(
        "id, name, category, unit_price, quantity, is_selected, description, image_url",
      )
      .single();

    if (error) {
      console.error("Failed to update add-on:", error);
      return NextResponse.json(
        { error: "Failed to update add-on" },
        { status: 500 },
      );
    }

    return NextResponse.json({ addOn: updated });
  } catch (error) {
    console.error("Trip add-on update error:", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Request failed"),
      },
      { status: 500 },
    );
  }
}
