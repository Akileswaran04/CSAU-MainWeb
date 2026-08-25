import type { Metadata } from "next";
import SubpageShell from "@/components/SubpageShell";
import JoinForm from "@/components/JoinForm";

export const metadata: Metadata = {
  title: "The Portal — Join CSAU",
  description:
    "Become part of the realm. Learn. Build. Experiment. Share. Connect. Shape what comes next.",
};

export default function JoinPage() {
  return (
    <SubpageShell label="OPENING PORTAL · SECTOR 07">
      <div className="px-5 sm:px-8 lg:px-12 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <header className="text-center mb-14">
        <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
          07 · THE PORTAL
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-[family-name:var(--font-display)] leading-[1.05] glow-cyan">
          Become part
          <br />
          of the realm.
        </h1>
        <p className="mt-6 text-foreground/50 max-w-md mx-auto leading-relaxed">
          Learn. Build. Experiment. Share. Connect. Shape what comes next.
        </p>
        <div className="section-divider mt-8" />
      </header>

      <div className="max-w-xl mx-auto">
        <JoinForm />
      </div>
      </div>
    </SubpageShell>
  );
}
