"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  buildMoMDriverCallouts,
  getLastMonthKeys,
  monthKeyFromDate,
  monthLabel,
  RANGE_TO_MONTHS,
  toNumber,
  type DashboardRange,
} from "@/lib/analytics/adapters";
import type {
  AnalyticsFilterOptions,
  AnalyticsFilterState,
  AnalyticsSnapshot,
  CommercialPaymentRow,
  InvoiceRow,
  ProfileRow,
  ProposalRow,
  TripRow,
} from "./types";
import { EMPTY_ANALYTICS_SNAPSHOT } from "./types";

interface AnalyticsRawState {
  proposals: ProposalRow[];
  trips: TripRow[];
  invoices: InvoiceRow[];
  commercialPayments: CommercialPaymentRow[];
  profiles: ProfileRow[];
  clientCount: number;
}

interface QueryResult<T> {
  data: T[] | null;
  error: { message?: string | null } | null;
}

const EMPTY_RAW_STATE: AnalyticsRawState = {
  proposals: [],
  trips: [],
  invoices: [],
  commercialPayments: [],
  profiles: [],
  clientCount: 0,
};

const DEFAULT_FILTERS: AnalyticsFilterState = {
  destination: "all",
  salesOwner: "all",
  sourceChannel: "all",
  range: "6m",
};

const APPROVED_STATUSES = new Set(["approved", "accepted", "confirmed", "converted"]);
const ACTIVE_TRIP_STATUSES = new Set(["planned", "confirmed", "in_progress", "active", "paid"]);
const PEAK_MONTHS = new Set([10, 11, 12, 1, 2]);

function extractDestination(value: TripRow["itineraries"]): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.destination ?? null;
  return value.destination ?? null;
}

function extractMonthNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getMonth() + 1;
}

function isColumnMissingError(message: string | null | undefined): boolean {
  if (!message) return false;
  return message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist");
}

function buildSnapshot(raw: AnalyticsRawState, filters: AnalyticsFilterState): AnalyticsSnapshot {
  const profileNameMap = new Map<string, string>();
  const sourceByClient = new Map<string, string>();
  const destinationByClient = new Map<string, string>();
  const tripDestinationById = new Map<string, string>();
  const tripClientById = new Map<string, string>();
  const proposalClientById = new Map<string, string>();

  for (const profile of raw.profiles) {
    if (profile.id) {
      profileNameMap.set(profile.id, profile.full_name || profile.id.slice(0, 8));
      if (profile.source_channel) sourceByClient.set(profile.id, profile.source_channel);
      if (profile.preferred_destination) destinationByClient.set(profile.id, profile.preferred_destination);
    }
  }

  for (const trip of raw.trips) {
    if (!trip.id) continue;
    const destination = extractDestination(trip.itineraries);
    if (destination) tripDestinationById.set(trip.id, destination);
    if (trip.client_id) tripClientById.set(trip.id, trip.client_id);
  }

  for (const proposal of raw.proposals) {
    if (proposal.id && proposal.client_id) {
      proposalClientById.set(proposal.id, proposal.client_id);
    }
  }

  const ownerByClient = new Map<string, string>();
  for (const proposal of raw.proposals) {
    if (proposal.client_id && proposal.created_by) {
      ownerByClient.set(proposal.client_id, proposal.created_by);
    }
  }

  const matchDestination = (
    rowDestination: string | null | undefined,
    clientId: string | null | undefined,
    tripId?: string | null,
  ) => {
    if (filters.destination === "all") return true;
    const byRow = rowDestination || null;
    const byTrip = tripId ? tripDestinationById.get(tripId) : null;
    const byClient = clientId ? destinationByClient.get(clientId) : null;
    return byRow === filters.destination || byTrip === filters.destination || byClient === filters.destination;
  };

  const matchSource = (clientId: string | null | undefined) => {
    if (filters.sourceChannel === "all") return true;
    if (!clientId) return false;
    return sourceByClient.get(clientId) === filters.sourceChannel;
  };

  const matchOwner = (ownerId: string | null | undefined, clientId?: string | null) => {
    if (filters.salesOwner === "all") return true;
    const candidate = ownerId || (clientId ? ownerByClient.get(clientId) : null) || null;
    return candidate === filters.salesOwner;
  };

  const filteredTrips = raw.trips.filter((trip) =>
    matchDestination(extractDestination(trip.itineraries), trip.client_id, trip.id) &&
    matchSource(trip.client_id) &&
    matchOwner(trip.owner_id, trip.client_id)
  );

  const filteredProposals = raw.proposals.filter((proposal) =>
    matchDestination(null, proposal.client_id) &&
    matchSource(proposal.client_id) &&
    matchOwner(proposal.created_by, proposal.client_id)
  );

  const filteredInvoices = raw.invoices.filter((invoice) =>
    matchDestination(null, invoice.client_id, invoice.trip_id) &&
    matchSource(invoice.client_id) &&
    matchOwner(null, invoice.client_id)
  );

  const filteredCommercialPayments = raw.commercialPayments.filter((payment) => {
    const resolvedClientId =
      (payment.trip_id ? tripClientById.get(payment.trip_id) : null) ||
      (payment.proposal_id ? proposalClientById.get(payment.proposal_id) : null) ||
      null;
    return (
      matchDestination(null, resolvedClientId, payment.trip_id) &&
      matchSource(resolvedClientId) &&
      matchOwner(null, resolvedClientId)
    );
  });
  const useCanonicalCash = filteredCommercialPayments.length > 0;

  const monthCount = RANGE_TO_MONTHS[filters.range as DashboardRange];
  const monthKeys = getLastMonthKeys(monthCount);
  const monthMap = new Map(
    monthKeys.map((key) => [
      key,
      {
        monthKey: key,
        label: monthLabel(key),
        revenue: 0,
        bookings: 0,
        proposalCount: 0,
        approvedCount: 0,
      },
    ])
  );

  for (const trip of filteredTrips) {
    const key = monthKeyFromDate(trip.created_at);
    if (!key || !monthMap.has(key)) continue;
    monthMap.get(key)!.bookings += 1;
  }

  let approvedCount = 0;
  let viewedCount = 0;
  const proposalStatusMap = new Map<string, number>();

  for (const proposal of filteredProposals) {
    const normalizedStatus = (proposal.status || "draft").toLowerCase();
    proposalStatusMap.set(normalizedStatus, (proposalStatusMap.get(normalizedStatus) || 0) + 1);
    if (APPROVED_STATUSES.has(normalizedStatus)) approvedCount += 1;
    if (proposal.viewed_at) viewedCount += 1;

    const key = monthKeyFromDate(proposal.created_at);
    if (!key || !monthMap.has(key)) continue;
    const monthData = monthMap.get(key)!;
    monthData.proposalCount += 1;
    if (APPROVED_STATUSES.has(normalizedStatus)) monthData.approvedCount += 1;
  }

  if (useCanonicalCash) {
    for (const payment of filteredCommercialPayments) {
      const normalizedStatus = (payment.status || "").toLowerCase();
      if (normalizedStatus !== "completed" && normalizedStatus !== "captured") continue;
      const key = monthKeyFromDate(payment.payment_date || payment.created_at);
      if (!key || !monthMap.has(key)) continue;
      monthMap.get(key)!.revenue += toNumber(payment.amount, 0);
    }
  } else {
    for (const invoice of filteredInvoices) {
      if ((invoice.status || "").toLowerCase() !== "paid") continue;
      const key = monthKeyFromDate(invoice.created_at);
      if (!key || !monthMap.has(key)) continue;
      monthMap.get(key)!.revenue += toNumber(invoice.total_amount, 0);
    }
  }

  const series = monthKeys.map((key) => {
    const row = monthMap.get(key)!;
    const conversionRate = row.proposalCount > 0 ? (row.approvedCount / row.proposalCount) * 100 : 0;
    return {
      monthKey: row.monthKey,
      label: row.label,
      revenue: row.revenue,
      bookings: row.bookings,
      conversionRate: Number(conversionRate.toFixed(1)),
    };
  });

  const destinationMap = new Map<string, { trips: number; revenue: number }>();
  let activeTrips = 0;
  for (const trip of filteredTrips) {
    const status = (trip.status || "").toLowerCase();
    if (ACTIVE_TRIP_STATUSES.has(status)) activeTrips += 1;

    const destination = extractDestination(trip.itineraries);
    if (!destination) continue;
    const existing = destinationMap.get(destination);
    if (existing) {
      existing.trips += 1;
    } else {
      destinationMap.set(destination, { trips: 1, revenue: 0 });
    }
  }

  const seasonalBreakdown = {
    peak: { months: "Oct — Feb", revenue: 0, bookings: 0, avgTrip: 0 },
    offSeason: { months: "Mar — Sep", revenue: 0, bookings: 0, avgTrip: 0 },
  };

  if (useCanonicalCash) {
    for (const payment of filteredCommercialPayments) {
      const normalizedStatus = (payment.status || "").toLowerCase();
      if (normalizedStatus !== "completed" && normalizedStatus !== "captured") continue;

      const amount = toNumber(payment.amount, 0);
      const monthNumber = extractMonthNumber(payment.payment_date || payment.created_at);
      const seasonKey = monthNumber && PEAK_MONTHS.has(monthNumber) ? "peak" : "offSeason";
      seasonalBreakdown[seasonKey].revenue += amount;

      const resolvedClientId =
        (payment.trip_id ? tripClientById.get(payment.trip_id) : null) ||
        (payment.proposal_id ? proposalClientById.get(payment.proposal_id) : null) ||
        null;
      const destination =
        (payment.trip_id ? tripDestinationById.get(payment.trip_id) : null) ||
        (resolvedClientId ? destinationByClient.get(resolvedClientId) : null) ||
        null;

      if (!destination) continue;
      const existing = destinationMap.get(destination);
      if (existing) {
        existing.revenue += amount;
      } else {
        destinationMap.set(destination, { trips: 0, revenue: amount });
      }
    }
  } else {
    for (const invoice of filteredInvoices) {
      if ((invoice.status || "").toLowerCase() !== "paid") continue;

      const amount = toNumber(invoice.total_amount, 0);
      const monthNumber = extractMonthNumber(invoice.created_at);
      const seasonKey = monthNumber && PEAK_MONTHS.has(monthNumber) ? "peak" : "offSeason";
      seasonalBreakdown[seasonKey].revenue += amount;

      const destination =
        (invoice.trip_id ? tripDestinationById.get(invoice.trip_id) : null) ||
        (invoice.client_id ? destinationByClient.get(invoice.client_id) : null) ||
        null;

      if (!destination) continue;
      const existing = destinationMap.get(destination);
      if (existing) {
        existing.revenue += amount;
      } else {
        destinationMap.set(destination, { trips: 0, revenue: amount });
      }
    }
  }

  for (const trip of filteredTrips) {
    const monthNumber = extractMonthNumber(trip.created_at);
    const seasonKey = monthNumber && PEAK_MONTHS.has(monthNumber) ? "peak" : "offSeason";
    seasonalBreakdown[seasonKey].bookings += 1;
  }

  const touchedClients = new Set<string>();
  for (const trip of filteredTrips) if (trip.client_id) touchedClients.add(trip.client_id);
  for (const proposal of filteredProposals) if (proposal.client_id) touchedClients.add(proposal.client_id);
  for (const invoice of filteredInvoices) if (invoice.client_id) touchedClients.add(invoice.client_id);
  for (const payment of filteredCommercialPayments) {
    const resolvedClientId =
      (payment.trip_id ? tripClientById.get(payment.trip_id) : null) ||
      (payment.proposal_id ? proposalClientById.get(payment.proposal_id) : null) ||
      null;
    if (resolvedClientId) touchedClients.add(resolvedClientId);
  }

  const activeClients =
    touchedClients.size > 0
      ? touchedClients.size
      : filters.destination === "all" && filters.salesOwner === "all" && filters.sourceChannel === "all"
        ? raw.clientCount
        : 0;

  const monthlyRevenueTotal = series.reduce((sum, row) => sum + row.revenue, 0);
  const proposalsTotal = filteredProposals.length;
  const proposalConversionRate = proposalsTotal > 0 ? (approvedCount / proposalsTotal) * 100 : 0;
  const viewedProposalRate = proposalsTotal > 0 ? (viewedCount / proposalsTotal) * 100 : 0;

  const destinationRank = Array.from(destinationMap.entries())
    .map(([name, data]) => ({ name, trips: data.trips, revenue: data.revenue }))
    .sort((a, b) => b.revenue - a.revenue || b.trips - a.trips)
    .slice(0, 6);

  seasonalBreakdown.peak.avgTrip =
    seasonalBreakdown.peak.bookings > 0 ? seasonalBreakdown.peak.revenue / seasonalBreakdown.peak.bookings : 0;
  seasonalBreakdown.offSeason.avgTrip =
    seasonalBreakdown.offSeason.bookings > 0
      ? seasonalBreakdown.offSeason.revenue / seasonalBreakdown.offSeason.bookings
      : 0;

  const proposalStatusBreakdown = Array.from(proposalStatusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const drivers = buildMoMDriverCallouts(
    series.map((point) => ({
      revenue: point.revenue,
      bookings: point.bookings,
      conversionRate: point.conversionRate,
    }))
  );

  // Top clients by revenue (dynamic, based on filtered invoices)
  const clientRevenueMap = new Map<string, { revenue: number; invoiceCount: number }>();
  if (useCanonicalCash) {
    for (const payment of filteredCommercialPayments) {
      const normalizedStatus = (payment.status || "").toLowerCase();
      if (normalizedStatus !== "completed" && normalizedStatus !== "captured") continue;
      const clientId =
        (payment.trip_id ? tripClientById.get(payment.trip_id) : null) ||
        (payment.proposal_id ? proposalClientById.get(payment.proposal_id) : null) ||
        null;
      if (!clientId) continue;
      const amount = toNumber(payment.amount, 0);
      const existing = clientRevenueMap.get(clientId);
      if (existing) {
        clientRevenueMap.set(clientId, {
          revenue: existing.revenue + amount,
          invoiceCount: existing.invoiceCount + 1,
        });
      } else {
        clientRevenueMap.set(clientId, { revenue: amount, invoiceCount: 1 });
      }
    }
  } else {
    for (const invoice of filteredInvoices) {
      if ((invoice.status || "").toLowerCase() !== "paid") continue;
      const clientId = invoice.client_id;
      if (!clientId) continue;
      const amount = toNumber(invoice.total_amount, 0);
      const existing = clientRevenueMap.get(clientId);
      if (existing) {
        clientRevenueMap.set(clientId, {
          revenue: existing.revenue + amount,
          invoiceCount: existing.invoiceCount + 1,
        });
      } else {
        clientRevenueMap.set(clientId, { revenue: amount, invoiceCount: 1 });
      }
    }
  }

  const clientTripMap = new Map<string, number>();
  for (const trip of filteredTrips) {
    if (!trip.client_id) continue;
    clientTripMap.set(trip.client_id, (clientTripMap.get(trip.client_id) || 0) + 1);
  }

  const topClients = Array.from(clientRevenueMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      name: profileNameMap.get(clientId) || `Client ${clientId.slice(0, 8)}`,
      revenue: data.revenue,
      trips: clientTripMap.get(clientId) || 0,
      invoiceCount: data.invoiceCount,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Tour operator metrics
  const totalPaidInvoices = filteredInvoices.filter((inv) => (inv.status || "").toLowerCase() === "paid").length;
  const totalAllInvoices = filteredInvoices.length;
  const paidCashEvents = filteredCommercialPayments.filter((payment) => {
    const normalizedStatus = (payment.status || "").toLowerCase();
    return normalizedStatus === "completed" || normalizedStatus === "captured";
  }).length;
  const collectionRate = useCanonicalCash
    ? filteredTrips.length > 0
      ? (paidCashEvents / filteredTrips.length) * 100
      : 0
    : totalAllInvoices > 0
      ? (totalPaidInvoices / totalAllInvoices) * 100
      : 0;
  const avgBookingValue = filteredTrips.length > 0 ? monthlyRevenueTotal / filteredTrips.length : 0;
  const totalPax = filteredTrips.length * 2; // estimate: avg 2 pax/trip; real data would come from trip.pax_count
  const revenuePerPax = totalPax > 0 ? monthlyRevenueTotal / totalPax : 0;

  return {
    monthlyRevenueTotal,
    proposalsTotal,
    proposalConversionRate,
    activeTrips,
    activeClients,
    viewedProposalRate,
    avgBookingValue,
    collectionRate,
    totalPax,
    revenuePerPax,
    series,
    destinationRank,
    seasonalBreakdown,
    proposalStatusBreakdown,
    drivers,
    topClients,
  };
}

export function useAdminAnalytics() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<AnalyticsRawState>(EMPTY_RAW_STATE);
  const [filters, setFilters] = useState<AnalyticsFilterState>(DEFAULT_FILTERS);

  const loadAnalytics = useCallback(
    async (showRefreshToast = false) => {
      setError(null);
      if (showRefreshToast) setRefreshing(true);
      else setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("Unauthorized access");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.organization_id) throw new Error("Unable to resolve organization");

        const orgId = profile.organization_id;

        let proposalsRes: QueryResult<ProposalRow> = (await supabase
          .from("proposals")
          .select("id,trip_id,status,total_price,created_at,viewed_at,created_by,client_id")
          .eq("organization_id", orgId)) as unknown as QueryResult<ProposalRow>;

        if (proposalsRes.error && isColumnMissingError(proposalsRes.error.message)) {
          proposalsRes = (await supabase
            .from("proposals")
            .select("id,trip_id,status,total_price,created_at,viewed_at")
            .eq("organization_id", orgId)) as unknown as QueryResult<ProposalRow>;
        }

        let tripsRes: QueryResult<TripRow> = (await supabase
          .from("trips")
          // owner_id was removed from the trips table; client_id is used as fallback by matchOwner
          .select("id,status,created_at,client_id,itineraries(destination)")
          .eq("organization_id", orgId)) as unknown as QueryResult<TripRow>;

        if (tripsRes.error && isColumnMissingError(tripsRes.error.message)) {
          tripsRes = (await supabase
            .from("trips")
            .select("id,status,created_at,itineraries(destination)")
            .eq("organization_id", orgId)) as unknown as QueryResult<TripRow>;
        }

        let invoicesRes: QueryResult<InvoiceRow> = (await supabase
          .from("invoices")
          .select("status,total_amount,created_at,client_id,trip_id")
          .eq("organization_id", orgId)) as unknown as QueryResult<InvoiceRow>;

        if (invoicesRes.error && isColumnMissingError(invoicesRes.error.message)) {
          invoicesRes = (await supabase
            .from("invoices")
            .select("status,total_amount,created_at,trip_id")
            .eq("organization_id", orgId)) as unknown as QueryResult<InvoiceRow>;
        }

        let commercialPaymentsRes: QueryResult<CommercialPaymentRow> = (await supabase
          .from("commercial_payments")
          .select("amount,payment_date,created_at,trip_id,proposal_id,invoice_id,status,source")
          .eq("organization_id", orgId)
          .is("deleted_at", null)) as unknown as QueryResult<CommercialPaymentRow>;

        if (commercialPaymentsRes.error && isColumnMissingError(commercialPaymentsRes.error.message)) {
          commercialPaymentsRes = {
            data: [],
            error: null,
          };
        }

        let profilesRes: QueryResult<ProfileRow> = (await supabase
          .from("profiles")
          .select("id,full_name,role,source_channel,preferred_destination")
          .eq("organization_id", orgId)) as unknown as QueryResult<ProfileRow>;

        if (profilesRes.error && isColumnMissingError(profilesRes.error.message)) {
          profilesRes = (await supabase
            .from("profiles")
            .select("id,full_name,role")
            .eq("organization_id", orgId)) as unknown as QueryResult<ProfileRow>;
        }

        const clientsRes = await supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId);

        if (proposalsRes.error) throw proposalsRes.error;
        if (tripsRes.error) throw tripsRes.error;
        if (invoicesRes.error) throw invoicesRes.error;
        if (commercialPaymentsRes.error) throw commercialPaymentsRes.error;
        if (profilesRes.error) throw profilesRes.error;
        if (clientsRes.error) throw clientsRes.error;

        setRaw({
          proposals: (proposalsRes.data || []) as ProposalRow[],
          trips: (tripsRes.data || []) as TripRow[],
          invoices: (invoicesRes.data || []) as InvoiceRow[],
          commercialPayments: (commercialPaymentsRes.data || []) as CommercialPaymentRow[],
          profiles: (profilesRes.data || []) as ProfileRow[],
          clientCount: Number(clientsRes.count || 0),
        });

        if (showRefreshToast) {
          toast({
            title: "Analytics refreshed",
            description: "Latest metrics and filters are updated.",
            variant: "success",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load analytics";
        setError(message);
        setRaw(EMPTY_RAW_STATE);
        toast({
          title: "Analytics load failed",
          description: message,
          variant: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, toast]
  );

  useEffect(() => {
    void loadAnalytics(false);
  }, [loadAnalytics]);

  const filterOptions = useMemo<AnalyticsFilterOptions>(() => {
    const destinationSet = new Set<string>();
    for (const trip of raw.trips) {
      const destination = extractDestination(trip.itineraries);
      if (destination) destinationSet.add(destination);
    }
    for (const profile of raw.profiles) {
      if (profile.preferred_destination) destinationSet.add(profile.preferred_destination);
    }

    const ownerSet = new Set<string>();
    for (const proposal of raw.proposals) {
      if (proposal.created_by) ownerSet.add(proposal.created_by);
    }
    for (const trip of raw.trips) {
      if (trip.owner_id) ownerSet.add(trip.owner_id);
    }

    const profileNameMap = new Map(raw.profiles.map((profile) => [profile.id, profile.full_name || profile.id.slice(0, 8)]));
    const salesOwners = Array.from(ownerSet)
      .map((id) => ({ id, label: profileNameMap.get(id) || `Owner ${id.slice(0, 8)}` }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const sourceSet = new Set<string>();
    for (const profile of raw.profiles) {
      if (profile.source_channel) sourceSet.add(profile.source_channel);
    }

    return {
      destinations: Array.from(destinationSet).sort((a, b) => a.localeCompare(b)),
      salesOwners,
      sourceChannels: Array.from(sourceSet).sort((a, b) => a.localeCompare(b)),
    };
  }, [raw]);

  const snapshot = useMemo<AnalyticsSnapshot>(() => {
    if (
      !raw.proposals.length &&
      !raw.trips.length &&
      !raw.invoices.length &&
      !raw.commercialPayments.length
    ) {
      return EMPTY_ANALYTICS_SNAPSHOT;
    }
    return buildSnapshot(raw, filters);
  }, [filters, raw]);

  const setFilter = useCallback(<K extends keyof AnalyticsFilterState>(key: K, value: AnalyticsFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    loading,
    refreshing,
    error,
    filters,
    filterOptions,
    snapshot,
    setFilter,
    reload: () => loadAnalytics(true),
  };
}
