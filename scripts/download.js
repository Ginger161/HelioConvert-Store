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
      crumbs, description: desc,
      contains: after('THIS PRODUCT CONTAINS'), fileType: after('File type'), fileSize: after('File size'), added: after('Date added'),
    };
  });
}

async function work(ctx, item) {
  const dir = path.join('raw_assets', item.id);
  if (fs.existsSync(path.join(dir, 'meta.json')) && fs.readdirSync(dir).some(f => f !== 'meta.json')) return 'skip';
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
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 180000 }),
      page.getByRole('button', { name: /download product/i }).click(),
    ]);
    const file = path.join(dir, dl.suggestedFilename());
    await dl.saveAs(file);
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
