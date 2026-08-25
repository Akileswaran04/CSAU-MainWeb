import Link from "next/link";

/* Lost in the realm — 404 keeps the Digital Realm identity. */
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6 bg-[#090714]">
      <p className="text-[10px] tracking-[0.35em] uppercase text-cyan/60 font-[family-name:var(--font-geist-mono)]">
        SIGNAL LOST · SECTOR UNKNOWN
      </p>
      <h1 className="text-6xl sm:text-7xl font-bold font-[family-name:var(--font-display)] glow-cyan">
        404
      </h1>
      <p className="text-foreground/50 max-w-sm">
        This sector of the digital realm hasn&apos;t been charted yet.
      </p>
      <Link
        href="/"
        data-cursor="ENTER"
        className="mt-2 inline-flex items-center gap-3 px-8 py-3 border border-cyan rounded-lg text-cyan font-medium hover:bg-cyan/10 transition-all duration-300"
      >
        RETURN TO THE REALM →
      </Link>
    </main>
  );
}
