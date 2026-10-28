const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('http://localhost:4000/about', { waitUntil: 'networkidle', timeout: 120000 });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.locator('[aria-label="Menu"][role=dialog]').getByRole('link', { name: /Take the quiz/ }).click();
  await page.waitForURL('**/start');
  await page.waitForTimeout(500);
  console.log('menu drawer still open:', (await page.locator('[aria-label="Menu"][role=dialog]').count()) > 0);
  // read what the dev overlay's issue badge says
  const badge = page.locator('nextjs-portal').first();
  const text = await page.evaluate(() => { const p = document.querySelector('nextjs-portal'); return p?.shadowRoot?.textContent?.replace(/\s+/g, ' ').slice(0, 600) ?? '(no overlay)'; });
  console.log('dev overlay text:', text);
  await b.close();
})();
