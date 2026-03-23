import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import "@/styles/print.css";
import AppProviders from "@/components/providers/AppProviders";
import AppShell from "@/components/layout/AppShell";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { getLocaleDirection } from "@/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TripBuilt | Premium Tour Operator Suite",
  description: "Enterprise-grade AI-Powered Travel Planning and Operations Management",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TripBuilt",
  },
  openGraph: {
    title: "TripBuilt | Premium Tour Operator Suite",
    description: "AI-Powered Travel Planning and Operations Management for Tour Operators",
    type: "website",
    siteName: "TripBuilt",
    url: "https://tripbuilt.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripBuilt | Premium Tour Operator Suite",
    description: "AI-Powered Travel Planning and Operations Management for Tour Operators",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from next-intl request config (no [locale] route segment needed)
  const locale = await getLocale();
  const messages = await getMessages();

  // Get text direction for locale (supports RTL languages like Arabic, Urdu)
  const direction = getLocaleDirection(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('theme' in localStorage && localStorage.theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TripBuilt" />
        <link rel="apple-touch-icon" href="/icons/pwa-192.png" />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased font-sans bg-white dark:bg-[#0a1628] text-slate-900 dark:text-slate-100`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-sm focus:text-gray-900"
        >
          Skip to main content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <Suspense fallback={null}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </AppProviders>
          <ServiceWorkerRegistrar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
