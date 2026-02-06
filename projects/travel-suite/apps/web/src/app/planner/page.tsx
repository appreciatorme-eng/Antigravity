"use client";

import { useState } from "react";
import { Loader2, Map } from "lucide-react";
import dynamic from "next/dynamic";
import DownloadPDFButton from "@/components/pdf/DownloadPDFButton";
import ShareItinerary from "./ShareItinerary";
import SaveItineraryButton from "./SaveItineraryButton";

// Dynamic import for Leaflet (SSR incompatible)
const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

export default function PlannerPage() {
    const [prompt, setPrompt] = useState("");
    const [days, setDays] = useState(3);
    const [budget, setBudget] = useState("Moderate");
    const [interests, setInterests] = useState<string[]>([]);
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

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setError("");
        setResult(null);
        setImages({});

        // Construct a rich prompt from the form data
        const interestString = interests.length > 0
            ? ` focusing on ${interests.join(", ")}`
            : "";
        const finalPrompt = `Create a ${budget} ${days}-day itinerary for ${prompt}${interestString}. Include specific practical details.`;

        try {
            const res = await fetch("/api/itinerary/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt, days }),
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
            <h1 className="text-4xl font-serif text-secondary mb-6">GoBuddy Adventures ✈️</h1>

            <div className="bg-white/50 border border-gray-200 p-6 rounded-xl shadow-sm mb-8">
                <div className="flex flex-col gap-6">
                    {/* Destination Input */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Where to?</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                            placeholder="e.g. Paris, Tokyo, New York"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Duration Input */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Duration (Days)</label>
                            <input
                                type="number"
                                min={1}
                                max={14}
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Budget Input */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Budget</label>
                            <select
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            >
                                <option value="Budget-Friendly">💰 Budget-Friendly</option>
                                <option value="Moderate">⚖️ Moderate</option>
                                <option value="Luxury">💎 Luxury</option>
                                <option value="Ultra-High End">👑 Ultra-High End</option>
                            </select>
                        </div>
                    </div>

                    {/* Interests Input */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Interests</label>
                        <div className="flex flex-wrap gap-2">
                            {['🎨 Art & Culture', '🍽️ Food & Dining', '🏞️ Nature', '🛍️ Shopping', '🏰 History', '👨‍👩‍👧‍👦 Family'].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleInterest(tag)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${interests.includes(tag)
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt}
                            className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.01]"
                        >
                            {loading && <Loader2 className="animate-spin w-6 h-6" />}
                            {loading ? "Crafting your Journey..." : "Generate Dream Itinerary"}
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
                    <header className="border-b pb-4 flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-serif text-secondary">{result.trip_title}</h2>
                            <p className="text-gray-600 italic">{result.destination}</p>
                            <p className="mt-2 text-gray-800">{result.summary}</p>
                        </div>
                        <div className="shrink-0 flex flex-wrap items-center gap-2">
                            <SaveItineraryButton
                                itineraryData={result}
                                destination={prompt}
                                days={days}
                                budget={budget}
                                interests={interests}
                            />
                            <ShareItinerary tripTitle={result.trip_title} description={result.summary} />
                            <DownloadPDFButton
                                data={result}
                                fileName={`${result.trip_title.replace(/\s+/g, '_')}_Itinerary.pdf`}
                            />
                        </div>
                    </header>

                    {/* Itinerary Map */}
                    <div className="h-72 rounded-xl overflow-hidden shadow-md border border-gray-200">
                        <ItineraryMap
                            activities={result.days.flatMap((day: any) => day.activities)}
                        />
                    </div>

                    <div className="space-y-8">
                        {result.days.map((day: any) => (
                            <div key={day.day_number} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-secondary mb-4">
                                    Day {day.day_number}: {day.theme}
                                </h3>
                                <ul className="space-y-6 border-l-2 border-primary pl-6 ml-2">
                                    {day.activities.map((act: any, idx: number) => (
                                        <li key={idx} className="relative">
                                            <div className="absolute -left-[31px] top-1 bg-white border-2 border-primary w-4 h-4 rounded-full"></div>
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider">{act.time}</span>
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
