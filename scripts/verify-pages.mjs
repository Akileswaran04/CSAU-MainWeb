/* Headless verification:
   1. Home ("/") plays the boot → landing gate, then reveals the HERO
      (sessionStorage is empty in a fresh headless profile, so the gate runs)
   2. NAV button present; opens the paper index overlay:
      - pure paper background
      - WebGL three.js canvas with flat index bars
      - plain uppercase text only (no hints / emojis)
      - hover reveals the signal underline under the link
   3. Team page: white helix wall, counter advances, deputies grid
   4. Quick Code hero: light theme with the laser scene still mounted
   Run: node scripts/verify-pages.mjs  */
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

/* 1. Home page — walk the boot/landing gate, then expect the hero h1 */
try {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });

  // The gate is skipped when the session already saw it; otherwise the
  // boot preloader runs first and the landing page offers ENTER SYSTEM.
  const enter = await page
    .waitForFunction(
      () => {
        const btn = [...document.querySelectorAll("button")].find((b) =>
          /ENTER SYSTEM/i.test(b.textContent || "")
        );
        const hero = document.querySelector("h1");
        if (hero && getComputedStyle(hero).opacity === "1") return "hero";
        if (btn) return "enter";
        return false;
      },
      { timeout: 45000, polling: 250 }
    )
    .then((handle) => handle.jsonValue())
    .catch(() => null);

  if (enter === "enter") {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /ENTER SYSTEM/i.test(b.textContent || "")
      );
      btn?.click();
    });
    await sleep(2000); // 1.3s zoom transition + first paint
  }

  await page.waitForFunction(
    () => {
      const h1 = document.querySelector("h1");
      return h1 && getComputedStyle(h1).opacity === "1";
    },
    { timeout: 30000 }
  );
  await sleep(600);
  const home = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return {
      gate: !!document.querySelector(".ln-overlay") ? "boot-or-content" : "unknown",
      h1: h1?.textContent.trim().slice(0, 30) ?? null,
      h1Visible: h1 ? getComputedStyle(h1).opacity === "1" : false,
    };
  });
  if (home.h1 === "CSAU.." && home.h1Visible) pass("/ hero after gate", JSON.stringify(home.h1));
  else fail("/ hero after gate", JSON.stringify(home));
} catch (err) {
  fail("/ hero after gate", err.message?.slice(0, 160));
}

/* 2. Overlay — paper bg, three.js index-bar canvas, centered block */
try {
  await page.goto(`${BASE}/events`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => document.querySelector("h1"), { timeout: 30000 });
  await sleep(400);

  await page.click(".ln-toggle");
  await sleep(1800);

  const overlay = await page.evaluate(() => {
    const ov = document.querySelector(".ln-overlay");
    const canvas = document.querySelector(".ln-canvas");
    const links = [...document.querySelectorAll(".ln-link")].map((l) => l.textContent.trim());
    const emojis =
      document.querySelectorAll(".ln-link").length -
      links.filter((l) => /^[A-Z ]+$/.test(l)).length;
    const style = ov ? getComputedStyle(ov) : null;
    let webgl = false;
    if (canvas) {
      webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    }
    return {
      open: !!ov && style?.opacity === "1",
      bg: style?.backgroundColor,
      hasCanvas: !!canvas,
      webgl,
      canvasSize: canvas ? [canvas.width, canvas.height] : null,
      links,
      nonPlainLinks: emojis,
      centered: (() => {
        const first = document.querySelector(".ln-link");
        if (!first) return false;
        const r = first.getBoundingClientRect();
        return Math.abs(r.left + r.width / 2 - innerWidth / 2) < 80;
      })(),
    };
  });

  const linksOk =
    overlay.links.length === 6 &&
    ["HOME", "EVENTS", "BLOG", "CRACKIT", "TEAM", "QUICK CODE"].every((l) => overlay.links.includes(l));

  if (
    overlay.open &&
    overlay.bg === "rgb(239, 240, 236)" &&
    overlay.hasCanvas &&
    overlay.webgl &&
    linksOk &&
    overlay.nonPlainLinks === 0 &&
    overlay.centered
  ) {
    pass("overlay paper", `bg=${overlay.bg} webgl=${overlay.canvasSize} links=6 emojis=0 centered=true`);
  } else {
    fail("overlay paper", JSON.stringify(overlay));
  }

  /* 2b. Hover a link → signal underline wipes in (scaleX → 1) */
  const before = await page.evaluate(() => {
    const link = [...document.querySelectorAll(".ln-link")].find((l) => l.textContent === "HOME");
    const tr = getComputedStyle(link, "::after").transform;
    const m = tr.match(/matrix\(([^,]+)/);
    return m ? parseFloat(m[1]) : null;
  });
  const linkHandle = await page.evaluateHandle(() =>
    [...document.querySelectorAll(".ln-link")].find((l) => l.textContent === "HOME")
  );
  await linkHandle.asElement().hover();
  await sleep(900);
  const after = await page.evaluate(() => {
    const link = [...document.querySelectorAll(".ln-link")].find((l) => l.textContent === "HOME");
    const tr = getComputedStyle(link, "::after").transform;
    const m = tr.match(/matrix\(([^,]+)/);
    return m ? parseFloat(m[1]) : null;
  });
  if (before !== null && after !== null && after > before + 0.05) pass("hover underline grows", `scaleX ${before} -> ${after}`);
  else fail("hover underline grows", `scaleX ${before} -> ${after}`);

  await page.keyboard.press("Escape");
  await sleep(400);
} catch (err) {
  fail("overlay", err.message?.slice(0, 200));
}

/* 3. Team page — paper helix wall with upward scroll rail */
try {
  await page.goto(`${BASE}/team`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(2200);

  const wall = await page.evaluate(() => {
    const canvas = document.querySelector("[data-team-carousel] canvas");
    return canvas ? { w: canvas.width, h: canvas.height } : null;
  });
  if (wall) pass("team wall canvas", `${wall.w}x${wall.h}`);
  else fail("team wall canvas");

  const counters = [];
  for (let i = 0; i < 3; i++) {
    const info = await page.evaluate(() => {
      const el = document.querySelector("[data-wall-counter]");
      return el ? el.textContent.trim() : null;
    });
    counters.push(info);
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2.2));
    await sleep(800);
  }
  if (counters[0] !== counters[counters.length - 1])
    pass("helix counter advances", counters.join(" -> "));
  else fail("helix counter advances", counters.join(" -> "));

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(1200);
  const deputies = await page.evaluate(() => {
    const grid = document.querySelector("[data-deputies-grid]");
    return grid ? grid.querySelectorAll(":scope > *").length : -1;
  });
  if (deputies >= 10) pass("deputies grid", `${deputies} cards`);
  else fail("deputies grid", String(deputies));
} catch (err) {
  fail("team page", err.message?.slice(0, 200));
}

/* 4. Quick Code hero — light theme, laser still mounted */
try {
  await page.goto(`${BASE}/quick-code`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(2500);
  const qc = await page.evaluate(() => {
    const hero = document.querySelector("[data-qc-hero]");
    if (!hero) return null;
    const cs = getComputedStyle(hero);
    const iframe = hero.querySelector("iframe");
    const canvas = hero.querySelector("canvas");
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      laser: iframe
        ? { kind: "iframe", srcdocLen: (iframe.getAttribute("srcdoc") || "").length }
        : canvas
          ? { kind: "canvas" }
          : null,
    };
  });
  if (qc) {
    const lightBg =
      qc.bg === "rgba(0, 0, 0, 0)" ||
      qc.bg === "rgb(255, 255, 255)" ||
      qc.bg === "rgb(250, 250, 250)" ||
      qc.bg === "rgb(255, 255, 252)" ||
      qc.bg === "rgb(247, 247, 250)" ||
      qc.bg === "rgb(239, 240, 236)";
    if (lightBg) pass("quick-code hero light", qc.bg);
    else fail("quick-code hero light", qc.bg);
    if (qc.laser) pass("quick-code laser mounted", JSON.stringify(qc.laser));
    else fail("quick-code laser mounted");
  } else {
    fail("quick-code hero present");
  }
} catch (err) {
  fail("quick-code page", err.message?.slice(0, 200));
}

await browser.close();
console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);