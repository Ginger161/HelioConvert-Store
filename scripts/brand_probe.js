const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('https://www.helioconvrt.com', { waitUntil: 'networkidle', timeout: 60000 });
  fs.mkdirSync('brand', { recursive: true });
  await page.screenshot({ path: 'brand/home.png', fullPage: true });
  const info = await page.evaluate(() => {
    const cs = (el, p) => el ? getComputedStyle(el)[p] : null;
    const b = document.body;
    const imgs = [...document.images].map(i => ({ src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
    const links = [...document.querySelectorAll('a[href]')].map(a => (a.innerText.trim().replace(/\s+/g, ' ') + ' | ' + a.getAttribute('href')).slice(0, 100));
    const btn = document.querySelector('a[class*=btn], button, a[class*=button]');
    return {
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content,
      icons: [...document.querySelectorAll('link[rel*=icon]')].map(l => l.href),
      bodyBg: cs(b, 'backgroundColor'), bodyColor: cs(b, 'color'), bodyFont: cs(b, 'fontFamily'),
      h1: cs(document.querySelector('h1'), 'fontFamily'), btnBg: cs(btn, 'backgroundColor'), btnColor: cs(btn, 'color'),
      cssVars: [...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch { return [] } }).filter(r => r.selectorText === ':root').map(r => r.cssText.slice(0, 1500)),
      imgs: imgs.slice(0, 20), links: [...new Set(links)].slice(0, 40),
      text: b.innerText.replace(/\n{2,}/g, '\n').slice(0, 4500),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  const logo = info.imgs.find(i => /logo/i.test(i.src + i.alt)) || info.imgs[0];
  if (logo) { const r = await page.request.get(logo.src); fs.writeFileSync('brand/logo' + (logo.src.match(/\.(png|svg|jpg|jpeg|webp)/i)?.[0] || '.png'), await r.body()); console.log('saved logo', logo.src); }
  await browser.close();
})();
