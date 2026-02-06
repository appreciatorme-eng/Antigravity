import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Wallet, Clock, ArrowLeft, Plane, Download, Share2 } from "lucide-react";
import dynamic from "next/dynamic";

const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="h-72 bg-gray-100 animate-pulse rounded-xl" />,
});

export default async function TripDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/auth?next=/trips/${id}`);
    }

    const { data: itinerary, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error || !itinerary) {
        notFound();
    }

    const tripData = itinerary.raw_data as any;

    return (
        <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/trips"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Plane className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-serif text-secondary">TravelSuite</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Share2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Download className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Trip Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif text-secondary mb-2">
                        {itinerary.trip_title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-primary" />
                            {itinerary.destination}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {itinerary.duration_days} days
                        </span>
                        {itinerary.budget && (
                            <span className="flex items-center gap-1">
                                <Wallet className="w-4 h-4" />
                                {itinerary.budget}
                            </span>
                        )}
                    </div>
                    {itinerary.interests && itinerary.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {itinerary.interests.map((interest: string) => (
                                <span
                                    key={interest}
                                    className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-gray-700">{itinerary.summary}</p>
                </div>

                {/* Map */}
                {tripData?.days && (
                    <div className="h-72 rounded-xl overflow-hidden shadow-md border border-gray-200 mb-8">
                        <ItineraryMap
                            activities={tripData.days.flatMap((day: any) => day.activities)}
                        />
                    </div>
                )}

                {/* Day by Day */}
                {tripData?.days && (
                    <div className="space-y-6">
                        {tripData.days.map((day: any) => (
                            <div
                                key={day.day_number}
                                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
                            >
                                <h2 className="text-xl font-bold text-secondary mb-4">
                                    Day {day.day_number}: {day.theme}
                                </h2>
                                <div className="space-y-4">
                                    {day.activities.map((activity: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="shrink-0 w-16 text-sm text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {activity.time}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800">
                                                    {activity.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {activity.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                                    <span>{activity.location}</span>
                                                    {activity.duration && (
                                                        <span>• {activity.duration}</span>
                                                    )}
                                                    {activity.cost && (
                                                        <span>• {activity.cost}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tips Section */}
                {tripData?.tips && tripData.tips.length > 0 && (
                    <div className="mt-8 bg-amber-50 p-6 rounded-xl border border-amber-100">
                        <h3 className="font-bold text-amber-800 mb-3">Travel Tips</h3>
                        <ul className="space-y-2">
                            {tripData.tips.map((tip: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-amber-700 text-sm">
                                    <span>•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </main>
    );
}
