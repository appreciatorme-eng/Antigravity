"use client";

import { AppImage } from "@/components/ui/AppImage";
import { type LayoutProps, getServiceIcon } from "./layout-helpers";

// ── DiagonalSplitLayout ────────────────────────────────────────────────
// Diagonal slash dividing hero image from content. Modern, dynamic feel.
export const DiagonalSplitLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays"];
    return (
        <div className="w-full h-full relative overflow-hidden" style={{ background: "#1a2d5a", fontFamily: "Arial, sans-serif" }}>
            {/* Hero image on right diagonal */}
            {templateData.heroImage ? (
                <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)" }}>
                    <AppImage src={templateData.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #1a2d5a 0%, transparent 40%)" }} />
                </div>
            ) : (
                <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)", background: "linear-gradient(135deg, #2563eb, #7c3aed)" }} />
            )}

            {/* Left content */}
            <div style={{ position: "relative", zIndex: 2, width: "55%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 60px 60px 60px" }}>
                {templateData.logoUrl && (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: "auto", objectFit: "contain", marginBottom: 24, filter: "brightness(0) invert(1)" }} alt="logo" />
                )}
                {templateData.season && (
                    <div style={{ fontSize: 22, color: "#60a5fa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
                        {templateData.season}
                    </div>
                )}
                <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 0.95, color: "white" }}>
                    {templateData.destination || "Destination"}
                </div>
                {templateData.offer && (
                    <div style={{ fontSize: 28, color: "#fde68a", fontWeight: 700, marginTop: 20 }}>{templateData.offer}</div>
                )}
                {templateData.price && (
                    <div style={{ fontSize: 52, fontWeight: 900, color: "#34d399", marginTop: 16 }}>{templateData.price}</div>
                )}

                {/* Services pills */}
                <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
                    {services.slice(0, 4).map((s: string) => (
                        <div key={s} style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 9999,
                            padding: "8px 20px",
                            fontSize: 20,
                            color: "white",
                            fontWeight: 600,
                        }}>
                            {getServiceIcon(s)} {s}
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div style={{ marginTop: 36, display: "flex", gap: 16, alignItems: "center", color: "rgba(255,255,255,0.7)", fontSize: 20 }}>
                    <span style={{ fontWeight: 700, color: "white" }}>{templateData.companyName}</span>
                    <span>|</span>
                    <span>📞 {templateData.contactNumber}</span>
                </div>
            </div>
        </div>
    );
};

// ── MagazineCoverLayout ────────────────────────────────────────────────
// Full hero image with tasteful, magazine-style text overlay. Minimal, elegant.
export const MagazineCoverLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
        {/* Full cover image */}
        {templateData.heroImage ? (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }} />
        )}
        {/* Subtle dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Top bar: logo + company */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "36px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
            {templateData.logoUrl ? (
                <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
            ) : (
                <div style={{ fontSize: 30, fontWeight: 700, color: "white", letterSpacing: "0.1em" }}>{templateData.companyName}</div>
            )}
            {templateData.season && (
                <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", padding: "8px 24px", borderRadius: 9999, fontSize: 20, color: "white", fontWeight: 600 }}>
                    {templateData.season}
                </div>
            )}
        </div>

        {/* Center destination - large serif */}
        <div style={{ position: "absolute", top: "50%", left: 50, right: 50, transform: "translateY(-50%)", zIndex: 10, textAlign: "center" }}>
            <div style={{ fontSize: 24, letterSpacing: "0.6em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontWeight: 400, marginBottom: 20 }}>
                Discover
            </div>
            <div style={{ fontSize: 110, fontWeight: 700, color: "white", lineHeight: 0.9, textShadow: "0 6px 40px rgba(0,0,0,0.4)", fontStyle: "italic" }}>
                {templateData.destination || "Paradise"}
            </div>
            <div style={{ width: 80, height: 3, background: "white", margin: "28px auto", opacity: 0.6 }} />
            {templateData.offer && (
                <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)", fontWeight: 400, fontStyle: "italic" }}>
                    {templateData.offer}
                </div>
            )}
        </div>

        {/* Bottom bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 50px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 10 }}>
            <div>
                {templateData.price && (
                    <div style={{ fontSize: 56, fontWeight: 700, color: "white" }}>{templateData.price}</div>
                )}
                <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginTop: 4, fontFamily: "Arial, sans-serif" }}>
                    Starting from
                </div>
            </div>
            <div style={{ textAlign: "right", fontFamily: "Arial, sans-serif" }}>
                <div style={{ fontSize: 22, color: "white", fontWeight: 600 }}>{templateData.contactNumber}</div>
                {templateData.website && (
                    <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{templateData.website}</div>
                )}
            </div>
        </div>
    </div>
);

// ── DuotoneLayout ──────────────────────────────────────────────────────
// Hero image with a bold duotone color filter using brand colors. Modern, eye-catching.
export const DuotoneLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Hero with duotone effect (using mix-blend-mode layers) */}
        {templateData.heroImage ? (
            <AppImage src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) contrast(1.1)" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "#1e293b" }} />
        )}
        {/* Color overlay for duotone effect */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", mixBlendMode: "color", opacity: 0.85 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Large typography */}
        <div style={{ position: "absolute", top: 50, left: 50, right: 50, zIndex: 10 }}>
            {templateData.logoUrl && (
                <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 20 }} alt="logo" />
            )}
            {templateData.season && (
                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", padding: "6px 20px", borderRadius: 8, fontSize: 20, color: "white", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {templateData.season}
                </div>
            )}
        </div>

        {/* Center/bottom content */}
        <div style={{ position: "absolute", bottom: 50, left: 50, right: 50, zIndex: 10 }}>
            <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.95, color: "white", marginBottom: 16 }}>
                {templateData.destination || "Explore"}
            </div>
            {templateData.offer && (
                <div style={{ fontSize: 30, color: "#fbbf24", fontWeight: 700, marginBottom: 16 }}>{templateData.offer}</div>
            )}
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                {templateData.price && (
                    <div style={{ background: "white", color: "#1e3a8a", padding: "12px 36px", borderRadius: 14, fontSize: 40, fontWeight: 900 }}>
                        {templateData.price}
                    </div>
                )}
                <div style={{ fontSize: 22, color: "rgba(255,255,255,0.8)" }}>
                    <div style={{ fontWeight: 700 }}>{templateData.companyName}</div>
                    <div style={{ opacity: 0.7, marginTop: 2 }}>{templateData.contactNumber}</div>
                </div>
            </div>
        </div>
    </div>
);

// ── BoldTypographyLayout ───────────────────────────────────────────────
// Oversized typography as the main design element with a subtle background. Clean, impactful.
export const BoldTypographyLayout = ({ templateData }: LayoutProps) => {
    const words = (templateData.destination || "Travel").split(" ");
    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#fafafa", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Subtle hero image as texture */}
            {templateData.heroImage && (
                <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "60%", opacity: 0.12 }}>
                    <AppImage src={templateData.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                </div>
            )}

            {/* Header */}
            <div style={{ padding: "40px 60px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, position: "relative", zIndex: 2 }}>
                {templateData.logoUrl ? (
                    <AppImage src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain" }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#1a2d5a", letterSpacing: 1 }}>{templateData.companyName}</div>
                )}
                {templateData.season && (
                    <div style={{ background: "#1a2d5a", color: "white", padding: "8px 24px", borderRadius: 9999, fontSize: 20, fontWeight: 700 }}>
                        {templateData.season}
                    </div>
                )}
            </div>

            {/* Giant typography */}
            <div style={{ padding: "20px 60px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 2 }}>
                {words.map((word: string, i: number) => (
                    <div key={i} style={{
                        fontSize: Math.min(140, 900 / Math.max(word.length, 3)),
                        fontWeight: 900,
                        lineHeight: 0.95,
                        color: i % 2 === 0 ? "#1a2d5a" : "#7c3aed",
                        textTransform: "uppercase",
                        letterSpacing: "-0.02em",
                    }}>
                        {word}
                    </div>
                ))}

                <div style={{ display: "flex", gap: 16, marginTop: 28, alignItems: "center", flexWrap: "wrap" }}>
                    {templateData.offer && (
                        <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px 28px", borderRadius: 10, fontSize: 26, fontWeight: 800 }}>
                            {templateData.offer}
                        </div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 48, fontWeight: 900, color: "#059669" }}>{templateData.price}</div>
                    )}
                </div>
            </div>

            {/* Bottom bar */}
            <div style={{ background: "#1a2d5a", padding: "24px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, position: "relative", zIndex: 2 }}>
                <div style={{ color: "white", fontSize: 22, fontWeight: 700 }}>
                    {templateData.companyName} <span style={{ opacity: 0.5, margin: "0 12px" }}>|</span>
                    <span style={{ fontWeight: 400, opacity: 0.8 }}>{templateData.contactNumber}</span>
                </div>
                {templateData.website && (
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}>{templateData.website}</div>
                )}
            </div>
        </div>
    );
};
