import Link from "next/link";
import { RippleRule, KoiMark } from "@/components/PondOrnaments";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ background: "transparent" }}
    >
      <p className="eyebrow">ERR 404 · NO ROUTE MATCHED</p>
      <h1
        className="text-6xl sm:text-7xl font-bold"
        style={{
          fontFamily: "'Kenfolg', 'Syne', sans-serif",
          fontWeight: 400,
          color: "var(--on-surface)",
          margin: 0,
        }}
      >
        4<span style={{ color: "var(--signal)" }}>0</span>4
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: "100%" }}>
        <RippleRule width={160} />
        <KoiMark size={34} />
      </div>
      <p
        className="max-w-sm"
        style={{
          color: "var(--on-surface-variant)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        That page doesn&apos;t exist. Check the URL, or head back to the start.
      </p>
      <Link href="/" className="btn btn-primary mt-2">
        BACK TO HOME →
      </Link>
    </main>
  );
}
