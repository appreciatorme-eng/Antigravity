'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function StickyMobileCTA() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show CTA only after scrolling past the hero section (e.g., 600px)
            if (window.scrollY > 600) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 right-6 z-[100] md:hidden"
                >
                    <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-between">
                        <div>
                            <p className="text-white font-bold text-sm">TravelSuite OS</p>
                            <p className="text-gray-400 text-xs">Free forever plan available.</p>
                        </div>

                        <Link
                            href="/login"
                            className="px-6 py-3 bg-[#FF9933] text-white font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(255,153,51,0.3)] hover:scale-105 transition-transform"
                        >
                            Start Free
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
