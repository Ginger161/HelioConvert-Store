const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const bad = fs.readdirSync('raw_assets').filter(d => fs.existsSync(`raw_assets/${d}/error.txt`) && !fs.existsSync(`raw_assets/${d}/meta.json`));
  console.log('dirs with errors and no meta:', bad.length);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'auth.json' });
  const page = await ctx.newPage();
  await page.goto(`https://www.entrepedia.co/library/product/${bad[0]}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  console.log('landed on:', page.url());
  console.log('title:', await page.title());
  console.log('has download button:', await page.getByRole('button', { name: /download product/i }).count());
  console.log((await page.innerText('body')).slice(0, 400));
  await browser.close();
})();
