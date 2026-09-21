import Link from "next/link";
import AstronautScene from "@/components/AstronautScene";

export default function NotFound() {
  return (
    <main className="pg" style={{ position: "relative" }}>
      <AstronautScene />
      <div className="pg-in">
        <div className="eyebrow">Error 404</div>
        <h1 className="pg-title">
          Page not <span style={{ color: "var(--signal)" }}>found</span>
        </h1>
        <p className="pg-lede">That page doesn&apos;t exist. Check the URL, or head back to the start.</p>
        <p className="pg-next">
          <Link href="/" className="btn btn-primary">
            Back to home →
          </Link>
        </p>
      </div>
    </main>
  );
}
