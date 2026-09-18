# CSAU Main Web — Design Overview

This document captures the current visual direction and page structure of the CSAU website as it exists in the app.

## 1. Design direction — Graphite & Signal

The site is a technical journal on paper, not a dark neon product page. The system is:

- Cool bone paper backgrounds (`--background: #eff0ec`) with white card surfaces
- Near-black graphite ink (`--on-surface: #0f1211`) for type, rules and filled buttons
- Exactly one interactive accent: signal blue (`--signal: #1b4dff`) for links, focus rings, the active tab underline and the live status dot
- Exactly one highlight colour: highlighter yellow (`--marker: #f5e663`) — reserved for the *current / selected* row and nothing else
- Hairline 1px rules (`--outline-variant: #cfd2cb`, ink for emphatic rules) as the primary structural device instead of borders-and-shadows
- Squared geometry: 2px radius on buttons, chips and fields; 4px on panels. No 999px pills anywhere
- Little to no elevation. Panels are flat and hover only darkens the border to ink
- Paper grain and halftone dot fields instead of gradient glow blobs
- Monospace (JetBrains Mono) for every label, chip, status, table cell and eyebrow
- Large, left-aligned display typography (Syne, Kenfolg, Ethnocentric, Sector034) with numbered eyebrows (`01 — WHAT WE RUN`)

Deliberately absent: gradients, glow text-shadows, glassmorphism / backdrop blur, violet-and-cyan accent pairs, pure-white surfaces, and any colour used purely as decoration.

The visual system is designed to feel like a student-run engineering publication with strong campus-tech energy.

### 1.1 Token architecture

`globals.css` is layered so the palette can change in one place:

| Layer | What it holds | Rule |
|-------|---------------|------|
| **Primitive** | Raw values with no meaning: `--gray-150`, `--ink-950`, `--signal-500`, `--marker-300`, `--red-600` | Never referenced by components |
| **Semantic** | Purpose aliases: `--background`, `--on-surface`, `--outline`, `--signal`, `--marker`, `--ok`, `--error`, `--control-border` | What components read |
| **Component** | `--radius-*`, `--rule`, `--dur-*`, `--space-*`, `--tap-min`, `--measure`, `--shadow-pop` | Used by the primitives in section 3 |

No component or page contains a raw palette value. `grep` for `rgba(` or `#hex` across `src/**/*.tsx` returns only deliberate `var(--token, #fallback)` guards; the Three.js and canvas-2D scenes read their colours from the tokens at runtime, so repainting the theme repaints the canvas.

### 1.2 Accessibility contract

The palette is verified, not assumed. `scripts/verify-palette.mjs` computes every text and control-boundary pair and fails the build if any of these slip:

| Pair | Ratio | Requirement |
|------|-------|-------------|
| `--on-surface` on paper | 16.45:1 | 4.5:1 |
| `--on-surface-variant` on paper | 7.31:1 | 4.5:1 |
| `--outline` (all mono labels) on paper | 4.83:1 | 4.5:1 |
| `--outline` on white card | 5.53:1 | 4.5:1 |
| `--signal` on paper | 5.16:1 | 4.5:1 |
| `--control-border` (field edge) on white | 5.53:1 | 3:1 (WCAG 1.4.11) |

`--outline` is at 4.83:1 and must not be lightened — the earlier `#6b7069` sat at 4.42:1 and failed silently. Other standing rules: interactive boxes are ≥44px (`--tap-min`), fields are 16px so iOS does not zoom on focus, `:focus-visible` always draws a 2px signal ring, and `prefers-reduced-motion` disables the loader, the carousel auto-rotate and all transitions.

Light mode only. The E-Ink/paper direction is explicitly a light-mode style; there is no dark theme to keep in sync, and inventing one would reintroduce the neon look this system replaced.

## 2. Current page structure

### Home
Route: /

- Entry sequence: cursor boot preloader → landing gate (`CSAU..` wordmark, hairline rotating rings, ENTER SYSTEM) → zoom into the page
- Then a full-viewport hero (`CSAU..`, the full society name, Chennai eyebrow, scroll cue) and the About section with its typewriter statement and a single `VIEW TEAM` button
- The gate plays once per browser session (`csau-gate-seen` in sessionStorage); later visits land straight on the hero
- Purpose: brand moment plus orientation, not a conversion funnel

### Blog
Route: /blog

- Long-form article and post feed: 8 seeded posts
- Filter tabs: ALL, BLOG, ARTICLE, POST, with a live piece count
- Ruled list rows show kind chip, title, blurb, author, date and read time
- Purpose: publishing and community storytelling

### CrackIt
Route: /crackit

- Coding contest / event page with a live assessment concept
- Includes current event panel, sample questions, leaderboard, and archive sections
- Stores leaderboard entries in local storage
- Purpose: competitive coding and participation funnel

### Events
Route: /events

- Event archive and initiative listing
- Each card includes date, status, summary, and tags
- Purpose: showcase events and community milestones

### Quick Code
Route: /quick-code

- Full-screen interactive contest experience
- Monochrome laser-field hero (the shader is inverted and greyscaled so it stays paper-toned), stats row, this week's challenge panel, leaderboard with column headers, and the previous-challenges archive
- Purpose: weekly competitive coding challenge page

### Team
Route: /team

- Leadership and committee profiles
- Featured members (president and heads) in the full-circle Three.js carousel, then the deputies grid below
- Deputy cards use 4:5 greyscale-until-hover portraits, display-font names, mono role labels and a hairline above the department
- Purpose: humanize the organization and highlight leadership

### Not Found
Route: /not-found

- Custom 404 page
- Purpose: fallback UX for invalid routes

## 3. Shared design patterns

Across the site, these repeated primitives are visible (all defined in `globals.css`):

- **Nav** — a fixed square `.ln-toggle` button (mono `NAV` label, inverts to ink on hover) opening the fullscreen `.ln-overlay`
- **Page header** — numbered `.eyebrow`, display-font `<h1>`, a short description capped at ~60ch, then a hairline rule
- **`.panel`** — the one surface: white, 1px `--outline-variant` border, 4px radius, flat. `.clay-card` and `.holo-card` are legacy aliases that now resolve to this
- **`.btn` / `.btn-primary` / `.btn-signal` / `.btn-ghost`** — squared, mono uppercase, hairline ink border, ink invert on hover, ≥44px tall. One primary per view
- **`.chip`** — square mono tag; `.chip-ink`, `.chip-signal`, `.chip-marker` variants; `.chip-dot` with `data-state="live|open|closed"` for status
- **`.tabs` / `.tab`** — mono filter labels on a rule, active one takes a 2px signal underline; each tab is a ≥44px touch target
- **`.data-table`** — ruled rows, tabular figures, right-aligned `.num`, `[data-current]` row takes the highlighter fill. Both leaderboards (CrackIt, Quick Code) are real `<table>`s with `scope="col"` headers and a declared `aria-sort`, not grids of divs
- **`.field`** — 16px input, `--control-border` edge, ink border plus a signal underline on focus
- **`.eyebrow`, `.tabular`, `.colophon`** — mono index labels, tabular numerals, type-spec line
- **`.measure`** — caps prose at `--measure` (65ch); page intros and body copy reference it instead of pixel widths
- **`.rule`, `.rule-ink`, `.rule-v`** — hairlines; **`.halftone`, `.halftone-ink`** — dot fields
- **Paper grain** — a single fixed `body::after` turbulence layer at 4%, applied from CSS so no page needs to render it
- **`.photo-mono`** — portraits are greyscale until hovered
- **Motion** — `--dur-fast: 150ms` / `--dur-base: 220ms`, exits shorter than enters, transform/opacity only, ≤10px travel, and a 30–50ms stagger between list items. No page animates every section on scroll
- No footer component exists yet; the landing footline is a mono HUD line

### 3.1 Verified in a browser

Four headless suites assert this system rather than describing it — `verify-palette` (tokens, contrast, square primitives, touch heights), `verify-pages` (gate, nav overlay, canvas mounts, per-page background), `verify-team` (carousel + deputies) and `verify-preloader` (boot gate and CTA). Run them with `npm run dev` on :3000.

## 4. Content and tone

The site communicates:

- Innovation and technical excellence
- High-energy student community culture
- Campus-first identity with an engineering-publication feel
- Strong emphasis on coding, events, learning, and inclusion
- Copy is dry and specific, sentence case in prose, no exclamation marks, emoji or hyped filler ("elevate your journey" style strings are treated as bugs)
- **The identity is the Computer Society of Anna University** (CSAU) — not "the Computer Science Association". Every user-facing string now spells the name out in full; the acronym is only ever used on its own or as `CSAU // CEG`
- **Almost none of the shipped data is verified.** Team, events, leaderboards, blog bylines and stats are illustrative placeholder content. See *Content audit* under Known gaps before the site is treated as a public record of the society

## 5. Current route map

- / — Home
- /blog — Blog
- /crackit — CrackIt
- /events — Events
- /quick-code — Quick Code
- /team — Team
- /not-found — 404 fallback

The numbered eyebrows follow that order: `01 — WHAT WE RUN` (/events), `02 — WRITING` (/blog), `03 — CODING EVENTS` (/crackit), `04 — COMPETITIVE ARENA` (/quick-code). The sequence is not yet complete — Home carries no numbered eyebrow and `/team` uses an unnumbered one (`SUPPORT CREW`).

## 6. Notes

This document reflects the current state of the app in the source tree and should be updated if new pages or major UI changes are introduced.

The palette is enforced by `scripts/verify-palette.mjs`, which asserts the token values, WCAG contrast for every text pair, the absence of the legacy cyan/magenta/neon tokens, paper backgrounds on every page, the quick-code CTA spec, square primitives, 44px touch heights and the nav overlay treatment. Update that script whenever a token changes, or the checks will fail by design.

### Known gaps

- **`/team` has no `<h1>`.** Every other route has one (Home gets it from the hero). The page's first heading is the `DEPUTIES` `<h2>`, so assistive tech sees a skipped level. Fixing it means the page needs a real title above the carousel — new visible content, which was out of scope for a refinement pass that was explicitly asked not to add things.
- **CrackIt's assessment fields are labelled by placeholder + `aria-label`.** A visible `<label>` per field would be better UX, but adds visible chrome to an existing panel.
- **No skip-to-content link.** A visually-hidden one would be the standard fix; again, an added element rather than a refinement.

### Settled: identity scope and tagline

Both were decided from primary sources rather than preference, in September 2026.

**Scope — CSAU is a CEG club, and `// CEG` stays.** CEG's official clubs page describes it as *"one of the oldest and most prominent technical clubs at the College of Engineering, Guindy"*, functioning under the **Ramanujan Computing Centre** with the aim of *"extending computer science knowledge beyond traditional CS and IT disciplines"* (https://ceg.annauniv.edu/clubs.html). CSAU's own site says the same: *"one of CEG's oldest technical clubs, functioning under Ramanujan Computing Centre"* (https://www.csau.in). So the `CSAU // CEG` tags on the preloader, landing HUD and boot caret line are correct, and "of Anna University" is the society's formal name rather than a claim of university-wide reach. This also retroactively explains two things that looked like errors: the team roster spanning Mechanical, ECE and EEE, and the embedded/Firmware events — reaching beyond CS and IT is the society's stated aim, not a misfiling.

**Tagline — `Build. Break. Ship.`** It was already the site's public identity: it is the meta description, which is what search results and link previews show, and the About paragraph already carries the same triad ("writes, breaks, and ships"). The one-off `CODE // BUILD // BREAK` on the landing gate is retired; the gate now reads `BUILD // BREAK // SHIP` so the wording matches everywhere while the monospace slash lockup keeps its rhythm. Note this is the *site's* tagline, not CSAU's own — the society's public lines elsewhere are "Tech - for everyone" (Instagram bio) and "The Oldest Technical Society of The Oldest Technical…" (LinkedIn billing line, truncated in the listing).

### Content audit — claims the code cannot back

A copy pass over every route found one naming error (now fixed) and a set of statements that present placeholder data as fact. These are content problems, not design ones, and none of them was changed, because correcting them needs real chapter data rather than a code edit.

| Where | The claim | Status |
|-------|-----------|--------|
| `/team` + `/blog` bylines | 22 named officers (President, Co-President, 8 Heads, 12 Deputies) with `pravatar.cc` stand-in portraits | Invented. Presented as the real committee — the highest-risk item on the site |
| Team cards | `X / TWITTER`, `LINKEDIN`, `GITHUB` chips | Not links — `<span>`s with `cursor: pointer` and no `href`, and `members.ts` carries no URL field to wire up. They advertise a social presence that cannot be clicked |
| `/events` | 8 events with exact dates and attendance (`HackCEG 6.0`, `412 HACKERS`; `Byte Me`, `286 REGISTERED`; `DevCon CEG`; `Socket Wars`; `Firmware Fridays`), introduced as "every event we have run" | Unverified. `HackCEG` in particular may be a college-wide event rather than a CSAU one |
| `/quick-code` | `WEEK 12`, `1,248 QUICKCODERS PARTICIPATING`, weeks 9–11 with participant counts, top-3 leaderboard | Invented sample data |
| `/crackit` | `LOGIC LIFT-OFF`, `SEP 2026`, `45 MIN`, seeded leaderboard rows with names and roll numbers | Mock data — the file header calls it a "frontend mock" |
| `AboutSection` | "a student-run collective" | Supported — `csau.in` calls it "a student club functioning under the Ramanujan Computing Centre". Left as is; only the scope claim in that paragraph ("Anna University's computer science community" → "CEG's") was tightened |

Not a problem, for the record: `CEG · ANNA UNIVERSITY · CHENNAI` (hero) and `CSAU // CEG · ANNA UNIV` (landing HUD) are consistent with each other, and the meta description, `<title>` and About paragraph all now name the society correctly.

### Changelog

- **2026-09 — scope and tagline settled.** Confirmed from CEG's official clubs page and `csau.in` that CSAU is a technical club **at CEG** working under the Ramanujan Computing Centre, so the `// CEG` tags stay and the About paragraph's overreach ("Anna University's computer science community") was narrowed to "CEG's". Picked **`Build. Break. Ship.`** as the single tagline — it was already the meta description — and retired the landing gate's conflicting `CODE // BUILD // BREAK` in favour of `BUILD // BREAK // SHIP`. Both decisions and their sources are recorded under *Settled* above.

- **2026-09 — identity correction and copy audit.** Corrected the organisation name: the site called itself "THE COMPUTER SCIENCE ASSOCIATION" in three display lockups (hero subtitle, About heading, boot-preloader caret line) when the society is the **Computer Society of Anna University**. The hero string is now title case in source and uppercased by CSS as before; the About heading and preloader line keep literal uppercase because neither has a `text-transform` rule and their source casing is what renders. Also audited every user-facing string across all routes — see *Content audit* above for the unverified placeholder claims that the pass surfaced.

- **2026-09 — skill pass.** Applied the `ui-ux-pro-max` / `design-system` / `ui-styling` / `brand` / `ponytail` design rules on top of the palette: split the tokens into primitive → semantic → component layers, darkened `--outline` from `#6b7069` to `#656a63` (it was failing 4.5:1 on paper at 4.42:1), gave field borders the 3:1 `--control-border` edge, raised every interactive box to the 44px minimum, set field type to 16px to stop iOS zoom-on-focus, moved motion onto 150ms tokens with a 45ms stagger, converted both leaderboards to real tables, replaced pixel measures with a 65ch `.measure`, retired the last hardcoded palette values from the Three.js and canvas scenes, and wired the paper grain in from CSS. The engine's own reading of this content came back as the **E-Ink / Paper** style — paper-like, matte, high contrast, texture, calm, slow tech, monochrome, WCAG AAA — which is the direction above; its *suggested palette* (warm brown on cream with an indigo accent) and fonts (Exo + Roboto Mono) were declined because the colour scheme and typefaces are already decided, and re-picking them would be a redesign, not a refinement.

- **2026-09 — Graphite & Signal.** Replaced the purple/near-black neon direction and the lavender-tinted "Sculptural Tactility" pass with the paper + graphite + single signal-blue system described in section 1. Removed `--color-cyan`, `--color-magenta`, all `--color-neon-*` aliases, `.glow-cyan`, `.glow-magenta`, `.neon-flicker` and the 999px pill / backdrop-blur / clay-shadow card vocabulary. Dropped the `/blogs`, `/join`, `/practicehub` and `/projects` sections from this document because those routes no longer exist in the source tree.
