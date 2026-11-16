// Testes de emergência (APLS/PALS/AHA) e das novas escalas.
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../../wwwroot/enfermagem/js/emergencia.js');
const D = require('../../wwwroot/enfermagem/js/data.js');

test('peso estimado APLS', () => {
  assert.equal(E.pesoEstimado(6).kg, 7.5);        // (6 + 9)/2
  assert.equal(E.pesoEstimado(36).kg, 14);        // 2×3 + 8
  assert.equal(E.pesoEstimado(8 * 12).kg, 31);    // 3×8 + 7
  assert.equal(E.pesoEstimado(15 * 12), null);
});

test('cânula traqueal (≥ 2 anos)', () => {
  assert.deepEqual(E.tuboTraqueal(4 * 12), { comCuff: 4.5, semCuff: 5 });
  assert.deepEqual(E.tuboTraqueal(6 * 12), { comCuff: 5, semCuff: 5.5 });
  assert.equal(E.tuboTraqueal(12), null);
});

test('energias PALS', () => {
  const e = E.energias(20);
  assert.equal(e.desf1, 40); assert.equal(e.desf2, 80); assert.equal(e.desfMax, 200);
  assert.deepEqual(e.cardio1, [10, 20]); assert.equal(e.cardio2, 40);
  assert.equal(E.energias(50).desfMax, 200);      // limitado à dose adulta
});

test('doses PCR', () => {
  assert.equal(E.dosesPCR(false).adrenalina.mg, 1);
  assert.equal(E.dosesPCR(false).amiodarona[1].mg, 150);
  const p = E.dosesPCR(true, 20);
  assert.equal(p.adrenalina.mg, 0.2); assert.equal(p.adrenalina.ml01, 2);
  assert.equal(p.amiodarona[0].mg, 100);
  assert.equal(E.dosesPCR(true, 120).adrenalina.mg, 1);
});

test('lembrete de adrenalina e mm:ss', () => {
  assert.equal(E.mmss(125), '02:05');
  assert.equal(E.statusAdrenalina(null).fase, 'nenhuma');
  assert.equal(E.statusAdrenalina(100).fase, 'aguardar');
  assert.equal(E.statusAdrenalina(200).fase, 'janela');
  assert.equal(E.statusAdrenalina(400).fase, 'atrasada');
});

const scale = id => D.SCALES.find(s => s.id === id);
test('NEWS2: faixas e regra do parâmetro com 3 pontos', () => {
  const n = scale('news2');
  assert.equal(n.items.length, 7);
  assert.equal(n.interp(0, [0, 0, 0, 0, 0, 0, 0]).level, 'ok');
  assert.equal(n.interp(3, [3, 0, 0, 0, 0, 0, 0]).level, 'warn');
  assert.equal(n.interp(5, [2, 1, 2, 0, 0, 0, 0]).level, 'bad');
  assert.match(n.interp(7, [3, 2, 2, 0, 0, 0, 0]).txt, /ALTO/);
});

test('FLACC, CPOT e Aldrete: pontuação máxima e cortes', () => {
  const max = s => s.items.reduce((a, it) => a + Math.max(...it.opts.map(o => o[0])), 0);
  assert.equal(max(scale('flacc')), 10);
  assert.equal(max(scale('cpot')), 8);
  assert.equal(max(scale('aldrete')), 10);
  assert.equal(scale('cpot').interp(3).level, 'warn');
  assert.equal(scale('cpot').interp(2).level, 'ok');
  assert.equal(scale('aldrete').interp(8).level, 'ok');
  assert.equal(scale('flacc').interp(7).level, 'bad');
});

test('SRI: doses por peso e volume', () => {
  const r = E.sriDoses(70, false);
  const by = id => r.find(x => x.id === id);
  assert.equal(by('etomidato').dose, 21); assert.equal(by('etomidato').ml, 10.5);
  assert.equal(by('rocuronio').dose, 84); assert.equal(by('rocuronio').ml, 8.4);
  assert.equal(by('succinilcolina').dose, 105);
  assert.equal(by('fentanil').dose, 140); assert.equal(by('fentanil').ml, 2.8);
  assert.equal(E.sriDoses(150, false).find(x => x.id === 'etomidato').dose, 40);   // teto
  assert.equal(E.sriDoses(8, true).find(x => x.id === 'succinilcolina').porKg, 2); // lactente
  assert.equal(E.sriDoses(0), null);
});

test('hipodermóclise: limites por sítio', () => {
  const ok = E.hipodermoclise(1000, 24, 1);
  assert.ok(Math.abs(ok.porSitio - 41.67) < 0.01); assert.equal(ok.acimaVelocidade, false); assert.equal(ok.acimaVolume, false);
  const alto = E.hipodermoclise(2000, 24, 1);
  assert.equal(alto.acimaVolume, true); assert.equal(alto.sitiosNecessarios, 2);
  assert.equal(E.hipodermoclise(500, 4, 1).acimaVelocidade, true);
  assert.equal(E.hipodermoclise(2000, 24, 2).acimaVolume, false);
});

test('hipodermóclise: marcações referem medicamentos do bulário', () => {
  const B = require('../../wwwroot/enfermagem/js/bulario.js');
  for (const [id, h] of Object.entries(B.HIPO)) {
    assert.ok(D.DRUGS.some(d => d.id === id), id);
    assert.ok(['sim', 'nao', 'diverge'].includes(h.st), id);
  }
});
