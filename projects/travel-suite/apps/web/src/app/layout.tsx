import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Poppins, Inter } from "next/font/google";
import "./globals.css";
import "@/styles/print.css";
import NavHeader from "@/components/layout/NavHeader";
import AppProviders from "@/components/providers/AppProviders";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "700"], // Regular (400) and Bold (700) matching mobile
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Regular, Medium, Semibold, Bold, ExtraBold
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoBuddy Adventures",
  description: "AI-Powered Travel Planning by GoBuddy",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoBuddy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${poppins.variable} ${inter.variable} antialiased font-sans`}
      >
        <AppProviders>
          <Suspense fallback={null}>
            <NavHeader />
          </Suspense>
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
