"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useEntered } from "@/hooks/useEntered";

const navLinks = [
  { label: "The Gate", href: "#gate" },
  { label: "The Origin", href: "#origin" },
  { label: "The Domains", href: "#domains" },
  { label: "The Archive", href: "#archive" },
  { label: "The Journey", href: "#journey" },
  { label: "The People", href: "#people" },
  { label: "The Portal", href: "#portal" },
];

export default function Navbar() {
  const ready = useEntered();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={ready ? { y: 0 } : false}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "py-3 glass border-b border-cyan/10"
            : "py-5 bg-transparent"
        )}
      >
        <div className="w-full px-5 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <a href="#gate" className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold tracking-wider text-cyan glow-cyan font-[family-name:var(--font-space-grotesk)]">
              CSAU
            </span>
            <span className="text-[10px] sm:text-xs tracking-widest text-foreground/50 uppercase">
              The Digital Realm
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="neon-underline px-3 py-2 text-sm text-foreground/70 hover:text-cyan transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Button (Desktop) */}
          <a
            href="#portal"
            className="hidden lg:inline-flex items-center gap-2 px-5 py-2 border border-cyan/50 rounded text-cyan text-sm font-medium hover:bg-cyan/10 transition-all duration-300 animate-pulse-cyan"
          >
            ENTER
          </a>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-cyan"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-6 h-0.5 bg-cyan"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-cyan"
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-[#090714]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-[family-name:var(--font-space-grotesk)] text-foreground/80 hover:text-cyan transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="#portal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navLinks.length * 0.05 }}
              onClick={() => setMobileOpen(false)}
              className="mt-4 px-8 py-3 border border-cyan rounded text-cyan font-medium hover:bg-cyan/10 transition-all"
            >
              ENTER
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
