// Instalação limpa → offline: abre, navega, cache miss responde controlado
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('enfcalc.aceite', 'true'));
  await p.goto((process.env.BASE || 'http://localhost:8080/enfermagem/')); await p.waitForTimeout(500);
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload(); await p.waitForTimeout(4000);           // controla a página e baixa opcionais
  const status = await p.evaluate(() => new Promise(r => { navigator.serviceWorker.addEventListener('message', e => r(e.data)); navigator.serviceWorker.controller.postMessage({ tipo: 'status-cache' }); setTimeout(() => r('sem resposta'), 3000); }));
  console.log('cache:', JSON.stringify(status));
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(800);
  console.log('offline início:', (await p.textContent('#hh-status')).trim(), '| tiles:', (await p.$$('.tile')).length);
  await p.goto((process.env.BASE || 'http://localhost:8080/enfermagem/') + '#/droga/noradrenalina'); await p.waitForTimeout(400);
  console.log('offline ficha:', (await p.textContent('.hero-n')).trim());
  await p.goto((process.env.BASE || 'http://localhost:8080/enfermagem/') + '#/scanner'); await p.waitForTimeout(1500);
  console.log('offline scanner:', (await p.textContent('#scan-base')).trim().slice(0, 70));
  const miss = await p.evaluate(() => fetch('nao-existe.js').then(r => r.status).catch(e => 'erro ' + e.message));
  console.log('cache miss offline → status', miss);
  console.log('erros', errs);
  await b.close();
  if (errs.length || miss !== 504) process.exitCode = 1;
})();
