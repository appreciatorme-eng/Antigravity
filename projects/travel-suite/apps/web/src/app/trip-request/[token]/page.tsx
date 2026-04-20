import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  buildTripRequestPdfUrl,
  loadTripRequestFormState,
} from "@/lib/whatsapp/trip-intake.server";

export const metadata: Metadata = {
  title: "Trip Request Form",
};

export default async function TripRequestFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const state = await loadTripRequestFormState(token);

  if (!state) {
    notFound();
  }

  const submitted = query.submitted === "1";
  const errorMessage = query.error ? decodeURIComponent(query.error) : null;
  const isCompleted = state.status === "completed";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff,_#ffffff_48%,_#eef2ff)] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">TripBuilt Assistant Form</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Complete the trip request</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Fill the missing trip details here. When you submit, TripBuilt will create the trip in Planner and Trips, then send the share link and PDF back to your WhatsApp assistant group.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {submitted || isCompleted ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            {isCompleted
              ? "Trip created. The assistant has sent the share link and PDF back to WhatsApp."
              : "Trip form saved."}
          </div>
        ) : null}

        {isCompleted ? (
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Ready to use</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {state.clientName || "Client"} · {state.destination || "Destination"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                The trip has already been created for this request.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={state.shareUrl || "#"}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Open share link
              </Link>
              <Link
                href={buildTripRequestPdfUrl(token)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900"
              >
                Download PDF
              </Link>
            </div>
          </section>
        ) : (
          <form action={`/api/trip-request-form/${token}`} method="post" className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Destination</span>
                <input name="destination" defaultValue={state.destination} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-400" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Duration (days)</span>
                <input name="duration_days" type="number" min={1} defaultValue={state.durationDays ?? ""} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Client name</span>
                <input name="client_name" defaultValue={state.clientName} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Client email</span>
                <input name="client_email" type="email" defaultValue={state.clientEmail} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Client phone</span>
                <input name="client_phone" defaultValue={state.clientPhone} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Travelers</span>
                <input name="traveler_count" type="number" min={1} defaultValue={state.travelerCount ?? ""} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Start date</span>
                <input name="start_date" type="date" defaultValue={state.startDate} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">End date</span>
                <input name="end_date" type="date" defaultValue={state.endDate} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Budget</span>
                <input name="budget" defaultValue={state.budget} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Hotel preference</span>
                <input name="hotel_preference" defaultValue={state.hotelPreference} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Interests</span>
                <input name="interests" defaultValue={state.interests} placeholder="beaches, shopping, family time" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Origin city / airport</span>
                <input name="origin_city" defaultValue={state.originCity} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400" />
              </label>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Submit creates the trip in Planner and Trips, then sends the share link and PDF back to WhatsApp.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create trip and send back to WhatsApp
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
