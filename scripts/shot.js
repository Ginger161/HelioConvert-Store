// usage: node scripts/shot.js <url> <out.png> [width]
const { chromium } = require('playwright');
(async () => {
  const [url, out, width] = [process.argv[2], process.argv[3], parseInt(process.argv[4] || '1440', 10)];
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  const errs = [];
  page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 200)));
  const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  console.log('status', r.status());
  // scroll through so loading="lazy" images are fetched before the capture
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 700) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(150); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, fullPage: true });
  console.log('console errors:', errs.length ? errs : 'none');
  await browser.close();
})();
