"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, GripVertical, Save, Sparkles } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/glass/GlassInput";
import { toast } from "sonner";
import { LayoutRenderer } from "@/components/social/templates/layouts/LayoutRenderer";

interface Slide {
    id: string;
    layout: string;
    data: any;
}

interface Props {
    initialData: any;
    onSave: (slides: Slide[]) => void;
}

export const CarouselBuilder = ({ initialData, onSave }: Props) => {
    const [slides, setSlides] = useState<Slide[]>([
        { id: '1', layout: 'Elegant', data: { ...initialData } }
    ]);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const addSlide = () => {
        const newSlide: Slide = {
            id: Date.now().toString(),
            layout: 'Elegant',
            data: { ...initialData }
        };
        setSlides([...slides, newSlide]);
        setActiveSlideIndex(slides.length);
        toast.success("New slide added!");
    };

    const removeSlide = (id: string) => {
        if (slides.length <= 1) return;
        const newSlides = slides.filter(s => s.id !== id);
        setSlides(newSlides);
        if (activeSlideIndex >= newSlides.length) {
            setActiveSlideIndex(newSlides.length - 1);
        }
    };

    const updateSlideData = (field: string, value: any) => {
        const newSlides = [...slides];
        newSlides[activeSlideIndex].data = {
            ...newSlides[activeSlideIndex].data,
            [field]: value
        };
        setSlides(newSlides);
    };

    const handleLayoutChange = (layout: string) => {
        const newSlides = [...slides];
        newSlides[activeSlideIndex].layout = layout;
        setSlides(newSlides);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar with Slide Reordering */}
            <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Slides ({slides.length}/10)</h3>
                    <Button size="sm" variant="outline" onClick={addSlide} disabled={slides.length >= 10}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </div>

                <Reorder.Group axis="y" values={slides} onReorder={setSlides} className="space-y-3">
                    {slides.map((slide, index) => (
                        <Reorder.Item
                            key={slide.id}
                            value={slide}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${activeSlideIndex === index
                                ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                                }`}
                            onClick={() => setActiveSlideIndex(index)}
                        >
                            <GripVertical className="w-4 h-4 text-slate-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-500 uppercase">Slide {index + 1}</p>
                                <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                                    {slide.data.destination || "Untitled Slide"}
                                </p>
                            </div>
                            {slides.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4" onClick={() => onSave(slides)}>
                    <Save className="w-4 h-4 mr-2" /> Save Carousel
                </Button>
            </div>

            {/* Main Preview & Editor */}
            <div className="lg:col-span-9 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Live Preview of Active Slide */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Preview: Slide {activeSlideIndex + 1}</span>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" disabled={activeSlideIndex === 0} onClick={() => setActiveSlideIndex(v => v - 1)}>
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button size="icon" variant="ghost" disabled={activeSlideIndex === slides.length - 1} onClick={() => setActiveSlideIndex(v => v + 1)}>
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="aspect-square bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <LayoutRenderer
                                layout={slides[activeSlideIndex].layout}
                                data={slides[activeSlideIndex].data}
                            />
                        </div>
                    </div>

                    {/* Editor for Active Slide */}
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h4 className="font-bold text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" /> Slide Customizer
                            </h4>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Layout Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Elegant', 'Split', 'Geometric', 'Creative'].map(l => (
                                        <button
                                            key={l}
                                            onClick={() => handleLayoutChange(l)}
                                            className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${slides[activeSlideIndex].layout === l
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Headline</label>
                                <GlassInput
                                    value={slides[activeSlideIndex].data.destination}
                                    onChange={e => updateSlideData('destination', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Price Text</label>
                                <GlassInput
                                    value={slides[activeSlideIndex].data.price}
                                    onChange={e => updateSlideData('price', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Offer Label</label>
                                <GlassInput
                                    value={slides[activeSlideIndex].data.offer}
                                    onChange={e => updateSlideData('offer', e.target.value)}
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
