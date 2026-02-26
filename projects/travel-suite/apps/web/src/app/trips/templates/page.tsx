'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, LayoutTemplate, Sparkles } from 'lucide-react'
import { TripTemplates } from '@/components/trips/TripTemplates'
import { GlassButton } from '@/components/glass/GlassButton'
import type { TripTemplate } from '@/components/trips/TripTemplates'

const TEMPLATE_COUNT = 12

export default function TripTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null)

  const handleTemplateSelect = (template: TripTemplate) => {
    // Navigate to new trip with template pre-filled
    const params = new URLSearchParams({
      template: template.id,
      name:     template.name,
      days:     String(template.days),
      tier:     template.tier,
    })
    window.location.href = `/trips/new?${params.toString()}`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a1628' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#00d084]/20 border border-[#00d084]/30 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-[#00d084]" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Trip Templates
                <span className="ml-3 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#00d084]/20 text-[#00d084] text-sm font-black border border-[#00d084]/30">
                  {TEMPLATE_COUNT}
                </span>
              </h1>
            </div>
            <p className="text-white/50 text-sm max-w-lg leading-relaxed">
              Pre-built itineraries for popular Indian destinations. Clone and customise in minutes — change dates, add your client details, adjust inclusions and send a quote instantly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Highlight: AI hint */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00d084]/10 border border-[#00d084]/20 text-xs text-[#00d084] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Auto-priced with GST
            </div>

            <Link href="/trips/new?template=true">
              <GlassButton variant="primary" size="md">
                <Plus className="w-4 h-4" />
                Create Custom Template
              </GlassButton>
            </Link>
          </div>
        </motion.div>

        {/* Callout bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          {[
            { label: 'Popular Destinations',   value: '30+',         color: 'text-[#00d084]'  },
            { label: 'Ready-made Itineraries', value: `${TEMPLATE_COUNT}`,        color: 'text-blue-400'   },
            { label: 'Avg. Setup Time',        value: '< 2 min',     color: 'text-amber-400'  },
            { label: 'GST Calculations',       value: 'Automated',   color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className={`font-black text-base ${color}`}>{value}</span>
              <span className="text-white/40">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Templates component */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <TripTemplates onTemplateSelect={handleTemplateSelect} />
        </motion.div>

      </div>
    </div>
  )
}
