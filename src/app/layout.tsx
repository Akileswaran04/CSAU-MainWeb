import type { Metadata } from "next";
import { Geist_Mono, Outfit, Syne } from "next/font/google";
import "./globals.css";
import SoundToggle from "@/components/SoundToggle";
import CustomCursor from "@/components/CustomCursor";
import SmoothScroll from "@/components/SmoothScroll";

/* Award-site typography: Syne (avant-garde display) + Outfit (geometric body).
   Legacy CSS var names are kept as aliases so existing components pick them up. */
const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSAU | The Digital Realm",
  description:
    "Computer Society of Anna University — Building the future of technology, one line of code at a time.",
  keywords: [
    "CSAU",
    "Computer Society",
    "Anna University",
    "CEG",
    "Technology",
    "AI",
    "Web Development",
  ],
  openGraph: {
    title: "CSAU | The Digital Realm",
    description:
      "Computer Society of Anna University — Building the future of technology.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#090714] text-[#F4F0E8]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:px-4 focus:py-2 focus:bg-cyan/20 focus:text-cyan focus:rounded"
        >
          Skip navigation
        </a>
        <SmoothScroll />
        {children}
        <SoundToggle />
        <CustomCursor />
      </body>
    </html>
  );
}
