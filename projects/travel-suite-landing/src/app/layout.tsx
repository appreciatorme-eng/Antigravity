import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Suite | The Tour Operator OS",
  description: "Run Your Travel Empire. From One Screen. The all-in-one operating system for modern Indian tour operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-[#0A0A0A] text-white selection:bg-[#00F0FF]/30 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
