import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--enable-webgl"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

let failures = 0;

/* 1. Laser nav overlay — paper stage, flat WebGL index bars, and a
   signal-blue underline that carries no glow. */
try {
  await page.goto("http://localhost:3000/events", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("h1"), { timeout: 30000 });
  await page.click(".ln-toggle");
  await new Promise((r) => setTimeout(r, 700));
  const state = await page.evaluate(() => {
    const overlay = document.querySelector(".ln-overlay");
    const canvas = document.querySelector(".ln-canvas");
    const link = [...document.querySelectorAll(".ln-link")].find(
      (l) => l.firstChild?.textContent.trim() === "EVENTS"
    );
    const after = link ? getComputedStyle(link, "::after") : null;
    return {
      overlayBg: overlay ? getComputedStyle(overlay).backgroundColor : null,
      hasCanvas: !!canvas,
      webgl: canvas
        ? !!(canvas.getContext("webgl2") || canvas.getContext("webgl"))
        : false,
      underlineBg: after?.backgroundColor,
      underlineShadow: after?.boxShadow,
    };
  });
  const isPaper = state.overlayBg === "rgb(239, 240, 236)";
  const isSignalUnderline = state.underlineBg === "rgb(27, 77, 255)";
  const noGlow = !state.underlineShadow || state.underlineShadow === "none";
  if (isPaper && state.hasCanvas && state.webgl && isSignalUnderline && noGlow) {
    console.log(`PASS laser nav — paper overlay, webgl bars, signal underline, no glow`);
  } else {
    failures++;
    console.log("FAIL laser nav", JSON.stringify(state));
  }
} catch (err) {
  failures++;
  console.log("ERROR laser nav:", err.message?.slice(0, 160));
}

/* 2. Team wall — canvas + member text, scroll advances the member

   The wall auto-rotates after 2.5s of idle scroll (AUTO_DELAY), which makes
   any fixed-sleep sample of the initial counter a coin flip — it landed on
   01/10 or 02/10 depending on frame timing. Reduced motion suppresses
   auto-rotate by design, so emulating it makes this deterministic AND
   asserts that the reduced-motion contract actually holds. */
try {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto("http://localhost:3000/team", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 6000)); // textures (pravatar) load

  /* Pin the scroll too: the counter is scroll-derived. */
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 900));

  const initial = await page.evaluate(() => {
    const canvases = document.querySelectorAll("canvas").length;
    const name = [...document.querySelectorAll("div")].find(
      (d) => d.textContent?.trim() === "Aarav Sharma"
    );
    const counter = [...document.querySelectorAll("div")].find(
      (d) => /^0[0-9] \/ 10$/.test(d.textContent?.trim() ?? "")
    );
    return {
      canvases,
      firstName: !!name,
      counter: counter?.textContent?.trim() ?? null,
      deputies: [...document.querySelectorAll("h2")].some((h) => h.textContent.includes("DEPUTIES")),
    };
  });

  if (initial.canvases >= 1 && initial.firstName && initial.counter === "01 / 10") {
    console.log(
      "PASS team wall initial — canvas=yes member=Aarav Sharma counter=01/10 (reduced motion: no auto-rotate)"
    );
  } else {
    failures++;
    console.log("FAIL team wall initial", JSON.stringify(initial));
  }

  // Scroll through the pinned wall → member should advance
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.6));
  await new Promise((r) => setTimeout(r, 900));
  const advanced = await page.evaluate(() => {
    const counter = [...document.querySelectorAll("div")].find(
      (d) => /^0[0-9] \/ 10$/.test(d.textContent?.trim() ?? "")
    );
    return counter?.textContent?.trim() ?? null;
  });
  console.log("after scroll: counter =", advanced);

  // Scroll to the very end of the pinned wall → deputies section visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 1000));
  const end = await page.evaluate(() => {
    const deputies = [...document.querySelectorAll("h2")].some((h) => h.textContent.includes("DEPUTIES"));
    const cards = [...document.querySelectorAll(".clay-card")].length;
    return { deputies, cards };
  });
  if (end.deputies && end.cards >= 12) {
    console.log(`PASS team wall end — deputies section, ${end.cards} deputy cards`);
  } else {
    failures++;
    console.log("FAIL team wall end", JSON.stringify(end));
  }
  await page.screenshot({ path: "team-wall.png" });
} catch (err) {
  failures++;
  console.log("ERROR team wall:", err.message?.slice(0, 200));
}

await browser.close();
console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);