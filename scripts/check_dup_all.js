// For each Notion template link: does the public page offer "Duplicate" (so a buyer can copy it into their own workspace)?
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const links = fs.readdirSync('raw_assets').map(d => ({ d, m: JSON.parse(fs.readFileSync(`raw_assets/${d}/meta.json`, 'utf8')) })).filter(x => x.m.link);
  const b = await chromium.launch({ headless: true });
  const out = {};
  for (const { d, m } of links) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(m.link, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(7000);
    let result = 'unknown';
    try {
      const direct = await page.locator('[aria-label*="uplicate" i], [role=button]:has-text("Duplicate"), div:text-is("Duplicate")').count();
      if (direct) result = 'yes (direct button)';
      else {
        await page.getByRole('button', { name: /more actions/i }).first().click({ timeout: 8000 });
        await page.waitForTimeout(1500);
        const menu = await page.evaluate(() => [...document.querySelectorAll('[role=menu] *, [role=menuitem], .notion-overlay-container *')].map(e => e.innerText).filter(t => t && t.length < 40));
        const items = [...new Set(menu.map(t => t.trim()).filter(Boolean))].slice(0, 12);
        result = items.some(t => /duplicate/i.test(t)) ? 'yes (in menu)' : 'NO. menu: ' + items.join(' | ');
      }
    } catch (e) { result = 'could not check: ' + String(e).split('\n')[0].slice(0, 60); }
    out[d] = { title: m.h1, duplicable: result };
    console.log(m.h1.padEnd(36).slice(0, 36), '->', result.slice(0, 110));
    await ctx.close();
  }
  fs.writeFileSync('duplicable.json', JSON.stringify(out, null, 1));
  const yes = Object.values(out).filter(v => v.duplicable.startsWith('yes')).length;
  console.log(`\nduplicable: ${yes} of ${Object.keys(out).length}`);
  await b.close();
})();
