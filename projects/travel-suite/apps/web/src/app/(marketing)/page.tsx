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

export default function HomePage() {
  return (
    <main className="relative z-10 min-h-[300vh] bg-transparent text-white overflow-hidden">
      <HeroSection />
      <CustomerLogos />
      <HowItWorks />
      <BeforeAfterSection />
      <FeaturesShowcase />
      <ProposalPreviewSection />
      <LivePulseSection />
      <InteractiveDemo />
      <Testimonials />
      <LeadMagnetSection />
      <FinalCTASection />
    </main>
  );
}
