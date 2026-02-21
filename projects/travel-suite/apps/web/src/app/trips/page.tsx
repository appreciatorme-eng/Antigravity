import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TripCardGrid from "./TripCardGrid";

export default async function TripsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth?next=/trips");
    }

    const { data: itineraries, error } = await supabase
        .from("itineraries")
        .select("id, trip_title, destination, duration_days, budget, summary, created_at, raw_data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 pb-20">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif text-secondary mb-3 tracking-tight">My Journeys</h1>
                        <p className="text-gray-500 text-lg font-light max-w-2xl">
                            Revisit your generated itineraries and start planning your next adventure.
                        </p>
                    </div>
                    <Link href="/planner">
                        <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-xl bg-primary text-primary-foreground font-bold">
                            <Plus className="w-5 h-5 mr-2" /> Plan New Trip
                        </Button>
                    </Link>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 mb-8 flex items-center gap-3 shadow-sm">
                        <span className="text-xl">⚠️</span>
                        <span>Error loading trips: {error.message}</span>
                    </div>
                )}

                {itineraries && itineraries.length === 0 && (
                    <Card className="text-center py-24 shadow-xl border-dashed border-2 border-primary/20 bg-white/50 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
                                <Rocket className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-serif text-secondary mb-3">No trips yet</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg font-light">
                                The world is waiting for you. Create your first AI-powered itinerary and start your next adventure today.
                            </p>
                            <Link href="/planner">
                                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 rounded-xl">
                                    Start Planning <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {itineraries && itineraries.length > 0 && (
                    <TripCardGrid trips={itineraries as any} />
                )}
            </div>
        </main>
    );
}
