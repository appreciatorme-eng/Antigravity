'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plane } from 'lucide-react';

const navLinks = [
  { label: 'Home',     href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Pricing',  href: '/pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,240,255,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#0070F3] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.5)] group-hover:shadow-[0_0_32px_rgba(0,240,255,0.8)] transition-shadow duration-300">
              <Plane size={20} className="text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">
              Travel<span className="text-[#00F0FF]">Suite</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 ${
                    active
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  } text-base`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10 border border-white/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* CTA: Account Login */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full text-base font-semibold text-[#00F0FF] border border-[#00F0FF]/40 hover:border-[#00F0FF] hover:bg-[#00F0FF]/10 transition-all duration-300"
            >
              Account Login
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-full text-base font-bold text-black bg-[#00F0FF] hover:bg-white hover:shadow-[0_0_24px_rgba(0,240,255,0.6)] transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-[99] bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`text-lg font-medium py-1 transition-colors ${
                  pathname === href ? 'text-[#00F0FF]' : 'text-gray-300 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-3 border-t border-white/10">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center px-5 py-3 rounded-full text-sm font-semibold text-[#00F0FF] border border-[#00F0FF]/40">
                Account Login
              </Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="text-center px-5 py-3 rounded-full text-sm font-bold text-black bg-[#00F0FF]">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
