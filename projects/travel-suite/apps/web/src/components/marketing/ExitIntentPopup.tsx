'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

export function ExitIntentPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            // Trigger when mouse moves above the top edge of the window
            if (e.clientY <= 0 && !hasTriggered) {
                // Double check not to trigger on mobile/touch interfaces which simulate mouseleave
                if (window.innerWidth > 768) {
                    setIsVisible(true);
                    setHasTriggered(true);
                }
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasTriggered]);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pb-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsVisible(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-lg bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        {/* Glossy top highlight */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF9933]/50 to-transparent" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#FF9933]/10 blur-[60px] pointer-events-none" />

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10 z-50 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 sm:p-10 text-center relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9933]/20 to-[#FF9933]/5 border border-[#FF9933]/20 flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">👋</span>
                            </div>

                            <h3 className="text-3xl font-bold mb-4">Leaving so soon?</h3>
                            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                                Join 500+ Indian tour operators who are saving 15 hours a week with TripBuilt OS.
                            </p>

                            <Link
                                href="/login"
                                onClick={() => setIsVisible(false)}
                                className="group flex w-full items-center justify-center gap-2 py-4 px-6 text-black font-bold bg-[#FF9933] rounded-xl hover:bg-[#FFB366] transition-colors shadow-[0_0_20px_rgba(255,153,51,0.2)]"
                            >
                                Try It Free for 14 Days
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                No thanks, I&apos;ll stick to the old way
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
