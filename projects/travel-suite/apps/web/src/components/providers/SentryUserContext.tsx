"use client";

/**
 * SentryUserContext — subscribes to Supabase auth state and keeps Sentry's
 * user identity in sync. This ensures every error in Sentry includes the
 * organization ID and email of the customer who experienced it.
 *
 * Mounted once in AppProviders, renders nothing.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import * as Sentry from "@sentry/nextjs";

export function SentryUserContext() {
    useEffect(() => {
        const supabase = createClient();

        // Set initial user if a session already exists (e.g. page refresh)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                Sentry.setUser({ id: user.id, email: user.email ?? undefined });
            }
        });

        // Keep in sync with auth state changes (sign-in, sign-out, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                Sentry.setUser({
                    id: session.user.id,
                    email: session.user.email ?? undefined,
                });
            } else {
                Sentry.setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return null;
}
