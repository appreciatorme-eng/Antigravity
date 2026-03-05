"use client";

import { useState, useCallback } from "react";
import {
  Save,
  Plus,
  X,
  Loader2,
  MessageSquare,
  Sparkles,
  Volume2,
} from "lucide-react";
import type {
  ReputationBrandVoice,
  BrandVoiceTone,
  LanguagePreference,
} from "@/lib/reputation/types";

interface BrandVoiceSettingsProps {
  brandVoice?: ReputationBrandVoice;
  onSave: (data: Partial<ReputationBrandVoice>) => void;
}

interface ToneOption {
  value: BrandVoiceTone;
  label: string;
  description: string;
  icon: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: "professional_warm",
    label: "Professional & Warm",
    description: "Business-appropriate yet friendly and approachable tone.",
    icon: "briefcase",
  },
  {
    value: "casual_friendly",
    label: "Casual & Friendly",
    description: "Conversational and relaxed, like talking to a friend.",
    icon: "smile",
  },
  {
    value: "formal",
    label: "Formal",
    description: "Polished and dignified with proper language.",
    icon: "award",
  },
  {
    value: "luxury",
    label: "Luxury",
    description: "Elegant and sophisticated, conveys exclusivity.",
    icon: "crown",
  },
];

const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mixed", label: "Mixed (Auto-detect)" },
];

const TONE_PREVIEW_EXAMPLES: Record<BrandVoiceTone, string> = {
  professional_warm:
    "Thank you so much for sharing your wonderful experience with us! We're truly delighted that our team could make your journey memorable. We look forward to welcoming you again soon.",
  casual_friendly:
    "Hey, thanks a ton for the kind words! So glad you had an amazing time. Can't wait to help you plan your next adventure!",
  formal:
    "We sincerely appreciate your gracious feedback. It is our privilege to have provided you with a memorable travel experience. We would be honoured to serve you again in the future.",
  luxury:
    "We are profoundly grateful for your elegant endorsement. It was our utmost pleasure to curate an extraordinary experience worthy of your distinguished patronage. We eagerly await the opportunity to exceed your expectations once more.",
};

function TagInput({
  tags,
  onTagsChange,
  placeholder,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInputValue("");
  }, [inputValue, tags, onTagsChange]);

  const removeTag = useCallback(
    (index: number) => {
      onTagsChange(tags.filter((_, i) => i !== index));
    },
    [tags, onTagsChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
      if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    },
    [addTag, inputValue, tags.length, removeTag]
  );

  return (
    <div className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 focus-within:ring-1 focus-within:ring-purple-500/50 focus-within:border-purple-500/30 transition-colors">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 text-xs bg-purple-500/15 text-purple-600 border border-purple-500/25 rounded-md px-2 py-0.5"
          >
            {tag}
            <button
              onClick={() => removeTag(i)}
              className="hover:text-gray-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        {inputValue.trim() && (
          <button
            onClick={addTag}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function SampleResponsesList({
  responses,
  onResponsesChange,
}: {
  responses: string[];
  onResponsesChange: (responses: string[]) => void;
}) {
  const [newResponse, setNewResponse] = useState("");

  const addResponse = useCallback(() => {
    const trimmed = newResponse.trim();
    if (trimmed) {
      onResponsesChange([...responses, trimmed]);
      setNewResponse("");
    }
  }, [newResponse, responses, onResponsesChange]);

  const removeResponse = useCallback(
    (index: number) => {
      onResponsesChange(responses.filter((_, i) => i !== index));
    },
    [responses, onResponsesChange]
  );

  return (
    <div className="space-y-2">
      {responses.map((response, i) => (
        <div
          key={i}
          className="relative group rounded-lg bg-gray-50 border border-gray-200 p-3"
        >
          <p className="text-xs text-gray-600 leading-relaxed pr-6">
            {response}
          </p>
          <button
            onClick={() => removeResponse(i)}
            className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <textarea
          value={newResponse}
          onChange={(e) => setNewResponse(e.target.value)}
          placeholder="Paste a sample response here..."
          rows={3}
          className="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
        />
        <button
          onClick={addResponse}
          disabled={!newResponse.trim()}
          className="self-end px-3 py-2 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function BrandVoiceSettings({
  brandVoice,
  onSave,
}: BrandVoiceSettingsProps) {
  const [tone, setTone] = useState<BrandVoiceTone>(
    brandVoice?.tone ?? "professional_warm"
  );
  const [languagePreference, setLanguagePreference] =
    useState<LanguagePreference>(brandVoice?.language_preference ?? "en");
  const [ownerName, setOwnerName] = useState(brandVoice?.owner_name ?? "");
  const [signOff, setSignOff] = useState(brandVoice?.sign_off ?? "");
  const [keyPhrases, setKeyPhrases] = useState<string[]>(
    brandVoice?.key_phrases ?? []
  );
  const [avoidPhrases, setAvoidPhrases] = useState<string[]>(
    brandVoice?.avoid_phrases ?? []
  );
  const [sampleResponses, setSampleResponses] = useState<string[]>(
    brandVoice?.sample_responses ?? []
  );
  const [autoRespondPositive, setAutoRespondPositive] = useState(
    brandVoice?.auto_respond_positive ?? false
  );
  const [autoRespondMinRating, setAutoRespondMinRating] = useState(
    brandVoice?.auto_respond_min_rating ?? 4
  );
  const [escalationThreshold, setEscalationThreshold] = useState(
    brandVoice?.escalation_threshold ?? 2
  );
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      onSave({
        tone,
        language_preference: languagePreference,
        owner_name: ownerName.trim() || null,
        sign_off: signOff.trim() || null,
        key_phrases: keyPhrases,
        avoid_phrases: avoidPhrases,
        sample_responses: sampleResponses,
        auto_respond_positive: autoRespondPositive,
        auto_respond_min_rating: autoRespondMinRating,
        escalation_threshold: escalationThreshold,
      });
    } finally {
      setSaving(false);
    }
  }, [
    tone,
    languagePreference,
    ownerName,
    signOff,
    keyPhrases,
    avoidPhrases,
    sampleResponses,
    autoRespondPositive,
    autoRespondMinRating,
    escalationThreshold,
    onSave,
  ]);

  return (
    <div className="space-y-8">
      {/* Tone Selector */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-600" />
          Response Tone
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTone(option.value)}
              className={`text-left rounded-xl p-4 border transition-all ${
                tone === option.value
                  ? "bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/20"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  tone === option.value ? "text-purple-600" : "text-gray-600"
                }`}
              >
                {option.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Language Preference */}
      <section className="space-y-3">
        <label className="text-sm font-semibold text-gray-900">
          Language Preference
        </label>
        <div className="flex items-center gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setLanguagePreference(lang.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                languagePreference === lang.value
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-600"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Owner Name */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Owner Name</label>
        <p className="text-xs text-gray-500">
          Name that will sign off on responses.
        </p>
        <input
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="e.g., Rajesh Kumar, Owner"
          className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-gray-400"
        />
      </section>

      {/* Sign-off */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">
          Sign-off Text
        </label>
        <p className="text-xs text-gray-500">
          Closing text appended to every response.
        </p>
        <input
          value={signOff}
          onChange={(e) => setSignOff(e.target.value)}
          placeholder="e.g., Warm regards, Team TravelCo"
          className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-gray-400"
        />
      </section>

      {/* Key Phrases */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">Key Phrases</label>
        <p className="text-xs text-gray-500">
          Phrases the AI should try to include in responses.
        </p>
        <TagInput
          tags={keyPhrases}
          onTagsChange={setKeyPhrases}
          placeholder='e.g., "personalized experience", "our valued guests"'
        />
      </section>

      {/* Avoid Phrases */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">
          Avoid Phrases
        </label>
        <p className="text-xs text-gray-500">
          Phrases the AI should never use.
        </p>
        <TagInput
          tags={avoidPhrases}
          onTagsChange={setAvoidPhrases}
          placeholder='e.g., "sorry for the inconvenience", "budget"'
        />
      </section>

      {/* Sample Responses */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          Sample Responses
        </label>
        <p className="text-xs text-gray-500">
          Provide examples of ideal responses. The AI learns from these.
        </p>
        <SampleResponsesList
          responses={sampleResponses}
          onResponsesChange={setSampleResponses}
        />
      </section>

      {/* Auto-response toggle */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Auto-respond to Positive Reviews
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Automatically generate and post responses for high-rated reviews.
            </p>
          </div>
          <button
            onClick={() => setAutoRespondPositive(!autoRespondPositive)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              autoRespondPositive ? "bg-purple-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                autoRespondPositive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {autoRespondPositive && (
          <div className="space-y-2 pl-1">
            <label className="text-xs text-gray-500">
              Minimum rating for auto-response: {autoRespondMinRating} stars
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={autoRespondMinRating}
              onChange={(e) =>
                setAutoRespondMinRating(Number(e.target.value))
              }
              className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1 star</span>
              <span>5 stars</span>
            </div>
          </div>
        )}
      </section>

      {/* Escalation threshold */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-gray-900">
          Escalation Threshold
        </label>
        <p className="text-xs text-gray-500">
          Reviews at or below this rating will be flagged for manual attention.
          Currently: {escalationThreshold} star{escalationThreshold !== 1 ? "s" : ""} and below.
        </p>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={escalationThreshold}
          onChange={(e) =>
            setEscalationThreshold(Number(e.target.value))
          }
          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-purple-500"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>1 star</span>
          <span>5 stars</span>
        </div>
      </section>

      {/* Preview */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          Tone Preview
        </h3>
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
            Example in {TONE_OPTIONS.find((t) => t.value === tone)?.label ?? tone} tone:
          </p>
          <p className="text-sm text-gray-600 leading-relaxed italic">
            &ldquo;{TONE_PREVIEW_EXAMPLES[tone]}&rdquo;
          </p>
          {signOff && (
            <p className="text-sm text-gray-500 mt-2">{signOff}</p>
          )}
          {ownerName && (
            <p className="text-xs text-gray-500 mt-1">- {ownerName}</p>
          )}
        </div>
      </section>

      {/* Save button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-medium transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Brand Voice Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
