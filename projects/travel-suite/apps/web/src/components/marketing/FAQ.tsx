'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    {
        question: "Do I need to be a technical expert to use TravelSuite?",
        answer: "Not at all. TravelSuite is designed specifically for travel professionals, not developers. Our intuitive drag-and-drop interface means you can start building beautiful itineraries on day one, without writing a single line of code."
    },
    {
        question: "Does TravelSuite integrate with my existing GDS?",
        answer: "Yes, we offer seamless integrations with major GDS providers including Amadeus, Sabre, and Travelport. Your negotiated rates and PNRs sync directly into the platform."
    },
    {
        question: "Can I use my own branding on proposals?",
        answer: "Absolutely. All paid plans include complete white-labeling capabilities. You can add your logo, custom brand colors, domain mapping, and personalized email signatures."
    },
    {
        question: "How does the pricing work for larger agency teams?",
        answer: "Our 'Agency' and 'TMC' tiers are designed for scaling teams. Pricing scales predictably based on active user seats, with bulk discounts available for teams of 10 or more. Check our Pricing page for full details."
    },
    {
        question: "Is there a limit on how many proposals I can send?",
        answer: "No. All TravelSuite plans include unlimited proposal generation, unlimited client portals, and unlimited invoice creation."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    // Schema Markup for SEO
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <section className="py-24 px-6 md:px-24 bg-[#0A0A0A] relative" id="faq">
            {/* Inject JSON-LD Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked <span className="text-[#00F0FF]">Questions</span></h2>
                    <p className="text-xl text-gray-400">Everything you need to know about the product and billing.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`border border-white/10 rounded-2xl overflow-hidden transition-colors ${openIndex === index ? 'bg-white/[0.05] border-[#00F0FF]/30' : 'bg-[#111] hover:bg-white/[0.02]'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="flex items-center justify-between w-full p-6 text-left"
                            >
                                <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openIndex === index ? 'bg-[#00F0FF] text-black' : 'bg-white/10 text-white'}`}>
                                    {openIndex === index ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center p-8 bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF9933] to-transparent" />
                    <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                    <p className="text-gray-400 mb-6">Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.</p>
                    <a href="/demo" className="inline-flex items-center justify-center px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                        Get in touch
                    </a>
                </div>

            </div>
        </section>
    );
}
