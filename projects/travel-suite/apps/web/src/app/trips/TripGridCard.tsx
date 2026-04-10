"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowUpRight,
    Briefcase,
    Calendar,
    CalendarHeart,
    Check,
    Clock3,
    Download,
    Hotel,
    Link2,
    Loader2,
    MapPin,
    ShieldCheck,
    Trash2,
    User,
    Wallet,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { authedFetch } from "@/lib/api/authed-fetch";
import { cn } from "@/lib/utils";
import { formatINRShort } from "@/lib/india/formats";
import { buildSharePaymentSummaryLabel } from "@/lib/share/payment-config";
import { getDeterministicFallback } from "@/lib/image-search";
import { downloadItineraryPdf } from "@/components/pdf/itinerary-pdf";
import { normalizeItineraryTemplateId } from "@/components/pdf/itinerary-types";
import type { ItineraryPrintAddOn, ItineraryPrintExtras } from "@/components/pdf/itinerary-types";
import type { ItineraryResult } from "@/types/itinerary";
import type { TripDetailPayload, TripItineraryRawData } from "@/features/trip-detail/types";
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

interface TripAddOnResponse {
    addOns?: Array<ItineraryPrintAddOn & {
        image_url?: string | null;
        imageUrl?: string | null;
        is_selected?: boolean | null;
        unit_price?: number | null;
    }>;
}

const sanitizePdfFileName = (value: string) =>
    value.replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/^_+|_+$/g, "") || "itinerary";

const formatDuration = (minutes?: number | null) => {
    if (!minutes || !Number.isFinite(minutes)) return undefined;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const buildPdfItinerary = (payload: TripDetailPayload): ItineraryResult | null => {
    const trip = payload.trip;
    const itinerary = trip.itineraries;
    const rawData = itinerary?.raw_data;
    if (!itinerary || !rawData) return null;

    const normalizedRaw = rawData as TripItineraryRawData & {
        logistics?: ItineraryResult["logistics"];
    };

    return {
        trip_title: normalizedRaw.trip_title || itinerary.trip_title || trip.destination || "Trip itinerary",
        destination: normalizedRaw.destination || itinerary.destination || trip.destination || "Destination",
        duration_days: normalizedRaw.duration_days || itinerary.duration_days || normalizedRaw.days?.length || 1,
        start_date: trip.start_date || undefined,
        end_date: trip.end_date || undefined,
        summary: normalizedRaw.summary || "Detailed itinerary enclosed.",
        days: (normalizedRaw.days || []).map((day) => ({
            day_number: day.day_number,
            theme: day.theme || day.title || `Day ${day.day_number}`,
            title: day.title,
            summary: day.summary,
            activities: (day.activities || []).map((activity) => ({
                time: activity.start_time || "",
                title: activity.title || "Scheduled stop",
                description: activity.description || "",
                location: activity.location || "",
                coordinates: activity.coordinates,
                duration: formatDuration(activity.duration_minutes),
                cost: activity.cost,
                transport: activity.transport,
                image: activity.image,
                imageUrl: activity.imageUrl,
                image_source: activity.image_source,
                image_confidence: activity.image_confidence,
                image_query: activity.image_query,
                image_entity_id: activity.image_entity_id,
            })),
        })),
        budget: normalizedRaw.budget,
        interests: normalizedRaw.interests || [],
        tips: normalizedRaw.tips || [],
        inclusions: normalizedRaw.inclusions || [],
        exclusions: normalizedRaw.exclusions || [],
        extracted_pricing: normalizedRaw.pricing,
        logistics: normalizedRaw.logistics || {
            flights: (normalizedRaw.flights || []).map((flight, index) => ({
                id: `${itinerary.id}-flight-${index}`,
                airline: flight.airline,
                flight_number: flight.flight_number,
                departure_airport: flight.departure_city,
                arrival_airport: flight.arrival_city,
                departure_time: flight.departure_time,
                arrival_time: flight.arrival_time,
                confirmation: flight.booking_reference || flight.pnr || undefined,
                source: "manual",
            })),
        },
    };
};

const buildPrintExtras = (
    payload: TripDetailPayload,
    addOns: TripAddOnResponse["addOns"] = [],
): ItineraryPrintExtras => {
    const dayAccommodations = Object.values(payload.accommodations || {})
        .filter((accommodation) => accommodation?.day_number && accommodation.hotel_name)
        .map((accommodation) => ({
            dayNumber: accommodation.day_number,
            hotelName: accommodation.hotel_name,
            roomType: accommodation.address || null,
            amenities: [
                accommodation.check_in_time ? `Check-in ${accommodation.check_in_time}` : null,
                accommodation.contact_phone ? `Contact ${accommodation.contact_phone}` : null,
            ].filter((item): item is string => Boolean(item)),
        }));

    const selectedAddOns = (addOns || [])
        .filter((addOn) => addOn.is_selected !== false)
        .map((addOn) => ({
            name: addOn.name,
            category: addOn.category,
            description: addOn.description,
            unitPrice: addOn.unitPrice ?? addOn.unit_price ?? null,
            quantity: addOn.quantity,
            imageUrl: addOn.imageUrl || addOn.image_url || null,
        }));

    return { dayAccommodations, selectedAddOns };
};

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
    const router = useRouter();
    const { toast } = useToast();
    const [copiedShare, setCopiedShare] = useState(false);
    const [heroImageSrc, setHeroImageSrc] = useState("");
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const readiness = computeReadiness(trip);
    const tripStatus = getStatusStyles(trip.status || "");
    const countdown = formatDepartureCountdown(trip.days_until_departure);
    const commercialStage = deriveCommercialStage(trip);
    const clientActivity = hasTripClientActivity(trip);
    const paymentSummaryLabel = buildSharePaymentSummaryLabel(trip.share_payment_summary ?? null);
    const amountLabel = trip.invoice?.total_amount
        ? formatINRShort(trip.invoice.total_amount)
        : "Pricing pending";
    const balanceLabel = trip.invoice?.balance_amount
        ? formatINRShort(trip.invoice.balance_amount)
        : null;
    const durationLabel = formatDurationLabel(trip.itineraries?.duration_days);
    const clientLabel = trip.profiles?.full_name || "Walk-in client";
    const fallbackHeroImage = useMemo(
        () => getDeterministicFallback(trip.destination || trip.itineraries?.destination || "travel"),
        [trip.destination, trip.itineraries?.destination],
    );
    const heroImage = useMemo(
        () => trip.hero_image?.trim() || fallbackHeroImage,
        [trip.hero_image, fallbackHeroImage],
    );
    const displayHeroImage = heroImageSrc || heroImage;

    const copyShareLink = async () => {
        if (!trip.share_code) return;
        try {
            const url = `${window.location.origin}/share/${trip.share_code}`;
            await navigator.clipboard.writeText(url);
            setCopiedShare(true);
            toast({ title: "Client share link copied", variant: "success" });
            window.setTimeout(() => setCopiedShare(false), 1800);
        } catch {
            toast({ title: "Copy failed", description: "Unable to copy the client share link right now.", variant: "error" });
        }
    };

    const handleDownloadPdf = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (downloadingPdf) return;

        if (!trip.itinerary_id && !trip.itineraries?.id) {
            toast({
                title: "PDF unavailable",
                description: "This trip does not have an itinerary attached yet.",
                variant: "error",
            });
            return;
        }

        setDownloadingPdf(true);
        try {
            const [tripResponse, addOnsResult] = await Promise.all([
                authedFetch(`/api/trips/${trip.id}`),
                authedFetch(`/api/trips/${trip.id}/add-ons`)
                    .then((response) => (response.ok ? response.json() as Promise<TripAddOnResponse> : { addOns: [] }))
                    .catch(() => ({ addOns: [] })),
            ]);

            if (!tripResponse.ok) {
                throw new Error("Could not fetch trip itinerary data.");
            }

            const tripPayload = await tripResponse.json() as TripDetailPayload;
            const itinerary = buildPdfItinerary(tripPayload);
            if (!itinerary) {
                throw new Error("This trip does not have a printable itinerary yet.");
            }

            const template = normalizeItineraryTemplateId(tripPayload.trip.itineraries?.template_id);
            await downloadItineraryPdf({
                itinerary,
                template,
                branding: tripPayload.trip.profiles?.full_name
                    ? { clientName: tripPayload.trip.profiles.full_name }
                    : undefined,
                printExtras: buildPrintExtras(tripPayload, addOnsResult.addOns),
                fileName: `${sanitizePdfFileName(itinerary.trip_title)}_Itinerary.pdf`,
            });

            toast({
                title: "PDF download started",
                description: "The itinerary PDF uses the same renderer as the planner export.",
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "PDF generation failed",
                description: error instanceof Error ? error.message : "Unable to generate the PDF right now.",
                variant: "error",
            });
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <article
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/trips/${trip.id}`)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/trips/${trip.id}`);
                }
            }}
            className="group cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/70 bg-[#0b1220] text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-30px_rgba(15,23,42,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label={`Open trip ${trip.itineraries?.trip_title || trip.destination || trip.id}`}
        >
            <div className="relative h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={displayHeroImage}
                    alt={trip.itineraries?.trip_title || trip.destination || "Trip cover"}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    onError={(event) => {
                        if (event.currentTarget.src === fallbackHeroImage || event.currentTarget.src.endsWith(fallbackHeroImage)) {
                            return;
                        }
                        setHeroImageSrc(fallbackHeroImage);
                    }}
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
                        {trip.holiday_summary ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 bg-rose-500/15 px-2.5 py-1 text-[10px] font-semibold text-rose-100">
                                <CalendarHeart className="h-3 w-3" />
                                Overlaps {trip.holiday_summary.holidayName}
                            </div>
                        ) : null}
                    </div>
                </div>
                </div>
            </div>

            <div className="space-y-5 px-5 pb-5 pt-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                            <span>Tracker</span>
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
                                {trip.share_code ? "Client share is active" : "Client share not sent yet"}
                            </div>
                        )}
                        <div className="text-[11px] font-medium text-white/55" title={trip.viewed_at ? new Date(trip.viewed_at).toLocaleString("en-US") : undefined}>
                            {trip.viewed_at ? `Last viewed ${formatRelativeTime(trip.viewed_at)}` : "Last viewed never"}
                        </div>
                        {paymentSummaryLabel ? (
                            <div className="text-[11px] font-medium text-white/55">
                                {paymentSummaryLabel}
                            </div>
                        ) : null}
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
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/12 px-4 py-2 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Download PDF for ${trip.itineraries?.trip_title || trip.destination || trip.id}`}
                        >
                            {downloadingPdf ? "Preparing PDF" : "Download PDF"}
                            {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {trip.share_code ? (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void copyShareLink();
                                }}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-3 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/18"
                            >
                                <span className="flex items-center gap-2">
                                    {copiedShare ? <Check className="h-4 w-4 shrink-0" /> : <Link2 className="h-4 w-4 shrink-0" />}
                                    {copiedShare ? "Link copied" : "Client share link"}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/40">
                                <Link2 className="h-4 w-4 shrink-0" />
                                <span>No client share link yet</span>
                            </div>
                        )}

                        {trip.share_code ? (
                            <Link
                                href={`/share/${trip.share_code}`}
                                onClick={(event) => event.stopPropagation()}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
                            >
                                <span className="truncate">Open share preview</span>
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-white/40">
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                <span>Waiting for operator share</span>
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
