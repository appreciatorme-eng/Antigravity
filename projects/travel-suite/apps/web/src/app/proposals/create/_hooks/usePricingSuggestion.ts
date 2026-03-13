'use client';

import { useEffect, useState } from 'react';
import type { PricingSuggestion, TourTemplate } from '../_types';

export interface UsePricingSuggestionReturn {
  suggestion: PricingSuggestion | null;
  loading: boolean;
}

export function usePricingSuggestion(
  selectedTemplateId: string,
  templates: TourTemplate[],
): UsePricingSuggestionReturn {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const template = templates.find((item) => item.id === selectedTemplateId);
  const destination = template?.destination ?? null;
  const durationDays = template?.duration_days ?? null;
  const hasValidTemplate = Boolean(destination && durationDays);

  useEffect(() => {
    if (!hasValidTemplate || !destination || !durationDays) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      destination,
      durationDays: String(durationDays),
      pax: '2',
    });

    void Promise.resolve()
      .then(() => {
        setLoading(true);
        return fetch(`/api/ai/pricing-suggestion?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
      })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok) {
          throw new Error(payload?.error || 'Failed to load pricing guidance');
        }
        setSuggestion(payload?.data ?? null);
      })
      .catch((fetchError) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return;
        }
        setSuggestion(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [hasValidTemplate, destination, durationDays]);

  return {
    suggestion,
    loading,
  };
}
