"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABOption {
    emoji: string;
    label: string;
    description: string;
    action: () => void;
    bgColor: string;
}

interface FloatingActionButtonProps {
    /** Set to true when rendered inside the sidebar (desktop pill variant) */
    variant?: "sidebar" | "mobile";
    className?: string;
}

export default function FloatingActionButton({
    variant = "mobile",
    className,
}: FloatingActionButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const fabOptions: FABOption[] = [
        {
            emoji: "✈️",
            label: "New Trip",
            description: "Create a new trip itinerary",
            action: () => {
                router.push("/trips/new");
                setIsOpen(false);
            },
            bgColor: "bg-blue-500 hover:bg-blue-400",
        },
        {
            emoji: "💰",
            label: "Quick Quote",
            description: "Generate a quick quotation",
            action: () => {
                // Dispatch custom event so any modal listener can pick this up
                window.dispatchEvent(new CustomEvent("open-quick-quote"));
                setIsOpen(false);
            },
            bgColor: "bg-amber-500 hover:bg-amber-400",
        },
        {
            emoji: "📱",
            label: "WA Broadcast",
            description: "Send WhatsApp broadcast",
            action: () => {
                router.push("/inbox?mode=broadcast");
                setIsOpen(false);
            },
            bgColor: "bg-[#25D366] hover:bg-[#20bc5a]",
        },
    ];

    // Close on ESC
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) setIsOpen(false);
        },
        [isOpen]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Stagger variants for option pills
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.07, delayChildren: 0.05 },
        },
        exit: {
            opacity: 0,
            transition: { staggerChildren: 0.04, staggerDirection: -1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16, scale: 0.85 },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 400, damping: 28 },
        },
        exit: { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.12 } },
    };

    const isSidebar = variant === "sidebar";

    return (
        <>
            {/* Backdrop overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="fab-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[58]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* FAB container */}
            <div
                className={cn(
                    isSidebar
                        ? "relative w-full"
                        : "fixed bottom-24 right-5 md:bottom-6 md:right-6 z-[60]",
                    className
                )}
            >
                {/* Option pills — staggered above the FAB button */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="fab-options"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className={cn(
                                "flex flex-col gap-2",
                                isSidebar
                                    ? "mb-3 w-full"
                                    : "absolute bottom-[calc(100%+12px)] right-0 items-end"
                            )}
                        >
                            {fabOptions.map((opt) => (
                                <motion.button
                                    key={opt.label}
                                    variants={itemVariants}
                                    onClick={opt.action}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-white font-semibold text-sm shadow-xl transition-all",
                                        opt.bgColor,
                                        isSidebar ? "w-full" : "whitespace-nowrap"
                                    )}
                                >
                                    <span className="text-lg leading-none" role="img">
                                        {opt.emoji}
                                    </span>
                                    <span>{opt.label}</span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main FAB button */}
                {isSidebar ? (
                    // Sidebar pill variant
                    <button
                        onClick={() => setIsOpen((o) => !o)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white font-bold text-sm transition-all duration-200 shadow-lg",
                            "bg-[#25D366] hover:bg-[#20bc5a] hover:shadow-[0_0_20px_rgba(37,211,102,0.35)]",
                            isOpen && "bg-[#1aab55]"
                        )}
                    >
                        <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Plus className="w-5 h-5" />
                        </motion.div>
                        <span>Quick Actions</span>
                    </button>
                ) : (
                    // Mobile circular FAB
                    <motion.button
                        onClick={() => setIsOpen((o) => !o)}
                        whileTap={{ scale: 0.92 }}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-colors duration-200",
                            "bg-[#25D366] hover:bg-[#20bc5a]",
                            "shadow-[0_4px_24px_rgba(37,211,102,0.45)]",
                            isOpen && "bg-[#1aab55]"
                        )}
                        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
                    >
                        <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Plus className="w-6 h-6" />
                        </motion.div>
                    </motion.button>
                )}
            </div>
        </>
    );
}
