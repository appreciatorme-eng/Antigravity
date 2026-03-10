import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';
import Link from 'next/link';
import { BadgeCheck, Zap, Globe, CalendarDays } from 'lucide-react';

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#00F0FF]/30 selection:text-white flex flex-col pt-32">
            <Navbar />

            <main className="flex-grow">
                <section className="px-6 md:px-24 mb-16 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">

                        {/* Left Column: Value Prop */}
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-widest uppercase mb-6">
                                1-on-1 Product Tour
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                                See how TravelSuite can transform your agency.
                            </h1>
                            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
                                Book a personalized demo with our travel tech experts. We'll show you exactly how to automate your workflows, close more deals, and scale your revenue.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { icon: Zap, title: "Lightning Fast Itineraries", desc: "Create stunning proposals in under 3 minutes." },
                                    { icon: Globe, title: "Live Pricing & Inventory", desc: "Real-time rates for flights, hotels, and activities." },
                                    { icon: BadgeCheck, title: "Automated Invoicing", desc: "GST-compliant invoices tied directly to your bookings." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <item.icon className="text-[#00F0FF]" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{item.title}</h4>
                                            <p className="text-gray-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10">
                                <p className="text-gray-300 italic">"TravelSuite replaced 4 different tools we were paying for. It’s easily saved my team 20+ hours a week in manual admin work."</p>
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#0055FF] shrink-0" />
                                    <div>
                                        <p className="font-bold text-sm">Sarah Jenkins</p>
                                        <p className="text-gray-500 text-xs text-uppercase tracking-wider">Founder, Wanderlust Agency</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Calendar Widget */}
                        <div className="lg:w-1/2 w-full relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#00F0FF]/10 blur-[100px] rounded-full pointer-events-none z-0" />

                            <div className="relative z-10 p-2 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent">
                                <div className="bg-[#111] border border-white/5 rounded-[1.8rem] overflow-hidden shadow-2xl min-h-[600px] flex items-center justify-center relative">

                                    {/* Mock Calendar UI for the demo */}
                                    <div className="w-full h-full p-8 flex flex-col">
                                        <div className="flex items-center gap-3 mb-8">
                                            <CalendarDays className="text-[#00F0FF]" size={28} />
                                            <h3 className="text-2xl font-bold">Select a Time</h3>
                                        </div>

                                        <div className="flex-grow border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.02]">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <span className="text-2xl">⚡️</span>
                                            </div>
                                            <p className="text-gray-400 max-w-xs mb-4">In a production environment, this would be an embedded Cal.com or HubSpot meeting widget.</p>
                                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-semibold transition-colors">
                                                Simulate Calendar Load
                                            </button>
                                        </div>

                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                <FAQ />
            </main>

            <Footer />
        </div>
    );
}
