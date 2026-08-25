/* Headless verification: does the ENTER button sit right below the
   building's ground line / reflection? Run: node scripts/verify-preloader.mjs */
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
await page.goto("http://localhost:3000", { waitUntil: "load" });

/* wait for the ENTER button to fade in (drawing takes ~10s) */
await page.waitForFunction(
  () => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes("ENTER THE WORLD")
    );
    return btn && getComputedStyle(btn.closest("div")).opacity === "1";
  },
  { timeout: 25000, polling: 500 }
);

const result = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("ENTER THE WORLD")
  );
  const wrap = btn.closest("div");
  const r = wrap.getBoundingClientRect();
  return { btnTop: r.top, btnBottom: r.bottom, btnCenterX: r.left + r.width / 2, vh: innerHeight, vw: innerWidth };
});

/* expected geometry from the Preloader math:
   S = min((W-40)/800, 0.75H/640); topY = 0.03H; groundY = topY + 555*S */
const S = Math.min((result.vw - 40) / 800, (0.75 * result.vh) / 640);
const groundY = 0.03 * result.vh + 555 * S;

console.log("viewport:", result.vw, "x", result.vh);
console.log("expected ground line at y =", Math.round(groundY));
console.log("button container: top", Math.round(result.btnTop), "bottom", Math.round(result.btnBottom), "centerX", Math.round(result.btnCenterX));
console.log("gap below ground line:", Math.round(result.btnTop - groundY), "px");
console.log("horizontally centred:", Math.abs(result.btnCenterX - result.vw / 2) < 2 ? "YES" : "NO");
console.log("on-screen:", result.btnBottom <= result.vh ? "YES" : "NO");

await page.screenshot({ path: "preloader-verify.png" });
console.log("screenshot saved: preloader-verify.png");

await browser.close();
