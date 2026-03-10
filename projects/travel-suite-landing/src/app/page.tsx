"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SplineScene } from "@/components/SplineScene";
import { CardSwap, Card } from "@/components/CardSwap";
import ShinyText from "@/components/ShinyText";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import dynamic from "next/dynamic";
const ForceFieldBackground = dynamic(
  () => import("@/components/ForceFieldBackground").then(m => m.ForceFieldBackground),
  { ssr: false }
);
import { ArrowRight, Plane, MessageCircle, FileText, CreditCard, ShoppingBag, Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isSplineReady, setIsSplineReady] = useState(false);
  
  // Parallax effects
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Handle Spline Load to Customize Text and Imagery Dynamically
  const onSplineLoad = (splineApp: any) => {
    // 1. Brutally hide unwanted 3D texts or logos in the scene
    const targetsToHide = [
      'PROJECT NAME', 'PROMO', 'your logo+text', 
      'P', 'E', 'A', 'R', 'L', 'PEARL'
    ];
    targetsToHide.forEach(name => {
      const obj = splineApp.findObjectByName(name);
      // Try to clear text if it's a text node
      if (obj && typeof obj.text !== 'undefined') {
        obj.text = '';
      } 
      // Force it to be hidden from the renderer entirely
      if (obj) {
        obj.visible = false;
      }
    });

    // 2. Texture Overrides to our shiny new Travel Suite interfaces
    const mockups = [
      '/dashboard_ui_mockup_1773059467134.png',
      '/booking_ui_mockup_1773059498138.png',
      '/crm_ui_mockup_1773059519930.png',
      '/itinerary_ui_mockup_1773062264651.png',
      '/analytics_ui_mockup_1773062281103.png',
      '/invoicing_ui_mockup_1773062297390.png'
    ];

    setTimeout(async () => {
      const texturePromises: Promise<void>[] = [];
      
      // Loop over the 6 panels in the promo scene ("1700x950 1", "1700x950 2", etc)
      for (let i = 1; i <= 6; i++) {
        const panelName = `1700x950 ${i}`;
        const panel = splineApp.findObjectByName(panelName);
        if (panel) {
          try {
            if (panel.material && panel.material.layers) {
              panel.material.layers.forEach((layer: any) => {
                if (layer.type === 'texture' || layer.type === 'matcap') {
                   const fullUrl = window.location.origin + mockups[i - 1];
                   texturePromises.push(layer.updateTexture(fullUrl));
                }
              });
            } else {
               console.log("No material found on", panelName);
            }
          } catch (err) {
             console.log(`Could not inject mockup into ${panelName}`, err);
          }
        } else {
           console.log(`Could not find Spline object: ${panelName}`);
        }
      }
      
      try {
        await Promise.all(texturePromises);
      } catch (err) {
        console.error("Some textures failed to map, continuing anyway", err);
      }
      
      // Fade in the Spline scene now that our mockups are in place
      setIsSplineReady(true);
      
    }, 1000); // let spline initial payload mount fully
  };

  useEffect(() => {
    // Elegant reveal animations with GSAP
    gsap.utils.toArray('.reveal-text').forEach((text: any) => {
      gsap.from(text, {
        scrollTrigger: {
          trigger: text,
          start: "top 80%",
          toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
    });
  }, []);

  return (
    <>
      <Navbar />
      {/* GLOBAL FIXED BACKGROUND: Force Field perfectly integrated across all sections */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ForceFieldBackground id="tsparticles-global" />
      </div>

      <main ref={containerRef} className="relative z-10 min-h-[300vh] bg-transparent text-white overflow-hidden">
        
        {/* 🎬 Scene 1: The Hero - "The Desk of Tomorrow" */}
        <section className="relative h-screen flex items-center justify-between px-10 md:px-24 overflow-hidden pt-20 transform-gpu isolate">
        
        {/* Particles — TOP LEFT: sits behind the heading & button text */}
        <div 
          className="absolute top-0 left-0 z-[15] pointer-events-none overflow-hidden"
          style={{ 
            width: '45%',
            height: '60%',
            maskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
          }}
        >
          <ForceFieldBackground id="tsparticles-hero-top" particleCount={180} />
        </div>

        {/* Particles — BOTTOM LEFT: fills the empty space below the button */}
        <div 
          className="absolute bottom-0 left-0 z-[15] pointer-events-none overflow-hidden"
          style={{ 
            width: '50%',
            height: '45%',
            maskImage: 'linear-gradient(to right, black 70%, transparent 100%), linear-gradient(to top, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
            maskComposite: 'intersect',
          }}
        >
          <ForceFieldBackground id="tsparticles-hero-bottom" particleCount={140} />
        </div>

        {/* 3D Spline Layer — mix-blend-lighten makes black bg transparent, bright screens stay visible */}
        <div className="absolute inset-0 z-[10] pointer-events-none">
          <motion.div 
            style={{ y: yParallax }} 
            className={`w-full h-[120%] -top-20 relative z-10 pointer-events-auto transition-opacity duration-[1500ms] ease-in-out ${isSplineReady ? 'opacity-90' : 'opacity-0'}`}
          >
            <SplineScene 
              sceneUrl="https://prod.spline.design/FOAdqNVCO1g5ncBd/scene.splinecode" 
              onLoad={onSplineLoad}
            />
          </motion.div>

          {/* Subtle gradients to frame the hero content smoothly */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 via-[rgba(10,10,10,0.4)] to-transparent z-[11] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A0A0A] to-transparent z-[11] pointer-events-none" />
        </div>


        <div className="relative z-20 max-w-3xl space-y-8 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-[#00F0FF]/30 text-[#00F0FF] text-sm font-semibold tracking-wide uppercase">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F0FF]"></span>
              </span>
              <ShinyText text="Travel Suite OS is Live" speed={3} color="#00F0FF" shineColor="#ffffff" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-tight text-glow-aqua">
              Run Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#FFD699]">
                Travel Empire.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl"
          >
            No more messy PDFs. No more lost WhatsApp chats. The all-in-one operating system for modern Indian tour operators.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-6 pointer-events-auto"
          >
            <button className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out bg-[#FF9933] rounded-full hover:bg-[#FFB366] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,153,51,0.6)]">
              <ShinyText text="Experience the Magic" speed={2.5} color="#ffffff" shineColor="#FFEBCC" />
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 🎬 Stories / Features using Glassmorphism */}
      <section className="relative z-30 bg-transparent py-32 px-10 md:px-24 mt-20">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* Feature 1: The Magic Link */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 reveal-text">
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#00F0FF]">
                <FileText size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">The Magic Link <span className="text-[#00F0FF]">Proposals</span></h2>
              <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                Making itineraries used to take hours of typing into Word. 
                Now, create beautiful, interactive web-link proposals in minutes. 
                Clients view photos, day-by-day plans, and accept instantly on their phones.
              </p>
            </div>
            <div className="relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#00F0FF]/10 to-transparent group" style={{ perspective: '1000px' }}>
              
              {/* Main Phone Mockup */}
              <div 
                className="relative w-[260px] h-[520px] bg-black rounded-[40px] border-[8px] border-white/10 shadow-2xl overflow-hidden transition-all duration-700 ease-out group-hover:[transform:rotateY(-12deg)_rotateX(6deg)_scale(1.05)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                 {/* Internal screen */}
                 <div className="absolute inset-0 bg-[#0A0A0A] overflow-hidden flex flex-col">
                    {/* Header Image */}
                    <div className="relative h-56 w-full shrink-0">
                       <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop" alt="Bali" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent"></div>
                       <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex justify-between items-end">
                            <div>
                               <h3 className="text-xl font-bold text-white leading-tight">7 Days in<br/>Bali</h3>
                               <p className="text-xs text-[#00F0FF] mt-1 tracking-wider uppercase">Proposal #4092</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-gray-400">Total</p>
                               <p className="text-lg font-bold text-white">₹1.2L</p>
                            </div>
                          </div>
                       </div>
                    </div>
                    
                    {/* Itinerary points */}
                    <div className="p-4 space-y-4 flex-1">
                       <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-gray-400">01</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-200">Arrival & Checking</p>
                            <p className="text-[10px] text-gray-500">Private Airport Transfer</p>
                          </div>
                       </div>
                       <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-[#00F0FF]/10 flex items-center justify-center shrink-0 border border-[#00F0FF]/30 text-xs font-bold text-[#00F0FF]">02</div>
                          <div>
                            <p className="text-sm font-semibold text-white">Ubud Temple Tour</p>
                            <p className="text-[10px] text-[#00F0FF]/80">Full day guided experience</p>
                          </div>
                       </div>
                       <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-xs font-bold text-gray-400">03</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-200">Nusa Penida Drift</p>
                            <p className="text-[10px] text-gray-500">Ferry & Snorkeling</p>
                          </div>
                       </div>
                    </div>
                    
                    {/* Accept button (sticky bottom flex-end) */}
                    <div className="p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent shrink-0">
                       <button className="w-full py-3 bg-[#00F0FF] rounded-xl text-black font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] transition-transform">
                         Accept & Pay
                       </button>
                    </div>
                 </div>
              </div>
              
              {/* Floating Notification */}
              <motion.div 
                initial={{ opacity: 0, y: 20, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: 5 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute top-1/4 -right-6 md:right-4 z-10 glass-card px-4 py-3 rounded-2xl border-white/20 shadow-2xl flex items-center gap-3 transform hover:scale-105 transition-transform cursor-default"
              >
                  <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                     <Check size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Status</p>
                    <p className="text-sm font-bold text-white">Client Accepted!</p>
                  </div>
              </motion.div>

              {/* Floating Payment Notification */}
              <motion.div 
                initial={{ opacity: 0, y: -20, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: -3 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute bottom-1/4 -left-6 md:left-4 z-10 glass-card px-4 py-3 rounded-2xl border-white/20 shadow-2xl flex items-center gap-3 transform hover:scale-105 transition-transform cursor-default"
              >
                  <div className="w-10 h-10 rounded-full bg-[#FF9933]/20 flex items-center justify-center text-[#FF9933]">
                     <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Payment</p>
                    <p className="text-sm font-bold text-white">₹50k Deposit Paid</p>
                  </div>
              </motion.div>

            </div>
          </div>

          {/* Feature 2: WhatsApp Engine */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative h-[500px] w-full glass-card rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FF9933]/10 to-transparent">
               {/* Decorative WhatsApp Style Bubbles */}
               <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8 }}
                 className="absolute top-1/4 left-1/4 glass px-6 py-4 rounded-3xl rounded-tl-sm max-w-[200px]"
               >
                 <p className="text-sm font-medium">Hi Rohan, your driver is confirmed for tomorrow! 🚙</p>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, delay: 0.3 }}
                 className="absolute bottom-1/3 right-1/4 glass bg-[#FF9933]/20 border-[#FF9933]/30 px-6 py-4 rounded-3xl rounded-br-sm max-w-[200px]"
               >
                 <p className="text-sm font-medium">Payment of ₹50,000 received. Thank you! 🎉</p>
               </motion.div>
            </div>
            <div className="order-1 md:order-2 space-y-6 reveal-text">
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#FF9933]">
                <MessageCircle size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">The Automated <span className="text-[#FF9933]">WhatsApp Engine</span></h2>
              <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                Clients calling at 11 PM for their driver's number? Our engine speaks to them where they are. 
                Automated updates sent straight to their WhatsApp—no manual typing required.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Feature 3: The Upsell Marketplace */}
      <section className="relative z-30 bg-transparent py-16 px-10 md:px-24">
        <div className="max-w-7xl mx-auto space-y-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 reveal-text">
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-[#ff99d6]">
                <ShoppingBag size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">The One-Click <span className="text-[#ff99d6]">Add-ons</span></h2>
              <p className="text-xl text-gray-400 font-light leading-relaxed tracking-wide">
                Leaving revenue on the table because you forget to upsell? 
                Give clients the choice to add extras right inside their proposal. 
                With our elegant marketplace, they click, you earn.
              </p>
            </div>
            <div className="relative h-[500px] w-full flex items-center justify-center -ml-10">
              <CardSwap
                width={320}
                height={420}
                cardDistance={50}
                verticalDistance={40}
                delay={2000}
                pauseOnHover={true}
                skewAmount={6}
              >
                {[
                  {
                    title: "Airport Transfer",
                    price: "₹2,500",
                    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop"
                  },
                  {
                    title: "Candlelight Dinner",
                    price: "₹8,000",
                    image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop"
                  },
                  {
                    title: "Spa Package",
                    price: "₹12,000",
                    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"
                  }
                ].map((addon, i) => (
                  <Card key={i} className="p-0 overflow-hidden group border-white/10">
                    <div className="relative h-full w-full flex flex-col">
                      <div className="flex-1 overflow-hidden">
                        <img 
                          src={addon.image} 
                          alt={addon.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                        <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
                          {addon.price}
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white/90">{addon.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed max-w-[90%]">
                          Click to add this elegant upgrade directly to the itinerary.
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>
      </section>



      {/* Climax / CTA */}
      <section className="relative z-30 py-40 bg-transparent text-center px-10 border-t border-white/10 mt-20">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF9933]/50 to-transparent"></div>
        <div className="max-w-4xl mx-auto space-y-10 reveal-text">
          <Plane className="w-20 h-20 text-[#00F0FF] mx-auto opacity-80" />
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            Stop managing on <br />10 different apps.
          </h2>
          <p className="text-2xl text-gray-400 font-light">
            Bring your proposals, WhatsApp chats, drivers, and payments into one beautiful screen. Join the top tour operators in India today.
          </p>
          <button className="group mt-8 px-12 py-5 text-xl font-bold text-[#0A0A0A] bg-white rounded-full hover:bg-gray-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]">
            <ShinyText 
              text="Book an Exclusive Demo" 
              speed={2} 
              color="#0A0A0A" 
              shineColor="#888888" 
              pauseOnHover={true} 
            />
          </button>
        </div>
      </section>
      
    </main>
    <Footer />
    </>
  );
}
