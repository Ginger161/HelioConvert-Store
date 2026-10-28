// Reference study only: capture viewport-sized screenshots of Entrepedia's UX for design principles.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'auth.json', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const shots = [
    ['https://www.entrepedia.co/library', 'brand/ref_library.png', 0],
    ['https://www.entrepedia.co/library', 'brand/ref_library2.png', 900],
    ['https://www.entrepedia.co/recommendation-quiz?step=1', 'brand/ref_quiz.png', 0],
    ['https://www.entrepedia.co/library/bundles/content-creation-on-instagram', 'brand/ref_bundle.png', 0],
  ];
  for (const [url, out, y] of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: out });
    console.log('saved', out);
  }
  // public landing page (logged out) shows how they pitch beginners
  const anon = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await anon.goto('https://www.entrepedia.co', { waitUntil: 'networkidle', timeout: 90000 });
  await anon.waitForTimeout(1500);
  await anon.screenshot({ path: 'brand/ref_landing.png' });
  console.log((await anon.innerText('body')).slice(0, 1800));
  await browser.close();
})();
