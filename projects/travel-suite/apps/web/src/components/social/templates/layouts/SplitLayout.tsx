"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ThemeOverlay } from "./ThemeDecorations";
import { type LayoutProps, getPalette, getServiceIcon } from "./layout-helpers";

// ── Dynamic Split (SplitLayout) ──────────────────────────────────────────────
// Hero image on the right side with a gradient-blended dark content panel on the left.

export const SplitLayout = ({ templateData, preset }: LayoutProps) => {
    const palette = getPalette(preset);
    const services: string[] = templateData.services || [];
    return (
        <div className="w-full h-full relative overflow-hidden" style={{ display: "flex", fontFamily: "Inter, sans-serif", width: "100%", height: "100%" }}>
            {/* Theme-specific decorative elements */}
            <ThemeOverlay templateId={preset.id} accent={palette.accent} />

            {/* Dark panel left side (45%) */}
            <div style={{ position: "relative", width: "45%", height: "100%", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", zIndex: 5 }}>

                {/* Logo */}
                {templateData.logoUrl ? (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 28 }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "0.05em", marginBottom: 28, opacity: 0.9 }}>
                        {templateData.companyName}
                    </div>
                )}

                {/* Decorative line */}
                <div style={{ width: 50, height: 3, background: palette.accent, marginBottom: 24 }} />

                {/* Season */}
                {templateData.season && (
                    <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                        {templateData.season}
                    </div>
                )}

                {/* Destination */}
                <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.95, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.3)", marginBottom: 24 }}>
                    {templateData.destination || "Destination"}
                </div>

                {/* Offer pill frosted */}
                {templateData.offer && (
                    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 24px", borderLeft: `4px solid ${palette.accent}`, marginBottom: 20, display: "flex" }}>
                        <span style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{templateData.offer}</span>
                    </div>
                )}

                {/* Price badge */}
                {templateData.price && (
                    <div style={{ display: "flex", alignItems: "center", background: palette.accent, color: "white", padding: "12px 32px", borderRadius: 9999, fontSize: 32, fontWeight: 900, boxShadow: `0 8px 32px ${palette.accentGlow}`, marginBottom: 28, alignSelf: "flex-start" }}>
                        {templateData.price}
                    </div>
                )}

                {/* Service icons row */}
                {services.length > 0 && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                        {services.slice(0, 4).map((s: string) => (
                            <div key={s} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", fontSize: 16, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                                {getServiceIcon(s)} {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.6)", fontSize: 18, marginTop: "auto" }}>
                    <span style={{ fontWeight: 700, color: "white" }}>{templateData.companyName}</span>
                    <span>|</span>
                    <span>{templateData.contactNumber}</span>
                </div>
            </div>

            {/* Hero image right side (55%) with gradient blend */}
            <div style={{ position: "relative", width: "55%", height: "100%" }}>
                {templateData.heroImage ? (
                    <AppImage src={templateData.heroImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                ) : (
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }} />
                )}
                {/* Gradient edge blending from dark panel into the image */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(to right, #0f172a 0%, rgba(15,23,42,0.6) 40%, transparent 100%)" }} />
                {/* Bottom subtle gradient */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
            </div>
        </div>
    );
};
