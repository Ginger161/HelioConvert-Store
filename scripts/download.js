// Phase 1b: for each product in catalog.json, scrape metadata and download its ZIP into raw_assets/<id>/
// usage: node scripts/download.js [limit] [concurrency]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LIMIT = parseInt(process.argv[2] || '0', 10);
const CONC = parseInt(process.argv[3] || '3', 10);
const catalog = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));
const todo = LIMIT ? catalog.slice(0, LIMIT) : catalog;

async function scrape(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const lines = main.innerText.split('\n').map(s => s.trim()).filter(Boolean);
    const after = k => { const i = lines.indexOf(k); return i >= 0 ? lines[i + 1] : null; };
    const bi = lines.indexOf('Back to Library');
    const crumbs = [];
    for (let i = bi + 1; i < lines.length && crumbs.length < 4; i++) crumbs.push(lines[i]);
    const desc = lines.slice(bi + 1, lines.indexOf('Save Product')).join('\n');
    return {
      h1: document.querySelector('h1')?.innerText?.trim() || null, // the product's real title (crumbs vary in depth)
      crumbs, description: desc,
      contains: after('THIS PRODUCT CONTAINS'), fileType: after('File type'), fileSize: after('File size'), added: after('Date added'),
    };
  });
}

async function work(ctx, item) {
  const dir = path.join('raw_assets', item.id);
  if (fs.existsSync(path.join(dir, 'meta.json'))) {
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    if (m.link || m.skipped || fs.readdirSync(dir).some(f => f !== 'meta.json')) return 'skip';
  }
  fs.mkdirSync(dir, { recursive: true });
  const page = await ctx.newPage();
  try {
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('button', { name: /download product/i }).waitFor({ timeout: 120000 });
    const meta = { id: item.id, url: item.url, ...(await scrape(page)) };
    if (meta.contains === 'Audio' && !process.env.INCLUDE_AUDIO) { // ~40 MB each and nothing to rebrand: metadata only
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ ...meta, skipped: 'audio' }, null, 2));
      return 'skip-audio';
    }
    // "Download product" either starts a file download (ZIP) or, for "File type: Link" products such as Notion templates,
    // opens the template in a new tab. Wait for whichever happens first; both are page-scoped so parallel workers don't clash.
    const dlP = page.waitForEvent('download', { timeout: 180000 }).then((d) => ({ d }), () => null);
    // With one worker, any tab that appears is ours, so also watch the whole context (some links open without a 'popup' event).
    const racers = [dlP, page.waitForEvent('popup', { timeout: 180000 }).then((p) => ({ p }), () => null)];
    if (CONC === 1) racers.push(new Promise((res) => { ctx.once('page', (np) => res({ p: np })); setTimeout(() => res(null), 180000); }));
    const firstOf = () => new Promise((resolve) => {
      let pending = racers.length;
      const settle = (v) => { if (v) resolve(v); else if (--pending === 0) resolve(null); };
      racers.forEach((r) => r.then(settle));
    });
    // The button is in the HTML before the page's click handler is attached, and an early click silently does nothing.
    // So: let the page settle, click, and if nothing happens within 30s click again (up to 3 times).
    await page.waitForTimeout(3500);
    let got = null;
    for (let attempt = 0; attempt < 3 && !got; attempt++) {
      await page.getByRole('button', { name: /download product/i }).click();
      got = await Promise.race([firstOf(), new Promise((r) => setTimeout(() => r('wait'), 30000))]);
      if (got === 'wait') got = null;
    }
    if (!got) throw new Error('neither a file download nor a new tab after clicking Download (3 attempts)');
    let link = '';
    if (got.p) {
      await got.p.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
      link = got.p.url();
      if (!link || link === 'about:blank') link = await got.p.waitForURL((u) => u.href !== 'about:blank', { timeout: 15000 }).then(() => got.p.url()).catch(() => '');
      await got.p.close().catch(() => {});
      if (!/^https?:\/\//.test(link)) { // ZIP downloads also open a blank tab; that tab is not the product, so wait for the file
        got = await dlP;
        if (!got) throw new Error('a blank tab opened but no file download followed');
      }
    }
    if (got.p) {
      meta.link = link;
      meta.delivery = 'link';
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
      return 'ok-link ' + meta.crumbs.slice(-1) + ' -> ' + link.slice(0, 90);
    }
    const file = path.join(dir, got.d.suggestedFilename());
    await got.d.saveAs(file);
    meta.file = path.basename(file);
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
    return 'ok ' + meta.crumbs.slice(-1) + ' -> ' + meta.file;
  } catch (e) {
    fs.writeFileSync(path.join(dir, 'error.txt'), String(e));
    return 'FAIL ' + String(e).split('\n')[0];
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: 'auth.json', acceptDownloads: true });
  let idx = 0, done = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (idx < todo.length) {
      const it = todo[idx++];
      const r = await work(ctx, it);
      console.log(`[${++done}/${todo.length}] ${it.id.slice(0, 8)} ${r}`);
    }
  }));
  await browser.close();
})();
