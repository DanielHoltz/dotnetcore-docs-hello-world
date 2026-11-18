// Mede abertura do app simulando celular lento: CPU 4× mais lenta e rede 4G fraca (1,6 Mbps, 150 ms), sem cache, com gzip como em produção
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
// servidor local com gzip (como o GitHub Pages), servindo wwwroot/
const RAIZ = path.join(__dirname, '..', '..', 'wwwroot');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
function servidor() {
  return http.createServer((req, res) => {
    let f = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const corpo = fs.readFileSync(f), tipo = TIPOS[path.extname(f)] || 'application/octet-stream';
    if (/gzip/.test(req.headers['accept-encoding'] || '') && !/png/.test(tipo)) { res.writeHead(200, { 'Content-Type': tipo, 'Content-Encoding': 'gzip' }); res.end(zlib.gzipSync(corpo)); }
    else { res.writeHead(200, { 'Content-Type': tipo }); res.end(corpo); }
  });
}
(async () => {
  const srv = servidor(); await new Promise(r => srv.listen(8099, r));
  const base = process.env.BASE || 'http://localhost:8099/enfermagem/';
  const b = await chromium.launch();
  const medir = async (rede) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    if (rede) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await p.addInitScript(() => {
      localStorage.setItem('enfcalc.aceite', 'true');
      window.__lcp = 0; new PerformanceObserver(l => { const e = l.getEntries(); window.__lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const t0 = Date.now(); await p.goto(base + '#/'); await p.waitForSelector('.tile'); const conteudo = Date.now() - t0;
    await p.waitForTimeout(500);
    const m = await p.evaluate(() => ({ lcp: Math.round(window.__lcp), bytes: performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) }));
    const t1 = Date.now(); await p.click('#hh-search'); await p.fill('#pal-q', 'losartan'); await p.waitForSelector('#pal-res .card'); const busca = Date.now() - t1;
    await ctx.close();
    return { conteudo, lcp: m.lcp, kb: Math.round(m.bytes / 1024), busca };
  };
  const a = await medir(false), c = await medir(true);
  console.log('CPU 4× (sem limite de rede): tela inicial ' + a.conteudo + ' ms · LCP ' + a.lcp + ' ms · busca ' + a.busca + ' ms');
  console.log('CPU 4× + 4G fraca:   tela inicial ' + c.conteudo + ' ms · LCP ' + c.lcp + ' ms · ' + c.kb + ' KB transferidos · busca ' + c.busca + ' ms');
  await b.close(); srv.close();
})();
