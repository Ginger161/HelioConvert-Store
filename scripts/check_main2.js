const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  for (const [name, url] of [['prerendered', 'http://localhost:4173/'], ['plain (current behaviour)', 'http://localhost:4174/']]) {
    const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    const errs = []; let reqs = 0;
    page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 140))); page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 140)));
    page.on('request', () => reqs++);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.slice(0, 50), canvases: document.querySelectorAll('canvas').length, n8n: document.querySelectorAll('n8n-demo').length, textLen: document.body.innerText.length, rootKids: document.getElementById('root').children.length }));
    console.log(name.padEnd(26), JSON.stringify(r), '| requests:', reqs, '| errors:', errs.length ? errs : 'none');
    await page.screenshot({ path: `brand/main_${name.startsWith('pre') ? 'pre' : 'plain'}.png` });
  }
  await b.close();
})();
