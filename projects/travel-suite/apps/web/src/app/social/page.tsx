"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  Megaphone, Download, Image as ImageIcon, Sparkles, MessageSquare,
  Wand2, Instagram, Linkedin, RefreshCcw, Copy, Check, Upload, ArrowRight,
  Star, Palette, Hash, Loader2
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { format } from "date-fns";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { Button } from "@/components/ui/button";

// --- Types ---
type Tab = "templates" | "reviews" | "extractor" | "captions";

interface TemplateData {
  companyName: string;
  logoUrl?: string; // Users can drag-and-drop a transparent PNG logo
  logoWidth: number;
  destination: string;
  price: string;
  offer: string;
  season: string;
  contactNumber: string;
  heroImage: string; // The primary background image (Unsplash or Uploaded)
  overlayImage?: string; // e.g. An uploaded floating car or passport PNG
  services: string[];
  bulletPoints: string[];
  reviewText?: string;
  reviewerName?: string;
  reviewerTrip?: string;
}

// 30 Presets Data (Themed backgrounds, colors, and layout types)
const PRESET_TEMPLATES = [
  { id: "summer-1", name: "Summer Blast", bg: "from-orange-400 to-rose-400", layout: "center" },
  { id: "summer-2", name: "Tropical Escape", bg: "from-emerald-400 to-cyan-400", layout: "split" },
  { id: "winter-1", name: "Winter Wonderland", bg: "from-blue-400 to-indigo-600", layout: "bottom" },
  { id: "winter-2", name: "Snowy Peaks", bg: "from-slate-200 to-slate-400 text-slate-800", layout: "center" },
  { id: "diwali-1", name: "Festive Diwali", bg: "from-amber-600 to-rose-700", layout: "elegant" },
  { id: "diwali-2", name: "Deepavali Lights", bg: "from-yellow-400 to-orange-500", layout: "bottom" },
  { id: "xmas-1", name: "Merry Christmas", bg: "from-red-600 to-green-700", layout: "center" },
  { id: "xmas-2", name: "Holiday Cheer", bg: "from-red-500 to-red-800", layout: "elegant" },
  { id: "luxury-1", name: "Luxury Premium", bg: "from-slate-900 to-black text-amber-400", layout: "elegant" },
  { id: "luxury-2", name: "Golden Aura", bg: "from-amber-200 to-yellow-500 text-slate-900", layout: "split" },
  { id: "honey-1", name: "Romantic Honeymoon", bg: "from-pink-300 to-rose-400", layout: "center" },
  { id: "honey-2", name: "Couple Getaway", bg: "from-fuchsia-500 to-pink-500", layout: "bottom" },
  { id: "adven-1", name: "Adrenaline Rush", bg: "from-emerald-600 to-teal-800", layout: "split" },
  { id: "adven-2", name: "Mountain Trekking", bg: "from-stone-600 to-stone-800", layout: "center" },
  { id: "family-1", name: "Family Vacation", bg: "from-sky-400 to-blue-500", layout: "bottom" },
  { id: "family-2", name: "Kids Special", bg: "from-yellow-300 to-lime-400 text-slate-800", layout: "split" },
  { id: "sale-1", name: "Flash Sale", bg: "from-red-500 to-rose-600", layout: "center" },
  { id: "sale-2", name: "Last Minute", bg: "from-orange-500 to-red-500", layout: "elegant" },
  { id: "weekend-1", name: "Weekend Vibe", bg: "from-purple-400 to-fuchsia-500", layout: "split" },
  { id: "weekend-2", name: "Quick Getaway", bg: "from-teal-400 to-emerald-500", layout: "bottom" },
  { id: "newyear-1", name: "New Year Eve", bg: "from-indigo-900 to-slate-900 text-amber-200", layout: "elegant" },
  { id: "newyear-2", name: "Party Time", bg: "from-violet-600 to-purple-800", layout: "center" },
  { id: "europe-1", name: "Euro Tour", bg: "from-blue-600 to-indigo-800", layout: "split" },
  { id: "asia-1", name: "Exotic Asia", bg: "from-red-700 to-rose-900 text-yellow-400", layout: "bottom" },
  { id: "bali-1", name: "Bali Bliss", bg: "from-emerald-400 to-cyan-500", layout: "center" },
  { id: "maldives-1", name: "Maldives Blue", bg: "from-cyan-300 to-blue-500", layout: "elegant" },
  { id: "dubai-1", name: "Dubai Desert", bg: "from-orange-300 to-amber-500 text-slate-900", layout: "split" },
  { id: "kerala-1", name: "Kerala God's Own", bg: "from-green-500 to-emerald-700", layout: "bottom" },
  { id: "goa-1", name: "Goa Calling", bg: "from-yellow-400 to-orange-400 text-slate-800", layout: "center" },
  { id: "cruise-1", name: "Ocean Cruise", bg: "from-blue-400 to-sky-600", layout: "elegant" }
];

const PRO_TEMPLATES = [
  { id: "pro-excursion", name: "The Excursion Grid", layout: "excursion" },
  { id: "pro-service", name: "Service Showcase", layout: "service" },
  { id: "pro-hero", name: "Hero Cutout", layout: "hero" },
  { id: "pro-review", name: "Customer Love", layout: "review" }
];

export default function SocialStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("templates");

  // Template State
  const [templateData, setTemplateData] = useState<TemplateData>({
    companyName: "GoBuddy Adventures",
    logoWidth: 200,
    destination: "Maldives 4N/5D",
    price: "₹45,999",
    offer: "Flat 20% OFF",
    season: "Summer Edition",
    contactNumber: "+91 85534 40021",
    heroImage: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80&w=1080", // Default Unsplash Maldives image
    services: ["Flights", "Hotels", "Holidays", "Visa"],
    bulletPoints: ["Airport Transfers", "City Tours", "Corporate Travel", "Night Out on the Town"]
  });

  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<{ id: string; url: string }[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  
  // File Upload Handlers (Client-Side Only using createObjectURL for immediate preview)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero' | 'overlay') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'logo') setTemplateData(prev => ({ ...prev, logoUrl: url }));
      if (type === 'hero') setTemplateData(prev => ({ ...prev, heroImage: url }));
      if (type === 'overlay') setTemplateData(prev => ({ ...prev, overlayImage: url }));
      toast.success("Image added to templates!");
    }
  };

  const fetchUnsplashImages = async () => {
    if (!unsplashQuery) return;
    setSearchingUnsplash(true);
    try {
      const response = await fetch(`/api/unsplash?query=${encodeURIComponent(unsplashQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setUnsplashResults(
        data.results.map((img: { id: string; urls: { regular: string } }) => ({
          id: img.id,
          url: img.urls.regular,
        }))
      );
    } catch {
      toast.error("Failed to fetch images.");
    } finally {
      setSearchingUnsplash(false);
    }
  };

  // Extract Flow State
  const [extracting, setExtracting] = useState(false);
  const [selectedProPreset, setSelectedProPreset] = useState<typeof PRO_TEMPLATES[0] | null>(null);
  const [extractorFile, setExtractorFile] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Reviews State
  const [reviewGenerating, setReviewGenerating] = useState<string | null>(null);

  // Captions State
  const [captions, setCaptions] = useState<{ instagram: string; linkedin: string; hashtags: string[] } | null>(null);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  // --- Image Downloader ---
  const downloadImage = async (elementId: string, filename: string) => {
    try {
      const node = document.getElementById(elementId);
      if (!node) return;
      
      const dataUrl = await toPng(node, { 
        quality: 1, 
        pixelRatio: 2, 
        width: 1080, 
        height: 1080,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
      toast.success("Design downloaded! Ready for Instagram.");
    } catch (e) {
      toast.error("Error generating image.");
    }
  };

  const handleMagicExtract = async (base64Image: string) => {
    setExtracting(true);
    try {
      const resp = await fetch("/api/social/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      
      if (!resp.ok) throw new Error("AI Extraction failed");
      
      const data = await resp.json();
      
      setTemplateData({
        ...templateData,
        destination: data.destination || templateData.destination,
        price: data.price || templateData.price,
        offer: data.offer || templateData.offer,
        season: data.season || templateData.season,
        contactNumber: data.contactNumber || templateData.contactNumber,
        companyName: data.companyName || templateData.companyName,
      });
      
      toast.success("AI extracted content from poster!");
      setActiveTab("templates");
    } catch (e) {
      toast.error("Error extracting details. Falling back to mock.");
      // Fallback
      setTemplateData({
        ...templateData,
        destination: "Dubai Desert Safari & City",
        price: "$499",
        offer: "Buy 1 Get 1 Free",
        season: "Summer Special"
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleExtractorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setExtractorFile(base64);
        handleMagicExtract(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareToLinkedIn = () => {
    toast.success("Ready to share! Make sure you are authenticated with LinkedIn.");
  };

  const handleGenerateCaptions = async () => {
    setGeneratingCaptions(true);
    try {
      const resp = await fetch("/api/social/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateData }),
      });
      if (!resp.ok) throw new Error("Caption generation failed");
      const data = await resp.json();
      setCaptions(data);
    } catch (e) {
      toast.error("Error generating captions.");
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const renderTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {[
        { id: "templates", label: "Marketing Studio", icon: Palette },
        { id: "reviews", label: "Reviews to Insta", icon: Star },
        { id: "extractor", label: "Magic Poster Analyzer", icon: Wand2 },
        { id: "captions", label: "AI Captions", icon: MessageSquare }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderProLayout = (preset: typeof PRO_TEMPLATES[0]) => (
    <>
      {/* Shared Footer Bar Layer */}
      <div className="absolute bottom-0 left-0 right-0 h-[180px] bg-[#0E499D] flex items-center justify-between px-16 text-white z-50">
        <div className="space-y-4">
          <p className="text-3xl font-medium">For Bookings, Reach Out To Us:</p>
          <p className="text-5xl font-bold flex items-center gap-4"><MessageSquare strokeWidth={3} className="w-10 h-10" /> {templateData.contactNumber}</p>
        </div>
        <div className="flex items-center gap-8 bg-white p-4 rounded-3xl">
          <div className="text-right text-[#0E499D] font-medium leading-tight">
            <p className="text-2xl">Scan QR</p>
            <p className="text-2xl">Code for whatsapp</p>
          </div>
          <div className="bg-white p-2 border shadow-lg rounded-2xl">
            <QRCode value={`https://wa.me/${templateData.contactNumber.replace(/[^0-9]/g, '')}`} size={100} />
          </div>
        </div>
      </div>

      {preset.layout === 'service' && (
        <div className="flex w-full h-full pb-[180px]">
          {/* Left Side (Image) Optional Overlay */}
          <div className="w-1/2 relative bg-slate-100 flex flex-col">
            {/* Decorative Curve Overlays */}
            <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[50%] bg-[#0E499D]/10 rounded-full blur-3xl z-0"></div>
            
            {/* Logo Layer */}
            <div className="p-16 z-10 w-full flex justify-center">
              {templateData.logoUrl ? (
                <img src={templateData.logoUrl} style={{ width: templateData.logoWidth * 1.5 }} className="drop-shadow-xl object-contain" />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-400" /></div>
                  <span className="text-4xl font-bold text-slate-400">LOGO HERE</span>
                </div>
              )}
            </div>
            
            <div className="relative -mt-10 px-16 z-20 text-center flex-1 flex flex-col">
              <h1 className="text-[140px] leading-[0.9] font-black tracking-tighter text-[#0E499D] drop-shadow-sm">{templateData.season.split(' ')[0]}</h1>
              <h2 className="text-[80px] font-bold text-purple-700 tracking-tight leading-none mt-2">{templateData.season.split(' ').slice(1).join(' ')}</h2>
              
              <div className="bg-gradient-to-r from-teal-400 to-blue-500 mt-8 mb-12 py-6 px-12 rounded-full mx-auto text-white shadow-xl shadow-blue-500/20">
                <p className="text-4xl font-bold text-white drop-shadow-md tracking-wider">Experience Unmatched Comfort!</p>
              </div>
              
              <p className="text-6xl text-purple-800 font-bold mb-8">Why Choose Us?</p>
              <div className="flex gap-4 justify-center border-4 border-slate-200 p-8 rounded-3xl bg-white shadow-xl">
                {['Luxurious Fleet', 'Professional Drivers', 'Safety First'].map((item, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star fill="currentColor" className="w-10 h-10 text-purple-600" />
                    </div>
                    <p className="text-2xl font-semibold leading-tight">{item.split(' ')[0]}<br/>{item.split(' ').slice(1).join(' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Services Overlay & Car */}
          <div className="w-1/2 relative bg-white border-l border-slate-100 pl-12 pr-16 pt-32 pb-16 flex flex-col justify-between">
              <div className="z-10 relative">
                <p className="text-5xl text-purple-800 font-bold text-center mb-10">Services Offered</p>
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
                  {templateData.bulletPoints.map((bp, i) => (
                    <div key={i} className="flex items-center text-3xl font-medium text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-teal-500 mr-4"></div> {bp}
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Car/Product Shot (Fallback to generic placeholder if not uploaded) */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[800px] z-30">
                {templateData.overlayImage ? (
                  <img src={templateData.overlayImage} className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full aspect-video bg-slate-100 rounded-[80px] border-[12px] border-white shadow-2xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[#0E499D]/10"></div>
                    <p className="text-4xl font-bold text-slate-300">Upload product overlay (Optional)</p>
                  </div>
                )}
              </div>
              
              {/* Blue wave graphic mock */}
              <div className="absolute bottom-20 left-0 right-0 h-48 bg-gradient-to-r from-[#0E499D] to-blue-500 rounded-t-[100%] scale-110 opacity-80 blur-sm"></div>
          </div>
        </div>
      )}

      {preset.layout === 'excursion' && (
        <div className="w-full h-full relative bg-white pb-[180px]">
          {/* Header Banner */}
          <div className="relative h-[280px] overflow-hidden bg-[#0E499D]">
            <img src={templateData.heroImage} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col items-center justify-center p-12 h-full text-center">
              {templateData.logoUrl && (
                <img src={templateData.logoUrl} style={{ width: templateData.logoWidth }} className="bg-white p-4 rounded-full drop-shadow-xl absolute top-8" />
              )}
              <div className="bg-red-500 text-white mt-auto px-16 py-4 rounded-xl relative shadow-xl transform hover:-translate-y-1 transition-transform">
                {/* Ribbon tails mock */}
                <div className="absolute top-0 -left-6 border-[20px] border-l-transparent border-red-700 w-0 h-0 scale-y-150"></div>
                <div className="absolute top-0 -right-6 border-[20px] border-r-transparent border-red-700 w-0 h-0 scale-y-150"></div>
                <h1 className="text-6xl font-black uppercase tracking-widest">{templateData.offer || 'DISCOVER MORE'}</h1>
              </div>
              <h2 className="text-[90px] font-black text-[#0E499D] drop-shadow-[0_4px_4px_rgba(255,255,255,0.8)] leading-none mt-4 absolute -bottom-10 bg-white px-12 pb-2 pt-6 shadow-xl z-20" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)'}}>{templateData.destination}</h2>
            </div>
          </div>

          {/* Hex Grid Section */}
          <div className="px-16 pt-32 pb-16 h-full flex flex-col justify-between">
            {/* Decorative Hexagons mapped to text inputs for now */}
            <div className="grid grid-cols-3 gap-8 mx-auto self-center opacity-40">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-square bg-slate-200 border-[16px] border-yellow-400 overflow-hidden flex flex-col items-center justify-center p-8 bg-cover bg-center shadow-lg" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}>
                      {/* Abstract shapes as placeholders if we dont want to manage 6 image inputs yet */}
                      <div className="w-full h-full bg-slate-300"></div>
                  </div>
                ))}
            </div>

            {/* Service Icons Footer Ribbon */}
            <div className="flex justify-between items-center px-16 -mb-8">
              <div className="w-1/4 h-[3px] bg-red-500"></div>
              <p className="text-4xl text-red-600 font-bold uppercase tracking-widest bg-white z-10 px-8 rounded-full border border-red-100 shadow-sm">BOOK YOUR</p>
              <div className="w-1/4 h-[3px] bg-red-500"></div>
            </div>
            <div className="flex justify-around items-end pt-12 pb-8">
              {templateData.services.map((svc, i) => (
                <div key={i} className="text-center group">
                  <div className="w-32 h-32 rounded-3xl bg-[#0E499D] text-white flex items-center justify-center mx-auto mb-4 shadow-xl transform group-hover:scale-105 transition-transform">
                    <Star className="w-16 h-16" fill="currentColor" />
                  </div>
                  <p className="text-3xl font-bold text-[#0E499D] uppercase tracking-wider">{svc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {preset.layout === 'hero' && (
        <div className="w-full h-full relative overflow-hidden flex flex-col pb-[180px] bg-slate-900">
          <img src={templateData.heroImage} className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-[10s]" />
          
          <div className="absolute top-12 left-0 right-0 z-20 flex justify-center">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-full shadow-2xl border border-white/50">
              {templateData.logoUrl ? (
                <img src={templateData.logoUrl} style={{ width: templateData.logoWidth * 0.8 }} className="" />
              ) : (
                <div className="text-xl font-bold text-slate-400 px-8">YOUR LOGO</div>
              )}
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-end items-center text-center pb-24 top-20">
            <div className="bg-[#e43b2c] text-white px-24 py-8 rounded-t-[40px] shadow-2xl skew-y-[-2deg] mb-[-40px]">
              <h2 className="text-6xl font-bold tracking-widest uppercase skew-y-[2deg]">{templateData.season}</h2>
            </div>
            <div className="bg-white z-20 px-32 py-12 rounded-[50px] shadow-2xl border-t-8 border-yellow-400 transform transition-transform hover:-translate-y-2">
              <h1 className="text-[120px] font-black leading-none text-[#0E499D] tracking-tighter filter drop-shadow-sm">{templateData.destination.split(' ')[0]}</h1>
              <h2 className="text-[70px] font-bold opacity-80 mt-[-10px] uppercase text-slate-800">{templateData.destination.split(' ').slice(1).join(' ')}</h2>
            </div>

            <div className="flex gap-16 mt-16 scale-110">
              {templateData.services.slice(0, 3).map((svc, i) => (
                <div key={i} className="bg-white px-12 py-6 rounded-3xl shadow-xl border-b-4 border-red-500 font-bold text-[#0E499D] text-4xl hover:scale-105 transition-transform cursor-pointer">
                  {svc}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {preset.layout === 'review' && (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center p-24 text-center relative overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
             <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
             
             <div className="relative z-10 w-full max-w-5xl mx-auto space-y-16">
               <div className="flex justify-center gap-2">
                 {[1,2,3,4,5].map(s => <Star key={s} className="w-16 h-16 text-amber-500 fill-amber-500" />)}
               </div>
               
               <h2 className="text-7xl font-serif italic text-slate-800 leading-tight">
                 &quot;{templateData.reviewText || 'The most incredible experience of our lives! Every detail was planned perfectly. Will definitely book again.'}&quot;
               </h2>
               
               <div className="pt-12 flex flex-col items-center">
                 <div className="h-1 bg-slate-200 w-32 mb-12"></div>
                 <p className="text-4xl font-black uppercase tracking-[0.2em] text-slate-900">{templateData.reviewerName || "Sarah Jenkins"}</p>
                 <p className="text-2xl text-slate-500 mt-4 font-medium">{templateData.reviewerTrip || "Maldives Honeymoon"}</p>
               </div>

               <div className="pt-20 flex justify-center items-center gap-12">
                 <p className="text-3xl font-bold text-primary">{templateData.companyName}</p>
                 <div className="h-8 w-[2px] bg-slate-200"></div>
                 <p className="text-2xl text-slate-400 font-medium">{templateData.contactNumber}</p>
               </div>
             </div>
          </div>
        )}
      </>
    );

  const renderTemplateStudio = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-4">
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> Dynamic Content
          </h3>
          <p className="text-sm text-slate-500">Update once, applies to all 30 templates instantly.</p>
          
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Company Name</label>
              <GlassInput value={templateData.companyName} onChange={e => setTemplateData({...templateData, companyName: e.target.value})} />
            </div>
            {/* Asset Pickers */}
            <div className="pt-2 pb-2 space-y-3 border-y border-dashed border-slate-200 dark:border-slate-800">
               <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                   Agency Logo (PNG)
                   {templateData.logoUrl && (
                     <span className="text-red-500 cursor-pointer" onClick={() => setTemplateData(p => ({...p, logoUrl: undefined}))}>Remove</span>
                   )}
                 </label>
                 <div className="mt-1 relative border rounded-xl overflow-hidden bg-slate-50">
                   <input type="file" accept="image/png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'logo')} />
                   <div className="py-2 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                     <Upload className="w-4 h-4" /> {templateData.logoUrl ? 'Change Logo' : 'Upload Transparent Logo'}
                   </div>
                 </div>
                 {templateData.logoUrl && (
                   <div className="mt-2 pl-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Scale Logo</label>
                      <input type="range" min="100" max="600" value={templateData.logoWidth} onChange={e => setTemplateData(p => ({...p, logoWidth: Number(e.target.value)}))} className="w-full" />
                   </div>
                 )}
               </div>

               <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Hero / Background Photo</label>
                 <div className="flex gap-2 mb-2">
                   <GlassInput placeholder="Search Unsplash (e.g. Paris)" value={unsplashQuery} onChange={e => setUnsplashQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUnsplashImages()} />
                   <Button onClick={fetchUnsplashImages} disabled={!unsplashQuery || searchingUnsplash}>{searchingUnsplash ? '...' : 'Search'}</Button>
                 </div>
                 {unsplashResults.length > 0 && (
                   <div className="grid grid-cols-2 gap-2 mb-2">
                     {unsplashResults.map(img => (
                       <div key={img.id} className="aspect-video relative rounded overflow-hidden cursor-pointer hover:ring-2 ring-primary" onClick={() => setTemplateData(p => ({...p, heroImage: img.url}))}>
                         <img src={img.url} className="w-full h-full object-cover" />
                       </div>
                     ))}
                   </div>
                 )}
                 <div className="relative border border-dashed rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors">
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'hero')} />
                   <div className="py-2 text-center text-sm text-slate-500">Or upload custom photo</div>
                 </div>
               </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Destination</label>
              <GlassInput value={templateData.destination} onChange={e => setTemplateData({...templateData, destination: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Price / Starting At</label>
                <GlassInput value={templateData.price} onChange={e => setTemplateData({...templateData, price: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Special Offer</label>
                <GlassInput value={templateData.offer} onChange={e => setTemplateData({...templateData, offer: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Theme/Season (e.g. Summer Edition)</label>
              <GlassInput value={templateData.season} onChange={e => setTemplateData({...templateData, season: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Contact Number</label>
              <GlassInput value={templateData.contactNumber} onChange={e => setTemplateData({...templateData, contactNumber: e.target.value})} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Templates Gallery */}
      <div className="lg:col-span-8 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">1-Click Pro Posters</h2>
          <span className="text-sm text-slate-500 text-right">{PRO_TEMPLATES.length} pro layouts<br/>{PRESET_TEMPLATES.length} gradients</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* ADVANCED PRO TEMPLATES RENDERING */}
          {PRO_TEMPLATES.map((preset) => (
             <div key={preset.id} className="group col-span-1 relative rounded-xl overflow-hidden hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 bg-white">
                
                {/* HIGH RES RENDERER (OFFSCREEN) */}
                <div 
                  id={`export-${preset.id}`}
                  className="absolute top-0 left-0 w-[1080px] h-[1080px] -z-50 bg-white flex flex-col text-slate-900 relative overflow-hidden"
                >
                   {renderProLayout(preset)}
                </div>

                {/* SCALED PREVIEW CONTAINER */}
                <div className="relative aspect-square w-full overflow-hidden bg-white/5 flex items-center justify-center border-b border-slate-100">
                   <div 
                      className="pointer-events-none origin-top-left w-[1080px] h-[1080px]"
                      style={{ transform: `scale(${1 / 3.3})` }} // Matches structural layout
                   >
                     {/* Exact duplicate of HTML structure for accurate visual preview - skipping re-typing for this snippet chunking. It reads from the DOM nodes on export anyway! */}
                      {/* For speed of preview rendering, we can actually clone the DOM node in React, but duplicating logic here ensures standard visual flow. */}
                      <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden">
                        {renderProLayout(preset)}
                      </div>
                   </div>

                   {/* Hover Action */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-50">
                    <Button size="lg" className="bg-white text-black hover:bg-slate-200 shadow-xl" onClick={() => downloadImage(`export-${preset.id}`, `${preset.name.replace(/\s+/g, '-')}-HQ-Promo.png`)}>
                      <Download className="w-5 h-5 mr-2" /> Export 1080x1080
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{preset.name}</h4>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Premium Structure</p>
                  </div>
                </div>
             </div>
          ))}

          {/* LEGACY GRADIENT TEMPLATES */}
          {PRESET_TEMPLATES.map((preset) => (
            <div key={preset.id} className="group relative rounded-xl overflow-hidden hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              
              {/* THE RAW OFFSCREEN HTML TEMPLATE (RENDERED 1080x1080 FOR HIGH QUALITY EXPORT) */}
              <div 
                id={`export-${preset.id}`}
                className={`absolute top-0 left-0 w-[1080px] h-[1080px] -z-50 bg-gradient-to-br ${preset.bg} flex flex-col items-center justify-center p-16 text-white`}
              >
                {/* Visual Logic based on Layout Type */}
                {preset.layout === 'center' && (
                  <div className="text-center space-y-12">
                     <h3 className="text-4xl font-bold tracking-widest uppercase opacity-80">{templateData.season}</h3>
                     <h1 className="text-[120px] font-black leading-none drop-shadow-xl">{templateData.destination}</h1>
                     <div className="bg-white/20 backdrop-blur-md px-16 py-6 rounded-full inline-block border border-white/40">
                       <span className="text-6xl font-bold">{templateData.offer}</span>
                     </div>
                     <p className="text-7xl font-bold tracking-tight">Starting @ {templateData.price}</p>
                     
                     <div className="absolute bottom-16 left-0 right-0 text-center">
                        <div className="text-4xl font-bold bg-black/40 inline-flex px-12 py-6 rounded-2xl">
                          {templateData.companyName} • {templateData.contactNumber}
                        </div>
                     </div>
                  </div>
                )}
                {preset.layout === 'split' && (
                  <div className="w-full h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start w-full">
                       <h2 className="text-5xl font-bold tracking-wider">{templateData.companyName}</h2>
                       <div className="bg-white text-black px-8 py-4 rounded-xl text-3xl font-bold shadow-lg">
                         {templateData.season}
                       </div>
                     </div>
                     <div className="space-y-6">
                       <h1 className="text-[140px] font-black leading-none tracking-tighter">{templateData.destination}</h1>
                       <p className="text-6xl font-medium opacity-90">{templateData.offer}</p>
                     </div>
                     <div className="flex justify-between items-end w-full">
                       <div className="text-8xl font-black">{templateData.price}</div>
                       <div className="text-4xl font-semibold bg-black/30 p-8 rounded-3xl backdrop-blur-sm">
                         Call: {templateData.contactNumber}
                       </div>
                     </div>
                  </div>
                )}
                {preset.layout === 'bottom' && (
                  <div className="w-full h-full relative">
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
                )}
                {preset.layout === 'elegant' && (
                  <div className="w-full h-full flex items-center justify-center border-[20px] border-white/20 p-16">
                    <div className="w-full h-full border-[4px] border-white/40 flex flex-col items-center justify-center p-16 text-center space-y-16">
                      <p className="text-5xl tracking-[1em] uppercase font-light opacity-80">{templateData.season}</p>
                      <h1 className="text-[130px] font-serif font-bold leading-none">{templateData.destination}</h1>
                      <div className="w-32 h-2 bg-white/50 rounded-full my-8"></div>
                      <p className="text-6xl font-light italic">{templateData.offer}</p>
                      <p className="text-8xl font-serif mt-8">{templateData.price}</p>
                      <div className="mt-auto pt-16">
                        <p className="text-4xl tracking-widest">{templateData.companyName}</p>
                        <p className="text-3xl mt-6 opacity-60 font-serif">{templateData.contactNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VISUAL MINIATURE PREVIEW (SCALED DOWN VIA CSS) */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                <div 
                  className={`pointer-events-none origin-top-left w-[1080px] h-[1080px] bg-gradient-to-br ${preset.bg} flex flex-col items-center justify-center p-16 text-white`}
                  style={{ transform: `scale(${1 / 4})` }} // Scaled 1080px -> ~270px
                >
                  {/* Duplicate visual logic for the preview */}
                  {preset.layout === 'center' && (
                  <div className="text-center space-y-12 w-full">
                     <h3 className="text-4xl font-bold tracking-widest uppercase opacity-80 truncate">{templateData.season}</h3>
                     <h1 className="text-[120px] font-black leading-none drop-shadow-xl line-clamp-2">{templateData.destination}</h1>
                     <div className="bg-white/20 backdrop-blur-md px-16 py-6 rounded-full inline-block border border-white/40">
                       <span className="text-6xl font-bold">{templateData.offer}</span>
                     </div>
                     <p className="text-7xl font-bold tracking-tight">Starting @ {templateData.price}</p>
                     <div className="absolute bottom-16 left-0 right-0 text-center">
                        <div className="text-4xl font-bold bg-black/40 inline-flex px-12 py-6 rounded-2xl">
                          {templateData.companyName} • {templateData.contactNumber}
                        </div>
                     </div>
                  </div>
                  )}
                  {preset.layout === 'split' && (
                  <div className="w-full h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start w-full">
                       <h2 className="text-5xl font-bold tracking-wider">{templateData.companyName}</h2>
                       <div className="bg-white text-[var(--tw-gradient-from)] px-8 py-4 rounded-xl text-3xl font-bold shadow-lg">
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
                  )}
                  {preset.layout === 'bottom' && (
                  <div className="w-full h-full relative">
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
                  )}
                  {preset.layout === 'elegant' && (
                  <div className="w-full h-full flex items-center justify-center border-[20px] border-white/20 p-16">
                    <div className="w-full h-full border-[4px] border-white/40 flex flex-col items-center justify-center p-16 text-center space-y-16">
                      <p className="text-5xl tracking-[1em] uppercase font-light opacity-80">{templateData.season}</p>
                      <h1 className="text-[130px] font-serif font-bold leading-none">{templateData.destination}</h1>
                      <div className="w-32 h-2 bg-white/50 rounded-full my-8"></div>
                      <p className="text-6xl font-light italic">{templateData.offer}</p>
                      <p className="text-8xl font-serif mt-8">{templateData.price}</p>
                      <div className="mt-auto pt-16">
                        <p className="text-4xl tracking-widest">{templateData.companyName}</p>
                        <p className="text-3xl mt-6 opacity-60 font-serif">{templateData.contactNumber}</p>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Hover UI */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                   <Button size="lg" className="bg-white text-black hover:bg-slate-200 shadow-xl" onClick={() => downloadImage(`export-${preset.id}`, `${preset.name.replace(/\s+/g, '-')}-Marketing-Poster.png`)}>
                     <Download className="w-5 h-5 mr-2" /> Download HQ
                   </Button>
                </div>
              </div>

              {/* Data Overlay */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <div>
                   <p className="text-sm font-semibold">{preset.name}</p>
                   <p className="text-xs text-slate-500">{preset.layout.toUpperCase()} Layout</p>
                 </div>
                 <div className="flex gap-1">
                   <Instagram className="w-4 h-4 text-pink-500" />
                   <Linkedin className="w-4 h-4 text-blue-600" />
                 </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMagicExtractor = () => (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wand2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold">Magic Poster Analyzer</h2>
        <p className="text-slate-500 text-lg">
          Upload an old flyer, screenshot, or competitor poster. Our AI vision model will instantly extract all details (Destination, Prices, Dates, Offers) and map them to our gorgeous Marketing Studio templates!
        </p>
      </div>

      <GlassCard className="p-8 border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
        {extractorFile && (
          <div className="absolute inset-0 z-0">
            <img src={extractorFile} alt="Target" className="w-full h-full object-cover opacity-10 blur-sm" />
          </div>
        )}
        
        {!extracting ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10">
            {extractorFile ? (
               <div className="w-48 h-64 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden border-4 border-white">
                  <img src={extractorFile} alt="Original" className="w-full h-full object-cover" />
               </div>
            ) : (
              <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-md rounded-2xl flex items-center justify-center">
                 <ImageIcon className="w-10 h-10 text-slate-400" />
              </div>
            )}
            <div className="text-center">
               <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                 {extractorFile ? "Ready to analyze this poster?" : "Drag and drop any image"}
               </p>
               <p className="text-sm text-slate-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
            </div>
            <div className="relative flex gap-3">
              <input 
                type="file" 
                id="poster-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleExtractorFileChange}
              />
              <Button variant="outline" size="lg" className="px-8" onClick={() => document.getElementById('poster-upload')?.click()}>
                {extractorFile ? "Change Image" : "Select Image"}
              </Button>
              {extractorFile && (
                <Button size="lg" className="px-8 shadow-xl bg-blue-600 hover:bg-blue-700" onClick={() => handleMagicExtract(extractorFile)}>
                  <Sparkles className="w-5 h-5 mr-2" /> Start AI Extraction
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10">
             <div className="relative">
               <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
                 <Sparkles className="w-10 h-10 text-white" />
               </div>
               <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl animate-pulse opacity-50 -z-10"></div>
             </div>
             <div className="text-center">
               <p className="text-xl font-bold text-slate-700 dark:text-slate-200 animate-pulse">AI is reading your poster...</p>
               <p className="text-sm text-slate-500 mt-2">Extracting destinations, parsing currencies, detecting offers.</p>
             </div>
          </div>
        )}
      </GlassCard>
    </div>
  );

  const renderReviewsToInsta = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 items-center max-w-6xl mx-auto">
       <div className="space-y-6">
         <h2 className="text-4xl font-bold tracking-tight">Convert love into marketing.</h2>
         <p className="text-lg text-slate-500 pr-12">
            Turn your 5-star customer reviews into beautiful, brand-aligned social media posts with one click. Share them directly to Instagram or LinkedIn to build massive trust.
         </p>
         
         <div className="space-y-4 pt-4">
           {[
             { name: "Sarah Jenkins", trip: "Maldives Honeymoon", text: "The most incredible experience of our lives! Every detail was planned perfectly. Will definitely book again." },
             { name: "Rahul Sharma", trip: "Dubai 4N/5D", text: "Exceptional service from the team. The desert safari was the highlight of our trip. Highly recommend!" }
           ].map((review, i) => (
             <GlassCard key={i} className="p-5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setReviewGenerating(review.name)}>
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <p className="font-semibold text-slate-800 dark:text-slate-200">{review.name}</p>
                   <p className="text-xs text-slate-500">{review.trip}</p>
                 </div>
                 <div className="flex">
                   {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-emerald-500 fill-emerald-500" />)}
                 </div>
               </div>
               <p className="text-sm italic text-slate-600 dark:text-slate-400">&quot;{review.text}&quot;</p>
               <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                 <Button variant="ghost" size="sm" className="text-primary gap-1">
                   Create Post <ArrowRight className="w-4 h-4" />
                 </Button>
               </div>
             </GlassCard>
           ))}
         </div>
       </div>

       <div className="relative aspect-[4/5] bg-gradient-to-br from-slate-900 to-black rounded-3xl p-8 flex flex-col justify-center items-center shadow-2xl overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
         
         <AnimatePresence mode="wait">
           {reviewGenerating ? (
             <motion.div 
               key="review-ui"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative z-10 w-full bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl"
             >
               <div className="flex justify-center mb-8">
                 <div className="flex gap-1">
                   {[1,2,3,4,5].map(s => <Star key={s} className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-md" />)}
                 </div>
               </div>
               <h3 className="text-3xl text-white font-serif italic text-center leading-snug">&quot;The most incredible experience of our lives! Every detail was planned perfectly.&quot;</h3>
                <div className="mt-12 text-center">
                  <p className="text-white font-bold tracking-widest uppercase">{reviewGenerating}</p>
                  <p className="text-white/60 text-sm mt-1">Happy Customer</p>
                </div>
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-28 transition-all flex flex-col gap-3">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 border-none shadow-xl text-white hover:opacity-90" onClick={() => {
                     const r = [
                      { name: "Sarah Jenkins", trip: "Maldives Honeymoon", text: "The most incredible experience of our lives! Every detail was planned perfectly. Will definitely book again." },
                      { name: "Rahul Sharma", trip: "Dubai 4N/5D", text: "Exceptional service from the team. The desert safari was the highlight of our trip. Highly recommend!" }
                    ].find(x => x.name === reviewGenerating);
                    if (r) {
                      setTemplateData(prev => ({
                        ...prev,
                        reviewText: r.text,
                        reviewerName: r.name,
                        reviewerTrip: r.trip
                      }));
                      setActiveTab("templates");
                      // Select the review pro template
                      // (Logic to set selected preset or layout would go here, 
                      // but since we render based on preset choice, we'll just switch tabs)
                    }
                  }}>
                    <Sparkles className="w-5 h-5 mr-2" /> Design Professional Post
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Instagram className="w-5 h-5 mr-2" /> Direct Share
                    </Button>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleShareToLinkedIn}>
                      <Linkedin className="w-5 h-5 mr-2" /> LinkedIn
                    </Button>
                  </div>
                </div>
              </motion.div>
           ) : (
             <motion.div 
               key="empty-ui"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center text-white/40 flex flex-col items-center"
             >
               <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
               <p>Select a review from the left to preview.</p>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
             <Megaphone className="w-8 h-8 text-primary" />
             Social Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Create completely free, high-converting social media marketing materials instantly.
          </p>
        </div>
      </div>

      {renderTabs()}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "templates" && renderTemplateStudio()}
          {activeTab === "extractor" && renderMagicExtractor()}
          {activeTab === "reviews" && renderReviewsToInsta()}
          {activeTab === "captions" && (
            <div className="max-w-4xl mx-auto mt-6 space-y-8 pb-20">
               <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-bold">AI Caption Engine</h2>
                    <p className="text-slate-500">Generate high-converting copy based on your current template details.</p>
                 </div>
                 <Button size="lg" disabled={generatingCaptions} onClick={handleGenerateCaptions} className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
                   {generatingCaptions ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                   {captions ? "Regenerate" : "Generate Captions"}
                 </Button>
               </div>

               {captions ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GlassCard className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-pink-500 font-bold mb-2">
                        <Instagram className="w-5 h-5" /> Instagram Card
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {captions.instagram}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full text-slate-500 group" onClick={() => { navigator.clipboard.writeText(captions.instagram); toast.success("Copied!"); }}>
                        <Copy className="w-4 h-4 mr-2 group-hover:text-primary" /> Copy to Clipboard
                      </Button>
                    </GlassCard>

                    <GlassCard className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                        <Linkedin className="w-5 h-5" /> LinkedIn Post
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {captions.linkedin}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full text-slate-500 group" onClick={() => { navigator.clipboard.writeText(captions.linkedin); toast.success("Copied!"); }}>
                        <Copy className="w-4 h-4 mr-2 group-hover:text-primary" /> Copy to Clipboard
                      </Button>
                    </GlassCard>

                    <div className="md:col-span-2">
                      <GlassCard className="p-6">
                        <p className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-500" /> Recommended Hashtags</p>
                        <div className="flex flex-wrap gap-2">
                          {captions.hashtags.map(tag => (
                            <span key={tag} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">#{tag}</span>
                          ))}
                        </div>
                      </GlassCard>
                    </div>
                 </div>
               ) : (
                <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                   <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-md rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                   </div>
                   <p className="text-xl font-medium text-slate-600 dark:text-slate-400">Ready to write some magic?</p>
                   <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">Click generate to get customized, high-converting copy for your social media posts based on your current package details.</p>
                </div>
               )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
