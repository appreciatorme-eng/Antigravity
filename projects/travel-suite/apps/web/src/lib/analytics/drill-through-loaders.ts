import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimeWindow } from "./adapters";

// ---------------------------------------------------------------------------
// Shared types for drill-through data
// ---------------------------------------------------------------------------

export interface DrillRow {
  id: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  status: string;
  dateLabel: string;
  href: string;
}

export interface DrillSummary {
  label: string;
  primaryValue: string;
  secondaryValue: string;
  windowLabel: string;
}

export interface DrillResult {
  summary: DrillSummary;
  rows: DrillRow[];
}

interface ItineraryLite {
  destination: string | null;
  trip_title: string | null;
}

interface InvoiceDrillRow {
  id: string;
  created_at: string | null;
  total_amount: number;
  status: string;
  invoice_number: string;
  trip_id?: string | null;
}

interface TripDrillRow {
  id: string;
  created_at: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  itineraries: ItineraryLite | ItineraryLite[] | null;
}

interface ProposalDrillRow {
  id: string;
  title: string;
  status: string | null;
  total_price: number | null;
  created_at: string | null;
  viewed_at: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getItinerary(value: TripDrillRow["itineraries"]): ItineraryLite | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Existing loaders (migrated from drill-through page.tsx)
// ---------------------------------------------------------------------------

export async function loadRevenueDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const invoiceRows = (data || []) as InvoiceDrillRow[];
  const paidRows = invoiceRows.filter((inv) => (inv.status || "").toLowerCase() === "paid");
  const total = paidRows.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return {
    summary: {
      label: "Paid invoice revenue",
      primaryValue: formatINR(total),
      secondaryValue: `${paidRows.length} paid invoice${paidRows.length === 1 ? "" : "s"}`,
      windowLabel: win.label,
    },
    rows: invoiceRows.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.invoice_number}`,
      subtitle: `Status: ${(inv.status || "pending").toUpperCase()}`,
      amountLabel: formatINR(Number(inv.total_amount || 0)),
      status: inv.status || "pending",
      dateLabel: formatDate(inv.created_at),
      href: "/admin/billing",
    })),
  };
}

export async function loadBookingsDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const tripRows = (data || []) as TripDrillRow[];

  return {
    summary: {
      label: "Trips created",
      primaryValue: `${tripRows.length}`,
      secondaryValue: "Bookings in selected window",
      windowLabel: win.label,
    },
    rows: tripRows.map((trip) => {
      const itin = getItinerary(trip.itineraries);
      return {
        id: trip.id,
        title: itin?.trip_title || itin?.destination || "Trip record",
        subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
        amountLabel: (trip.status || "draft").replace(/_/g, " "),
        status: trip.status || "draft",
        dateLabel: formatDate(trip.created_at),
        href: `/trips/${trip.id}`,
      };
    }),
  };
}

export async function loadConversionDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("proposals")
    .select("id, title, status, total_price, created_at, viewed_at")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const proposalRows = (data || []) as ProposalDrillRow[];
  const approvedCount = proposalRows.filter((p) =>
    ["approved", "accepted", "confirmed"].includes((p.status || "").toLowerCase())
  ).length;
  const conversionRate = proposalRows.length > 0 ? (approvedCount / proposalRows.length) * 100 : 0;

  return {
    summary: {
      label: "Proposal conversion",
      primaryValue: `${conversionRate.toFixed(1)}%`,
      secondaryValue: `${approvedCount}/${proposalRows.length} approved`,
      windowLabel: win.label,
    },
    rows: proposalRows.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.viewed_at ? "Viewed by client" : "Awaiting client view",
      amountLabel: formatINR(Number(p.total_price || 0)),
      status: p.status || "draft",
      dateLabel: formatDate(p.created_at),
      href: `/proposals/${p.id}`,
    })),
  };
}

export async function loadClientsDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
): Promise<DrillResult> {
  return loadConversionDrill(supabase, orgId, win);
}

// ---------------------------------------------------------------------------
// New loaders
// ---------------------------------------------------------------------------

export async function loadDestinationsDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
  destination?: string | null,
): Promise<DrillResult> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const tripRows = (data || []) as TripDrillRow[];
  const filtered = destination
    ? tripRows.filter((t) => getItinerary(t.itineraries)?.destination === destination)
    : tripRows;

  const destMap = new Map<string, number>();
  for (const trip of filtered) {
    const dest = getItinerary(trip.itineraries)?.destination || "Unknown";
    destMap.set(dest, (destMap.get(dest) || 0) + 1);
  }

  return {
    summary: {
      label: destination ? `Trips to ${destination}` : "All destinations",
      primaryValue: `${filtered.length}`,
      secondaryValue: `${destMap.size} unique destination${destMap.size === 1 ? "" : "s"}`,
      windowLabel: win.label,
    },
    rows: filtered.map((trip) => {
      const itin = getItinerary(trip.itineraries);
      return {
        id: trip.id,
        title: itin?.trip_title || itin?.destination || "Trip record",
        subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
        amountLabel: itin?.destination || "N/A",
        status: trip.status || "draft",
        dateLabel: formatDate(trip.created_at),
        href: `/trips/${trip.id}`,
      };
    }),
  };
}

export async function loadDestinationRevenueDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
  destination?: string | null,
): Promise<DrillResult> {
  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at, trip_id")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(200);

  if (invErr) throw invErr;

  let invoiceRows = (invoices || []) as InvoiceDrillRow[];

  if (destination) {
    const { data: trips } = await supabase
      .from("trips")
      .select("id, itineraries(destination)")
      .eq("organization_id", orgId);

    const tripDestMap = new Map<string, string>();
    for (const trip of (trips || []) as Array<{ id: string; itineraries: ItineraryLite | ItineraryLite[] | null }>) {
      const itin = Array.isArray(trip.itineraries) ? trip.itineraries[0] : trip.itineraries;
      if (itin?.destination) tripDestMap.set(trip.id, itin.destination);
    }

    invoiceRows = invoiceRows.filter((inv) => tripDestMap.get(inv.trip_id || "") === destination);
  }

  const paidTotal = invoiceRows
    .filter((inv) => (inv.status || "").toLowerCase() === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return {
    summary: {
      label: destination ? `Revenue from ${destination}` : "Revenue by all destinations",
      primaryValue: formatINR(paidTotal),
      secondaryValue: `${invoiceRows.length} invoice${invoiceRows.length === 1 ? "" : "s"}`,
      windowLabel: win.label,
    },
    rows: invoiceRows.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.invoice_number}`,
      subtitle: `Status: ${(inv.status || "pending").toUpperCase()}`,
      amountLabel: formatINR(Number(inv.total_amount || 0)),
      status: inv.status || "pending",
      dateLabel: formatDate(inv.created_at),
      href: "/admin/billing",
    })),
  };
}

export async function loadSeasonDrill(
  supabase: SupabaseClient,
  orgId: string,
  season: string | null,
): Promise<DrillResult> {
  const peakMonths = [10, 11, 12, 1, 2];
  const offMonths = [3, 4, 5, 6, 7, 8, 9];
  const targetMonths = season === "off" ? offMonths : peakMonths;

  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const allInvoices = (data || []) as InvoiceDrillRow[];
  const filtered = allInvoices.filter((inv) => {
    if (!inv.created_at) return false;
    const month = new Date(inv.created_at).getMonth() + 1;
    return targetMonths.includes(month);
  });

  const paidTotal = filtered
    .filter((inv) => (inv.status || "").toLowerCase() === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const seasonLabel = season === "off" ? "Off-Season (Mar — Sep)" : "Peak Season (Oct — Feb)";

  return {
    summary: {
      label: seasonLabel,
      primaryValue: formatINR(paidTotal),
      secondaryValue: `${filtered.length} invoice${filtered.length === 1 ? "" : "s"} in ${seasonLabel.toLowerCase()}`,
      windowLabel: "All time",
    },
    rows: filtered.map((inv) => ({
      id: inv.id,
      title: `Invoice ${inv.invoice_number}`,
      subtitle: `Status: ${(inv.status || "pending").toUpperCase()}`,
      amountLabel: formatINR(Number(inv.total_amount || 0)),
      status: inv.status || "pending",
      dateLabel: formatDate(inv.created_at),
      href: "/admin/billing",
    })),
  };
}

export async function loadPipelineDrill(
  supabase: SupabaseClient,
  orgId: string,
  win: TimeWindow,
  status?: string | null,
  statusGroup?: string | null,
): Promise<DrillResult> {
  let query = supabase
    .from("proposals")
    .select("id, title, status, total_price, created_at, viewed_at")
    .eq("organization_id", orgId)
    .gte("created_at", win.startISO)
    .lt("created_at", win.endISO)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rawProposalRows = (data || []) as ProposalDrillRow[];
  const proposalRows =
    statusGroup === "open"
      ? rawProposalRows.filter((proposal) =>
          ["draft", "sent", "viewed"].includes((proposal.status || "").toLowerCase()),
        )
      : rawProposalRows;
  const totalValue = proposalRows.reduce((sum, p) => sum + Number(p.total_price || 0), 0);
  const statusLabel =
    statusGroup === "open"
      ? "open pipeline"
      : status
        ? status.replace(/_/g, " ")
        : "all";

  return {
    summary: {
      label: `${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)} proposals`,
      primaryValue: statusGroup === "open" ? formatINR(totalValue) : `${proposalRows.length}`,
      secondaryValue:
        statusGroup === "open"
          ? `${proposalRows.length} proposal${proposalRows.length === 1 ? "" : "s"} in active pipeline`
          : `${formatINR(totalValue)} total value`,
      windowLabel: win.label,
    },
    rows: proposalRows.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.viewed_at ? "Viewed by client" : "Awaiting client view",
      amountLabel: formatINR(Number(p.total_price || 0)),
      status: p.status || "draft",
      dateLabel: formatDate(p.created_at),
      href: `/proposals/${p.id}`,
    })),
  };
}

export async function loadOperationsDrill(
  supabase: SupabaseClient,
  orgId: string,
  subtype: string | null,
): Promise<DrillResult> {
  if (subtype === "trips") {
    const { data, error } = await supabase
      .from("trips")
      .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
      .eq("organization_id", orgId)
      .in("status", ["planned", "confirmed", "in_progress", "active"])
      .order("start_date", { ascending: true })
      .limit(100);

    if (error) throw error;
    const tripRows = (data || []) as TripDrillRow[];

    return {
      summary: {
        label: "Ongoing trips",
        primaryValue: `${tripRows.length}`,
        secondaryValue: "Currently active trips",
        windowLabel: "Current",
      },
      rows: tripRows.map((trip) => {
        const itin = getItinerary(trip.itineraries);
        return {
          id: trip.id,
          title: itin?.trip_title || itin?.destination || "Trip",
          subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
          amountLabel: (trip.status || "active").replace(/_/g, " "),
          status: trip.status || "active",
          dateLabel: formatDate(trip.created_at),
          href: `/trips/${trip.id}`,
        };
      }),
    };
  }

  // Default: clients
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, created_at, status")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  const clientRows = (data || []) as Array<{ id: string; name: string; email: string; created_at: string; status: string }>;

  return {
    summary: {
      label: "Active clients",
      primaryValue: `${clientRows.length}`,
      secondaryValue: "All clients in organization",
      windowLabel: "Current",
    },
    rows: clientRows.map((c) => ({
      id: c.id,
      title: c.name || c.email || "Client",
      subtitle: c.email || "",
      amountLabel: (c.status || "active").replace(/_/g, " "),
      status: c.status || "active",
      dateLabel: formatDate(c.created_at),
      href: `/clients/${c.id}`,
    })),
  };
}
