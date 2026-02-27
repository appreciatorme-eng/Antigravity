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
const PosterFooter = ({ templateData }: { templateData: any }) => {
    const digits = (templateData.contactNumber || "").replace(/\D/g, "");
    const waUrl = digits ? `https://wa.me/${digits}` : "https://wa.me/";
    return (
        <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between"
            style={{ background: "#1a2d5a", padding: "22px 48px", minHeight: 140 }}
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
        <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontFamily: "Arial, sans-serif" }}>

            {/* ── Logo / Company header ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32 }}>
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
            <div style={{ padding: "12px 60px 0" }}>
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
            <div style={{ padding: "18px 60px 0" }}>
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
                <div style={{ padding: "14px 60px 0" }}>
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

            {/* ── Hero image floating above footer ── */}
            {templateData.heroImage && (
                <div style={{ position: "absolute", bottom: 155, left: "50%", transform: "translateX(-50%)" }}>
                    <img
                        src={templateData.heroImage}
                        style={{ height: 190, objectFit: "contain", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))" }}
                        alt="hero"
                    />
                </div>
            )}

            <PosterFooter templateData={templateData} />
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
        <div className="w-full h-full relative overflow-hidden" style={{ background: "#d4eaf7", fontFamily: "Arial, sans-serif" }}>

            {/* ── Header: Logo + Company ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 50px" }}>
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
            <div style={{ marginLeft: 50, marginRight: 50, paddingLeft: 24, borderLeft: "10px solid #1a3a6b" }}>
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
                <div style={{ marginTop: 16 }}>
                    <img
                        src={templateData.heroImage}
                        style={{ width: "100%", height: 360, objectFit: "cover" }}
                        alt="destination"
                    />
                </div>
            )}

            {/* ── Services icon row ── */}
            <div style={{ display: "flex", justifyContent: "center", gap: 18, padding: "14px 50px", flexWrap: "wrap" }}>
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

            <PosterFooter templateData={templateData} />
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
        <div className="w-full h-full relative overflow-hidden" style={{ background: "#0e7490", fontFamily: "Arial, sans-serif" }}>

            {/* ── Right panel: hero image ── */}
            {templateData.heroImage && (
                <div style={{ position: "absolute", right: 0, top: 0, width: "44%", height: "54%" }}>
                    <img
                        src={templateData.heroImage}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        alt="destination"
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 55%, #0e7490)" }} />
                </div>
            )}

            {/* ── Left panel ── */}
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

            {/* ── Yellow band ── */}
            <div style={{
                position: "absolute",
                left: 0, right: 0,
                top: "50%",
                background: "#facc15",
                padding: "14px 50px",
                zIndex: 4,
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
            }}>
                {templateData.offer && (
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#1a2d5a" }}>{templateData.offer}</div>
                )}
                <div style={{ fontSize: 20, color: "#374151", fontWeight: 600 }}>
                    {services.join(" | ")}
                </div>
            </div>

            {/* ── Bullet points ── */}
            <div style={{
                position: "absolute",
                left: 0, right: 0,
                top: "60%",
                padding: "18px 50px",
                zIndex: 4,
            }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                    {bullets.map((b: string) => (
                        <div key={b} style={{ fontSize: 22, color: "white", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#facc15", fontWeight: 900 }}>—</span> {b}
                        </div>
                    ))}
                </div>
            </div>

            <PosterFooter templateData={templateData} />
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
        default:                   return <ElegantLayout {...props} />;
    }
};
