"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { EVENT_KINDS, archiveYears, isExternal, type EventKind, type PastEvent, type UpcomingEvent } from "@/data/events";
import { ANNOUNCEMENT } from "@/data/announcement";
import EventPoster from "@/components/EventPoster";
import { EntryPanel, LEAD, LaunchPad, keyOf, nameOf, type Item } from "./parts";

/* ============================================================
   EVENTS BOARD - the page, in order:
   - the title, with Upcoming & Current beside it: their posters
     large, or (nothing upcoming) a slim launchpad strip;
   - on laptops and up, Saturn: every event on one wide ring round
     it, and the kinds are on its face (not on phones);
   - one sticky bar: the kinds, and whether the wall is grouped
     by year or by kind;
   - the archive as one wall of posters, a block per year: the
     year itself is a tile of the wall (its number in outline, its
     kinds counted), the year's newest event is a big tile, the
     rest fill in round them, the count of big tiles picked so the
     year's last row comes out full. The year's tile stays pinned
     while its posters scroll by.
   The kind is read from each event's name (kindOf). #workshop
   in the URL opens on that kind. A tile opens
   its entry panel.
   ============================================================ */

type Kind = EventKind | "all";

/** How many poster columns a year gets, by the wall's width (the CSS has the same steps). Below 620 they run two
    across: beside the year column, or (phones, under 440) under the year as a banner. */
const posterCols = (w: number) => (w > 1100 ? 5 : w > 860 ? 4 : w > 620 ? 3 : 2);

/** How many of a year's newest events get a big tile (2 x 2): the count that leaves its last row fullest. */
function bigCount(n: number, cols: number) {
  if (cols < 2) return 0;
  if (n < 3) return n * 4 <= cols * 2 ? n : 0; // one or two: all big, so a small group still fills its rows

  let best = 1;
  let least = Infinity;
  for (const b of [1, 2, 0, 3]) {
    if (b > n) continue;
    const empty = (cols - ((n + 3 * b) % cols)) % cols;
    if (empty < least) [best, least] = [b, empty];
  }
  return best;
}

export default function EventsBoard({ past: archive, current, head }: { past: PastEvent[]; current: UpcomingEvent[]; head: ReactNode }) {
  /* 2021 has no block of its own: its events sit with 2022 (their own dates are unchanged) */
  const past = useMemo(() => archive.map((e) => (e.year === "2021" ? { ...e, year: "2022" } : e)), [archive]);
  const years = useMemo(() => archiveYears(past), [past]);
  const [kind, setKind] = useState<Kind>("all");
  const [open, setOpen] = useState<{ items: Item[]; index: number } | null>(null);
  const wallRef = useRef<HTMLElement>(null);
  /* the bar: once it is stuck under the header it carries a band up to the top of the window (no gap between them) */
  const barRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mark = stickRef.current;
    const bar = barRef.current;
    if (!mark || !bar) return;
    const top = parseFloat(getComputedStyle(bar).top) || 0;
    const io = new IntersectionObserver(
      ([e]) => bar.toggleAttribute("data-stuck", !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)),
      { rootMargin: `-${top + 1}px 0px 0px 0px` }
    );
    io.observe(mark);
    /* the years' tiles pin just under it (it is one line or two, as the screen allows) */
    const ro = new ResizeObserver(() => wallRef.current?.style.setProperty("--evb-under", `${top + bar.offsetHeight + 18}px`));
    ro.observe(bar);
    return () => (io.disconnect(), ro.disconnect());
  }, []);
  /* Saturn is for laptops and up; on phones it is not drawn at all (and its posters never load) */
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const [cols, setCols] = useState(5);
  useEffect(() => {
    // the archive, not the wall: the wall is re-keyed on every filter, and the old one reports width 0 as it goes
    const el = wallRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCols(posterCols(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* #workshop opens on that kind */
  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration
    if (EVENT_KINDS.some((k) => k.id === h)) setKind(h as EventKind);
  }, []);

  const pick = (k: Kind) => {
    setKind(k);
    history.replaceState(history.state, "", k !== "all" ? `#${k}` : location.pathname);
    const bar = wallRef.current;
    if (bar && bar.getBoundingClientRect().top < 0) {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      bar.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    }
  };

  const shown = useMemo(() => past.filter((e) => kind === "all" || e.kind === kind), [past, kind]);
  /* the wall's blocks: one per year, or one per kind */
  const [by, setBy] = useState<"year" | "kind">("year");
  const kindCounts = useMemo(
    () => Object.fromEntries([["all", past.length], ...EVENT_KINDS.map((k) => [k.id, past.filter((e) => e.kind === k.id).length])]) as Record<Kind, number>,
    [past],
  );
  const groups = useMemo(
    () =>
      (by === "year"
        ? years.map((y) => ({ id: y, events: shown.filter((e) => e.year === y) }))
        : EVENT_KINDS.map((k) => ({ id: k.id, events: shown.filter((e) => e.kind === k.id) }))
      ).filter((g) => g.events.length),
    [by, years, shown],
  );
  /* the panel browses everything on the wall, in its order */
  const wallItems = useMemo(() => groups.flatMap((g) => g.events.map((e): Item => ({ past: e }))), [groups]);

  /* each year block rises in as it arrives */
  useEffect(() => {
    const els = Array.from(wallRef.current?.querySelectorAll<HTMLElement>("[data-rise]") ?? []);
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);

  const upItems = useMemo(() => current.map((up): Item => ({ up })), [current]);

  return (
    <div className="evb">
      <div className="evb-top">
        <div className="evb-head">{head}</div>
        <Launch items={upItems} onOpen={(i) => setOpen({ items: upItems, index: i })} />
      </div>

      {wide && (
        <Saturn
          events={shown}
          counts={kindCounts}
          kind={kind}
          onKind={pick}
          onOpen={(ev) => setOpen({ items: wallItems, index: wallItems.findIndex((x) => "past" in x && x.past.id === ev.id) })}
        />
      )}


      <section ref={wallRef} className="evb-archive" aria-label="Past events">
        <div ref={stickRef} aria-hidden />
        <div ref={barRef} className="evb-bar">
          <div className="evb-kinds" role="group" aria-label="Kind">
            <button type="button" className="evb-chip" aria-pressed={kind === "all"} onClick={() => pick("all")}>
              <KindIcon kind="all" />
              All <span className="evb-n">{past.length}</span>
            </button>
            {EVENT_KINDS.map((k) => {
              const n = kindCounts[k.id];
              return (
                <button
                  key={k.id}
                  type="button"
                  className="evb-chip"
                  data-kind={k.id}
                  aria-pressed={kind === k.id}
                  disabled={!n}
                  onClick={() => pick(k.id)}
                >
                  <KindIcon kind={k.id} />
                  {k.label} <span className="evb-n">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="evb-by" role="group" aria-label="Group the wall">
            {(["year", "kind"] as const).map((b) => (
              <button key={b} type="button" className="evb-year" aria-pressed={by === b} onClick={() => setBy(b)}>
                By {b}
              </button>
            ))}
          </div>
        </div>

        <div className="evb-wall" key={`${by}-${kind}`}>
          {groups.map((g) => (
            <section key={g.id} className="evb-block" aria-label={by === "year" ? g.id : EVENT_KINDS.find((k) => k.id === g.id)?.label} data-rise>
              <div className="evb-yearcol">
                {by === "year" ? <YearTile year={g.id} events={g.events} /> : <KindTile kind={g.id as EventKind} events={g.events} />}
              </div>
              <div className="evb-posters">
                {g.events.map((ev, i) => (
                  <Tile
                    key={ev.id}
                    ev={ev}
                    big={i < bigCount(g.events.length, cols)}
                    i={i}
                    onOpen={() => setOpen({ items: wallItems, index: wallItems.findIndex((x) => "past" in x && x.past.id === ev.id) })}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {open && <EntryPanel items={open.items} index={open.index} onGo={(i) => setOpen({ ...open, index: i })} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* Upcoming & Current: their posters, large. With nothing upcoming, one slim strip (the launchpad and its line). */
function Launch({ items, onOpen }: { items: Item[]; onOpen: (i: number) => void }) {
  if (!items.length) {
    return (
      <section className="evb-pad" aria-label={LEAD}>
        <h2 className="evb-label">{LEAD}</h2>
        <div className="evb-pad-row">
          <LaunchPad />
          <p className="evb-pad-name">
            {ANNOUNCEMENT?.href ? (
              isExternal(ANNOUNCEMENT.href) ? (
                <a href={ANNOUNCEMENT.href} target="_blank" rel="noopener noreferrer">
                  {nameOf({ pad: true })} ↗
                </a>
              ) : (
                <Link href={ANNOUNCEMENT.href} data-route-load>
                  {nameOf({ pad: true })} →
                </Link>
              )
            ) : (
              nameOf({ pad: true })
            )}
          </p>
        </div>
      </section>
    );
  }
  return (
    <section className="evb-up" aria-label={LEAD}>
      <h2 className="evb-label">{LEAD}</h2>
      <ul className="evb-up-row">
        {items.map((it, i) =>
          "up" in it ? (
            <li key={keyOf(it)} className="evb-tile evb-up-tile" data-kind={it.up.kind}>
              <EventPoster name={it.up.name} tag={it.up.tag} poster={it.up.poster} loading="eager" />
              <div className="evb-cap">
                <h3 className="evb-name">
                  <button type="button" className="evb-open" aria-haspopup="dialog" onClick={() => onOpen(i)}>
                    {it.up.name}
                  </button>
                </h3>
                <p className="evb-date tabular">
                  {it.up.date} · <span className="evb-status">{it.up.status}</span>
                </p>
              </div>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}

/* Saturn (laptops and up), after the owner's reference: one wide ring of every event, the cards standing on a
   glowing gold rim and turning with its curve as it goes round, the far side peeking over a big glowing Saturn that
   floats above the ring's centre with rings of its own; the kinds are on the planet's face, and picking one filters
   the ring and the wall. Fewer events, a smaller ring.

   Smooth: the ring and each card turn by Web Animations on the compositor (each card's pose precomputed round the
   circle, all on one clock), and the floor, orbits and rim are their own flat layer behind the cards, so the
   browser never re-styles the cards or sorts them against the floor while it turns. */
const SPIN_MS = 160000;
const TILT = 78; // keep in step with .evsat --tilt
const YAW = -34; // how far a card at the side turns with the ring's curve
const STEPS = 24; // a card's poses round the circle
/* a ring card is at most 124px wide: its poster at 256px, not the archive's 720 (fifty big images on turning 3D
   layers made the ring stutter) */
const ringPoster = (url?: string) => url?.replace(/([?&])w=\d+/, "$1w=256");

const pose = (deg: number) => `rotateZ(${-deg}deg) rotateX(${-TILT}deg) rotateY(${(Math.sin((deg * Math.PI) / 180) * YAW).toFixed(2)}deg)`;

function Saturn({
  events,
  counts,
  kind,
  onKind,
  onOpen,
}: {
  events: PastEvent[];
  counts: Record<Kind, number>;
  kind: Kind;
  onKind: (k: Kind) => void;
  onOpen: (ev: PastEvent) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLUListElement>(null);
  const anims = useRef<Animation[]>([]);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const n = Math.max(events.length, 1);

  /* the turning: the ring round its centre, and each card kept upright and facing out along the curve */
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const faces = Array.from(ring.querySelectorAll<HTMLElement>(".evsat-face"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      faces.forEach((f) => (f.style.transform = pose(Number(f.dataset.a))));
      return;
    }
    const opts: KeyframeAnimationOptions = { duration: SPIN_MS, iterations: Infinity, easing: "linear" };
    const list = [
      ring.animate([{ transform: "rotateZ(0deg)" }, { transform: "rotateZ(360deg)" }], opts),
      ...faces.map((f) => {
        const a = Number(f.dataset.a);
        return f.animate(Array.from({ length: STEPS + 1 }, (_, k) => ({ transform: pose(a + (360 * k) / STEPS) })), opts);
      }),
    ];
    // one clock for all: a ring rebuilt for another kind carries on from where the last one was
    list.forEach((x) => (x.startTime = 0));
    anims.current = list;
    return () => list.forEach((x) => x.cancel());
  }, [events]);
  /* nothing turns off screen */
  useEffect(() => {
    anims.current.forEach((x) => (seen ? x.play() : x.pause()));
  }, [seen, events]);

  return (
    <section ref={ref} className="evsat" aria-label="Events by kind" style={{ "--n": n } as CSSProperties}>
      <div className="evsat-plane" aria-hidden>
        <div className="evsat-floor" />
        {[0.64, 0.46].map((o, i) => (
          <div key={o} className="evsat-orbit" style={{ "--o": o } as CSSProperties}>
            {[20, 110, 200, 290].map((a) => (
              <span key={a} className="evsat-dot" style={{ "--a": `${a + i * 45}deg` } as CSSProperties} />
            ))}
          </div>
        ))}
        <div className="evsat-rim" />
      </div>
      <div className="evsat-tilt">
        <ul key={kind} ref={ringRef} className="evsat-ring">
          {events.map((ev, j) => {
            const a = (360 * j) / n;
            return (
              <li key={ev.id} className="evsat-item" style={{ "--a": `${a}deg` } as CSSProperties}>
                <div className="evsat-face" data-a={a} style={{ transform: pose(a) }}>
                  <button type="button" className="evsat-card" data-kind={ev.kind} aria-haspopup="dialog" aria-label={`${ev.name}, ${ev.date}`} onClick={() => onOpen(ev)}>
                    <EventPoster name={ev.name} tag={ev.tag} poster={ringPoster(ev.poster)} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="evsat-planet">
          <div className="evsat-globe" aria-hidden />
          <div className="evsat-prings" aria-hidden />
          <div className="evsat-kinds" role="group" aria-label="Kind">
            {([{ id: "all", label: "All" }, ...EVENT_KINDS] as { id: Kind; label: string }[]).map((k) => (
              <button
                key={k.id}
                type="button"
                className="evsat-kind"
                data-kind={k.id === "all" ? undefined : k.id}
                aria-pressed={kind === k.id}
                disabled={!counts[k.id]}
                onClick={() => onKind(k.id)}
              >
                <KindIcon kind={k.id} />
                <span>{k.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* A year as a tile of its own: its number in outline, and how many of each kind it held. */
function YearTile({ year, events }: { year: string; events: PastEvent[] }) {
  return (
    <div className="evb-yeartile" aria-hidden>
      <span className="evb-yearnum">
        <span>{year.slice(0, 2)}</span>
        <span>{year.slice(2)}</span>
      </span>
      <ul className="evb-yearkinds">
        {EVENT_KINDS.map((k) => {
          const n = events.filter((e) => e.kind === k.id).length;
          return n ? (
            <li key={k.id} data-kind={k.id}>
              <KindIcon kind={k.id} />
              <span className="tabular">{n}</span>
            </li>
          ) : null;
        })}
      </ul>
    </div>
  );
}

/* A kind as a tile of its own: its icon in its colour, its name, how many, and how many each year. */
function KindTile({ kind, events }: { kind: EventKind; events: PastEvent[] }) {
  const counts = archiveYears(events).map((y) => [y, events.filter((e) => e.year === y).length] as const);
  return (
    <div className="evb-yeartile evb-kindtile" data-kind={kind} aria-hidden>
      <span className="evb-kindhead">
        <KindIcon kind={kind} />
        <span className="evb-kindname">{EVENT_KINDS.find((k) => k.id === kind)?.label}</span>
      </span>
      <span className="evb-kindnum tabular">{events.length}</span>
      <ul className="evb-yearkinds">
        {counts.map(([y, n]) => (
          <li key={y}>
            <span className="evb-kindyear tabular">{y}</span>
            <span className="tabular">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* One event on the wall: its poster filling the tile, its name and date over the foot of it. */
function Tile({ ev, big, i, onOpen }: { ev: PastEvent; big: boolean; i: number; onOpen: () => void }) {
  return (
    <article className="evb-tile" data-big={big || undefined} data-kind={ev.kind} style={{ "--i": Math.min(i, 12) } as CSSProperties}>
      <EventPoster name={ev.name} tag={ev.tag} poster={ev.poster} />
      <span className="evb-badge" aria-hidden>
        <KindIcon kind={ev.kind} />
      </span>
      <div className="evb-cap">
        <h3 className="evb-name">
          <button type="button" className="evb-open" aria-haspopup="dialog" onClick={onOpen}>
            {ev.name}
          </button>
        </h3>
        <p className="evb-date tabular">{ev.date}</p>
      </div>
    </article>
  );
}

/** A small line icon for each kind (and "all"). */
function KindIcon({ kind }: { kind: Kind }) {
  return (
    <svg className="evb-icon" viewBox="0 0 24 24" aria-hidden focusable="false">
      {kind === "all" && <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />}
      {kind === "hackathon" && <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />}
      {kind === "workshop" && <path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6" />}
      {kind === "contest" && <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3.5 4M16 6h3a3 3 0 0 1-3.5 4M12 13v4M8 20h8M10 17h4v3h-4z" />}
      {kind === "talk" && <path d="M9 3h6v10a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />}
      {kind === "games" && (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
