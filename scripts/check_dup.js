const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const links = fs.readdirSync('raw_assets').map(d => JSON.parse(fs.readFileSync(`raw_assets/${d}/meta.json`, 'utf8'))).filter(m => m.link).slice(0, 4);
  const b = await chromium.launch({ headless: true });
  for (const m of links) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(m.link, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(8000);
    const r = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;
      const topbar = document.querySelector('.notion-topbar, .notion-topbar-mobile, [class*=topbar]');
      const labels = [...document.querySelectorAll('[aria-label],button,[role=button]')].map(e => (e.getAttribute('aria-label') || e.innerText || '').trim()).filter(Boolean);
      return { topbarPresent: !!topbar, htmlMentionsDuplicate: /duplicate/i.test(html), buttons: [...new Set(labels)].filter(x => x.length < 40).slice(0, 14) };
    });
    console.log(m.h1.padEnd(28).slice(0, 28), JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
