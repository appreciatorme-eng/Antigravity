"use client";

import Image from "next/image";
import { Mail, Phone, Globe } from "lucide-react";

export interface OrganizationBranding {
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    email?: string | null;
    phone?: string | null;
}

interface ItineraryBrandedFooterProps {
    branding: OrganizationBranding;
}

export function ItineraryBrandedFooter({ branding }: ItineraryBrandedFooterProps) {
    const brandColor = branding.primaryColor || "#0f766e";
    const hasContact = branding.email || branding.phone;

    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-white/10">
            {/* Branding bar */}
            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex flex-col items-center gap-6 text-center">
                    {/* Logo + Company Name */}
                    <div className="flex items-center gap-3">
                        {branding.logoUrl && (
                            <Image
                                src={branding.logoUrl}
                                alt={branding.name}
                                width={120}
                                height={40}
                                className="h-10 w-auto object-contain rounded"
                                unoptimized
                            />
                        )}
                        <span
                            className="text-xl font-bold tracking-tight"
                            style={{ color: brandColor }}
                        >
                            {branding.name}
                        </span>
                    </div>

                    {/* Contact info */}
                    {hasContact && (
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {branding.email && (
                                <a
                                    href={`mailto:${branding.email}`}
                                    className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    {branding.email}
                                </a>
                            )}
                            {branding.phone && (
                                <a
                                    href={`tel:${branding.phone}`}
                                    className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                    {branding.phone}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-slate-900 px-6 py-6">
                <p className="max-w-3xl mx-auto text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                    <strong>Disclaimer:</strong> This itinerary is provided as a reference and is subject to
                    change based on weather conditions, local regulations, political situations, seasonal
                    availability, force majeure events, and other unforeseen circumstances. Final
                    confirmation of activities, timings, and pricing will be provided closer to the travel
                    date. Please consult your travel advisor for the latest updates before departure.
                </p>
            </div>

            {/* Powered by */}
            <div className="border-t border-gray-100 dark:border-white/5 px-6 py-3">
                <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 flex items-center justify-center gap-1">
                    <Globe className="w-3 h-3" />
                    Powered by TripBuilt
                </p>
            </div>
        </footer>
    );
}
