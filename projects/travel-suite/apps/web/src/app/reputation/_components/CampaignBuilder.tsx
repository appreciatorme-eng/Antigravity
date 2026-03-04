"use client";

import { useState } from "react";
import type {
  CampaignType,
  TriggerEvent,
  PromoterAction,
  DetractorAction,
  CreateCampaignInput,
  ReputationReviewCampaign,
} from "@/lib/reputation/types";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/reputation/constants";

interface CampaignBuilderProps {
  campaign?: ReputationReviewCampaign;
  onSave: (campaign: CreateCampaignInput) => void;
  onCancel: () => void;
}

const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: "post_trip", label: CAMPAIGN_TYPE_LABELS.post_trip },
  { value: "mid_trip_checkin", label: CAMPAIGN_TYPE_LABELS.mid_trip_checkin },
  { value: "manual_blast", label: CAMPAIGN_TYPE_LABELS.manual_blast },
  { value: "nps_survey", label: CAMPAIGN_TYPE_LABELS.nps_survey },
];

const TRIGGER_EVENTS: { value: TriggerEvent; label: string }[] = [
  { value: "trip_completed", label: "Trip Completed" },
  { value: "trip_day_2", label: "Trip Day 2 (Mid-trip)" },
  { value: "manual", label: "Manual Trigger" },
];

const PROMOTER_ACTIONS: { value: PromoterAction; label: string }[] = [
  { value: "google_review_link", label: "Google Review Link" },
  { value: "tripadvisor_link", label: "TripAdvisor Link" },
  { value: "makemytrip_link", label: "MakeMyTrip Link" },
  { value: "custom_link", label: "Custom Review Link" },
];

const DETRACTOR_ACTIONS: { value: DetractorAction; label: string }[] = [
  { value: "internal_feedback", label: "Internal Feedback (Private)" },
  { value: "private_form", label: "Private Feedback Form" },
  { value: "escalate_owner", label: "Escalate to Owner" },
];

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

export default function CampaignBuilder({
  campaign,
  onSave,
  onCancel,
}: CampaignBuilderProps) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [campaignType, setCampaignType] = useState<CampaignType>(
    campaign?.campaign_type ?? "post_trip"
  );
  const [triggerEvent, setTriggerEvent] = useState<TriggerEvent>(
    campaign?.trigger_event ?? "trip_completed"
  );
  const [triggerDelayHours, setTriggerDelayHours] = useState(
    campaign?.trigger_delay_hours ?? 24
  );
  const [npsQuestion, setNpsQuestion] = useState(
    campaign?.nps_question ?? "How likely are you to recommend us to a friend?"
  );
  const [npsFollowupQuestion, setNpsFollowupQuestion] = useState(
    campaign?.nps_followup_question ?? "What could we do better?"
  );
  const [promoterThreshold, setPromoterThreshold] = useState(
    campaign?.promoter_threshold ?? 9
  );
  const [passiveThreshold, setPassiveThreshold] = useState(
    campaign?.passive_threshold ?? 7
  );
  const [promoterAction, setPromoterAction] = useState<PromoterAction>(
    campaign?.promoter_action ?? "google_review_link"
  );
  const [promoterReviewUrl, setPromoterReviewUrl] = useState(
    campaign?.promoter_review_url ?? ""
  );
  const [detractorAction, setDetractorAction] = useState<DetractorAction>(
    campaign?.detractor_action ?? "internal_feedback"
  );
  const [channelSequence, setChannelSequence] = useState<string[]>(
    campaign?.channel_sequence ?? ["whatsapp"]
  );

  function handleChannelToggle(channel: string) {
    setChannelSequence((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input: CreateCampaignInput = {
      name: name.trim(),
      campaign_type: campaignType,
      trigger_event: triggerEvent,
      trigger_delay_hours: triggerDelayHours,
      promoter_threshold: promoterThreshold,
      passive_threshold: passiveThreshold,
      promoter_action: promoterAction,
      promoter_review_url: promoterReviewUrl || undefined,
      detractor_action: detractorAction,
      channel_sequence: channelSequence,
      nps_question: npsQuestion,
      nps_followup_question: npsFollowupQuestion,
    };

    onSave(input);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campaign Name */}
      <div>
        <label
          htmlFor="campaign-name"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Campaign Name
        </label>
        <input
          id="campaign-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Post-Trip Rajasthan Review"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {/* Campaign Type + Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="campaign-type"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Campaign Type
          </label>
          <select
            id="campaign-type"
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value as CampaignType)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
          >
            {CAMPAIGN_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="trigger-event"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Trigger Event
          </label>
          <select
            id="trigger-event"
            value={triggerEvent}
            onChange={(e) => setTriggerEvent(e.target.value as TriggerEvent)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
          >
            {TRIGGER_EVENTS.map((te) => (
              <option key={te.value} value={te.value}>
                {te.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trigger Delay */}
      <div>
        <label
          htmlFor="trigger-delay"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Delay After Trigger (hours)
        </label>
        <input
          id="trigger-delay"
          type="number"
          min={0}
          max={168}
          value={triggerDelayHours}
          onChange={(e) => setTriggerDelayHours(Number(e.target.value))}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Wait this many hours after the trigger event before sending the survey
        </p>
      </div>

      {/* NPS Configuration */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">
          NPS Question Configuration
        </h3>

        <div>
          <label
            htmlFor="nps-question"
            className="block text-xs font-medium text-zinc-400 mb-1"
          >
            NPS Question
          </label>
          <input
            id="nps-question"
            type="text"
            value={npsQuestion}
            onChange={(e) => setNpsQuestion(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="nps-followup"
            className="block text-xs font-medium text-zinc-400 mb-1"
          >
            Follow-up Question
          </label>
          <input
            id="nps-followup"
            type="text"
            value={npsFollowupQuestion}
            onChange={(e) => setNpsFollowupQuestion(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Routing Thresholds */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">
          NPS Score Routing
        </h3>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="promoter-threshold"
              className="text-xs font-medium text-zinc-400"
            >
              Promoter Threshold
            </label>
            <span className="text-xs font-bold text-emerald-400">
              {promoterThreshold}+
            </span>
          </div>
          <input
            id="promoter-threshold"
            type="range"
            min={7}
            max={10}
            value={promoterThreshold}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPromoterThreshold(val);
              if (passiveThreshold >= val) {
                setPassiveThreshold(val - 1);
              }
            }}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>7</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="passive-threshold"
              className="text-xs font-medium text-zinc-400"
            >
              Passive Threshold
            </label>
            <span className="text-xs font-bold text-amber-400">
              {passiveThreshold}-{promoterThreshold - 1}
            </span>
          </div>
          <input
            id="passive-threshold"
            type="range"
            min={5}
            max={9}
            value={passiveThreshold}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPassiveThreshold(val);
              if (promoterThreshold <= val) {
                setPromoterThreshold(val + 1);
              }
            }}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>5</span>
            <span>9</span>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Detractors: 1-{passiveThreshold - 1} | Passive:{" "}
          {passiveThreshold}-{promoterThreshold - 1} | Promoters:{" "}
          {promoterThreshold}-10
        </p>

        {/* Visual preview of routing */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
            <p className="font-bold text-red-400">Detractor</p>
            <p className="text-zinc-500">
              1-{passiveThreshold - 1}
            </p>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
            <p className="font-bold text-amber-400">Passive</p>
            <p className="text-zinc-500">
              {passiveThreshold}-{promoterThreshold - 1}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
            <p className="font-bold text-emerald-400">Promoter</p>
            <p className="text-zinc-500">{promoterThreshold}-10</p>
          </div>
        </div>
      </div>

      {/* Promoter + Detractor Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="promoter-action"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Promoter Action
          </label>
          <select
            id="promoter-action"
            value={promoterAction}
            onChange={(e) =>
              setPromoterAction(e.target.value as PromoterAction)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
          >
            {PROMOTER_ACTIONS.map((pa) => (
              <option key={pa.value} value={pa.value}>
                {pa.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="detractor-action"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Detractor Action
          </label>
          <select
            id="detractor-action"
            value={detractorAction}
            onChange={(e) =>
              setDetractorAction(e.target.value as DetractorAction)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
          >
            {DETRACTOR_ACTIONS.map((da) => (
              <option key={da.value} value={da.value}>
                {da.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Review URL */}
      {promoterAction === "custom_link" && (
        <div>
          <label
            htmlFor="custom-review-url"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Custom Review URL
          </label>
          <input
            id="custom-review-url"
            type="url"
            value={promoterReviewUrl}
            onChange={(e) => setPromoterReviewUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-colors"
          />
        </div>
      )}

      {/* Channel Sequence */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Delivery Channels
        </label>
        <div className="flex gap-3">
          {CHANNELS.map((ch) => {
            const isActive = channelSequence.includes(ch.value);
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => handleChannelToggle(ch.value)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600"
                  }
                `}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-zinc-600"
                  }`}
                >
                  {isActive && (
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">
          Flow Preview
        </h3>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5">
            <span className="text-blue-400 font-medium">
              {TRIGGER_EVENTS.find((t) => t.value === triggerEvent)?.label}
            </span>
          </div>
          <svg
            className="w-4 h-4 text-zinc-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <div className="rounded-lg bg-zinc-700/50 border border-zinc-600 px-3 py-1.5">
            <span className="text-zinc-300 font-medium">
              {triggerDelayHours}h delay
            </span>
          </div>
          <svg
            className="w-4 h-4 text-zinc-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5">
            <span className="text-purple-400 font-medium">NPS Survey</span>
          </div>
          <svg
            className="w-4 h-4 text-zinc-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
            <span className="text-emerald-400 font-medium">Route</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || channelSequence.length === 0}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
        >
          {campaign ? "Update Campaign" : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}
