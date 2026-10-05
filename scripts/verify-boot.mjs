/* Verify the front-page preloader on the served site:
   - it is drawn, not written: a Sun, eight planets, a percentage and Skip, no other words
   - the planets light up one by one from the outside in, and nothing ever goes back
   - it follows real loading: it is never full before the Earth screen is ready, and when it
     lifts, Earth is already there (no gap between the two)
   - a slow Earth scene holds it; a scene that never comes cannot hang it; Skip always works
   - reduced motion: nothing moves, and it still finishes
   - a phone: everything fits the screen
   - a returning visitor gets no preloader, and the Earth scene is not fetched
   Run: node scripts/verify-boot.mjs [baseUrl] [shotsDir]   (needs `npm run dev` or `npm run start`)  */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const SHOTS = process.argv[3] ?? null;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIALOG = '[role="dialog"][aria-label="Loading CSAU"]';
const START = 'button[aria-label="Start"]';
/* the preloader gives up waiting for the Earth screen after this long (MAX_WAIT_MS in the component), plus its exit */
const NEVER_HANGS_MS = 20000;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--mute-audio", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

let failures = 0;
const pass = (n, d = "") => console.log(`PASS ${n}${d ? " — " + d : ""}`);
const fail = (n, d = "") => {
  failures++;
  console.log(`FAIL ${n}${d ? " — " + d : ""}`);
};
const check = (ok, n, d) => (ok ? pass(n, d) : fail(n, d));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Runs in the page before its own code. Keeps a record of the preloader on every frame and every
   change to the page: the percentage, which planets are lit, whether the Earth screen exists, the
   words on it, and what was there at the moment it left. */
const watch = (DIALOG, START) => {
  const log = { samples: [], words: [], left: null };
  window.__boot = log;
  const read = () => {
    const d = document.querySelector(DIALOG);
    const earth = !!document.querySelector(START);
    if (!d || getComputedStyle(d).display === "none" || d.getClientRects().length === 0) {
      if (d === null && log.samples.length && !log.left) log.left = { earth, t: performance.now() };
      return;
    }
    const lit = [...d.querySelectorAll("[data-planet]")].map((p) => p.dataset.lit === "true");
    const pct = Number(d.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow") ?? -1);
    const last = log.samples[log.samples.length - 1];
    if (!last || last.pct !== pct || last.earth !== earth || last.lit.join() !== lit.join()) log.samples.push({ t: performance.now(), pct, lit, earth });
    const words = d.innerText.replace(/\d+/g, "n").replace(/\s+/g, " ").trim().toLowerCase();
    if (!log.words.includes(words)) log.words.push(words);
  };
  new MutationObserver(read).observe(document, { subtree: true, childList: true, attributes: true });
  const loop = () => {
    read();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

/** a new visit: its own tab, so its own session */
async function open({ width = 1440, height = 900, mobile = false, reduced = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.evaluateOnNewDocument(watch, DIALOG, START);
  return { page, errors };
}

const until = (page, fn, ms, ...args) =>
  page
    .waitForFunction(fn, { timeout: ms, polling: 50 }, ...args)
    .then(() => true)
    .catch(() => false);
const gone = (page, ms) => until(page, () => !!window.__boot.left, ms);
const shown = (page, ms = 60000) => until(page, () => window.__boot.samples.length > 0, ms);
const record = (page) => page.evaluate(() => window.__boot);
const count = (lit) => lit.filter(Boolean).length;
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

/** Screenshots of the fall, frame by frame: as soon as it starts, its animations are paused and stepped
    through by hand (a screenshot can take longer than the whole fall), then let run to the end. */
async function shootFall(page, name) {
  const started = await until(page, (DIALOG) => !!document.querySelector(`${DIALOG} .bt-earth`)?.getAnimations().length, 30000, DIALOG);
  if (!started) return;
  const own = () => document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition));
  await page.evaluate((own) => new Function(`return (${own})`)()().forEach((a) => a.pause()), String(own));
  for (const ms of [0, 250, 500, 700, 850, 1000, 1150, 1300]) {
    await page.evaluate((own, ms) => new Function(`return (${own})`)()().forEach((a) => (a.currentTime = ms)), String(own), ms);
    await shot(page, `${name}-fall${String(ms).padStart(4, "0")}`);
  }
  await page.evaluate((own) => new Function(`return (${own})`)()().forEach((a) => a.play()), String(own));
}

/* The Earth screen's own script (the one that holds its start control), found on the first visit, so
   later visits can hold it back or see whether it was fetched. */
const earthScripts = new Set();
const noteEarthScript = async (res) => {
  const url = new URL(res.url());
  if (res.request().resourceType() !== "script" || !url.pathname.includes("/_next/")) return;
  const body = await res.text().catch(() => "");
  if (body.includes("st-earth")) earthScripts.add(url.pathname);
};
const isEarthScript = (req) => earthScripts.has(new URL(req.url()).pathname);

/** Hold the Earth screen's script back: for `ms`, or for good when `ms` is Infinity. `beforeRelease` runs just
    before it is let go. Returns { asked, released }: was it asked for, and a promise for the moment it was let go. */
async function holdEarth(page, ms, beforeRelease) {
  const state = { asked: false, released: null };
  let letGo;
  state.released = new Promise((r) => (letGo = r));
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (!isEarthScript(req)) return void req.continue().catch(() => {});
    const first = !state.asked;
    state.asked = true;
    if (ms === Infinity) return; // never answered
    setTimeout(async () => {
      if (first) await beforeRelease?.();
      req.continue().catch(() => {});
      if (first) letGo();
    }, ms);
  });
  return state;
}

const inside = (r, w, h) => r.left >= 0 && r.top >= 0 && r.right <= w && r.bottom <= h;
const rects = (page, sel) =>
  page.evaluate(
    (DIALOG, sel) =>
      [...(document.querySelector(DIALOG)?.querySelectorAll(sel) ?? [])].map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      }),
    DIALOG,
    sel,
  );

/* ---------- 1. a first visit, on a desktop ---------- */
{
  const { page, errors } = await open();
  page.on("response", noteEarthScript);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await shown(page);
  const drawn = await page.evaluate((DIALOG) => {
    const d = document.querySelector(DIALOG);
    return { planets: d?.querySelectorAll("[data-planet]").length ?? 0, suns: d?.querySelectorAll("[data-sun]").length ?? 0 };
  }, DIALOG);
  const N = drawn.planets; // one per stop in the menu (lib/destinations)
  const bodies = await rects(page, "[data-planet], [data-sun]");
  const fits = bodies.length === N + 1 && bodies.every((r) => inside(r, 1440, 900));
  if (SHOTS) {
    for (const n of [2, 5, 7]) {
      await until(page, (DIALOG, n) => document.querySelectorAll(`${DIALOG} [data-planet][data-lit="true"]`).length >= n, 30000, DIALOG, n);
      await shot(page, `boot-d-lit${n}`);
    }
    await shootFall(page, "boot-d");
  }
  const left = await gone(page, 40000);
  await sleep(300);
  await shot(page, "boot-d-earth");
  const log = await record(page);

  check(
    N >= 7 && N <= 9 && drawn.suns === 1 && log.words.length === 1 && log.words[0] === "n% skip",
    "it is drawn, not written",
    `${drawn.planets} planets, ${drawn.suns} sun, words: ${JSON.stringify(log.words)}`,
  );

  const steps = log.samples.map((s) => count(s.lit));
  const prefix = log.samples.every((s) => s.lit.every((on, i) => !on || i === 0 || s.lit[i - 1])); // lit ones come first: outermost first
  const oneByOne = steps.every((n, i) => i === 0 || (n >= steps[i - 1] && n <= steps[i - 1] + 1));
  const pcts = log.samples.map((s) => s.pct);
  const neverBack = pcts.every((p, i) => i === 0 || p >= pcts[i - 1]);
  check(
    prefix && oneByOne && neverBack && steps[0] < N && steps.at(-1) === N && pcts.at(-1) === 100,
    "the planets light up one by one from the outside in",
    `lit ${[...new Set(steps)].join(",")}; percentage ${pcts[0]} to ${pcts.at(-1)}${neverBack ? "" : ", went back"}${prefix ? "" : ", out of order"}`,
  );

  const early = log.samples.filter((s) => !s.earth && (s.pct >= 100 || count(s.lit) === N));
  check(early.length === 0, "it is never full before the Earth screen is ready", early.length ? `full ${early.length} time(s) with no Earth` : "");
  check(left && log.left.earth, "when it lifts, Earth is already there", JSON.stringify(log.left));
  check(fits, "everything fits the screen", `${bodies.length} bodies`);

  const after = await page.evaluate((START) => {
    const b = document.querySelector(START);
    const r = b?.getBoundingClientRect();
    const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return { open: !!b && !!top && (b === top || b.contains(top)), locked: document.documentElement.classList.contains("scroll-locked"), inert: !!b?.closest("[inert]") };
  }, START);
  check(after.open && after.locked && !after.inert, "after it lifts, Earth can be tapped", JSON.stringify(after));

  const real = errors.filter((e) => !/favicon|DevTools|GPU stall|WebGL: INVALID|Failed to load resource/i.test(e));
  check(real.length === 0, "no console errors", real.slice(0, 3).join(" | "));
  check(earthScripts.size > 0, "(the Earth screen's script was found, for the checks below)", [...earthScripts].join(", "));

  /* ---------- 2. the same tab again: a returning visitor ---------- */
  const fetched = [];
  page.on("request", (req) => isEarthScript(req) && fetched.push(req.url()));
  await page.reload({ waitUntil: "load" });
  await sleep(2500);
  const back = await page.evaluate((START) => ({
    seen: window.__boot.samples.length,
    earth: !!document.querySelector(START),
    hero: document.querySelector("h1")?.textContent?.trim(),
    locked: document.documentElement.classList.contains("scroll-locked"),
  }), START);
  check(
    back.seen === 0 && !back.earth && back.hero === "CSAU" && !back.locked && fetched.length === 0,
    "a returning visitor gets no preloader, and the Earth scene is not fetched",
    JSON.stringify({ ...back, fetched: fetched.length }),
  );
  await page.close();
}

/* ---------- 3. a slow Earth scene holds it ---------- */
{
  const { page } = await open();
  let held = null;
  const hold = await holdEarth(page, 5000, async () => {
    held = await page
      .evaluate((DIALOG) => ({ up: !!document.querySelector(DIALOG), last: window.__boot.samples.at(-1) }), DIALOG)
      .catch((e) => ({ error: String(e).slice(0, 160) }));
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await shown(page);
  await Promise.race([hold.released, sleep(20000)]);
  check(
    !!held && !held.error && held.up && held.last.pct < 100 && held.last.lit.filter(Boolean).length < 8,
    "a slow Earth scene holds it",
    !hold.asked ? "the Earth scene was never asked for" : held?.error ? `could not read the page: ${held.error}` : held ? `5s in, with no Earth yet: ${held.up ? "still up" : "already gone"}, at ${held.last?.pct}%` : "could not read the page",
  );
  const left = await gone(page, 40000);
  const log = await record(page);
  check(left && log.left.earth, "and it lifts once Earth has come", JSON.stringify(log.left));
  await page.close();
}

/* ---------- 4. a scene that never comes cannot hang it ---------- */
{
  const { page } = await open();
  await holdEarth(page, Infinity);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await shown(page);
  const t0 = Date.now();
  const left = await gone(page, NEVER_HANGS_MS);
  check(left, "a scene that never comes cannot hang it", left ? `lifted after ${((Date.now() - t0) / 1000).toFixed(1)}s` : `still up after ${NEVER_HANGS_MS / 1000}s`);
  await page.close();
}

/* ---------- 5. Skip ---------- */
{
  const { page } = await open();
  await holdEarth(page, Infinity);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await shown(page);
  await sleep(700);
  const skip = (await rects(page, "button"))[0];
  await page.mouse.click(skip.left + skip.width / 2, skip.top + skip.height / 2);
  const t0 = Date.now();
  const left = await gone(page, 1500);
  check(left, "Skip lifts it at once", left ? `${Date.now() - t0}ms` : "still up 1.5s after Skip");
  await page.close();
}

/* ---------- 6. reduced motion ---------- */
{
  const { page } = await open({ reduced: true });
  await holdEarth(page, 2500);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await shown(page);
  await sleep(500);
  const a = await rects(page, "[data-planet]");
  await sleep(600);
  const b = await rects(page, "[data-planet]");
  const N = a.length; // one per stop in the menu
  const still = N >= 7 && b.length === N && a.every((r, i) => Math.abs(r.left - b[i].left) < 0.5 && Math.abs(r.top - b[i].top) < 0.5);
  check(still, "reduced motion: nothing moves", `${a.length} planets`);
  await shot(page, "boot-reduced");
  const left = await gone(page, 40000);
  const log = await record(page);
  check(left && log.left.earth && count(log.samples.at(-1).lit) === N, "reduced motion: it still finishes, with Earth there", JSON.stringify(log.left));
  await page.close();
}

/* ---------- 7. a phone ---------- */
{
  const { page } = await open({ width: 390, height: 844, mobile: true });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await shown(page);
  await sleep(250);
  const bodies = await rects(page, "[data-planet], [data-sun]");
  const skip = (await rects(page, "button"))[0];
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await shot(page, "boot-m-start");
  check(
    bodies.length >= 8 && bodies.length <= 10 && bodies.every((r) => inside(r, 390, 844)) && !!skip && inside(skip, 390, 844) && skip.width >= 44 && skip.height >= 44 && !wide,
    "a phone: everything fits the screen",
    `${bodies.length} bodies, Skip ${skip ? Math.round(skip.width) + "x" + Math.round(skip.height) : "missing"}${wide ? ", page wider than the screen" : ""}`,
  );
  if (SHOTS) await shootFall(page, "boot-m");
  const left = await gone(page, 40000);
  await sleep(300);
  await shot(page, "boot-m-earth");
  const log = await record(page);
  check(left && log.left.earth, "a phone: when it lifts, Earth is already there", JSON.stringify(log.left));
  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
