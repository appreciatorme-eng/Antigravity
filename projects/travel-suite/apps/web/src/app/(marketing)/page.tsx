"use client";

import dynamic from "next/dynamic";
import { CustomerLogos } from "@/components/marketing/CustomerLogos";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Testimonials } from "@/components/marketing/Testimonials";
import { InteractiveDemo } from "@/components/marketing/InteractiveDemo";
import { LeadMagnetSection } from "@/components/marketing/LeadMagnetSection";
import { BeforeAfterSection } from "@/components/marketing/sections/BeforeAfterSection";
import { ProposalPreviewSection } from "@/components/marketing/sections/ProposalPreviewSection";
import { FinalCTASection } from "@/components/marketing/sections/FinalCTASection";
import { SwipeCardStack } from "@/components/marketing/sections/SwipeCardStack";
import { SectionDivider, AnimatedFlightPath } from "@/components/marketing/effects";

// GSAP-dependent sections must be dynamically imported (no SSR)
const HeroSection = dynamic(
  () =>
    import("@/components/marketing/sections/HeroSection").then(
      (m) => m.HeroSection
    ),
  { ssr: false }
);

const FeaturesShowcase = dynamic(
  () =>
    import("@/components/marketing/sections/FeaturesShowcase").then(
      (m) => m.FeaturesShowcase
    ),
  { ssr: false }
);

const LivePulseSection = dynamic(
  () =>
    import("@/components/marketing/sections/LivePulseSection").then(
      (m) => m.LivePulseSection
    ),
  { ssr: false }
);
const ForceFieldBackground = dynamic(
  () =>
    import("@/components/marketing/ForceFieldBackground").then(
      (m) => m.ForceFieldBackground
    ),
  { ssr: false }
);

export default function HomePage() {
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <ForceFieldBackground id="tsparticles-global" />
      </div>
      <AnimatedFlightPath />
      <main className="relative z-10 min-h-[300vh] bg-transparent text-white overflow-hidden">
        <HeroSection />
        <SectionDivider variant="wave" />
      <CustomerLogos />
      <HowItWorks />
      <BeforeAfterSection />
      <FeaturesShowcase />
      <SectionDivider variant="curve" />
      <ProposalPreviewSection />
      <LivePulseSection />
      <InteractiveDemo />
      <SwipeCardStack />
      <Testimonials />
      <LeadMagnetSection />
      <SectionDivider variant="wave" flip />
      <FinalCTASection />
    </main>
    </>
  );
}
