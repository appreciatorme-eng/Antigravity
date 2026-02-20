import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Plane } from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";
import { getTemplateById } from "@/components/templates/TemplateRegistry";

export default async function SharedTripPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const supabase = await createClient();
    const { token } = await params;

    // Fetch the shared record AND the org info (for branding)
    const { data: share, error: shareError } = await supabase
        .from("shared_itineraries")
        .select(
            `
            *,
            itineraries (
                *,
                organizations ( name, logo_url, primary_color )
            )
        `
        )
        .eq("share_code", token)
        .single();

    if (shareError || !share) {
        notFound();
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Link Expired
                    </h1>
                    <p className="text-gray-600 mb-6">
                        This share link is no longer valid.
                    </p>
                    <Link
                        href="/planner"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                    >
                        <Plane className="w-5 h-5" />
                        Create Your Own Trip
                    </Link>
                </div>
            </main>
        );
    }

    // Track the view
    await supabase
        .from("shared_itineraries")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", share.id);

    const itinerary = (share as any).itineraries;
    if (!itinerary) {
        notFound();
    }

    const tripData = itinerary.raw_data as unknown as ItineraryResult;
    // Merge DB columns into the tripData object (some fields may live on the itinerary row directly)
    const fullTripData: ItineraryResult = {
        ...tripData,
        trip_title: tripData?.trip_title || itinerary.trip_title || "Your Itinerary",
        destination: tripData?.destination || itinerary.destination || "",
        duration_days: tripData?.duration_days || itinerary.duration_days || null,
        budget: tripData?.budget || itinerary.budget || null,
        interests: tripData?.interests || itinerary.interests || [],
        summary: tripData?.summary || itinerary.summary || "",
    };

    // Resolve the organization name for branding
    const org = (itinerary as any).organizations;
    const organizationName: string =
        (Array.isArray(org) ? org[0]?.name : org?.name) || "Travel Adventures";

    // Resolve the template
    const templateId: string = (share as any).template_id || "classic";
    const templateDef = getTemplateById(templateId);
    const TemplateComponent = templateDef.component;

    return <TemplateComponent itineraryData={fullTripData} organizationName={organizationName} />;
}
