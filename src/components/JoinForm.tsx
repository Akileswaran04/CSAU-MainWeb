"use client";

import { useState } from "react";
import clsx from "clsx";

/* ============================================================================
   JOIN FORM — shared by the Portal section (home) and the /join route.
   Currently mock-submitting; wire `handleSubmit` to a backend/API later.
   ========================================================================== */

const interestOptions = [
  "AI / ML",
  "Web Dev",
  "Data Science",
  "Coding & CP",
  "Cybersecurity",
  "Cloud & DevOps",
  "UI / UX",
  "Open Source",
];

export default function JoinForm() {
  const [form, setForm] = useState({ name: "", email: "", dept: "", interests: [] as string[] });
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST to a real endpoint when the backend exists.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="holo-card rounded-xl p-8 text-center" role="status">
        <div className="text-5xl mb-4">✨</div>
        <h3 className="text-2xl font-bold font-[family-name:var(--font-display)] text-cyan mb-2">
          Welcome to the Realm
        </h3>
        <p className="text-foreground/60">
          Your application has been received. We&apos;ll be in touch soon!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="holo-card rounded-xl p-8 space-y-6">
      <h3 className="text-xl font-semibold font-[family-name:var(--font-display)] text-foreground/90">
        Join CSAU
      </h3>

      <div>
        <label htmlFor="join-name" className="block text-sm text-foreground/50 mb-1">
          Name
        </label>
        <input
          id="join-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground/90 placeholder:text-foreground/30 focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30 transition-all"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="join-email" className="block text-sm text-foreground/50 mb-1">
          Email
        </label>
        <input
          id="join-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground/90 placeholder:text-foreground/30 focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30 transition-all"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="join-dept" className="block text-sm text-foreground/50 mb-1">
          Department / Year
        </label>
        <input
          id="join-dept"
          type="text"
          value={form.dept}
          onChange={(e) => setForm({ ...form, dept: e.target.value })}
          className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground/90 placeholder:text-foreground/30 focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30 transition-all"
          placeholder="e.g. CSE, 3rd Year"
        />
      </div>

      <fieldset>
        <legend className="block text-sm text-foreground/50 mb-2">Areas of Interest</legend>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <button
              key={interest}
              type="button"
              aria-pressed={form.interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer",
                form.interests.includes(interest)
                  ? "bg-cyan/20 text-cyan border-cyan/40"
                  : "text-foreground/40 border-foreground/10 hover:border-foreground/30"
              )}
            >
              {interest}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        data-cursor="ENTER"
        className="w-full py-3 bg-cyan/10 border border-cyan/40 text-cyan rounded-lg font-medium hover:bg-cyan/20 transition-all duration-300 animate-pulse-cyan cursor-pointer"
      >
        Submit Application →
      </button>
    </form>
  );
}
