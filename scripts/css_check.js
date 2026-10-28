const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://localhost:4000', { waitUntil: 'networkidle', timeout: 120000 });
  const r = await page.evaluate(() => {
    const g = (sel, props) => { const e = document.querySelector(sel); if (!e) return 'NOT FOUND'; const c = getComputedStyle(e); return Object.fromEntries(props.map(p => [p, c[p].slice(0, 90)])); };
    const sheets = [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.selectorText).filter(Boolean).filter(t => /^\.(marquee|rays|dot-grid|gold-text|paper|glass)$/.test(t)); } catch { return 'blocked'; } });
    return { marquee: g('.marquee', ['display', 'animationName', 'width']), rays: g('.rays', ['backgroundImage', 'maskImage']), goldText: g('.gold-text', ['backgroundClip', 'color']), sheetsWithCustomRules: sheets };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
