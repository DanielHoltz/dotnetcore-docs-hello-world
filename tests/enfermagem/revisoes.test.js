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
    assert.ok(d, 'apresentação sem medicamento: ' + id);
    for (const [rot, qtd, u, vol] of lista) {
      assert.ok(rot && qtd > 0 && vol > 0, id + ' ' + rot);
      assert.ok(C.sameClass(u, d.conc.u), id + ' unidade ' + u);
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
