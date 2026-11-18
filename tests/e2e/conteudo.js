// Telas novas: POPs, Processo de Enfermagem, exames, ECG, instituição, conteúdo/revisão, relato de erro, calculadoras
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const base = process.env.BASE || 'http://localhost:8080/enfermagem/', out = process.env.SHOTS || '';
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('enfcalc.aceite', 'true'));
  const res = [], ok = (n, c, x) => res.push((c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''));
  const txt = async (s) => ((await p.textContent(s)) || '').replace(/\s+/g, ' ').trim();

  await p.goto(base + '#/pops'); await p.waitForTimeout(300);
  ok('POPs listados', (await p.$$('#popl .card')).length >= 12);
  await p.goto(base + '#/pop/sne'); await p.waitForTimeout(300);
  ok('POP sonda: confirmar por radiografia', /RADIOGRAFIA/.test(await txt('#app')));
  ok('Linha de revisão pendente', /Revisão profissional/.test(await txt('.rev-linha')));

  await p.goto(base + '#/processo-enfermagem'); await p.waitForTimeout(300);
  await p.check('[data-foco=dor]'); await p.waitForTimeout(150); await p.check('[data-foco=queda]'); await p.waitForTimeout(200);
  ok('PE gera plano com 2 focos', (await p.$$('.pe-card')).length === 2);
  if (out) await p.screenshot({ path: path.join(out, 'v7-pe.png'), fullPage: true });

  await p.goto(base + '#/laboratorio'); await p.waitForTimeout(300);
  await p.fill('#labq', 'potassio'); await p.waitForTimeout(150);
  ok('Exames: busca potássio sem acento', /3,5–5,0/.test(await txt('#labl')));

  await p.goto(base + '#/ecg'); await p.waitForTimeout(300);
  ok('ECG: ritmos listados', (await p.$$('.am-op')).length >= 14);

  await p.goto(base + '#/calc/vig'); await p.waitForTimeout(300);
  ok('VIG calculada', /5,6/.test(await txt('#calc-out')));
  await p.goto(base + '#/calc/carboplatina'); await p.waitForTimeout(300);
  ok('Calvert calculada', /575/.test(await txt('#calc-out')));

  // pacote institucional
  const pac = { formato: 'enfcalc-instituicao-1', nome: 'Hospital Teste', versao: '1', contatos: [['CCIH', 'Ramal 1']], protocolos: [{ titulo: 'Sepse local', texto: 'Linha 1\nLinha 2' }], medicamentos: { vancomicina: 'Padrão local de vancomicina.' } };
  const f = path.join(os.tmpdir(), 'pacote-teste.json'); fs.writeFileSync(f, JSON.stringify(pac));
  await p.goto(base + '#/instituicao'); await p.waitForTimeout(300);
  await p.setInputFiles('#inst-file', f); await p.waitForTimeout(500);
  ok('Pacote institucional carregado', /Hospital Teste/.test(await txt('#app')));
  await p.goto(base + '#/droga/vancomicina'); await p.waitForTimeout(400);
  ok('Padrão da instituição na ficha', /Padrão local de vancomicina/.test(await txt('#app')));
  await p.goto(base + '#/protocolos'); await p.waitForTimeout(300);
  ok('Protocolo da instituição na lista', /Sepse local/.test(await txt('#pl')));
  await p.goto(base + '#/'); await p.waitForTimeout(300);
  ok('Instituição no painel inicial', /Hospital Teste/.test(await txt('.home-hero')));

  // relato de erro (sem contato configurado: compartilhar/copiar)
  await p.goto(base + '#/droga/dipirona'); await p.waitForTimeout(400);
  await p.click('.rep-btn'); await p.fill('#ask-in', 'teste de relato'); await p.click('#ask-ok'); await p.waitForTimeout(300);
  ok('Relato de erro gerado sem falha', !errs.length);

  await p.goto(base + '#/conteudo'); await p.waitForTimeout(300);
  ok('Página de conteúdo e revisão', /Em formação/.test(await txt('#app')) && /LGPD/.test(await txt('#app')));
  ok('Anúncio de rota para leitor de tela', (await txt('#sr-rota')) === 'Conteúdo e revisão');

  const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  ok('Sem estouro de largura', !ov);
  console.log(res.join('\n')); console.log('erros de página:', errs);
  await b.close();
  if (res.some(r => r.startsWith('❌')) || errs.length) process.exitCode = 1;
})();
