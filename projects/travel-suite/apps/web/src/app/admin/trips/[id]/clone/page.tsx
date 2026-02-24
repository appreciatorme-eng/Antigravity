"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wand2, CopyPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { useToast } from "@/components/ui/toast";

type CloneStyle = "balanced" | "family" | "adventure" | "luxury" | "budget";

interface TripSnapshot {
  trip: {
    id: string;
    start_date: string | null;
    end_date: string | null;
    itineraries: {
      trip_title: string | null;
      destination: string | null;
      duration_days: number | null;
    } | null;
  } | null;
}

export default function CloneTripPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const tripId = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snapshot, setSnapshot] = useState<TripSnapshot["trip"]>(null);

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [durationDays, setDurationDays] = useState(0);
  const [style, setStyle] = useState<CloneStyle>("balanced");
  const [travelerProfile, setTravelerProfile] = useState("");
  const [includeFocus, setIncludeFocus] = useState("");
  const [avoidFocus, setAvoidFocus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useAi, setUseAi] = useState(true);

  useEffect(() => {
    const loadTrip = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch(`/api/admin/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
        });
        if (!response.ok) throw new Error("Failed to load source trip");
        const payload = (await response.json()) as TripSnapshot;
        const trip = payload.trip || null;
        setSnapshot(trip);

        const sourceTitle = trip?.itineraries?.trip_title || "";
        const sourceDestination = trip?.itineraries?.destination || "";
        const sourceDuration = Number(trip?.itineraries?.duration_days || 0);
        setTitle(sourceTitle ? `${sourceTitle} - Variant` : "");
        setDestination(sourceDestination);
        setDurationDays(sourceDuration || 0);
        setStartDate(trip?.start_date || "");
        setEndDate(trip?.end_date || "");
      } catch (error) {
        toast({
          title: "Load failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      void loadTrip();
    }
  }, [supabase, toast, tripId]);

  const sourceSummary = useMemo(() => {
    const tripTitle = snapshot?.itineraries?.trip_title || "Source trip";
    const destinationLabel = snapshot?.itineraries?.destination || "Unknown destination";
    const durationLabel = snapshot?.itineraries?.duration_days
      ? `${snapshot?.itineraries?.duration_days} days`
      : "duration not set";
    return `${tripTitle} - ${destinationLabel} (${durationLabel})`;
  }, [snapshot]);

  const submitClone = async () => {
    if (!tripId) return;
    setSubmitting(true);
    try {
      const payload = {
        title: title || undefined,
        destination: destination || undefined,
        durationDays: durationDays > 0 ? durationDays : undefined,
        style,
        travelerProfile: travelerProfile || undefined,
        includeFocus: includeFocus
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        avoidFocus: avoidFocus
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        useAi,
      };

      const response = await fetch(`/api/admin/trips/${tripId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Clone failed");

      toast({
        title: "Trip cloned",
        description: result.ai_applied
          ? "AI customization was applied."
          : "Clone created with deterministic customization.",
        variant: "success",
      });
      router.push(`/admin/trips/${result.trip_id}`);
    } catch (error) {
      toast({
        title: "Clone failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/admin/trips/${tripId}`} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Trip
          </Link>
          <h1 className="text-3xl font-serif text-secondary dark:text-white mt-2">AI Trip Clone</h1>
          <p className="text-text-secondary mt-1">Create a customizable variant from an existing trip.</p>
        </div>
      </div>

      <GlassCard className="p-6 space-y-5">
        <div className="rounded-xl bg-slate-100/70 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          <strong>Source:</strong> {loading ? "Loading..." : sourceSummary}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <GlassInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New trip title" />
          <GlassInput
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Destination override"
          />
          <GlassInput
            type="number"
            value={durationDays ? String(durationDays) : ""}
            onChange={(event) => setDurationDays(Number(event.target.value || 0))}
            placeholder="Duration days"
          />
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as CloneStyle)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="balanced">Balanced</option>
            <option value="family">Family</option>
            <option value="adventure">Adventure</option>
            <option value="luxury">Luxury</option>
            <option value="budget">Budget</option>
          </select>
          <GlassInput
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            placeholder="Start date"
          />
          <GlassInput
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            placeholder="End date"
          />
        </div>

        <GlassInput
          value={travelerProfile}
          onChange={(event) => setTravelerProfile(event.target.value)}
          placeholder="Traveler profile (e.g. family with 2 kids, vegetarian, moderate pace)"
        />
        <GlassInput
          value={includeFocus}
          onChange={(event) => setIncludeFocus(event.target.value)}
          placeholder="Must include (comma separated)"
        />
        <GlassInput
          value={avoidFocus}
          onChange={(event) => setAvoidFocus(event.target.value)}
          placeholder="Avoid (comma separated)"
        />

        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={useAi}
            onChange={(event) => setUseAi(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600"
          />
          Use AI theme/summary rewrite if key is configured
        </label>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/admin/trips/${tripId}`}>
            <GlassButton variant="outline">Cancel</GlassButton>
          </Link>
          <GlassButton variant="primary" onClick={submitClone} loading={submitting || loading}>
            <CopyPlus className="w-4 h-4" />
            <Wand2 className="w-4 h-4" />
            Clone Trip
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}
