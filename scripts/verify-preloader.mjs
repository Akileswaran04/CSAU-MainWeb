/* Headless verification of the home gate:
   1. Boot preloader mounts (CSAU wordmark + uplink progress bar)
   2. Landing gate appears and the ENTER SYSTEM button is centered, on-screen
      and fully faded in
   3. Clicking it zooms through to the content hero
   Run: node scripts/verify-preloader.mjs   (needs `npm run dev` on :3000)  */
import puppeteer from "puppeteer-core";

const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

let failures = 0;
const fail = (name, detail) => {
  failures++;
  console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
};
const pass = (name, detail = "") =>
  console.log(`PASS ${name}${detail ? " — " + detail : ""}`);

await page.goto("http://localhost:3000", { waitUntil: "load" });

/* 1. Boot preloader — wordmark plus the uplink bar */
try {
  await page.waitForFunction(() => !!document.querySelector(".uplink-bar-wrap"), {
    timeout: 20000,
    polling: 250,
  });
  const boot = await page.evaluate(() => ({
    wrap: !!document.querySelector(".uplink-bar-wrap"),
    ticks: document.querySelectorAll(".uplink-tick").length,
    label: document.querySelector(".uplink-label")?.textContent.trim() ?? null,
  }));
  if (boot.wrap && boot.ticks > 0) pass("boot preloader mounted", `${boot.ticks} ticks, label=${boot.label}`);
  else fail("boot preloader mounted", JSON.stringify(boot));
} catch (err) {
  fail("boot preloader mounted", err.message?.slice(0, 140));
}

/* 2. Landing gate — ENTER SYSTEM visible, centered, on-screen */
try {
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /ENTER SYSTEM/i.test(b.textContent || "")
      );
      if (!btn) return false;
      const box = btn.closest("div");
      return box && parseFloat(getComputedStyle(box).opacity) > 0.9;
    },
    { timeout: 30000, polling: 500 }
  );

  const gate = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /ENTER SYSTEM/i.test(b.textContent || "")
    );
    const wrap = btn.closest("div");
    const r = wrap.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return {
      btnTop: r.top,
      btnBottom: r.bottom,
      btnCenterX: r.left + r.width / 2,
      vh: innerHeight,
      vw: innerWidth,
      radius: parseFloat(cs.borderTopLeftRadius) || 0,
      shadow: cs.boxShadow,
      bg: cs.backgroundColor,
    };
  });

  console.log(
    `gate: ${Math.round(gate.btnTop)}..${Math.round(gate.btnBottom)}px, centerX ${Math.round(
      gate.btnCenterX
    )} of ${gate.vw}`
  );

  const centred = Math.abs(gate.btnCenterX - gate.vw / 2) < 4;
  const onScreen = gate.btnTop > 0 && gate.btnBottom <= gate.vh;
  if (centred && onScreen) pass("landing gate button placed", "centered + on-screen");
  else fail("landing gate button placed", `centred=${centred} onScreen=${onScreen}`);

  // Graphite & Signal: the CTA is squared, ink-filled and flat.
  if (gate.radius <= 6) pass("gate CTA square", `${gate.radius}px`);
  else fail("gate CTA square", `${gate.radius}px`);
  if (!gate.shadow || gate.shadow === "none") pass("gate CTA flat (no glow/shadow)");
  else fail("gate CTA flat", gate.shadow);
  if (gate.bg === "rgb(15, 18, 17)") pass("gate CTA ink-filled", gate.bg);
  else fail("gate CTA ink-filled", gate.bg);
} catch (err) {
  fail("landing gate", err.message?.slice(0, 140));
}

/* 3. Clicking ENTER SYSTEM reaches the content hero */
try {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /ENTER SYSTEM/i.test(b.textContent || "")
    );
    btn?.click();
  });
  await page.waitForFunction(
    () => {
      const h1 = document.querySelector("h1");
      return h1 && getComputedStyle(h1).opacity === "1";
    },
    { timeout: 20000 }
  );
  const hero = await page.evaluate(() => document.querySelector("h1")?.textContent.trim() ?? null);
  if (hero === "CSAU..") pass("enter gate reaches hero", hero);
  else fail("enter gate reaches hero", String(hero));
} catch (err) {
  fail("enter gate reaches hero", err.message?.slice(0, 140));
}

await browser.close();
console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
