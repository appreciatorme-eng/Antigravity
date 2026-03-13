// Marketing layout — dark theme shell for public-facing pages.
// Scoped under .marketing-theme to isolate from SaaS design system.
// This is a Server Component — client-side chrome is in MarketingChrome.

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/app/marketing-globals.css";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Travel Suite",
    default: "Travel Suite | The Tour Operator OS",
  },
  description:
    "Run Your Travel Empire. From One Screen. The all-in-one operating system for modern Indian tour operators.",
  openGraph: {
    siteName: "Travel Suite",
    type: "website",
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
      <MarketingChrome />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
