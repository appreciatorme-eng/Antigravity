"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PlannerPage() {
    const [prompt, setPrompt] = useState("");
    const [days, setDays] = useState(3);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const [images, setImages] = useState<Record<string, string | null>>({});

    const fetchImagesForItinerary = async (itineraryData: any) => {
        const locations: string[] = [];
        itineraryData.days.forEach((day: any) => {
            day.activities.forEach((act: any) => {
                if (act.location) locations.push(act.location);
            });
        });

        const imageMap: Record<string, string | null> = {};

        // Fetch in parallel but limited to avoid rate limits if necessary
        // For now, simple parallel fetch is fine for small itineraries
        await Promise.all(locations.map(async (loc) => {
            // Simple cache check if needed, but here we just fetch
            try {
                const url = await fetch(`/api/images?query=${encodeURIComponent(loc)}`).then(r => r.json()).then(d => d.url);
                imageMap[loc] = url;
            } catch (e) {
                console.error("Failed to load image for", loc);
                imageMap[loc] = null;
            }
        }));

        setImages(imageMap);
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setError("");
        setResult(null);
        setImages({});

        try {
            const res = await fetch("/api/itinerary/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, days }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setResult(data);

            // Trigger image fetch non-blocking
            fetchImagesForItinerary(data);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto font-sans">
            <h1 className="text-4xl font-serif text-[--secondary] mb-6">AI Trip Planner ✈️</h1>

            <div className="bg-white/50 border border-gray-200 p-6 rounded-xl shadow-sm mb-8">
                <div className="flex flex-col gap-4">
                    <label className="block">
                        <span className="text-gray-700 font-medium">Where do you want to go?</span>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[--primary] focus:ring focus:ring-[--primary] focus:ring-opacity-50 p-3 border"
                            rows={3}
                            placeholder="e.g. A romantic weekend in Paris with good food and museums..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </label>

                    <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2">
                            <span className="text-gray-700">Duration (Days):</span>
                            <input
                                type="number"
                                min={1}
                                max={14}
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                className="w-20 rounded-md border-gray-300 border p-2"
                            />
                        </label>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt}
                            className="px-6 py-2 bg-[--primary] text-white font-bold rounded-full hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin w-4 h-4" />}
                            {loading ? "Dreaming..." : "Generate Itinerary"}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 mb-6">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-6">
                    <header className="border-b pb-4">
                        <h2 className="text-3xl font-serif text-[--secondary]">{result.trip_title}</h2>
                        <p className="text-gray-600 italic">{result.destination}</p>
                        <p className="mt-2 text-gray-800">{result.summary}</p>
                    </header>

                    <div className="space-y-8">
                        {result.days.map((day: any) => (
                            <div key={day.day_number} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-[--secondary] mb-4">
                                    Day {day.day_number}: {day.theme}
                                </h3>
                                <ul className="space-y-6 border-l-2 border-[--primary] pl-6 ml-2">
                                    {day.activities.map((act: any, idx: number) => (
                                        <li key={idx} className="relative">
                                            <div className="absolute -left-[31px] top-1 bg-white border-2 border-[--primary] w-4 h-4 rounded-full"></div>
                                            <span className="text-xs font-bold text-[--primary] uppercase tracking-wider">{act.time}</span>
                                            <h4 className="text-lg font-semibold text-gray-900">{act.title}</h4>
                                            <div className="flex gap-4 mt-2">
                                                {images[act.location] && (
                                                    <img
                                                        src={images[act.location]!}
                                                        alt={act.location}
                                                        className="w-24 h-24 object-cover rounded-md shadow-sm flex-shrink-0"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">📍 {act.location}</p>
                                                    <p className="text-gray-700 leading-relaxed">{act.description}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
