import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Download, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTemplatesByCategory, templates } from "@/lib/social/template-registry";
import { CenterLayout, ElegantLayout, SplitLayout, BottomLayout, ReviewLayout, CarouselSlideLayout } from "@/components/social/templates/layouts/LayoutRenderer";
import { SocialTemplate } from "@/lib/social/types";
import { toast } from "sonner";

interface Props {
    templateData: any;
}

export const TemplateGallery = ({ templateData }: Props) => {
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const PRESET_TEMPLATES = activeCategory === "All" ? templates : getTemplatesByCategory(activeCategory);

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

    const renderLayout = (preset: SocialTemplate) => {
        switch (preset.layout) {
            case "CenterLayout": return <CenterLayout templateData={templateData} preset={preset} />;
            case "ElegantLayout": return <ElegantLayout templateData={templateData} preset={preset} />;
            case "SplitLayout": return <SplitLayout templateData={templateData} preset={preset} />;
            case "BottomLayout": return <BottomLayout templateData={templateData} preset={preset} />;
            case "ReviewLayout": return <ReviewLayout templateData={templateData} preset={preset} />;
            case "CarouselSlideLayout": return <CarouselSlideLayout templateData={templateData} preset={preset} />;
            default: return <CenterLayout templateData={templateData} preset={preset} />;
        }
    };

    const renderBackground = (preset: SocialTemplate) => {
        if (preset.colorScheme === 'brand') return 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white';
        if (preset.colorScheme === 'dark') return 'bg-slate-900 text-white';
        if (preset.colorScheme === 'light') return 'bg-white text-slate-900';
        return 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white';
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-2">
                {["All", "Festival", "Package Type", "Destination", "Review", "Carousel"].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 hover:text-slate-800"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {PRESET_TEMPLATES.map((preset) => (
                    <div key={preset.id} className="group relative rounded-xl overflow-hidden hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col">

                        {/* THE RAW OFFSCREEN HTML TEMPLATE (RENDERED 1080x1080 FOR HIGH QUALITY EXPORT) */}
                        <div
                            id={`export-${preset.id}`}
                            className={`absolute top-0 left-0 w-[1080px] h-[1080px] -z-50 ${renderBackground(preset)} flex flex-col relative overflow-hidden`}
                        >
                            {renderLayout(preset)}
                        </div>

                        {/* VISUAL MINIATURE PREVIEW (SCALED DOWN VIA CSS) */}
                        <div className={`relative aspect-square w-full overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800`}>
                            <div
                                className={`pointer-events-none origin-top-left w-[1080px] h-[1080px] ${renderBackground(preset)} flex flex-col relative overflow-hidden shadow-inner`}
                                style={{ transform: `scale(${1 / 4})` }} // Scaled 1080px -> ~270px
                            >
                                {renderLayout(preset)}
                            </div>

                            {/* Hover UI */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-50">
                                <Button size="lg" className="bg-white text-black hover:bg-slate-200 shadow-xl font-semibold" onClick={() => downloadImage(`export-${preset.id}`, `${preset.name.replace(/\s+/g, '-')}-Marketing-Poster.png`)}>
                                    <Download className="w-5 h-5 mr-2" /> Download HQ
                                </Button>
                            </div>
                        </div>

                        {/* Data Overlay */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{preset.name}</p>
                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">{preset.layout.replace('Layout', '')}</p>
                            </div>
                            <div className="flex gap-1.5 opacity-60">
                                <Instagram className="w-4 h-4 text-pink-500" />
                                <Linkedin className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {PRESET_TEMPLATES.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 font-medium">No templates found in this category.</p>
                </div>
            )}
        </div>
    );
};
