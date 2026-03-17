"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, AnimationPlaybackControls } from "framer-motion";
import { XCircle, CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface BeforeAfterInteractiveProps {
  oldWayItems: { text: string; icon: React.ReactNode }[];
  newWayItems: { text: string; icon: React.ReactNode }[];
}

export function BeforeAfterInteractive({ oldWayItems, newWayItems }: BeforeAfterInteractiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Position of the slider, represented as a pixel value
  const x = useMotionValue(0);

  // Calculate container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
        // Initialize handle to center if not set
        if (x.get() === 0) {
          x.set(containerRef.current.getBoundingClientRect().width / 2);
        }
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [x]);

  // Auto-slide animation with a smooth pulsing pause at the edges
  useEffect(() => {
    if (!containerWidth || isDragging) return;

    let isCancelled = false;
    let currentAnimation: AnimationPlaybackControls;

    const startAnimation = (targetX: number) => {
      if (isCancelled) return;
      
      const distanceFraction = Math.abs(targetX - x.get()) / containerWidth;
      const duration = distanceFraction * 6 + 1.5; // Slightly faster but buttery smooth

      currentAnimation = animate(x, targetX, {
        duration,
        ease: "easeInOut",
        onComplete: () => {
          if (!isCancelled) {
            // Pause at the edge, then bounce back
            setTimeout(() => {
              if (!isCancelled) {
                startAnimation(targetX > containerWidth * 0.5 ? containerWidth * 0.15 : containerWidth * 0.85);
              }
            }, 1500);
          }
        }
      });
    };

    const initialTarget = x.get() > containerWidth * 0.5 ? containerWidth * 0.15 : containerWidth * 0.85;
    
    const timeout = setTimeout(() => {
      startAnimation(initialTarget);
    }, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      if (currentAnimation) currentAnimation.stop();
    };
  }, [x, containerWidth, isDragging]);

  const clipPercentage = useTransform(x, [0, containerWidth], [0, 100]);
  
  // The Old Way is on the left, the New Way is on the right.
  // We will clip the Old way to only show from 0% to the slider x%.
  const clipPathBase = useTransform(
    clipPercentage,
    (val) => `inset(0 ${100 - val}% 0 0)` // Clip from the right edge
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto min-h-[340px] md:min-h-[500px] rounded-[20px] md:rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 select-none"
    >
      {/* --- BACKGROUND LAYER: TRIPBUILT (The Good Way) --- */}
      {/* Positioned to fill the right side conceptually, but it physically fills the whole container and the Old Way covers it on the left */}
      <div className="absolute inset-0 bg-[#0A0A0A] p-4 md:p-8 lg:p-12 flex flex-col justify-center overflow-hidden">
        {/* Futuristic Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #00F0FF 1px, transparent 1px), linear-gradient(to bottom, #A259FF 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#A259FF]/10 blur-[80px] pointer-events-none rounded-full" />

        <div className="w-full absolute inset-0 flex items-center pr-4 md:pr-8 lg:pr-16 pl-[52%] md:pl-[55%]">
          <div className="max-w-md">
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-10">
              <motion.div 
                initial={{ rotate: -90, scale: 0 }}
                whileInView={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#00F0FF]/30 to-[#A259FF]/30 border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.3)]"
              >
                <CheckCircle2 size={16} className="md:hidden" />
                <CheckCircle2 size={32} className="hidden md:block" />
              </motion.div>
              <h3 className="text-lg md:text-4xl font-black bg-gradient-to-r from-[#00F0FF] to-[#A259FF] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                TripBuilt
              </h3>
            </div>
            <div className="space-y-3 md:space-y-8">
              {newWayItems.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  key={i} 
                  className="flex items-start gap-2 md:gap-5 text-gray-100 group"
                >
                  <span className="text-sm md:text-2xl mt-0.5 md:mt-1 text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] group-hover:scale-125 transition-transform">{item.icon}</span>
                  <p className="text-xs md:text-lg font-semibold leading-snug md:leading-relaxed tracking-wide">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- FOREGROUND LAYER: OLD WAY (The Bad Way) --- */}
      {/* Clipped to show only the left side of the slider */}
      <motion.div 
        className="absolute inset-0 bg-neutral-900 overflow-hidden"
        style={{ clipPath: clipPathBase }}
      >
        {/* Distressed Background details */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-paper.png')" }} />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-600/10 blur-[100px] pointer-events-none rounded-full mix-blend-screen" />
        
        <div className="w-full absolute inset-0 flex items-center pl-4 md:pl-8 lg:pl-16 pr-[52%] md:pr-[55%]">
          <div className="max-w-md">
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-10">
              <div className="w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-red-500 shadow-inner">
                <XCircle size={16} className="md:hidden" />
                <XCircle size={32} className="hidden md:block" />
              </div>
              <h3 className="text-lg md:text-3xl font-bold text-neutral-400">The Old Way</h3>
            </div>
            <div className="space-y-3 md:space-y-8">
              {oldWayItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 md:gap-5 text-neutral-500 opacity-80">
                  <span className="text-sm md:text-2xl mt-0.5 md:mt-1 grayscale opacity-50">{item.icon}</span>
                  <p className="text-xs md:text-lg leading-snug md:leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- INTERACTIVE SCANNER BEAM (Slider Handle) --- */}
      {containerWidth > 0 && (
        <motion.div
          className="absolute top-0 bottom-0 z-30 flex flex-col items-center justify-center cursor-ew-resize group"
          style={{ x, originX: "center", translateX: "-50%" }}
          drag="x"
          dragConstraints={{ left: 0, right: containerWidth }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          {/* Glowing Energy Beam */}
          <div className="absolute inset-y-0 w-[2px] bg-white group-hover:w-[4px] transition-all duration-300" />
          
          <div className="absolute inset-y-0 w-[12px] bg-gradient-to-b from-[#00F0FF]/0 via-[#00F0FF] to-[#00F0FF]/0 blur-[8px] opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-y-0 w-[30px] bg-gradient-to-b from-[#A259FF]/0 via-[#A259FF] to-[#A259FF]/0 blur-[20px] opacity-40 group-hover:opacity-80 transition-opacity" />

          {/* Scanner Knob */}
          <motion.div 
            className={`relative w-10 h-10 md:w-14 md:h-14 bg-black border-2 border-[#00F0FF] rounded-full flex items-center justify-center shadow-[0_0_30px_#00F0FF] backdrop-blur-md transition-transform duration-300 ${isDragging ? 'scale-125' : 'scale-100 group-hover:scale-110'}`}
          >
            <Sparkles className="absolute text-[#00F0FF] w-6 h-6 animate-pulse opacity-80" />
            <div className="flex justify-between w-full px-2 text-white/50 z-10">
              <ChevronLeft size={16} />
              <ChevronRight size={16} />
            </div>
            {/* Knob Flare */}
            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-30" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
