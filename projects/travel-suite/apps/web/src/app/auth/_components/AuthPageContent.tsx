"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Mail,
    Lock,
    User,
    Loader2,
    Plane,
    MapPin,
    Globe,
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "signup";

const FEATURES = [
    { icon: ClipboardList, label: "Build and send proposals in minutes" },
    { icon: MapPin, label: "Manage bookings, invoices, and itineraries" },
    { icon: Globe, label: "GST-ready, built for Indian tour operators" },
] as const;

function AuthPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const requestedNext = searchParams.get("next");
    const nextPath =
        requestedNext &&
        requestedNext.startsWith("/") &&
        !requestedNext.startsWith("//")
            ? requestedNext
            : "/admin";

    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

    const validateEmail = (value: string): string | undefined => {
        if (!value) return "Please enter a valid email";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email";
        return undefined;
    };

    const handleEmailBlur = () => {
        const emailError = validateEmail(email);
        setFieldErrors((prev) => ({ ...prev, email: emailError }));
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateEmail(email);
        const passwordError = !password ? "Password is required" : undefined;
        const newFieldErrors = { email: emailError, password: passwordError };
        setFieldErrors(newFieldErrors);

        if (emailError || passwordError) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                setMessage("Check your email for a confirmation link.");
            } else {
                const response = await fetch("/api/auth/password-login", {
                    // eslint-disable-next-line no-restricted-syntax -- pre-auth route, no Bearer token available
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload.error || "Failed to sign in");
                }
                if (!requestedNext) {
                    const {
                        data: { user: loggedInUser },
                    } = await supabase.auth.getUser();
                    if (loggedInUser) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("role")
                            .eq("id", loggedInUser.id)
                            .single();
                        if (profile?.role === "super_admin") {
                            router.push("/god");
                            router.refresh();
                            return;
                        }
                    }
                }
                router.push(nextPath);
                router.refresh();
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An error occurred";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[100dvh] flex bg-[#06100d] relative overflow-hidden">
            {/* Ambient radial glows */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none overflow-hidden"
            >
                <div
                    className="absolute -top-24 left-[30%] w-[700px] h-[700px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(0,208,132,0.08) 0%, transparent 65%)",
                    }}
                />
                <div
                    className="absolute bottom-0 right-[10%] w-[500px] h-[500px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(0,160,100,0.06) 0%, transparent 70%)",
                    }}
                />
                <div
                    className="absolute top-[40%] -left-32 w-[400px] h-[400px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(0,100,70,0.12) 0%, transparent 70%)",
                    }}
                />
            </div>

            {/* SVG noise texture */}
            <svg
                aria-hidden
                className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.022]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <filter id="tb-noise">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="4"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#tb-noise)" />
            </svg>

            {/* ── Left brand panel (lg+) ── */}
            <aside className="hidden lg:flex flex-col justify-between w-[44%] p-16 relative z-10 border-r border-white/[0.05]">
                {/* Wordmark */}
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: "linear-gradient(135deg, #00d084, #009e63)",
                        }}
                    >
                        <Plane className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/90 font-semibold text-[15px] tracking-tight">
                        TripBuilt
                    </span>
                </div>

                {/* Hero copy */}
                <div className="space-y-10 max-w-[380px]">
                    <div className="space-y-5">
                        <p className="text-emerald-400/70 text-[11px] font-medium tracking-[0.16em] uppercase">
                            For travel professionals
                        </p>
                        <h1 className="text-[2.85rem] font-bold text-white leading-[1.08] tracking-[-0.025em]">
                            Run your travel business from one place.
                        </h1>
                        <p className="text-white/45 text-base leading-relaxed">
                            Proposals, bookings, GST invoicing, and client management —
                            all in one OS built for modern Indian tour operators.
                        </p>
                    </div>

                    <ul className="space-y-3.5">
                        {FEATURES.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/[0.12] text-emerald-400 flex items-center justify-center">
                                    <Icon className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-white/55 text-sm">{label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-white/15 text-[11px]">
                    © {new Date().getFullYear()} TripBuilt. All rights reserved.
                </p>
            </aside>

            {/* ── Right form panel ── */}
            <section className="flex-1 flex items-center justify-center p-6 lg:p-16 relative z-10">
                <div className="w-full max-w-[380px] space-y-7">
                    {/* Mobile wordmark */}
                    <div className="flex lg:hidden flex-col items-center gap-3 pb-2">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #00d084, #009e63)",
                                boxShadow: "0 8px 24px rgba(0,208,132,0.25)",
                            }}
                        >
                            <Plane className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold text-xl tracking-tight">
                            TripBuilt
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="space-y-1">
                        <h2 className="text-[1.6rem] font-bold text-white tracking-[-0.02em]">
                            {mode === "login" ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-white/60 text-sm">
                            {mode === "login"
                                ? "Sign in to your TripBuilt workspace"
                                : "Start managing your travel business today"}
                        </p>
                    </div>

                    {/* Mode toggle */}
                    <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                        {(["login", "signup"] as AuthMode[]).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => {
                                    setMode(m);
                                    setError("");
                                    setMessage("");
                                    setFieldErrors({});
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    mode === m
                                        ? "bg-white/[0.09] text-white shadow-sm"
                                        : "text-white/60 hover:text-white/80"
                                }`}
                            >
                                {m === "login" ? "Sign in" : "Create account"}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {mode === "signup" && (
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="auth-full-name"
                                    className="block text-[11px] font-medium text-white/60 uppercase tracking-[0.1em]"
                                >
                                    Full name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                                    <Input
                                        id="auth-full-name"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10 h-12 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/40 rounded-xl transition-colors"
                                        placeholder="Ravi Sharma"
                                        required={mode === "signup"}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label
                                htmlFor="auth-email"
                                className="block text-[11px] font-medium text-white/60 uppercase tracking-[0.1em]"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                                <Input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) {
                                            setFieldErrors((prev) => ({ ...prev, email: undefined }));
                                        }
                                    }}
                                    onBlur={handleEmailBlur}
                                    className="pl-10 h-12 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/40 rounded-xl transition-colors"
                                    placeholder="you@tripbuilt.app"
                                    aria-invalid={!!fieldErrors.email}
                                    aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p id="auth-email-error" className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="auth-password"
                                className="block text-[11px] font-medium text-white/60 uppercase tracking-[0.1em]"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                                <Input
                                    id="auth-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) {
                                            setFieldErrors((prev) => ({ ...prev, password: undefined }));
                                        }
                                    }}
                                    className="pl-10 pr-12 h-12 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/40 rounded-xl transition-colors"
                                    placeholder="••••••••"
                                    minLength={8}
                                    aria-invalid={!!fieldErrors.password}
                                    aria-describedby={fieldErrors.password ? "auth-password-error" : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p id="auth-password-error" className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/[0.18]">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300/90">{error}</p>
                            </div>
                        )}

                        {message && (
                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.18]">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-300/90">{message}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-1 rounded-xl font-semibold text-[#040d09] text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(135deg, #00d084 0%, #00b872 100%)",
                                boxShadow: "0 0 28px rgba(0,208,132,0.22), 0 1px 2px rgba(0,0,0,0.3)",
                            }}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {mode === "login" ? "Sign in" : "Create account"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.07]" />
                        <span className="text-white/20 text-xs">or</span>
                        <div className="flex-1 h-px bg-white/[0.07]" />
                    </div>

                    {/* Google OAuth */}
                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            await supabase.auth.signInWithOAuth({
                                provider: "google",
                                options: {
                                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
                                },
                            });
                        }}
                        disabled={loading}
                        className="w-full h-12 rounded-xl flex items-center justify-center gap-3 bg-white/[0.05] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.09] hover:text-white/80 transition-all duration-200 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Legal */}
                    <p className="text-center text-[11px] text-white/18 leading-relaxed">
                        By continuing, you agree to our{" "}
                        <a
                            href="/terms"
                            className="underline underline-offset-2 hover:text-white/40 transition-colors"
                        >
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                            href="/privacy"
                            className="underline underline-offset-2 hover:text-white/40 transition-colors"
                        >
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}

function AuthPageFallback() {
    return (
        <main className="min-h-[100dvh] flex items-center justify-center bg-[#06100d]">
            <div className="flex items-center gap-2.5 text-white/30">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
            </div>
        </main>
    );
}

export default function AuthPageContent() {
    return (
        <Suspense fallback={<AuthPageFallback />}>
            <AuthPageInner />
        </Suspense>
    );
}
