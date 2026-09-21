/* Screenshots the home story at several scroll positions.
   Run: node scripts/shoot-story.mjs [baseUrl] [outDir]  */
import puppeteer from "puppeteer-core";
const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = process.argv[3] ?? ".";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const [label, w, h, mob] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("csau-gate-seen", "true"));
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector("[data-section=story]", { timeout: 30000 });
  for (const p of [0.02, 0.3, 0.5, 0.7, 0.9, 1.0]) {
    await page.evaluate((p) => {
      const el = document.querySelector("[data-section=story]");
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + p * (el.offsetHeight - window.innerHeight));
    }, p);
    await new Promise((r) => setTimeout(r, 2600));
    await page.screenshot({ path: `${OUT}/${label}-story-${Math.round(p * 100)}.png` });
  }
  await page.close();
}
await browser.close();
