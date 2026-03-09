'use client';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Users, Globe, Award, Heart } from 'lucide-react';

const stats = [
  { value: '500+', label: 'Tour Operators' },
  { value: '12K+', label: 'Trips Managed' },
  { value: '98%',  label: 'Client Satisfaction' },
  { value: '4',    label: 'Countries' },
];

const team = [
  { name: 'Arjun Mehta',   role: 'CEO & Co-founder',    emoji: '👨‍💼' },
  { name: 'Priya Sharma',  role: 'CTO',                  emoji: '👩‍💻' },
  { name: 'Rohan Gupta',   role: 'Head of Design',       emoji: '🎨' },
  { name: 'Sneha Patel',   role: 'Head of Partnerships', emoji: '🤝' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 md:px-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-6">
            <Heart size={14} /> Our Story
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#0070F3]">Tour Operators</span><br />by Tour Operators
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            We got tired of juggling spreadsheets, WhatsApp groups, and PDFs. So we built the platform we always wished existed.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 md:px-24">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-[#00F0FF]/40 transition-colors"
            >
              <div className="text-4xl font-black text-[#00F0FF] mb-1">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 md:px-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <Globe size={24} />
            </div>
            <h2 className="text-4xl font-bold">Our Mission</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              To empower every Indian tour operator — from a solo freelancer to a 50-person agency — with the same enterprise-grade tools that the world's best travel companies use.
            </p>
            <p className="text-gray-400 text-lg leading-relaxed">
              We believe every traveller deserves a beautifully crafted experience, and every operator deserves to build one without drowning in admin work.
            </p>
          </div>
          <div className="relative h-64 rounded-3xl border border-white/10 bg-gradient-to-br from-[#00F0FF]/10 to-[#0070F3]/10 flex items-center justify-center">
            <div className="text-8xl">✈️</div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#0A0A0A]/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 md:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-4">
              <Users size={14} /> The Team
            </div>
            <h2 className="text-4xl font-bold">The people behind TravelSuite</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map(({ name, role, emoji }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/5 transition-all"
              >
                <div className="text-5xl mb-3">{emoji}</div>
                <div className="font-bold text-white">{name}</div>
                <div className="text-sm text-gray-400 mt-1">{role}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
