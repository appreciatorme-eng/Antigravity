import type { ReputationHealthScoreFactors, SentimentLabel } from "./types";
import { HEALTH_SCORE_WEIGHTS, SENTIMENT_THRESHOLDS } from "./constants";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function ratingScore(avgRating: number): number {
  if (avgRating >= 4.5) return 100;
  if (avgRating >= 4.0) return 85;
  if (avgRating >= 3.5) return 65;
  if (avgRating >= 3.0) return 45;
  if (avgRating >= 2.0) return 25;
  return 10;
}

function responseRateScore(rate: number): number {
  const normalized = clamp(rate, 0, 100);
  if (normalized >= 80) return 100;
  if (normalized >= 60) return 80;
  if (normalized >= 40) return 60;
  if (normalized >= 20) return 40;
  return 20;
}

function responseTimeScore(avgHours: number): number {
  if (avgHours <= 2) return 100;
  if (avgHours <= 6) return 85;
  if (avgHours <= 12) return 65;
  if (avgHours <= 24) return 45;
  if (avgHours <= 48) return 25;
  return 10;
}

function velocityScore(reviewsPerMonth: number): number {
  if (reviewsPerMonth >= 20) return 100;
  if (reviewsPerMonth >= 10) return 80;
  if (reviewsPerMonth >= 5) return 60;
  if (reviewsPerMonth >= 2) return 40;
  return 20;
}

function sentimentScore(ratio: number): number {
  const normalized = clamp(ratio, 0, 1);
  return Math.round(normalized * 100);
}

export function calculateHealthScore(factors: ReputationHealthScoreFactors): number {
  const weighted =
    ratingScore(factors.avgRating) * HEALTH_SCORE_WEIGHTS.avgRating +
    responseRateScore(factors.responseRate) * HEALTH_SCORE_WEIGHTS.responseRate +
    responseTimeScore(factors.avgResponseTimeHours) * HEALTH_SCORE_WEIGHTS.avgResponseTime +
    velocityScore(factors.reviewVelocity) * HEALTH_SCORE_WEIGHTS.reviewVelocity +
    sentimentScore(factors.sentimentRatio) * HEALTH_SCORE_WEIGHTS.sentimentRatio;

  return clamp(Math.round(weighted), 0, 100);
}

export function classifySentiment(score: number): SentimentLabel {
  if (score >= SENTIMENT_THRESHOLDS.positive) return "positive";
  if (score <= SENTIMENT_THRESHOLDS.negative) return "negative";
  return "neutral";
}

export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  if (score >= 20) return "Needs Work";
  return "Critical";
}

export function calculateNPS(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const total = scores.length;
  return Math.round(((promoters - detractors) / total) * 100);
}

export function calculateResponseRate(
  totalReviews: number,
  respondedReviews: number
): number {
  if (totalReviews === 0) return 0;
  return Math.round((respondedReviews / totalReviews) * 100);
}

export function calculateAvgRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return Number((sum / ratings.length).toFixed(2));
}

export function getRatingDistribution(ratings: number[]): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    const key = clamp(Math.round(r), 1, 5);
    distribution[key] = (distribution[key] || 0) + 1;
  }
  return distribution;
}
