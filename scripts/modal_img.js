const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto('http://localhost:4000/library', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('button.group'); await page.waitForTimeout(1500);
  await page.locator('button.group').nth(4).click(); await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(3000);
  const img = await page.locator('[role=dialog] img').first().evaluate((i) => ({ src: i.src.slice(-50), complete: i.complete, w: i.naturalWidth, shownW: Math.round(i.getBoundingClientRect().width), shownH: Math.round(i.getBoundingClientRect().height), visible: getComputedStyle(i).visibility + '/' + getComputedStyle(i).opacity }));
  console.log('modal cover:', JSON.stringify(img));
  await page.screenshot({ path: 'brand/modal2.png' });
  await b.close();
})();
