'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plane, ChevronDown } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: 'all 0.5s ease',
          background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
      >
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 40px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00F0FF, #0070F3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 28px rgba(0,240,255,0.6)',
            }}>
              <Plane size={28} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '30px', letterSpacing: '-0.5px', color: 'white', lineHeight: 1 }}>
              Travel<span style={{ color: '#00F0FF' }}>Suite</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
            {navLinks.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    position: 'relative',
                    padding: '12px 24px',
                    borderRadius: '999px',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: active ? 'white' : '#9CA3AF',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                </Link>
              );
            })}

            {/* Solutions Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button
                className="flex items-center gap-1 relative px-6 py-3 rounded-full text-[22px] font-semibold text-[#9CA3AF] hover:text-white transition-colors"
              >
                Solutions <ChevronDown size={20} className={`transition-transform duration-300 ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 p-2"
                  >
                    {[
                      { title: 'For Solo Agents', path: '/solutions/solo' },
                      { title: 'For Scaling Agencies', path: '/solutions/agency' },
                      { title: 'For Corporate TMCs', path: '/solutions/tmc' }
                    ].map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="block px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-[#00F0FF] transition-colors"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="hidden md:flex">
            <ThemeToggle />
            <Link
              href="/login"
              style={{
                padding: '14px 32px',
                borderRadius: '999px',
                fontSize: '18px',
                fontWeight: 600,
                color: '#00F0FF',
                border: '2px solid rgba(0,240,255,0.5)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Account Login
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
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
            style={{
              position: 'fixed',
              top: '80px',
              left: 0,
              right: 0,
              zIndex: 99,
              background: 'rgba(10,10,10,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              padding: '24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: pathname === href ? '#00F0FF' : '#D1D5DB',
                  textDecoration: 'none',
                  padding: '4px 0',
                }}
              >
                {label}
              </Link>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-gray-500 font-semibold text-sm uppercase tracking-wider px-2">Solutions</span>
              {[
                { title: 'For Solo Agents', path: '/solutions/solo' },
                { title: 'For Scaling Agencies', path: '/solutions/agency' },
                { title: 'For Corporate TMCs', path: '/solutions/tmc' }
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#D1D5DB',
                    textDecoration: 'none',
                    padding: '4px 8px',
                  }}
                >
                  {item.title}
                </Link>
              ))}
            </div>

            <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 font-medium">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/login" onClick={() => setMobileOpen(false)} style={{ textAlign: 'center', padding: '14px', borderRadius: '999px', fontSize: '16px', fontWeight: 600, color: '#00F0FF', border: '1.5px solid rgba(0,240,255,0.4)', textDecoration: 'none' }}>
                Account Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence >
    </>
  );
}
