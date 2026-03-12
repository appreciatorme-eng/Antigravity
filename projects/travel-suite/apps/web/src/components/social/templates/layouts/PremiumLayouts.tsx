"use client";

import { AppImage } from "@/components/ui/AppImage";
import { type LayoutProps, getPalette, resolveGalleryImages, getServiceIcon } from "./layout-helpers";

// ── PREMIUM: WaveDividerLayout ──────────────────────────────────────────────
// Hero photo top 55% with wave-cut bottom edge, white section below with dark text.
export function WaveDividerLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const destination = (templateData.destination as string) || "Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";
    const services: string[] = (templateData.services as string[]) || [];

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", background: "#ffffff" }}>
            {/* Hero photo -- top 58% */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "58%", overflow: "hidden" }}>
                {templateData.heroImage ? (
                    <AppImage src={templateData.heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0891b2, #06b6d4)" }} />
                )}
                {/* Company name on photo */}
                <div style={{ position: "absolute", top: 36, left: 44, fontSize: 24, fontWeight: 800, color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.5)", letterSpacing: "0.08em" }}>
                    {companyName}
                </div>
                {/* Logo on photo */}
                {templateData.logoUrl && (
                    <div style={{ position: "absolute", top: 28, right: 44 }}>
                        <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 120, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
                    </div>
                )}
                {/* Wave SVG mask at bottom */}
                <svg viewBox="0 0 1080 80" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 80 }} preserveAspectRatio="none">
                    <path d="M0,40 C300,100 780,0 1080,40 L1080,80 L0,80 Z" fill="#ffffff" />
                </svg>
            </div>

            {/* White content section -- bottom 42% */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "46%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 52px" }}>
                {/* Accent colored line */}
                <div style={{ width: 50, height: 4, background: pal.accent, borderRadius: 2, marginBottom: 16 }} />

                {/* Destination -- dark text */}
                <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    {destination}
                </div>

                {/* Offer */}
                {offer && (
                    <div style={{ fontSize: 22, fontWeight: 500, color: "#475569", marginTop: 12 }}>
                        {offer}
                    </div>
                )}

                {/* Price badge */}
                {price && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: 16, alignSelf: "flex-start", background: pal.accent, color: "white", padding: "10px 28px", borderRadius: 9999, fontSize: 28, fontWeight: 900, boxShadow: `0 4px 16px ${pal.accentGlow}` }}>
                        Starting @ {price}
                    </div>
                )}

                {/* Services pills */}
                {services.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                        {services.slice(0, 4).map((s: string) => (
                            <div key={s} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 9999, padding: "6px 16px", fontSize: 15, color: "#334155", fontWeight: 600 }}>
                                {getServiceIcon(s)} {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* Branded footer bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 12, paddingBottom: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: pal.accent }}>{companyName}</div>
                    <div style={{ width: 4, height: 4, borderRadius: 9999, background: "#cbd5e1" }} />
                    <div style={{ fontSize: 16, color: "#64748b" }}>{contactNumber}</div>
                </div>
            </div>
        </div>
    );
}

// ── PREMIUM: CircleAccentLayout ─────────────────────────────────────────────
// Hero photo top 50%, 3 circular gallery photos below on white canvas.
export function CircleAccentLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 4);
    const destination = (templateData.destination as string) || "Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", background: "#ffffff" }}>
            {/* Hero photo -- top 50% with wave bottom */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
                {images[0] ? (
                    <AppImage src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #d97706, #f59e0b)" }} />
                )}
                <svg viewBox="0 0 1080 60" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 60 }} preserveAspectRatio="none">
                    <path d="M0,30 C300,70 780,0 1080,30 L1080,60 L0,60 Z" fill="#ffffff" />
                </svg>
            </div>

            {/* 3 circle photos */}
            <div style={{ position: "absolute", top: "52%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28 }}>
                {[1, 2, 3].map((idx) => (
                    <div key={idx} style={{ width: 160, height: 160, borderRadius: 9999, overflow: "hidden", border: "4px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                        {images[idx] ? (
                            <AppImage src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "#e2e8f0" }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Text below circles */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "28%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 48px", textAlign: "center" }}>
                <div style={{ width: 40, height: 3, background: pal.accent, borderRadius: 2, marginBottom: 12 }} />
                <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: "#0f172a" }}>{destination}</div>
                {offer && <div style={{ fontSize: 20, color: "#64748b", marginTop: 8 }}>{offer}</div>}
                {price && (
                    <div style={{ fontSize: 32, fontWeight: 900, color: pal.accent, marginTop: 10 }}>{price}</div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: "#94a3b8", marginTop: 12, letterSpacing: "0.1em" }}>
                    {companyName}
                </div>
            </div>
        </div>
    );
}

// ── PREMIUM: FloatingCardLayout ─────────────────────────────────────────────
// Full-bleed hero with vignette overlay and floating white card at bottom.
export function FloatingCardLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const destination = (templateData.destination as string) || "Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";
    const season = (templateData.season as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
            {/* Full-bleed hero */}
            {templateData.heroImage ? (
                <AppImage src={templateData.heroImage} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(135deg, #0f172a, #1e293b)" }} />
            )}

            {/* Vignette + gradient overlay */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)" }} />

            {/* Logo top-right */}
            {templateData.logoUrl && (
                <div style={{ position: "absolute", top: 36, right: 40, zIndex: 10 }}>
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 180), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
                </div>
            )}

            {/* Season label top-left */}
            {season && (
                <div style={{ position: "absolute", top: 42, left: 44, fontSize: 18, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.6)", zIndex: 10 }}>
                    {season}
                </div>
            )}

            {/* Floating white card */}
            <div style={{ position: "absolute", bottom: 40, left: 40, right: 40, background: "white", borderRadius: 20, padding: "32px 40px", boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)", zIndex: 10 }}>
                <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    {destination}
                </div>
                <div style={{ width: 50, height: 4, background: pal.accent, borderRadius: 2, marginTop: 14, marginBottom: 14 }} />
                {offer && (
                    <div style={{ fontSize: 20, fontWeight: 500, color: "#64748b", marginBottom: 10 }}>{offer}</div>
                )}
                {price && (
                    <div style={{ fontSize: 40, fontWeight: 900, color: pal.accent }}>{price}</div>
                )}
                <div style={{ width: "100%", height: 1, background: "#e2e8f0", marginTop: 18, marginBottom: 14 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{companyName}</div>
                    <div style={{ fontSize: 16, color: "#94a3b8" }}>{contactNumber}</div>
                </div>
            </div>
        </div>
    );
}

// ── PREMIUM: PremiumCollageLayout ───────────────────────────────────────────
// Brand-colored canvas with 4 rounded photos in a creative grid arrangement.
export function PremiumCollageLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 4);
    const destination = (templateData.destination as string) || "Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", background: pal.accent }}>
            {/* Brand gradient background */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, ${pal.accent}, ${pal.accent}dd)` }} />

            {/* Photo grid -- top 55% */}
            <div style={{ position: "absolute", top: "4%", left: "4%", right: "4%", height: "50%", display: "flex", gap: 12 }}>
                {/* Main large photo -- 60% */}
                <div style={{ flex: 6, borderRadius: 16, overflow: "hidden" }}>
                    {images[0] ? (
                        <AppImage src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.1)" }} />
                    )}
                </div>
                {/* Side stack -- 40% with 2 photos */}
                <div style={{ flex: 4, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}>
                        {images[1] ? (
                            <AppImage src={images[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.1)" }} />
                        )}
                    </div>
                    <div style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}>
                        {images[2] ? (
                            <AppImage src={images[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.1)" }} />
                        )}
                    </div>
                </div>
            </div>

            {/* Wide bottom photo -- 18% */}
            <div style={{ position: "absolute", top: "56%", left: "4%", right: "4%", height: "16%", borderRadius: 12, overflow: "hidden" }}>
                {images[3] ? (
                    <AppImage src={images[3]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.1)" }} />
                )}
            </div>

            {/* Text section -- bottom 24% */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "24%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px" }}>
                <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                    {destination}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
                    {offer && <div style={{ fontSize: 20, color: "rgba(255,255,255,0.8)" }}>{offer}</div>}
                    {price && <div style={{ fontSize: 32, fontWeight: 900, color: "white" }}>{price}</div>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 8, letterSpacing: "0.1em" }}>
                    {companyName}
                </div>
            </div>
        </div>
    );
}

// ── PREMIUM: BannerRibbonLayout ─────────────────────────────────────────────
// Photo strip top, colored gradient banner middle, photo strip bottom.
export function BannerRibbonLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 2);
    const destination = (templateData.destination as string) || "Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
            {/* Top photo strip -- 28% */}
            <div style={{ height: "28%", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {images[0] ? (
                    <AppImage src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e293b, #334155)" }} />
                )}
            </div>

            {/* Gradient banner -- middle 44% */}
            <div style={{ flex: 1, background: `linear-gradient(90deg, ${pal.accent}, #f97316)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 48px", textAlign: "center" }}>
                {templateData.logoUrl && (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 180), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 16 }} alt="logo" />
                )}
                <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                    {destination}
                </div>
                {offer && <div style={{ fontSize: 24, color: "rgba(255,255,255,0.9)", marginTop: 12 }}>{offer}</div>}
                {price && (
                    <div style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", borderRadius: 9999, padding: "10px 32px", marginTop: 16, fontSize: 32, fontWeight: 900, color: "white" }}>
                        {price}
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{companyName}</div>
                    <div style={{ width: 4, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.5)" }} />
                    <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>{contactNumber}</div>
                </div>
            </div>

            {/* Bottom photo strip -- 28% */}
            <div style={{ height: "28%", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {images[1] ? (
                    <AppImage src={images[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #334155, #1e293b)" }} />
                )}
            </div>
        </div>
    );
}

// ── PREMIUM: SplitWaveLayout ────────────────────────────────────────────────
// Left side: diagonal-cut photo (55%), Right side: brand-colored content panel.
export function SplitWaveLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const destination = (templateData.destination as string) || "Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";
    const season = (templateData.season as string) || "";
    const services: string[] = (templateData.services as string[]) || [];

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", background: pal.accent }}>
            {/* Background gradient */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(180deg, ${pal.accent}, ${pal.accent}cc)` }} />

            {/* Photo left side -- diagonal cut */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "55%", height: "100%", clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)", overflow: "hidden" }}>
                {templateData.heroImage ? (
                    <AppImage src={templateData.heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e293b, #334155)" }} />
                )}
            </div>

            {/* Right content panel */}
            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px 60px 32px", zIndex: 5 }}>
                {templateData.logoUrl && (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 180), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 24 }} alt="logo" />
                )}
                {season && (
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                        {season}
                    </div>
                )}
                <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: "white", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                    {destination}
                </div>
                {offer && (
                    <div style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", marginTop: 14 }}>{offer}</div>
                )}
                {price && (
                    <div style={{ fontSize: 36, fontWeight: 900, color: "white", marginTop: 12 }}>{price}</div>
                )}
                {services.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                        {services.slice(0, 3).map((s: string) => (
                            <div key={s} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 9999, padding: "6px 14px", fontSize: 14, color: "white", fontWeight: 600 }}>
                                {getServiceIcon(s)} {s}
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto", paddingTop: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{companyName}</div>
                    <div style={{ width: 3, height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.4)" }} />
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{contactNumber}</div>
                </div>
            </div>
        </div>
    );
}
