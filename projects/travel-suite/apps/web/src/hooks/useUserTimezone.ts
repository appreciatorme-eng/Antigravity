'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  COMMON_TIMEZONES,
  DEFAULT_APP_TIMEZONE,
  TIMEZONE_STORAGE_KEY,
  resolveAppTimezone,
} from '@/lib/date/tz';

export function useUserTimezone() {
  const [timezone, setTimezone] = useState(DEFAULT_APP_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const browserTimezone = resolveAppTimezone();
    const storedTimezone =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(TIMEZONE_STORAGE_KEY)
        : null;
    const fallbackTimezone = resolveAppTimezone(storedTimezone || browserTimezone);

    if (isMounted) {
      setTimezone(fallbackTimezone);
    }

    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        const metadataTimezone =
          typeof data.user?.user_metadata?.timezone === 'string'
            ? data.user.user_metadata.timezone
            : null;
        const nextTimezone = resolveAppTimezone(metadataTimezone || storedTimezone || browserTimezone);

        if (!isMounted) return;

        setTimezone(nextTimezone);
        window.localStorage.setItem(TIMEZONE_STORAGE_KEY, nextTimezone);
      })
      .catch(() => {
        // Keep the best available client-side fallback if auth metadata is unavailable.
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TIMEZONE_STORAGE_KEY || !event.newValue) return;
      setTimezone(resolveAppTimezone(event.newValue));
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const saveTimezone = useCallback(async (nextTimezone: string) => {
    const resolvedTimezone = resolveAppTimezone(nextTimezone);
    setSaving(true);
    setTimezone(resolvedTimezone);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TIMEZONE_STORAGE_KEY, resolvedTimezone);
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          timezone: resolvedTimezone,
        },
      });

      if (error) {
        throw error;
      }

      return resolvedTimezone;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    timezone,
    loading,
    saving,
    saveTimezone,
    timezoneOptions: COMMON_TIMEZONES,
  };
}
