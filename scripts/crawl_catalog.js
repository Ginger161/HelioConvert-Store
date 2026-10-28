// Phase 1a: scrape the full catalog index (id, title, format, collection) into catalog.json
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'auth.json' });
  const page = await ctx.newPage();
  await page.goto('https://www.entrepedia.co/library', { waitUntil: 'networkidle' });

  let last = 0, stable = 0;
  for (let i = 0; i < 400 && stable < 6; i++) {
    const n = await page.$$eval('a[href^="/library/product/"]', a => new Set(a.map(x => x.getAttribute('href'))).size);
    if (n === last) stable++; else { stable = 0; last = n; }
    // load-more button if present, else scroll
    const more = page.getByRole('button', { name: /load more|show more|more/i }).first();
    if (await more.isVisible().catch(() => false)) await more.click().catch(() => {});
    await page.mouse.wheel(0, 6000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    if (i % 10 === 0) console.log('loaded', n);
  }

  const items = await page.$$eval('a[href^="/library/product/"]', as => {
    const seen = new Map();
    for (const a of as) {
      const href = a.getAttribute('href');
      if (seen.has(href)) continue;
      const lines = a.innerText.split('\n').map(s => s.trim()).filter(Boolean);
      seen.set(href, { id: href.split('/').pop(), url: 'https://www.entrepedia.co' + href, lines });
    }
    return [...seen.values()];
  });
  fs.writeFileSync('catalog.json', JSON.stringify(items, null, 2));
  console.log('total products:', items.length);
  console.log(JSON.stringify(items.slice(0, 5), null, 1));
  await browser.close();
})();
