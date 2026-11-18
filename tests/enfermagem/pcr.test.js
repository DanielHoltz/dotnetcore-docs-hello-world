const test = require('node:test');
const assert = require('node:assert');
const E = require('../../wwwroot/enfermagem/js/emergencia.js');
const T = 10000000;
const base = (o) => Object.assign({ modo: 'adulto', ritmo: null, rce: false, choquePendente: false, nChoques: 0, nAdr: 0, nAmio: 0, ultimaAdr: null, ciclo: T }, o);

test('PCR guiada: sem ritmo → analisar; ciclo vencido → checar ritmo', () => {
  assert.strictEqual(E.proximaAcao(base(), T).id, 'analisar');
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'aesp', ultimaAdr: T, nAdr: 1 }), T + 121000).id, 'checar');
});
test('PCR guiada: ritmo chocável segue a sequência AHA', () => {
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'chocavel', choquePendente: true }), T).id, 'choque');
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'chocavel', nChoques: 1 }), T).id, 'rcp');            // sem adrenalina antes do 2º choque
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'chocavel', nChoques: 2 }), T).id, 'adrenalina');
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'chocavel', nChoques: 3, nAdr: 1, ultimaAdr: T }), T).id, 'antiarritmico');
  assert.match(E.proximaAcao(base({ ritmo: 'chocavel', nChoques: 4, nAdr: 1, ultimaAdr: T, nAmio: 1 }), T).txt, /150 mg/);
  assert.match(E.proximaAcao(base({ ritmo: 'chocavel', nChoques: 3, nAdr: 1, ultimaAdr: T, modo: 'ped' }), T).txt, /5 mg\/kg/);
});
test('PCR guiada: não chocável → adrenalina já; depois janela de 3–5 min', () => {
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'assistolia' }), T).id, 'adrenalina');
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'assistolia', nAdr: 1, ultimaAdr: T }), T + 60000).id, 'rcp');
  assert.strictEqual(E.proximaAcao(base({ ritmo: 'assistolia', nAdr: 1, ultimaAdr: T, ciclo: T + 100000 }), T + 181000).id, 'adrenalina');
  assert.strictEqual(E.proximaAcao(base({ rce: true }), T).id, 'rce');
});
