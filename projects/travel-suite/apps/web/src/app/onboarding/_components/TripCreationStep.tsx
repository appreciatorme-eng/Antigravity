'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, User, Sparkles, Loader2, MapPin, Globe, Clock, Check, AlertCircle } from 'lucide-react';
import type { ItineraryResult } from '@/types/itinerary';

interface SavedItinerary {
  id: string;
  trip_title: string;
  destination: string | null;
  duration_days: number | null;
  summary: string | null;
  created_at: string;
  client_id: string | null;
  client: { full_name: string | null } | null;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface TripCreationStepProps {
  clientId: string;
  startDate: string;
  endDate: string;
  aiPrompt: string;
  selectedItineraryId: string | null;
  generatedItinerary: ItineraryResult | null;
  setClientId: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setAiPrompt: (value: string) => void;
  setSelectedItineraryId: (value: string | null) => void;
  setGeneratedItinerary: (value: ItineraryResult | null) => void;
}

export function TripCreationStep({
  clientId,
  startDate,
  endDate,
  aiPrompt,
  selectedItineraryId,
  generatedItinerary,
  setClientId,
  setStartDate,
  setEndDate,
  setAiPrompt,
  setSelectedItineraryId,
  setGeneratedItinerary,
}: TripCreationStepProps) {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingRawData, setLoadingRawData] = useState(false);
  const [importMode, setImportMode] = useState<'saved' | 'ai'>('saved');
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/clients', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        setLoadingClients(false);
        return;
      }

      const payload = await response.json();
      setClients(
        (payload.clients || []).map((client: Client) => ({
          id: client.id,
          full_name: client.full_name || 'Unknown',
          email: client.email || 'No Email',
        }))
      );
    } catch {
      // Fail silently - clients list will be empty
    } finally {
      setLoadingClients(false);
    }
  }, [supabase]);

  const fetchSavedItineraries = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/itineraries', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        setLoadingSaved(false);
        return;
      }

      const payload = await response.json();
      setSavedItineraries(payload.itineraries || []);
    } catch {
      // Fail silently - saved list will be empty
    } finally {
      setLoadingSaved(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchClients();
    void fetchSavedItineraries();
  }, [fetchClients, fetchSavedItineraries]);

  const handleSelectSavedItinerary = useCallback(
    async (itinerary: SavedItinerary) => {
      setSelectedItineraryId(itinerary.id);
      setLoadingRawData(true);
      try {
        const { data, error } = await supabase
          .from('itineraries')
          .select('raw_data')
          .eq('id', itinerary.id)
          .single();

        if (error || !data?.raw_data) {
          setSelectedItineraryId(null);
          return;
        }

        setGeneratedItinerary(data.raw_data as unknown as ItineraryResult);

        // Auto-fill client if the saved itinerary has one
        if (itinerary.client_id) {
          setClientId(itinerary.client_id);
        }
      } catch {
        setSelectedItineraryId(null);
      } finally {
        setLoadingRawData(false);
      }
    },
    [supabase, setClientId, setSelectedItineraryId, setGeneratedItinerary]
  );

  const handleGenerateAI = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const daysMatch = aiPrompt.match(/(\d+)\s*days?/i);
      const days = daysMatch ? parseInt(daysMatch[1]) : 3;

      const res = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, days }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      setGeneratedItinerary(data as ItineraryResult);
    } catch (genError) {
      setError(genError instanceof Error ? genError.message : 'Failed to generate itinerary. Please try again or use a saved plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
        <p className="text-sm text-[#6f5b3e]">
          Create your first trip to see how the platform generates beautiful proposals. You can use a saved itinerary plan or let AI create one from a simple description.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-900">Unable to Generate</p>
              <p className="mt-1 text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">
            <User className="mr-1 inline-block h-4 w-4" />
            Client *
          </label>
          <div className="relative">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingClients}
              className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25 disabled:cursor-not-allowed disabled:opacity-60"
              required
            >
              <option value="" disabled>
                {loadingClients ? 'Loading clients...' : 'Select a client'}
              </option>
              {!loadingClients &&
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name} ({client.email})
                  </option>
                ))}
            </select>
            {loadingClients && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-[#9c7c46]" />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-[#9c7c46]">Choose the client for this trip</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">
              <Calendar className="mr-1 inline-block h-4 w-4" />
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#6f5b3e]">
              <Calendar className="mr-1 inline-block h-4 w-4" />
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              required
            />
          </div>
        </div>
      </div>

      {/* Import Mode Selector */}
      {!generatedItinerary ? (
        <div className="space-y-4 rounded-xl border border-[#eadfcd] bg-[#f8f1e6] p-6">
          <div className="flex w-fit flex-wrap gap-2 rounded-lg border border-[#eadfcd] bg-white p-1">
            <button
              type="button"
              onClick={() => setImportMode('saved')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                importMode === 'saved'
                  ? 'bg-[#9c7c46] text-white'
                  : 'text-[#6f5b3e] hover:bg-[#f8f1e6]'
              }`}
            >
              <MapPin className="h-4 w-4" /> Saved Plans
              {savedItineraries.length > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    importMode === 'saved'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#eadfcd] text-[#6f5b3e]'
                  }`}
                >
                  {savedItineraries.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setImportMode('ai')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                importMode === 'ai'
                  ? 'bg-[#9c7c46] text-white'
                  : 'text-[#6f5b3e] hover:bg-[#f8f1e6]'
              }`}
            >
              <Sparkles className="h-4 w-4" /> AI Describe
            </button>
          </div>

          {importMode === 'saved' && (
            <div className="space-y-3 pt-2">
              {loadingSaved ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[#6f5b3e]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading saved plans...</span>
                </div>
              ) : savedItineraries.length === 0 ? (
                <div className="space-y-2 py-8 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-[#eadfcd]" />
                  <p className="text-sm font-medium text-[#6f5b3e]">No saved plans yet</p>
                  <p className="text-xs text-[#9c7c46]">
                    Create itineraries in the Planner page and they&apos;ll appear here.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#6f5b3e]">
                    Select a saved itinerary from the Planner to use as the trip blueprint.
                  </p>
                  <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                    {savedItineraries.map((itinerary) => (
                      <button
                        key={itinerary.id}
                        type="button"
                        disabled={loadingRawData}
                        onClick={() => handleSelectSavedItinerary(itinerary)}
                        className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${
                          selectedItineraryId === itinerary.id
                            ? 'border-[#9c7c46] bg-white ring-1 ring-[#9c7c46]'
                            : 'border-[#eadfcd] bg-white hover:border-[#9c7c46]/50'
                        } ${loadingRawData && selectedItineraryId === itinerary.id ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1b140a]">
                              {itinerary.trip_title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6f5b3e]">
                              {itinerary.destination && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {itinerary.destination}
                                </span>
                              )}
                              {itinerary.duration_days && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {itinerary.duration_days} days
                                </span>
                              )}
                              {itinerary.client?.full_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {itinerary.client.full_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {loadingRawData && selectedItineraryId === itinerary.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#9c7c46]" />
                            ) : selectedItineraryId === itinerary.id ? (
                              <Check className="h-4 w-4 text-[#9c7c46]" />
                            ) : null}
                            <span className="flex items-center gap-1 text-[10px] text-[#9c7c46]">
                              <Clock className="h-3 w-3" />
                              {new Date(itinerary.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {itinerary.summary && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-[#6f5b3e]">
                            {itinerary.summary}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {importMode === 'ai' && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="e.g. 7 days in Kyoto for a foodie couple..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 rounded-lg border border-[#eadfcd] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
                  onKeyDown={(e) => e.key === 'Enter' && !isGenerating && aiPrompt && handleGenerateAI()}
                  disabled={isGenerating}
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !aiPrompt}
                  className="shrink-0 rounded-lg bg-[#9c7c46] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#8a6b3d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
              <div className="rounded-lg border border-[#eadfcd] bg-white p-3">
                <p className="text-xs font-medium text-[#1b140a]">Tips for better results:</p>
                <ul className="mt-1.5 space-y-1 text-xs text-[#6f5b3e]">
                  <li>• Mention the number of days (e.g., &quot;7 days&quot;)</li>
                  <li>• Specify the destination (e.g., &quot;in Paris&quot;)</li>
                  <li>• Add traveler preferences (e.g., &quot;for a couple&quot;, &quot;adventure seekers&quot;)</li>
                  <li>• Include interests (e.g., &quot;cultural sites&quot;, &quot;food tours&quot;, &quot;nature&quot;)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-[#eadfcd] bg-[#f8f1e6] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1b140a]">{generatedItinerary.trip_title}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-[#6f5b3e]">
                <MapPin className="h-4 w-4" />
                {generatedItinerary.destination}
                <span className="ml-2 rounded-full border border-[#eadfcd] bg-white px-2 py-0.5 text-xs font-medium text-[#9c7c46]">
                  {generatedItinerary.days?.length || 0} Days
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGeneratedItinerary(null)}
              className="text-sm font-medium text-[#9c7c46] hover:text-[#8a6b3d]"
            >
              Start Over
            </button>
          </div>

          <p className="text-sm leading-relaxed text-[#6f5b3e]">{generatedItinerary.summary}</p>

          <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
            {generatedItinerary.days?.map((day) => (
              <div key={day.day_number} className="border-l-2 border-[#9c7c46]/30 py-1 pl-3 text-sm">
                <span className="font-semibold text-[#1b140a]">
                  Day {day.day_number}: {day.theme}
                </span>
                <ul className="mt-1 space-y-1">
                  {day.activities?.slice(0, 2).map((act, i) => (
                    <li key={i} className="truncate text-xs text-[#6f5b3e]">
                      • {act.title}
                    </li>
                  ))}
                  {day.activities?.length > 2 && (
                    <li className="text-xs italic text-[#9c7c46]">
                      + {day.activities.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
