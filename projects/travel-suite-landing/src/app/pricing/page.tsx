'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, Zap, Building2, Sparkles, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
const ForceFieldBackground = dynamic(
  () => import('@/components/ForceFieldBackground').then(m => m.ForceFieldBackground),
  { ssr: false }
);

const plans = [
  {
    name: 'Starter',
    icon: <Zap size={20} />,
    price: { monthly: 999, annual: 799 },
    description: 'Perfect for solo operators just getting started.',
    color: '#00F0FF',
    features: [
      'Up to 50 Proposals/month',
      'Magic Link Proposals',
      'WhatsApp Automation (500 msgs)',
      'Basic CRM',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Pro',
    icon: <Sparkles size={20} />,
    price: { monthly: 2499, annual: 1999 },
    description: 'For growing agencies that need full automation.',
    color: '#FF9933',
    features: [
      'Unlimited Proposals',
      'Magic Link Proposals',
      'WhatsApp Automation (Unlimited)',
      'Advanced CRM + Pipeline',
      'Amadeus Flight & Hotel Search',
      'Team Collaboration (5 seats)',
      'Priority Support',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    icon: <Building2 size={20} />,
    price: { monthly: null, annual: null },
    description: 'For large agencies with custom needs.',
    color: '#A259FF',
    features: [
      'Everything in Pro',
      'Unlimited Seats',
      'Custom Integrations',
      'Dedicated Account Manager',
      'SLA Guarantee',
      'White-label Options',
      'On-premise Deployment',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Every plan comes with a 14-day free trial. No credit card required. You get full access to all features in your chosen plan so you can experience the difference before committing.',
  },
  {
    q: 'Can I import my existing client data?',
    a: 'Absolutely. TravelSuite supports CSV imports for your client database, booking history, and itinerary templates. Our onboarding team will help you migrate everything in under 24 hours.',
  },
  {
    q: 'Do you support international payments?',
    a: 'Yes. We integrate with Razorpay for domestic Indian payments and Stripe for international transactions. Your clients can pay in INR, USD, EUR, GBP, and 20+ other currencies.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Of course. There are no long-term contracts. You can upgrade, downgrade, or cancel your subscription at any time from your dashboard. We believe you should stay because you love the product, not because you\'re locked in.',
  },
  {
    q: 'Do you offer an API for custom integrations?',
    a: 'Yes, our Pro and Enterprise plans include full REST API access. You can integrate TravelSuite with your existing booking systems, accounting software, or custom tools.',
  },
  {
    q: 'What are the support hours?',
    a: 'Starter plans get email support (response within 24 hours). Pro plans get priority support with response within 4 hours via WhatsApp and email. Enterprise plans get a dedicated account manager with direct phone access.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className={`text-lg font-semibold transition-colors ${open ? 'text-[#00F0FF]' : 'text-white group-hover:text-gray-300'}`}>
          {q}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-500 transition-transform duration-300 shrink-0 ml-4 ${open ? 'rotate-180 text-[#00F0FF]' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 pb-5 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-16 px-6 md:px-24 text-center overflow-hidden">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <ForceFieldBackground id="tsparticles-pricing" particleCount={150} />
        </div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-6">
            Simple Pricing
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Plans that grow<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#FFD699]">with your business</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto mb-10">
            No hidden fees. No long-term lock-in. Start free for 14 days.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full border border-white/10 bg-white/5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!annual ? 'bg-white text-black' : 'text-gray-400'}`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${annual ? 'bg-white text-black' : 'text-gray-400'}`}
            >Annual <span className="text-[#00F0FF] ml-1">−20%</span></button>
          </div>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="pb-32 px-6 md:px-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map(({ name, icon, price, description, color, features, cta, highlight }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-3xl p-8 flex flex-col border transition-all duration-300 hover:scale-[1.02] ${
                highlight
                  ? 'border-[#FF9933]/60 bg-gradient-to-b from-[#FF9933]/10 to-transparent shadow-[0_0_60px_rgba(255,153,51,0.15)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FF9933] text-black text-xs font-black tracking-widest uppercase">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
                  {icon}
                </div>
                <h3 className="text-xl font-bold">{name}</h3>
              </div>

              <div className="mb-3">
                {price.monthly ? (
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black">₹{annual ? price.annual?.toLocaleString() : price.monthly?.toLocaleString()}</span>
                    <span className="text-gray-400 mb-2">/mo</span>
                  </div>
                ) : (
                  <div className="text-4xl font-black text-gray-300">Custom</div>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-6">{description}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                style={
                  highlight
                    ? { background: '#FF9933', color: '#000' }
                    : { border: `1px solid ${color}40`, color, background: `${color}10` }
                }
              >
                {cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-32 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold">Frequently Asked <span className="text-[#00F0FF]">Questions</span></h2>
            <p className="text-xl text-gray-400 mt-4">Everything you need to know before getting started.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8"
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} {...faq} />
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
