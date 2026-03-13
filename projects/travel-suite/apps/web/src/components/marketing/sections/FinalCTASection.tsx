"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import ShinyText from "@/components/marketing/ShinyText";

export function FinalCTASection() {
  return (
    <section className="relative z-30 py-24 md:py-40 bg-transparent text-center px-6 md:px-10 border-t border-white/10 mt-20">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF9933]/50 to-transparent"></div>
      <div className="max-w-4xl mx-auto space-y-10 reveal-text">
        <Plane className="w-20 h-20 text-[#00F0FF] mx-auto opacity-80" />
        <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight">
          Stop managing on <br />
          10 different apps.
        </h2>
        <p className="text-lg md:text-2xl text-gray-400 font-light">
          Bring your proposals, WhatsApp chats, drivers, and payments into one
          beautiful screen. Join the top tour operators in India today.
        </p>
        <Link
          href="/login"
          className="group mt-8 inline-flex px-12 py-5 text-xl font-bold text-[#0A0A0A] bg-white rounded-full hover:bg-gray-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] no-underline"
        >
          <ShinyText
            text="Start Using for Free"
            speed={2}
            color="#0A0A0A"
            shineColor="#888888"
            pauseOnHover={true}
          />
        </Link>
      </div>
    </section>
  );
}
