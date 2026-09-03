import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ background: "var(--background)" }}
    >
      <p
        className="text-xs tracking-widest uppercase"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          color: "var(--outline)",
          letterSpacing: "0.15em",
        }}
      >
        SIGNAL LOST · SECTOR UNKNOWN
      </p>
      <h1
        className="text-6xl sm:text-7xl font-bold"
        style={{
          fontFamily: "'Kenfolg', 'Syne', sans-serif",
          fontWeight: 400,
          color: "var(--primary)",
        }}
      >
        404
      </h1>
      <p
        className="max-w-sm"
        style={{
          color: "var(--on-surface-variant)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        This sector of the digital realm hasn&apos;t been charted yet.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-3 px-8 py-3 font-medium transition-all duration-300"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.1em",
          color: "var(--on-primary)",
          background: "var(--primary)",
          border: "none",
          borderRadius: 999,
          textDecoration: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
        }}
      >
        RETURN TO THE REALM →
      </Link>
    </main>
  );
}
