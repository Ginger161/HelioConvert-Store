const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4000/stack/ai-agency-stack', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('h1'); await p.waitForTimeout(2500);
  const btn = p.locator('a[href="#buy"]');
  console.log('jump button visible on phone:', await btn.isVisible(), '| text:', (await btn.innerText()).replace(/\s+/g, ' '));
  const y0 = await p.evaluate(() => window.scrollY);
  await btn.click(); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const a = document.getElementById('buy').getBoundingClientRect(); return { scrollY: Math.round(window.scrollY), buyTop: Math.round(a.top), inView: a.top >= 0 && a.top < window.innerHeight }; });
  console.log('after tapping it: scrolled from', y0, 'to', r.scrollY, '| buy panel top at', r.buyTop, 'px | in view:', r.inView);
  await p.screenshot({ path: 'brand/m_buy_jump.png' });
  // desktop: the jump button must be hidden (the panel is already beside the steps)
  const dctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const dp = await dctx.newPage();
  await dp.goto('http://localhost:4000/stack/ai-agency-stack', { waitUntil: 'domcontentloaded', timeout: 90000 }); await dp.waitForSelector('h1'); await dp.waitForTimeout(1500);
  console.log('jump button hidden on desktop:', !(await dp.locator('a[href="#buy"]').isVisible()));
  // card footer on phone: price and label no longer touch
  await p.goto('http://localhost:4000/stacks', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('h1'); await p.waitForTimeout(2000);
  const gap = await p.evaluate(() => { const c = document.querySelector('a[href^="/stack/"]'); const f = c.querySelector('div.border-t'); const [a, bb] = f.children; const ra = a.getBoundingClientRect(), rb = bb.getBoundingClientRect(); return { sameLine: Math.abs(ra.top - rb.top) < 8, horizontalGapPx: Math.round(rb.left - ra.right), stackedBelow: rb.top > ra.bottom - 2 }; });
  console.log('card footer on phone:', JSON.stringify(gap));
  await b.close();
})();
