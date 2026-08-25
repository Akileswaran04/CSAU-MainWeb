import type { Metadata } from "next";
import { Geist_Mono, Outfit, Syne } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
