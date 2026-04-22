import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileDown,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import {
  getOperatorTripRequestForOrganization,
  type OperatorTripRequestListItem,
} from "@/lib/whatsapp/trip-intake.server";
import { cn } from "@/lib/utils";
import { TripRequestDetailActions } from "./TripRequestDetailActions";
import { TripRequestDetailTimeline } from "./TripRequestDetailTimeline";
import { buildOperatorRequestSummary } from "../request-summary";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function stageClasses(stage: OperatorTripRequestListItem["stage"]): string {
  switch (stage) {
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "processing":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "submitted":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
    default:
      return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  }
}

function getDeliveryBadges(item: OperatorTripRequestListItem): Array<{ label: string; tone: string }> {
  const badges: Array<{ label: string; tone: string }> = [];

  if (item.stage === "draft" || item.stage === "submitted") {
    badges.push({
      label: "Waiting for traveller details",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (item.stage === "processing") {
    badges.push({
      label: "Generation running",
      tone: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    });
  }

  if (item.generationError) {
    badges.push({
      label: "Generation failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.operatorDeliveryError) {
    badges.push({
      label: "Operator send failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.clientDeliveryError) {
    badges.push({
      label: "Traveller send failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.stage === "completed" && !item.operatorNotified) {
    badges.push({
      label: "Operator send pending",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (item.stage === "completed" && item.clientPhone && !item.clientNotified) {
    badges.push({
      label: "Client send pending",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (item.stage === "completed" && !item.clientPhone) {
    badges.push({
      label: "No traveller phone",
      tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    });
  }

  if (item.lastItineraryRegeneratedAt) {
    badges.push({
      label: "Regenerated",
      tone: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    });
  }

  return badges;
}

export default async function TripRequestDetailPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const supabase = await createClient();

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    logError("[trip-requests/detail] failed to resolve user", error);
  }

  if (!user) {
    redirect("/auth");
  }

  let organizationId: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id || !["admin", "super_admin"].includes(profile.role ?? "")) {
      redirect("/dashboard");
    }

    organizationId = profile.organization_id;
  } catch (error) {
    logError("[trip-requests/detail] failed to resolve profile", error);
    redirect("/dashboard");
  }

  const { id } = await params;
  if (!id || !organizationId) {
    notFound();
  }

  const request = await getOperatorTripRequestForOrganization(organizationId, id);
  if (!request) {
    notFound();
  }

  const summary = buildOperatorRequestSummary(request);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-8">
          <div className="max-w-3xl space-y-3">
            <Link
              href="/trip-requests"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Trip Requests
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", stageClasses(request.stage))}>
                {request.stageLabel}
              </span>
              {getDeliveryBadges(request).map((badge) => (
                <span
                  key={badge.label}
                  className={cn("rounded-full border px-3 py-1 text-xs font-semibold", badge.tone)}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                {request.clientName || "Unnamed traveller"}
                {request.destination ? ` • ${request.destination}` : ""}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {request.requestSummary || "Trip request submitted through the magic-link intake flow."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/trip-requests"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Send className="h-4 w-4" />
              Back to actions
            </Link>
            {request.createdTripId ? (
              <Link
                href={`/trips/${request.createdTripId}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <ArrowUpRight className="h-4 w-4" />
                Open trip
              </Link>
            ) : null}
            {request.createdShareUrl ? (
              <a
                href={request.createdShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <ArrowUpRight className="h-4 w-4" />
                View itinerary
              </a>
            ) : null}
            {request.pdfUrl ? (
              <a
                href={request.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <FileDown className="h-4 w-4" />
                Open PDF
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Submitted</div>
          <div className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(request.submittedAt)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Updated</div>
          <div className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(request.updatedAt)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Traveller progress</div>
          <div className="mt-2 text-sm font-semibold text-foreground">{summary.travellerProgress}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Next step</div>
          <div className="mt-2 text-sm font-semibold text-foreground">{summary.nextStep}</div>
        </div>
      </section>

      <TripRequestDetailActions request={request} />

      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Traveller brief</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Traveller name</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.clientName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">WhatsApp</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.clientPhone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.clientEmail || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Travellers</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.travelerCount ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Destination</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.destination || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Duration</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.durationDays ? `${request.durationDays} days` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Travel window</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {request.startDate && request.endDate
                    ? `${request.startDate} to ${request.endDate}`
                    : request.travelWindow || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Origin</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.originCity || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Budget</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.budget || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Hotel preference</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{request.hotelPreference || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Interests</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {request.interests.length > 0 ? request.interests.join(", ") : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <TripRequestDetailTimeline request={request} />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Operator summary</h2>
            <dl className="mt-4 grid gap-4">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">How this started</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{summary.intakeSource}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Traveller progress</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{summary.travellerProgress}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recommended next step</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{summary.nextStep}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Keep the actions below for follow-through. Internal record ids are hidden here to keep the page readable for operators.
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Delivery log</h2>
            <div className="mt-4 space-y-3 text-sm text-foreground">
              <div>Completed package: {formatDateTime(request.completionDeliveredAt)}</div>
              <div>Operator resend: {formatDateTime(request.lastOperatorResentAt)}</div>
              <div>Traveller resend: {formatDateTime(request.lastClientResentAt)}</div>
              <div>Last regenerated: {formatDateTime(request.lastItineraryRegeneratedAt)}</div>
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-sky-500" />
                Operator notified: {request.operatorNotified ? "Yes" : "No"}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Traveller notified: {request.clientNotified ? "Yes" : "No"}
              </div>
              {request.generationError ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
                  Generation error: {request.generationError}
                </div>
              ) : null}
              {request.operatorDeliveryError ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
                  Operator delivery error: {request.operatorDeliveryError}
                </div>
              ) : null}
              {request.clientDeliveryError ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
                  Traveller delivery error: {request.clientDeliveryError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
