import type { Metadata } from "next";
import { Cormorant_Garamond, Poppins } from "next/font/google";
import "./globals.css";
import NavHeader from "@/components/layout/NavHeader";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "700"], // Regular (400) and Bold (700) matching mobile
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Regular, Medium, Semibold, Bold
});

export const metadata: Metadata = {
  title: "GoBuddy Adventures",
  description: "AI-Powered Travel Planning by GoBuddy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${poppins.variable} antialiased font-sans`}
      >
        <NavHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
