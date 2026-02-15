/**
 * Design System Demo Page
 *
 * Demonstrates the unified web-mobile design system
 * Shows glassmorphism, typography, colors, and components
 */

'use client';

import { useState } from 'react';
import { GlassCard, GlassPill, GlassIconButton } from '@/components/glass/GlassCard';
import { GlassNavBar, travelerNavItems } from '@/components/glass/GlassNavBar';
import {
  Home,
  Bell,
  MapPin,
  Clock,
  User,
  Star,
  Check,
  ArrowRight,
} from 'lucide-react';

export default function DesignDemoPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-app pb-24">
      {/* Header (matching mobile app bar) */}
      <div className="glass-nav sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary mb-1">
                FEBRUARY 2026 • DUBAI
              </p>
              <h1 className="text-3xl font-bold font-serif text-secondary">
                My Journeys
              </h1>
            </div>
            <GlassIconButton
              icon={<Bell className="w-5 h-5" />}
              variant="primary"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Status Pill */}
        <GlassPill variant="primary">
          <div className="w-2 h-2 bg-primary rounded-full pulse-dot" />
          <span className="text-sm font-bold text-text-primary">
            Current: Day 3 - Arrival
          </span>
        </GlassPill>

        {/* Driver Card (matching mobile traveler_dashboard_stitch.dart) */}
        <GlassCard padding="lg" rounded="xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-white p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold font-serif text-secondary">
                Raj Singh
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                <Home className="w-3.5 h-3.5" />
                <span className="font-medium">Toyota Innova • DL 1C 5592</span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <GlassIconButton
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>}
                variant="default"
              />
              <GlassIconButton
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>}
                variant="default"
              />
            </div>
          </div>
        </GlassCard>

        {/* Up Next Card (matching mobile hero card) */}
        <GlassCard padding="xl" rounded="2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-text-secondary">
                UP NEXT
              </span>
              <button className="text-secondary/35">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-5xl font-bold font-serif text-primary leading-none">
                14:00
              </div>
              <h2 className="text-2xl font-bold font-serif italic text-secondary">
                Burj Khalifa Tour
              </h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                <MapPin className="w-4.5 h-4.5" />
                <span>Downtown Dubai, UAE</span>
              </div>
            </div>

            <div className="h-px bg-secondary/10" />

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-white p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-2 text-secondary font-bold text-sm transition-smooth hover:gap-3">
                <span>Get Directions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Tool Grid (matching mobile tool cards) */}
        <div className="grid grid-cols-2 gap-3.5">
          {[
            { icon: <svg className="w-6.5 h-6.5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>, label: 'Itinerary' },
            { icon: <svg className="w-6.5 h-6.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>, label: 'Expenses' },
            { icon: <svg className="w-6.5 h-6.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>, label: '28°C Dubai', sublabel: 'Clear Sky' },
            { icon: <User className="w-6.5 h-6.5" />, label: 'Concierge' },
          ].map((tool, i) => (
            <GlassCard
              key={i}
              padding="lg"
              rounded="xl"
              className="cursor-pointer hover:shadow-glass transition-smooth"
            >
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-[18px] bg-secondary/10 flex items-center justify-center text-secondary">
                  {tool.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {tool.label}
                  </div>
                  {tool.sublabel && (
                    <div className="text-xs font-medium text-text-secondary mt-0.5">
                      {tool.sublabel}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Typography Scale Demo */}
        <GlassCard padding="xl" rounded="xl">
          <h3 className="text-lg font-bold mb-4 text-text-primary">
            Typography Scale
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-5xl font-bold font-serif text-secondary">
                Display Large
              </div>
              <div className="text-xs text-text-secondary">40px Cormorant Garamond Bold</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-serif text-secondary">
                Display Medium
              </div>
              <div className="text-xs text-text-secondary">32px Cormorant Garamond Bold</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">
                Headline Large
              </div>
              <div className="text-xs text-text-secondary">24px Poppins Bold</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-secondary">
                Headline Medium
              </div>
              <div className="text-xs text-text-secondary">20px Poppins Semibold</div>
            </div>
            <div>
              <div className="text-base">
                Body Large - Regular paragraph text looks great in Poppins.
              </div>
              <div className="text-xs text-text-secondary">16px Poppins Regular</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">
                Body Medium - Secondary text and descriptions.
              </div>
              <div className="text-xs text-text-secondary">14px Poppins Regular</div>
            </div>
          </div>
        </GlassCard>

        {/* Color Palette Demo */}
        <GlassCard padding="xl" rounded="xl">
          <h3 className="text-lg font-bold mb-4 text-text-primary">
            Color Palette
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-20 rounded-xl bg-primary mb-2 flex items-center justify-center">
                <span className="text-white font-bold">Primary</span>
              </div>
              <div className="text-xs text-text-secondary">#00D084</div>
            </div>
            <div>
              <div className="h-20 rounded-xl bg-secondary mb-2 flex items-center justify-center">
                <span className="text-white font-bold">Secondary</span>
              </div>
              <div className="text-xs text-text-secondary">#124EA2</div>
            </div>
            <div>
              <div className="h-20 rounded-xl bg-[#22C55E] mb-2 flex items-center justify-center">
                <span className="text-white font-bold">Success</span>
              </div>
              <div className="text-xs text-text-secondary">#22C55E</div>
            </div>
            <div>
              <div className="h-20 rounded-xl bg-[#EF4444] mb-2 flex items-center justify-center">
                <span className="text-white font-bold">Error</span>
              </div>
              <div className="text-xs text-text-secondary">#EF4444</div>
            </div>
          </div>
        </GlassCard>

        {/* Button Variants */}
        <GlassCard padding="xl" rounded="xl">
          <h3 className="text-lg font-bold mb-4 text-text-primary">
            Button Variants
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-primary text-white rounded-lg px-6 py-3.5 font-semibold shadow-button hover:bg-[#00B874] transition-smooth active:scale-95">
              Primary Button
            </button>
            <button className="w-full border-[1.5px] border-primary text-primary rounded-lg px-6 py-3.5 font-semibold hover:bg-primary/5 transition-smooth active:scale-95">
              Secondary Button
            </button>
            <button className="w-full bg-secondary text-white rounded-lg px-6 py-3.5 font-semibold hover:bg-[#0F3E85] transition-smooth active:scale-95">
              Blue Button
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Floating Navigation (matching mobile) */}
      <GlassNavBar
        items={travelerNavItems}
        activeIndex={activeTab}
        onItemClick={setActiveTab}
      />
    </div>
  );
}
