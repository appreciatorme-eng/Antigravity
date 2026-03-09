'use client';

import Link from 'next/link';
import { Plane, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { label: 'Marketplace', href: '#' },
        { label: 'Booking Engine', href: '#' },
        { label: 'Inventory', href: '#' },
        { label: 'Pricing', href: '/pricing' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Contact', href: '#' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
      ]
    }
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-6 md:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#0070F3] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-500">
                <Plane size={20} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter">TRAVEL<span className="text-[#00F0FF]">SUITE</span></span>
            </Link>
            <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
              The first truly modern operating system for Indian tour operators. Built by operators, for operators. Revolutionizing how itineraries are built and trips are sold.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <Link key={i} href="#" className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/50 transition-all">
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#00F0FF]">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Global Connection / Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-y border-white/5 mb-10">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#00F0FF]">
              <Phone size={14} />
            </div>
            <span>+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#00F0FF]">
              <Mail size={14} />
            </div>
            <span>hello@travelsuite.io</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#00F0FF]">
              <MapPin size={14} />
            </div>
            <span>Bengaluru, India</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500">
          <p>© {currentYear} Travel Suite Technologies Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <p className="flex items-center gap-2">
              Made with <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-red-500">❤️</motion.span> in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
