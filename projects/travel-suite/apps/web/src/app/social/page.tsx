"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Megaphone, Copy, RefreshCcw, Wand2, Check } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { useToast } from "@/components/ui/toast";

type Platform = "instagram" | "facebook" | "whatsapp";
type Tone = "premium" | "friendly" | "adventure" | "family" | "luxury";

interface TripOption {
  tripId: string;
  itineraryId: string;
  title: string;
  destination: string;
  status: string | null;
}

interface SocialPost {
  platform: Platform;
  caption: string;
  shortCaption: string;
  hashtags: string[];
  bestTime: string;
  creativeAngle: string;
}

const toneOptions: Tone[] = ["premium", "friendly", "adventure", "family", "luxury"];
const platformOptions: Platform[] = ["instagram", "facebook", "whatsapp"];

export default function SocialStudioPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tripOptions, setTripOptions] = useState<TripOption[]>([]);
  const [selectedItineraryId, setSelectedItineraryId] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [audience, setAudience] = useState("new clients looking for curated tours");
  const [callToAction, setCallToAction] = useState("DM us to reserve your dates and get pricing.");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["instagram", "facebook"]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [source, setSource] = useState<"ai" | "fallback" | "">("");

  const selectedTrip = useMemo(
    () => tripOptions.find((trip) => trip.itineraryId === selectedItineraryId) || null,
    [tripOptions, selectedItineraryId]
  );

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/trips?status=all&search=", {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load trips");

      const payload = await response.json();
      const trips = Array.isArray(payload?.trips) ? payload.trips : [];
      const mapped: TripOption[] = trips
        .filter((trip: { itinerary_id?: string | null }) => Boolean(trip?.itinerary_id))
        .map(
          (trip: {
            id: string;
            itinerary_id: string;
            status: string | null;
            itineraries: { trip_title: string | null; destination?: string | null } | null;
            destination?: string;
          }) => ({
            tripId: trip.id,
            itineraryId: trip.itinerary_id,
            title: trip.itineraries?.trip_title || "Untitled trip",
            destination: trip.itineraries?.destination || trip.destination || "Unknown",
            status: trip.status,
          })
        );

      setTripOptions(mapped);
      if (!selectedItineraryId && mapped.length > 0) {
        setSelectedItineraryId(mapped[0].itineraryId);
      }
    } catch (error) {
      toast({
        title: "Failed to load itineraries",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedItineraryId, supabase, toast]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((previous) => {
      if (previous.includes(platform)) {
        const next = previous.filter((item) => item !== platform);
        return next.length > 0 ? next : previous;
      }
      return [...previous, platform];
    });
  };

  const generateContent = async () => {
    if (!selectedItineraryId) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/social/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itineraryId: selectedItineraryId,
          platforms: selectedPlatforms,
          tone,
          audience,
          callToAction,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to generate social content");
      }

      setPosts(Array.isArray(payload.posts) ? payload.posts : []);
      setSource(payload.source === "ai" ? "ai" : "fallback");
      toast({
        title: "Social content generated",
        description:
          payload.source === "ai"
            ? "AI-generated drafts are ready."
            : "Fallback drafts generated (AI key missing or unavailable).",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Content copied to clipboard.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access is not available in this browser session.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-bold">Growth</p>
          <h1 className="text-3xl font-serif text-secondary dark:text-white mt-2">Social Studio</h1>
          <p className="text-text-secondary mt-1">
            Generate conversion-focused social copy from your itineraries.
          </p>
        </div>
        <GlassButton variant="secondary" onClick={() => void loadTrips()} loading={loading}>
          <RefreshCcw className="w-4 h-4" />
          Refresh Trips
        </GlassButton>
      </div>

      <GlassCard className="p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-text-secondary">Source Itinerary</span>
            <select
              value={selectedItineraryId}
              onChange={(event) => setSelectedItineraryId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              {tripOptions.map((trip) => (
                <option key={trip.itineraryId} value={trip.itineraryId}>
                  {trip.title} - {trip.destination}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-text-secondary">Tone</span>
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value as Tone)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              {toneOptions.map((toneOption) => (
                <option key={toneOption} value={toneOption}>
                  {toneOption}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <GlassInput
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            placeholder="Audience (e.g. honeymoon couples)"
          />
          <GlassInput
            value={callToAction}
            onChange={(event) => setCallToAction(event.target.value)}
            placeholder="Call to action"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {platformOptions.map((platform) => {
            const selected = selectedPlatforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                }`}
              >
                {selected && <Check className="inline mr-1 h-3.5 w-3.5" />}
                {platform}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-text-secondary">
            {selectedTrip
              ? `Generating for ${selectedTrip.title} (${selectedTrip.destination})`
              : "Select a trip to begin"}
          </div>
          <GlassButton
            variant="primary"
            onClick={generateContent}
            loading={generating}
            disabled={generating || !selectedItineraryId}
          >
            <Wand2 className="w-4 h-4" />
            Generate Content
          </GlassButton>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <GlassCard className="p-8 text-center text-text-secondary">
            <Megaphone className="mx-auto mb-3 h-6 w-6 text-blue-500" />
            Generate drafts to populate this board.
          </GlassCard>
        ) : (
          posts.map((post) => {
            const fullCopy = `${post.caption}\n\n${post.hashtags.join(" ")}`;
            return (
              <GlassCard key={post.platform} className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-widest text-primary">{post.platform}</p>
                    <h3 className="text-lg font-semibold text-secondary dark:text-white">
                      {post.creativeAngle}
                    </h3>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {source === "ai" ? "AI draft" : "Fallback draft"}
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {post.caption}
                </p>

                <p className="text-sm text-blue-600 dark:text-blue-300">{post.hashtags.join(" ")}</p>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-text-secondary">Best time: {post.bestTime}</span>
                  <div className="flex items-center gap-2">
                    <GlassButton variant="outline" onClick={() => void copyToClipboard(post.shortCaption)}>
                      <Copy className="w-4 h-4" />
                      Copy Short
                    </GlassButton>
                    <GlassButton variant="primary" onClick={() => void copyToClipboard(fullCopy)}>
                      <Copy className="w-4 h-4" />
                      Copy Full
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
