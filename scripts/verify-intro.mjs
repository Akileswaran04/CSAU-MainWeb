/* Headless verification of the power-on intro, the scroll lock and the story.
   1. Boot preloader clears and the landing intro mounts a WebGL canvas
   2. Only the start button is visible at first; pressing it flies through the void,
      C, S, A, U appear and connect, and the page hands off to the hero
   3. After handoff the page is not scroll-locked and really scrolls
   4. Every route scrolls, straight after load, on desktop and mobile widths
   Run: node scripts/verify-intro.mjs [baseUrl] [shotsDir]
   (needs `npm run start` or `npm run dev`)  */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const SHOTS = process.argv[3] ?? null;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

async function open(width, height, mobile = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return { page, errors };
}

const scrollProbe = (page) =>
  page.evaluate(async () => {
    const before = window.scrollY;
    window.scrollTo(0, 400);
    await new Promise((r) => setTimeout(r, 250));
    const moved = window.scrollY;
    window.scrollTo(0, 0);
    return {
      locked: document.documentElement.classList.contains("scroll-locked"),
      bodyInline: document.body.style.overflow,
      tall: document.documentElement.scrollHeight > window.innerHeight + 10,
      moved: moved > before,
    };
  });

/* ---------- 1-3. Home: boot -> intro -> hero ---------- */
for (const [label, w, h, mob] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
  const { page, errors } = await open(w, h, mob);
  await page.goto(BASE, { waitUntil: "load" });
  try {
    await page.waitForSelector('button[aria-label="Start"]', { timeout: 30000 });
    pass(`${label}: intro mounted`);
  } catch {
    fail(`${label}: intro mounted`, "Start button never appeared");
    await shot(page, `${label}-fail`);
    await page.close();
    continue;
  }
  const hasCanvas = await page.evaluate(() => !!document.querySelector("canvas"));
  hasCanvas ? pass(`${label}: WebGL canvas present`) : fail(`${label}: WebGL canvas present`);
  const lockedDuring = await page.evaluate(() => document.documentElement.classList.contains("scroll-locked"));
  lockedDuring ? pass(`${label}: page locked during intro`) : fail(`${label}: page locked during intro`);
  await sleep(600);
  await shot(page, `${label}-1-standby`);

  await page.click('button[aria-label="Start"]');
  const marks = [300, 700, 1300, 2200, 3000];
  let last = 0;
  for (const m of marks) {
    await sleep(m - last);
    last = m;
    await shot(page, `${label}-2-t${m}`);
  }
  try {
    await page.waitForFunction(() => document.querySelector("h1")?.textContent?.trim() === "CSAU", { timeout: 12000, polling: 200 });
    pass(`${label}: handed off to hero`);
  } catch {
    fail(`${label}: handed off to hero`);
  }
  await sleep(600);
  await shot(page, `${label}-3-hero`);
  const p = await scrollProbe(page);
  !p.locked && p.bodyInline === "" && p.tall && p.moved
    ? pass(`${label}: page scrolls after handoff`, JSON.stringify(p))
    : fail(`${label}: page scrolls after handoff`, JSON.stringify(p));

  // story
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.6));
  await sleep(1200);
  await shot(page, `${label}-4-story-a`);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 6));
  await sleep(1400);
  await shot(page, `${label}-5-story-b`);
  const real = errors.filter((e) => !/favicon|DevTools|GPU stall|WebGL: INVALID|Failed to load resource/i.test(e));
  real.length === 0 ? pass(`${label}: no console errors`) : fail(`${label}: console errors`, real.slice(0, 3).join(" | "));
  await page.close();
}

/* ---------- 4. Every route scrolls right after load ---------- */
const ROUTES = ["/team", "/events", "/blog", "/crackit", "/quick-code", "/does-not-exist"];
for (const [label, w, h, mob] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
  for (const r of ROUTES) {
    const { page } = await open(w, h, mob);
    await page.goto(BASE + r, { waitUntil: "load" });
    await sleep(1200);
    const p = await scrollProbe(page);
    !p.locked && p.bodyInline === "" && (p.tall ? p.moved : r === "/does-not-exist")
      ? pass(`${label} ${r}: scrolls`)
      : fail(`${label} ${r}: scrolls`, JSON.stringify(p));
    if (label === "desktop") await shot(page, `route${r.replace(/\//g, "-")}`);
    await page.close();
  }
}

/* ---------- 5. Overlapping locks (the original bug) ---------- */
{
  const { page } = await open(1440, 900);
  await page.goto(BASE + "/team", { waitUntil: "load" });
  await sleep(1000);
  const isLocked = () => page.evaluate(() => document.documentElement.classList.contains("scroll-locked"));
  await page.click('button[aria-label="Open navigation"]');
  await sleep(400);
  (await isLocked()) ? pass("nav open: page locked") : fail("nav open: page locked");
  await page.keyboard.press("Escape");
  await sleep(500);
  const afterNav = await scrollProbe(page);
  !afterNav.locked && afterNav.moved ? pass("nav closed: page scrolls again") : fail("nav closed: page scrolls again", JSON.stringify(afterNav));

  // route transition through the loader: nav overlay lock + loader lock overlap
  await page.click('button[aria-label="Open navigation"]');
  await sleep(400);
  await page.evaluate(() => document.querySelector('a.ln-link[href="/events"]')?.click());
  await sleep(1500);
  (await isLocked()) ? pass("route loader: page locked") : fail("route loader: page locked");
  await page.waitForFunction(() => location.pathname === "/events" && !document.documentElement.classList.contains("scroll-locked"), { timeout: 20000, polling: 250 }).then(
    () => pass("after route transition: lock released"),
    () => fail("after route transition: lock released")
  );
  const afterRoute = await scrollProbe(page);
  !afterRoute.locked && afterRoute.moved ? pass("after route transition: page scrolls") : fail("after route transition: page scrolls", JSON.stringify(afterRoute));
  await page.close();
}
{
  // nav opened during the home intro must not release the intro lock when it closes
  const { page } = await open(1440, 900);
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector('button[aria-label="Start"]', { timeout: 30000 });
  await page.click('button[aria-label="Open navigation"]');
  await sleep(300);
  await page.keyboard.press("Escape");
  await sleep(400);
  const still = await page.evaluate(() => document.documentElement.classList.contains("scroll-locked"));
  still ? pass("nav closed during intro: intro lock kept") : fail("nav closed during intro: intro lock kept");
  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
