import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6" style={{ background: "#050507" }}>
      <p className="text-[10px] tracking-[0.35em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(0,240,255,0.6)" }}>
        SIGNAL LOST · SECTOR UNKNOWN
      </p>
      <h1 className="text-6xl sm:text-7xl font-bold glow-cyan" style={{ fontFamily: "'Zen Dots', sans-serif" }}>
        404
      </h1>
      <p className="max-w-sm" style={{ color: "rgba(205,211,239,0.5)" }}>
        This sector of the digital realm hasn&apos;t been charted yet.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-3 px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-cyan/10"
        style={{ border: "1px solid #00f0ff", color: "#00f0ff" }}
      >
        RETURN TO THE REALM →
      </Link>
    </main>
  );
}
