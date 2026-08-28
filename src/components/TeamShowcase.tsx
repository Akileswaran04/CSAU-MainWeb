"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================
   TEAM SHOWCASE — Scroll-driven pair showcase inspired by
   csau-team-showcase-v2.html, themed with cursor-character.html.
   
   Shows team members in pairs inside a mobile device frame.
   GSAP ScrollTrigger drives the scroll-based animation.
   ============================================================ */

interface Member {
  name: string;
  role: string;
  image?: string;
}

const teamData: Record<string, Member[]> = {
  presidents: [
    { name: "Mohamed Yassine Cherif", role: "President", image: "/images/presidents/mohamed-yassine-cherif.png" },
    { name: "Yassine Joundi", role: "Vice President", image: "/images/presidents/yassine-joundi.png" },
  ],
  heads: [
    { name: "Azer Bhiri", role: "Head of Organization & Communication", image: "/images/heads/Azer Bhiri.png" },
    { name: "Raghd Gharbi", role: "Head of Cybersecurity", image: "/images/heads/Raghd Gharbi.png" },
    { name: "Ahmed Tlili", role: "Head of Development", image: "/images/heads/Ahmed Tlili.png" },
    { name: "Ghaya Guembri", role: "Head of AI", image: "/images/heads/Ghaya Guembri.png" },
    { name: "Youssef Ben Salem", role: "Head of Cloud & Infra", image: "/images/heads/Youssef Ben Salem.png" },
    { name: "Mouhib Bouajila", role: "Head of Finance", image: "/images/heads/Mouhib Bouajila.png" },
  ],
  deputies: [
    { name: "Nour Hadded", role: "Deputy Head of Organization & Communication", image: "/images/deputyheads/Nour Hadded.png" },
    { name: "Ahmed Amine Mallouli", role: "Deputy Head of Cybersecurity", image: "/images/deputyheads/Ahmed Amine Mallouli.png" },
    { name: "Rim Ouerghemi", role: "Deputy Head of Organization & Communication", image: "/images/deputyheads/Rim Ouerghemi.png" },
    { name: "Mohamed Amin Bouazizi", role: "Deputy Head of Development", image: "/images/deputyheads/Mohamed Amin Bouazizi.png" },
    { name: "Abdelbasset Bouagina", role: "Deputy Head of Finance", image: "/images/deputyheads/Abdelbasset Bouagina.png" },
    { name: "Ahlem Kallel", role: "Deputy Head of AI", image: "/images/deputyheads/Ahlem Kallel.png" },
    { name: "Ahmed Tlili", role: "Deputy Head of Development", image: "/images/deputyheads/Ahmed Tlili.png" },
    { name: "Oussema Ben Fraj", role: "Deputy Head of Development", image: "/images/deputyheads/Oussema Ben Fraj.png" },
    { name: "Rahma Bounaaja", role: "Deputy Head of AI", image: "/images/deputyheads/Rahma Bounaaja.png" },
    { name: "Rim Khiari", role: "Deputy Head of Cybersecurity", image: "/images/deputyheads/Rim Khiari.png" },
    { name: "Youssef Ben Othman", role: "Deputy Head of AI", image: "/images/deputyheads/Youssef Ben Othman.png" },
  ],
};

function PairFigure({ member, diffTag }: { member: Member; diffTag: string }) {
  const initials = member.name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="relative flex flex-col items-center" style={{ width: "38%", maxWidth: 150 }}>
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover"
            style={{
              maskImage: "radial-gradient(circle at 50% 38%,black 48%,transparent 82%)",
              WebkitMaskImage: "radial-gradient(circle at 50% 38%,black 48%,transparent 82%)",
              filter: "drop-shadow(0 14px 22px rgba(0,0,0,.55))",
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(0,240,255,.15),rgba(255,0,170,.1))" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(0,240,255,.1)", border: "1px solid rgba(0,240,255,.3)" }}>
              <span className="text-xl font-bold" style={{ fontFamily: "'Syne',sans-serif", color: "var(--cyan)" }}>{initials}</span>
            </div>
          </div>
        )}
        <div className="absolute top-[2%] left-[2%] w-[19px] h-[19px] rounded-[5px] flex items-center justify-center text-[10px] font-bold" style={{ fontFamily: "'Geist Mono',monospace", background: "rgba(0,240,255,.18)", color: "var(--cyan)", border: "1px solid rgba(0,240,255,.4)", backdropFilter: "blur(6px)", zIndex: 5 }}>
          {diffTag}
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="uppercase leading-tight" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13.5, color: "#F5F6F8" }}>{member.name}</div>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 8.5, marginTop: 2 }}>
          <span style={{ color: "#6B7280" }}>role:</span>{" "}
          <span style={{ color: "var(--cyan)" }}>{member.role.toLowerCase().replace(/\s+/g, "-")}</span>
        </div>
      </div>
    </div>
  );
}

export default function TeamShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pairRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activePair, setActivePair] = useState(0);

  const pairs = useMemo(() => {
    const all = [...teamData.presidents, ...teamData.heads, ...teamData.deputies];
    const result: [Member, Member?][] = [];
    for (let i = 0; i < all.length; i += 2) {
      result.push([all[i], all[i + 1]]);
    }
    return result;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pairEls = pairRefs.current.filter(Boolean);
    if (pairEls.length < 2) return;

    // Set initial states
    gsap.set(pairEls[0], { scale: 1, opacity: 1, filter: "grayscale(0%) blur(0px)" });
    for (let i = 1; i < pairEls.length; i++) {
      gsap.set(pairEls[i], { scale: 0.72, opacity: 0, filter: "grayscale(100%) blur(0px)" });
    }

    const totalPairs = pairEls.length;
    const pairDuration = 1 / (totalPairs - 1 || 1);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate(self) {
          const idx = Math.min(Math.floor(self.progress / pairDuration), totalPairs - 2);
          setActivePair(idx);
        },
      },
    });

    // For each pair transition
    for (let i = 0; i < totalPairs - 1; i++) {
      const hold = i * pairDuration;
      // Current pair recedes
      tl.to(pairEls[i], {
        scale: 0.5,
        opacity: 0.4,
        filter: "grayscale(100%) blur(1.5px)",
        ease: "power2.inOut",
      }, hold);
      // Next pair rises
      tl.to(pairEls[i + 1], {
        scale: 1,
        opacity: 1,
        filter: "grayscale(0%) blur(0px)",
        ease: "power2.inOut",
      }, hold);
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      tl.kill();
    };
  }, [pairs]);

  return (
    <section className="relative" aria-label="Command Center — Team Showcase">
      <style>{`
        .ts-backdrop-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(232,236,241,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,236,241,.035) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(circle at 50% 40%, black 0%, transparent 72%);
        }
        .ts-stage { position: relative; z-index: 1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 28px 16px; }
        .ts-device {
          position: relative; width: 100%; max-width: 412px; border-radius: 34px; padding: 10px;
          background: linear-gradient(160deg,#181D26,#0B0E13);
          box-shadow: 0 0 0 1px rgba(232,236,241,.06), 0 40px 80px -20px rgba(0,0,0,.7), 0 0 60px -10px rgba(63,185,80,.06);
        }
        .ts-device::before {
          content:""; position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
          width: 84px; height: 8px; border-radius: 99px; background: #05070A; z-index: 60;
        }
        .ts-pin { height: ${pairs.length * 120}vh; position: relative; }
        .ts-viewport {
          position: sticky; top: 14px; width: 100%; aspect-ratio: 9/19.5; max-height: 88vh;
          overflow: hidden; border-radius: 26px;
          background: radial-gradient(120% 90% at 50% 0%,#121721 0%,#0A0D12 55%,#070910 100%);
        }
        .ts-gutter {
          position: absolute; left: 0; top: 0; bottom: 0; width: 26px;
          border-right: 1px solid rgba(232,236,241,.06);
          font-family: 'Geist Mono',monospace; font-size: 9px; color: rgba(107,114,128,.5);
          display: flex; flex-direction: column; align-items: center; padding-top: 64px; gap: 22px; z-index: 5;
          user-select: none;
        }
        .ts-topbar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 50; padding: 20px 20px 14px 32px;
          display: flex; justify-content: space-between; align-items: flex-start;
          background: linear-gradient(180deg, rgba(10,13,18,.92) 12%, transparent 100%);
        }
        .ts-wordmark { font-family: 'Syne',sans-serif; font-weight: 800; font-size: 17px; letter-spacing: -.02em; color: #E8ECF1; line-height: 1; }
        .ts-breadcrumb { font-family: 'Geist Mono',monospace; font-size: 9.5px; letter-spacing: .04em; color: #6B7280; }
        .ts-breadcrumb b { color: #E8ECF1; font-weight: 600; }
        .ts-diffstat { font-family: 'Geist Mono',monospace; font-size: 10px; font-weight: 500; display: flex; gap: 6px; margin-top: 6px; }
        .ts-diffstat .plus { color: #3FB950; } .ts-diffstat .minus { color: #F85149; }
        .ts-pair {
          position: absolute; left: 0; right: 0; z-index: 10;
          display: flex; justify-content: center; align-items: flex-end; gap: 6%;
          padding-left: 26px; padding-bottom: 14%;
          will-change: transform, opacity, filter;
        }
        .ts-bottombar {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 50; padding: 16px 20px 20px 32px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: linear-gradient(0deg, rgba(10,13,18,.92) 12%, transparent 100%);
        }
        .ts-dots { display: flex; gap: 6px; }
        .ts-dot { width: 5px; height: 5px; border-radius: 99px; background: rgba(232,236,241,.18); transition: all .25s; }
        .ts-dot.on { background: #3FB950; width: 16px; border-radius: 99px; }
        .ts-caret { display: inline-block; width: 6px; height: 12px; background: #3FB950; animation: tsBlink 1.1s steps(1) infinite; }
        @keyframes tsBlink { 50%{opacity:0} }
        .ts-scroll-hint { font-family: 'Geist Mono',monospace; font-size: 9.5px; color: #6B7280; display: flex; align-items: center; gap: 6px; }
        @media (prefers-reduced-motion: reduce) { .ts-caret { animation: none; } }
      `}</style>

      <div className="ts-backdrop-grid" />

      <div className="ts-stage">
        <div className="ts-device">
          <div className="ts-pin" ref={containerRef}>
            <div className="ts-viewport">
              {/* Constellation background */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.5, zIndex: 1 }}>
                <g stroke="var(--cyan)" strokeWidth="0.6" opacity="0.35">
                  <line x1="40" y1="120" x2="140" y2="180" /><line x1="140" y1="180" x2="110" y2="280" />
                  <line x1="140" y1="180" x2="260" y2="140" /><line x1="260" y1="140" x2="340" y2="220" />
                  <line x1="110" y1="280" x2="200" y2="340" /><line x1="200" y1="340" x2="320" y2="360" />
                  <line x1="60" y1="520" x2="160" y2="480" /><line x1="160" y1="480" x2="260" y2="560" />
                  <line x1="260" y1="560" x2="340" y2="500" />
                </g>
                <g fill="#E8ECF1" opacity="0.4">
                  <circle cx="40" cy="120" r="1.6" /><circle cx="140" cy="180" r="1.6" />
                  <circle cx="110" cy="280" r="1.6" /><circle cx="260" cy="140" r="1.6" />
                  <circle cx="340" cy="220" r="1.6" /><circle cx="200" cy="340" r="1.6" />
                  <circle cx="320" cy="360" r="1.6" /><circle cx="60" cy="520" r="1.6" />
                  <circle cx="160" cy="480" r="1.6" /><circle cx="260" cy="560" r="1.6" />
                </g>
              </svg>

              {/* Gutter */}
              <div className="ts-gutter">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i}>{String(i + 1).padStart(2, "0")}</span>
                ))}
              </div>

              {/* Top bar */}
              <div className="ts-topbar">
                <div>
                  <div className="ts-wordmark">CSAU</div>
                  <div className="ts-breadcrumb">web-app-dev / <b>team.tsx</b></div>
                </div>
                <div className="ts-diffstat"><span className="plus">+{pairs.length}</span><span className="minus">−0</span></div>
              </div>

              {/* Pairs */}
              {pairs.map((pair, i) => (
                <div
                  key={i}
                  ref={(el) => { pairRefs.current[i] = el; }}
                  className="ts-pair"
                  style={{ bottom: "14%" }}
                >
                  <PairFigure member={pair[0]} diffTag="+" />
                  {pair[1] && <PairFigure member={pair[1]} diffTag="+" />}
                </div>
              ))}

              {/* Bottom bar */}
              <div className="ts-bottombar">
                <div className="ts-dots">
                  {pairs.map((_, i) => (
                    <div key={i} className={`ts-dot${i === activePair ? " on" : ""}`} />
                  ))}
                </div>
                <div className="ts-scroll-hint">
                  <span>git log --follow</span>
                  <span className="ts-caret" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 max-w-[412px] mx-auto mt-4 mb-16 px-1 text-center" style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#4B5563", letterSpacing: ".02em" }}>
        scroll to advance the roster · two at a time
      </p>
    </section>
  );
}
