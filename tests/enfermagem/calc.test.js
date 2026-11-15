// Testes do motor de cálculos do EnfCalc. Executar: node --test tests/enfermagem
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../wwwroot/enfermagem/js/calc.js');
const D = require('../../wwwroot/enfermagem/js/data.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('gotejamento: 500 mL em 8 h (macro) ≈ 21 gts/min, 62,5 mL/h', () => {
  const r = C.gotejamento(500, 480, 20);
  near(r.gotasMin, 20.8333, 1e-3);
  near(r.mlH, 62.5);
});

test('gotejamento: microgotas = mL/h', () => {
  const r = C.gotejamento(250, 300, 60);
  near(r.gotasMin, 50);
  near(r.mlH, 50);
});

test('tempo de infusão: 500 mL a 25 gts/min = 400 min', () => {
  near(C.tempoInfusao(500, 25, 20).minutos, 400);
});

test('regra de três: 250 mg de ampola 500 mg/2 mL = 1 mL; conversão mcg→mg', () => {
  near(C.volumeDose(250, 'mg', 500, 'mg', 2), 1);
  near(C.volumeDose(500, 'mcg', 1, 'mg', 1), 0.5);
  assert.throws(() => C.volumeDose(1, 'mg', 1, 'UI', 1));
});

test('penicilina cristalina: 5.000.000 UI + 8 mL (pó 2 mL) → 2.000.000 UI = 4 mL', () => {
  const r = C.reconstituicao(5e6, 8, 2);
  near(r.conc, 500000);
  near(2e6 / r.conc, 4);
});

test('noradrenalina 16 mg/250 mL, 70 kg, 0,1 mcg/kg/min ≈ 6,56 mL/h (ida e volta)', () => {
  const mlh = C.doseParaMlH(0.1, 'mcg/kg/min', 70, 16, 'mg', 250);
  near(mlh, 0.1 * 70 * 60 / 64);
  near(C.mlHParaDose(mlh, 'mcg/kg/min', 70, 16, 'mg', 250), 0.1);
});

test('dobutamina 250 mg/250 mL, 80 kg, 5 mcg/kg/min = 24 mL/h', () => {
  near(C.doseParaMlH(5, 'mcg/kg/min', 80, 250, 'mg', 250), 24);
});

test('nitroglicerina 50 mg/250 mL, 10 mcg/min = 3 mL/h (sem peso)', () => {
  near(C.doseParaMlH(10, 'mcg/min', undefined, 50, 'mg', 250), 3);
});

test('vasopressina 20 UI/100 mL, 0,03 UI/min = 9 mL/h', () => {
  near(C.doseParaMlH(0.03, 'UI/min', 0, 20, 'UI', 100), 9);
});

test('ocitocina 5 UI/500 mL, 2 mUI/min = 12 mL/h', () => {
  near(C.doseParaMlH(2, 'mUI/min', 0, 5, 'UI', 500), 12);
});

test('heparina 25.000 UI/250 mL, 18 UI/kg/h, 70 kg = 12,6 mL/h', () => {
  near(C.doseParaMlH(18, 'UI/kg/h', 70, 25000, 'UI', 250), 12.6);
});

test('midazolam 150 mg/150 mL, 0,05 mg/kg/h, 70 kg = 3,5 mL/h', () => {
  near(C.doseParaMlH(0.05, 'mg/kg/h', 70, 150, 'mg', 150), 3.5);
});

test('transformação de soro: SG 5% 500 mL → 10% com glicose 50%', () => {
  const add = C.transformacaoSoro(500, 5, 10, 50, 'adicionar');
  near(add.volHipertonico, 62.5);
  near(add.gramasFinal, 56.25);
  near((500 * 0.05 + 62.5 * 0.5) / add.volFinal, 0.10);
  const sub = C.transformacaoSoro(500, 5, 10, 50, 'substituir');
  near(sub.volHipertonico, 500 * 5 / 45);
  near(((500 - sub.desprezar) * 0.05 + sub.volHipertonico * 0.5) / 500, 0.10);
  assert.equal(C.transformacaoSoro(500, 10, 5, 50), null);
});

test('Holliday-Segar', () => {
  near(C.holliday(8).mlDia, 800);
  near(C.holliday(15).mlDia, 1250);
  near(C.holliday(30).mlDia, 1700);
});

test('clínicos: IMC, SC, PAM, Cockcroft-Gault, Parkland', () => {
  near(C.imc(70, 175), 22.857, 1e-3);
  near(C.superficieCorporal(70, 170), 1.8181, 1e-3);
  near(C.pam(120, 80), 93.333, 1e-3);
  near(C.cockcroftGault(60, 72, 1, false), 80);
  near(C.cockcroftGault(60, 72, 1, true), 68);
  const p = C.parkland(70, 30, 4);
  near(p.total, 8400); near(p.mlH8, 525); near(p.mlH16, 262.5);
});

test('Naegele: DUM 01/01/2026 → DPP 08/10/2026', () => {
  const r = C.naegele(new Date(2026, 0, 1), new Date(2026, 1, 12));
  assert.equal(r.dpp.getFullYear(), 2026); assert.equal(r.dpp.getMonth(), 9); assert.equal(r.dpp.getDate(), 8);
  assert.equal(r.semanas, 6); assert.equal(r.dias, 0);
});

test('O2: 10 L × (150 − 20) a 5 L/min = 260 min', () => {
  near(C.oxigenioCilindro(10, 150, 20, 5).minutos, 260);
});

test('dados: presets de infusão têm unidades compatíveis e faixa contendo a dose padrão', () => {
  for (const p of D.INFUSIONS) {
    const du = C.DOSE_UNITS[p.doseUnit];
    assert.ok(du, p.id + ' unidade de dose');
    assert.ok(C.sameClass(p.u, du.mass), p.id + ' classe de unidade');
    assert.ok(p.dose >= p.faixa[0] && p.dose <= p.faixa[1], p.id + ' dose na faixa');
  }
  const ids = new Set(D.INFUSIONS.map(p => p.id));
  for (const d of D.DRUGS) {
    assert.ok(C.UNITS[d.conc.u], d.id + ' unidade');
    assert.ok(d.conc.qtd > 0 && d.conc.vol > 0, d.id + ' concentração');
    if (d.infusao) assert.ok(ids.has(d.infusao), d.id + ' preset inexistente');
  }
});
