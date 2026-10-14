import type { Metadata } from "next";
import { ARENA_CSS, QUICK_CODE_CSS } from "../arena-css";
import { QC_ABOUT, QC_WEEKS } from "@/data/quickCode";
import QuickCodeArchive from "./QuickCodeArchive";

/* ============================================================
   QUICK CODE - 5 Questions. 5 Minutes. One Chance.

   The five-week archive, played week by week in QuickCodeArchive,
   then the About doc + poster (the owner removed the hero). All copy is from
   src/data/quickCode.ts (the archive's own documents).

   Route: /quick-code
   ============================================================ */

export const metadata: Metadata = {
  title: "Quick Code // CSAU - Computer Society of Anna University",
  description: QC_ABOUT.paragraphs[0],
};

export default function QuickCodePage() {
  return (
    <>
      <style>{ARENA_CSS + QUICK_CODE_CSS}</style>

      {/* ── ARCHIVE: the five weeks as a console ── */}
      <section id="archive" className="qc-sec" style={{ paddingTop: "clamp(96px, 14vh, 140px)" }}>
        <h1 className="sr-only">Quick Code</h1>
        <QuickCodeArchive weeks={QC_WEEKS} />
      </section>

      {/* ── ABOUT: the About doc, verbatim, beside the poster ── */}
      <section id="about" className="qc-sec">
        <div className="qc-wrap">
          <h2 className="qc-h2">ABOUT</h2>
          <div className="qc-about">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="qc-img"
              src={QC_ABOUT.poster.src}
              width={QC_ABOUT.poster.width}
              height={QC_ABOUT.poster.height}
              alt="Quick Code poster"
              loading="lazy"
              decoding="async"
            />
            <div className="qc-text">
              <span className="qc-k">{QC_ABOUT.title}</span>
              {QC_ABOUT.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
