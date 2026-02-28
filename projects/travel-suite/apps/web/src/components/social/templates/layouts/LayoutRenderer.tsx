"use client";

import { QRCodeSVG } from "qrcode.react";
import { SocialTemplate } from "@/lib/social/types";

interface LayoutProps {
    templateData: any;
    preset: SocialTemplate;
}

// ── Service icon map ─────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, string> = {
    "Flights": "✈️", "Hotels": "🏨", "Holidays": "🏖️", "Visa": "📋",
    "Airport Transfers": "🚗", "City Tours": "🏙️", "Corporate Travel": "💼",
    "Night Out": "🌙", "Special Events": "🎉", "Bus": "🚌", "Cars": "🚘",
};
const getServiceIcon = (name: string) =>
    SERVICE_ICONS[name] ||
    SERVICE_ICONS[Object.keys(SERVICE_ICONS).find(k => name.toLowerCase().includes(k.toLowerCase())) ?? ""] ||
    "✦";

// ── Shared dark-blue contact footer with WhatsApp QR ────────────────────────
const PosterFooter = ({ templateData, absolute = true }: { templateData: any; absolute?: boolean }) => {
    const digits = (templateData.contactNumber || "").replace(/\D/g, "");
    const waUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";
    return (
        <div
            className={absolute ? "absolute bottom-0 left-0 right-0" : ""}
            style={{ background: "#1a2d5a", padding: "22px 48px", minHeight: 140, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
        >
            <div style={{ color: "#ffffff", lineHeight: 2, fontSize: 22 }}>
                <div>📞 {templateData.contactNumber || "+91 00000 00000"}</div>
                <div>✉ {templateData.email || "info@yourcompany.com"}</div>
                <div>🌐 {templateData.website || "www.yourcompany.com"}</div>
            </div>
            <div style={{ textAlign: "center", color: "#ffffff" }}>
                <QRCodeSVG value={waUrl} size={84} bgColor="#1a2d5a" fgColor="#ffffff" />
                <p style={{ fontSize: 14, marginTop: 4, opacity: 0.65 }}>Scan for WhatsApp</p>
            </div>
        </div>
    );
};

// ── Existing layouts (with logo support added) ───────────────────────────────

export const CenterLayout = ({ templateData }: LayoutProps) => (
    <div className="text-center w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
        {templateData.logoUrl && (
            <div className="absolute top-12">
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 300), height: "auto", objectFit: "contain" }} alt="logo" />
            </div>
        )}
        <h3 className="text-4xl font-bold tracking-widest uppercase opacity-80">{templateData.season}</h3>
        <h1 className="text-[120px] font-black leading-none drop-shadow-xl line-clamp-2 mt-4">{templateData.destination}</h1>
        <div className="bg-white/20 backdrop-blur-md px-16 py-6 rounded-full inline-block border border-white/40 mt-10">
            <span className="text-6xl font-bold">{templateData.offer}</span>
        </div>
        <p className="text-7xl font-bold tracking-tight mt-10">Starting @ {templateData.price}</p>
        <div className="absolute bottom-16 left-0 right-0 text-center">
            <div className="text-4xl font-bold bg-black/40 inline-flex px-12 py-6 rounded-2xl">
                {templateData.companyName} • {templateData.contactNumber}
            </div>
        </div>
    </div>
);

export const ElegantLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full flex items-center justify-center border-[20px] border-white/20 p-16">
        <div className="w-full h-full border-[4px] border-white/40 flex flex-col items-center justify-center p-16 text-center space-y-16">
            <p className="text-5xl tracking-[1em] uppercase font-light opacity-80">{templateData.season}</p>
            <h1 className="text-[130px] font-serif font-bold leading-none line-clamp-2">{templateData.destination}</h1>
            <div className="w-32 h-2 bg-white/50 rounded-full my-8"></div>
            <p className="text-6xl font-light italic">{templateData.offer}</p>
            <p className="text-8xl font-serif mt-8">{templateData.price}</p>
            <div className="mt-auto pt-16 w-full px-8 flex justify-between items-center text-left">
                <div>
                    <p className="text-4xl tracking-widest">{templateData.companyName}</p>
                    <p className="text-3xl mt-4 opacity-70 font-serif">{templateData.contactNumber}</p>
                </div>
                {templateData.logoUrl && (
                    <img src={templateData.logoUrl} style={{ width: templateData.logoWidth || 200 }} className="object-contain" alt="logo" />
                )}
            </div>
        </div>
    </div>
);

export const SplitLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full flex flex-col justify-between">
        <div className="flex justify-between items-start w-full">
            {templateData.logoUrl ? (
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 260), height: "auto", objectFit: "contain" }} alt="logo" />
            ) : (
                <h2 className="text-5xl font-bold tracking-wider">{templateData.companyName}</h2>
            )}
            <div className="bg-white text-slate-900 px-8 py-4 rounded-xl text-3xl font-bold shadow-lg">
                {templateData.season}
            </div>
        </div>
        <div className="space-y-6">
            <h1 className="text-[140px] font-black leading-none tracking-tighter truncate w-full">{templateData.destination}</h1>
            <p className="text-6xl font-medium opacity-90">{templateData.offer}</p>
        </div>
        <div className="flex justify-between items-end w-full">
            <div className="text-8xl font-black">{templateData.price}</div>
            <div className="text-4xl font-semibold bg-black/30 p-8 rounded-3xl backdrop-blur-sm">
                Call: {templateData.contactNumber}
            </div>
        </div>
    </div>
);

export const BottomLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative">
        {templateData.logoUrl && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 260), height: "auto", objectFit: "contain" }} alt="logo" />
            </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center -translate-y-24">
            <div className="text-center">
                <h1 className="text-[160px] font-black leading-[0.9] drop-shadow-2xl">{templateData.destination.split(' ')[0]}</h1>
                <h2 className="text-[80px] font-bold opacity-80 mt-4">{templateData.destination.split(' ').slice(1).join(' ')}</h2>
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-xl border-t border-white/20 p-16 flex justify-between items-center rounded-t-[60px]">
            <div>
                <p className="text-3xl text-white/70 uppercase tracking-widest mb-2 font-bold">{templateData.offer}</p>
                <p className="text-8xl font-black">{templateData.price}</p>
            </div>
            <div className="text-right">
                <p className="text-5xl font-bold">{templateData.companyName}</p>
                <p className="text-3xl mt-4 opacity-80 backdrop-blur-md bg-black/20 p-4 rounded-xl">{templateData.contactNumber}</p>
            </div>
        </div>
    </div>
);

export const ReviewLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-24 text-center relative overflow-hidden text-slate-800">
        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-16">
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s: number) => <span key={s} className="text-amber-500 text-6xl">★</span>)}
            </div>
            <h2 className="text-7xl font-serif italic text-slate-800 leading-tight">
                &ldquo;{templateData.reviewText || 'The most incredible experience of our lives! Every detail was planned perfectly.'}&rdquo;
            </h2>
            <div className="pt-12 flex flex-col items-center">
                <div className="h-1 bg-slate-200 w-32 mb-12"></div>
                <p className="text-4xl font-black uppercase tracking-[0.2em]">{templateData.reviewerName || "Sarah Jenkins"}</p>
                <p className="text-2xl text-slate-500 mt-4 font-medium">{templateData.reviewerTrip || "Maldives Honeymoon"}</p>
            </div>
            <div className="pt-16 flex justify-center items-center gap-12">
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 180, 180), height: "auto", objectFit: "contain" }} alt="logo" />
                ) : (
                    <p className="text-3xl font-bold text-blue-600">{templateData.companyName}</p>
                )}
                <div className="h-8 w-[2px] bg-slate-200"></div>
                <p className="text-2xl text-slate-400 font-medium">{templateData.contactNumber}</p>
            </div>
        </div>
    </div>
);

export const CarouselSlideLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border-[20px] border-white/10 p-16">
        <div className="text-center space-y-8">
            <h1 className="text-[100px] font-bold text-white leading-none">Carousel Slide 1</h1>
            <p className="text-4xl text-slate-400">Swipe for more...</p>
            <div className="bg-blue-600 px-12 py-6 rounded-full text-white text-3xl font-bold mt-12">
                {templateData.companyName}
            </div>
        </div>
    </div>
);

// ── NEW: ServiceShowcaseLayout ───────────────────────────────────────────────
// Matches real "Luxury Car Service" poster: white bg, logo top-center, navy+purple
// headline, teal pill offer, "Why Choose Us" icon grid, services list, hero image, footer.
export const ServiceShowcaseLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays"];
    const bullets: string[] = templateData.bulletPoints || [];
    const words = (templateData.destination || "Service").split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");

    return (
        <div className="w-full h-full overflow-hidden bg-white" style={{ fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* ── Logo / Company header ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32, flexShrink: 0 }}>
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 200, 240), height: 72, objectFit: "contain" }} alt="logo" />
                ) : (
                    <div style={{ fontSize: 44, fontWeight: 900, color: "#1a2d5a", letterSpacing: 1 }}>
                        {templateData.companyName}
                    </div>
                )}
                {templateData.season && (
                    <div style={{ fontSize: 22, color: "#6b7280", marginTop: 4 }}>{templateData.season}</div>
                )}
            </div>

            {/* ── Headline ── */}
            <div style={{ padding: "12px 60px 0", flexShrink: 0 }}>
                <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.05, color: "#1a2d5a" }}>{line1}</div>
                {line2 && (
                    <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.05, color: "#6b21a8" }}>{line2}</div>
                )}
                <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
                    {templateData.offer && (
                        <div style={{ background: "#0d9488", color: "white", borderRadius: 9999, padding: "8px 28px", fontSize: 30, fontWeight: 700 }}>
                            {templateData.offer}
                        </div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 34, fontWeight: 800, color: "#1a2d5a" }}>Starting @ {templateData.price}</div>
                    )}
                </div>
            </div>

            {/* ── Why Choose Us icon grid ── */}
            <div style={{ padding: "18px 60px 0", flexShrink: 0 }}>
                <div style={{ fontSize: 25, fontWeight: 800, color: "#1a2d5a", marginBottom: 10 }}>Why Choose Us?</div>
                <div style={{ display: "flex", gap: 14 }}>
                    {services.slice(0, 3).map((s: string) => (
                        <div key={s} style={{
                            flex: 1,
                            border: "2px solid #e2e8f0",
                            borderRadius: 14,
                            padding: "14px 8px",
                            textAlign: "center",
                            background: "#f8faff",
                        }}>
                            <div style={{ fontSize: 36 }}>{getServiceIcon(s)}</div>
                            <div style={{ fontSize: 19, fontWeight: 700, color: "#1a2d5a", marginTop: 6 }}>{s}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Bullet services list ── */}
            {bullets.length > 0 && (
                <div style={{ padding: "14px 60px 0", flexShrink: 0 }}>
                    <div style={{ fontSize: 21, fontWeight: 800, color: "#1a2d5a", marginBottom: 8 }}>Services Offered</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                        {bullets.map((b: string) => (
                            <div key={b} style={{ fontSize: 21, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ color: "#0d9488", fontWeight: 900, fontSize: 16 }}>✓</span> {b}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Hero image + footer section ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 0 }}>
                {templateData.heroImage && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                        <img
                            src={templateData.heroImage}
                            style={{ height: 180, objectFit: "contain", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))" }}
                            alt="hero"
                        />
                    </div>
                )}
                <PosterFooter templateData={templateData} absolute={false} />
            </div>
        </div>
    );
};

// ── NEW: HeroServicesLayout ──────────────────────────────────────────────────
// Matches real "Wonders of India" poster: light blue bg, logo top, bold navy+red
// headline with left border accent, full-width hero image, service icon row, footer.
export const HeroServicesLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays", "Visa"];
    const words = (templateData.destination || "Destination").split(" ");
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(" ");
    const line2 = words.slice(mid).join(" ");

    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#d4eaf7", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column" }}>

            {/* ── Header: Logo + Company ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 50px", flexShrink: 0 }}>
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: 60, objectFit: "contain" }} alt="logo" />
                ) : null}
                <div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: "#1a3a6b" }}>{templateData.companyName}</div>
                    {templateData.season && (
                        <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600 }}>{templateData.season}</div>
                    )}
                </div>
            </div>

            {/* ── Headline with left border accent ── */}
            <div style={{ marginLeft: 50, marginRight: 50, paddingLeft: 24, borderLeft: "10px solid #1a3a6b", flexShrink: 0 }}>
                <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.05, color: "#1a3a6b" }}>{line1}</div>
                {line2 && <div style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.05, color: "#dc2626" }}>{line2}</div>}
                <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {templateData.offer && (
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#1a3a6b" }}>{templateData.offer}</div>
                    )}
                    {templateData.price && (
                        <div style={{ fontSize: 32, fontWeight: 800, color: "#16a34a" }}>@ {templateData.price}</div>
                    )}
                </div>
            </div>

            {/* ── Hero image ── */}
            {templateData.heroImage && (
                <div style={{ marginTop: 16, flexShrink: 0 }}>
                    <img
                        src={templateData.heroImage}
                        style={{ width: "100%", height: 320, objectFit: "cover" }}
                        alt="destination"
                    />
                </div>
            )}

            {/* ── Services icon row ── */}
            <div style={{ display: "flex", justifyContent: "center", gap: 18, padding: "14px 50px", flexWrap: "wrap", flexShrink: 0 }}>
                {services.slice(0, 5).map((s: string) => (
                    <div key={s} style={{
                        background: "white",
                        borderRadius: 12,
                        padding: "10px 16px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        minWidth: 90,
                    }}>
                        <div style={{ fontSize: 32 }}>{getServiceIcon(s)}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a6b", marginTop: 4 }}>{s}</div>
                    </div>
                ))}
            </div>

            {/* ── Footer pushed to bottom ── */}
            <div style={{ flex: 1 }} />
            <PosterFooter templateData={templateData} absolute={false} />
        </div>
    );
};

// ── NEW: InfoSplitLayout ────────────────────────────────────────────────────
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

            {/* ── Top section: left panel + right hero image ── */}
            <div style={{ position: "relative", flexShrink: 0, minHeight: "48%" }}>
                {/* Right panel: hero image */}
                {templateData.heroImage && (
                    <div style={{ position: "absolute", right: 0, top: 0, width: "44%", height: "100%" }}>
                        <img
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
                        <img
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

            {/* ── Yellow band ── */}
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

            {/* ── Bullet points ── */}
            <div style={{ padding: "18px 50px", flexShrink: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                    {bullets.map((b: string) => (
                        <div key={b} style={{ fontSize: 22, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#facc15", fontWeight: 900 }}>—</span> {b}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer pushed to bottom ── */}
            <div style={{ flex: 1 }} />
            <PosterFooter templateData={templateData} absolute={false} />
        </div>
    );
};

// ── NEW: GradientHeroLayout ─────────────────────────────────────────────────
// Full-bleed hero image with cinematic gradient fade and bold white text at bottom.
// Inspired by professional visa/destination posters with atmospheric hero imagery.
export const GradientHeroLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Full-bleed hero */}
        {templateData.heroImage ? (
            <img src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
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
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 200), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
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

// ── NEW: DiagonalSplitLayout ────────────────────────────────────────────────
// Diagonal slash dividing hero image from content. Modern, dynamic feel.
export const DiagonalSplitLayout = ({ templateData }: LayoutProps) => {
    const services: string[] = templateData.services || ["Flights", "Hotels", "Holidays"];
    return (
        <div className="w-full h-full relative overflow-hidden" style={{ background: "#1a2d5a", fontFamily: "Arial, sans-serif" }}>
            {/* Hero image on right diagonal */}
            {templateData.heroImage ? (
                <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)" }}>
                    <img src={templateData.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #1a2d5a 0%, transparent 40%)" }} />
                </div>
            ) : (
                <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)", background: "linear-gradient(135deg, #2563eb, #7c3aed)" }} />
            )}

            {/* Left content */}
            <div style={{ position: "relative", zIndex: 2, width: "55%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 60px 60px 60px" }}>
                {templateData.logoUrl && (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 160, 180), height: "auto", objectFit: "contain", marginBottom: 24, filter: "brightness(0) invert(1)" }} alt="logo" />
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

// ── NEW: MagazineCoverLayout ────────────────────────────────────────────────
// Full hero image with tasteful, magazine-style text overlay. Minimal, elegant.
export const MagazineCoverLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Georgia, serif" }}>
        {/* Full cover image */}
        {templateData.heroImage ? (
            <img src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }} />
        )}
        {/* Subtle dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Top bar: logo + company */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "36px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
            {templateData.logoUrl ? (
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} alt="logo" />
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

// ── NEW: DuotoneLayout ──────────────────────────────────────────────────────
// Hero image with a bold duotone color filter using brand colors. Modern, eye-catching.
export const DuotoneLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Hero with duotone effect (using mix-blend-mode layers) */}
        {templateData.heroImage ? (
            <img src={templateData.heroImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) contrast(1.1)" }} alt="hero" />
        ) : (
            <div style={{ position: "absolute", inset: 0, background: "#1e293b" }} />
        )}
        {/* Color overlay for duotone effect */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", mixBlendMode: "color", opacity: 0.85 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Large typography */}
        <div style={{ position: "absolute", top: 50, left: 50, right: 50, zIndex: 10 }}>
            {templateData.logoUrl && (
                <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", marginBottom: 20 }} alt="logo" />
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

// ── NEW: BoldTypographyLayout ───────────────────────────────────────────────
// Oversized typography as the main design element with a subtle background. Clean, impactful.
export const BoldTypographyLayout = ({ templateData }: LayoutProps) => {
    const words = (templateData.destination || "Travel").split(" ");
    return (
        <div className="w-full h-full overflow-hidden" style={{ background: "#fafafa", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", position: "relative" }}>
            {/* Subtle hero image as texture */}
            {templateData.heroImage && (
                <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "60%", opacity: 0.12 }}>
                    <img src={templateData.heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                </div>
            )}

            {/* Header */}
            <div style={{ padding: "40px 60px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, position: "relative", zIndex: 2 }}>
                {templateData.logoUrl ? (
                    <img src={templateData.logoUrl} style={{ width: Math.min(templateData.logoWidth || 140, 160), height: "auto", objectFit: "contain" }} alt="logo" />
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

// ── LayoutRenderer (used by CarouselBuilder / other non-gallery consumers) ──
interface LayoutRendererProps {
    layout: string;
    data: any;
}

export const LayoutRenderer = ({ layout, data }: LayoutRendererProps) => {
    const props = { templateData: data, preset: {} as SocialTemplate };
    switch (layout) {
        case "Elegant":            return <ElegantLayout {...props} />;
        case "Split":              return <SplitLayout {...props} />;
        case "Bottom":             return <BottomLayout {...props} />;
        case "Center":             return <CenterLayout {...props} />;
        case "Creative":           return <CarouselSlideLayout {...props} />;
        case "Review":             return <ReviewLayout {...props} />;
        case "ServiceShowcase":    return <ServiceShowcaseLayout {...props} />;
        case "HeroServices":       return <HeroServicesLayout {...props} />;
        case "InfoSplit":          return <InfoSplitLayout {...props} />;
        case "GradientHero":       return <GradientHeroLayout {...props} />;
        case "DiagonalSplit":      return <DiagonalSplitLayout {...props} />;
        case "MagazineCover":      return <MagazineCoverLayout {...props} />;
        case "Duotone":            return <DuotoneLayout {...props} />;
        case "BoldTypography":     return <BoldTypographyLayout {...props} />;
        default:                   return <ElegantLayout {...props} />;
    }
};
