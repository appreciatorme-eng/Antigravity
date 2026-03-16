"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Images, ArrowRightLeft, Plus, Check } from "lucide-react";
import { matchDestination, type DestinationImage } from "@/lib/social/destination-images";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GallerySlotPickerProps {
    /** Current gallery image URLs (one per slot) */
    galleryImages: string[];
    /** How many slots the current layout needs */
    slotCount: number;
    /** Current destination text (for suggesting images) */
    destination: string;
    /** Called when gallery images change */
    onGalleryChange: (images: string[]) => void;
    /** Called when a custom image is uploaded */
    onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GallerySlotPicker({
    galleryImages,
    slotCount,
    destination,
    onGalleryChange,
    onImageUpload,
}: GallerySlotPickerProps) {
    const [activeSlot, setActiveSlot] = useState<number | null>(null);

    // Get curated images for the current destination
    const curatedImages = matchDestination(destination);

    // Pad gallery to slotCount (fill with empty strings if needed)
    const slots = Array.from({ length: slotCount }, (_, i) => galleryImages[i] || "");

    // Swap an image into the active slot
    const handleSwap = useCallback(
        (imageUrl: string) => {
            if (activeSlot === null) return;
            const updated = [...slots];
            updated[activeSlot] = imageUrl;
            onGalleryChange(updated.filter(Boolean));
            setActiveSlot(null);
        },
        [activeSlot, slots, onGalleryChange],
    );

    // Check if an image is already in a slot
    const isInUse = useCallback(
        (url: string) => slots.some((s) => s === url),
        [slots],
    );

    // Collect all available images (curated + any extras from gallery not in curated)
    const availableImages: DestinationImage[] = curatedImages;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl text-violet-600 dark:text-violet-400">
                        <Images className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Gallery Images
                        </h3>
                        <p className="text-xs text-slate-500">
                            {slotCount} slots &middot; Click a slot, then pick an image
                        </p>
                    </div>
                </div>
            </div>

            {/* Slots Row */}
            <div className="flex gap-3 overflow-x-auto pb-1">
                {slots.map((url, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveSlot(activeSlot === idx ? null : idx)}
                        className={`relative shrink-0 rounded-xl overflow-hidden transition-all border-2 ${
                            activeSlot === idx
                                ? "border-violet-500 ring-2 ring-violet-500/30 scale-105"
                                : url
                                  ? "border-slate-200 dark:border-slate-700 hover:border-violet-300"
                                  : "border-dashed border-slate-300 dark:border-slate-600 hover:border-violet-300"
                        }`}
                        style={{ width: 100, height: 100 }}
                    >
                        {url ? (
                            <Image
                                src={url}
                                alt={`Slot ${idx + 1}`}
                                fill
                                sizes="100px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400">
                                <Plus className="w-5 h-5" />
                                <span className="text-[10px] mt-1">Empty</span>
                            </div>
                        )}
                        {/* Slot label */}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white">
                            {idx === 0 ? "Main" : `#${idx + 1}`}
                        </div>
                        {/* Swap icon */}
                        {url && activeSlot !== idx && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                                <ArrowRightLeft className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Available Images (shown when a slot is active) */}
            {activeSlot !== null && (
                <div className="space-y-2 animate-fade-in-up">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {availableImages.length > 0
                            ? `Pick an image for Slot ${activeSlot === 0 ? "Main" : `#${activeSlot + 1}`}`
                            : "No curated images found — try changing the destination"}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {availableImages.map((img, i) => {
                            const used = isInUse(img.url);
                            return (
                                <button
                                    key={i}
                                    onClick={() => !used && handleSwap(img.url)}
                                    disabled={used}
                                    className={`relative shrink-0 rounded-lg overflow-hidden transition-all ${
                                        used
                                            ? "opacity-40 cursor-not-allowed ring-2 ring-green-500"
                                            : "hover:ring-2 hover:ring-violet-500 hover:scale-105"
                                    }`}
                                    style={{ width: 80, height: 80 }}
                                    title={`${img.destination} — by ${img.photographer}`}
                                >
                                    <Image
                                        src={img.thumb}
                                        alt={img.destination}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                    />
                                    {used && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Check className="w-4 h-4 text-green-400" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5">
                                        <span className="text-[8px] text-white font-medium truncate block">
                                            {img.tags[0]}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Upload button */}
                        {onImageUpload && (
                            <label
                                className="shrink-0 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-violet-400 flex flex-col items-center justify-center cursor-pointer transition-colors"
                                style={{ width: 80, height: 80 }}
                            >
                                <Plus className="w-5 h-5 text-slate-400" />
                                <span className="text-[9px] text-slate-400 mt-0.5">Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (onImageUpload) onImageUpload(e);
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            handleSwap(url);
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>
                </div>
            )}

            {/* Hint when no slot is active */}
            {activeSlot === null && curatedImages.length > 0 && (
                <p className="text-xs text-slate-400 italic">
                    Tap a slot above to swap its image from {curatedImages.length} curated {destination} photos
                </p>
            )}
        </div>
    );
}
