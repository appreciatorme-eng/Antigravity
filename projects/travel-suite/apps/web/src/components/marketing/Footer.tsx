'use client';

import Link from 'next/link';
import { Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { TripBuiltLogo } from './TripBuiltLogo';
import { motion } from 'framer-motion';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { label: 'Marketplace' },
        { label: 'Booking Engine' },
        { label: 'Inventory' },
        { label: 'Pricing', href: '/pricing' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy' },
        { label: 'Terms of Service' },
        { label: 'Cookie Policy' },
      ]
    }
  ];

  const socialLinks = [
    { Icon: Twitter, label: 'TripBuilt on Twitter' },
    { Icon: Instagram, label: 'TripBuilt on Instagram' },
    { Icon: Linkedin, label: 'TripBuilt on LinkedIn' },
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-6 md:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <TripBuiltLogo size="md" />
            </Link>
            <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
              The first truly modern operating system for Indian tour operators. Built by operators, for operators. Revolutionizing how itineraries are built and trips are sold.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-400"
                  title={label}
                >
                  <Icon size={18} />
                </span>
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
                    {link.href ? (
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm">{link.label}</span>
                    )}
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
            <span>hello@tripbuilt.com</span>
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
          <p>© {currentYear} TripBuilt Technologies Private Limited. All rights reserved.</p>
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
