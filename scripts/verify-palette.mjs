/* Verify the DESIGN.md (Sculptural Tactility) palette is applied on all pages:
   - CSS tokens match the spec palette exactly
   - painted page backgrounds are light (surface family)
   - quick-code hero CTAs follow the spec: primary = charcoal #27272a + white text,
     secondary = white clay + on-surface-variant text
   - laser nav overlay is surface-colored with on-surface links
   Run: node scripts/verify-palette.mjs  */
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
  };
});
const EXPECTED = {
  surface: "#fbf8ff",
  background: "#fbf8ff",
  onSurface: "#1a1b22",
  primary: "#121315",
  onPrimary: "#ffffff",
  primaryContainer: "#27272a",
  onSurfaceVariant: "#46464b",
  containerLowest: "#ffffff",
  containerLow: "#f4f2fd",
  container: "#eeedf7",
  containerHigh: "#e8e7f1",
  containerHighest: "#e3e1ec",
  outline: "#77767b",
  outlineVariant: "#c7c6cb",
  surfaceDim: "#dad9e3",
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

/* 3. Quick-code CTA spec: primary = charcoal bg + white text; secondary = white clay */
try {
  await page.goto(`${BASE}/quick-code`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(2500);
  const ctas = await page.evaluate(() => {
    const links = [...document.querySelectorAll("[data-qc-hero] a")];
    return links.map((a) => {
      const cs = getComputedStyle(a);
      return { text: a.textContent.trim().slice(0, 24), color: cs.color, bg: cs.backgroundColor };
    });
  });
  console.log("quick-code CTAs:", JSON.stringify(ctas));
  const primary = ctas.find((c) => c.text.startsWith("START"));
  const secondary = ctas.find((c) => c.text.startsWith("VIEW"));
  const primaryOk =
    primary && primary.bg === "rgb(39, 39, 42)" && primary.color === "rgb(255, 255, 255)";
  const secondaryOk =
    secondary && secondary.bg === "rgb(255, 255, 255)" && secondary.color === "rgb(70, 70, 75)";
  if (primaryOk) pass("quick-code primary CTA (charcoal + white)", `${primary.bg}/${primary.color}`);
  else fail("quick-code primary CTA", JSON.stringify(primary));
  if (secondaryOk) pass("quick-code secondary CTA (white clay + variant)", `${secondary.bg}/${secondary.color}`);
  else fail("quick-code secondary CTA", JSON.stringify(secondary));
} catch (err) {
  fail("quick-code CTAs", err.message?.slice(0, 140));
}

/* 4. Laser nav overlay — surface bg + on-surface links */
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
    return { bg: style?.backgroundColor, linkColor: lstyle?.color };
  });
  console.log("laser nav:", JSON.stringify(nav));
  const isSurface = nav.bg === "rgb(251, 248, 255)";
  if (isSurface) pass("laser nav overlay surface bg", nav.bg);
  else fail("laser nav overlay surface bg", nav.bg);
  const m = nav.linkColor?.match(/\d+/g);
  const linkDark = m && (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 120;
  if (linkDark) pass("laser nav links dark (on-surface)", nav.linkColor);
  else fail("laser nav links dark", nav.linkColor);
} catch (err) {
  fail("laser nav", err.message?.slice(0, 140));
}

await browser.close();
console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);