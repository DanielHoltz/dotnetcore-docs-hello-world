const test = require('node:test');
const assert = require('node:assert');
global.window = global.window || {};
const AM = require('../../wwwroot/enfermagem/js/antimicrobianos.js');
const D = require('../../wwwroot/enfermagem/js/data.js');
const X = require('../../wwwroot/enfermagem/js/bulario_extra.js');
const CT = require('../../wwwroot/enfermagem/js/catalogo.js');
const ids = new Set([...D.DRUGS.map(d => d.id), ...X.EXTRAS.map(x => x.id), ...CT.CAT.map(a => a[0])]);

test('antimicrobianos: perfis completos e referências a fichas existentes', () => {
  for (const [k, p] of Object.entries(AM.PERFIS)) {
    assert.ok(p.nome && p.ativos.length && p.evitar.length && AM.PRECAUCAO[p.prec], k);
    for (const o of [...p.ativos, ...p.evitar]) assert.ok(o[0] === null || ids.has(o[0]), k + ' id ' + o[0]);
  }
  for (const s of AM.SITIOS) for (const o of s.empirico) assert.ok(o[0] === null || ids.has(o[0]), s.id + ' id ' + o[0]);
  for (const k of Object.keys(AM.APLICACAO)) assert.ok(ids.has(k), 'aplicação sem ficha: ' + k);
});
test('antimicrobianos: fenótipo pelo antibiograma', () => {
  assert.strictEqual(AM.perfil('saureus', {}), 'mssa');
  assert.strictEqual(AM.perfil('saureus', { oxa: true }), 'mrsa');
  assert.strictEqual(AM.perfil('enterococo', { vanco: true }), 'vre');
  assert.strictEqual(AM.perfil('enterobac', { c3g: true }), 'esbl');
  assert.strictEqual(AM.perfil('enterobac', { ampc: true }), 'ampc');
  assert.strictEqual(AM.perfil('enterobac', { carba: true, mec: 'kpc' }), 'kpc');
  assert.strictEqual(AM.perfil('enterobac', { carba: true, mec: 'mbl' }), 'mbl');
  assert.strictEqual(AM.perfil('enterobac', { carba: true }), 'cre');
  assert.strictEqual(AM.perfil('pseudo', { carba: true, dtr: true }), 'psa-dtr');
  assert.strictEqual(AM.perfil('acineto', { carba: true }), 'crab');
  assert.strictEqual(AM.PERFIS.cdiff.prec, 'esporo');
});
test('antimicrobianos: regras por local da infecção', () => {
  assert.strictEqual(AM.noSitio('daptomicina', 'pav').ok, false);
  assert.strictEqual(AM.noSitio('nitrofurantoina', 'pielo').ok, false);
  assert.strictEqual(AM.noSitio('nitrofurantoina', 'cistite').ok, true);
  assert.strictEqual(AM.noSitio('tigeciclina', 'corrente').ok, false);
  assert.strictEqual(AM.noSitio('cefazolina', 'meningite').ok, false);
  assert.strictEqual(AM.noSitio('vancomicina', 'meningite').ok, true);
});
