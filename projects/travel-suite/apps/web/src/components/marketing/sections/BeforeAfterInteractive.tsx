"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { XCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

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
        // Initialize handle to center
        x.set(containerRef.current.getBoundingClientRect().width / 2);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [x]);

  // Convert pixel position to a percentage (0% to 100%) for clipping
  const clipPercentage = useTransform(x, [0, containerWidth], [0, 100]);
  
  // The clip-path string for the foreground (TravelBuilt) layer.
  // We clip from the right edge inward. At 50%, we show half the image.
  // The value means "clip the right side at this percentage".
  const clipPathBase = useTransform(
    clipPercentage,
    (val) => `inset(0 0 0 ${val}%)`
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto h-[600px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl select-none"
    >
      {/* Background Layer: TRAVELBUILT (The Good Way) */}
      <div className="absolute inset-0 bg-[#0A0A0A] border border-[#00F0FF]/30 p-8 md:p-12 pl-[50%] md:pl-[50%] flex flex-col justify-center">
        <div className="w-full pl-8 md:pl-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-3xl font-bold text-[#00F0FF]">The TravelBuilt Way</h3>
          </div>
          <div className="space-y-6">
            {newWayItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-gray-200">
                <span className="text-xl">{item.icon}</span>
                <p className="text-lg font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Foreground Layer: OLD WAY (The Bad Way) - Clipped to reveal the background */}
      <motion.div 
        className="absolute inset-0 bg-[#111] border border-red-500/20 p-8 md:p-12 pr-[50%] md:pr-[50%] flex flex-col justify-center origin-left"
        style={{ clipPath: clipPathBase }}
      >
        <div className="w-full pr-8 md:pr-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <XCircle size={24} />
            </div>
            <h3 className="text-3xl font-bold text-red-500">The Old Way</h3>
          </div>
          <div className="space-y-6">
            {oldWayItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-gray-400 opacity-80">
                <span className="text-xl grayscale opacity-50">{item.icon}</span>
                <p className="text-lg">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Interactive Slider Handle */}
      {containerWidth > 0 && (
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: containerWidth }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          whileHover={{ width: 4 }}
        >
          {/* Handle knob */}
          <motion.div 
            className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl transition-transform ${isDragging ? 'scale-110' : 'scale-100'}`}
          >
            <ChevronLeft className="text-black w-5 h-5 -mr-1" />
            <ChevronRight className="text-black w-5 h-5 -ml-1" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
