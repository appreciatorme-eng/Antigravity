import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "TripBuilt | Build Your Travel Empire",
  description:
    "Create instant packages, share stunning white-label itineraries, and close clients faster. The ultimate operating system for modern Indian tour operators.",
  openGraph: {
    title: "TripBuilt | Build Your Travel Empire",
    description:
      "The all-in-one OS for modern Indian tour operators. Create proposals, automate WhatsApp, and grow your travel business.",
    images: [
      {
        url: "/marketing/dashboard_ui_mockup_1773059467134.png",
        width: 1200,
        height: 630,
        alt: "TripBuilt — Build Your Travel Empire",
      },
    ],
  },
};

// GSAP-dependent sections — dynamic imports allow server rendering of the page shell
const HeroSection = dynamic(
  () =>
    import("@/components/marketing/sections/HeroSection").then(
      (m) => m.HeroSection
    ),
);

const FeaturesShowcase = dynamic(
  () =>
    import("@/components/marketing/sections/FeaturesShowcase").then(
      (m) => m.FeaturesShowcase
    ),
);

const LivePulseSection = dynamic(
  () =>
    import("@/components/marketing/sections/LivePulseSection").then(
      (m) => m.LivePulseSection
    ),
);
const ForceFieldBackground = dynamic(
  () =>
    import("@/components/marketing/ForceFieldBackground").then(
      (m) => m.ForceFieldBackground
    ),
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
