# CSAU Main Web — Design Overview

The current visual direction and structure of the CSAU site. The code is the source of truth; this file describes it.

## 1. Direction — Deep Space Network

Pitch-black space with graphite surfaces and warm starlight ink. No teal, green or purple anywhere in the interface. Colour carries meaning, not decoration:

| Token | Value | Meaning |
|-------|-------|---------|
| `--space-black` | `#000000` | The 3D scenes, the star backdrop and the boot screen: pitch black |
| `--void-950` | `#0a0a0b` | UI surfaces. Neutral near-black |
| `--hull-900` / `--hull-700` | `#17181c` / `#2f3238` | Panels, board surface, model bodies |
| `--starlight` | `#f6f1e4` | Text and stars |
| `--dim-300` | `#a3a8b0` | Labels, hairlines, unpowered parts |
| `--signal` | `#ee5b3a` | The power current only (plus the interactive accent) |
| `--lit` | `#f0b73a` | Something that has been powered or is active |

Rules: hairline 1px rules, mono telemetry labels, coordinates, numbered eyebrows (`01 / SIGNAL CHECK`), left-aligned asymmetric layouts. No gradients or glow text in the UI, no glassmorphism, purple or identical card grids. The 3D space itself is realistic (lit planet, nebula sky, ship, saucer) but stays inside the palette: every colour is derived from the tokens. Square geometry (2–4px radii). Flat panels; only overlays lift.

Tone: dry, no exclamation marks, no emoji. The story reads as a signal route: "Follow the signal", "Join the crew".

### 1.1 Token architecture

`src/app/globals.css` is layered:

| Layer | Holds | Rule |
|-------|-------|------|
| Primitive | Raw values: `--gray-*`, `--ink-950`, `--void-950`, `--hull-*`, `--dim-300`, `--starlight`, `--signal-*`, `--lit-*` | Not referenced by components except the space tokens above |
| Semantic | Purpose aliases: `--surface*`, `--on-surface*`, `--outline*`, `--signal`, `--lit`, `--ok`, `--error*` | Components read from here |

Three.js and canvas scenes read the same tokens at runtime (`src/components/space/tokens.ts`, `readPalette` in `space2d.ts`), so re-theming needs no scene changes.

## 2. Type

Two families, nothing else:

- **Ethnocentric** (`/public/fonts/Ethnocentric-Regular.otf`, `--font-display`) — the wordmark and big headlines. Single weight; never bold it.
- **JetBrains Mono** (`next/font`, `--font-mono`) — everything else. Body copy 15–16px at a 65ch measure (`--measure`).

Interactive targets keep a 44px minimum (`--tap-min`). Canvas text resolves the mono family through `--font-jetbrains`.

## 3. Motion and scroll

- Micro-interactions 90–220ms (`--dur-*`); exits shorter than entrances.
- Every animation has a `prefers-reduced-motion` path: the intro lights C, S, A, U in sequence with no travel, the story scene stops damping, the backdrop is a still star field.
- **One scroll lock.** `src/lib/scrollLock.ts` is reference-counted (`lockScroll()` returns a release function) and toggles `html.scroll-locked`; it also stops/starts Lenis. The boot gate, the route loader and the nav overlay all use it. Nothing writes `body.style.overflow`. `body` uses `overflow-x: clip` so it never becomes a scroll container and `position: sticky` (the story stage) keeps working.

## 4. Home page flow

1. **Boot preloader** (`CursorBootPreloader`) — a probe crosses a fixed star field, CSAU comes online letter by letter, `UplinkLoader` shows real load progress. Plays once per session (`sessionStorage` key `csau-gate-seen`).
2. **Start** (`LandingPage` + `space/PowerOnIntro.tsx`) — real 3D. Standby shows one thing: the start button (a real `<button aria-label="Start">` over the 3D model) with a faint radar ping. Pressing it removes the button and flies the camera out into a star warp past the particle Earth, a ship that the camera overtakes, and a saucer with a tractor beam (streaks come from one shader uniform). Out of the dark C, S, A and U appear one at a time (dim, one flicker, steady amber, lit through material emissive), each joined to the last by a hairline link. When U connects a pulse runs C to U and the camera goes through the wordmark (~3.6s); `HomeClient` then runs its 1.3s zoom into the hero. Telemetry and SKIP appear only once it is running. Restrained bloom on desktop only; mobile drops dpr, bloom and star count. Reduced motion: no flight, letters light in sequence and the links appear.
3. **Hero** — left-aligned wordmark and telemetry, radar rings.
4. **Story** (`story/StorySection` + `story/SpaceScene.tsx`) — from Earth to the Sun, on a spaceship. A rotating particle Earth (tens of thousands of tetrahedra: oceans, land, polar ice, a cloud layer, an atmosphere) sits in pitch-black space with satellites orbiting it. A ship leaves it and follows a route through every stop in `stops.ts` (order and weights unchanged). Scroll drives the ship; the camera runs ahead of it looking back, so Earth recedes behind it, then swings round to chase it over the last stops as the Sun comes into view. Along the way: a belt of asteroids, saucers hovering to the side and one sweeping across the ship's path. The route line and the stop beacons light amber as the ship reaches them.

## 5. 3D models

No model files, no textures. Everything is built in three.js. `space/bodies.tsx`: `EarthModel` (particle planet: layout computed once on the CPU, spun on the GPU), `SunModel` (fbm granulation, limb darkening, billboarded corona), `ShipModel` (fuselage, swept wings, tail, animated engine flames, blinking nav lights), `UfoModel` (lens hull, glass dome, chasing rim lights, optional beam), `AsteroidField` (lumpy instanced rocks). `space/models.tsx`: `SatelliteModel`, `PowerButtonModel`. `space/Bloom.tsx`: restrained bloom, desktop only. Geometry is built once and disposed on unmount; colours read the tokens; mobile lowers particle counts, segments and noise octaves.

## 6. Pages

| Route | Notes |
|-------|-------|
| `/` | Boot → start → hero → story |
| `/team` | `TeamCarousel`: a 3D ring of member panels around a CSAU totem, two satellites orbiting the floor rings |
| `/events`, `/blog` | Archive panels with radar-ping hover (`space-panel`) |
| `/crackit`, `/quick-code` | Arena pages (`arena-css.ts`); quick-code hero uses CSS radar rings |
| not-found | Ping rule and probe mark |

Navigation is the fullscreen `LaserNav` overlay: a probe wanders the void and flies to the hovered link. Travelling by nav or `[data-route-load]` CTAs plays `RouteLoadGate` / `LoadingOverlay` (~5s, unchanged behaviour).

## 7. Verification

- `npm run lint`, `npm run build`
- `node scripts/verify-palette.mjs [url]` — tokens, WCAG contrast, two-font rule on every route, `overflow-x: clip`
- `node scripts/verify-intro.mjs [url] [shotsDir]` — intro end to end, scroll after handoff, every route on desktop and mobile widths, overlapping locks (nav + intro, nav + route loader)

Both scripts need the site running (`npm run start` or `npm run dev`) and Chrome at the path set in the script.

## 8. Update: planets, the ship, mobile and the dev-mode fix

**Route.** The story now runs Earth, then a flyby of Venus, an asteroid belt with saucers, a flyby of Mercury, and the Sun. The start page shows Earth's limb rising behind the Start button; the story begins with the ship leaving Earth.

**Particle planets** (`space/bodies.tsx`, `ParticlePlanet`): Earth, Venus, Mercury and the Sun are all spheres of tetrahedron particles on an even (jittered Fibonacci) lattice. Colours come from 3D noise: Earth has continents, coastlines, deserts, ice caps and a cloud layer; Venus has swirling sulphur cloud; Mercury has craters; the Sun has granulation, sunspots and a particle corona. A vertex shader lights each particle from the Sun (day side, terminator, dark night side, limb glow). `grain` shrinks the particles for planets seen close up (the start-page Earth).

**Ship.** An X-wing style fighter: long nose, cockpit, astromech, four S-foil wings with engine pods and laser cannons, animated engine flames.

**Mobile (phones first).**
- Story: the scene fills the top of the screen, the copy is a solid panel below it (`max(46%, 340px)`), buttons are 44px and stack full width, the section rail is a thin strip with 44px targets.
- Pages (`.pg`): one column, 16px body copy, 44px controls, no horizontal overflow, `100dvh`, safe-area insets, real viewport meta.
- Events group by year with ruled rows; blog leads with the newest piece then ruled rows; the leaderboard drops its duplicate Score column on phones; the team ring pulls back on portrait screens and stacks role, name, department and links at the bottom.
- Rules from `.agents` applied: no em dashes, no numbered eyebrows (one plain eyebrow per page), no identical card grids, left-aligned heroes, `text-wrap: balance/pretty`, skip link.

**Dev-mode fix.** In `next dev` the Start button used to die. The 3D letters load a font asynchronously; fiber suspends while it loads, that suspend bubbled out to the page-level loader and re-mounted the whole intro, and fiber then force-lost the WebGL context. The letters are now wrapped in their own `<Suspense>` inside the scene, and each Canvas mounts once via `useSettled`. `next build` verification runs use `NEXT_DIST_DIR=.next-verify` (see `next.config.ts`) so they never overwrite a running dev server's `.next`.

## 9. Update: Earth is the start control, the drift, and the phone framing

**Start page.** Earth alone, turning in the dark, is the whole page; there is no button. It is the tap target (a real round `<button aria-label="Start">` laid over the planet) with one hint line, "Tap Earth to launch". Radar pings ring the planet.

**The drift.** Tapping Earth sends the camera around Earth's limb and into real 3D space along a curve, looking along it. A glowing line runs through the letters C, S, A and U, which stand in space one after another (left, right, left, right) and are passed one at a time: each powers on (dim, one flicker, amber) as the camera reaches it, and the line lights up behind the camera with a small signal-coloured head. Stars streak past. The flight is about 4.2s and hands off to the hero. Reduced motion: no drifting, the camera steps from letter to letter.

**Story on phones.** The scene has its own area above the copy panel, so it is framed for that area: a wider lens (58 degrees), Earth, the Sun and the planet flybys pulled toward the centre line (`layoutFor(portrait)`), the ship larger and low in frame, the destination high. The section rail becomes a horizontal progress strip on the panel's top edge (44px tap targets), out of the scene.

## 10. Update: palette, the straight flight, loaders, phone structure

**Palette.** Neutral graphite (`--void-950` #0a0a0b, `--hull-900` #17181c, `--hull-700` #2f3238), silver labels (`--dim-300` #a3a8b0), warm starlight, one orange signal and one amber "lit". The old teal tones and the green "live" status are gone (status is amber). The 3D planets keep natural Earth blues and greens; that is the planet, not the interface.

**Start flight.** Earth is the start control. The camera never turns: it holds one heading (into -Z) and only translates - it accelerates forward, strafes sideways to slingshot past Earth's limb (with a little roll and a lens that widens with speed), then settles onto the lane. There is no guide line. Traffic crosses the lane in different directions - satellites left and right, tumbling rocks rising and falling, a fighter right to left, a saucer falling diagonally, a second fighter left to right - while C, S, A and U stand in the lane and power on as the camera reaches them (~5s, then the hero).

**Loaders.** Boot: a pre-flight checklist (big counter, six systems flipping WAIT to OK, "Cleared for launch"), driven by time but held at 92 until the page has really loaded. Route change: a hyperspace jump of streaming stars with one word, slowing and fading when the destination has painted. Both are reduced-motion safe.

**Phone structure.** Header: the CSAU wordmark on the left (links home), the menu on the thumb side; the menu overlay lists links left-aligned at 56px+. The story keeps its phone layout (scene above, copy panel below, progress strip). The team carousel sits a little higher in its stage.

## 11. Update: phone intro letters and the phone story panel

**Phone intro.** On narrow screens the flight is longer (6.4s), the letters stand closer to the lane (2.5 off centre instead of 3.8) and further down it, and a letter only lights once it is both near enough and actually in front of the camera. This keeps C from flashing past at the screen edge while the camera is still sliding around Earth. Letters must stay clear of the camera's own line (about 2.5 off it): closer than that and the camera flies through the glyph.

**Phone story (rewritten).** The scene fills the top; below it is one panel whose height is measured from the tallest stop (`--story-panel`, set in `StorySection`), so no stop is ever clipped and the scene gets exactly the rest of the screen. Reading order in the panel: where you are (section and "6 of 8" as quiet text), the title, the sentence, the facts as one quiet row, then full-width actions stacked. On short phones (under 720px tall) the second and third actions share a row.

## 12. Update: clearer planets

The story looked pixelated because each planet was only tetrahedron particles, and phones rendered at low pixel density. Every planet is now a **smooth surface** (vertex colours from the same 3D noise, up to 320x160 segments, soft shoreline blend, lit per fragment from the Sun) with particles kept only where they help: Earth's clouds and atmosphere haze, Venus's haze, the Sun's corona. Haze particles are culled on the planet's face and show only as a halo at its edge. Mercury and the Earth/Venus/Sun bodies keep their close-ups clear. Both canvases now use full pixel density (`dpr` up to 2) with antialiasing on every device.

## 13. Phones only, bigger story, richer loaders

- The smooth planet surface, 2x pixel ratio and denser clarity work apply on phones only (`smooth` prop on `ParticlePlanet`, `mobile` in the scenes). Desktop keeps the particle-only planets.
- Phone story text is larger (title up to 40px, body 17-20px, 52px buttons); short phones (height 720px or less) keep compact sizes. The panel cap is 70% of the viewport.
- Route loader: crossing fighters, swelling planets, rotating reticle, status line, 12-segment charge bar. Boot loader: turning globe with an orbiting satellite, scrolling telemetry ticker, T-minus readout. All motion stops under reduced motion.

## 14. Themed waiting screens

- Boot loader: a deep-space-network signal acquisition. A radar sweeps over a constellation that draws itself edge by edge as the count climbs, with a status line (Searching / Locking / Aligning / Link established), a turning globe, a telemetry ticker and the astronaut moon.
- Route loader: each page is a place (`src/lib/destinations.ts`, glyphs in `DestGlyph.tsx`). A relay of the six glyphs hops along, then the destination's glyph is shown large with "Now flying you to <PAGE>".
- Nav menu: each link has its glyph and a sector caption (shown on hover, focus, the active page, and always on touch).
