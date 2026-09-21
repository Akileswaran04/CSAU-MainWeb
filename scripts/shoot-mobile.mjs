/* Phone screenshots of the home story at three sizes. Run: node scripts/shoot-mobile.mjs [baseUrl] [outDir] */
import puppeteer from "puppeteer-core";
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? ".";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [label, w, h, stops] of [["a", 390, 844, [0.06, 0.35, 1.0]], ["b", 360, 640, [0.6, 1.0]]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("csau-gate-seen", "true"));
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector("[data-section=story]", { timeout: 40000 });
  await new Promise((r) => setTimeout(r, 2500));
  const info = await page.evaluate(() => {
    const s = document.querySelector("[data-section=story]");
    const hs = [...s.querySelectorAll(".story-chapter")].map((c) => c.scrollHeight);
    return { panel: getComputedStyle(s).getPropertyValue("--story-panel"), tallest: Math.max(...hs), vh: innerHeight };
  });
  console.log(label, JSON.stringify(info));
  for (const p of stops) {
    await page.evaluate((p) => {
      const el = document.querySelector("[data-section=story]");
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + p * (el.offsetHeight - window.innerHeight));
    }, p);
    await new Promise((r) => setTimeout(r, 2600));
    await page.screenshot({ path: `${OUT}/ms-${label}-${Math.round(p * 100)}.png` });
  }
  await page.close();
}
await browser.close();
