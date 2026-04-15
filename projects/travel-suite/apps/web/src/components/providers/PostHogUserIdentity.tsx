"use client";

/**
 * PostHogUserIdentity — subscribes to Supabase auth state and keeps PostHog's
 * user identity + org group in sync. Enables per-user and per-org analytics
 * without requiring individual call sites to identify.
 *
 * Mounted once in AppProviders, renders nothing.
 */

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { createClient } from "@/lib/supabase/client";

export function PostHogUserIdentity() {
    const posthog = usePostHog();

    useEffect(() => {
        if (!posthog) return;

        const supabase = createClient();

        async function identify(userId: string, email: string | undefined) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, role, organization_id, organizations(name, subscription_tier)")
                .eq("id", userId)
                .single();

            posthog.identify(userId, {
                email,
                name: profile?.full_name ?? undefined,
                role: profile?.role ?? undefined,
                organization_id: profile?.organization_id ?? undefined,
            });

            const org = profile?.organizations as { name?: string; subscription_tier?: string | null } | null;
            if (profile?.organization_id && org) {
                posthog.group("organization", profile.organization_id, {
                    name: org.name ?? profile.organization_id,
                    subscription_tier: org.subscription_tier ?? "free",
                });
            }
        }

        // Identify on page load if session already exists
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) void identify(user.id, user.email);
        });

        // Keep in sync with sign-in / sign-out
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                void identify(session.user.id, session.user.email);
            } else {
                posthog.reset();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [posthog]);

    return null;
}
