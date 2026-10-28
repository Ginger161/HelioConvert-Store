const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const links = fs.readdirSync('raw_assets').map(d => JSON.parse(fs.readFileSync(`raw_assets/${d}/meta.json`, 'utf8'))).filter(m => m.link);
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  let branded = 0, dead = 0, checked = 0;
  for (const m of links) {
    const page = await ctx.newPage();
    try {
      await page.goto(m.link, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(6000);
      const t = await page.evaluate(() => document.body.innerText);
      const dup = await page.getByText(/duplicate/i).count();
      const has = /entrepedia/i.test(t);
      const gone = /could not find|page not found|doesn.t exist|no longer|access denied|not publicly/i.test(t) || t.trim().length < 40;
      checked++; if (has) branded++; if (gone) dead++;
      console.log(m.h1.padEnd(36).slice(0, 36), '| text:', String(t.trim().length).padStart(5), '| mentions Entrepedia:', has ? 'YES' : 'no ', '| Duplicate button:', dup ? 'yes' : 'no ', gone ? '| LOOKS BROKEN' : '');
      if (m.h1 === 'Social Media Audit') await page.screenshot({ path: 'brand/notion_sample.png' });
    } catch (e) { dead++; checked++; console.log(m.h1.padEnd(36).slice(0, 36), '| ERROR', String(e).split('\n')[0].slice(0, 70)); }
    await page.close();
  }
  console.log(`\nchecked ${checked}: mention Entrepedia ${branded}, look broken/unreachable ${dead}`);
  await b.close();
})();
