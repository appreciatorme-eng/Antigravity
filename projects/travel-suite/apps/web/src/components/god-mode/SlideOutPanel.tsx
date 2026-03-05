// SlideOutPanel — right-side detail panel that slides over the main content.

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideOutPanelProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: "md" | "lg" | "xl";
}

const WIDTH_CLASSES = {
    md: "w-full sm:w-96",
    lg: "w-full sm:w-[32rem]",
    xl: "w-full sm:w-[40rem]",
};

export default function SlideOutPanel({ open, onClose, title, children, width = "lg" }: SlideOutPanelProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={cn(
                "fixed right-0 top-0 h-full bg-gray-900 border-l border-gray-700 z-50 flex flex-col",
                "transform transition-transform duration-300",
                WIDTH_CLASSES[width]
            )}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
                    <h2 className="text-base font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </>
    );
}
