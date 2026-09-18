"use client";

import { useSyncExternalStore, useState } from "react";
import { KoiMark, LilyPad, RippleRule } from "@/components/PondOrnaments";
import { POND_ARENA_CSS } from "../pond-arena-css";

/* ============================================================
   CRACKIT — Coding events platform (frontend mock)

   • Current coding event + online assessment (name + roll)
   • Previous question archive (stored, expandable)
   • Leaderboard with the current participant highlighted
   Route: /crackit
   ============================================================ */

interface Question {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface AttemptRow {
  name: string;
  roll: string;
  score: number;
  total: number;
  timeSec: number;
}

const CURRENT_EVENT = {
  title: "LOGIC LIFT-OFF",
  tag: "LIVE NOW",
  date: "SEP 2026",
  questions: 5,
  duration: "45 MIN",
};

const SAMPLE_QUESTIONS: Question[] = [
  {
    q: "What is the time complexity of binary search on a sorted array of n elements?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    answer: 1,
    explanation: "Binary search halves the search space each step, so it runs in O(log n).",
  },
  {
    q: "Which data structure gives FIFO ordering?",
    options: ["Stack", "Queue", "Heap", "Tree"],
    answer: 1,
    explanation: "A queue is First-In-First-Out; a stack is LIFO.",
  },
  {
    q: "int x = 5; cout << x + 10; — what prints?",
    options: ["5", "10", "15", "50"],
    answer: 2,
    explanation: "5 + 10 evaluates to 15 before being printed.",
  },
  {
    q: "Which SQL keyword removes rows from a table?",
    options: ["DROP", "DELETE", "REMOVE", "TRUNCATE ROWS"],
    answer: 1,
    explanation: "DELETE removes rows; DROP removes the whole table.",
  },
  {
    q: "A function calling itself directly is called ___.",
    options: ["Iteration", "Recursion", "Callback", "Promise"],
    answer: 1,
    explanation: "Recursion is when a function invokes itself.",
  },
];

const SEED_LEADERBOARD: AttemptRow[] = [
  { name: "Akil", roll: "2115010", score: 500, total: 500, timeSec: 151 },
  { name: "Arjun", roll: "2115022", score: 480, total: 500, timeSec: 172 },
  { name: "Priya", roll: "2115031", score: 460, total: 500, timeSec: 199 },
  { name: "Kavin", roll: "2115044", score: 430, total: 500, timeSec: 210 },
  { name: "Meera", roll: "2115056", score: 410, total: 500, timeSec: 233 },
];

const ARCHIVE: { round: string; date: string; event: string; questions: Question[] }[] = [
  {
    round: "CRACKIT · ROUND 24",
    date: "AUG 2026",
    event: "BINARY BLAST",
    questions: [
      {
        q: "Given an array sorted in ascending order, which search is fastest?",
        options: ["Linear", "Binary", "Exponential start from 0", "Random"],
        answer: 1,
        explanation: "Binary search is O(log n) on sorted arrays.",
      },
      {
        q: "What does a linker do?",
        options: ["Compiles source", "Combines object files into an executable", "Runs tests", "Manages memory"],
        answer: 1,
        explanation: "The linker resolves references and combines compiled objects.",
      },
    ],
  },
  {
    round: "CRACKIT · ROUND 23",
    date: "JUL 2026",
    event: "LOOP WAR",
    questions: [
      {
        q: "How many times does 'for(i=0;i<3;i++)' run the body?",
        options: ["2", "3", "4", "Infinite"],
        answer: 1,
        explanation: "i runs for 0,1,2 → three iterations.",
      },
      {
        q: "Which is not a loop in C?",
        options: ["for", "while", "do-while", "repeat-until"],
        answer: 3,
        explanation: "C has for, while and do-while; repeat-until is Pascal-style.",
      },
    ],
  },
];

const STORAGE_KEY = "csau-crackit-leaderboard-v1";

/* ── localStorage-backed leaderboard store (external system read) ── */
function loadFromStorage(): AttemptRow[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttemptRow[];
    return parsed.filter((r) => !SEED_LEADERBOARD.some((s) => s.roll === r.roll));
  } catch {
    return [];
  }
}

let cached = SEED_LEADERBOARD;
let hydrated = false;
const listeners = new Set<() => void>();
const emitChange = () => listeners.forEach((l) => l());

function getSnapshot(): AttemptRow[] {
  if (typeof window !== "undefined" && !hydrated) {
    hydrated = true;
    cached = [...SEED_LEADERBOARD, ...loadFromStorage()];
  }
  return cached;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window !== "undefined") {
    getSnapshot(); // hydrate cache before first snapshot is taken
    window.addEventListener("storage", onChange);
  }
  listeners.add(onChange);
  return () => {
    if (typeof window !== "undefined") window.removeEventListener("storage", onChange);
    listeners.delete(onChange);
  };
}

export default function CrackItPage() {
  // Leaderboard = seed board + persisted submissions (external-store read).
  const rows = useSyncExternalStore(subscribe, getSnapshot, () => SEED_LEADERBOARD);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [phase, setPhase] = useState<"form" | "quiz" | "done">("form");
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(Array(SAMPLE_QUESTIONS.length).fill(null));
  const [lastResult, setLastResult] = useState<AttemptRow | null>(null);

  const start = () => {
    if (!name.trim() || !roll.trim()) return;
    setPhase("quiz");
    setCurrent(0);
    setPicks(Array(SAMPLE_QUESTIONS.length).fill(null));
  };

  const pick = (opt: number) => {
    setPicks((prev) => {
      const next = [...prev];
      next[current] = opt;
      return next;
    });
  };

  const score = picks.reduce<number>((acc, p, i) => acc + (p === SAMPLE_QUESTIONS[i].answer ? 100 : 0), 0);

  const submit = () => {
    const timeSec = 130 + Math.floor(Math.random() * 120);
    const attempt: AttemptRow = {
      name: name.trim(),
      roll: roll.trim(),
      score,
      total: SAMPLE_QUESTIONS.length * 100,
      timeSec,
    };
    const next = [
      ...rows.filter((r) => !SEED_LEADERBOARD.some((s) => s.roll === r.roll)),
      attempt,
    ];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in-memory */
    }
    cached = [...SEED_LEADERBOARD, ...next];
    emitChange(); // re-render board from the external store
    setLastResult(attempt);
    setPhase("done");
  };

  const sorted = [...rows].sort((a, b) => b.score - a.score || a.timeSec - b.timeSec);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main style={{ background: "transparent", minHeight: "100vh", padding: "14vh 6% 10vh" }}>
      <style>{POND_ARENA_CSS}</style>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* ── Header ── */}
        <div className="eyebrow">03 — CODING EVENTS</div>
        <h1 style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontWeight: 400, fontSize: "clamp(44px, 7.5vw, 96px)", color: "var(--on-surface)", margin: "12px 0 0", lineHeight: 1, letterSpacing: "-.02em" }}>
          CRACKIT
        </h1>
        <p className="measure" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(14px, 1.6vw, 18px)", color: "var(--on-surface-variant)", lineHeight: 1.75, margin: "20px 0 0" }}>
          Competitive coding rounds run by CSAU. Attempt the live event
          with your name and roll number, revisit stored questions from
          past rounds, and climb the leaderboard.
        </p>
        <div style={{ marginTop: 26 }}><RippleRule /></div>

        {/* ── Current event + assessment ── */}
        <section style={{ marginTop: 40 }}>
          <div className="pa-panel" style={{ padding: "clamp(22px, 4vw, 46px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 22, alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 260px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="chip chip-ink">
                    <span className="chip-dot" data-state="live" />
                    {CURRENT_EVENT.tag}
                  </span>
                  <KoiMark size={34} />
                </span>
                <h2 style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontWeight: 400, fontSize: "clamp(30px, 4vw, 52px)", color: "var(--on-surface)", margin: "16px 0 6px", lineHeight: 1.05 }}>
                  {CURRENT_EVENT.title}
                </h2>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".16em", color: "var(--outline)", textTransform: "uppercase", margin: 0 }}>
                  {CURRENT_EVENT.date} · {CURRENT_EVENT.questions} QUESTIONS · {CURRENT_EVENT.duration}
                </p>
              </div>

              <div style={{ flex: "1 1 320px", maxWidth: 460 }}>
                {phase === "form" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--on-surface-variant)", margin: 0 }}>
                      Enter your student identity to begin the online assessment.
                    </p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      aria-label="Full name"
                      autoComplete="name"
                      className="field pa-field"
                    />
                    <input
                      value={roll}
                      onChange={(e) => setRoll(e.target.value)}
                      placeholder="Roll number"
                      aria-label="Roll number"
                      autoComplete="off"
                      spellCheck={false}
                      className="field pa-field tabular"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <button
                      type="button"
                      onClick={start}
                      disabled={!name.trim() || !roll.trim()}
                      className="pa-btn pa-btn-primary"
                    >
                      BEGIN ASSESSMENT →
                    </button>
                  </div>
                )}

                {phase === "quiz" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".24em", color: "var(--outline)" }}>
                      QUESTION {String(current + 1).padStart(2, "0")} / {String(SAMPLE_QUESTIONS.length).padStart(2, "0")}
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: "var(--on-surface)" }}>
                      {SAMPLE_QUESTIONS[current].q}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {SAMPLE_QUESTIONS[current].options.map((opt, i) => {
                        const selected = picks[current] === i;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => pick(i)}
                            aria-pressed={selected}
                            className="pa-opt"
                          >
                            <span className="pa-opt-key">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                        disabled={current === 0}
                        className="pa-btn"
                      >
                        ← PREV
                      </button>
                      {current < SAMPLE_QUESTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrent((c) => Math.min(SAMPLE_QUESTIONS.length - 1, c + 1))}
                          className="pa-btn"
                        >
                          NEXT →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={submit}
                          className="pa-btn pa-btn-primary"
                        >
                          SUBMIT →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {phase === "done" && lastResult && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontSize: 30, color: "var(--on-surface)" }}>
                      {lastResult.score === lastResult.total ? "PERFECT" : "SUBMITTED"}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: "var(--on-surface)" }}>
                      {lastResult.name} · {lastResult.score} / {lastResult.total} pts
                    </div>
                    {SAMPLE_QUESTIONS.map((q, i) => {
                      const ok = picks[i] === q.answer;
                      return (
                        <div key={q.q} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5, lineHeight: 1.6, color: "var(--on-surface-variant)" }}>
                          <span style={{ color: ok ? "var(--ok)" : "var(--error)", marginRight: 8 }}>{ok ? "✓" : "✕"}</span>
                          {q.q}
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--outline)", marginTop: 3 }}>
                            {ok ? q.explanation : `Correct: ${q.options[q.answer]} — ${q.explanation}`}
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={() => setPhase("form")} className="pa-btn" style={{ marginTop: 4, width: "max-content" }}>
                      BACK TO FORM
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Leaderboard ── */}
        <section style={{ marginTop: 64 }}>
          <div className="eyebrow">LEADERBOARD</div>
          <h2 style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontWeight: 400, fontSize: "clamp(28px, 4vw, 46px)", color: "var(--on-surface)", margin: "10px 0 26px" }}>
            TOP CODEFIGHTERS
          </h2>
          <div style={{ margin: "-10px 0 22px" }}><RippleRule width={180} /></div>
          {/* A real table, not a grid of divs: column headers are exposed
              to assistive tech and the fixed sort order is declared. */}
          <div className="pa-table-wrap" tabIndex={0} role="region" aria-label="Leaderboard">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Codefighter</th>
                  <th scope="col" className="num">Points</th>
                  <th scope="col" className="num" aria-sort="descending">Score</th>
                  <th scope="col" className="num">Time</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const mine = lastResult?.roll === r.roll;
                  return (
                    <tr key={r.roll} data-current={mine ? "true" : undefined}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: i < 3 ? "var(--on-surface)" : "var(--outline)" }}>
                        #{i + 1}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, display: "block" }}>
                          {r.name}
                          {mine && (
                            <span className="pa-you">
                              · YOU
                            </span>
                          )}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--outline)" }}>{r.roll}</span>
                      </td>
                      <td className="num" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.score} pts</td>
                      <td className="num" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{r.score}/{r.total}</td>
                      <td className="num" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(r.timeSec)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Previous question archive ── */}
        <section style={{ marginTop: 64 }}>
          <div className="eyebrow">QUESTION ARCHIVE</div>
          <h2 style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontWeight: 400, fontSize: "clamp(28px, 4vw, 46px)", color: "var(--on-surface)", margin: "10px 0 26px" }}>
            PAST ROUNDS
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {ARCHIVE.map((round) => (
              <details key={round.round} className="pa-panel" style={{ padding: "16px clamp(18px, 3vw, 28px)" }}>
                <summary className="pa-sum">
                  <span className="pa-pad"><LilyPad size={18} /></span>
                  <div style={{ flex: 1, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".24em", color: "var(--outline)", display: "block" }}>
                      {round.round} · {round.date}
                    </span>
                    <span style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontSize: 26, color: "var(--on-surface)", textTransform: "uppercase" }}>
                      {round.event}
                    </span>
                  </div>
                </summary>
                <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
                  {round.questions.map((q, i) => (
                    <div key={q.q} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, lineHeight: 1.6, color: "var(--on-surface-variant)" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--outline)", marginRight: 8 }}>
                        Q{i + 1}
                      </span>
                      {q.q}
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ok)", marginTop: 6 }}>
                        ✓ {q.options[q.answer]}
                      </div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--outline)", marginTop: 2 }}>{q.explanation}</div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
