import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Syne, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import LaserNav from "@/components/LaserNav";
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
        {/* Laser navigation — a floating button opens the fullscreen
            Matrix Junction laser overlay with the site links. */}
        <LaserNav />
        {children}
      </body>
    </html>
  );
}
