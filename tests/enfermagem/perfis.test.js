const test = require('node:test');
const assert = require('node:assert');
const PF = require('../../wwwroot/enfermagem/js/perfis.js');
const CT = require('../../wwwroot/enfermagem/js/catalogo.js');

test('perfis de classe: códigos existem e campos completos', () => {
  const ks = Object.keys(PF.PERFIS);
  assert.ok(ks.length >= 170, 'pelo menos 170 perfis');
  const codigos = Object.keys(CT.CLASSES);
  ks.forEach((k) => {
    assert.ok(CT.CLASSES[k] || codigos.some((c) => c.indexOf(k) === 0), 'código/prefixo inexistente na CMED: ' + k);
    ['mec', 'ae', 'enf', 'alerta'].forEach((f) => assert.ok(PF.PERFIS[k][f] && PF.PERFIS[k][f].length > 15, k + '.' + f));
  });
});

test('perfil: busca pelo prefixo mais longo', () => {
  assert.strictEqual(PF.perfil('C10A1'), PF.PERFIS.C10A1);
  assert.strictEqual(PF.perfil('N3A'), PF.PERFIS.N3A);
  assert.strictEqual(PF.perfil(''), null);
  assert.strictEqual(PF.perfil('Z9Z9'), null);
});
