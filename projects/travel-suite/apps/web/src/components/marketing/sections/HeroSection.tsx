"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import ShinyText from "@/components/marketing/ShinyText";
import { HeroScreens } from "@/components/marketing/HeroScreens";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/marketing/effects";

const ForceFieldBackground = dynamic(
  () =>
    import("@/components/marketing/ForceFieldBackground").then(
      (m) => m.ForceFieldBackground
    ),
  { ssr: false }
);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    let cancelled = false;

    async function initScrollAnimations() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray(".reveal-text").forEach((text) => {
        const el = text as HTMLElement;
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      });
    }

    void initScrollAnimations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={containerRef}>
      <section className="relative h-screen flex items-center justify-between px-6 md:px-24 overflow-hidden pt-4 transform-gpu isolate">
        {/* Particles -- TOP */}
        <div
          className="absolute top-0 left-0 z-[15] pointer-events-none overflow-hidden w-full md:w-[45%]"
          style={{
            height: "60%",
            maskImage:
              "linear-gradient(to right, black 65%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 65%, transparent 100%)",
          }}
        >
          <ForceFieldBackground
            id="tsparticles-hero-top"
            particleCount={450}
          />
        </div>

        {/* Particles -- BOTTOM */}
        <div
          className="absolute bottom-0 left-0 z-[15] pointer-events-none overflow-hidden w-full md:w-[50%]"
          style={{
            height: "45%",
            maskImage:
              "linear-gradient(to right, black 70%, transparent 100%), linear-gradient(to top, black 40%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 70%, transparent 100%)",
            maskComposite: "intersect",
          }}
        >
          <ForceFieldBackground
            id="tsparticles-hero-bottom"
            particleCount={350}
          />
        </div>

        {/* 3D Spline + Floating Screens — full viewport coverage */}
        <div className="absolute inset-0 z-[10] pointer-events-none">
          <motion.div
            style={{ y: yParallax }}
            className="w-full h-[120%] -top-20 relative z-10 pointer-events-auto"
          >
            <HeroScreens />
          </motion.div>
        </div>

        {/* Gradient overlays — fixed, not parallaxed, for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-[rgba(10,10,10,0.4)] to-transparent z-[11] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A0A0A] to-transparent z-[11] pointer-events-none" />

        <div className="relative z-20 max-w-3xl space-y-8 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-wide uppercase">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F0FF]"></span>
              </span>
              <ShinyText
                text="TravelBuilt is Live"
                speed={3}
                color="#00F0FF"
                shineColor="#ffffff"
              />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight text-glow-aqua">
              Run Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#0088FF] to-[#00F0FF] animate-text-shimmer">
                Travel Empire.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="text-lg md:text-2xl text-gray-400 font-light max-w-2xl"
          >
            Create instant packages, share stunning white-label itineraries, and get them closed ASAP. The all-in-one operating system for modern travel professionals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-6 pointer-events-auto"
          >
            <MagneticButton strength={0.4}>
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out bg-[#FF9933] rounded-full hover:bg-[#FFB366] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,153,51,0.6)] no-underline"
              >
                <ShinyText
                  text="Experience the Magic"
                  speed={2.5}
                  color="#ffffff"
                  shineColor="#FFEBCC"
                />
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
