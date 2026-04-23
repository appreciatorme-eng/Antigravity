"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { authedFetch } from "@/lib/api/authed-fetch";
import { createClient } from "@/lib/supabase/client";
import { sanitizeInternalNext } from "@/lib/routing/safe-next";

/**
 * First-login interstitial for OAuth users AND re-acceptance modal for
 * existing users when a gated legal document version bumps.
 *
 * The middleware redirects any authenticated user whose
 * `profile.terms_version_accepted` or `privacy_version_accepted` does not
 * match `LEGAL_VERSIONS` here. We POST to `/api/auth/record-acceptance`
 * which validates the session and writes a `legal_acceptances` row.
 *
 * Method is inferred from whether the user has any prior acceptance:
 *   - none  → "oauth_interstitial"  (first-ever acceptance)
 *   - some  → "reacceptance_modal"  (version bump)
 */
export default function AcceptTermsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextParam = searchParams.get("next");
    const next = sanitizeInternalNext(nextParam, "/admin");

    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<
        "oauth_interstitial" | "reacceptance_modal"
    >("oauth_interstitial");
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (cancelled) return;

            if (!user) {
                router.replace(`/auth?next=${encodeURIComponent(next)}`);
                return;
            }

            setEmail(user.email ?? null);

            // Decide whether this is a first-acceptance (OAuth) or a bump
            // (existing user with stale versions).
            // terms_version_accepted and privacy_version_accepted are new columns
            // added by migration 20260417000000 — not yet in generated types.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile } = await (supabase as any)
                .from("profiles")
                .select("terms_version_accepted, privacy_version_accepted")
                .eq("id", user.id)
                .maybeSingle() as { data: { terms_version_accepted: string | null; privacy_version_accepted: string | null } | null };

            if (cancelled) return;

            const hasPrior =
                !!profile?.terms_version_accepted || !!profile?.privacy_version_accepted;
            setMethod(hasPrior ? "reacceptance_modal" : "oauth_interstitial");
        })();

        return () => {
            cancelled = true;
        };
    }, [router, next]);

    async function handleAccept() {
        if (!accepted || submitting) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await authedFetch("/api/auth/record-acceptance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    terms_accepted: true,
                    privacy_accepted: true,
                    age_confirmed: true,
                    method,
                }),
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(
                    payload?.error || "Could not record your acceptance. Please try again.",
                );
            }

            router.replace(next);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSubmitting(false);
        }
    }

    async function handleDecline() {
        // If the user declines, sign them out and send back to /auth.
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/auth");
    }

    return (
        <div className="min-h-dvh w-full bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 sm:p-8 shadow-2xl">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {method === "reacceptance_modal"
                        ? "We've updated our Terms"
                        : "Before you continue"}
                </h1>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                    {method === "reacceptance_modal" ? (
                        <>
                            Our <strong>Terms of Service</strong> and/or{" "}
                            <strong>Privacy Policy</strong> have changed. To keep using TripBuilt
                            please review and accept the latest versions.
                        </>
                    ) : (
                        <>
                            Welcome{email ? `, ${email}` : ""}. Before we set up your workspace,
                            please review and accept our policies. These govern your use of
                            TripBuilt and are legally binding under Indian law.
                        </>
                    )}
                </p>

                <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white/80 leading-relaxed space-y-2">
                    <p>
                        You are agreeing to the latest versions of:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 marker:text-emerald-400">
                        <li>
                            <Link
                                href="/terms"
                                target="_blank"
                                className="underline text-emerald-400 hover:text-emerald-300"
                            >
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/privacy"
                                target="_blank"
                                className="underline text-emerald-400 hover:text-emerald-300"
                            >
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/refund-policy"
                                target="_blank"
                                className="underline text-emerald-400 hover:text-emerald-300"
                            >
                                Refund Policy
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/acceptable-use"
                                target="_blank"
                                className="underline text-emerald-400 hover:text-emerald-300"
                            >
                                Acceptable Use Policy
                            </Link>
                        </li>
                    </ul>
                    <p className="text-xs text-white/60 pt-2">
                        These documents are governed by the laws of India with exclusive
                        jurisdiction in Hyderabad. By accepting, you confirm you are{" "}
                        <strong>18 years or older</strong> and have legal capacity to enter into
                        this contract under the Indian Contract Act, 1872.
                    </p>
                </div>

                <div className="mt-6 flex items-start gap-3">
                    <Checkbox
                        id="accept-terms-checkbox"
                        checked={accepted}
                        onCheckedChange={(v) => setAccepted(v === true)}
                        disabled={submitting}
                    />
                    <label
                        htmlFor="accept-terms-checkbox"
                        className="text-sm text-white/85 leading-relaxed cursor-pointer select-none"
                    >
                        I confirm I am 18+ and I have read and agree to the Terms of Service,
                        Privacy Policy, Refund Policy, and Acceptable Use Policy of TripBuilt.
                    </label>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                    >
                        {error}
                    </div>
                )}

                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <button
                        type="button"
                        onClick={handleDecline}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-md border border-white/15 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50 min-h-[44px]"
                    >
                        Decline & sign out
                    </button>
                    <button
                        type="button"
                        onClick={handleAccept}
                        disabled={!accepted || submitting}
                        className="px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed text-sm font-medium text-black transition-colors min-h-[44px]"
                    >
                        {submitting ? "Saving…" : "Accept & continue"}
                    </button>
                </div>
            </div>
        </div>
    );
}
