/* ============================================================
   ASTRONAUT SCENE - a soft, grainy illustration for waiting screens

   Two little astronauts walk on the limb of a moon while a
   satellite drifts past and a shooting star crosses. Flat greys and
   a fine film grain (an SVG noise filter), not chunky pixels. The
   moon turns under their feet, so they seem to walk. Pure SVG + CSS,
   no canvas; all motion stops under reduced motion.
   ============================================================ */

const STARS: [number, number, number, number][] = [
  [90, 70, 1.4, 0], [180, 150, 1, 1.2], [300, 60, 1.2, 2.1], [420, 120, 1, 0.6], [520, 40, 1.6, 1.7],
  [610, 140, 1, 2.6], [700, 80, 1.3, 0.3], [760, 200, 1, 1.9], [60, 230, 1.1, 2.4], [350, 220, 1, 0.9],
  [470, 250, 1.2, 1.4], [640, 260, 1, 0.1], [240, 30, 1, 2.8], [560, 200, 1, 1.1], [130, 310, 1, 0.5],
];

function Astronaut({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="as-bob" style={{ animationDelay: `${delay}s` }}>
        {/* legs */}
        <g className="as-leg" style={{ animationDelay: `${delay}s` }}>
          <rect x="-14" y="26" width="15" height="34" rx="7.5" fill="url(#as-white)" />
        </g>
        <g className="as-leg back" style={{ animationDelay: `${delay}s` }}>
          <rect x="4" y="26" width="15" height="34" rx="7.5" fill="url(#as-white)" />
        </g>
        {/* pack and body */}
        <rect x="-38" y="-8" width="20" height="38" rx="9" fill="url(#as-grey)" />
        <ellipse cx="0" cy="8" rx="27" ry="30" fill="url(#as-white)" />
        <ellipse cx="6" cy="22" rx="10" ry="7" fill="#c9ccd1" opacity=".55" />
        {/* arm */}
        <rect x="6" y="6" width="26" height="12" rx="6" fill="url(#as-white)" transform="rotate(24 6 12)" />
        {/* helmet */}
        <circle cx="4" cy="-34" r="34" fill="url(#as-white)" />
        <circle cx="-26" cy="-30" r="8" fill="url(#as-grey)" />
        <ellipse cx="14" cy="-32" rx="24" ry="22" fill="#050506" />
        <ellipse cx="6" cy="-40" rx="9" ry="5" fill="#ffffff" opacity=".22" transform="rotate(-24 6 -40)" />
        <path d="M16 -36 v10 M11 -31 h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" className="as-glint" />
      </g>
    </g>
  );
}

export default function AstronautScene({ className = "" }: { className?: string }) {
  return (
    <div className={`as-root ${className}`} aria-hidden>
      <style>{`
        .as-root { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .as-root svg { width: 100%; height: 100%; display: block; }
        .as-turn { transform-origin: 470px 1080px; animation: as-turn 90s linear infinite; }
        @keyframes as-turn { to { transform: rotate(-360deg); } }
        .as-bob { animation: as-bob 1.1s ease-in-out infinite; }
        @keyframes as-bob { 50% { transform: translateY(-5px); } }
        .as-leg { transform-box: fill-box; transform-origin: 50% 0; animation: as-step 1.1s ease-in-out infinite; }
        .as-leg.back { animation-direction: reverse; }
        @keyframes as-step { 0%,100% { transform: rotate(-16deg); } 50% { transform: rotate(16deg); } }
        .as-glint { animation: as-tw 3s ease-in-out infinite; }
        .as-star { animation: as-tw 3.4s ease-in-out infinite; }
        @keyframes as-tw { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
        .as-sat { animation: as-drift 34s linear infinite; }
        @keyframes as-drift { from { transform: translate(-160px, 40px) rotate(-14deg); } to { transform: translate(980px, -40px) rotate(20deg); } }
        .as-shoot { animation: as-shoot 7s ease-in infinite; opacity: 0; }
        @keyframes as-shoot { 0% { transform: translate(60px, -30px); opacity: 0; } 4% { opacity: 1; } 16% { transform: translate(-190px, 120px); opacity: 0; } 100% { transform: translate(-190px, 120px); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .as-turn, .as-bob, .as-leg, .as-glint, .as-star, .as-sat, .as-shoot { animation: none; }
          .as-sat { transform: translate(560px, 0) rotate(8deg); }
        }
      `}</style>
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          {/* fine film grain over everything drawn inside, in greys */}
          <filter id="as-grain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="g" />
            <feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="1.9" k2="0.25" k3="0" k4="-0.12" result="c" />
            <feComposite in="c" in2="SourceGraphic" operator="in" />
          </filter>
          <radialGradient id="as-white" cx="0.32" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#e9ebee" />
            <stop offset="1" stopColor="#8c9097" />
          </radialGradient>
          <radialGradient id="as-grey" cx="0.3" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#d4d7db" />
            <stop offset="1" stopColor="#6d7178" />
          </radialGradient>
          <radialGradient id="as-moon" cx="0.5" cy="0" r="0.75" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#4a4d53" />
            <stop offset="0.5" stopColor="#25272b" />
            <stop offset="1" stopColor="#0c0d0f" />
          </radialGradient>
          <clipPath id="as-moonclip"><circle cx="470" cy="1080" r="640" /></clipPath>
        </defs>

        {/* stars */}
        {STARS.map(([x, y, r, d], i) => (
          <circle key={i} className="as-star" cx={x} cy={y} r={r} fill="#f6f1e4" style={{ animationDelay: `${d}s` }} />
        ))}

        {/* shooting star */}
        <g className="as-shoot">
          <line x1="300" y1="200" x2="230" y2="250" stroke="#f6f1e4" strokeWidth="2.2" strokeLinecap="round" opacity=".9" />
          <line x1="300" y1="200" x2="360" y2="158" stroke="#f6f1e4" strokeWidth="1" strokeLinecap="round" opacity=".35" />
        </g>

        <g filter="url(#as-grain)">
          {/* satellite, dim and far */}
          <g className="as-sat" opacity=".55">
            <g transform="translate(0 150)">
              <rect x="-70" y="-10" width="44" height="20" fill="url(#as-grey)" transform="skewX(-14)" />
              <rect x="26" y="-10" width="44" height="20" fill="url(#as-grey)" transform="skewX(-14)" />
              <ellipse cx="0" cy="0" rx="26" ry="20" fill="url(#as-grey)" />
              <circle cx="8" cy="3" r="8" fill="#0a0a0b" />
            </g>
          </g>

          {/* the moon, turning under the walkers */}
          <circle cx="470" cy="1080" r="640" fill="url(#as-moon)" />
          <g clipPath="url(#as-moonclip)">
            <g className="as-turn">
              {[
                [470, 470, 30], [380, 500, 20], [560, 486, 24], [620, 520, 14], [300, 540, 26], [470, 560, 40], [690, 600, 22],
                [220, 620, 18], [410, 640, 16], [560, 650, 30],
              ].map(([cx, cy, r], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r * 0.6} fill="#101113" opacity=".85" />
                  <path d={`M ${cx - r * 0.6} ${cy} A ${r * 0.6} ${r * 0.6} 0 0 1 ${cx + r * 0.6} ${cy}`} stroke="#5b5f66" strokeWidth="2" fill="none" opacity=".7" />
                </g>
              ))}
            </g>
          </g>

          {/* walkers */}
          <Astronaut x={430} y={396} s={0.62} delay={-0.4} />
          <Astronaut x={340} y={430} s={0.42} delay={0} />
        </g>
      </svg>
    </div>
  );
}
