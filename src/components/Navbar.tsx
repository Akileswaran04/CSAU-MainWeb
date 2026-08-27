"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import clsx from "clsx";

const navLinks = [
  { label: "The Gateway", href: "#gate" },
  { label: "The Core", href: "#origin" },
  { label: "Training Grounds", href: "#domains" },
  { label: "Data Vault", href: "#archive" },
  { label: "Command Center", href: "#people" },
  { label: "The Portal", href: "#portal" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const linksContainerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animate navbar slide-in
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -100 },
        { y: 0, duration: 0.6, ease: "power2.out", delay: 0.3 }
      );
    }
  }, []);

  // Mobile overlay animation
  useEffect(() => {
    if (!mobileRef.current || !linksContainerRef.current) return;

    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.fromTo(
        mobileRef.current,
        { opacity: 0, x: "100%" },
        { opacity: 1, x: "0%", duration: 0.3, ease: "power2.inOut" }
      );

      const linkEls = linksContainerRef.current.querySelectorAll("a");
      tl.fromTo(
        linkEls,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
        },
        "-=0.15"
      );
    } else {
      document.body.style.overflow = "";
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      gsap.set(mobileRef.current, { opacity: 0, x: "100%" });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        ref={navRef}
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
            <span
              className={clsx(
                "block w-6 h-0.5 bg-cyan transition-transform duration-300 origin-center",
                mobileOpen && "rotate-45 translate-y-[7px]"
              )}
            />
            <span
              className={clsx(
                "block w-6 h-0.5 bg-cyan transition-opacity duration-300",
                mobileOpen && "opacity-0"
              )}
            />
            <span
              className={clsx(
                "block w-6 h-0.5 bg-cyan transition-transform duration-300 origin-center",
                mobileOpen && "-rotate-45 -translate-y-[7px]"
              )}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          className="fixed inset-0 z-40 bg-[#090714]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
        >
          <div ref={linksContainerRef} className="flex flex-col items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-[family-name:var(--font-space-grotesk)] text-foreground/80 hover:text-cyan transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#portal"
              onClick={() => setMobileOpen(false)}
              className="mt-4 px-8 py-3 border border-cyan rounded text-cyan font-medium hover:bg-cyan/10 transition-all"
            >
              ENTER
            </a>
          </div>
        </div>
      )}
    </>
  );
}
