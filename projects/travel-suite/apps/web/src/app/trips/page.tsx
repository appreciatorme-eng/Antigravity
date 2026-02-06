import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Wallet, ArrowRight, Plus } from "lucide-react";

export default async function TripsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth?next=/trips");
    }

    const { data: itineraries, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-50 via-white to-sky-50">
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-secondary">My Trips</h1>
                        <p className="text-gray-500 mt-1">Your saved itineraries and travel plans</p>
                    </div>
                    <Link
                        href="/planner"
                        className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-md"
                    >
                        <Plus className="w-4 h-4" /> New Trip
                    </Link>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 mb-6">
                        Error loading trips: {error.message}
                    </div>
                )}

                {itineraries && itineraries.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-medium text-gray-700 mb-2">No trips yet</h2>
                        <p className="text-gray-500 mb-6">Create your first AI-powered itinerary</p>
                        <Link
                            href="/planner"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                        >
                            Start Planning <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {itineraries && itineraries.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {itineraries.map((trip) => (
                            <Link
                                key={trip.id}
                                href={`/trips/${trip.id}`}
                                className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                            >
                                {/* Image placeholder with gradient */}
                                <div className="h-40 bg-gradient-to-br from-emerald-400 to-sky-500 relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-bold text-white drop-shadow-md">
                                            {trip.trip_title}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="text-sm">{trip.destination}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {trip.duration_days} days
                                        </span>
                                        {trip.budget && (
                                            <span className="flex items-center gap-1">
                                                <Wallet className="w-4 h-4" />
                                                {trip.budget}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                        {trip.summary}
                                    </p>
                                    <div className="mt-4 text-xs text-gray-400">
                                        Created {new Date(trip.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
