// Marketing layout — dark theme shell for public-facing pages.
// Scoped under .marketing-theme to isolate from SaaS design system.
// This is a Server Component — client-side chrome is in MarketingChrome.

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/app/marketing-globals.css";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import {
  OrganizationSchema,
  WebsiteSchema,
} from "@/components/marketing/seo/JsonLd";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripbuilt.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | TripBuilt",
    default: "TripBuilt | Build Your Travel Empire",
  },
  description: "Create instant packages, share stunning white label itineraries, and get them closed ASAP. The ultimate operating system for modern travel professionals.",
  keywords: [
    "tour operator software",
    "travel agency CRM",
    "travel proposal builder",
    "WhatsApp automation travel",
    "travel business management",
    "Indian tour operator",
    "TripBuilt",
  ],
  openGraph: {
    siteName: "TripBuilt",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/api/og?title=TripBuilt&subtitle=Build%20Your%20Travel%20Empire",
        width: 1200,
        height: 630,
        alt: "TripBuilt — Build Your Travel Empire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripBuilt | Build Your Travel Empire",
    description:
      "The all-in-one OS for modern Indian tour operators.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`marketing-theme ${inter.variable} ${outfit.variable} font-sans min-h-screen`}
    >
      <OrganizationSchema url={BASE_URL} />
      <WebsiteSchema url={BASE_URL} />
      <MarketingChrome />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
