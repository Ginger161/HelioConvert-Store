const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const mk = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 120))); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 120))); return { p, errs }; };

  console.log('=== QUIZ RESULTS (desktop)');
  const d = await mk(1440, 900);
  for (const [label, q] of [
    ['business + money + starter', 'stage=starter&goal=money&time=2to5&style=steps&scope=business'],
    ['business + tech + owner', 'stage=owner&goal=tech&time=5to10&style=email&scope=business'],
    ['business + wellbeing (no obvious fit)', 'stage=self&goal=wellbeing&time=lt2&style=quick&scope=business'],
    ['topic + money + starter (should offer the stacks page)', 'stage=starter&goal=money&time=2to5&style=steps&scope=topic'],
  ]) {
    await d.p.goto(`http://localhost:4000/start/results?${q}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await d.p.waitForSelector('h1', { timeout: 60000 }); await d.p.waitForTimeout(1500);
    const r = await d.p.evaluate(() => ({
      stackCards: document.querySelectorAll('a[href^="/stack/"]').length,
      firstStack: document.querySelector('a[href^="/stack/"]')?.getAttribute('href'),
      badge: [...document.querySelectorAll('span')].find(s => /best match/i.test(s.textContent))?.closest('a')?.getAttribute('href') ?? null,
      sectionTitle: [...document.querySelectorAll('p')].find(p => /which business/i.test(p.textContent))?.textContent ?? null,
      stacksPagePromo: !!document.querySelector('a[href="/stacks"].bp-panel'),
      hero: document.querySelector('.edge h2')?.textContent ?? null,
    }));
    console.log(label.padEnd(54), JSON.stringify(r));
  }
  await d.p.goto('http://localhost:4000/start/results?stage=starter&goal=money&time=2to5&style=steps&scope=business', { waitUntil: 'domcontentloaded' }); await d.p.waitForTimeout(2500);
  await d.p.screenshot({ path: 'brand/res_business.png', fullPage: true });
  console.log('desktop console errors:', d.errs.length ? d.errs : 'none');

  console.log('\n=== PHONE (390px wide)');
  const m = await mk(390, 844);
  for (const [name, url] of [['stacks list', '/stacks'], ['stack page', '/stack/ai-agency-stack'], ['quiz results (business)', '/start/results?stage=starter&goal=money&time=2to5&style=steps&scope=business']]) {
    await m.p.goto('http://localhost:4000' + url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await m.p.waitForSelector('h1', { timeout: 60000 }); await m.p.waitForTimeout(2500);
    const r = await m.p.evaluate(() => {
      const wide = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 2 && getComputedStyle(e).position !== 'fixed').slice(0, 3).map(e => e.tagName + '.' + String(e.className).slice(0, 40));
      return { innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, overflowingElements: wide };
    });
    console.log(name.padEnd(26), JSON.stringify(r), r.scrollWidth > r.innerWidth ? ' <-- SIDEWAYS SCROLL' : ' OK, no sideways scroll');
    await m.p.screenshot({ path: `brand/m_${name.split(' ')[0]}_${name.includes('page') ? 'page' : name.includes('list') ? 'list' : 'res'}.png`, fullPage: true });
  }
  console.log('phone console errors:', m.errs.length ? m.errs : 'none');
  await b.close();
})();
