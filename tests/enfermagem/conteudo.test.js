const test = require('node:test');
const assert = require('node:assert');
const CO = require('../../wwwroot/enfermagem/js/conteudo.js');
const ED = require('../../wwwroot/enfermagem/js/editorial.js').EDITORIAL;
const PR = require('../../wwwroot/enfermagem/js/protocolos.js');
const C = require('../../wwwroot/enfermagem/js/calc.js');

test('POPs: completos e ids únicos', () => {
  assert.ok(CO.POPS.length >= 12);
  assert.strictEqual(new Set(CO.POPS.map(p => p.id)).size, CO.POPS.length);
  CO.POPS.forEach(p => assert.ok(p.nome && p.material.length && p.passos.length && p.cuidados.length && p.fonte, p.id));
});
test('Processo de Enfermagem: 5 etapas e focos com metas e intervenções aprazadas', () => {
  assert.strictEqual(CO.ETAPAS_PE.length, 5);
  assert.ok(CO.FOCOS.length >= 18);
  CO.FOCOS.forEach(f => { assert.ok(f.indicadores.length && f.metas.length && f.intervencoes.length, f.id); f.intervencoes.forEach(i => assert.ok(i[0] && i[1], f.id)); });
});
test('Exames e ECG: dados válidos e protocolos existentes', () => {
  assert.ok(CO.LAB.length >= 40); CO.LAB.forEach(l => assert.strictEqual(l.length, 3));
  const ids = new Set(PR.PROTOCOLOS.map(p => p.id));
  CO.RITMOS_ECG.forEach(r => assert.ok(!r.prot || ids.has(r.prot), r.nome));
});
test('Editorial: versão, histórico e conselho só com campos completos', () => {
  assert.match(ED.versao, /^\d{4}\.\d+\.\d+$/); assert.ok(ED.historico.length);
  ED.conselho.forEach(c => assert.ok(c.nome && c.funcao && c.registro && c.area, 'membro do conselho incompleto'));
});
test('Calculadoras especializadas', () => {
  assert.ok(Math.abs(C.vig(10, 10, 3) - 5.5556) < 1e-3);
  assert.deepStrictEqual(C.calvert(5, 140, true), { dose: 750, tfgUsada: 125 });
  assert.strictEqual(C.calvert(5, 140, false).dose, 825);
  const d = C.dosePorM2(100, 90, 190, 2); assert.strictEqual(d.scUsada, 2); assert.strictEqual(d.dose, 200);
  const k = C.kcalNP(200, 70, 50, 70); assert.strictEqual(k.total, 1410); assert.strictEqual(k.protKg, 1);
  assert.strictEqual(C.vig(0, 10, 3), null);
});
