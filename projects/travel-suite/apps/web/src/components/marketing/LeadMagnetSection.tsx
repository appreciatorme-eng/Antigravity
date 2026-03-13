'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ShieldCheck } from 'lucide-react';

export function LeadMagnetSection() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubmitted(true);
    };

    return (
        <section className="relative py-24 px-6 md:px-24 overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00F0FF]/10 blur-[120px] rounded-full opacity-50" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#A259FF]/10 blur-[120px] rounded-full opacity-50" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="bg-[#111] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]">

                    {/* Visual Side */}
                    <div className="w-full md:w-1/2 bg-gradient-to-br from-[#00F0FF] to-[#0055FF] p-12 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />

                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex px-4 py-1.5 bg-black/20 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white">
                                Exclusive Free Resource
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight text-white drop-shadow-xl">
                                The 2026 Agency Scaling Blueprint
                            </h2>
                            <p className="text-white/80 text-lg font-medium max-w-md">
                                Join 5,000+ tour operators who are doubling their margins with our automation playbook.
                            </p>
                        </div>

                        <div className="relative z-10 mt-12 flex justify-center">
                            <motion.img
                                initial={{ y: 20, rotate: -3 }}
                                whileInView={{ y: 0, rotate: -5 }}
                                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                src="/marketing/guide_cover.png"
                                alt="Guide Preview"
                                className="w-64 md:w-72 rounded-2xl shadow-2xl border-4 border-white/20 hover:rotate-0 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-[#0D0D0D]">
                        {!submitted ? (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-3xl font-bold mb-4">Master the new era of tour operations.</h3>
                                    <p className="text-gray-400 text-lg">
                                        Get the 42-page deep dive on how to reclaim 20 hours a week and scale your bookings without adding staff.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Work Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="sarah@wanderlust.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg focus:outline-none focus:border-[#00F0FF]/50 transition-all placeholder:text-gray-600"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#00F0FF] text-black font-black py-4 rounded-2xl hover:bg-[#00F0FF]/90 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-3 text-lg group"
                                    >
                                        Download Guide
                                        <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </form>

                                <div className="flex items-center gap-3 justify-center text-gray-500 text-sm">
                                    <ShieldCheck size={18} className="text-[#00F0FF]" />
                                    We protect your data. Instant access via email.
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-24 h-24 bg-[#00F0FF]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <ShieldCheck size={48} className="text-[#00F0FF]" />
                                </div>
                                <h3 className="text-3xl font-bold text-white">Check Your Inbox!</h3>
                                <p className="text-gray-400 text-lg">
                                    The blueprint is winging its way to <span className="text-white font-medium">{email}</span>.
                                </p>
                                <div className="pt-4 space-y-4">
                                    <a
                                        href="/marketing/The-2026-Agency-Scaling-Blueprint.pdf"
                                        download
                                        className="inline-flex items-center gap-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 px-6 py-3 rounded-xl font-bold hover:bg-[#00F0FF]/20 transition-all no-underline"
                                    >
                                        <Download size={18} />
                                        Download Now
                                    </a>
                                    <br />
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="text-gray-500 text-sm hover:text-white transition-colors"
                                    >
                                        Didn&apos;t get it? Try again.
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
