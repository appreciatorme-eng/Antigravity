"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function AnimatedFlightPath() {
  // We attach the scroll progress to the entire document body
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"]
  });

  // Apply a spring to smooth out the drawing animation so it doesn't instantly snap
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // Since we don't know the exact height, we use a very tall SVG that scales down,
  // or a repeating pattern. For a guided path, a continuous bezier curve that snakes 
  // left and right looks best.
  
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none flex justify-center overflow-hidden opacity-30 md:opacity-60">
      <svg
        className="w-full h-full max-w-7xl"
        viewBox="0 0 1000 4000"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* The Track (Faint background line) */}
        <path
          d="M 500 0 C 500 200, 800 300, 800 600 C 800 900, 200 1000, 200 1400 C 200 1800, 800 1900, 800 2400 C 800 2900, 200 3000, 200 3500 C 200 3800, 500 3900, 500 4000"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="2"
          strokeDasharray="10 10"
        />
        
        {/* The Drawn Path (Glowing neon line) */}
        <motion.path
          d="M 500 0 C 500 200, 800 300, 800 600 C 800 900, 200 1000, 200 1400 C 200 1800, 800 1900, 800 2400 C 800 2900, 200 3000, 200 3500 C 200 3800, 500 3900, 500 4000"
          stroke="url(#flight-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ pathLength: smoothProgress }}
          // A subtle glow effect on the line itself
          filter="drop-shadow(0px 0px 8px rgba(0, 240, 255, 0.6))"
        />

        {/* Define the gradient for the flight path */}
        <defs>
          <linearGradient id="flight-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="50%" stopColor="#A259FF" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
