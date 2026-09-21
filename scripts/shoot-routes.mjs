/* Full-page screenshots of every route at mobile and desktop widths, plus a horizontal-overflow check.
   Run: node scripts/shoot-routes.mjs [baseUrl] [outDir]  */
import puppeteer from "puppeteer-core";
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? ".";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const ROUTES = ["/team", "/events", "/blog", "/crackit", "/quick-code", "/nope"];
for (const [label, w, h, mob] of [["m", 390, 844, true], ["d", 1440, 900, false]]) {
  for (const r of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob });
    await page.goto(BASE + r, { waitUntil: "load" });
    await new Promise((res) => setTimeout(res, 2500));
    const info = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      sh: document.documentElement.scrollHeight,
      small: [...document.querySelectorAll("a,button,input,select,textarea,[role=button]")]
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.height < 40 || b.width < 40) && getComputedStyle(e).visibility !== "hidden"; })
        .slice(0, 6).map((e) => (e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 24) + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height)),
      tiny: [...document.querySelectorAll("p,li,td,span,div")].filter((e) => e.children.length === 0 && e.textContent.trim().length > 12 && parseFloat(getComputedStyle(e).fontSize) < 14).length,
    }));
    console.log(label, r, JSON.stringify(info));
    await page.screenshot({ path: `${OUT}/${label}${r.replace(/\//g, "-")}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
