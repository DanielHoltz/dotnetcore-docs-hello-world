const test = require('node:test');
const assert = require('node:assert');
const C = require('../../wwwroot/enfermagem/js/calc.js');
global.window = global.window || {};
const D = require('../../wwwroot/enfermagem/js/data.js');
const PR = require('../../wwwroot/enfermagem/js/protocolos.js');
const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');

test('novas fórmulas: superfície corporal, cálcio corrigido, água livre, corticoides', () => {
  assert.ok(Math.abs(C.superficieCorporal(70, 170) - 1.818) < 0.01);
  assert.ok(Math.abs(C.calcioCorrigido(7.8, 2.5) - 9.0) < 1e-9);
  assert.ok(Math.abs(C.deficitAguaLivre(70, 160, 0.6) - 6.0) < 1e-9);
  assert.ok(Math.abs(C.equivCorticoide(40, 'prednisona', 'dexametasona') - 6) < 1e-9);
  assert.ok(Math.abs(C.equivCorticoide(100, 'hidrocortisona', 'metilprednisolona') - 20) < 1e-9);
  assert.strictEqual(C.superficieCorporal(0, 170), null);
});

const S = id => D.SCALES.find(s => s.id === id);
test('escalas ampliadas: ≥ 40, todas categorizadas e com fonte', () => {
  assert.ok(D.SCALES.length >= 40);
  for (const id of ['nihss', 'cam-icu', 'sofa', 'fugulin', 'flebite', 'infiltracao', 'bps', 'poss', 'barthel', 'downton', 'humpty-dumpty', 'silverman', 'child-pugh', 'cha2ds2vasc', 'hasbled', 'padua', 'wells-tvp', 'glasgow-ped', 'rankin', 'hunt-hess', 'karnofsky']) {
    const s = S(id); assert.ok(s && s.fonte && s.cat, id);
  }
});
test('CAM-ICU: positivo só com 1 + 2 + (3 ou 4)', () => {
  const s = S('cam-icu');
  assert.strictEqual(s.interp(3, [1, 1, 1, 0]).level, 'bad');
  assert.strictEqual(s.interp(3, [1, 0, 1, 1]).level, 'ok');
  assert.strictEqual(s.interp(2, [1, 1, 0, 0]).level, 'ok');
});
test('pontos de corte: NIHSS, Fugulin, Barthel, CHA2DS2-VASc', () => {
  assert.match(S('nihss').interp(0, []).txt, /Sem déficit/);
  assert.match(S('nihss').interp(21, []).txt, /grave/);
  assert.match(S('fugulin').interp(9, []).txt, /mínimos/);
  assert.match(S('fugulin').interp(32, []).txt, /intensivos/);
  assert.match(S('barthel').interp(100, []).txt, /Independente/);
  assert.strictEqual(S('cha2ds2vasc').interp(1, [0, 0, 0, 0, 0, 0, 1]).level, 'ok');   // só sexo feminino
  assert.strictEqual(S('cha2ds2vasc').interp(2, [0, 1, 0, 0, 0, 0, 1]).level, 'warn');
});
test('protocolos e fichas ampliados', () => {
  assert.ok(PR.PROTOCOLOS.length >= 70);
  for (const id of ['fa', 'pneumonia', 'itu', 'pcr-ped', 'sifilis-gestacao', 'hemotransfusao', 'nutricao-enteral', 'pav', 'ics-cvc', 'itu-cateter', 'extravasamento']) {
    assert.ok(PR.PROTOCOLOS.some(p => p.id === id), id);
    assert.ok(PR.fontes(id).length >= 2, id + ' fontes');
  }
  assert.ok(X.EXTRAS.length >= 330);
  assert.ok(X.EXTRAS.find(x => x.id === 'metotrexato').hv);
  assert.match(X.DOSE.metotrexato, /UMA VEZ POR SEMANA/);
});
