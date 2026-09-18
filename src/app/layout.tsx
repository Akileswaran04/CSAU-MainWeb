import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Syne, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import LaserNav from "@/components/LaserNav";
import PondBackdrop from "@/components/PondBackdrop";
import RouteLoadGate from "@/components/RouteLoadGate";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CSAU // CEG — Computer Society of Anna University",
  description:
    "Computer Society of Anna University, CEG — Build. Break. Ship.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {/* The pond every page floats on (fixed, behind all content). */}
        <PondBackdrop />
        {/* Laser navigation — a floating button opens the fullscreen
            Matrix Junction laser overlay with the site links. */}
        <LaserNav />
        {/* RouteLoadGate shows the loading sequence when travelling
            between pages via the nav bar or marked CTAs, and staggers
            the destination page's elements in as it clears. */}
        <RouteLoadGate>{children}</RouteLoadGate>
      </body>
    </html>
  );
}
