'use client';

import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

const features = [
    { name: "Proposals", travelSuite: "Unlimited Interactive", oldWay: "Static PDFs" },
    { name: "Time per Client", travelSuite: "5 minutes", oldWay: "2+ hours" },
    { name: "WhatsApp Sync", travelSuite: "Automated & Logged", oldWay: "Manual tracking" },
    { name: "Client CRM", travelSuite: "Built-in pipeline", oldWay: "Messy Excel sheets" },
    { name: "Payment Collection", travelSuite: "1-click integrations", oldWay: "Manual sharing links" },
    { name: "Flight/Hotel Search", travelSuite: "Amadeus Integrated", oldWay: "10 different tabs" },
    { name: "Driver Management", travelSuite: "Auto-assigned", oldWay: "Constant calls" },
];

export function ComparisonTable() {
    return (
        <section className="relative z-30 py-24 px-6 md:px-24 border-t border-white/5 bg-[#050505] overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF9933]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Why operators switch to <span className="text-[#00F0FF]">TravelBuilt</span></h2>
                    <p className="text-gray-400">The difference between running a business and letting it run you.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden relative z-10"
                >
                    {/* Header */}
                    <div className="grid grid-cols-3 p-6 border-b border-white/10 bg-white/[0.02]">
                        <div className="font-semibold text-gray-500">Feature</div>
                        <div className="font-bold text-[#00F0FF] text-center">TravelBuilt</div>
                        <div className="font-semibold text-gray-500 text-center">The Old Way</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-white/5">
                        {features.map((feature, idx) => (
                            <div key={idx} className="grid grid-cols-3 p-6 hover:bg-white/[0.02] transition-colors">
                                <div className="font-medium text-gray-300 flex items-center">{feature.name}</div>
                                <div className="flex items-center justify-center gap-2 text-white font-medium">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#00F0FF]/20 flex items-center justify-center">
                                        <Check size={14} className="text-[#00F0FF]" />
                                    </span>
                                    <span className="hidden sm:inline">{feature.travelSuite}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <Minus size={14} />
                                    <span className="hidden sm:inline">{feature.oldWay}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
