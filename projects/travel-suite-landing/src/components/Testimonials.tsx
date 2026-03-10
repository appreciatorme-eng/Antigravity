'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        quote: "TravelSuite completely changed how we pitch. What used to take 2 hours on Excel now takes 10 minutes, and the proposals look like a million bucks.",
        author: "Rahul Sharma",
        company: "Himalayan Treks",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "Keeping track of agent commissions and driver payments was a nightmare. This OS brought everything into a single dashboard. Total game-changer.",
        author: "Sneha Patel",
        company: "GoBuddy Adventures",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
    },
    {
        quote: "Since we started sending interactive proposals via TravelSuite, our conversion rate went from 18% to 34%. Clients love the visual itineraries.",
        author: "Arjun Desai",
        company: "Wanderlust India Tours",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
    }
];

export function Testimonials() {
    return (
        <section className="relative z-30 py-32 bg-[#050505] overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-24">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-6 bg-[#00F0FF]/5"
                    >
                        <Star size={14} className="fill-[#00F0FF]" /> Wall of Love
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight text-white"
                    >
                        Trusted by top operators <br className="hidden md:block" />
                        <span className="text-gray-500">across India</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="relative p-8 rounded-3xl bg-white/5 border border-white/10 group hover:border-[#00F0FF]/30 hover:bg-white/10 transition-all duration-500"
                        >
                            <Quote className="absolute top-6 right-6 text-white/10 w-12 h-12 group-hover:text-[#00F0FF]/20 transition-colors duration-500" />

                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-[#FFB800] text-[#FFB800]" />
                                ))}
                            </div>

                            <p className="text-gray-300 text-lg leading-relaxed mb-8 relative z-10">
                                "{testimonial.quote}"
                            </p>

                            <div className="flex items-center gap-4 mt-auto">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.author}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                                />
                                <div>
                                    <h4 className="font-bold text-white">{testimonial.author}</h4>
                                    <p className="text-sm text-[#00F0FF]/80">{testimonial.company}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
