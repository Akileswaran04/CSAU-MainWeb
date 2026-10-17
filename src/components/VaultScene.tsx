/* ============================================================
   VAULT SCENE - the jump between pages (LoadingOverlay), after the
   owner's reference (2026-10-15): a dark ship corridor facing a
   round vault door, and the door opens as the next page loads.

     0%   INITIALIZING        the door shut
     20%  UNLOCKING VAULT     the ring's lights come on, one by one
     40%  OPENING SEQUENCE    the four panels part, the core glows
     60%  ROTATING PANELS     the panels turn and draw back
     80%  CLEARING PATH       the panels are gone: a lit tunnel
     100% VAULT OPEN          the tunnel clears onto Earth and the sun
     then READY (a tick) and the view pushes in through the door.

   The entrance: out of black the corridor powers up, its lights
   stuttering on, while the view glides in and jolts as they catch;
   the door ring flares, a scan sweeps the door, then the readout
   rises. The vault opening flashes through the door with a ring
   of light thrown out from it.

   Flat SVG and CSS, no 3D. The corridor is one still drawing; what
   moves is a few layers that only change transform or opacity, so
   the compositor plays it and the main thread is left to the page
   that is loading. Reduced motion: no transitions, no spin.
   ============================================================ */

const VP = { x: 800, y: 400 }; // where the corridor converges (the door's centre)
/* the back wall round the door, an octagon; the ribs are the same octagon nearer the eye */
const BACK: [number, number][] = [[520, 90], [1080, 90], [1230, 240], [1230, 600], [1100, 720], [500, 720], [370, 600], [370, 240]];
const at = ([x, y]: [number, number], k: number): [number, number] => [VP.x + (x - VP.x) * k, VP.y + (y - VP.y) * k];
const poly = (k: number) => BACK.map((v) => at(v, k).map((n) => n.toFixed(1)).join(",")).join(" ");
const B1 = poly(1).split(" ");
const RIBS = [1, 1.28, 1.62, 2.08, 2.7];
/* a point on the octagon's side `i` (from vertex i to i+1), `t` along it, at depth `k` */
const onSide = (i: number, t: number, k: number) => {
  const a = BACK[i];
  const b = BACK[(i + 1) % BACK.length];
  return at([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], k);
};
const quad = (i: number, t0: number, t1: number, k0: number, k1: number) =>
  [onSide(i, t0, k0), onSide(i, t1, k0), onSide(i, t1, k1), onSide(i, t0, k1)].map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");

/* the ring's lights: 12 arcs, lit one by one while it unlocks */
const SEGS = 12;
const arc = (r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(Math.cos((a * Math.PI) / 180) * r).toFixed(2)} ${(Math.sin((a * Math.PI) / 180) * r).toFixed(2)}`;
  return `M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}`;
};
/* lit from the sides first, like the reference: left and right, then up and down */
const ORDER = [0, 6, 1, 7, 11, 5, 2, 8, 10, 4, 3, 9];

const STAGES: [number, string][] = [[0.2, "Initializing..."], [0.4, "Unlocking vault..."], [0.6, "Opening sequence..."], [0.8, "Rotating panels..."], [1, "Clearing path..."]];
const clamp = (v: number) => Math.max(0, Math.min(1, v));

export default function VaultScene({ progress, ending }: { progress: number; ending: boolean }) {
  const p = ending ? 1 : clamp(progress);
  const label = ending ? "Ready" : p >= 1 ? "Vault open" : STAGES.find(([to]) => p < to)![1];
  const lit = Math.round(clamp((p - 0.08) / 0.3) * SEGS);
  /* the panels: shut, parted, turned and drawn back, then gone past the rim */
  const [d, rot] = p < 0.4 ? [0, 0] : p < 0.6 ? [5, 0] : p < 0.8 ? [16, 38] : [80, 38];
  const core = p >= 0.4 && p < 0.8;
  const rings = p < 0.8 ? 1 : 1 + (p - 0.8) * 7;
  const open = p >= 0.82; // mounts the flash and the ring of light once, as the door clears

  return (
    <div className="vd-root" aria-hidden data-ending={ending || undefined}>
      <style>{`
        .vd-root { position: absolute; inset: 0; overflow: hidden; pointer-events: none; background: #040507; --D: min(56vh, 86vw);
          --blue: #7cc4ff; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
        .vd-stage { position: absolute; left: 50%; top: 50%; width: max(100vw, 177.78vh); height: max(100vh, 56.25vw); translate: -50% -50%;
          transform-origin: 50% 44.44%; transition: transform 1.4s cubic-bezier(.5,0,.2,1); }
        .vd-root[data-ending] .vd-stage { transform: scale(1.32); }
        .vd-hall { position: absolute; inset: 0; width: 100%; height: 100%; }
        .vd-door { position: absolute; left: 50%; top: 44.44%; width: var(--D); aspect-ratio: 1; translate: -50% -50%; }
        .vd-door > * { position: absolute; }
        .vd-bulk { inset: -24%; width: 148%; height: 148%; }
        .vd-hole { inset: 8%; border-radius: 50%; overflow: hidden; background: radial-gradient(circle at 50% 45%, #0b1626, #02040a 70%); }
        .vd-hole > * { position: absolute; }
        .vd-sky { inset: 0; background-size: 120px 120px; opacity: .9;
          background-image: radial-gradient(1px 1px at 14px 22px, #fff, transparent), radial-gradient(1px 1px at 70px 64px, #cfe3ff, transparent),
            radial-gradient(1.4px 1.4px at 98px 16px, #fff, transparent), radial-gradient(1px 1px at 40px 96px, #fff, transparent), radial-gradient(1px 1px at 104px 100px, #9ec7ff, transparent); }
        .vd-earth { left: -70%; width: 240%; top: 64%; aspect-ratio: 1; border-radius: 50%;
          background: radial-gradient(circle at 50% 0%, #a9d2ff 0, #4f86c6 1.2%, #23507f 3.5%, #10294a 9%, #060d1a 22%);
          box-shadow: 0 -4px 18px rgba(140,195,255,.7), 0 -18px 60px rgba(90,150,240,.35); transition: opacity .9s ease; }
        .vd-sun { left: 62%; top: 12%; width: 22%; aspect-ratio: 1; border-radius: 50%; translate: -50% -50%;
          background: radial-gradient(circle, #fff 0 9%, rgba(255,226,180,.85) 16%, rgba(255,190,120,.25) 34%, transparent 66%); transition: opacity .9s ease; }
        .vd-sun::after { content: ""; position: absolute; left: -60%; right: -60%; top: 50%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,236,210,.8), transparent); }
        .vd-shut, .vd-walk, .vd-tube, .vd-blades, .vd-blade, .vd-hub { inset: 0; width: 100%; height: 100%; }
        .vd-tube { transition: transform 1s cubic-bezier(.5,0,.3,1), opacity .8s ease; will-change: transform; }
        .vd-blade { position: absolute; transition: transform .85s cubic-bezier(.6,0,.2,1); will-change: transform; }
        .vd-hub { transition: opacity .5s ease; }
        .vd-shut { background: #0b0e12; transition: opacity .4s ease; } /* behind the shut panels, so their seams show dark */
        .vd-core { transition: opacity .5s ease; }
        .vd-frame { inset: 0; width: 100%; height: 100%; }
        .vd-seg { opacity: .12; transition: opacity .35s ease; }
        .vd-seg[data-on] { opacity: 1; }

        .vd-hud { position: absolute; left: 50%; bottom: max(5.5vh, 26px); translate: -50% 0; display: flex; flex-direction: column; align-items: center;
          gap: 7px; color: #dcecff; padding: 14px 60px 12px; background: radial-gradient(closest-side, rgba(4,8,14,.8), rgba(4,8,14,.55) 60%, transparent); }
        .vd-row { display: flex; align-items: center; gap: 14px; font-size: clamp(18px, 2.1vw, 24px); font-weight: 300; letter-spacing: .04em;
          font-variant-numeric: tabular-nums; min-width: 9ch; justify-content: center; }
        .vd-spin { width: 22px; height: 22px; animation: vd-spin 1.1s linear infinite; }
        .vd-tick { width: 26px; height: 26px; }
        @keyframes vd-spin { to { transform: rotate(360deg); } }
        .vd-bar { width: clamp(150px, 16vw, 230px); height: 3px; border-radius: 2px; background: rgba(124,196,255,.16); overflow: hidden; }
        .vd-bar i { display: block; height: 100%; background: var(--blue); box-shadow: 0 0 8px var(--blue); transform-origin: left; transition: transform .35s ease; }
        .vd-label { white-space: nowrap; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #9fb6cf; }

        /* the entrance */
        .vd-cam { position: absolute; inset: 0; transform-origin: 50% 44.44%; animation: vd-dolly 1.8s cubic-bezier(.16,.8,.2,1) both; }
        @keyframes vd-dolly {
          0% { transform: scale(.76) rotate(-3deg); }
          52% { transform: scale(1.02) rotate(.3deg); }
          58% { transform: translate3d(4px, -3px, 0) scale(1.012); }
          64% { transform: translate3d(-3px, 2px, 0) scale(1.006); }
          70% { transform: translate3d(1px, -1px, 0) scale(1.002); }
          100% { transform: none; }
        }
        .vd-black { position: absolute; inset: 0; background: #000; animation: vd-power 1.5s linear both; }
        @keyframes vd-power { 0%, 26% { opacity: 1; } 30% { opacity: .3; } 34% { opacity: .92; } 40% { opacity: .12; } 45% { opacity: .65; } 58%, 100% { opacity: 0; } }
        .vd-ignite { inset: -9%; border-radius: 50%; opacity: 0;
          background: radial-gradient(circle, transparent 50%, rgba(124,196,255,.6) 56%, rgba(191,227,255,.9) 57.5%, rgba(124,196,255,.4) 60%, transparent 70%);
          animation: vd-ignite 1.1s .75s ease-out both; }
        @keyframes vd-ignite { 0% { opacity: 0; transform: scale(.92); } 25% { opacity: 1; } 100% { opacity: 0; transform: scale(1.12); } }
        .vd-scan { inset: -6% -16%; opacity: 0; will-change: transform;
          background: linear-gradient(180deg, transparent 45%, rgba(159,214,255,.18) 48.5%, rgba(220,240,255,.9) 50%, rgba(159,214,255,.18) 51.5%, transparent 55%);
          animation: vd-scan 1s 1.05s cubic-bezier(.45,0,.55,1) both; }
        @keyframes vd-scan { 0% { opacity: 0; transform: translate3d(0, -50%, 0); } 15%, 80% { opacity: 1; } 100% { opacity: 0; transform: translate3d(0, 50%, 0); } }
        .vd-hud { animation: vd-rise .8s 1.1s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes vd-rise { from { opacity: 0; transform: translate3d(0, 18px, 0); } }
        /* the vault opening: a flash through the door, a ring of light thrown out */
        .vd-burst { inset: 0; opacity: 0; background: radial-gradient(circle, #fff 0, rgba(200,232,255,.9) 18%, rgba(124,196,255,.35) 45%, transparent 70%);
          animation: vd-burst 1.2s ease-out both; }
        @keyframes vd-burst { 0% { opacity: 0; transform: scale(.3); } 18% { opacity: .95; } 100% { opacity: 0; transform: scale(1.5); } }
        .vd-wave { inset: 6%; border-radius: 50%; border: 2px solid rgba(191,227,255,.85); box-shadow: 0 0 24px rgba(124,196,255,.6); opacity: 0;
          animation: vd-wave 1.1s .1s cubic-bezier(.2,.7,.3,1) both; }
        @keyframes vd-wave { 0% { opacity: 0; transform: scale(.95); } 15% { opacity: 1; } 100% { opacity: 0; transform: scale(2.1); } }

        @media (prefers-reduced-motion: reduce) {
          .vd-cam, .vd-hud { animation: none; }
          .vd-black, .vd-ignite, .vd-scan, .vd-burst, .vd-wave { display: none; }
          .vd-stage, .vd-tube, .vd-blade, .vd-hub, .vd-shut, .vd-core, .vd-seg, .vd-earth, .vd-sun, .vd-bar i { transition: none; }
          .vd-spin { animation: none; }
        }
      `}</style>

      <div className="vd-cam">
        <div className="vd-stage">
          <Hall />
          <div className="vd-door">
            <Bulkhead />
            <div className="vd-hole">
              <div className="vd-sky" />
              <div className="vd-sun" style={{ opacity: clamp((p - 0.84) * 6) }} />
              <div className="vd-earth" style={{ opacity: clamp((p - 0.82) * 6) }} />
              <Walkway />
              <div className="vd-tube" style={{ transform: `scale(${rings})`, opacity: p < 0.9 ? 1 : 0.15 }}>
                <Tunnel />
              </div>
              <div className="vd-shut" style={{ opacity: p < 0.4 ? 1 : 0 }} />
              <div className="vd-blades">
                {[0, 1, 2, 3].map((k) => {
                  const a = ((45 + 90 * k) * Math.PI) / 180;
                  return (
                    <div key={k} className="vd-blade" style={{ transform: `rotate(${rot}deg) translate(${(Math.cos(a) * d).toFixed(2)}%, ${(Math.sin(a) * d).toFixed(2)}%)` }}>
                      <Blade k={k} glow={p >= 0.4} />
                    </div>
                  );
                })}
              </div>
              <div className="vd-hub" style={{ opacity: p < 0.8 ? 1 : 0 }}>
                <Hub core={core} />
              </div>
              {open && <div className="vd-burst" />}
            </div>
            <svg className="vd-frame" viewBox="-50 -50 100 100">
              <circle r="46.4" fill="none" stroke="url(#vd-metal)" strokeWidth="7.2" />
              <circle r="42.6" fill="none" stroke="#2b333e" strokeWidth=".7" />
              <circle r="49.7" fill="none" stroke="#2a313b" strokeWidth=".5" />
              {Array.from({ length: 16 }, (_, i) => (
                <rect key={i} x="-.7" y="-49.6" width="1.4" height="2.4" rx=".3" fill="#1d232b" transform={`rotate(${i * 22.5 + 11.25})`} />
              ))}
              {Array.from({ length: SEGS }, (_, i) => {
                const a0 = i * 30 - 180 + 4 - 15;
                const path = arc(44.4, a0, a0 + 22);
                return (
                  <g key={i} className="vd-seg" data-on={ORDER.indexOf(i) < lit || undefined}>
                    <path d={path} fill="none" stroke="#7cc4ff" strokeOpacity=".22" strokeWidth="3.2" strokeLinecap="round" />
                    <path d={path} fill="none" stroke="#bfe3ff" strokeWidth=".9" strokeLinecap="round" />
                  </g>
                );
              })}
            </svg>
            <div className="vd-ignite" />
            <div className="vd-scan" />
            {open && <div className="vd-wave" />}
          </div>
        </div>
      </div>
      <div className="vd-black" />

      <div className="vd-hud">
        <div className="vd-row">
          {ending ? (
            <svg className="vd-tick" viewBox="0 0 26 26">
              <circle cx="13" cy="13" r="11.5" fill="none" stroke="#7cc4ff" strokeWidth="1.5" />
              <path d="M8 13.5l3.4 3.4L18.2 9.6" fill="none" stroke="#dcecff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <>
              <svg className="vd-spin" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="8.5" fill="none" stroke="rgba(124,196,255,.22)" strokeWidth="2.4" />
                <path d={`M11 2.5A8.5 8.5 0 0 1 19.5 11`} fill="none" stroke="#7cc4ff" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <span>{Math.round(p * 100)}%</span>
            </>
          )}
        </div>
        <span className="vd-bar">
          <i style={{ transform: `scaleX(${p})` }} />
        </span>
        <span className="vd-label">{label}</span>
      </div>
    </div>
  );
}

/* the corridor: ribs closing in on the door, windows on the stars either side, consoles low down, small amber lights */
function Hall() {
  return (
    <svg className="vd-hall" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="vd-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0f15" />
          <stop offset=".55" stopColor="#07090d" />
          <stop offset="1" stopColor="#040507" />
        </linearGradient>
        <radialGradient id="vd-amber">
          <stop offset="0" stopColor="#ffb466" stopOpacity=".55" />
          <stop offset="1" stopColor="#ff8a3c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vd-win" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e3b62" />
          <stop offset=".6" stopColor="#0b1830" />
          <stop offset="1" stopColor="#050a14" />
        </linearGradient>
        <linearGradient id="vd-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c6aa8" />
          <stop offset="1" stopColor="#0d2442" />
        </linearGradient>
        <linearGradient id="vd-plate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f252e" />
          <stop offset=".5" stopColor="#13171d" />
          <stop offset="1" stopColor="#0c0f13" />
        </linearGradient>
        <linearGradient id="vd-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262d37" />
          <stop offset=".5" stopColor="#11151b" />
          <stop offset="1" stopColor="#1b2029" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#vd-bg)" />
      {/* faces: ceiling lighter, floor darkest (vd-plate and vd-metal are also the door panels and ring) */}
      <polygon points={`0,0 1600,0 ${B1[1]} ${B1[0]}`} fill="#0d1218" />
      <polygon points={`0,900 1600,900 ${B1[4]} ${B1[5]}`} fill="#06080b" />
      <polygon points={poly(1)} fill="#090c11" />
      {/* the ribs, near ones thicker; and the seams running back along the corners */}
      {RIBS.slice(1).map((k) => (
        <g key={k}>
          <polygon points={poly(k)} fill="none" stroke="#151a22" strokeWidth={k * 9} strokeLinejoin="round" />
          <polygon points={poly(k)} fill="none" stroke="#252c37" strokeWidth={k * 1.1} strokeLinejoin="round" transform={`translate(0 ${-k * 3.5})`} />
        </g>
      ))}
      {BACK.map((v, i) => {
        const a = at(v, 1);
        const b = at(v, 3.2);
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#1a2029" strokeWidth="2.5" />;
      })}
      {/* floor plates leading to the door */}
      {[-0.32, -0.16, 0, 0.16, 0.32].map((t) => {
        const a = onSide(4, 0.5 + t, 1);
        const b = onSide(4, 0.5 + t * 1.4, 3.2);
        return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#10141a" strokeWidth="2" />;
      })}

      <g id="vd-side">
        {/* windows on the side wall between the ribs */}
        <polygon points={quad(6, 0.18, 0.72, 1.7, 2.02)} fill="url(#vd-win)" stroke="#2a323d" strokeWidth="9" strokeLinejoin="round" />
        {[[0.3, 1.8], [0.5, 1.92], [0.62, 1.76], [0.4, 1.98]].map(([t, k], i) => {
          const [x, y] = onSide(6, t, k);
          return <circle key={i} cx={x} cy={y} r={1.6} fill="#e6f0ff" />;
        })}
        <polygon points={quad(6, 0.24, 0.66, 1.33, 1.55)} fill="url(#vd-win)" stroke="#262d37" strokeWidth="6" strokeLinejoin="round" opacity=".85" />
        {/* amber lights on the ribs */}
        {[[7, 0.5, 1.28], [7, 0.5, 1.62], [6, 0.08, 2.08], [5, 0.5, 1.62], [7, 0.85, 2.08], [5, 0.3, 2.7], [0, 0.12, 1.62]].map(([s, t, k], i) => {
          const [x, y] = onSide(s, t, k);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={16 * k} fill="url(#vd-amber)" />
              <rect x={x - 5 * k} y={y - 1.4 * k} width={10 * k} height={2.8 * k} rx={1.4 * k} fill="#ffc27a" />
            </g>
          );
        })}
        {/* the console: a slanted desk of screens and lights */}
        <polygon points="0,668 318,640 410,724 0,812" fill="#0e1218" stroke="#1d242e" strokeWidth="3" />
        <polygon points="0,812 410,724 412,770 0,900" fill="#080a0e" />
        {[[34, 704, 74], [126, 690, 70], [214, 678, 64], [292, 668, 52]].map(([x, y, w], i) => (
          <g key={i} transform={`translate(${x} ${y}) skewY(-6)`}>
            <rect width={w} height={w * 0.52} rx="3" fill="url(#vd-screen)" opacity=".9" />
            <path d={`M6 ${w * 0.36}h${w * 0.3}M6 ${w * 0.22}h${w * 0.55}`} stroke="#7cc4ff" strokeWidth="1.6" opacity=".7" />
          </g>
        ))}
        {[[40, 772, "#ff9b4a"], [70, 766, "#7cc4ff"], [150, 752, "#ff9b4a"], [250, 738, "#7cc4ff"], [330, 726, "#ff9b4a"]].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r="3" fill={c as string} />
        ))}
      </g>
      <use href="#vd-side" transform="translate(1600 0) scale(-1 1)" />
    </svg>
  );
}

/* the plate round the door: an octagon of panels, its own light bar above */
function Bulkhead() {
  const o = (r: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = ((i * 45 + 22.5) * Math.PI) / 180;
      return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");
  return (
    <svg className="vd-bulk" viewBox="-74 -74 148 148">
      <polygon points={o(72)} fill="#0b0e13" stroke="#1b212a" strokeWidth="1.2" />
      <polygon points={o(64)} fill="#0d1117" stroke="#202731" strokeWidth=".8" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1="0" y1="-52" x2="0" y2="-71" stroke="#1a2029" strokeWidth=".8" transform={`rotate(${i * 45})`} />
      ))}
      <rect x="-13" y="-70" width="26" height="1.6" rx=".8" fill="#e4f2ff" />
      <rect x="-16" y="-71.4" width="32" height="4.4" rx="2" fill="#9fd0ff" opacity=".14" />
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 60 - 0.8} y="-14" width="1.6" height="6" rx=".8" fill="#ffb466" />
          <rect x={s * 60 - 0.8} y="8" width="1.6" height="6" rx=".8" fill="#ffb466" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}

/* one of the four door panels: a quarter of the disc, plated, with a light along its rim once it opens */
function Blade({ k, glow }: { k: number; glow: boolean }) {
  const a0 = k * 90 + 1.2;
  const a1 = k * 90 + 88.8;
  const pt = (a: number, r: number) => `${(Math.cos((a * Math.PI) / 180) * r).toFixed(2)} ${(Math.sin((a * Math.PI) / 180) * r).toFixed(2)}`;
  const g = 0.9; // the seam between panels
  const off = `translate(${(Math.cos(((a0 + a1) / 2) * (Math.PI / 180)) * g).toFixed(2)} ${(Math.sin(((a0 + a1) / 2) * (Math.PI / 180)) * g).toFixed(2)})`;
  return (
    <svg viewBox="-50 -50 100 100" style={{ width: "100%", height: "100%" }}>
      <g transform={off}>
        <path d={`M0 0L${pt(a0, 50)}A50 50 0 0 1 ${pt(a1, 50)}Z`} fill="url(#vd-plate)" stroke="#2c343f" strokeWidth=".5" />
        {[20, 33, 44].map((r) => (
          <path key={r} d={`M${pt(a0 + 4, r)}A${r} ${r} 0 0 1 ${pt(a1 - 4, r)}`} fill="none" stroke="#262d37" strokeWidth=".9" />
        ))}
        <path d={`M${pt((a0 + a1) / 2, 14)}L${pt((a0 + a1) / 2, 46)}`} stroke="#222831" strokeWidth="1.4" />
        <path d={`M${pt(a0 + 14, 26)}L${pt(a0 + 14, 40)}M${pt(a1 - 14, 26)}L${pt(a1 - 14, 40)}`} stroke="#1a1f27" strokeWidth="3" strokeLinecap="round" />
        <path
          d={`M${pt(a0 + 6, 38.5)}A38.5 38.5 0 0 1 ${pt(a1 - 6, 38.5)}`}
          fill="none"
          stroke="#8fd0ff"
          strokeWidth=".9"
          strokeLinecap="round"
          opacity={glow ? 0.95 : 0}
          style={{ transition: "opacity .5s ease" }}
        />
      </g>
    </svg>
  );
}

/* the hub at the door's middle: a plate, a ring, and the blue core that glows while it opens */
function Hub({ core }: { core: boolean }) {
  return (
    <svg viewBox="-50 -50 100 100" style={{ width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="vd-coreg">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".18" stopColor="#bfe6ff" />
          <stop offset=".45" stopColor="#3f9bff" stopOpacity=".55" />
          <stop offset="1" stopColor="#1a5bd6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="11" fill="#11151b" stroke="#2c343f" strokeWidth=".8" />
      <circle r="7.5" fill="none" stroke="#252c36" strokeWidth=".7" />
      <g className="vd-core" opacity={core ? 1 : 0}>
        <circle r="16" fill="url(#vd-coreg)" />
        <circle r="9.5" fill="none" stroke="#7cc4ff" strokeWidth=".6" strokeDasharray="3 2" />
        <path d="M0 -48V-20M0 20V48M-48 0H-20M20 0H48" stroke="#7cc4ff" strokeWidth=".35" opacity=".7" />
      </g>
    </svg>
  );
}

/* past the door: a tunnel of lit rings running off into the dark */
function Tunnel() {
  return (
    <svg viewBox="-50 -50 100 100" style={{ width: "100%", height: "100%" }}>
      {[48, 38, 30.5, 24.5, 19.8, 16.2, 13.4].map((r, i) => (
        <g key={r} opacity={1 - i * 0.11}>
          <circle r={r} fill="none" stroke="#141a22" strokeWidth={r * 0.16} />
          <path d={arc(r, 150, 210)} fill="none" stroke="#8fd0ff" strokeWidth={Math.max(0.4, r * 0.035)} strokeLinecap="round" />
          <path d={arc(r, -30, 30)} fill="none" stroke="#8fd0ff" strokeWidth={Math.max(0.4, r * 0.035)} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/* the walkway out of the door, toward the end of the tunnel */
function Walkway() {
  return (
    <svg viewBox="-50 -50 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="vd-walk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1620" />
          <stop offset="1" stopColor="#1f2a38" />
        </linearGradient>
      </defs>
      <polygon points="-7,12 7,12 30,50 -30,50" fill="url(#vd-walk)" />
      {[-0.66, -0.33, 0, 0.33, 0.66].map((t) => (
        <line key={t} x1={t * 7} y1="12" x2={t * 30} y2="50" stroke="#2c3a4c" strokeWidth=".3" />
      ))}
      {[18, 26, 37].map((y) => (
        <line key={y} x1={-7 - ((y - 12) / 38) * 23} y1={y} x2={7 + ((y - 12) / 38) * 23} y2={y} stroke="#2c3a4c" strokeWidth=".3" />
      ))}
    </svg>
  );
}
