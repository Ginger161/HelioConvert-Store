// usage: node scripts/ld_check.js <url>...  : parse every JSON-LD block, list node types/ids, flag unresolved @id references
(async () => {
  for (const url of process.argv.slice(2)) {
    const html = await (await fetch(url)).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    const nodes = []; let bad = 0;
    for (const b of blocks) { try { const j = JSON.parse(b); nodes.push(...(j['@graph'] ?? [j])); } catch { bad++; } }
    const ids = new Set(nodes.map(n => n['@id']).filter(Boolean));
    const refs = []; JSON.stringify(nodes, (k, v) => { if (v && typeof v === 'object' && Object.keys(v).length === 1 && v['@id']) refs.push(v['@id']); return v; });
    const missing = [...new Set(refs)].filter(r => !ids.has(r));
    console.log(`\n${url}\n  blocks: ${blocks.length}, unparseable: ${bad}`);
    console.log('  nodes:', nodes.map(n => `${n['@type']}${n['@id'] ? ' [' + n['@id'].replace(/^https?:\/\/[^/]+/, '…') + ']' : ''}`).join(' | '));
    console.log('  @id references defined elsewhere (e.g. on helioconvrt.com):', missing.length ? missing.join(', ') : 'none');
  }
})();
