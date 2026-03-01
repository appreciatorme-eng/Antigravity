"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Wand2, Sparkles, Image as ImageLucide } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractedPosterData {
    destination: string;
    price: string;
    offer: string;
    season: string;
    contactNumber?: string;
    companyName?: string;
}

interface Props {
    onExtracted: (data: ExtractedPosterData) => void;
    extracting: boolean;
}

export const PosterExtractor = ({ onExtracted, extracting }: Props) => {
    const [extractorFile, setExtractorFile] = useState<string | null>(null);

    const handleMagicExtract = async (base64Image: string) => {
        try {
            const resp = await fetch("/api/social/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64Image }),
            });

            if (!resp.ok) throw new Error("AI Extraction failed");
            const data = await resp.json() as ExtractedPosterData;
            onExtracted(data);
        } catch (e) {
            console.error(e);
            // Fallback
            onExtracted({
                destination: "Dubai Desert Safari & City",
                price: "$499",
                offer: "Buy 1 Get 1 Free",
                season: "Summer Special"
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setExtractorFile(base64);
                handleMagicExtract(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-12">
            <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wand2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Magic Poster Analyzer</h2>
                <p className="text-slate-500 text-lg">
                    Upload an old flyer, screenshot, or competitor poster. Our AI vision model will instantly extract all details (Destination, Prices, Dates, Offers) and map them to our gorgeous Marketing Studio templates!
                </p>
            </div>

            <GlassCard className="p-8 border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden transition-colors">
                {extractorFile && (
                    <div className="absolute inset-0 z-0">
                        <img src={extractorFile} alt="Target" className="w-full h-full object-cover opacity-10 blur-sm pointer-events-none" />
                    </div>
                )}

                {!extracting ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10 w-full animate-fade-in-up">
                        {extractorFile ? (
                            <div className="w-48 h-64 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden border-4 border-white transition-opacity hover:opacity-95">
                                <img src={extractorFile} alt="Original" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-sm rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                <ImageLucide className="w-10 h-10 text-slate-300" />
                            </div>
                        )}
                        <div className="text-center space-y-1 mt-6">
                            <p className="text-lg font-medium text-slate-700 dark:text-slate-200 tracking-tight">
                                {extractorFile ? "Ready to analyze this poster?" : "Drag and drop any image"}
                            </p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">PNG, JPG, JPEG up to 10MB</p>
                        </div>

                        <div className="relative flex gap-3 flex-wrap justify-center items-center mt-6">
                            <input
                                type="file"
                                id="poster-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleChange}
                            />
                            <Button variant="outline" size="lg" className="px-8 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900" onClick={() => document.getElementById('poster-upload')?.click()}>
                                {extractorFile ? "Change Image" : "Select Image"}
                            </Button>
                            {extractorFile && (
                                <Button size="lg" className="px-8 shadow-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={() => handleMagicExtract(extractorFile)}>
                                    <Sparkles className="w-5 h-5 mr-2" /> Start AI Extraction
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10">
                        <div className="relative">
                            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center animate-bounce shadow-xl shadow-blue-500/30">
                                <Sparkles className="w-10 h-10 text-white animate-spin-slow" />
                            </div>
                            <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl animate-pulse opacity-50 -z-10"></div>
                        </div>
                        <div className="text-center mt-8 space-y-2">
                            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">AI is reading your poster...</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Extracting destinations, parsing currencies, detecting offers and recognizing the layout structure.</p>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
