"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { BlogPost } from "@/lib/blog";
import { prefersReducedMotion, readPalette, startCanvasLoop } from "@/components/space/space2d";
import { Cover, Meta } from "./parts";
import "./SignalDecoder.css";

/* ============================================================
   SIGNAL DECODER - the blog as a receiver.

   A waterfall like a Deep Space Network receiver's: frequency
   across, time flowing down. Each post is one carrier. Its width
   is the reading time, and its dashes are its own title keyed in
   binary. Pointing at a carrier decodes its title in the readout;
   selecting it locks on, and the cover comes in a line at a time,
   the way the first probe pictures reached Earth.
   It is the whole top of the blog page: the page header floats over
   the field, a scale with a tuning cursor runs along the top, and the
   decoded post docks on the right (a bottom sheet on phones).
   ============================================================ */

const GLYPHS = "01<>/\\#=+*";
const pad = (n: number) => String(n).padStart(2, "0");

/** The title as bits, 8 per character. */
function titleBits(title: string): number[] {
  const bits: number[] = [];
  for (const ch of title) {
    const c = ch.charCodeAt(0) & 0xff;
    for (let b = 7; b >= 0; b--) bits.push((c >> b) & 1);
  }
  return bits;
}

function rgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 256-step colour ramp through the given stops: black, hull, hull lit, dim, starlight. */
function ramp(stops: [number, number, number][]): Uint8ClampedArray {
  const pos = [0, 0.18, 0.42, 0.74, 1];
  const out = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let k = 0;
    while (k < pos.length - 2 && v > pos[k + 1]) k++;
    const f = (v - pos[k]) / (pos[k + 1] - pos[k]);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = stops[k][c] + (stops[k + 1][c] - stops[k][c]) * f;
  }
  return out;
}

/** Text that resolves out of noise, left to right. Screen readers get the plain text. */
function Decode({ text }: { text: string }) {
  const [shown, setShown] = useState(() => text.replace(/\S/g, "·"));
  useEffect(() => {
    const instant = prefersReducedMotion();
    const t0 = performance.now();
    const dur = Math.min(1400, 300 + text.length * 22);
    let raf = 0;
    const tick = (now: number) => {
      const k = instant ? text.length : Math.floor(text.length * Math.min(1, (now - t0) / dur));
      setShown(text.slice(0, k) + text.slice(k).replace(/\S/g, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]));
      if (k < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return (
    <>
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{text}</span>
    </>
  );
}

/** "Decoding" until the picture is in, then "Locked". Remounted per post. */
function Status({ ch }: { ch: number }) {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLocked(true), prefersReducedMotion() ? 0 : 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className={`ev-status rx-status ${locked ? "is-locked" : "is-live"}`}>
      <span className="ev-status-dot" aria-hidden />
      CH {pad(ch)} · {locked ? "Locked" : "Decoding"}
    </span>
  );
}

const freq = (f: number) => (8400 + f * 50).toFixed(1);
const TICKS = Array.from({ length: 21 }, (_, k) => k * 5);

export default function SignalDecoder({ posts, children }: { posts: BlogPost[]; children?: ReactNode }) {
  const [selId, setSelId] = useState(posts[0]?.id);
  const [hovId, setHovId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const hintId = useId();
  const sel = posts.find((p) => p.id === selId) ?? posts[0];
  const selIdx = sel ? posts.indexOf(sel) : -1;
  const hovIdx = posts.findIndex((p) => p.id === hovId);
  const hov = hovIdx >= 0 ? posts[hovIdx] : null;
  const rd = hov ?? sel;
  const rdIdx = hov ? hovIdx : selIdx;
  const maxMin = Math.max(1, ...posts.map((p) => p.readingMinutes));

  /* carrier positions across the band: even spacing, a little drift per post */
  const xs = useMemo(
    () =>
      posts.map((p, i) => {
        let h = 0;
        for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) | 0;
        return (i + 0.5 + ((Math.abs(h) % 100) / 100 - 0.5) * 0.4) / posts.length;
      }),
    [posts],
  );

  const rootRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ sel: 0, hov: -1 });
  useEffect(() => {
    live.current = { sel: selIdx, hov: hovIdx };
  }, [selIdx, hovIdx]);

  /* phones: the meter rides just above the collapsed sheet */
  const hasSel = Boolean(sel);
  useEffect(() => {
    const el = topRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const ro = new ResizeObserver(() => root.style.setProperty("--rx-sheet", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasSel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pal = readPalette();
    const hull700 = getComputedStyle(document.documentElement).getPropertyValue("--hull-700") || "#2f3238";
    const table = ramp([rgb(pal.void), rgb(pal.hull), rgb(hull700), rgb(pal.dim), rgb(pal.starlight)]);
    const sig = rgb(pal.signal);
    const lit = rgb(pal.lit);
    const bits = posts.map((p) => titleBits(p.title));
    const still = prefersReducedMotion();

    let W = 0;
    let H = 0;
    let row = 0;
    let carry = 0;
    let painted = "";
    let cx: number[] = [];
    let bw: number[] = [];

    /* paint `rows` new rows at the top of img; the last one painted (y = 0) is the newest */
    const paint = (img: ImageData, rows: number) => {
      const d = img.data;
      const { sel: s, hov: hv } = live.current;
      for (let r = rows - 1; r >= 0; r--) {
        row++;
        const keys = bits.map((b, c) => {
          const i = Math.floor((row + c * 37) / 5) % (b.length + 6);
          return i < b.length && b[i] ? 1 : 0.3;
        });
        let o = r * W * 4;
        for (let x = 0; x < W; x++, o += 4) {
          let v = 0.05 + Math.random() ** 3 * 0.3;
          let onSel = 0;
          let onHov = 0;
          for (let c = 0; c < cx.length; c++) {
            const dx = (x - cx[c]) / bw[c];
            if (dx > 3 || dx < -3) continue;
            const a = Math.exp(-dx * dx) * keys[c] * (0.75 + Math.random() * 0.2);
            v += a;
            if (c === s) onSel += a;
            else if (c === hv) onHov += a;
          }
          const i = Math.min(255, (v * 255) | 0) * 3;
          let R = table[i];
          let G = table[i + 1];
          let B = table[i + 2];
          const tint = onSel > 0.04 ? sig : onHov > 0.04 ? lit : null;
          if (tint) {
            const k = Math.min(1, (tint === sig ? onSel : onHov) * 1.4);
            R += (tint[0] - R) * k;
            G += (tint[1] - G) * k;
            B += (tint[2] - B) * k;
          }
          d[o] = R;
          d[o + 1] = G;
          d[o + 2] = B;
          d[o + 3] = 255;
        }
      }
    };

    const draw = (ctx: CanvasRenderingContext2D, _w: number, _h: number, _t: number, dt: number) => {
      const key = `${live.current.sel}:${live.current.hov}`;
      const dpr = canvas.width / Math.max(1, canvas.clientWidth);
      if (canvas.width !== W || canvas.height !== H || (still && key !== painted)) {
        W = canvas.width;
        H = canvas.height;
        painted = key;
        cx = xs.map((f) => f * W);
        bw = posts.map((p) => Math.min(12, 2 + p.readingMinutes * 0.7) * dpr);
        const img = ctx.createImageData(W, H);
        paint(img, H);
        ctx.putImageData(img, 0, 0);
        return;
      }
      if (still) return;
      carry += dt * 60 * dpr;
      const n = Math.min(H - 1, Math.floor(carry));
      if (n < 1) return;
      carry -= n;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(canvas, 0, 0, W, H - n, 0, n, W, H - n);
      ctx.restore();
      const img = ctx.createImageData(W, n);
      paint(img, n);
      ctx.putImageData(img, 0, 0);
    };

    /* only run while the receiver is on screen */
    let stop: (() => void) | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop) {
        W = 0; // the canvas is cleared on start: repaint the whole field
        stop = startCanvasLoop(canvas, draw);
      } else if (!e.isIntersecting && stop) {
        stop();
        stop = null;
      }
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      stop?.();
    };
  }, [posts, xs]);

  const tune = (i: number, focus = false) => {
    const n = posts.length;
    if (!n) return;
    const j = (i + n) % n;
    setSelId(posts[j].id);
    if (focus) (hitsRef.current?.children[j] as HTMLElement | undefined)?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (overlayRef.current?.contains(e.target as Node)) return;
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d || posts.length < 2) return;
    e.preventDefault();
    tune(selIdx + d, hitsRef.current?.contains(e.target as Node));
  };

  return (
    <section ref={rootRef} className="rx" aria-label="Receiver: one carrier per post" onKeyDown={onKey}>
      <div className="rx-band">
        <div className="rx-scale" aria-hidden>
          {TICKS.map((t) => (
            <i key={t} className="rx-tick" style={{ left: `${t}%` }} />
          ))}
          {selIdx >= 0 && <span className="rx-cursor" style={{ left: `${xs[selIdx] * 100}%` }} />}
        </div>
        <canvas ref={canvasRef} className="rx-canvas" aria-hidden />
        <p id={hintId} className="sr-only">
          Left and right arrow keys tune between carriers.
        </p>
        <div ref={hitsRef} className="rx-hits" role="group" aria-label="Carriers" aria-describedby={hintId}>
          {posts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className="rx-hit"
              style={{ left: `${xs[i] * 100}%`, width: `${100 / posts.length}%` }}
              aria-label={`Channel ${i + 1}: ${p.title}`}
              aria-pressed={i === selIdx}
              tabIndex={i === selIdx ? 0 : -1}
              onPointerEnter={() => setHovId(p.id)}
              onPointerLeave={() => setHovId(null)}
              onFocus={() => setHovId(p.id)}
              onBlur={() => setHovId(null)}
              onClick={() => setSelId(p.id)}
            >
              <span className="rx-ch">{pad(i + 1)}</span>
            </button>
          ))}
        </div>
        {children && (
          <div ref={overlayRef} className="rx-overlay">
            {children}
          </div>
        )}
        {rd && (
          <div className={`rx-meter ${hov ? "is-hov" : ""}`} aria-hidden>
            <div className="rx-meter-row">
              <span className="rx-meter-ch">CH {pad(rdIdx + 1)}</span>
              <span className="tabular">{freq(xs[rdIdx])} MHz</span>
              <span className="rx-meter-bw">
                BW
                <span className="rx-bars">
                  {Array.from({ length: 12 }, (_, k) => (
                    <i key={k} className={k < Math.max(1, Math.round((12 * rd.readingMinutes) / maxMin)) ? "on" : ""} />
                  ))}
                </span>
                <span className="tabular">{rd.readingMinutes} min</span>
              </span>
            </div>
            <p className="rx-meter-title">
              <Decode text={rd.title} />
            </p>
          </div>
        )}
      </div>

      {sel && (
        <article className={`rx-out ${open ? "is-open" : ""}`}>
          <div ref={topRef} className="rx-out-top">
            <div className="rx-out-head">
              <Status key={sel.id} ch={selIdx + 1} />
              <div className="tm-profile-nav">
                <button type="button" className="tm-step" aria-label="Previous channel" disabled={posts.length < 2} onClick={() => tune(selIdx - 1)}>
                  ←
                </button>
                <span className="dm-detail-index tabular" aria-hidden>
                  {pad(selIdx + 1)} / {pad(posts.length)}
                </span>
                <button type="button" className="tm-step" aria-label="Next channel" disabled={posts.length < 2} onClick={() => tune(selIdx + 1)}>
                  →
                </button>
                <button
                  type="button"
                  className="tm-step rx-toggle"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  aria-label={open ? "Hide post details" : "Show post details"}
                  onClick={() => setOpen((o) => !o)}
                >
                  {open ? "↓" : "↑"}
                </button>
              </div>
            </div>
            <h2 className="rx-title">
              <Decode text={sel.title} />
            </h2>
          </div>
          <div id={bodyId} className="rx-out-body">
            <div className="rx-scan" key={sel.id}>
              <Cover post={sel} />
              <span className="rx-scanline" aria-hidden />
            </div>
            <Meta post={sel} />
            <p className="bl-blurb">{sel.excerpt}</p>
            <div className="rx-foot">
              <span className="bl-author">{sel.author}</span>
              <a
                className="btn btn-primary"
                href={sel.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read “${sel.title}” on Medium (opens in a new tab)`}
              >
                Read on Medium →
              </a>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
