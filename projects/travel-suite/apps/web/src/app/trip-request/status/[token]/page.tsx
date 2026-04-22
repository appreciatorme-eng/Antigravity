import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadTripRequestFormState } from "@/lib/whatsapp/trip-intake.server";

import { TripRequestIntakeForm } from "@/app/trip-request/[token]/TripRequestIntakeForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const state = await loadTripRequestFormState(token);

  if (!state) {
    return {
      title: "Trip status",
    };
  }

  return {
    title: `${state.organizationName} trip status`,
    description: `Track the itinerary progress for ${state.organizationName}.`,
  };
}

export default async function TripRequestStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await loadTripRequestFormState(token);

  if (!state) {
    notFound();
  }

  return (
    <TripRequestIntakeForm
      token={token}
      state={state}
      submitted={state.status !== "draft"}
      errorMessage={null}
    />
  );
}
