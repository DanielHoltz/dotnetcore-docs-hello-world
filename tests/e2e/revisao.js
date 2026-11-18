// Regressão dos achados da revisão técnica, no navegador
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), base = (process.env.BASE || 'http://localhost:8080/enfermagem/');
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('enfcalc.aceite', 'true'); });
  const res = [];
  const ok = (nome, cond, extra) => res.push((cond ? '✅ ' : '❌ ') + nome + (extra ? ' — ' + extra : ''));

  // 1. parser: "2mg" e "1.234"
  await p.goto(base + '#/calc/gotejamento'); await p.waitForTimeout(300);
  const campo = (await p.$$('#calc-form input[inputmode=decimal], form input[inputmode=decimal]'))[0];
  await campo.fill('2mg'); await p.waitForTimeout(150);
  ok('1a. "2mg" rejeitado', !!(await p.$('.num-err')) && /Corrija/.test(await p.textContent('#calc-out')));
  await campo.fill('1.234'); await p.waitForTimeout(150);
  ok('1b. "1.234" pede correção', /Ambíguo/.test(await p.textContent('.num-err')));
  await campo.fill('500'); await p.waitForTimeout(150);
  ok('1c. valor válido limpa o erro', !(await p.$('.num-err')));

  // 2. dose por dia sem doses/dia
  await p.goto(base + '#/calc/dose-peso'); await p.waitForTimeout(300);
  await p.check('input[data-k=tipo][value=dia]', { force: true });
  await p.fill('input[data-k=nx]', ''); await p.waitForTimeout(150);
  ok('2a. doses/dia vazio bloqueia', /doses por dia/.test(await p.textContent('#calc-out')));
  await p.fill('input[data-k=nx]', '0'); await p.waitForTimeout(150);
  ok('2b. doses/dia = 0 bloqueia', /doses por dia/.test(await p.textContent('#calc-out')));
  await p.fill('input[data-k=nx]', '4'); await p.waitForTimeout(150);
  ok('2c. doses/dia = 4 calcula 45 mg', /45/.test(await p.textContent('#calc-out')));

  // 3. ampicilina (infusão): sem opção Bolus
  await p.evaluate(() => localStorage.setItem('enfcalc.paciente', JSON.stringify({ peso: 70, idade: 40, idadeU: 'anos', alergias: [] })));
  await p.goto(base + '#/maleta/lib/atender/ampicilina'); await p.waitForTimeout(500);
  const opts = await p.$$eval('#pr-t option', o => o.map(x => x.textContent));
  ok('3. ampicilina sem "Bolus" no tempo', opts.length > 0 && !opts.includes('Bolus'), opts.slice(0, 3).join(', '));

  // 7. conversão pequena
  await p.goto(base + '#/calc/conversao'); await p.waitForTimeout(300);
  const ins = await p.$$('form input[inputmode=decimal]'); await ins[0].fill('1');
  const sels = await p.$$('form select');
  if (sels.length >= 2) { await sels[0].selectOption('ng').catch(() => {}); await sels[sels.length - 1].selectOption('g').catch(() => {}); }
  await p.waitForTimeout(200);
  const conv = await p.textContent('#calc-out');
  ok('7. 1 ng → g não vira zero', /10⁻⁹|0,000000001/.test(conv), conv.replace(/\s+/g, ' ').slice(0, 60));

  // 4. apagar dados
  await p.evaluate(() => { ['paciente', 'registro', 'favs', 'escHist', 'plantao'].forEach(k => localStorage.setItem('enfcalc.' + k, '[1]')); });
  await p.goto(base + '#/sobre'); await p.waitForTimeout(300);
  await p.click('#clear-data'); await p.click('#ask-ok'); await p.waitForTimeout(200);
  const sobra = await p.evaluate(() => ['paciente', 'registro', 'favs', 'escHist', 'plantao'].filter(k => localStorage.getItem('enfcalc.' + k) != null));
  const mal = await p.evaluate(() => localStorage.getItem('enfcalc.aceite'));
  ok('4. apagar remove paciente/registro/favoritos/etc.', sobra.length === 0 && mal === 'true', sobra.join(','));

  // 9/10. diálogo: foco preso, Enter em Cancelar não confirma, foco volta
  await p.goto(base + '#/pcr'); await p.waitForTimeout(300);
  await p.click('#pcr-go'); await p.waitForTimeout(300);
  await p.focus('#pcr-outro'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  await p.fill('#ask-in', 'teste não deve registrar');
  for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
  const dentro = await p.evaluate(() => !!document.activeElement.closest('.modal'));
  ok('9a. Tab fica dentro do diálogo', dentro);
  await p.focus('#ask-no'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const log = await p.textContent('#pcr-log');
  ok('10. Enter em Cancelar não registra', !/teste não deve/.test(log));
  ok('9b. foco volta ao botão que abriu', await p.evaluate(() => document.activeElement && document.activeElement.id) === 'pcr-outro');

  // 18. PCR iniciar → encerrar → nova sem erros de timer
  await p.click('#pcr-fim'); await p.click('#ask-ok'); await p.waitForTimeout(200);
  await p.click('#pcr-nova'); await p.click('#ask-ok'); await p.waitForTimeout(1500);
  ok('18. nova PCR sem timer órfão', !errs.length && !!(await p.$('#pcr-go')), errs.join(' | '));

  // 19. busca de protocolos pelo conteúdo
  await p.goto(base + '#/protocolos'); await p.waitForTimeout(300);
  await p.fill('#pq', 'noradrenalina'); await p.waitForTimeout(200);
  ok('19. "noradrenalina" encontra Sepse', /Sepse/i.test(await p.textContent('#pl')));

  // 20. rota malformada
  await p.goto(base + '#/droga/dipirona/%E0%A4%A'); await p.waitForTimeout(300);
  ok('20. rota malformada → não encontrado', !errs.length && (await p.textContent('#app')).length > 0, errs.join(' | '));

  // 11/21. aria-current e abas por teclado
  await p.goto(base + '#/droga/noradrenalina'); await p.waitForTimeout(400);
  ok('21. aria-current na navegação', await p.$eval('.tabbar a.active', a => a.getAttribute('aria-current')) === 'page');
  await p.focus('#tab-preparo'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
  ok('11. seta → próxima aba', await p.evaluate(() => document.activeElement.id) === 'tab-bula' && await p.$eval('#pane-bula', x => !x.hidden));
  ok('11b. painel ligado à aba', await p.$eval('#pane-bula', x => x.getAttribute('aria-labelledby')) === 'tab-bula');

  // 12. status acessível
  await p.goto(base + '#/'); await p.waitForTimeout(300);
  ok('12. status online/offline anunciável', await p.$eval('#hh-status', x => x.getAttribute('role')) === 'status');

  // 17. rascunho da calculadora
  await p.goto(base + '#/calc/pam'); await p.waitForTimeout(300);
  const pi = await p.$$('form input[inputmode=decimal]'); await pi[0].fill('133'); await p.waitForTimeout(100);
  await p.goto(base + '#/'); await p.waitForTimeout(200); await p.goto(base + '#/calc/pam'); await p.waitForTimeout(300);
  ok('17. calculadora lembra o valor', await (await p.$$('form input[inputmode=decimal]'))[0].inputValue() === '133');

  console.log(res.join('\n'));
  console.log('erros de página:', errs);
  await b.close();
  if (res.some(r => r.startsWith('❌')) || errs.length) process.exitCode = 1;
})();
