'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import clsx from 'clsx';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   SCROLL TEAM GRID — ProofOfWork-style scroll-in animation.

   Cards rotate in from ±50° with a Y-offset and fade to full
   opacity as the user scrolls them into view. Adapts column
   count and animation offsets for desktop vs mobile.
   ============================================================ */

export interface ScrollTeamGridItem {
  initials: string;
  name: string;
  role: string;
  domain: string;
  color?: 'cyan' | 'magenta';
  social?: { github?: string; linkedin?: string; twitter?: string };
}

interface ScrollTeamGridProps {
  items: ScrollTeamGridItem[];
  /** Number of columns on desktop */
  columns?: 2 | 3 | 4;
  /** Label shown above the grid (e.g. "PRESIDENTS") */
  sectionLabel?: string;
  className?: string;
  /** Card size variant */
  size?: 'large' | 'medium' | 'small';
}

const statusColors: Record<string, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-neon-green', label: 'ONLINE', text: 'text-neon-green' },
  busy: { dot: 'bg-neon-red', label: 'IN SESSION', text: 'text-neon-red' },
  away: { dot: 'bg-neon-yellow', label: 'AFK', text: 'text-neon-yellow' },
};

function TeamCard({
  member,
  size,
  status,
}: {
  member: ScrollTeamGridItem;
  size: 'large' | 'medium' | 'small';
  status: 'online' | 'busy' | 'away';
}) {
  const isCyan = member.color === 'cyan';
  const borderClass = isCyan ? 'border-cyan/20 hover:border-cyan/40' : 'border-magenta/20 hover:border-magenta/40';
  const avatarBg = isCyan ? 'bg-cyan/10 text-cyan' : 'bg-magenta/10 text-magenta';
  const avatarBorder = isCyan ? 'border-cyan/30' : 'border-magenta/30';
  const st = statusColors[status];

  const sizeClasses = {
    large: 'p-6',
    medium: 'p-4',
    small: 'p-3',
  };
  const avatarSizes = {
    large: 'w-16 h-16 text-lg',
    medium: 'w-12 h-12 text-sm',
    small: 'w-10 h-10 text-xs',
  };
  const nameSizes = {
    large: 'text-base',
    medium: 'text-sm',
    small: 'text-xs',
  };

  return (
    <div
      className={clsx(
        'group relative holo-card rounded-lg border overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.08)]',
        borderClass,
      )}
    >
      {/* Monitor top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-foreground/3 border-b border-foreground/5">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          <span className={`text-[8px] tracking-widest ${st.text} font-[family-name:var(--font-geist-mono)]`}>
            {st.label}
          </span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/15" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/15" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/15" />
        </div>
      </div>

      {/* Monitor content */}
      <div className={clsx('relative monitor-scanline', sizeClasses[size])}>
        {/* Avatar + Info */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={clsx(
              'rounded border-2 flex items-center justify-center font-bold font-[family-name:var(--font-space-grotesk)] transition-all duration-300 group-hover:scale-105',
              avatarBorder,
              avatarBg,
              avatarSizes[size],
            )}
          >
            {member.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={clsx(
                'font-semibold font-[family-name:var(--font-space-grotesk)] text-foreground/90 group-hover:text-cyan transition-colors truncate',
                nameSizes[size],
              )}
            >
              {member.name}
            </h3>
            <p className="text-[10px] text-foreground/40">{member.role}</p>
          </div>
        </div>

        {/* Domain badge */}
        <div className="mb-3">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/40 border border-foreground/8 font-[family-name:var(--font-geist-mono)]">
            {member.domain}
          </span>
        </div>

        {/* Social links */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {member.social?.github && (
            <a href={member.social.github} className="text-foreground/30 hover:text-cyan transition-colors p-1" aria-label="GitHub">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
          {member.social?.linkedin && (
            <a href={member.social.linkedin} className="text-foreground/30 hover:text-cyan transition-colors p-1" aria-label="LinkedIn">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
          {member.social?.twitter && (
            <a href={member.social.twitter} className="text-foreground/30 hover:text-cyan transition-colors p-1" aria-label="Twitter">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Monitor bottom edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/15 to-transparent" />
    </div>
  );
}

export default function ScrollTeamGrid({
  items,
  columns = 3,
  sectionLabel,
  className,
  size = 'medium',
}: ScrollTeamGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length === 0) return;

    const yOffset = isDesktop ? 400 : 300;
    const startTrigger = isDesktop ? 'top 100%' : 'top 120%';

    const triggers: ScrollTrigger[] = [];

    cards.forEach((cardEl, index) => {
      if (!cardEl) return;

      // Alternate rotation direction like ProofOfWork
      const rotation = index % 2 === 0 ? -40 : 40;

      gsap.set(cardEl, {
        rotation,
        transformOrigin: 'center center',
        y: yOffset,
        opacity: 0,
      });

      const st = ScrollTrigger.create({
        trigger: cardEl,
        start: startTrigger,
        onEnter: () => {
          gsap.to(cardEl, {
            rotation: 0,
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.inOut',
            // Slight delay for even-indexed cards like ProofOfWork
            delay: isDesktop && index % 2 === 1 ? 0.2 : 0,
          });
        },
      });
      triggers.push(st);
    });

    return () => triggers.forEach((t) => t.kill());
  }, [items, isDesktop]);

  const colClasses = {
    2: 'md:w-[calc(50%-1rem)]',
    3: 'md:w-[calc(33.333%-1rem)]',
    4: 'md:w-[calc(25%-0.75rem)]',
  };

  return (
    <div ref={containerRef} className={clsx('w-full', className)}>
      {sectionLabel && (
        <p className="text-[10px] tracking-[0.3em] uppercase text-neon-green/60 font-[family-name:var(--font-geist-mono)] mb-4">
          {sectionLabel}
        </p>
      )}
      <div className="flex flex-wrap gap-6 md:gap-8">
        {items.map((member, index) => (
          <div
            key={member.name}
            ref={(el) => { cardRefs.current[index] = el; }}
            className={clsx(
              'w-full',
              colClasses[columns],
            )}
          >
            <div className="mt-8 md:mt-12">
              <TeamCard member={member} size={size} status="online" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
