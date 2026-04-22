import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { buildTripRequestStatusUrl, loadTripRequestFormState } from "@/lib/whatsapp/trip-intake.server";

import { TripRequestIntakeForm } from "./TripRequestIntakeForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const state = await loadTripRequestFormState(token);

  if (!state) {
    return {
      title: "Trip request",
    };
  }

  return {
    title: `${state.organizationName} trip request`,
    description:
      state.organizationDescription ||
      `Complete your travel brief for ${state.organizationName}.`,
  };
}

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

  if (state.status !== "draft") {
    return (
      <main className="min-h-[100dvh] bg-[#ede7df] px-4 py-6 text-stone-950 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-black/5 bg-[#f7f2ea] shadow-[0_40px_100px_-48px_rgba(28,25,23,0.38)]">
          <section className="border-b border-black/5 bg-[#171310] px-6 py-8 text-stone-100 sm:px-8 sm:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-300">
              <ShieldCheck className="h-4 w-4" />
              Form already used
            </div>
            <h1 className="mt-5 text-[2rem] font-semibold tracking-tight sm:text-[2.6rem]">
              This trip brief has already been submitted
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
              The intake form for {state.organizationName} is now locked to prevent duplicate submissions. You can still open the read-only trip status page below.
            </p>
          </section>

          <section className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="rounded-[24px] border border-black/5 bg-white p-5 sm:p-6">
              <p className="text-sm leading-7 text-stone-600">
                Use the status page to track whether the itinerary is still being prepared or to open the final share link and PDF once everything is ready.
              </p>
              <div className="mt-5">
                <Link
                  href={buildTripRequestStatusUrl(token)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white"
                >
                  Open trip status
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <TripRequestIntakeForm
      token={token}
      state={state}
      submitted={query.submitted === "1"}
      errorMessage={query.error ? decodeURIComponent(query.error) : null}
    />
  );
}
