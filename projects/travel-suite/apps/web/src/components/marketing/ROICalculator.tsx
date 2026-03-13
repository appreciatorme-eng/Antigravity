'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';

export function ROICalculator() {
    const [trips, setTrips] = useState(20);
    const [avgBooking, setAvgBooking] = useState(100000);
    const hoursSaved = Math.round(trips * 3.5);
    const addOnRevenue = Math.round(trips * avgBooking * 0.15);
    const proposalTime = Math.round(trips * 45);
    const newProposalTime = Math.round(trips * 5);

    return (
        <section className="relative z-30 bg-transparent py-24 px-10 md:px-24">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF9933]/30 text-[#FF9933] text-sm font-semibold tracking-widest uppercase mb-4">
                        <Calculator size={14} /> ROI Calculator
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold">See How Much You <span className="text-[#FF9933]">Save</span></h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 md:p-12"
                >
                    {/* Sliders */}
                    <div className="grid md:grid-cols-2 gap-10 mb-12">
                        <div>
                            <label className="text-sm text-gray-400 font-semibold tracking-wider uppercase block mb-3">
                                Trips per month
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min={1}
                                    max={100}
                                    value={trips}
                                    onChange={e => setTrips(Number(e.target.value))}
                                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#FF9933] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#FF9933] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,153,51,0.5)]"
                                />
                                <span className="text-2xl font-black text-[#FF9933] w-14 text-right">{trips}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 font-semibold tracking-wider uppercase block mb-3">
                                Average Booking Value
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min={10000}
                                    max={500000}
                                    step={5000}
                                    value={avgBooking}
                                    onChange={e => setAvgBooking(Number(e.target.value))}
                                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00F0FF] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#00F0FF] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                                />
                                <span className="text-2xl font-black text-[#00F0FF] w-24 text-right">₹{(avgBooking / 1000).toFixed(0)}K</span>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-5 rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5">
                            <div className="text-3xl font-black text-[#00F0FF]">{hoursSaved}h</div>
                            <p className="text-xs text-gray-400 mt-1">Hours Saved / Month</p>
                        </div>
                        <div className="text-center p-5 rounded-2xl border border-[#FF9933]/20 bg-[#FF9933]/5">
                            <div className="text-3xl font-black text-[#FF9933]">₹{(addOnRevenue / 1000).toFixed(0)}K</div>
                            <p className="text-xs text-gray-400 mt-1">Add-on Revenue Gained</p>
                        </div>
                        <div className="text-center p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                            <div className="text-3xl font-black text-red-400">{proposalTime}m</div>
                            <p className="text-xs text-gray-400 mt-1">Old Proposal Time</p>
                        </div>
                        <div className="text-center p-5 rounded-2xl border border-[#A259FF]/20 bg-[#A259FF]/5">
                            <div className="text-3xl font-black text-[#A259FF]">{newProposalTime}m</div>
                            <p className="text-xs text-gray-400 mt-1">New Proposal Time</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
