'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Search, Users, Calendar, MapPin, CheckCircle2, Copy, Send } from 'lucide-react';

export function InteractiveDemo() {
    const [step, setStep] = useState(0); // 0=Search, 1=Loading, 2=Result
    const [destination, setDestination] = useState('');

    const handleGenerate = () => {
        if (!destination) return;
        setStep(1);

        // Simulate API call/generation
        setTimeout(() => {
            setStep(2);
        }, 2500);
    };

    const resetDemo = () => {
        setStep(0);
        setDestination('');
    };

    return (
        <section className="py-24 px-6 md:px-24 bg-[#0A0A0A] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00F0FF]/10 blur-[150px] pointer-events-none rounded-full" />

            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        Experience the <span className="text-[#00F0FF]">Magic</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Don&apos;t just take our word for it. Try generating a breathtaking, interactive itinerary right now in under 3 seconds.
                    </motion.p>
                </div>

                {/* Demo Window */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative max-w-4xl mx-auto rounded-[2rem] border border-white/10 bg-black shadow-2xl overflow-hidden"
                >
                    {/* MacOS style header */}
                    <div className="bg-[#1A1A1A] border-b border-white/5 px-6 py-4 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex-grow text-center text-xs text-gray-500 font-medium font-mono">
                            TravelSuite_OS_Sandbox
                        </div>
                        {step === 2 && (
                            <button onClick={resetDemo} className="text-xs text-[#00F0FF] hover:underline">
                                Reset Demo
                            </button>
                        )}
                    </div>

                    <div className="p-8 md:p-12 min-h-[400px] relative flex items-center justify-center">

                        <AnimatePresence mode="wait">

                            {/* Step 0: Search Form */}
                            {step === 0 && (
                                <motion.div
                                    key="step0"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                    className="w-full max-w-lg space-y-8"
                                >
                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl font-bold text-white">Create New Proposal</h3>
                                        <p className="text-gray-400">Where are your clients going?</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                            <input
                                                type="text"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                                placeholder="e.g. Bali, Maldives, Dubai..."
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <select className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-gray-400 focus:outline-none appearance-none">
                                                    <option>2 Adults</option>
                                                    <option>Family (2A, 2C)</option>
                                                    <option>Group (10+)</option>
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <select className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-gray-400 focus:outline-none appearance-none">
                                                    <option>5 Days / 4 Nights</option>
                                                    <option>7 Days / 6 Nights</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={!destination}
                                        className="w-full bg-[#00F0FF] text-black font-bold text-lg py-4 rounded-2xl hover:bg-[#00F0FF]/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        Generate with AI <Plane size={18} />
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 1: Loading State */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center space-y-8"
                                >
                                    <div className="relative w-24 h-24">
                                        <motion.div
                                            className="absolute inset-0 border-4 border-[#00F0FF]/20 rounded-full"
                                        />
                                        <motion.div
                                            className="absolute inset-0 border-4 border-[#00F0FF] rounded-full border-t-transparent animate-spin"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Plane className="text-[#00F0FF] animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="text-center space-y-2 h-16">
                                        <motion.p
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-lg text-white font-medium"
                                        >
                                            Analyzing {destination} flight routes...
                                        </motion.p>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1 }}
                                            className="text-sm text-gray-400 absolute w-full left-0"
                                        >
                                            Curating top-rated luxury stays...
                                        </motion.p>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 2 }}
                                            className="text-sm text-gray-400 absolute w-full left-0 bg-black pt-1"
                                        >
                                            Formatting magic link...
                                        </motion.p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Result State */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full flex flex-col md:flex-row gap-8"
                                >
                                    {/* Left: Mobile Preview */}
                                    <div className="hidden md:flex flex-shrink-0 w-[240px] h-[480px] bg-black border-[6px] border-[#1A1A1A] rounded-[2.5rem] p-3 mx-auto relative overflow-hidden">
                                        <div className="absolute top-0 inset-x-0 h-6 bg-[#1A1A1A] rounded-b-xl z-20 w-32 mx-auto" /> {/* Notch */}

                                        <div className="w-full h-full bg-[#111] rounded-[1.5rem] overflow-hidden flex flex-col pt-6 relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/20 to-transparent h-1/3 opacity-30" />

                                            <div className="px-4 pb-4">
                                                <p className="text-[#00F0FF] text-[10px] font-bold tracking-widest uppercase mb-1">Proposed Itinerary</p>
                                                <h4 className="text-white font-bold text-lg leading-tight">5 Days in {destination}</h4>
                                                <p className="text-gray-400 text-xs mt-1">₹75,000 per person</p>
                                            </div>

                                            <div className="flex-grow bg-[#1A1A1A] rounded-t-3xl p-4 mt-2 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                                                <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                                                <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                                                <div className="h-20 bg-white/5 rounded-2xl animate-pulse delay-75" />
                                            </div>

                                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                                                <div className="w-full py-3 bg-[#00F0FF] rounded-xl text-black text-xs font-bold text-center">
                                                    Approve & Pay
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex-grow flex flex-col justify-center space-y-8 pl-0 md:pl-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF88]/10 text-[#00FF88] text-xs font-bold mb-4">
                                                <CheckCircle2 size={14} /> Generated Successfully
                                            </div>
                                            <h3 className="text-3xl font-bold text-white mb-4">Your interactive proposal is ready.</h3>
                                            <p className="text-gray-400">
                                                In a real scenario, this entire beautiful webpage would be sent directly to your client&apos;s WhatsApp without them needing to download any PDFs.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/10 rounded-2xl">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Search size={18} className="text-gray-500 shrink-0" />
                                                    <span className="text-sm text-gray-300 truncate">travelsuite.io/p/{destination.toLowerCase().replace(/\s+/g, '-')}-xyz123</span>
                                                </div>
                                                <button className="p-2 ml-4 rounded-lg hover:bg-white/10 text-gray-400 transition-colors shrink-0">
                                                    <Copy size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-2xl font-bold hover:bg-[#25D366]/20 transition-colors">
                                                    <Send size={18} /> Send via WhatsApp
                                                </button>
                                                <button className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-colors">
                                                    <Search size={18} /> Preview
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </motion.div>
            </div>
        </section>
    );
}
