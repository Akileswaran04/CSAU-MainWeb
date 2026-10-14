"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import type { QCQuestion, QCSet, QCWeek } from "@/data/quickCode";

/* ============================================================
   QUICK CODE ARCHIVE - the five weeks as a console that plays
   the format: pick a week (and a track, where a week has two),
   then run its five questions against the five-minute clock, or
   browse the answers. Weeks with results add the leaderboard,
   the consecutive top performers and the winners posters.

   Every visible sentence comes from src/data/quickCode.ts (the
   archive's own documents); the rest are control labels.
   ============================================================ */

const LIMIT = 300; // the format's five minutes, in seconds

type Mode = "idle" | "run" | "browse" | "done";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const correctOf = (q: QCQuestion) => q.options.findIndex((o) => o[0] === q.answer[0]);
/* "A. text" -> ["A", "text"] */
const splitOpt = (o: string) => {
  const m = o.match(/^([A-Z])[.)]\s*([\s\S]*)$/);
  return m ? [m[1], m[2]] : ["", o];
};
/* the tag's colours, from its name ("Orange & Brown Tags — ...") */
const TAG_COLOURS: Record<string, string> = { orange: "#ee8a2a", brown: "#8a5a3a", red: "#e5484d", grey: "#8d9196" };
const dotsOf = (tag: string) => Object.keys(TAG_COLOURS).filter((c) => tag.toLowerCase().includes(c));

export default function QuickCodeArchive({ weeks }: { weeks: QCWeek[] }) {
  const [wi, setWi] = useState(0);
  const [ti, setTi] = useState(0);

  /* #week-03 opens on that week */
  useEffect(() => {
    const i = weeks.findIndex((w) => w.id === location.hash.slice(1));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration
    if (i >= 0) setWi(i);
  }, [weeks]);

  const pickWeek = (i: number) => {
    setWi(i);
    setTi(0);
    history.replaceState(history.state, "", `#${weeks[i].id}`);
  };

  const week = weeks[wi];
  const track = week.sets[Math.min(ti, week.sets.length - 1)];

  return (
    <div className="qc-wrap">
      <h2 className="qc-h2">ARCHIVE</h2>

      {/* the five weeks on one line */}
      <nav className="qc-tl" aria-label="Weeks">
        {weeks.map((w, i) => (
          <button key={w.id} type="button" className="qc-tl-w" aria-pressed={i === wi} onClick={() => pickWeek(i)}>
            <span className="qc-tl-dot" aria-hidden />
            <span className="qc-tl-n">{w.label.replace(/\D/g, "")}</span>
            <span className="qc-tl-l">{w.label.replace(/\d/g, "").trim()}</span>
            {w.results && <span className="qc-tl-star" aria-hidden>★</span>}
          </button>
        ))}
      </nav>

      {week.sets.length > 1 && (
        <div className="qc-tracks" role="group" aria-label="Track">
          {week.sets.map((s, i) => {
            const [name, who] = s.tag.split(" — ");
            return (
              <button key={s.set.file} type="button" className="qc-track" aria-pressed={i === ti} onClick={() => setTi(i)}>
                <span className="qc-track-dots" aria-hidden>
                  {dotsOf(s.tag).map((c) => (
                    <i key={c} style={{ background: TAG_COLOURS[c] }} />
                  ))}
                </span>
                <span className="qc-track-name">{name}</span>
                {who && <span className="qc-track-who">{who}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* keyed by the set: a new week or track starts a fresh run */}
      <Player key={track.set.file} set={track.set} brief={week.questionSet} />

      {week.results && <Leaderboard results={week.results} />}
      {week.topPerformers && <TopPerformers tp={week.topPerformers} />}
      {week.winners && (
        <div className="qc-block">
          <span className="qc-k">Winners</span>
          <div className="qc-wins">
            {week.winners.map((img) => (
              <a key={img.src} href={img.src} target="_blank" rel="noopener noreferrer" className="qc-win">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} width={1080} height={1080} alt={img.alt} loading="lazy" decoding="async" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── the run: start card, five questions on the clock, score ── */
function Player({ set, brief }: { set: QCSet; brief?: QCWeek["questionSet"] }) {
  const qs = set.questions;
  const [mode, setMode] = useState<Mode>("idle");
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => qs.map(() => null));
  const [start, setStart] = useState(0);
  const [used, setUsed] = useState(0);
  const [now, setNow] = useState(0);

  /* the clock ticks only while a run is on; at zero the run ends */
  useEffect(() => {
    if (mode !== "run") return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if ((t - start) / 1000 >= LIMIT) {
        setUsed(LIMIT);
        setMode("done");
      }
    }, 250);
    return () => clearInterval(id);
  }, [mode, start]);

  const left = mode === "run" ? Math.max(0, LIMIT - (now - start) / 1000) : LIMIT;
  const score = picks.filter((p, i) => p === correctOf(qs[i])).length;

  const begin = () => {
    const t = Date.now();
    setPicks(qs.map(() => null));
    setAt(0);
    setStart(t);
    setNow(t);
    setMode("run");
  };
  const finish = () => {
    setUsed(Math.min(LIMIT, (Date.now() - start) / 1000));
    setMode("done");
  };
  const pick = (i: number) => {
    if (mode !== "run" || picks[at] !== null) return;
    setPicks((p) => p.map((v, j) => (j === at ? i : v)));
  };
  const go = (d: number) => setAt((a) => Math.max(0, Math.min(qs.length - 1, a + d)));

  const onKey = (e: KeyboardEvent) => {
    if (mode !== "run" && mode !== "browse") return;
    const k = e.key.toUpperCase();
    const n = "ABCD".indexOf(k) >= 0 ? "ABCD".indexOf(k) : "1234".indexOf(k);
    if (n >= 0 && n < qs[at].options.length) pick(n);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };

  const q = qs[at];
  const shown = mode === "browse" || picks[at] !== null;
  const last = at === qs.length - 1;

  return (
    <section className="pa-panel qc-player" data-mode={mode} onKeyDown={onKey} aria-label={set.header[0]}>
      {/* top bar: the set, its five segments, the clock */}
      <header className="qc-bar">
        <span className="qc-bar-id">{set.header[0]}</span>
        <ol className="qc-segs" aria-label="Questions">
          {qs.map((qq, i) => {
            const p = picks[i];
            const state = p === null ? (mode === "browse" ? "seen" : "") : p === correctOf(qq) ? "ok" : "bad";
            return (
              <li key={qq.n}>
                <button
                  type="button"
                  className="qc-seg"
                  data-state={state}
                  data-at={mode !== "idle" && mode !== "done" && i === at ? "" : undefined}
                  disabled={mode === "idle"}
                  aria-label={`Q${qq.n}`}
                  onClick={() => {
                    setAt(i);
                    if (mode === "done") setMode("browse");
                  }}
                />
              </li>
            );
          })}
        </ol>
        <span className="qc-clock tabular" data-low={mode === "run" && left < 60 ? "" : undefined}>
          {mmss(mode === "done" ? LIMIT - used : left)}
        </span>
        <i className="qc-fuse" style={{ transform: `scaleX(${left / LIMIT})` }} aria-hidden />
      </header>

      {mode === "idle" && (
        <div className="qc-start">
          <div className="qc-start-big tabular">{mmss(LIMIT)}</div>
          <div className="qc-text">
            {(brief?.header ?? set.header).map((h, i) => (i === 0 ? <strong key={i}>{h}</strong> : <div key={i}>{h}</div>))}
          </div>
          {brief && (
            <details className="qc-brief qc-text">
              <summary>BRIEF</summary>
              {brief.notes.map((n) => (
                <div key={n.label}>
                  <span className="qc-k">{n.label}</span>
                  {n.lines.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              ))}
            </details>
          )}
          <div className="qc-row">
            <button type="button" className="pa-btn pa-btn-primary qc-go" onClick={begin}>
              START ▸
            </button>
            <button type="button" className="pa-btn" onClick={() => (setAt(0), setMode("browse"))}>
              BROWSE ANSWERS
            </button>
            {brief && (
              <a href={brief.file} download className="pa-btn">
                QUESTIONS .DOCX ↓
              </a>
            )}
            <a href={set.file} download className="pa-btn">
              SOLUTIONS .DOCX ↓
            </a>
          </div>
        </div>
      )}

      {(mode === "run" || mode === "browse") && (
        <div className="qc-stage" key={at}>
          <div className="qc-qhead">
            <span className="qc-qno">Q{q.n}</span>
            <span className="qc-qtitle">{q.title}</span>
            {q.level && <span className="qc-lv">{q.level}</span>}
          </div>
          <div className="qc-text qc-prompt">
            {q.prompt.map((b, i) =>
              typeof b === "string" ? (
                <p key={i}>{b}</p>
              ) : (
                <pre key={i} className="qc-pre">
                  <code>{b.code}</code>
                </pre>
              ),
            )}
          </div>
          <div className="qc-opts" role="group" aria-label="Options">
            {q.options.map((o, i) => {
              const [letter, text] = splitOpt(o);
              const ok = i === correctOf(q);
              const state = !shown ? "" : ok ? "ok" : picks[at] === i ? "bad" : "dim";
              return (
                <button
                  key={i}
                  type="button"
                  className="qc-opt"
                  data-state={state}
                  aria-disabled={shown || undefined}
                  onClick={() => pick(i)}
                >
                  <span className="qc-opt-l">{letter}</span>
                  <span className="qc-opt-t">{text}</span>
                </button>
              );
            })}
          </div>
          {shown && (
            <div className="qc-why qc-text">
              <span className="qc-k">Answer</span>
              <p className="qc-ans">{q.answer}</p>
              {q.explanation.length > 0 && <span className="qc-k">Explanation</span>}
              {q.explanation.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          <div className="qc-row qc-nav">
            <button type="button" className="pa-btn" onClick={() => go(-1)} disabled={at === 0}>
              ← BACK
            </button>
            {mode === "run" && last ? (
              <button type="button" className="pa-btn pa-btn-primary" onClick={finish}>
                SCORE ▸
              </button>
            ) : mode === "browse" && last ? (
              <button type="button" className="pa-btn" onClick={() => setMode("idle")}>
                DONE
              </button>
            ) : (
              <button type="button" className={`pa-btn${shown ? " pa-btn-primary" : ""}`} onClick={() => go(1)}>
                NEXT →
              </button>
            )}
          </div>
        </div>
      )}

      {mode === "done" && (
        <div className="qc-done">
          <div className="qc-done-stats">
            <div>
              <span className="qc-k">Score</span>
              <div className="qc-done-big tabular">
                {score}/{qs.length}
              </div>
            </div>
            <div>
              <span className="qc-k">Time</span>
              <div className="qc-done-big tabular">{mmss(used)}</div>
            </div>
          </div>
          <div className="qc-row">
            <button type="button" className="pa-btn pa-btn-primary" onClick={() => (setAt(0), setMode("browse"))}>
              REVIEW
            </button>
            <button type="button" className="pa-btn" onClick={begin}>
              RETRY ↻
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── results: one year at a time, top three on a podium ── */
function Leaderboard({ results }: { results: NonNullable<QCWeek["results"]> }) {
  const [yi, setYi] = useState(0);
  const y = results.years[yi];
  const sum = results.summary.rows.find((r) => r[0] === y.year);
  const podium = [y.ranks[1], y.ranks[0], y.ranks[2]];

  return (
    <div className="qc-block">
      <span className="qc-k">Results</span>
      <div className="qc-text">
        {results.header.map((h, i) => (i === 0 ? <strong key={i}>{h}</strong> : <div key={i}>{h}</div>))}
      </div>
      <div className="qc-row" role="group" aria-label="Year">
        {results.years.map((yy, i) => (
          <button key={yy.year} type="button" className="pa-btn qc-yr" aria-pressed={i === yi} onClick={() => setYi(i)}>
            {yy.year}
          </button>
        ))}
      </div>

      <div className="pa-panel qc-lb">
        {sum && (
          <dl className="qc-lb-sum">
            {results.summary.head.slice(1).map((h, i) => (
              <div key={h}>
                <dt className="qc-k">{h}</dt>
                <dd className="tabular">{sum[i + 1]}</dd>
              </div>
            ))}
          </dl>
        )}
        <ol className="qc-pod" key={y.year}>
          {podium.map((r, i) =>
            r ? (
              <li key={r.rank} className="qc-pod-c" data-place={r.rank}>
                <span className="qc-pod-name">{r.name}</span>
                <span className="qc-pod-meta tabular">
                  {r.score} · {r.time}
                </span>
                <span className="qc-pod-step" style={{ height: [72, 104, 52][i] }}>
                  {r.rank}
                </span>
              </li>
            ) : (
              <li key={i} className="qc-pod-c" aria-hidden />
            ),
          )}
        </ol>
        {y.ranks.length > 3 && (
          <ol className="qc-rest">
            {y.ranks.slice(3).map((r) => (
              <li key={r.rank}>
                <span className="qc-rest-r">{r.rank}</span>
                <span>{r.name}</span>
                <span className="tabular">
                  {r.score} · {r.time}
                </span>
              </li>
            ))}
          </ol>
        )}
        {y.note && <p className="qc-text qc-small">{y.note}</p>}
      </div>
      <div className="qc-text qc-small">
        {results.notes.map((n, i) => (
          <div key={i}>{n}</div>
        ))}
      </div>
    </div>
  );
}

/* ── students in the top five two weeks running ── */
function TopPerformers({ tp }: { tp: NonNullable<QCWeek["topPerformers"]> }) {
  return (
    <div className="qc-block">
      <span className="qc-k">Top performers</span>
      <div className="qc-text">
        {tp.header.map((h, i) => (i === 0 ? <strong key={i}>{h}</strong> : <div key={i}>{h}</div>))}
      </div>
      <div className="qc-tp">
        {tp.rows.map(([year, name, w1, w2]) => (
          <div key={name} className="pa-panel qc-tp-c">
            <span className="qc-k">{year}</span>
            <span className="qc-tp-name">{name}</span>
            <dl className="qc-tp-run">
              <div>
                <dt className="qc-k">{tp.head[2]}</dt>
                <dd className="tabular">{w1}</dd>
              </div>
              <span aria-hidden>→</span>
              <div>
                <dt className="qc-k">{tp.head[3]}</dt>
                <dd className="tabular">{w2}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <p className="qc-text" style={{ margin: 0 }}>
        {tp.summary}
      </p>
    </div>
  );
}
