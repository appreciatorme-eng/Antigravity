'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, Zap, Building2, Sparkles, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ComparisonTable } from '@/components/ComparisonTable';
import { LeadMagnetSection } from '@/components/LeadMagnetSection';

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
      'Driver & Supplier Portal',
      'GST Invoicing & Payments',
      'Priority 24/7 Support',
    ],
    cta: 'Get Started Now',
    highlight: true,
  },
  {
    name: 'Enterprise',
    icon: <Building2 size={20} />,
    price: { monthly: 'Custom', annual: 'Custom' },
    description: 'Tailored solutions for large TMCs and franchises.',
    color: '#A259FF',
    features: [
      'Custom API Integrations',
      'White-label Domain',
      'Dedicated Account Manager',
      'Multi-branch Management',
      'Role-based Permissions',
      'Custom Training & Onboarding',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const faqs = [
  {
    question: "Is there a free trial available?",
    answer: "Yes! We offer a 14-day free trial on our Starter and Pro plans. No credit card is required to start exploring."
  },
  {
    question: "Can I import data from my current CRM?",
    answer: "Absolutely. Our onboarding team helps you migrate your leads, itineraries, and supplier data from Excel or other CRMs for free."
  },
  {
    question: "Does it support international payments?",
    answer: "Yes, TravelSuite integrates with global payment gateways like Stripe and Razorpay, supporting 135+ currencies."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel or change your plan at any time. If you cancel, you'll still have access until the end of your billing cycle."
  },
  {
    question: "Do you offer API access?",
    answer: "API access is available on our Enterprise plan for custom integrations with your existing tech stack."
  },
  {
    question: "What kind of support is provided?",
    answer: "Starter users get email support. Pro and Enterprise users enjoy priority 24/7 WhatsApp and phone support."
  }
];

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-semibold group-hover:text-[#00F0FF] transition-colors">{question}</span>
        <ChevronDown
          size={20}
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00F0FF]' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#00F0FF]/30 selection:text-white relative overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24 mb-12 md:mb-20 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <ForceFieldBackground id="tsparticles-pricing" particleCount={150} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-[#00F0FF] mb-8"
          >
            <Sparkles size={16} />
            Simple, Transparent Pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-8xl font-black mb-6 md:mb-8 tracking-tighter"
          >
            Scale Your <br />
            <span className="bg-gradient-to-r from-[#00F0FF] via-[#A259FF] to-[#FF9933] bg-clip-text text-transparent">Business.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2 md:mb-20"
          >
            <span className={`text-lg font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-16 h-8 rounded-full bg-white/10 border border-white/10 relative p-1 transition-colors hover:border-[#00F0FF]/50"
            >
              <motion.div
                animate={{ x: billingCycle === 'annual' ? 32 : 0 }}
                className="w-6 h-6 rounded-full bg-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.5)]"
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-medium transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-gray-500'}`}>Annually</span>
              <span className="px-2 py-0.5 rounded-md bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-bold">SAVE 20%</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative px-6 md:px-24 pb-20 md:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative group p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border transition-all duration-500 ${plan.highlight ? 'bg-white/[0.05] border-[#00F0FF]/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#00F0FF] to-[#A259FF] rounded-full text-xs font-black text-white shadow-lg uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-8 p-4 rounded-2xl inline-flex bg-white/5 border border-white/5" style={{ color: plan.color }}>
                {plan.icon}
              </div>

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">{plan.description}</p>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">₹{typeof plan.price === 'string' ? plan.price : (billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual)}</span>
                  {typeof plan.price !== 'string' && <span className="text-gray-500">/mo</span>}
                </div>
                {typeof plan.price !== 'string' && billingCycle === 'annual' && (
                  <p className="text-[#00F0FF] text-xs font-medium mt-1">Billed annually</p>
                )}
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Check size={18} className="text-[#00F0FF] mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${plan.highlight ? 'bg-[#00F0FF] text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white hover:bg-white/10'}`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable />

      {/* FAQ Section */}
      <section className="py-20 md:py-32 px-6 md:px-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold">Frequently Asked <span className="text-[#00F0FF]">Questions</span></h2>
            <p className="text-lg md:text-xl text-gray-400 mt-4">Everything you need to know before getting started.</p>
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

      {/* Lead Magnet Funnel */}
      <LeadMagnetSection />

      <Footer />
    </div>
  );
}
