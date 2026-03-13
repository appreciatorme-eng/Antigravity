'use client';

import { motion } from 'framer-motion';

const logos = [
    { name: "GoBuddy Adventures", weight: "font-black" },
    { name: "Himalayan Treks", weight: "font-bold" },
    { name: "Wanderlust India Tours", weight: "font-extrabold" },
    { name: "Kerala Voyages", weight: "font-bold tracking-tight" },
    { name: "Royal Rajasthan", weight: "font-black" }
];

export function CustomerLogos() {
    return (
        <section className="relative z-30 py-10 bg-[#050505] border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
                    Trusted by India&apos;s fastest-growing tour operators
                </p>

                {/* Infinite scroll container */}
                <div className="flex overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 20
                        }}
                        className="flex whitespace-nowrap items-center gap-16 pr-16"
                    >
                        {/* Double the logos to create seamless loop */}
                        {[...logos, ...logos].map((logo, index) => (
                            <div
                                key={index}
                                className={`text-2xl text-white/30 hover:text-white/60 transition-colors uppercase grayscale opacity-70 hover:opacity-100 ${logo.weight}`}
                            >
                                {logo.name}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
