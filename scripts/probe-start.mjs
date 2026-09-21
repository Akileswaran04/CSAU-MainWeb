/* Probes the landing start button over time, then clicks it with a real mouse.
   Run: node scripts/probe-start.mjs [baseUrl] [outDir]  */
import puppeteer from "puppeteer-core";
const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = process.argv[3] ?? ".";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const logs = [];
page.on("console", (m) => logs.push(m.type() + ": " + m.text().slice(0, 160)));
page.on("pageerror", (e) => logs.push("pageerror: " + String(e).slice(0, 200)));
await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector('button[aria-label="Start"]', { timeout: 60000 });
const t0 = Date.now();
for (let i = 0; i < 6; i++) {
  const info = await page.evaluate(() => {
    const b = document.querySelector('button[aria-label="Start"]');
    if (!b) return "no button";
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], hit: el === b, top: el?.tagName + "." + (el?.className || "") };
  });
  console.log(((Date.now() - t0) / 1000).toFixed(1) + "s", JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/probe-${i}.png` });
  await new Promise((r) => setTimeout(r, 3000));
}
const b = await page.$('button[aria-label="Start"]');
if (b) {
  const r = await b.boundingBox();
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await new Promise((r) => setTimeout(r, 1200));
  console.log("after click, button still present:", !!(await page.$('button[aria-label="Start"]')));
}
console.log(logs.filter((l) => !/favicon|GPU stall/.test(l)).slice(0, 12).join("\n"));
await browser.close();
