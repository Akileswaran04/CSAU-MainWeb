import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Zen_Dots, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const zenDots = Zen_Dots({
  variable: "--font-zen-dots",
  subsets: ["latin"],
  weight: "400",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CSAU // CEG — Computer Science Association",
  description:
    "Computer Science Association of the University, CEG — Build. Break. Ship.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${zenDots.variable} ${rajdhani.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
