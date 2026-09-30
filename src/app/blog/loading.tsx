/* ============================================================
   BLOG - loading state.
   Shown while the server component fetches the live Medium feed.
   A ruled skeleton that mirrors the real layout, so the page
   doesn't jump when the posts arrive.
   ============================================================ */

export default function BlogLoading() {
  return (
    <main className="pg" aria-busy="true">
      <div className="pg-in">
        <header className="bl-head">
          <div className="eyebrow">Writing</div>
          <h1 className="pg-title">Blog</h1>
          <p className="pg-lede">Loading the latest signals from the crew…</p>
        </header>

        <div className="bl-tabs" aria-hidden>
          <span className="bl-skel bl-skel-tab" />
          <span className="bl-skel bl-skel-tab" />
          <span className="bl-skel bl-skel-tab" />
        </div>

        <div className="bl-grid" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className="bl-card bl-card-skel">
              <div className="bl-skel bl-skel-media" />
              <div className="bl-card-body">
                <span className="bl-skel bl-skel-line" style={{ width: "40%" }} />
                <span className="bl-skel bl-skel-line" style={{ width: "90%", height: 20 }} />
                <span className="bl-skel bl-skel-line" style={{ width: "70%", height: 20 }} />
                <span className="bl-skel bl-skel-line" style={{ width: "100%" }} />
                <span className="bl-skel bl-skel-line" style={{ width: "60%" }} />
              </div>
            </article>
          ))}
        </div>

        <span className="sr-only" role="status">
          Loading blog posts
        </span>
      </div>
    </main>
  );
}
