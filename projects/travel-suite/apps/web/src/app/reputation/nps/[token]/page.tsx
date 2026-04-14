"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface NPSFormData {
  nps_question: string;
  nps_followup_question: string;
  client_name: string | null;
  trip: { name: string; destination: string } | null;
  organization_name: string | null;
  promoter_threshold: number;
  passive_threshold: number;
}

interface SubmitResult {
  success: boolean;
  routed_to: string;
  review_link?: string;
}

type PageState = "loading" | "form" | "submitting" | "success" | "error";

const SCORE_LABELS: Record<number, string> = {
  1: "Very unlikely",
  2: "Unlikely",
  3: "Unlikely",
  4: "Somewhat unlikely",
  5: "Neutral",
  6: "Somewhat likely",
  7: "Likely",
  8: "Likely",
  9: "Very likely",
  10: "Extremely likely",
};

function getScoreColor(score: number): string {
  if (score >= 9) return "bg-emerald-500 text-white border-emerald-500";
  if (score >= 7) return "bg-amber-500 text-white border-amber-500";
  return "bg-red-500 text-white border-red-500";
}

function getScoreRingColor(score: number): string {
  if (score >= 9) return "ring-emerald-500/30";
  if (score >= 7) return "ring-amber-500/30";
  return "ring-red-500/30";
}

function getScoreEmoji(score: number): string {
  if (score >= 9) return "heart";
  if (score >= 7) return "neutral";
  return "sad";
}

function ScoreEmoji({ type }: { type: string }) {
  if (type === "heart") {
    return (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }
  if (type === "neutral") {
    return (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="15" x2="16" y2="15" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    );
  }
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

export default function NPSSurveyPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [formData, setFormData] = useState<NPSFormData | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFormData() {
      try {
        const res = await fetch(`/api/reputation/nps/${token}`);

        if (cancelled) return;

        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || "Unable to load survey");
          setPageState("error");
          return;
        }

        const data: NPSFormData = await res.json();
        setFormData(data);
        setPageState("form");
      } catch {
        if (!cancelled) {
          setErrorMessage("Unable to connect. Please try again.");
          setPageState("error");
        }
      }
    }

    loadFormData();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit() {
    if (selectedScore === null) return;

    setPageState("submitting");

    try {
      const res = await fetch("/api/reputation/nps/submit", {
        // eslint-disable-next-line no-restricted-syntax -- pre-auth route, no Bearer token available
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          score: selectedScore,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to submit");
        setPageState("error");
        return;
      }

      const result: SubmitResult = await res.json();
      setSubmitResult(result);
      setPageState("success");
    } catch {
      setErrorMessage("Unable to connect. Please try again.");
      setPageState("error");
    }
  }

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Survey Unavailable
          </h1>
          <p className="text-gray-500 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success" && submitResult) {
    const isPromoter = submitResult.routed_to === "google_review" ||
      submitResult.routed_to === "tripadvisor_review" ||
      submitResult.routed_to === "makemytrip_review";

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thank you!
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isPromoter
              ? "We're thrilled you had a great experience! It would mean a lot to us if you could share your thoughts publicly."
              : "Your feedback is incredibly valuable to us. We'll use it to improve our service."}
          </p>

          {isPromoter && submitResult.review_link && (
            <a
              href={submitResult.review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-emerald-500 text-white text-base font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Leave a Public Review
            </a>
          )}
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {formData?.organization_name && (
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
              {formData.organization_name}
            </p>
          )}
          {formData?.client_name && (
            <p className="text-sm text-gray-500 mb-1">
              Hi {formData.client_name.split(" ")[0]},
            </p>
          )}
          {formData?.trip && formData.trip.name && (
            <p className="text-xs text-gray-400 mb-4">
              Regarding your trip: {formData.trip.name}
              {formData.trip.destination
                ? ` to ${formData.trip.destination}`
                : ""}
            </p>
          )}
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {formData?.nps_question ||
              "How likely are you to recommend us to a friend?"}
          </h1>
        </div>

        {/* NPS Score Grid */}
        <div className="mb-6">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
              const isSelected = selectedScore === score;
              const baseColor =
                score >= 9
                  ? "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                  : score >= 7
                    ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                    : "border-red-200 hover:border-red-400 hover:bg-red-50";

              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelectedScore(score)}
                  className={`
                    relative flex flex-col items-center justify-center
                    w-full aspect-square rounded-2xl border-2 transition-all duration-150
                    ${
                      isSelected
                        ? `${getScoreColor(score)} ring-4 ${getScoreRingColor(score)} scale-110`
                        : `bg-white ${baseColor} text-gray-700`
                    }
                  `}
                >
                  <span className="text-lg font-bold">{score}</span>
                </button>
              );
            })}
          </div>

          {/* Scale labels */}
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-red-400 font-medium">
              Not likely
            </span>
            <span className="text-[10px] text-emerald-500 font-medium">
              Very likely
            </span>
          </div>
        </div>

        {/* Selected score indicator */}
        {selectedScore !== null && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100">
              <ScoreEmoji type={getScoreEmoji(selectedScore)} />
              <span className="text-sm text-gray-600 font-medium">
                {SCORE_LABELS[selectedScore]}
              </span>
            </div>
          </div>
        )}

        {/* Feedback textarea */}
        {selectedScore !== null && (
          <div className="mb-6">
            <label
              htmlFor="nps-feedback"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {formData?.nps_followup_question || "What could we do better?"}
            </label>
            <textarea
              id="nps-feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your feedback helps us improve (optional)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
            />
          </div>
        )}

        {/* Submit button */}
        {selectedScore !== null && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pageState === "submitting"}
            className="w-full py-4 px-6 rounded-2xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/10"
          >
            {pageState === "submitting" ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Feedback"
            )}
          </button>
        )}

        {/* Privacy notice */}
        <p className="text-center text-[10px] text-gray-400 mt-6">
          Your response is confidential and helps us improve our service.
        </p>
      </div>
    </div>
  );
}
