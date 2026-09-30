"use client";

import { useRef, useSyncExternalStore, useState } from "react";
import { ProbeMark } from "@/components/SpaceOrnaments";
import { ARENA_CSS } from "../arena-css";

/* ============================================================
   CRACKIT - a practice round in the browser

   • A short set of sample questions (name + roll to begin)
   • Your own attempts, kept in this browser's localStorage
   Nothing here is a real event, result or participant: there is
   no shared leaderboard and no past-round archive until real
   rounds exist in the CMS.
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
    q: "int x = 5; cout << x + 10; - what prints?",
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

const STORAGE_KEY = "csau-crackit-leaderboard-v1";

/* ── localStorage-backed store of this browser's attempts (external system read) ── */
const NO_ATTEMPTS: AttemptRow[] = [];

function loadFromStorage(): AttemptRow[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return NO_ATTEMPTS;
    return JSON.parse(raw) as AttemptRow[];
  } catch {
    return NO_ATTEMPTS;
  }
}

let cached = NO_ATTEMPTS;
let hydrated = false;
const listeners = new Set<() => void>();
const emitChange = () => listeners.forEach((l) => l());

function getSnapshot(): AttemptRow[] {
  if (typeof window !== "undefined" && !hydrated) {
    hydrated = true;
    cached = loadFromStorage();
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
  // This browser's own attempts (external-store read). There is no shared board.
  const rows = useSyncExternalStore(subscribe, getSnapshot, () => NO_ATTEMPTS);
  const startedAt = useRef(0);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [phase, setPhase] = useState<"form" | "quiz" | "done">("form");
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(Array(SAMPLE_QUESTIONS.length).fill(null));
  const [lastResult, setLastResult] = useState<AttemptRow | null>(null);

  const start = () => {
    if (!name.trim() || !roll.trim()) return;
    startedAt.current = Date.now();
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
    const timeSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const attempt: AttemptRow = {
      name: name.trim(),
      roll: roll.trim(),
      score,
      total: SAMPLE_QUESTIONS.length * 100,
      timeSec,
    };
    // one row per roll number: a new attempt replaces the earlier one
    const next = [...rows.filter((r) => r.roll !== attempt.roll), attempt];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable - keep in-memory */
    }
    cached = next;
    emitChange(); // re-render the list from the external store
    setLastResult(attempt);
    setPhase("done");
  };

  const sorted = [...rows].sort((a, b) => b.score - a.score || a.timeSec - b.timeSec);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="pg">
      <style>{ARENA_CSS}</style>
      <div className="pg-in">
        {/* ── Header ── */}
        <div className="eyebrow">Practice</div>
        <h1 className="pg-title">Crackit</h1>
        <p className="pg-lede">
          A practice round in the CrackIT format: a short set of sample
          questions, scored as soon as you submit. Your attempts are kept
          in this browser only.
        </p>

        {/* ── Practice round ── */}
        <section style={{ marginTop: 40 }}>
          <div className="pa-panel" style={{ padding: "clamp(22px, 4vw, 46px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 22, alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 260px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="chip chip-ink">
                    <span className="chip-dot" data-state="open" />
                    PRACTICE
                  </span>
                  <ProbeMark size={34} />
                </span>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(30px, 4vw, 52px)", color: "var(--on-surface)", margin: "16px 0 6px", lineHeight: 1.05 }}>
                  PRACTICE ROUND
                </h2>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".16em", color: "var(--outline)", textTransform: "uppercase", margin: 0 }}>
                  {SAMPLE_QUESTIONS.length} SAMPLE QUESTIONS · UNTIMED
                </p>
              </div>

              <div style={{ flex: "1 1 320px", maxWidth: 460 }}>
                {phase === "form" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--on-surface-variant)", margin: 0 }}>
                      Enter a name and roll number to begin. They stay in this browser.
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
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <button
                      type="button"
                      onClick={start}
                      disabled={!name.trim() || !roll.trim()}
                      className="pa-btn pa-btn-primary"
                    >
                      BEGIN PRACTICE →
                    </button>
                  </div>
                )}

                {phase === "quiz" && (
                  <div style={{ display: "grid", gap: 14 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".24em", color: "var(--outline)" }}>
                      QUESTION {String(current + 1).padStart(2, "0")} / {String(SAMPLE_QUESTIONS.length).padStart(2, "0")}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: "var(--on-surface)" }}>
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
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--on-surface)" }}>
                      {lastResult.score === lastResult.total ? "PERFECT" : "SUBMITTED"}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--on-surface)" }}>
                      {lastResult.name} · {lastResult.score} / {lastResult.total} pts
                    </div>
                    {SAMPLE_QUESTIONS.map((q, i) => {
                      const ok = picks[i] === q.answer;
                      return (
                        <div key={q.q} style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.6, color: "var(--on-surface-variant)" }}>
                          <span style={{ color: ok ? "var(--ok)" : "var(--error)", marginRight: 8 }}>{ok ? "✓" : "✕"}</span>
                          {q.q}
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--outline)", marginTop: 3 }}>
                            {ok ? q.explanation : `Correct: ${q.options[q.answer]} - ${q.explanation}`}
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

        {/* ── Your attempts (this browser only) ── */}
        <section style={{ marginTop: 64 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(28px, 4vw, 46px)", color: "var(--on-surface)", margin: "10px 0 12px" }}>
            YOUR ATTEMPTS
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, lineHeight: 1.6, color: "var(--on-surface-variant)", margin: "0 0 26px" }}>
            {sorted.length > 0
              ? "Saved in this browser only. There is no shared leaderboard."
              : "No attempts yet. Finish the practice round and your score appears here, saved in this browser only."}
          </p>
          {/* A real table, not a grid of divs: column headers are exposed
              to assistive tech and the fixed sort order is declared. */}
          {sorted.length > 0 && (
          <div className="pa-table-wrap" tabIndex={0} role="region" aria-label="Your attempts">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Name</th>
                  <th scope="col" className="num">Points</th>
                  <th scope="col" className="num col-score" aria-sort="descending">Score</th>
                  <th scope="col" className="num">Time</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const mine = lastResult?.roll === r.roll;
                  return (
                    <tr key={r.roll} data-current={mine ? "true" : undefined}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: i < 3 ? "var(--on-surface)" : "var(--outline)" }}>
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
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--outline)" }}>{r.roll}</span>
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{r.score} pts</td>
                      <td className="num col-score" style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{r.score}/{r.total}</td>
                      <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmt(r.timeSec)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </section>
      </div>
    </main>
  );
}
