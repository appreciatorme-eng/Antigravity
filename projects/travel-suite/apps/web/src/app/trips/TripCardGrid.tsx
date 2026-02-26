"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Wallet, ArrowRight, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
    const { toast } = useToast();

    const handleDelete = async (e: React.MouseEvent, tripId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (deleting) return;

        // Custom confirmation would be better but let's stick to confirm for now
        if (!confirm("Confirm mission termination? Intelligence logs will be permanently erased.")) return;

        setDeleting(tripId);
        const { error } = await supabase.from("itineraries").delete().eq("id", tripId);
        if (!error) {
            setItems((prev) => prev.filter((t) => t.id !== tripId));
            toast({
                title: "Mission Erased",
                description: "The itinerary has been successfully removed from tactical storage.",
            });
        } else {
            toast({
                title: "Operation Failed",
                description: "Failed to erase mission logs. Check your authorization levels.",
                variant: "destructive",
            });
        }
        setDeleting(null);
    };

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
                {items.map((trip, index) => {
                    const heroImg = getHeroImage(trip);
                    const gradient = gradientFor(trip.id);

                    return (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="relative group h-full"
                        >
                            <Link href={`/trips/${trip.id}`} className="h-full block">
                                <Card className="h-full overflow-hidden transition-all duration-500 border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900/40 backdrop-blur-md hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 group">
                                    {/* Hero image or gradient */}
                                    <div className="h-48 relative overflow-hidden">
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
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-110 opacity-80 dark:opacity-60",
                                                gradient
                                            )} />
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                                        {/* Badges on top of image */}
                                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-2.5 py-1 text-xs font-bold shadow-lg">
                                                {trip.duration_days} DAYS
                                            </div>
                                        </div>

                                        {/* Floating Delete button */}
                                        <button
                                            onClick={(e) => handleDelete(e, trip.id)}
                                            disabled={deleting === trip.id}
                                            className="absolute top-4 left-4 z-20 p-2 rounded-lg bg-black/20 hover:bg-red-500/80 text-white/70 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10"
                                            title="Erase Mission"
                                        >
                                            {deleting === trip.id ? (
                                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>

                                        <div className="absolute bottom-0 left-0 right-0 p-5">
                                            <div className="flex items-center text-emerald-400 text-[10px] font-black tracking-[0.2em] mb-1 uppercase">
                                                <MapPin className="w-3 h-3 mr-1" /> {trip.destination}
                                            </div>
                                            <h3 className="text-xl font-bold text-white leading-tight line-clamp-1">
                                                {trip.trip_title}
                                            </h3>
                                        </div>
                                    </div>

                                    <CardContent className="p-5 flex flex-col justify-between h-[calc(100%-12rem)]">
                                        <div className="space-y-3">
                                            {trip.summary && (
                                                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 text-sm leading-relaxed">
                                                    {trip.summary}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {trip.budget && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                                        <Wallet className="w-3 h-3 text-emerald-500" />
                                                        {trip.budget.toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                                    <Clock className="w-3 h-3 text-sky-500" />
                                                    {trip.created_at ? new Date(trip.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between group/btn pt-4 border-t border-slate-100 dark:border-white/5">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                                                MISSION LOG #{(trip.id.substring(0, 8)).toUpperCase()}
                                            </span>
                                            <div className="flex items-center gap-1 text-primary font-bold text-xs group-hover/btn:gap-2 transition-all">
                                                DEBRIEF <ArrowRight className="w-3 h-3 shadow-primary/20" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
