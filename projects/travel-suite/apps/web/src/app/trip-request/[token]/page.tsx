import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadTripRequestFormState } from "@/lib/whatsapp/trip-intake.server";

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

  return (
    <TripRequestIntakeForm
      token={token}
      state={state}
      submitted={query.submitted === "1"}
      errorMessage={query.error ? decodeURIComponent(query.error) : null}
    />
  );
}
