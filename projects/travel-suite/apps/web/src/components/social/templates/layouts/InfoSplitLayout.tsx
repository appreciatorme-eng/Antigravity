"use client";

import { AppImage } from "@/components/ui/AppImage";
import { PosterFooter } from "./PosterFooter";
import { type LayoutProps } from "./layout-helpers";

// ── InfoSplitLayout ────────────────────────────────────────────────────
// Matches real "Get Your Visa Now" poster: teal bg, split right-panel hero image,
// left-panel italic intro + bold headline, yellow band with services, bullet list, footer.
export const InfoSplitLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays", "Visa"];
    const bullets: string[] = templateData.bulletPoints || [];
    const words = (templateData.destination || "Destination").split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");

    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#0e7490", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* Top section: left panel + right hero image */}
            <div style={{ position: "relative", flexShrink: 0, minHeight: "48%" }}>
                {/* Right panel: hero image */}
                {templateData.heroImage && (
                    <div style={{ position: "absolute", right: 0, top: 0, width: "44%", height: "100%" }}>
                        <AppImage
                            src={templateData.heroImage}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            alt="destination"
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 55%, #0e7490)" }} />
                    </div>
                )}

                {/* Left panel */}
                <div style={{ position: "relative", zIndex: 2, width: "60%", padding: "34px 50px" }}>
                    {templateData.logoUrl ? (
                        <AppImage
                            src={templateData.logoUrl}
                            style={{ width: Math.min(templateData.logoWidth || 160, 200), height: 60, objectFit: "contain", marginBottom: 18, filter: "brightness(0) invert(1)" }}
                            alt="logo"
                        />
                    ) : (
                        <div style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 18, opacity: 0.9 }}>
                            {templateData.companyName}
                        </div>
                    )}
                    <div style={{ fontSize: 26, fontStyle: "italic", color: "#90e0ef", marginBottom: 4, fontWeight: 300 }}>
                        Dream to
                    </div>
                    <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.05, color: "white" }}>{line1}</div>
                    {line2 && (
                        <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.05, color: "#fde68a" }}>{line2}</div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 44, fontWeight: 900, color: "#fde68a", marginTop: 10 }}>{templateData.price}</div>
                    )}
                </div>
            </div>

            {/* Yellow band */}
            <div style={{
                background: "#facc15",
                padding: "14px 50px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
                flexShrink: 0,
            }}>
                {templateData.offer && (
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#1a2d5a" }}>{templateData.offer}</div>
                )}
                <div style={{ fontSize: 20, color: "#374151", fontWeight: 600 }}>
                    {services.join(" | ")}
                </div>
            </div>

            {/* Bullet points */}
            <div style={{ padding: "18px 50px", flexShrink: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                    {bullets.map((b: string) => (
                        <div key={b} style={{ fontSize: 22, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#facc15", fontWeight: 900 }}>—</span> {b}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer pushed to bottom */}
            <div style={{ flex: 1 }} />
            <PosterFooter templateData={templateData} absolute={false} />
        </div>
    );
};

// ── GradientHeroLayout ─────────────────────────────────────────────────
// Full-bleed hero image with cinematic gradient fade and bold white text at bottom.
// Inspired by professional visa/destination posters with atmospheric hero imagery.
export const GradientHeroLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Full-bleed hero */}
        {templateData.heroImage ? (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0e7490 100%)" }} />
        )}
        {/* Cinematic gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.95) 100%)" }} />
        {/* Radial vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center top, transparent 40%, rgba(0,0,0,0.3) 100%)" }} />

        {/* Logo top-left */}
        {templateData.logoUrl && (
            <div style={{ position: "absolute", top: 40, left: 50, zIndex: 10 }}>
                <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 200), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            </div>
        )}

        {/* Content at bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 60px 60px", zIndex: 10 }}>
            {templateData.season && (
                <div style={{ fontSize: 28, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 300, marginBottom: 12 }}>
                    {templateData.season}
                </div>
            )}
            <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 0.95, color: "white", textShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
                {templateData.destination || "Dream Destination"}
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
                {templateData.price && (
                    <div style={{ background: "#f59e0b", color: "#000", padding: "10px 32px", borderRadius: 12, fontSize: 36, fontWeight: 900 }}>
                        {templateData.price}
                    </div>
                )}
                {templateData.offer && (
                    <div style={{ fontSize: 34, color: "rgba(255,255,255,0.85)", fontWeight: 300 }}>
                        {templateData.offer}
                    </div>
                )}
            </div>
            <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "white" }}>{templateData.companyName}</div>
                <div style={{ width: 2, height: 24, background: "rgba(255,255,255,0.3)" }} />
                <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>{templateData.contactNumber}</div>
                {templateData.website && (
                    <>
                        <div style={{ width: 2, height: 24, background: "rgba(255,255,255,0.3)" }} />
                        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)" }}>{templateData.website}</div>
                    </>
                )}
            </div>
        </div>
    </div>
);
