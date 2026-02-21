"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Wallet, ArrowRight, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Trip {
    id: string;
    trip_title: string;
    destination: string;
    duration_days: number | null;
    budget: string | null;
    summary: string | null;
    created_at: string | null;
    raw_data: any;
}

interface TripCardGridProps {
    trips: Trip[];
}

function getHeroImage(trip: Trip): string | null {
    try {
        const days = trip.raw_data?.days as any[];
        if (!days) return null;
        for (const day of days) {
            for (const act of day.activities ?? []) {
                if (act.image) return act.image as string;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

// Destination-based gradient as colourful fallback
const GRADIENTS = [
    "from-emerald-400 via-teal-500 to-sky-500",
    "from-violet-500 via-purple-500 to-pink-500",
    "from-amber-400 via-orange-500 to-rose-500",
    "from-cyan-400 via-blue-500 to-indigo-600",
    "from-lime-400 via-green-500 to-emerald-600",
    "from-fuchsia-500 via-pink-500 to-rose-500",
];

function gradientFor(id: string) {
    const n = id.charCodeAt(0) % GRADIENTS.length;
    return GRADIENTS[n];
}

export default function TripCardGrid({ trips }: TripCardGridProps) {
    const supabase = createClient();
    const [items, setItems] = useState<Trip[]>(trips);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, tripId: string) => {
        e.preventDefault(); // don't navigate to trip page
        e.stopPropagation();
        if (deleting) return;
        if (!confirm("Delete this trip? This cannot be undone.")) return;

        setDeleting(tripId);
        const { error } = await supabase.from("itineraries").delete().eq("id", tripId);
        if (!error) {
            setItems((prev) => prev.filter((t) => t.id !== tripId));
        } else {
            alert("Failed to delete trip. Please try again.");
        }
        setDeleting(null);
    };

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((trip) => {
                const heroImg = getHeroImage(trip);
                const gradient = gradientFor(trip.id);

                return (
                    <div key={trip.id} className="relative group">
                        {/* Delete button — floats above the card */}
                        <button
                            onClick={(e) => handleDelete(e, trip.id)}
                            disabled={deleting === trip.id}
                            className="absolute top-3 left-3 z-20 p-1.5 rounded-full bg-black/40 hover:bg-red-600 text-white transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                            title="Delete trip"
                        >
                            {deleting === trip.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>

                        <Link href={`/trips/${trip.id}`} className="h-full block">
                            <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-500 border-gray-100 hover:border-primary/20 bg-white hover:-translate-y-2">
                                {/* Hero image or gradient */}
                                <div className="h-56 relative overflow-hidden bg-gray-100">
                                    {heroImg ? (
                                        <img
                                            src={heroImg}
                                            alt={trip.destination}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-700 group-hover:scale-110`} />
                                    )}

                                    {/* Overlay so text is always readable */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                                    <div className="absolute top-4 right-4 z-10">
                                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-md text-secondary shadow-sm font-bold px-3 py-1">
                                            {trip.duration_days} Days
                                        </Badge>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-6 pt-12">
                                        <h3 className="text-2xl font-serif font-bold text-white drop-shadow-md line-clamp-2 leading-tight mb-1">
                                            {trip.trip_title}
                                        </h3>
                                        <div className="flex items-center text-white/90 text-sm font-medium">
                                            <MapPin className="w-3.5 h-3.5 mr-1" /> {trip.destination}
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-6 space-y-4">
                                    {trip.summary && (
                                        <p className="text-gray-600 line-clamp-3 leading-relaxed text-sm font-light">
                                            {trip.summary}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {trip.budget && (
                                            <Badge variant="outline" className="font-normal text-xs text-gray-500 border-gray-100 bg-gray-50/50">
                                                <Wallet className="w-3 h-3 mr-1 text-primary" />
                                                {trip.budget}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                        {trip.created_at
                                            ? new Date(trip.created_at).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })
                                            : "Date unknown"}
                                    </span>
                                    <span className="text-primary font-bold flex items-center gap-1">
                                        View <ArrowRight className="w-3 h-3" />
                                    </span>
                                </CardFooter>
                            </Card>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
