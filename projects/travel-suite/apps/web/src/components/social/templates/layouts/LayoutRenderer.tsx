"use client";

import { SocialTemplate } from "@/lib/social/types";

// This is a mapping from LayoutType to specific component implementations.
// In the full build, we map strings like 'CenterLayout' to actual structural components.
// We'll stub them out as dynamic functional components for now.

interface LayoutProps {
    templateData: any;
    preset: SocialTemplate;
}

export const CenterLayout = ({ templateData, preset }: LayoutProps) => (
    <div className="text-center space-y-12">
        <h3 className="text-4xl font-bold tracking-widest uppercase opacity-80">{templateData.season}</h3>
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
);

export const ElegantLayout = ({ templateData, preset }: LayoutProps) => (
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
                    <img src={templateData.logoUrl} style={{ width: templateData.logoWidth }} className="object-contain" />
                )}
            </div>
        </div>
    </div>
);

export const SplitLayout = ({ templateData, preset }: LayoutProps) => (
    <div className="w-full h-full flex flex-col justify-between">
        <div className="flex justify-between items-start w-full">
            <h2 className="text-5xl font-bold tracking-wider">{templateData.companyName}</h2>
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

export const BottomLayout = ({ templateData, preset }: LayoutProps) => (
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
);

// Stub ReviewLayout
export const ReviewLayout = ({ templateData }: LayoutProps) => (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-24 text-center relative overflow-hidden text-slate-800">
        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-16">
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s: number) => <span key={s} className="text-amber-500 text-6xl">★</span>)}
            </div>
            <h2 className="text-7xl font-serif italic text-slate-800 leading-tight">
                "{templateData.reviewText || 'The most incredible experience of our lives! Every detail was planned perfectly. Will definitely book again.'}"
            </h2>
            <div className="pt-12 flex flex-col items-center">
                <div className="h-1 bg-slate-200 w-32 mb-12"></div>
                <p className="text-4xl font-black uppercase tracking-[0.2em]">{templateData.reviewerName || "Sarah Jenkins"}</p>
                <p className="text-2xl text-slate-500 mt-4 font-medium">{templateData.reviewerTrip || "Maldives Honeymoon"}</p>
            </div>
            <div className="pt-20 flex justify-center items-center gap-12">
                <p className="text-3xl font-bold text-blue-600">{templateData.companyName}</p>
                <div className="h-8 w-[2px] bg-slate-200"></div>
                <p className="text-2xl text-slate-400 font-medium">{templateData.contactNumber}</p>
            </div>
        </div>
    </div>
);

// Stub CarouselLayout
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
