'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export interface MapsDataSectionProps {
    readonly initialPlacesEnabled: boolean;
    readonly initialGooglePlaceId: string;
}

export function MapsDataSection({ initialPlacesEnabled, initialGooglePlaceId }: MapsDataSectionProps) {
    const { toast } = useToast();
    const [isPlacesEnabled, setIsPlacesEnabled] = useState(initialPlacesEnabled);
    const [isPlacesActivating, setIsPlacesActivating] = useState(false);
    const [googlePlaceId, setGooglePlaceId] = useState(initialGooglePlaceId);
    const [savedGooglePlaceId, setSavedGooglePlaceId] = useState(initialGooglePlaceId);
    const [isGooglePlaceSaving, setIsGooglePlaceSaving] = useState(false);

    const handleActivatePlaces = async () => {
        setIsPlacesActivating(true);
        try {
            const res = await fetch('/api/integrations/places', { method: 'POST' });
            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                toast({ title: 'Activation failed', description: data.error ?? 'Could not activate Google Places', variant: 'error' });
                return;
            }
            setIsPlacesEnabled(true);
            toast({ title: 'Google Places activated', variant: 'success' });
        } catch {
            toast({ title: 'Activation failed', variant: 'error' });
        } finally {
            setIsPlacesActivating(false);
        }
    };

    const handleSaveGooglePlaceId = async () => {
        const trimmedPlaceId = googlePlaceId.trim();
        if (!trimmedPlaceId) {
            toast({ title: 'Google Place ID required', description: 'Paste a valid Google Place ID before saving.', variant: 'error' });
            return;
        }

        setIsGooglePlaceSaving(true);
        try {
            const res = await fetch('/api/integrations/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googlePlaceId: trimmedPlaceId }),
            });
            const data = (await res.json()) as { success?: boolean; error?: string; googlePlaceId?: string; enabled?: boolean };
            if (!res.ok || !data.success) {
                toast({ title: 'Save failed', description: data.error ?? 'Could not save Google Place ID', variant: 'error' });
                return;
            }

            const nextPlaceId = data.googlePlaceId ?? trimmedPlaceId;
            setGooglePlaceId(nextPlaceId);
            setSavedGooglePlaceId(nextPlaceId);
            setIsPlacesEnabled(data.enabled ?? true);
            toast({ title: 'Google Place ID saved', description: 'Review sync can now import Google reviews.', variant: 'success' });
        } catch {
            toast({ title: 'Save failed', description: 'Could not save Google Place ID', variant: 'error' });
        } finally {
            setIsGooglePlaceSaving(false);
        }
    };

    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Maps & Data</h3>
            <div className="p-4 border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-gray-50/50">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-secondary text-sm">
                        Google Places & Maps
                        {isPlacesEnabled && (
                            <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; Active</span>
                        )}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">Geospatial mapping and point-of-interest data for itinerary building.</p>
                </div>
                <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={() => { if (!isPlacesEnabled) void handleActivatePlaces(); }}
                    disabled={isPlacesActivating || isPlacesEnabled}
                    className={cn('text-xs shrink-0', isPlacesEnabled ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : '')}
                >
                    {isPlacesActivating ? 'Activating...' : isPlacesEnabled ? 'Active' : 'Activate'}
                </GlassButton>
            </div>
            <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4">
                <label htmlFor="google-place-id" className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                    Google Place ID
                </label>
                <p className="mt-1 text-xs text-text-muted">
                    Find yours in Google Maps by opening your listing, selecting Share, and copying the place link.
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                        id="google-place-id"
                        value={googlePlaceId}
                        onChange={(event) => setGooglePlaceId(event.target.value)}
                        placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                        className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-secondary outline-none transition focus:border-primary/40 focus:bg-white"
                    />
                    <GlassButton
                        size="sm"
                        onClick={() => { void handleSaveGooglePlaceId(); }}
                        disabled={isGooglePlaceSaving || googlePlaceId.trim() === savedGooglePlaceId}
                        className="md:min-w-[170px]"
                    >
                        {isGooglePlaceSaving ? 'Saving...' : 'Save Place ID'}
                    </GlassButton>
                </div>
                {savedGooglePlaceId && (
                    <p className="mt-2 text-xs text-emerald-600">
                        Current Place ID: {savedGooglePlaceId}
                    </p>
                )}
            </div>
        </div>
    );
}
