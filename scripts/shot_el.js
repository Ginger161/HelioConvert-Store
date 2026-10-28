// usage: node scripts/shot_el.js <url> <css selector> <out.png> [click text]
const { chromium } = require('playwright');
(async () => {
  const [url, sel, out, click] = process.argv.slice(2);
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  if (click) await page.getByRole('tab', { name: click }).click();
  await page.waitForTimeout(800);
  await el.screenshot({ path: out });
  console.log('saved', out);
  await browser.close();
})();
