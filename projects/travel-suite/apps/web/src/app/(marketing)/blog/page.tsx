'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, User } from 'lucide-react';
import dynamic from 'next/dynamic';

const ForceFieldBackground = dynamic(
  () => import('@/components/marketing/ForceFieldBackground').then(m => m.ForceFieldBackground),
  { ssr: false }
);

const articles = [
  {
    title: "How to Write a Travel Proposal That Converts in 2026",
    excerpt: "Stop sending boring PDFs. Learn how interactive, mobile-optimized itineraries are increasing conversion rates by up to 45% for Indian tour operators.",
    author: "Sneha Patel",
    date: "Mar 10, 2026",
    category: "Proposals",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "The Ultimate Guide to Automating WhatsApp for Travel Agents",
    excerpt: "Your clients live on WhatsApp. Here's how to stop manually typing out flight times and hotel details, and start automating your entire communication flow.",
    author: "Rahul Sharma",
    date: "Feb 28, 2026",
    category: "Automation",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Why Excel is Killing Your Tour Operations Business",
    excerpt: "Still tracking driver payments and agent commissions in a spreadsheet? Discover the hidden costs of manual data entry and how a dedicated OS solves them.",
    author: "Arjun Desai",
    date: "Feb 15, 2026",
    category: "Operations",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=800&auto=format&fit=crop"
  }
];

export default function Blog() {
  return (
    <div className="text-white selection:bg-[#00F0FF]/30 selection:text-white flex flex-col relative overflow-hidden">
      {/* Hero Section */}
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
            Travel<span className="text-[#00F0FF]">Suite</span> Resources
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Insights, strategies, and playbooks for modern tour operators who want to grow faster and work less.
          </p>
        </motion.div>
      </section>

      <div className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-24 pb-20 md:pb-32 pt-8 md:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {articles.map((article, index) => (
            <motion.article
              key={article.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-semibold text-[#00F0FF]">
                  {article.category}
                </div>
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-4 group-hover:text-[#00F0FF] transition-colors leading-tight">
                  <Link href="#" className="before:absolute before:inset-0">
                    {article.title}
                  </Link>
                </h3>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
                  {article.excerpt}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/5 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User size={14} className="text-gray-400" />
                    <span>{article.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{article.date}</span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Subscribe banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 md:mt-32 p-8 md:p-16 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#FF9933]/10 to-transparent relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/10 blur-[100px] rounded-full" />

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl md:text-5xl font-bold mb-4">Stay ahead of the <span className="text-[#FF9933]">curve</span></h2>
            <p className="text-gray-400 mb-8 text-base md:text-lg">
              Get one actionable tip every Tuesday on how to automate your travel business. No fluff, just operator playbooks.
            </p>

            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-grow px-6 py-4 rounded-xl bg-black/50 border border-white/10 focus:outline-none focus:border-[#FF9933]/50 text-white"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#FF9933] text-black font-bold rounded-xl hover:bg-[#FFB366] transition-colors flex items-center justify-center gap-2"
              >
                Subscribe
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
