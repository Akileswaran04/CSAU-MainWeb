import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono } from "next/font/google";
import LaserNav from "@/components/LaserNav";
import SpaceBackdrop from "@/components/SpaceBackdrop";
import RouteLoadGate from "@/components/RouteLoadGate";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "CSAU // CEG - Computer Society of Anna University",
  description:
    "Computer Society of Anna University, CEG - Build. Break. Ship.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        {/* The star field every page floats on (fixed, behind all content). */}
        <SpaceBackdrop />
        {/* Laser navigation - a floating button opens the fullscreen
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
