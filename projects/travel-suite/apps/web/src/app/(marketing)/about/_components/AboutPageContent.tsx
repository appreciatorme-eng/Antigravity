'use client';

import { motion } from 'framer-motion';
import { Heart, Globe, Mountain, Code2, MapPin, Compass, Users, Sparkles } from 'lucide-react';
import { CountUp } from '@/components/marketing/CountUp';
import dynamic from 'next/dynamic';

const ForceFieldBackground = dynamic(
  () => import('@/components/marketing/ForceFieldBackground').then(m => m.ForceFieldBackground),
  { ssr: false }
);

const travelPins = [
  'Masai Mara', 'Vietnam', 'Mexico', 'Bahamas', 'Thailand',
  'Santo Domingo', 'Egypt', 'New York', 'California', 'Texas',
  'Colorado', 'Montana', 'Oregon', 'Florida', 'Hawaii',
];

const principles = [
  {
    icon: <Mountain size={28} />,
    title: 'Built from the Field',
    color: '#FF9933',
    description: 'Not a tech startup guessing what agents need. Built by people who have managed treks, snow expeditions, and luxury tours firsthand.',
  },
  {
    icon: <Code2 size={28} />,
    title: 'Data Meets Wanderlust',
    color: '#00F0FF',
    description: 'A decade of analytics engineering meets boots-on-the-ground travel knowledge. Every dashboard, every metric — designed with operator intelligence.',
  },
  {
    icon: <Compass size={28} />,
    title: 'Agent-First, Always',
    color: '#A259FF',
    description: 'Every feature exists because a real tour operator asked for it. We don\'t build for investors. We build for the agents on the ground.',
  },
];

const stats = [
  { num: 30, suffix: '+', label: 'US States Lived In' },
  { num: 8, suffix: '+', label: 'Countries Explored' },
  { num: 10, suffix: '+', label: 'Years in Software' },
  { num: 1, suffix: '', label: 'Brother\'s Business That Started It All' },
];

export default function AboutPageContent() {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-28 px-6 md:px-24 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <ForceFieldBackground id="tsparticles-about" particleCount={150} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-6">
            <Heart size={14} /> Our Story
          </div>
          <h1 className="text-4xl md:text-7xl font-black leading-tight mb-6">
            Created by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#ff3366]">Tour Operators</span><br />
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#A259FF]">Tour Operators</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            TripBuilt wasn&apos;t born in a boardroom. It was born watching a brother struggle to manage his adventure company with spreadsheets, WhatsApp groups, and sticky notes.
          </p>
        </motion.div>
      </section>

      {/* The Origin Story */}
      <section className="py-16 md:py-20 px-6 md:px-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF9933]/30 text-[#FF9933] text-sm font-semibold tracking-widest uppercase">
              <Sparkles size={14} /> The Beginning
            </div>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              It Started With a <br /><span className="text-[#FF9933]">Brother&apos;s Business</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Anvesh runs <strong className="text-white">TripBuilt</strong> — a company built on the belief that tourism is a tool for conservation and sustainable development. From luxury trekking packages in the Himalayas to snow expeditions and mountaineering, TripBuilt provides purposeful travel to natural areas.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              But behind the stunning treks and life-changing experiences was chaos — client details scattered across notebooks, itineraries copy-pasted from old emails, payment follow-ups lost in WhatsApp threads. Avi watched his brother drown in admin work when he should have been doing what he loves: <em className="text-white">creating unforgettable journeys.</em>
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              That frustration became the spark. <strong className="text-[#00F0FF]">TripBuilt</strong> was born — not from market research, but from a real operator&apos;s real pain.
            </p>
          </motion.div>

          {/* TripBuilt Visual Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF9933]/10 via-white/5 to-transparent p-8 backdrop-blur-sm overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FF9933]/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF9933]/20 border border-[#FF9933]/30 flex items-center justify-center">
                    <Mountain size={28} className="text-[#FF9933]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">TripBuilt</h3>
                    <p className="text-sm text-[#FF9933]">Where It All Began</p>
                  </div>
                </div>
                <blockquote className="border-l-2 border-[#FF9933]/50 pl-4 mb-6">
                  <p className="text-gray-300 italic text-lg leading-relaxed">
                    &quot;Buddy is not a person, it is a feeling of trust around you.&quot;
                  </p>
                </blockquote>
                <div className="flex flex-wrap gap-2">
                  {['Trekking', 'Snow Expeditions', 'Mountaineering', 'Outdoor Training', 'Summer Camps', 'Skiing'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Avi's Journey */}
      <section className="py-16 md:py-20 px-6 md:px-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Travel Pins Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-[300px] md:h-[420px] rounded-3xl border border-white/10 bg-gradient-to-br from-[#00F0FF]/5 via-transparent to-[#A259FF]/5 flex items-center justify-center overflow-hidden"
          >
            <div className="relative z-10 flex flex-wrap justify-center gap-3 max-w-md px-6">
              {travelPins.map((pin, i) => (
                <motion.div
                  key={pin}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-gray-300 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 hover:text-[#00F0FF] transition-all cursor-default">
                    <MapPin size={12} className="text-[#00F0FF] opacity-70" />
                    {pin}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-xs text-gray-500 tracking-widest uppercase">& counting...</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase">
              <Globe size={14} /> The Founder
            </div>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              A Digital Nomad Meets<br /><span className="text-[#00F0FF]">Enterprise Software</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Avi isn&apos;t your typical tech founder. Before writing a single line of code for TripBuilt, he lived across <strong className="text-white">30+ US states</strong>, explored the sweeping savannas of <strong className="text-white">Masai Mara</strong>, navigated the streets of <strong className="text-white">Vietnam, Mexico, Thailand, Egypt, the Bahamas,</strong> and <strong className="text-white">Santo Domingo</strong>.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              But Avi is also a <strong className="text-white">software engineer with over a decade of experience</strong> as an Analytics Developer — someone who understands data, dashboards, and business intelligence at an enterprise level.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              This rare combination — <em className="text-[#00F0FF]">deep travel industry knowledge fused with world-class engineering</em> — is what makes TripBuilt fundamentally different from any other travel-tech platform. It&apos;s not built by outsiders looking in. It&apos;s built by someone who has <strong className="text-white">lived the journey</strong>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-16 px-6 md:px-24">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ num, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-[#00F0FF]/40 transition-colors"
            >
              <div className="text-4xl font-black text-[#00F0FF] mb-1">
                <CountUp to={num} suffix={suffix} />
              </div>
              <div className="text-sm text-gray-400">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founding Principles */}
      <section className="py-16 md:py-20 px-6 md:px-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A259FF]/30 text-[#A259FF] text-sm font-semibold tracking-widest uppercase mb-4">
              <Compass size={14} /> Our Principles
            </div>
            <h2 className="text-3xl md:text-5xl font-bold">Why TripBuilt is <span className="text-[#A259FF]">Different</span></h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {principles.map(({ icon, title, color, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="group p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-all hover:border-opacity-50"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors"
                  style={{
                    backgroundColor: `${color}15`,
                    borderColor: `${color}30`,
                    color: color,
                  }}
                >
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-20 px-6 md:px-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-4">
              <Users size={14} /> The Team
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">The People Behind TripBuilt</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Avi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/5 transition-all group"
            >
              <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#00F0FF] to-[#A259FF] flex items-center justify-center text-3xl font-black text-white shadow-[0_0_30px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-shadow">
                A
              </div>
              <h3 className="text-xl font-bold text-white">Avi</h3>
              <p className="text-[#00F0FF] text-sm font-semibold mb-3">Founder & CEO</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Digital nomad. Analytics engineer with 10+ years of experience. Traveled 30+ US states and 8+ countries. Fused travel passion with enterprise-grade software.
              </p>
            </motion.div>

            {/* Anvesh */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-[#FF9933]/40 hover:bg-[#FF9933]/5 transition-all group"
            >
              <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#FF9933] to-[#ff3366] flex items-center justify-center text-3xl font-black text-white shadow-[0_0_30px_rgba(255,153,51,0.3)] group-hover:shadow-[0_0_40px_rgba(255,153,51,0.5)] transition-shadow">
                A
              </div>
              <h3 className="text-xl font-bold text-white">Anvesh</h3>
              <p className="text-[#FF9933] text-sm font-semibold mb-3">Co-Founder & Industry Advisor</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Founder of TripBuilt. Expert in trekking, mountaineering, and sustainable tourism. The real-world operator whose daily challenges shaped every feature.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
