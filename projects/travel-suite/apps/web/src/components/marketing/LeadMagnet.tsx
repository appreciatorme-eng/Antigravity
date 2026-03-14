'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Download, ShieldCheck } from 'lucide-react';

export function LeadMagnet() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Trigger popup after scrolling down 40% of the page
    useEffect(() => {
        const handleScroll = () => {
            const scrollThreshold = document.documentElement.scrollHeight * 0.4;
            if (window.scrollY > scrollThreshold && !sessionStorage.getItem('leadMagnetSeen')) {
                setIsVisible(true);
                window.removeEventListener('scroll', handleScroll);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('leadMagnetSeen', 'true');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        // Simulate API call
        setSubmitted(true);
        // Removed auto-close to allow the user to click the download button
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[800px] px-4"
                    >
                        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">

                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Left Column: Image/Visual */}
                            <div className="w-full md:w-5/12 bg-gradient-to-br from-[#00F0FF] to-[#0055FF] p-8 flex flex-col justify-between relative overflow-hidden hidden md:flex">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                                <div className="relative z-10 space-y-4">
                                    <div className="inline-flex px-3 py-1 bg-black/20 rounded-full border border-white/20 text-xs font-bold uppercase tracking-wider text-white">
                                        Free Guide
                                    </div>
                                    <h3 className="text-3xl font-black leading-tight text-white drop-shadow-md">
                                        The 2026 Agency Scaling Blueprint
                                    </h3>
                                </div>

                                <div className="relative z-10">
                                    <Image
                                        src="/marketing/guide_cover.png"
                                        alt="Guide Preview"
                                        width={400}
                                        height={192}
                                        className="rounded-xl shadow-2xl border-4 border-white/20 -rotate-3 hover:rotate-0 transition-transform duration-500 max-h-48 object-cover"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Content/Form */}
                            <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center bg-[#0A0A0A]">

                                {!submitted ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <div>
                                            <h4 className="text-2xl font-bold mb-2">Stop losing $50k/yr to manual workflows.</h4>
                                            <p className="text-gray-400 text-sm">
                                                Download our free 42-page guide on how top travel agencies use automation to double their margins and reclaim 20 hours a week.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Work Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="sarah@wanderlust.com"
                                                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-[#00F0FF] text-black font-bold py-3 rounded-xl hover:bg-[#00F0FF]/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center gap-2"
                                            >
                                                <Download size={18} />
                                                Get Free Blueprint
                                            </button>
                                        </form>

                                        <div className="flex items-center gap-2 justify-center text-gray-500 text-xs mt-4">
                                            <ShieldCheck size={14} className="text-[#00F0FF]" />
                                            We never sell your data. No spam, ever.
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center space-y-4 py-8"
                                    >
                                        <div className="w-20 h-20 bg-[#00F0FF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShieldCheck size={40} className="text-[#00F0FF]" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-white">Check your inbox!</h4>
                                        <p className="text-gray-400">
                                            We&apos;ve just sent the blueprint to <span className="text-white font-medium">{email}</span>. Look out for an email from the TravelBuilt team.
                                        </p>
                                        <div className="pt-4">
                                            <a
                                                href="/marketing/The-2026-Agency-Scaling-Blueprint.pdf"
                                                download
                                                className="inline-flex items-center gap-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 px-6 py-3 rounded-xl font-bold hover:bg-[#00F0FF]/20 transition-all no-underline"
                                            >
                                                <Download size={18} />
                                                Download Now
                                            </a>
                                        </div>
                                    </motion.div>
                                )}

                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
