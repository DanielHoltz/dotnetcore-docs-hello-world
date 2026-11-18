// Testes de regressão dos achados da revisão técnica (parser, via × tempo)
const test = require('node:test');
const assert = require('node:assert');
const C = require('../../wwwroot/enfermagem/js/calc.js');
const P = require('../../wwwroot/enfermagem/js/paciente.js');
const DB = require('../../wwwroot/enfermagem/js/doses.js');

test('parser numérico: aceita formatos válidos e rejeita sufixos e ambiguidade', () => {
  const v = (s) => C.numInfo(s).v, e = (s) => C.numInfo(s).erro;
  assert.strictEqual(v('12'), 12); assert.strictEqual(v('12,5'), 12.5); assert.strictEqual(v('1.234,5'), 1234.5);
  assert.strictEqual(v('5.000.000'), 5000000); assert.strictEqual(v('12.5'), 12.5); assert.strictEqual(v('0.25'), 0.25); assert.strictEqual(v(' 7 '), 7);
  assert.strictEqual(e('2mg'), 'invalido'); assert.ok(Number.isNaN(v('2mg')));
  assert.strictEqual(e('12abc'), 'invalido'); assert.strictEqual(e('1,2,3'), 'invalido'); assert.strictEqual(e('1..2'), 'invalido');
  assert.strictEqual(e('1.234'), 'ambiguo'); assert.ok(Number.isNaN(v('1.234')));
  assert.strictEqual(e(''), ''); assert.ok(Number.isNaN(v('')));
});

test('preparo: medicamento de infusão com tempo zero é bloqueado (não vira bolus)', () => {
  const pf = P.perfil({ peso: 70, idade: 40, idadeU: 'anos' });
  const r = P.preparo('ampicilina', 1000, { qtd: 1000, u: 'mg', vol: 10 }, pf, DB, 100, 0);
  assert.ok(r && r.bloqueio, 'deveria bloquear');
  const ok = P.preparo('ampicilina', 1000, { qtd: 1000, u: 'mg', vol: 10 }, pf, DB, 100, 30);
  assert.ok(ok && !ok.bloqueio && ok.mlh > 0);
  assert.strictEqual(P.permiteBolus('ampicilina', DB), false);
});

test('preparo: medicamento com velocidade máxima não aceita tempo zero', () => {
  const pf = P.perfil({ peso: 70, idade: 40, idadeU: 'anos' });
  const comVmax = Object.keys(DB.DOSES).find(id => DB.DOSES[id].vmax > 0 && (DB.DOSES[id].via || 'bolus') === 'bolus');
  if (!comVmax) return;
  const r = P.preparo(comVmax, 10, { qtd: 10, u: 'mg', vol: 1 }, pf, DB, 0, 0);
  assert.ok(r.bloqueio, comVmax);
  assert.strictEqual(P.permiteBolus(comVmax, DB), false);
});
