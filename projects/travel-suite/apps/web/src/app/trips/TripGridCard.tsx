"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    ArrowUpRight,
    Briefcase,
    Calendar,
    Check,
    Clock3,
    Copy,
    FileText,
    Hotel,
    Loader2,
    MapPin,
    ShieldCheck,
    Trash2,
    User,
    Wallet,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatINRShort } from "@/lib/india/formats";
import type { EnrichedTrip, ReadinessLevel } from "./types";
import {
    computeReadiness,
    departureUrgencyBg,
    departureUrgencyColor,
    deriveCommercialStage,
    formatDate,
    formatDepartureCountdown,
    formatDurationLabel,
    formatRelativeTime,
    getStatusStyles,
    hasTripClientActivity,
    paymentBadgeLabel,
    readinessLabel,
} from "./utils";

interface TripGridCardProps {
    trip: EnrichedTrip;
    onDelete?: (tripId: string) => void;
    deleting?: boolean;
}

const COMMERCIAL_LABELS = {
    draft: "Draft",
    shared: "Shared",
    viewed: "Viewed",
    approved: "Approved",
    won: "Won",
} as const;

const COMMERCIAL_STEPS = ["draft", "shared", "viewed", "approved", "won"] as const;

const COMMERCIAL_COLORS = {
    draft: "text-slate-300",
    shared: "text-sky-300",
    viewed: "text-violet-300",
    approved: "text-emerald-300",
    won: "text-emerald-300",
} as const;

function readinessTone(level: ReadinessLevel) {
    switch (level) {
        case "green":
            return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
        case "amber":
            return "border-amber-500/30 bg-amber-500/10 text-amber-200";
        case "red":
            return "border-rose-500/30 bg-rose-500/10 text-rose-200";
        default:
            return "border-white/10 bg-white/5 text-slate-400";
    }
}

function PipelineRail({ stage }: { stage: keyof typeof COMMERCIAL_LABELS }) {
    const activeIndex = COMMERCIAL_STEPS.indexOf(stage);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5">
                {COMMERCIAL_STEPS.map((step, index) => (
                    <span
                        key={step}
                        className={cn(
                            "h-1.5 rounded-full transition-all",
                            index <= activeIndex ? "bg-emerald-400" : "bg-white/10",
                            index === activeIndex ? "w-6" : "w-3"
                        )}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/38">
                {COMMERCIAL_STEPS.map((step, index) => (
                    <span
                        key={step}
                        className={cn(
                            "truncate transition-colors",
                            index <= activeIndex ? COMMERCIAL_COLORS[step] : "text-white/28"
                        )}
                    >
                        {COMMERCIAL_LABELS[step]}
                    </span>
                ))}
            </div>
        </div>
    );
}

function ReadinessPill({
    label,
    value,
    icon,
}: {
    label: string;
    value: ReadinessLevel;
    icon: ReactNode;
}) {
    return (
        <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5", readinessTone(value))}>
            <span className="shrink-0">{icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</span>
            <span className="text-[10px] opacity-80">{readinessLabel(value)}</span>
        </div>
    );
}

export function TripGridCard({ trip, onDelete, deleting = false }: TripGridCardProps) {
    const { toast } = useToast();
    const [copiedPortal, setCopiedPortal] = useState(false);
    const readiness = computeReadiness(trip);
    const tripStatus = getStatusStyles(trip.status || "");
    const countdown = formatDepartureCountdown(trip.days_until_departure);
    const commercialStage = deriveCommercialStage(trip);
    const clientActivity = hasTripClientActivity(trip);
    const amountLabel = trip.invoice?.total_amount
        ? formatINRShort(trip.invoice.total_amount)
        : "Pricing pending";
    const balanceLabel = trip.invoice?.balance_amount
        ? formatINRShort(trip.invoice.balance_amount)
        : null;
    const durationLabel = formatDurationLabel(trip.itineraries?.duration_days);
    const clientLabel = trip.profiles?.full_name || "Walk-in client";
    const heroImage = useMemo(() => trip.hero_image || "", [trip.hero_image]);
    const canCreateProposal = Boolean(trip.itinerary_id && trip.client_id && !trip.proposal_id);

    const copyClientPortal = async () => {
        if (!trip.proposal_share_token) return;
        try {
            const url = `${window.location.origin}/p/${trip.proposal_share_token}`;
            await navigator.clipboard.writeText(url);
            setCopiedPortal(true);
            toast({ title: "Client portal copied", variant: "success" });
            window.setTimeout(() => setCopiedPortal(false), 1800);
        } catch {
            toast({ title: "Copy failed", description: "Unable to copy the client portal link right now.", variant: "error" });
        }
    };

    return (
        <article className="group overflow-hidden rounded-[28px] border border-slate-200/70 bg-[#0b1220] text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-30px_rgba(15,23,42,0.55)]">
            <div className="relative h-52 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.035]"
                    style={{ backgroundImage: `url("${heroImage}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-slate-950/30 to-slate-950/88" />

                <div className="relative flex h-full flex-col justify-between p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] backdrop-blur-sm", tripStatus.color)}>
                                {tripStatus.label}
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
                                {durationLabel}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {onDelete ? (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onDelete(trip.id);
                                    }}
                                    disabled={deleting}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/45 text-white/75 backdrop-blur-md transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={`Delete trip ${trip.itineraries?.trip_title || trip.destination || trip.id}`}
                                    title="Delete trip"
                                >
                                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            ) : null}
                            {trip.days_until_departure !== null ? (
                                <span className={cn(
                                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                                    departureUrgencyColor(trip.days_until_departure),
                                    departureUrgencyBg(trip.days_until_departure)
                                )}>
                                    {countdown}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/70">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{trip.destination || trip.itineraries?.destination || "Destination pending"}</span>
                        </div>
                        <div>
                            <h3 className="max-w-[90%] text-2xl font-semibold leading-tight tracking-tight text-white">
                                {trip.itineraries?.trip_title || trip.destination || "Untitled trip"}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-white/65">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>{formatDate(trip.start_date || "")}</span>
                                {trip.end_date ? <span className="text-white/35">to</span> : null}
                                {trip.end_date ? <span>{formatDate(trip.end_date)}</span> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-5 px-5 pb-5 pt-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                            <span>Commercial</span>
                            <span className={COMMERCIAL_COLORS[commercialStage]}>{COMMERCIAL_LABELS[commercialStage]}</span>
                        </div>
                        <PipelineRail stage={commercialStage} />
                        {clientActivity ? (
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-300">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
                                </span>
                                Client activity needs review
                            </div>
                        ) : (
                            <div className="text-[11px] font-medium text-white/45">
                                {trip.proposal_title || (trip.proposal_status ? `Proposal ${trip.proposal_status}` : "Commercial timeline is clear")}
                            </div>
                        )}
                        <div className="text-[11px] font-medium text-white/55" title={trip.viewed_at ? new Date(trip.viewed_at).toLocaleString("en-US") : undefined}>
                            {trip.viewed_at ? `Last viewed ${formatRelativeTime(trip.viewed_at)}` : "Last viewed never"}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Trip value</div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight text-white">{amountLabel}</div>
                        <div className="mt-1 text-[11px] font-medium text-white/50">
                            {trip.invoice?.payment_status === "none"
                                ? "No invoice linked"
                                : paymentBadgeLabel(trip.invoice.payment_status)}
                            {balanceLabel ? ` · ${balanceLabel} due` : ""}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <ReadinessPill
                        label="Driver"
                        value={readiness.driver}
                        icon={<Briefcase className="h-3.5 w-3.5" />}
                    />
                    <ReadinessPill
                        label="Stay"
                        value={readiness.accommodation}
                        icon={<Hotel className="h-3.5 w-3.5" />}
                    />
                    <ReadinessPill
                        label="Payment"
                        value={readiness.payment}
                        icon={<Wallet className="h-3.5 w-3.5" />}
                    />
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                                <User className="h-3.5 w-3.5" />
                                Client
                            </div>
                            <div className="mt-1 truncate text-sm font-semibold text-white">{clientLabel}</div>
                            <div className="mt-1 text-[11px] text-white/45">
                                {formatRelativeTime(trip.created_at)}
                                {trip.viewed_at ? ` · Viewed ${formatRelativeTime(trip.viewed_at)}` : ""}
                            </div>
                        </div>
                        <Link
                            href={`/trips/${trip.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/12 px-4 py-2 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                        >
                            Open trip
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {trip.proposal_id ? (
                            <Link
                                href={`/proposals/${trip.proposal_id}`}
                                className="flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-3 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-500/18"
                            >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate">{trip.proposal_status ? `Proposal ${trip.proposal_status}` : "Open proposal"}</span>
                            </Link>
                        ) : canCreateProposal ? (
                            <Link
                                href={`/proposals/create?clientId=${encodeURIComponent(trip.client_id || "")}&title=${encodeURIComponent(trip.itineraries?.trip_title || trip.destination || "")}&itineraryId=${encodeURIComponent(trip.itinerary_id || "")}`}
                                className="flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-3 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-500/18"
                            >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span>Create proposal</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/40">
                                <FileText className="h-4 w-4 shrink-0" />
                                <span>Proposal not ready</span>
                            </div>
                        )}

                        {trip.proposal_share_token ? (
                            <button
                                type="button"
                                onClick={copyClientPortal}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-3 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/18"
                            >
                                <span className="flex items-center gap-2">
                                    {copiedPortal ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
                                    {copiedPortal ? "Portal copied" : "Client portal"}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                            </button>
                        ) : trip.share_code ? (
                            <Link
                                href={`/share/${trip.share_code}`}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
                            >
                                <span className="truncate">Preview share</span>
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/40">
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                <span>No share touchpoint yet</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between px-1 text-[11px] font-medium text-white/45">
                    <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5" />
                        Ref #{trip.id.slice(0, 8)}
                    </span>
                    <span>{trip.invoice?.payment_status === "none" ? "Commercial setup pending" : "Ops and commercial tracking live"}</span>
                </div>
            </div>
        </article>
    );
}
