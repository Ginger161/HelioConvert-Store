// One-off: records created before download.js captured the page heading (h1) get it added.
// Only visits products that have a `link` and no `h1` yet (the Notion templates, whose breadcrumbs don't hold the title).
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const todo = fs.readdirSync('raw_assets').map((d) => ({ d, f: `raw_assets/${d}/meta.json` })).filter(({ f }) => fs.existsSync(f))
    .map(({ d, f }) => ({ d, f, m: JSON.parse(fs.readFileSync(f, 'utf8')) })).filter(({ m }) => m.link && !m.h1);
  console.log('records needing a title:', todo.length);
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ storageState: 'auth.json' });
  for (const { d, f, m } of todo) {
    const page = await ctx.newPage();
    try {
      await page.goto(m.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.locator('h1').first().waitFor({ timeout: 30000 });
      m.h1 = (await page.locator('h1').first().innerText()).trim();
      fs.writeFileSync(f, JSON.stringify(m, null, 2));
      console.log(d.slice(0, 8), '->', m.h1);
    } catch (e) { console.log(d.slice(0, 8), 'FAILED', String(e).split('\n')[0]); }
    await page.close();
  }
  await b.close();
})();
