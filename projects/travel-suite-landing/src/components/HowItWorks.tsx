'use client';

import { motion } from 'framer-motion';
import { UserPlus, Download, Rocket, ArrowRight } from 'lucide-react';

const steps = [
    {
        icon: UserPlus,
        title: "1. Create Account",
        description: "Sign up in 30 seconds. No credit card required. Import your agency logo and details.",
        color: "#00F0FF"
    },
    {
        icon: Download,
        title: "2. Import Clients",
        description: "Upload your existing Excel sheets or connect your WhatsApp. We'll organize everything.",
        color: "#A855F7"
    },
    {
        icon: Rocket,
        title: "3. Send Proposals",
        description: "Use our drag-and-drop builder to send a stunning itinerary in under 5 minutes.",
        color: "#FF9933"
    }
];

export function HowItWorks() {
    return (
        <section className="relative z-30 py-32 bg-transparent">
            <div className="max-w-7xl mx-auto px-6 md:px-24">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                    >
                        Go from scattered to <span className="text-[#00F0FF]">systematized</span><br className="hidden md:block" />
                        in 3 simple steps
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 font-light max-w-2xl mx-auto"
                    >
                        You don't need to be a tech expert. We've built TravelSuite to be as intuitive as sending a text message.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-px bg-gradient-to-r from-[#00F0FF]/10 via-[#A855F7]/30 to-[#FF9933]/10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="relative text-center group"
                        >
                            <div
                                className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2"
                                style={{ borderColor: `rgba(255,255,255,0.1)` }}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                                    style={{ backgroundColor: step.color }}
                                />
                                <step.icon size={48} style={{ color: step.color }} className="relative z-10" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
