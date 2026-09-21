/* Start page then the launch flight, at phone and desktop sizes.
   Run: node scripts/shoot-intro.mjs [baseUrl] [outDir]  */
import puppeteer from "puppeteer-core";
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? ".";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [label, w, h, mob] of [["m", 390, 844, true], ["d", 1440, 900, false]].filter((x) => !process.env.ONLY || x[0] === process.env.ONLY)) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob });
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector('button[aria-label="Start"]', { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${OUT}/in-${label}-0.png` });
  // slow the page clock 5x so screenshots can catch the whole flight
  await page.evaluate(() => { const o = performance.now.bind(performance); const t0 = o(); performance.now = () => t0 + (o() - t0) * 0.2; });
  const b = await page.$('button[aria-label="Start"]');
  const r = await b.boundingBox();
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  for (let i = 1; i <= 14; i++) {
    await new Promise((res) => setTimeout(res, 2000));
    await page.screenshot({ path: `${OUT}/in-${label}-${i}.png` });
  }
  await page.close();
}
await browser.close();
