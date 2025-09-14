import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({ 
  subsets: ["devanagari"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Divyansh Jyotish - वैदिक ज्योतिष",
  description: "Vedic Astrology Platform - वैदिक ज्योतिष प्लेटफर्म",
  keywords: ["vedic astrology", "ज्योतिष", "horoscope", "kundli", "dasha", "yoga"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne" className={`${inter.variable} ${notoSansDevanagari.variable}`}>
      <body className="font-vedic antialiased bg-vedic-light text-vedic-dark">
        {children}
      </body>
    </html>
  );
}