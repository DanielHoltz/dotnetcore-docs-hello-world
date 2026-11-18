// Testes de rastreabilidade (fontes/revisões) e da conferência na maleta.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../../wwwroot/enfermagem/js/revisoes.js');
const M = require('../../wwwroot/enfermagem/js/maletas.js');
const D = require('../../wwwroot/enfermagem/js/data.js');

test('termo de busca na Anvisa', () => {
  const by = id => D.DRUGS.find(d => d.id === id);
  assert.equal(R.termoAnvisa(by('adrenalina')), 'epinefrina');
  assert.equal(R.termoAnvisa(by('ceftriaxona')), 'Ceftriaxona');
  assert.equal(R.termoAnvisa(by('glicose-50')), 'glicose');
  assert.match(R.urlAnvisa(by('pipe-tazo')), /nomeProduto=tazobactam$/);
  for (const d of D.DRUGS) assert.ok(R.termoAnvisa(d).length >= 4 && !/%|\(/.test(R.termoAnvisa(d)), d.id);
  for (const k of Object.keys(R.BUSCA_ANVISA)) assert.ok(D.DRUGS.some(d => d.id === k), k);
});

test('revisões registradas são completas e referem medicamentos existentes', () => {
  for (const [id, r] of Object.entries(R.REVISOES)) {
    assert.ok(D.DRUGS.some(d => d.id === id), id);
    assert.ok(r.por && /^\d{4}-\d{2}-\d{2}$/.test(r.data) && r.fonte, id);
  }
});

test('conferência do item: sanitização e exportação/importação', () => {
  assert.equal(M.cleanConferido({ por: '', data: '2026-11-15' }), null);
  assert.equal(M.cleanConferido({ por: 'Ana', data: 'ontem' }), null);
  const m = M.novaMaleta('k');
  m.itens.push(M.novoItem({ drugId: 'ceftriaxona', conferido: { por: 'Ana COREN 123', data: '2026-11-15' } }));
  const r = M.importar(JSON.parse(JSON.stringify(M.exportar(m))), D.DRUGS.map(d => d.id));
  assert.deepEqual(r.maleta.itens[0].conferido, { por: 'Ana COREN 123', data: '2026-11-15' });
});

test('conferências com fontes: ids válidos e URLs https', () => {
  for (const [id, fontes] of Object.entries(R.VERIFICACOES)) {
    assert.ok(D.DRUGS.some(d => d.id === id), id);
    assert.ok(fontes.length > 0, id);
    for (const f of fontes) assert.match(f.url, /^https:\/\/[^\s]+$/, id + ': ' + f.url);
  }
  assert.equal(R.verificacao('dexametasona'), null);
});

test('piperacilina+tazobactam usa volume final de ~23 mL', () => {
  const pt = D.DRUGS.find(d => d.id === 'pipe-tazo');
  assert.equal(pt.conc.vol, 23);
});

test('bulário: todos os medicamentos têm resumo completo e categoria válida', () => {
  const B = require('../../wwwroot/enfermagem/js/bulario.js');
  const cats = new Set(B.CATEGORIAS.map(c => c.id));
  for (const d of D.DRUGS) {
    const b = B.bula(d.id);
    assert.ok(b, 'sem bula: ' + d.id);
    assert.ok(cats.has(b.cat), d.id + ' categoria');
    for (const k of ['ind', 'contra', 'adv', 'enf', 'gest']) assert.ok(b[k] && b[k].length > 10, d.id + ' campo ' + k);
  }
  assert.equal(Object.keys(B.BULA).length, D.DRUGS.length);
});

test('apresentações comerciais: ids válidos, unidades compatíveis e valores positivos', () => {
  const A = require('../../wwwroot/enfermagem/js/apresentacoes.js');
  const C = require('../../wwwroot/enfermagem/js/calc.js');
  for (const [id, lista] of Object.entries(A.AP)) {
    const d = D.DRUGS.find(x => x.id === id);
    const x = require('../../wwwroot/enfermagem/js/bulario_extra.js').EXTRAS.find(e => e.id === id);
    assert.ok(d || (x && x.ap), 'apresentação sem medicamento: ' + id);
    for (const [rot, qtd, u, vol] of lista) {
      assert.ok(rot && qtd > 0 && vol > 0, id + ' ' + rot);
      assert.ok(C.sameClass(u, d ? d.conc.u : x.ap[0][2]), id + ' unidade ' + u);
    }
  }
  assert.ok(D.DRUGS.filter(d => A.AP[d.id]).length >= 75);
});

test('bulário ampliado: fichas resumidas válidas e sem conflito de id', () => {
  const X = require('../../wwwroot/enfermagem/js/bulario_extra.js').EXTRAS;
  const B = require('../../wwwroot/enfermagem/js/bulario.js');
  const C = require('../../wwwroot/enfermagem/js/calc.js');
  const cats = new Set(B.CATEGORIAS.map(c => c.id)), ids = new Set();
  for (const x of X) {
    assert.ok(!ids.has(x.id) && !D.DRUGS.some(d => d.id === x.id), 'id repetido: ' + x.id); ids.add(x.id);
    assert.ok(cats.has(x.cat), x.id + ' categoria');
    for (const k of ['nome', 'classe', 'via', 'apres', 'ind', 'enf']) assert.ok(x[k] && x[k].length > 2, x.id + ' ' + k);
    for (const a of x.ap || []) assert.ok(a[1] > 0 && a[3] > 0 && C.UNITS[a[2]], x.id + ' ap');
  }
  assert.ok(X.length + D.DRUGS.length >= 170);
});

test('protocolos: estrutura, medicamentos existentes e links do Manual MSD', () => {
  const PR = require('../../wwwroot/enfermagem/js/protocolos.js');
  const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');
  const ids = new Set([...D.DRUGS.map(d => d.id), ...X.EXTRAS.map(x => x.id)]);
  const grupos = new Set(PR.GRUPOS.map(g => g.id)), vistos = new Set();
  assert.ok(PR.PROTOCOLOS.length >= 53);
  for (const p of PR.PROTOCOLOS) {
    assert.ok(!vistos.has(p.id), 'id repetido ' + p.id); vistos.add(p.id);
    assert.ok(grupos.has(p.grupo), p.id + ' grupo');
    assert.ok(p.msd.length && p.msd.every(([t, c]) => t && c.startsWith('/pt/profissional/')), p.id + ' msd');
    assert.ok(p.secoes.some(s => s.tipo === 'meds'), p.id + ' sem medicamentos');
    for (const s of p.secoes) {
      assert.ok(['lista', 'passos', 'meds'].includes(s.tipo) && s.itens.length, p.id + ' seção');
      if (s.tipo === 'meds') for (const [id, txt] of s.itens) assert.ok((id === null || ids.has(id)) && txt, p.id + ' med ' + id);
    }
  }
  assert.ok(X.EXTRAS.every(x => X.DOSE[x.id]), 'toda ficha resumida tem posologia');
});

test('conferência das fichas resumidas: todas registradas, com status e fontes válidas', () => {
  const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');
  assert.match(X.CONF_DATA, /^\d{4}-\d{2}-\d{2}$/);
  for (const x of X.EXTRAS) {
    const c = X.CONFERENCIA[x.id];
    assert.ok(c, 'sem conferência: ' + x.id);
    assert.ok(['ok', 'ajustado', 'parcial', 'sem-fonte'].includes(c.st), x.id + ' status');
    assert.ok(c.st === 'ok' || c.nota, x.id + ' precisa de nota');
    for (const [rot, url] of c.fontes) assert.ok(rot && (url.startsWith('https://dailymed.nlm.nih.gov/') || url.startsWith('/pt/profissional/')), x.id + ' fonte');
    if (c.st === 'ok' || c.st === 'ajustado') assert.ok(c.fontes.length, x.id + ' conferida sem fonte');
  }
  assert.strictEqual(Object.keys(X.CONFERENCIA).length, X.EXTRAS.length);
});

test('novas fichas: categorias válidas e pele/feridas', () => {
  const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');
  const B = require('../../wwwroot/enfermagem/js/bulario.js');
  const cats = new Set(B.CATEGORIAS.map(c => c.id));
  assert.ok(X.EXTRAS.every(x => cats.has(x.cat)));
  assert.ok(X.EXTRAS.filter(x => x.cat === 'pele').length >= 8);
  assert.ok(X.EXTRAS.length >= 165);
  const ids = X.EXTRAS.map(x => x.id); assert.strictEqual(new Set(ids).size, ids.length);
});

test('módulos por área: referências válidas', () => {
  const MOD = require('../../wwwroot/enfermagem/js/modulos.js');
  const PR = require('../../wwwroot/enfermagem/js/protocolos.js');
  const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');
  const ids = new Set([...D.DRUGS.map(d => d.id), ...X.EXTRAS.map(x => x.id)]);
  const prot = new Set(PR.PROTOCOLOS.map(p => p.id)), esc = new Set(D.SCALES.map(s => s.id));
  assert.ok(MOD.MODULOS.length >= 8);
  for (const m of MOD.MODULOS) {
    m.drogas.forEach(i => assert.ok(ids.has(i), m.id + ' droga ' + i));
    m.protocolos.forEach(i => assert.ok(prot.has(i), m.id + ' protocolo ' + i));
    m.escalas.forEach(i => assert.ok(esc.has(i), m.id + ' escala ' + i));
    m.atalhos.forEach(a => assert.ok(a[0].startsWith('#/') && a[2]));
    assert.ok(m.protocolos.length >= 5 && m.drogas.length >= 12 && m.escalas.length >= 3 && m.calcs.length >= 3, m.id + ' módulo incompleto');
  }
});

test('apresentações de mercado: listas de seleção e composição de solução', () => {
  const A = require('../../wwwroot/enfermagem/js/apresentacoes.js');
  assert.deepStrictEqual(A.diluentesDe('SF 0,9% (somente)'), ['SF 0,9%']);
  assert.deepStrictEqual(A.diluentesDe('SF 0,9% ou SG 5%'), ['SF 0,9%', 'SG 5%']);
  assert.ok(A.VOLUMES.includes(0) && A.VOLUMES.includes(100) && A.TEMPOS.includes(30));
  for (const inf of D.INFUSIONS) {
    const aps = A.paraInfusao(inf.id);
    assert.ok(aps.length, 'sem apresentação para a infusão ' + inf.id);
  }
  const c = A.compor(A.paraInfusao('noradrenalina'), 16, 'mg');
  assert.deepStrictEqual(c, { i: 0, n: 4 });
});

test('catálogo CMED/Anvisa: ≥ 1.400 princípios ativos, sem duplicar fichas do app', () => {
  const CT = require('../../wwwroot/enfermagem/js/catalogo.js');
  const B = require('../../wwwroot/enfermagem/js/bulario.js');
  const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');
  const cats = new Set(B.CATEGORIAS.map(c => c.id));
  const appIds = new Set([...D.DRUGS.map(d => d.id), ...X.EXTRAS.map(x => x.id)]);
  assert.ok(CT.total >= 2000);
  assert.ok(CT.CAT.every(a => [0, 1, 2].includes(a[12])));
  assert.ok(CT.total + appIds.size >= 1500, 'total de medicamentos');
  const ids = new Set();
  for (const a of CT.CAT) {
    const c = CT.item(a);
    assert.ok(/^[cr]-/.test(c.id) && !ids.has(c.id) && !appIds.has(c.id), 'id ' + c.id); ids.add(c.id);
    assert.ok(c.nome && cats.has(c.cat) && [-1, 0, 1, 2, 3].includes(c.tarja) && c.tmax >= c.tarja, c.id);
    assert.ok(Array.isArray(c.ap) && Array.isArray(c.marcas) && Number.isInteger(c.gen));
    for (const m of c.marcas) assert.ok(m[0] && 'RNBESFOG'.includes(m[1]), c.id + ' marca ' + m);
  }
  assert.ok(CT.mercado('dipirona').marcas.length > 0);
  assert.ok(CT.mercado('losartana').marcas.some(m => m[0] === 'Cozaar' && m[1] === 'R'), 'Cozaar é a referência da losartana');
  assert.ok(CT.mercado('sinvastatina') && CT.mercado('sinvastatina').gen > 0);
  assert.ok(CT.mercado('losartana').nomes.includes('Losartan'), 'variação Losartan ligada à Losartana');
  assert.ok(!CT.CAT.some(a => a[1] === 'Losartan'), 'Losartan não vira ficha separada');
  assert.ok(CT.CAT.some(a => a[1] === 'Cefalexina') || CT.mercado('cefalexina'), 'cefalexina existe');
  assert.ok(CT.mercado('cefalotina') && !CT.mercado('cefalotina').nomes.some(n => /cefalexina/i.test(n)), 'cefalotina não se mistura com cefalexina');
  assert.match(CT.FONTE.data, /^\d{4}-\d{2}-\d{2}$/);
});

test('protocolos: todos com referências institucionais (brasileiras e/ou internacionais)', () => {
  const PR = require('../../wwwroot/enfermagem/js/protocolos.js');
  for (const p of PR.PROTOCOLOS) {
    const f = PR.fontes(p.id);
    assert.ok(f.length >= 1, p.id + ' sem referências');
    f.forEach(r => assert.ok(r.org && r.t, p.id + ' referência incompleta'));
  }
  for (const k of Object.values(PR.FONTES).flat()) assert.ok(PR.REFS[k], 'referência inexistente: ' + k);
  const comBR = PR.PROTOCOLOS.filter(p => PR.fontes(p.id).some(r => r.br)).length;
  assert.ok(comBR >= 40, 'protocolos com referência brasileira: ' + comBR);
});

test('escalas novas: pontuação e interpretação', () => {
  const S = id => D.SCALES.find(s => s.id === id);
  assert.strictEqual(S('cincinnati').interp(1).level, 'bad');
  assert.strictEqual(S('curb65').interp(3).level, 'bad');
  assert.strictEqual(S('curb65').interp(1).level, 'ok');
  assert.match(S('wells-tep').interp(7).txt, /alta/);
  assert.strictEqual(S('bishop').interp(9).level, 'ok');
  assert.strictEqual(S('katz').interp(6).level, 'ok');
  assert.strictEqual(S('push').interp(0).txt, 'Lesão cicatrizada');
  assert.ok(D.SCALES.every(s => s.items.length && typeof s.interp === 'function'));
});

test('classes terapêuticas: códigos válidos e nomes legíveis', () => {
  const CT = require('../../wwwroot/enfermagem/js/catalogo.js');
  const ks = Object.keys(CT.CLASSES);
  assert.ok(ks.length >= 400);
  ks.forEach(k => { assert.match(k, /^[A-Z][A-Z0-9]*$/); assert.ok(CT.CLASSES[k].length > 3); });
  const comCC = CT.CAT.filter(a => CT.item(a).cc).length;
  assert.ok(comCC >= 1700, 'itens com classe: ' + comCC);
  CT.CAT.forEach(a => { const c = CT.item(a); if (c.cc) assert.ok(CT.CLASSES[c.cc], 'classe sem nome: ' + c.cc); });
  assert.strictEqual(CT.mercado('losartana').cc.charAt(0), 'C');
  assert.strictEqual(CT.CLASSES['C10A1'], 'Estatinas, inibidores da redutase HMG-CoA');
});
