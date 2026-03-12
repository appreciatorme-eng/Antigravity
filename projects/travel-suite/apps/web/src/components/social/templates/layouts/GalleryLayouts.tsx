"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ThemeOverlay } from "./ThemeDecorations";
import { type LayoutProps, getPalette, resolveGalleryImages } from "./layout-helpers";

// ── CollageGridLayout (4 images) ────────────────────────────────────────────
// Large left image + 3 stacked right images with gradient text overlay at bottom.
export function CollageGridLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 4);
    const destination = (templateData.destination as string) || "Exotic Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
            <ThemeOverlay templateId={preset.id} accent={pal.accent} />

            {/* Image grid */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", gap: 2 }}>
                {/* Left column -- 65% */}
                <div style={{ width: "65%", height: "100%", position: "relative" }}>
                    {images[0] && (
                        <AppImage src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                </div>

                {/* Right column -- 35%, 3 stacked */}
                <div style={{ width: "35%", height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                    {[1, 2, 3].map((idx) => (
                        <div key={idx} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                            {images[idx] && (
                                <AppImage src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dark gradient overlay on bottom 35% */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)" }} />

            {/* Text content at bottom */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 48px 80px", zIndex: 10 }}>
                <div style={{ fontSize: 64, fontWeight: 900, color: "white", lineHeight: 1, textShadow: "0 4px 20px rgba(0,0,0,0.5)", letterSpacing: "-0.02em" }}>
                    {destination}
                </div>
                {offer && (
                    <div style={{ fontSize: 24, color: "rgba(255,255,255,0.8)", fontWeight: 500, marginTop: 12 }}>
                        {offer}
                    </div>
                )}
                {price && (
                    <div style={{ display: "inline-flex", alignItems: "center", background: pal.accent, color: "white", padding: "10px 32px", borderRadius: 9999, fontSize: 32, fontWeight: 900, boxShadow: `0 6px 24px ${pal.accentGlow}`, marginTop: 16 }}>
                        {price}
                    </div>
                )}
            </div>

            {/* Company footer bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                    {companyName}
                </div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    {contactNumber}
                </div>
            </div>
        </div>
    );
}

// ── TriPanelLayout (3 images) ───────────────────────────────────────────────
// Three equal vertical panels at top with a solid dark info panel at bottom.
export function TriPanelLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 3);
    const destination = (templateData.destination as string) || "Exotic Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";
    const website = (templateData.website as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
            <ThemeOverlay templateId={preset.id} accent={pal.accent} />

            {/* Top 65% -- 3 equal image panels */}
            <div style={{ height: "65%", display: "flex", gap: 2, flexShrink: 0 }}>
                {[0, 1, 2].map((idx) => (
                    <div key={idx} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                        {images[idx] && (
                            <AppImage src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom 35% -- dark navy panel */}
            <div style={{ height: "35%", background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 48px", position: "relative" }}>
                {/* Accent line at top of panel */}
                <div style={{ position: "absolute", top: 0, left: 48, width: 60, height: 4, background: pal.accent, borderRadius: 2 }} />

                <div style={{ fontSize: 52, fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                    {destination}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
                    {price && (
                        <div style={{ background: pal.accent, color: "white", padding: "8px 28px", borderRadius: 9999, fontSize: 28, fontWeight: 900, boxShadow: `0 4px 16px ${pal.accentGlow}` }}>
                            {price}
                        </div>
                    )}
                    {offer && (
                        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                            {offer}
                        </div>
                    )}
                </div>

                {/* Company + contact at bottom */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                            {companyName}
                        </div>
                        <div style={{ width: 4, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.4)" }} />
                        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>
                            {contactNumber}
                        </div>
                    </div>
                    {website && (
                        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
                            {website}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── PolaroidScatterLayout (3 images) ────────────────────────────────────────
// Dark gradient background with 3 "polaroid"-framed images scattered at angles.
export function PolaroidScatterLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 3);
    const destination = (templateData.destination as string) || "Exotic Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";

    const bgGradient = preset.palette?.bg || "linear-gradient(135deg, #0f172a, #1e293b)";

    const polaroids: { left: string; top: string; rotate: string }[] = [
        { left: "8%", top: "8%", rotate: "-5deg" },
        { left: "52%", top: "15%", rotate: "3deg" },
        { left: "30%", top: "38%", rotate: "-2deg" },
    ];

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", background: bgGradient }}>
            <ThemeOverlay templateId={preset.id} accent={pal.accent} />

            {/* Polaroid images */}
            {polaroids.map((pos, idx) => (
                images[idx] ? (
                    <div
                        key={idx}
                        style={{
                            position: "absolute",
                            left: pos.left,
                            top: pos.top,
                            width: "38%",
                            aspectRatio: "3 / 4",
                            background: "white",
                            padding: 8,
                            paddingBottom: 32,
                            borderRadius: 4,
                            transform: `rotate(${pos.rotate})`,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
                            zIndex: idx + 1,
                        }}
                    >
                        <AppImage src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }} />
                    </div>
                ) : null
            ))}

            {/* Dark gradient at bottom for text readability */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)", zIndex: 5 }} />

            {/* Text content at bottom 28% */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 48px 72px", zIndex: 10 }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "white", lineHeight: 1.05, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                    {destination}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                    {price && (
                        <div style={{ background: pal.accent, color: "white", padding: "8px 28px", borderRadius: 9999, fontSize: 28, fontWeight: 900, boxShadow: `0 4px 16px ${pal.accentGlow}` }}>
                            {price}
                        </div>
                    )}
                    {offer && (
                        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                            {offer}
                        </div>
                    )}
                </div>
            </div>

            {/* Company footer bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                    {companyName}
                </div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    {contactNumber}
                </div>
            </div>
        </div>
    );
}

// ── WindowGalleryLayout (3 images) ──────────────────────────────────────────
// Dark gradient background with 3 rounded "window" images and elegant text below.
export function WindowGalleryLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 3);
    const destination = (templateData.destination as string) || "Exotic Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";
    const website = (templateData.website as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
            <ThemeOverlay templateId={preset.id} accent={pal.accent} />

            {/* Decorative subtle radial glow */}
            <div style={{ position: "absolute", top: "20%", left: "50%", width: "80%", height: "40%", transform: "translateX(-50%)", background: `radial-gradient(ellipse, ${pal.accentTint} 0%, transparent 70%)`, zIndex: 0 }} />

            {/* 3 rounded window images */}
            <div style={{ position: "absolute", top: "12%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24, padding: "0 40px", zIndex: 2 }}>
                {[0, 1, 2].map((idx) => (
                    <div key={idx} style={{ width: "28%", aspectRatio: "3 / 4", borderRadius: 16, overflow: "hidden", border: "3px solid rgba(255,255,255,0.3)", boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}>
                        {images[idx] ? (
                            <AppImage src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.05)" }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Separator line */}
            <div style={{ position: "absolute", top: "62%", left: "15%", right: "15%", height: 1, background: pal.accent, opacity: 0.6, zIndex: 2 }} />

            {/* Text content */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 48px 72px", zIndex: 10, textAlign: "center" }}>
                {offer && (
                    <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                        {offer}
                    </div>
                )}
                <div style={{ fontSize: 60, fontWeight: 900, color: "white", lineHeight: 1.05, textShadow: "0 4px 20px rgba(0,0,0,0.3)", letterSpacing: "-0.02em" }}>
                    {destination}
                </div>
                {price && (
                    <div style={{ display: "inline-flex", alignItems: "center", background: pal.accent, color: "white", padding: "10px 36px", borderRadius: 9999, fontSize: 30, fontWeight: 900, boxShadow: `0 6px 24px ${pal.accentGlow}`, marginTop: 20 }}>
                        Starting @ {price}
                    </div>
                )}
            </div>

            {/* Company footer bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", padding: "16px 48px", display: "flex", justifyContent: "center", alignItems: "center", gap: 20, zIndex: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                    {companyName}
                </div>
                <div style={{ width: 4, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.4)" }} />
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>
                    {contactNumber}
                </div>
                {website && (
                    <>
                        <div style={{ width: 4, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.4)" }} />
                        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>
                            {website}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── MosaicStripLayout (5 images) ────────────────────────────────────────────
// Hero image on top, 4-image strip in the middle, text panel at bottom.
export function MosaicStripLayout({ templateData, preset }: LayoutProps) {
    const pal = getPalette(preset);
    const images = resolveGalleryImages(templateData, 5);
    const destination = (templateData.destination as string) || "Exotic Destination";
    const price = (templateData.price as string) || "";
    const offer = (templateData.offer as string) || "";
    const companyName = (templateData.companyName as string) || "";
    const contactNumber = (templateData.contactNumber as string) || "";
    const website = (templateData.website as string) || "";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
            <ThemeOverlay templateId={preset.id} accent={pal.accent} />

            {/* Hero image -- top 50% */}
            <div style={{ height: "50%", position: "relative", flexShrink: 0, overflow: "hidden" }}>
                {images[0] ? (
                    <AppImage src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e293b, #334155)" }} />
                )}
                {/* Subtle bottom fade */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
            </div>

            {/* 4-image strip -- 18% */}
            <div style={{ height: "18%", display: "flex", gap: 2, flexShrink: 0 }}>
                {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                        {images[idx] ? (
                            <AppImage src={images[idx]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(30,41,59,0.8)" }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Text panel -- bottom 32% */}
            <div style={{ height: "32%", background: "#0f172a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 48px", position: "relative" }}>
                {/* Accent line at top */}
                <div style={{ position: "absolute", top: 0, left: 48, width: 60, height: 4, background: pal.accent, borderRadius: 2 }} />

                <div style={{ fontSize: 48, fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                    {destination}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                    {price && (
                        <div style={{ background: pal.accent, color: "white", padding: "8px 28px", borderRadius: 9999, fontSize: 26, fontWeight: 900, boxShadow: `0 4px 16px ${pal.accentGlow}` }}>
                            Starting @ {price}
                        </div>
                    )}
                    {offer && (
                        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                            {offer}
                        </div>
                    )}
                </div>

                {/* Company + contact at bottom */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
                            {companyName}
                        </div>
                        <div style={{ width: 4, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.4)" }} />
                        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>
                            {contactNumber}
                        </div>
                    </div>
                    {website && (
                        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
                            {website}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
