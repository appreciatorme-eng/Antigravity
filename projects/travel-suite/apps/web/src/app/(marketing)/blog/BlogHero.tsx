'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const ForceFieldBackground = dynamic(
  () =>
    import('@/components/marketing/ForceFieldBackground').then(
      (m) => m.ForceFieldBackground
    ),
  { ssr: false }
);

export function BlogHero() {
  return (
    <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <ForceFieldBackground id="tsparticles-blog" particleCount={150} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto text-center"
      >
        <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight">
          Travel<span className="text-[#00F0FF]">Built</span> Resources
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Insights, strategies, and playbooks for modern tour operators who want
          to grow faster and work less.
        </p>
      </motion.div>
    </section>
  );
}
