"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  Megaphone, Download, Image as ImageIcon, Sparkles, MessageSquare,
  Wand2, Instagram, Linkedin, RefreshCcw, Copy, Check, Upload, ArrowRight,
  Star, Palette
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { Button } from "@/components/ui/button";

// --- Types ---
type Tab = "templates" | "reviews" | "extractor" | "captions";

interface TemplateData {
  companyName: string;
  logoUrl?: string;
  destination: string;
  price: string;
  offer: string;
  season: string;
  contactNumber: string;
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

export default function SocialStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("templates");

  // Template State
  const [templateData, setTemplateData] = useState<TemplateData>({
    companyName: "GoBuddy Adventures",
    destination: "Maldives 4N/5D",
    price: "₹45,999",
    offer: "Flat 20% OFF",
    season: "Summer Edition",
    contactNumber: "+91 98765 43210"
  });

  // Extract Flow State
  const [extracting, setExtracting] = useState(false);
  
  // Reviews State
  const [reviewGenerating, setReviewGenerating] = useState<string | null>(null);

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

  const handleMagicExtract = () => {
    setExtracting(true);
    // Mock the AI extraction process
    setTimeout(() => {
      setTemplateData({
        ...templateData,
        destination: "Dubai Desert Safari & City",
        price: "$499",
        offer: "Buy 1 Get 1 Free",
        season: "Winter Escape"
      });
      setExtracting(false);
      toast.success("AI extracted content from poster!");
      setActiveTab("templates");
    }, 2500);
  };

  const handleShareToLinkedIn = () => {
    toast.success("Ready to share! Make sure you are authenticated with LinkedIn.");
  };

  // --- Rendering UI pieces ---

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
          <h2 className="text-xl font-bold">1-Click Posters</h2>
          <span className="text-sm text-slate-500">{PRESET_TEMPLATES.length} templates available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <GlassCard className="p-8 border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50">
        {!extracting ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-md rounded-2xl flex items-center justify-center">
               <ImageIcon className="w-10 h-10 text-slate-400" />
            </div>
            <div className="text-center">
               <p className="text-lg font-medium text-slate-700 dark:text-slate-200">Drag and drop any image</p>
               <p className="text-sm text-slate-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
            </div>
            <Button size="lg" className="px-8 shadow-xl" onClick={handleMagicExtract}>
              <Upload className="w-5 h-5 mr-2" /> Select Image
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
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
               <p className="text-sm italic text-slate-600 dark:text-slate-400">"{review.text}"</p>
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
               <h3 className="text-3xl text-white font-serif italic text-center leading-snug">"The most incredible experience of our lives! Every detail was planned perfectly."</h3>
               <div className="mt-12 text-center">
                 <p className="text-white font-bold tracking-widest uppercase">Sarah Jenkins</p>
                 <p className="text-white/60 text-sm mt-1">Maldives Package</p>
               </div>
               <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-28 transition-all flex gap-3">
                 <Button className="bg-gradient-to-r from-purple-500 to-pink-500 border-none shadow-xl text-white hover:opacity-90">
                   <Instagram className="w-5 h-5 mr-2" /> Share
                 </Button>
                 <Button className="bg-blue-600 border-none shadow-xl text-white hover:bg-blue-700" onClick={handleShareToLinkedIn}>
                   <Linkedin className="w-5 h-5 mr-2" /> Share
                 </Button>
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
            <div className="text-center py-20 opacity-50 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
               <p className="text-xl font-medium text-slate-600">AI Text Caption Generator running under the hood...</p>
               <p className="max-w-md mx-auto mt-2 text-sm text-slate-500">Available across the app whenever you create packages.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
