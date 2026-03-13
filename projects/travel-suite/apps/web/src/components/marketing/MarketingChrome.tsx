"use client";

// Client-side marketing chrome — scroll progress, popups, chat, lead capture.
// Must be a Client Component because it uses next/dynamic with { ssr: false }.
// Imported by the (marketing)/layout.tsx Server Component.

import dynamic from "next/dynamic";

const ScrollProgress = dynamic(
  () => import("./ScrollProgress").then((m) => m.ScrollProgress),
  { ssr: false }
);
const StickyMobileCTA = dynamic(
  () => import("./StickyMobileCTA").then((m) => m.StickyMobileCTA),
  { ssr: false }
);
const ExitIntentPopup = dynamic(
  () => import("./ExitIntentPopup").then((m) => m.ExitIntentPopup),
  { ssr: false }
);
const LiveChat = dynamic(
  () => import("./LiveChat").then((m) => m.LiveChat),
  { ssr: false }
);
const LeadMagnet = dynamic(
  () => import("./LeadMagnet").then((m) => m.LeadMagnet),
  { ssr: false }
);

export function MarketingChrome() {
  return (
    <>
      <ScrollProgress />
      <StickyMobileCTA />
      <ExitIntentPopup />
      <LiveChat />
      <LeadMagnet />
    </>
  );
}
