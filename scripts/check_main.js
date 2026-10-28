const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  // 1) a crawler that does not run JavaScript
  const nojs = await (await b.newContext({ javaScriptEnabled: false })).newPage();
  await nojs.goto('http://localhost:4173/', { waitUntil: 'load' });
  const text = await nojs.evaluate(() => document.body.textContent.replace(/\s+/g, ' '));
  const want = ['Who is Ginger-Eke Chienyegom', 'B2B digital systems architect', 'HelioConvert', 'Courses', 'store.helioconvrt.com'];
  console.log('NO-JS text length:', text.length);
  for (const w of want) console.log('  contains', JSON.stringify(w), '->', text.includes(w) || (await nojs.content()).includes(w));
  console.log('  n8n workflow JSON leaked into HTML:', (await nojs.content()).includes('"nodes"'));
  // 2) a normal visitor
  const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 160))); page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 160)));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  console.log('JS visitor console errors:', errs.length ? errs : 'none');
  console.log('JS visitor: nav "Courses" link ->', await page.locator('nav a[href="https://store.helioconvrt.com"]').count(), '| footer store link ->', await page.locator('footer a[href="https://store.helioconvrt.com"]').count());
  console.log('JS visitor: canvases (3D scenes alive):', await page.locator('canvas').count(), '| n8n embeds:', await page.locator('n8n-demo').count());
  await page.screenshot({ path: 'brand/main_home.png' });
  await b.close();
})();
