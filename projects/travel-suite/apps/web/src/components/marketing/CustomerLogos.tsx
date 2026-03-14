'use client';

const logos = [
    { name: "TravelBuilt", weight: "font-black" },
    { name: "Himalayan Treks", weight: "font-bold" },
    { name: "Wanderlust India Tours", weight: "font-extrabold" },
    { name: "Kerala Voyages", weight: "font-bold tracking-tight" },
    { name: "Royal Rajasthan", weight: "font-black" }
];

// Duplicate logos for seamless infinite loop
const doubledLogos = [...logos, ...logos];

export function CustomerLogos() {
    return (
        <section className="relative z-30 py-10 bg-[#050505] border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
                    Trusted by India&apos;s fastest-growing tour operators
                </p>

                {/* Infinite scroll container */}
                <div className="flex overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    <div className="marquee-track flex whitespace-nowrap items-center gap-16 pr-16">
                        {doubledLogos.map((logo, index) => (
                            <div
                                key={index}
                                className={`text-2xl text-white/30 transition-all duration-300 uppercase grayscale hover:grayscale-0 opacity-70 hover:opacity-100 hover:text-white/60 ${logo.weight}`}
                            >
                                {logo.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
