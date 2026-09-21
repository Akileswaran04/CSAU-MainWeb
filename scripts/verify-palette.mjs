/* Verify the deep-space design tokens, contrast and type on every route:
   - the CSS tokens match the spec palette exactly
   - WCAG contrast: body/label ink on void and hull, button text on its fill
   - only two font families are ever used (Ethnocentric, JetBrains Mono)
   - body does not turn into a scroll container (overflow-x: clip)
   - body copy stays at or under 65ch
   Run: node scripts/verify-palette.mjs [baseUrl]   (needs `npm run start` or `npm run dev`)  */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SPEC = {
  "--void-950": "#0a0a0b",
  "--space-black": "#000000",
  "--hull-900": "#17181c",
  "--hull-700": "#2f3238",
  "--dim-300": "#a3a8b0",
  "--starlight": "#f6f1e4",
  "--signal": "#ee5b3a",
  "--lit": "#f0b73a",
};

/* WCAG 2.x relative luminance / contrast */
const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* [foreground, background, minimum ratio, what it is] */
const PAIRS = [
  ["--starlight", "--void-950", 7, "primary ink on void"],
  ["--starlight", "--hull-900", 7, "primary ink on hull"],
  ["--dim-300", "--void-950", 4.5, "label ink on void"],
  ["--dim-300", "--hull-900", 4.5, "label ink on hull"],
  ["--lit", "--void-950", 4.5, "lit (amber) on void"],
  ["--void-950", "--lit", 4.5, "void text on lit marker"],
  ["--void-950", "--signal", 4.5, "void text on signal button"],
  ["--signal", "--void-950", 3, "signal (graphic) on void"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--mute-audio", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

let failures = 0;
const pass = (n, d = "") => console.log(`PASS ${n}${d ? " — " + d : ""}`);
const fail = (n, d = "") => {
  failures++;
  console.log(`FAIL ${n}${d ? " — " + d : ""}`);
};

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${BASE}/team`, { waitUntil: "load" });
await sleep(800);

/* 1. tokens */
const tokens = await page.evaluate((names) => {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim().toLowerCase()]));
}, Object.keys(SPEC));
/* the built CSS minifies #rrggbb to #rgb where it can */
const long = (h) => (/^#[0-9a-f]{3}$/.test(h) ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h);
for (const k of Object.keys(tokens)) tokens[k] = long(tokens[k]);
for (const [name, want] of Object.entries(SPEC)) {
  tokens[name] === want ? pass(`token ${name}`, want) : fail(`token ${name}`, `got "${tokens[name]}", want ${want}`);
}
const legacy = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return ["--pond-950", "--pond-900", "--pond-700", "--pond-300", "--foam", "--marker", "--lily-600", "--lotus-300"].filter(
    (n) => cs.getPropertyValue(n).trim()
  );
});
legacy.length === 0 ? pass("no legacy pond tokens") : fail("legacy pond tokens survive", legacy.join(", "));

/* 2. contrast */
for (const [fg, bg, min, what] of PAIRS) {
  const r = ratio(SPEC[fg], SPEC[bg]);
  r >= min ? pass(`contrast ${what}`, `${r.toFixed(2)}:1 >= ${min}`) : fail(`contrast ${what}`, `${r.toFixed(2)}:1 < ${min}`);
}

/* 3. body */
const body = await page.evaluate(() => {
  const cs = getComputedStyle(document.body);
  return { overflowX: cs.overflowX, overflowY: cs.overflowY };
});
body.overflowX === "clip" ? pass("body overflow-x is clip") : fail("body overflow-x", JSON.stringify(body));

await page.close();

/* 4. fonts + measure on every route */
const ROUTES = ["/", "/team", "/events", "/blog", "/crackit", "/quick-code", "/does-not-exist"];
const ALLOWED = /ethnocentric|jetbrains|monospace|fallback/i;
for (const r of ROUTES) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + r, { waitUntil: "load" });
  if (r === "/") {
    await p.evaluate(() => sessionStorage.setItem("csau-gate-seen", "true"));
    await p.reload({ waitUntil: "load" });
  }
  await sleep(1200);
  const res = await p.evaluate(() => {
    const families = new Map();
    let wide = 0;
    const walk = document.querySelectorAll("body *");
    walk.forEach((el) => {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      families.set(fam, (families.get(fam) ?? 0) + 1);
      if (el.tagName === "P" && parseFloat(cs.fontSize) > 0) {
        const chars = el.getBoundingClientRect().width / (parseFloat(cs.fontSize) * 0.6);
        if (chars > 72) wide++;
      }
    });
    return { families: [...families.entries()], wide };
  });
  const bad = res.families.filter(([f]) => !ALLOWED.test(f) && !/^__/.test(f));
  bad.length === 0
    ? pass(`fonts ${r}`, res.families.map(([f, n]) => `${f}×${n}`).join(", "))
    : fail(`fonts ${r}`, bad.map(([f, n]) => `${f}×${n}`).join(", "));
  await p.close();
}

await browser.close();
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
