'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const ForceFieldBackground = dynamic(
    () => import('@/components/ForceFieldBackground').then(m => m.ForceFieldBackground),
    { ssr: false }
);

const solutionsData = {
    solo: {
        badge: "For Solo Agents",
        title: "Look like an agency of 50. Work like a team of 1.",
        description: "Stop juggling WhatsApp, Word docs, and Excel. Create breathtaking itineraries in minutes and close clients faster with TravelSuite.",
        benefits: [
            "Access 100+ pre-built proposal templates",
            "One-click flight & hotel integrations",
            "Automated magic link client portals",
            "Send professional GST-compliant invoices"
        ],
        heroImg: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1600&auto=format&fit=crop"
    },
    agency: {
        badge: "For Scaling Agencies",
        title: "Systemize your agency. Scale your revenue.",
        description: "Built for teams of 5-50. Centralize your bookings, control team permissions, and get real-time visibility into your agency's pipeline.",
        benefits: [
            "Advanced role-based access control (RBAC)",
            "Team performance tracking & leaderboards",
            "Centralized client communication hub",
            "Markup standardisation across all agents"
        ],
        heroImg: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop"
    },
    tmc: {
        badge: "For Corporate TMCs",
        title: "Enterprise-grade tools for modern corporate travel.",
        description: "Win more corporate accounts with white-labeled booking portals, automated expense reporting, and multi-tier approval workflows.",
        benefits: [
            "Custom branded corporate self-booking tool",
            "Automated GST reconciliation & reporting",
            "Complex multi-level approval workflows",
            "API integrations with HRMS systems"
        ],
        heroImg: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop"
    }
};

export default function SolutionPage({ params }: { params: Promise<{ type: string }> }) {
    const resolvedParams = React.use(params);
    const data = solutionsData[resolvedParams.type as keyof typeof solutionsData] || solutionsData.solo;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#00F0FF]/30 selection:text-white flex flex-col relative overflow-hidden">
            <Navbar />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-6 md:px-24 mb-16 md:mb-24 overflow-hidden">
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                        <ForceFieldBackground id="tsparticles-solutions" particleCount={150} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-10 md:gap-16 items-center">
                            <div className="lg:w-1/2">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF9933]/30 text-[#FF9933] text-sm font-semibold tracking-widest uppercase mb-6">
                                    {data.badge}
                                </div>
                                <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                                    {data.title}
                                </h1>
                                <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-10 leading-relaxed max-w-xl">
                                    {data.description}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href="/login"
                                        className="px-8 py-4 rounded-full bg-[#00F0FF] text-black font-bold text-center hover:bg-[#00F0FF]/90 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                                    >
                                        Start Your Free Trial
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/demo"
                                        className="px-8 py-4 rounded-full border border-white/20 text-white font-bold text-center hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        Book a Demo
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:w-1/2 w-full">
                                <div className="relative rounded-[2rem] overflow-hidden border border-white/10 aspect-square md:aspect-[4/3]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/20 to-[#FF9933]/20 mix-blend-overlay z-10" />
                                    <img src={data.heroImg} alt={data.badge} className="w-full h-full object-cover grayscale opacity-80" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 md:py-24 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#00F0FF]/5 blur-[120px] rounded-full" />

                    <div className="px-6 md:px-24 max-w-7xl mx-auto relative z-10">
                        <h2 className="text-2xl md:text-5xl font-bold mb-12 md:mb-16 text-center">Why travel professionals choose <span className="text-[#00F0FF]">TravelSuite</span></h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data.benefits.map((benefit, i) => (
                                <div key={i} className="flex items-start gap-4 p-8 rounded-3xl bg-black border border-white/10">
                                    <div className="w-12 h-12 rounded-full bg-[#00F0FF]/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="text-[#00F0FF]" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{benefit}</h3>
                                        <p className="text-gray-400">Everything you need to streamline this part of your workflow is built natively into our OS.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
