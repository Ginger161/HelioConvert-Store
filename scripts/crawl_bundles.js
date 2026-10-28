// Phase 1c: scrape every Entrepedia bundle (a topic grouped into 6-8 products) into bundles.json
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'auth.json' });
  const page = await ctx.newPage();
  await page.goto('https://www.entrepedia.co/library/bundles', { waitUntil: 'networkidle' });

  let last = 0, stable = 0;
  for (let i = 0; i < 100 && stable < 5; i++) {
    const n = await page.$$eval('a[href^="/library/bundles/"]', a => new Set(a.map(x => x.getAttribute('href'))).size);
    stable = n === last ? stable + 1 : 0; last = n;
    const more = page.getByRole('button', { name: /load more|show more|more/i }).first();
    if (await more.isVisible().catch(() => false)) await more.click().catch(() => {});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }
  const slugs = await page.$$eval('a[href^="/library/bundles/"]', a => [...new Set(a.map(x => x.getAttribute('href').split('/').pop()))]);
  console.log('bundles found:', slugs.length);

  const out = [];
  let idx = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    const p = await ctx.newPage();
    while (idx < slugs.length) {
      const slug = slugs[idx++];
      try {
        await p.goto(`https://www.entrepedia.co/library/bundles/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await p.waitForSelector('a[href^="/library/product/"]', { timeout: 30000 });
        const data = await p.evaluate(() => {
          const main = document.querySelector('main') || document.body;
          const lines = main.innerText.split('\n').map(s => s.trim()).filter(Boolean);
          const title = document.querySelector('h1')?.innerText.trim() || lines[lines.indexOf('Bundle') + 2];
          const items = [...document.querySelectorAll('a[href^="/library/product/"]')].map(a => {
            const t = a.innerText.split('\n').map(s => s.trim()).filter(Boolean);
            return { id: a.getAttribute('href').split('/').pop(), format: t[t.length - 1] };
          });
          const seen = new Set();
          return { title, items: items.filter(i => !seen.has(i.id) && seen.add(i.id)) };
        });
        out.push({ slug, ...data });
        console.log(`[${out.length}/${slugs.length}] ${data.title} (${data.items.length})`);
      } catch (e) { console.log('FAIL', slug, String(e).split('\n')[0]); }
    }
    await p.close();
  }));
  fs.writeFileSync('bundles.json', JSON.stringify(out, null, 2));
  console.log('saved', out.length);
  await browser.close();
})();
