'use client';

import { useEffect, useState } from 'react';
import {
  getOverlappingAvailability,
  type OperatorUnavailability,
} from '@/features/calendar/availability';

export interface UseAvailabilityCheckReturn {
  conflicts: OperatorUnavailability[];
  loading: boolean;
  overrideAccepted: boolean;
  acceptOverride: () => void;
}

export function useAvailabilityCheck(
  tripStartDate: string,
  tripEndDate: string,
): UseAvailabilityCheckReturn {
  const [conflicts, setConflicts] = useState<OperatorUnavailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [overrideAccepted, setOverrideAccepted] = useState(false);

  const hasValidDates = Boolean(tripStartDate && tripEndDate);

  useEffect(() => {
    if (!hasValidDates) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      from: tripStartDate,
      to: tripEndDate,
    });

    void Promise.resolve()
      .then(() => {
        setLoading(true);
        setOverrideAccepted(false);
        return fetch(`/api/availability?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
      })
      .then((response) =>
        response.json().then((payload) => ({ ok: response.ok, payload })),
      )
      .then(({ ok, payload }) => {
        if (!ok) {
          throw new Error(payload?.error || 'Failed to check availability');
        }
        const rows = Array.isArray(payload?.data)
          ? (payload.data as OperatorUnavailability[])
          : [];
        setConflicts(
          getOverlappingAvailability(rows, tripStartDate, tripEndDate),
        );
      })
      .catch((fetchError) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return;
        }
        console.error('Availability check failed:', fetchError);
        setConflicts([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [hasValidDates, tripStartDate, tripEndDate]);

  return {
    conflicts,
    loading,
    overrideAccepted,
    acceptOverride: () => setOverrideAccepted(true),
  };
}
