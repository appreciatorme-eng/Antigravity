"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { SplineScene } from "@/components/marketing/SplineScene";
import ShinyText from "@/components/marketing/ShinyText";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ForceFieldBackground = dynamic(
  () =>
    import("@/components/marketing/ForceFieldBackground").then(
      (m) => m.ForceFieldBackground
    ),
  { ssr: false }
);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isSplineReady, setIsSplineReady] = useState(false);

  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSplineLoad = (splineApp: any) => {
    const targetsToHide = [
      "PROJECT NAME",
      "PROMO",
      "your logo+text",
      "P",
      "E",
      "A",
      "R",
      "L",
      "PEARL",
    ];
    targetsToHide.forEach((name) => {
      const obj = splineApp.findObjectByName(name);
      if (obj && typeof obj.text !== "undefined") {
        obj.text = "";
      }
      if (obj) {
        obj.visible = false;
      }
    });

    const mockups = [
      "/marketing/dashboard_ui_mockup_1773059467134.png",
      "/marketing/booking_ui_mockup_1773059498138.png",
      "/marketing/crm_ui_mockup_1773059519930.png",
      "/marketing/itinerary_ui_mockup_1773062264651.png",
      "/marketing/analytics_ui_mockup_1773062281103.png",
      "/marketing/invoicing_ui_mockup_1773062297390.png",
    ];

    setTimeout(async () => {
      const texturePromises: Promise<void>[] = [];

      for (let i = 1; i <= 6; i++) {
        const panelName = `1700x950 ${i}`;
        const panel = splineApp.findObjectByName(panelName);
        if (panel) {
          try {
            if (panel.material && panel.material.layers) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              panel.material.layers.forEach((layer: any) => {
                if (layer.type === "texture" || layer.type === "matcap") {
                  const fullUrl = window.location.origin + mockups[i - 1];
                  texturePromises.push(layer.updateTexture(fullUrl));
                }
              });
            }
          } catch (err) {
            console.log(`Could not inject mockup into ${panelName}`, err);
          }
        }
      }

      try {
        await Promise.all(texturePromises);
      } catch (err) {
        console.error(
          "Some textures failed to map, continuing anyway",
          err
        );
      }

      setIsSplineReady(true);
    }, 1000);
  };

  useEffect(() => {
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
  }, []);

  return (
    <div ref={containerRef}>
      {/* GLOBAL FIXED BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ForceFieldBackground id="tsparticles-global" />
      </div>

      <section className="relative h-screen flex items-center justify-between px-6 md:px-24 overflow-hidden pt-20 transform-gpu isolate">
        {/* Particles -- TOP LEFT */}
        <div
          className="absolute top-0 left-0 z-[15] pointer-events-none overflow-hidden"
          style={{
            width: "45%",
            height: "60%",
            maskImage:
              "linear-gradient(to right, black 65%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 65%, transparent 100%)",
          }}
        >
          <ForceFieldBackground
            id="tsparticles-hero-top"
            particleCount={180}
          />
        </div>

        {/* Particles -- BOTTOM LEFT */}
        <div
          className="absolute bottom-0 left-0 z-[15] pointer-events-none overflow-hidden"
          style={{
            width: "50%",
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
            particleCount={140}
          />
        </div>

        {/* 3D Spline Layer */}
        <div className="absolute inset-0 z-[10] pointer-events-none">
          <motion.div
            style={{ y: yParallax }}
            className={`w-full h-[120%] -top-20 relative z-10 pointer-events-auto transition-opacity duration-[1500ms] ease-in-out ${
              isSplineReady ? "opacity-90" : "opacity-0"
            }`}
          >
            <SplineScene
              sceneUrl="https://prod.spline.design/FOAdqNVCO1g5ncBd/scene.splinecode"
              onLoad={onSplineLoad}
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-[rgba(10,10,10,0.4)] to-transparent z-[11] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A0A0A] to-transparent z-[11] pointer-events-none" />
        </div>

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
                text="Travel Suite OS is Live"
                speed={3}
                color="#00F0FF"
                shineColor="#ffffff"
              />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight text-glow-aqua">
              Run Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#FFD699]">
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
            No more messy PDFs. No more lost WhatsApp chats. The all-in-one
            operating system for modern Indian tour operators.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-6 pointer-events-auto"
          >
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
