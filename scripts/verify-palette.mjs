/* Verify the DESIGN.md (Graphite & Signal) palette is applied on all pages:
   - CSS tokens match the spec palette exactly
   - no legacy cyan/magenta/neon tokens survive in :root
   - painted page backgrounds are paper-light
   - quick-code hero CTAs follow the spec: primary = ink fill + paper text,
     secondary = hairline ink button on paper
   - interactive primitives stay square (no 999px pills)
   - laser nav overlay is paper-coloured with ink links, no backdrop blur
   Run: node scripts/verify-palette.mjs   (needs `npm run dev` on :3000)  */
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

let failures = 0;
const fail = (name, detail) => {
  failures++;
  console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
};
const pass = (name, detail = "") =>
  console.log(`PASS ${name}${detail ? " — " + detail : ""}`);

/* 1. Token snapshot — load a page first */
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
await sleep(800);
const tokenSnapshot = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const get = (v) => cs.getPropertyValue(v).trim();
  return {
    surface: get("--surface"),
    background: get("--background"),
    onSurface: get("--on-surface"),
    primary: get("--primary"),
    onPrimary: get("--on-primary"),
    primaryContainer: get("--primary-container"),
    onSurfaceVariant: get("--on-surface-variant"),
    containerLowest: get("--surface-container-lowest"),
    containerLow: get("--surface-container-low"),
    container: get("--surface-container"),
    containerHigh: get("--surface-container-high"),
    containerHighest: get("--surface-container-highest"),
    outline: get("--outline"),
    outlineVariant: get("--outline-variant"),
    surfaceDim: get("--surface-dim"),
    signal: get("--signal"),
    marker: get("--marker"),
    controlBorder: get("--control-border"),
    legacyCyan: get("--color-cyan"),
    legacyMagenta: get("--color-magenta"),
    legacyNeonCyan: get("--color-neon-cyan"),
  };
});
const EXPECTED = {
  surface: "#eff0ec",
  background: "#eff0ec",
  onSurface: "#0f1211",
  primary: "#0f1211",
  onPrimary: "#ffffff",
  primaryContainer: "#1b1f1d",
  onSurfaceVariant: "#4a4f4b",
  containerLowest: "#ffffff",
  containerLow: "#f7f8f5",
  container: "#f1f2ee",
  containerHigh: "#e9ebe5",
  containerHighest: "#e2e4dd",
  outline: "#656a63",
  outlineVariant: "#cfd2cb",
  surfaceDim: "#d6d8d1",
  signal: "#1b4dff",
  marker: "#f5e663",
};
let tokenOk = true;
const norm = (s) => {
  let v = (s || "").toLowerCase().trim();
  // expand 3-digit hex shorthand (#fff -> #ffffff) as CSSOM does
  const m = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (m) v = `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`;
  return v;
};
for (const [k, v] of Object.entries(EXPECTED)) {
  const got = norm(tokenSnapshot[k]);
  if (got === v) pass(`token ${k}`, v);
  else {
    tokenOk = false;
    fail(`token ${k}`, `${got} != ${v}`);
  }
}
if (tokenOk) console.log(`PASS all ${Object.keys(EXPECTED).length} tokens match DESIGN.md palette`);

/* 1b. The legacy neon tokens must be gone — they are how the old
   purple/cyan theme leaked back in through Tailwind's palette. */
for (const key of ["legacyCyan", "legacyMagenta", "legacyNeonCyan"]) {
  const got = tokenSnapshot[key];
  if (!got) pass(`legacy token removed (${key})`);
  else fail(`legacy token removed (${key})`, `still defined as ${got}`);
}

/* 2. Painted background per page — sample a real pixel from a screenshot */
const pages = [
  { path: "/", name: "home" },
  { path: "/events", name: "events" },
  { path: "/blog", name: "blog" },
  { path: "/crackit", name: "crackit" },
  { path: "/team", name: "team" },
  { path: "/quick-code", name: "quick-code" },
];
for (const p of pages) {
  try {
    await page.goto(`${BASE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForFunction(() => document.body.innerText.length > 40, { timeout: 30000 });
    await sleep(900);
    const px2 = await page.evaluate(() => {
      const el = document.elementFromPoint(Math.floor(innerWidth / 2), 18);
      let node = el;
      const seen = new Set();
      while (node && !seen.has(node)) {
        seen.add(node);
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          const m = bg.match(/\d+/g);
          return { r: +m[0], g: +m[1], b: +m[2], from: node.tagName };
        }
        node = node.parentElement;
      }
      return { r: -1, g: -1, b: -1, from: "none" };
    });
    const lum = (px2.r + px2.g + px2.b) / 3;
    if (lum > 200) pass(`${p.name} painted bg light`, `${p.path} rgb(${px2.r},${px2.g},${px2.b}) from=${px2.from}`);
    else fail(`${p.name} painted bg light`, `${p.path} rgb(${px2.r},${px2.g},${px2.b}) from=${px2.from}`);
  } catch (err) {
    fail(`${p.name} page load`, err.message?.slice(0, 140));
  }
}

/* 2b. WCAG contrast for the text/UI pairs the palette relies on.
   Priority-1 accessibility rule: 4.5:1 for text, 3:1 for control
   boundaries. Failing this silently is how "muted" becomes unreadable. */
const srgb = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const relLum = (h) => {
  const s = h.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(s.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const CONTRAST_PAIRS = [
  ["on-surface on paper", norm(tokenSnapshot.onSurface), norm(tokenSnapshot.background), 4.5],
  ["on-surface-variant on paper", norm(tokenSnapshot.onSurfaceVariant), norm(tokenSnapshot.background), 4.5],
  ["outline (mono labels) on paper", norm(tokenSnapshot.outline), norm(tokenSnapshot.background), 4.5],
  ["outline on white card", norm(tokenSnapshot.outline), norm(tokenSnapshot.containerLowest), 4.5],
  ["signal on paper", norm(tokenSnapshot.signal), norm(tokenSnapshot.background), 4.5],
  ["paper text on ink button", norm(tokenSnapshot.background), norm(tokenSnapshot.onSurface), 4.5],
  ["field border (control) on white", norm(tokenSnapshot.controlBorder), norm(tokenSnapshot.containerLowest), 3.0],
];
for (const [name, fg, bg, need] of CONTRAST_PAIRS) {
  const ratio = contrast(fg, bg);
  if (ratio >= need) pass(`contrast ${name}`, `${ratio.toFixed(2)}:1 (need ${need})`);
  else fail(`contrast ${name}`, `${ratio.toFixed(2)}:1 (need ${need})`);
}

/* 3. Quick-code CTA spec: primary = ink fill + paper text;
   secondary = transparent + ink hairline. No pills, no drop shadows. */
try {
  await page.goto(`${BASE}/quick-code`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(2500);
  const ctas = await page.evaluate(() => {
    const links = [...document.querySelectorAll("[data-qc-hero] a")];
    return links.map((a) => {
      const cs = getComputedStyle(a);
      return {
        text: a.textContent.trim().slice(0, 24),
        color: cs.color,
        bg: cs.backgroundColor,
        radius: parseFloat(cs.borderTopLeftRadius) || 0,
        shadow: cs.boxShadow,
      };
    });
  });
  console.log("quick-code CTAs:", JSON.stringify(ctas));
  const primary = ctas.find((c) => c.text.startsWith("START"));
  const secondary = ctas.find((c) => c.text.startsWith("VIEW"));
  const primaryOk =
    primary && primary.bg === "rgb(15, 18, 17)" && primary.color === "rgb(239, 240, 236)";
  const secondaryOk =
    secondary &&
    (secondary.bg === "rgba(0, 0, 0, 0)" || secondary.bg === "transparent") &&
    secondary.color === "rgb(15, 18, 17)";
  if (primaryOk) pass("quick-code primary CTA (ink fill + paper text)", `${primary.bg}/${primary.color}`);
  else fail("quick-code primary CTA", JSON.stringify(primary));
  if (secondaryOk) pass("quick-code secondary CTA (hairline ink)", `${secondary.bg}/${secondary.color}`);
  else fail("quick-code secondary CTA", JSON.stringify(secondary));

  const squareish = ctas.every((c) => c.radius <= 6);
  if (squareish) pass("quick-code CTAs square (radius <= 6px)", ctas.map((c) => c.radius).join(", "));
  else fail("quick-code CTAs square", ctas.map((c) => `${c.text}=${c.radius}px`).join(", "));

  const flat = ctas.every((c) => !c.shadow || c.shadow === "none");
  if (flat) pass("quick-code CTAs flat (no drop shadow)");
  else fail("quick-code CTAs flat", ctas.map((c) => c.shadow).join(" | "));

  /* Touch targets: interactive box must clear the 44px minimum. */
  const tapHeights = await page.evaluate(() =>
    [...document.querySelectorAll("[data-qc-hero] a")].map((el) =>
      Math.round(el.getBoundingClientRect().height)
    )
  );
  if (tapHeights.every((h) => h >= 44)) pass("quick-code CTAs >=44px tall", tapHeights.join(", "));
  else fail("quick-code CTAs >=44px tall", tapHeights.join(", "));
} catch (err) {
  fail("quick-code CTAs", err.message?.slice(0, 140));
}

/* 4. Primitives stay square — the old theme put a 999px pill on every
   tab, tag, chip and CTA. */
try {
  await page.goto(`${BASE}/blog`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(1200);
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll(".tab")].map((el) => ({
      radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
      height: Math.round(el.getBoundingClientRect().height),
    }))
  );
  if (tabs.length === 0) fail("blog tabs present");
  else if (tabs.every((t) => t.radius <= 6)) pass("blog tabs square", tabs.map((t) => t.radius).join(", "));
  else fail("blog tabs square", tabs.map((t) => t.radius).join(", "));
  if (tabs.every((t) => t.height >= 44)) pass("blog tabs >=44px tall", tabs.map((t) => t.height).join(", "));
  else fail("blog tabs >=44px tall", tabs.map((t) => t.height).join(", "));

  await page.goto(`${BASE}/events`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(1200);
  const chipReport = await page.evaluate(() => {
    const chips = [...document.querySelectorAll(".chip")];
    return {
      count: chips.length,
      radii: chips.map((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0),
      fonts: chips.map((el) => getComputedStyle(el).fontFamily),
    };
  });
  if (chipReport.count > 0 && chipReport.radii.every((r) => r <= 6)) {
    pass("events chips square", `${chipReport.count} chips@${chipReport.radii.join(", ")}`);
  } else {
    fail("events chips square", JSON.stringify(chipReport));
  }
  if (chipReport.fonts.every((f) => /mono/i.test(f))) pass("events chips monospace");
  else fail("events chips monospace", chipReport.fonts.join(" | "));
} catch (err) {
  fail("primitives", err.message?.slice(0, 140));
}

/* 5. Laser nav overlay — paper bg + ink links, square toggle, no blur */
try {
  await page.goto(`${BASE}/blog`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(500);
  await page.click(".ln-toggle");
  await sleep(1000);
  const nav = await page.evaluate(() => {
    const ov = document.querySelector(".ln-overlay");
    const style = ov ? getComputedStyle(ov) : null;
    const link = document.querySelector(".ln-link");
    const lstyle = link ? getComputedStyle(link) : null;
    const toggle = document.querySelector(".ln-toggle");
    const tstyle = toggle ? getComputedStyle(toggle) : null;
    return {
      bg: style?.backgroundColor,
      linkColor: lstyle?.color,
      linkShadow: lstyle?.textShadow,
      toggleRadius: parseFloat(tstyle?.borderTopLeftRadius) || 0,
      toggleBlur: tstyle?.backdropFilter || "none",
    };
  });
  console.log("laser nav:", JSON.stringify(nav));
  const isPaper = nav.bg === "rgb(239, 240, 236)";
  if (isPaper) pass("laser nav overlay paper bg", nav.bg);
  else fail("laser nav overlay paper bg", nav.bg);
  const m = nav.linkColor?.match(/\d+/g);
  const linkDark = m && (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 120;
  if (linkDark) pass("laser nav links ink", nav.linkColor);
  else fail("laser nav links ink", nav.linkColor);
  if (nav.toggleRadius <= 6) pass("laser nav toggle square", `${nav.toggleRadius}px`);
  else fail("laser nav toggle square", `${nav.toggleRadius}px`);
  if (nav.toggleBlur === "none") pass("laser nav toggle has no backdrop blur");
  else fail("laser nav toggle has no backdrop blur", nav.toggleBlur);
} catch (err) {
  fail("laser nav", err.message?.slice(0, 140));
}

await browser.close();
console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);