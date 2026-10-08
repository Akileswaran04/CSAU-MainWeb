import "./blog-page.css";

/* ============================================================
   BLOG - loading state: the receiver scanning the band.
   A sweep line runs down an empty waterfall while faint carriers
   flicker in and out. Reduced motion: a still band.
   ============================================================ */

export default function BlogLoading() {
  return (
    <main className="pg bl-page" aria-busy="true">
      <div className="bl-scope bl-scope-scan" aria-hidden>
        {[12, 31, 47, 66, 83].map((x, i) => (
          <span key={x} className="bl-scope-carrier" style={{ left: `${x}%`, animationDelay: `${i * 0.37}s` }} />
        ))}
        <p className="bl-scope-label bl-scope-label-scan">Scanning</p>
      </div>
      <span className="sr-only" role="status">
        Loading blog posts
      </span>
    </main>
  );
}
