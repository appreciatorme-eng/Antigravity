'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const STORAGE_KEY = 'touros_language'

type Lang = 'en' | 'hi'

interface LanguageToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export function LanguageToggle({ className = '', size = 'md' }: LanguageToggleProps) {
  const [lang, setLangState] = useState<Lang>('en')

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'hi') {
        setLangState(stored)
      }
    }
  }, [])

  const handleChange = (newLang: Lang) => {
    setLangState(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang)
      window.dispatchEvent(new CustomEvent('languageChange', { detail: { lang: newLang } }))
    }
  }

  // ── Compact pill for topbar ──────────────────────────────────────────────
  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5 ${className}`}>
        <button
          onClick={() => handleChange('en')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
            lang === 'en'
              ? 'bg-[#00d084] text-black'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => handleChange('hi')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 ${
            lang === 'hi'
              ? 'bg-[#00d084] text-black'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          हि
        </button>
      </div>
    )
  }

  // ── Full card for settings page ──────────────────────────────────────────
  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-sm font-semibold text-white">Language / भाषा</p>

      <div className="grid grid-cols-2 gap-3">
        {/* English option */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleChange('en')}
          className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 ${
            lang === 'en'
              ? 'border-[#00d084] bg-[#00d084]/5'
              : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          <span className="text-2xl">🇬🇧</span>
          <span className="text-sm font-semibold text-white">English</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              lang === 'en'
                ? 'bg-[#00d084]/20 text-[#00d084]'
                : 'bg-white/10 text-white/40'
            }`}
          >
            Default
          </span>
          {lang === 'en' && (
            <motion.div
              layoutId="lang-active-ring"
              className="absolute inset-0 rounded-2xl ring-2 ring-[#00d084] ring-offset-2 ring-offset-[#0a1628]"
            />
          )}
        </motion.button>

        {/* Hindi option */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleChange('hi')}
          className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 ${
            lang === 'hi'
              ? 'border-[#00d084] bg-[#00d084]/5'
              : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          <span className="text-2xl">🇮🇳</span>
          <span className="text-sm font-semibold text-white">हिंदी</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              lang === 'hi'
                ? 'bg-[#00d084]/20 text-[#00d084]'
                : 'bg-amber-400/20 text-amber-400'
            }`}
          >
            Beta
          </span>
          {lang === 'hi' && (
            <motion.div
              layoutId="lang-active-ring"
              className="absolute inset-0 rounded-2xl ring-2 ring-[#00d084] ring-offset-2 ring-offset-[#0a1628]"
            />
          )}
        </motion.button>
      </div>

      <p className="text-xs text-white/40">
        Hindi translations are in beta. Some text may appear in English.
      </p>
    </div>
  )
}
