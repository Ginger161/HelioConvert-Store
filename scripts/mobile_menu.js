const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('http://localhost:4000/about', { waitUntil: 'networkidle', timeout: 120000 });
  await page.screenshot({ path: 'brand/m_about.png' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'brand/m_menu.png' });
  const links = await page.locator('[role=dialog] a').count();
  await page.locator('[role=dialog]').getByRole('link', { name: /Take the quiz/ }).click();
  await page.waitForURL('**/start');
  console.log('menu links:', links, '| after tapping quiz -> url:', page.url(), '| menu closed:', (await page.locator('[role=dialog]').count()) === 0);
  await b.close();
})();
