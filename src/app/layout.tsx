import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansDevanagari = Noto_Sans_Devanagari({ 
  subsets: ["devanagari"],
  variable: "--font-noto-sans-devanagari",
});

export const metadata: Metadata = {
  title: "Divyansh Jyotish - Vedic Astrology",
  description: "Discover your destiny with ancient Vedic astrology. Get personalized birth chart readings and predictions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne" className="dark">
      <body className={`${inter.variable} ${notoSansDevanagari.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}