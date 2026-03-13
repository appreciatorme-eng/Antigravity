'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[9999] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #00F0FF, #A259FF, #FF9933)',
        boxShadow: '0 0 10px rgba(0,240,255,0.5), 0 0 20px rgba(162,89,255,0.3)',
      }}
    />
  );
}
