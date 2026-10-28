const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  for (const [name, url] of [['plain (current behaviour)', 'http://localhost:4174/'], ['prerendered', 'http://localhost:4173/']]) {
    const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    const errs = []; const t0 = Date.now();
    page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 140)));
    page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 140)));
    let status = 'ok';
    try { await page.goto(url, { waitUntil: 'commit', timeout: 20000 }); await page.waitForSelector('h1', { timeout: 60000 }); } catch (e) { status = 'TIMEOUT waiting for h1'; }
    await page.waitForTimeout(3000);
    const r = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.slice(0, 40), canvases: document.querySelectorAll('canvas').length, textLen: document.body?.innerText.length })).catch(() => 'page unresponsive');
    console.log(name.padEnd(26), status, `(${((Date.now() - t0) / 1000).toFixed(1)}s)`, JSON.stringify(r), '| errors:', errs.length ? errs : 'none');
    await page.screenshot({ path: `brand/main_${name.startsWith('pre') ? 'pre' : 'plain'}.png`, timeout: 60000 }).catch(() => console.log('  screenshot failed (page too busy)'));
    await page.close();
  }
  await b.close();
})();
