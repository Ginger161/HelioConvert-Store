// Refreshes auth.json (the saved Entrepedia session used by download.js).
// usage: node scripts/login.js
// A browser window opens on the Entrepedia sign-in page. Sign in yourself (email/password or Google); this script never sees
// your password. As soon as you land in the library it saves the session to auth.json and closes the window.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('https://www.entrepedia.co/sign-in?redirect=%2Flibrary', { waitUntil: 'domcontentloaded' });
  console.log('Sign in in the browser window that just opened. Waiting up to 10 minutes...');
  await page.waitForURL((u) => u.pathname.startsWith('/library'), { timeout: 10 * 60 * 1000 });
  await page.waitForTimeout(4000); // let the session finish settling before it is saved
  await ctx.storageState({ path: 'auth.json' });
  console.log('Saved auth.json. You can close this and tell Claude to resume the downloads.');
  await browser.close();
})().catch((e) => { console.error('Login did not complete:', String(e).split('\n')[0]); process.exit(1); });
