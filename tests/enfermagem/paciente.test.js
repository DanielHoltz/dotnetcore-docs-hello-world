// Testes do modo atendimento. Executar: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../../wwwroot/enfermagem/js/paciente.js');
const DB = require('../../wwwroot/enfermagem/js/doses.js');
const D = require('../../wwwroot/enfermagem/js/data.js');
const drug = id => D.DRUGS.find(d => d.id === id);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

const adulto = P.perfil({ peso: 70, idade: 45, idadeU: 'anos', altura: 170, sexo: 'm', creat: 1 });
const crianca = P.perfil({ peso: 20, idade: 6, idadeU: 'anos', altura: 115 });
const bebe = P.perfil({ peso: 5, idade: 2, idadeU: 'meses' });

test('perfil: adulto/pediátrico, IMC, ClCr, Holliday', () => {
  assert.equal(adulto.ped, false); assert.equal(crianca.ped, true); assert.equal(bebe.ped, true);
  near(adulto.imc, 24.22, 0.01);
  near(adulto.clcr, 95 * 70 / 72, 1e-6);
  assert.equal(crianca.holliday.mlDia, 1500);
  assert.equal(P.perfil({ peso: 35, idade: 15 }).ped, true);   // adolescente < 40 kg
  assert.equal(P.perfil({ peso: 55, idade: 15 }).ped, false);
  assert.equal(P.perfil({ peso: 10, idade: 0.5, idadeU: 'meses' }).neonato, true);
});

test('perfil: peso ajustado em obeso', () => {
  const o = P.perfil({ peso: 120, idade: 40, altura: 170, sexo: 'm' });
  near(o.pesoIdeal, 66.02, 0.01);
  near(o.pesoAjustado, 66.02 + 0.4 * (120 - 66.02), 0.01);
});

test('dose sugerida: mg/kg, dose fixa e limites', () => {
  assert.equal(P.doseSugerida('amicacina', adulto, DB, 'mg').valor, 1050);
  assert.equal(P.doseSugerida('amicacina', P.perfil({ peso: 120, idade: 40 }), DB, 'mg').valor, 1500); // máx
  assert.equal(P.doseSugerida('ceftriaxona', adulto, DB, 'mg').valor, 1000);
  assert.equal(P.doseSugerida('ceftriaxona', crianca, DB, 'mg').valor, 1000);   // 50 mg/kg × 20
  assert.equal(P.doseSugerida('atropina', bebe, DB, 'mg').valor, 0.1);          // mínimo 0,1 mg
  assert.equal(P.doseSugerida('adrenalina', crianca, DB, 'mg').valor, 0.2);
  assert.equal(P.doseSugerida('heparina', adulto, DB, 'UI').valor, null);       // só texto
  assert.equal(P.doseSugerida('tramadol', crianca, DB, 'mg').valor, null);
});

test('preparo: vancomicina 15 mg/kg, 70 kg → 1050 mg, conc ≤ 5 mg/mL, ≥ 105 min', () => {
  const dose = P.doseSugerida('vancomicina', adulto, DB, 'mg').valor;
  assert.equal(dose, 1050);
  const pad = P.preparoPadrao('vancomicina', dose, drug('vancomicina').conc, adulto, DB);
  assert.equal(pad.diluenteMl, 250);
  assert.equal(pad.tempo, 105);
  const r = P.preparo('vancomicina', dose, drug('vancomicina').conc, adulto, DB, pad.diluenteMl, pad.tempo);
  near(r.aspirar, 21);                 // 500 mg/10 mL
  assert.ok(r.concFinal <= 5);
  assert.ok(r.avisos.some(a => /unidades/.test(a)));   // 3 frascos
  assert.equal(r.avisos.filter(a => /Concentração|Velocidade/.test(a)).length, 0);
  // usuário reduz o volume e acelera: avisos
  const r2 = P.preparo('vancomicina', dose, drug('vancomicina').conc, adulto, DB, 100, 30);
  assert.ok(r2.avisos.some(a => /Concentração final/.test(a)));
  assert.ok(r2.avisos.some(a => /Velocidade acima/.test(a)));
});

test('preparo: ceftriaxona criança 20 kg → 1 g em 50 mL (≤ 40 mg/mL) em 30 min', () => {
  const pad = P.preparoPadrao('ceftriaxona', 1000, drug('ceftriaxona').conc, crianca, DB);
  assert.equal(pad.diluenteMl, 50);
  const r = P.preparo('ceftriaxona', 1000, drug('ceftriaxona').conc, crianca, DB, pad.diluenteMl, pad.tempo);
  near(r.aspirar, 10); near(r.total, 60); near(r.mlh, 120);
});

test('preparo: fenitoína pediátrica limita velocidade a 1 mg/kg/min', () => {
  const dose = P.doseSugerida('fenitoina', crianca, DB, 'mg').valor; // 400 mg
  assert.equal(dose, 400);
  const pad = P.preparoPadrao('fenitoina', dose, drug('fenitoina').conc, crianca, DB);
  assert.equal(pad.tempo, 20);          // 400 / (1 × 20)
  assert.ok(400 / pad.diluenteMl <= 10);
});

test('preparo: bolsa pronta (metronidazol) não soma diluente', () => {
  const r = P.preparo('metronidazol', 500, drug('metronidazol').conc, adulto, DB, 100, 60);
  near(r.total, 100); near(r.mlh, 100);
});

test('alertas: alergia direta e cruzada, idade mínima, renal', () => {
  const al = P.perfil({ peso: 70, idade: 50, alergias: ['penicilinas'] });
  assert.equal(P.alertasPaciente('ampicilina', al, DB)[0].sev, 'grave');
  assert.equal(P.alertasPaciente('ceftriaxona', al, DB)[0].sev, 'moderada');
  assert.equal(P.alertasPaciente('vancomicina', al, DB).filter(a => /ALÉRGICO/.test(a.txt)).length, 0);
  assert.ok(P.alertasPaciente('dipirona', bebe, DB).some(a => a.sev === 'grave'));      // 2 meses
  assert.ok(P.alertasPaciente('tramadol', crianca, DB).some(a => a.sev === 'grave'));
  const renal = P.perfil({ peso: 70, idade: 80, sexo: 'f', creat: 2 });
  assert.ok(P.alertasPaciente('meropenem', renal, DB).some(a => /ClCr ≈ 2\d/.test(a.txt)));
});

test('interações dentro da maleta e antídotos', () => {
  const kit = ['morfina', 'midazolam', 'naloxona', 'ceftriaxona', 'gluconato-calcio'];
  const m = P.interacoes('morfina', kit, DB);
  assert.ok(m.some(i => i.sev === 'grave' && i.com.includes('midazolam')));
  assert.ok(m.some(i => i.tipo === 'Antídoto' && i.sev === 'info'));
  const mid = P.interacoes('midazolam', kit, DB, { flumazenil: 'Flumazenil' });
  assert.ok(mid.some(i => /Flumazenil\) NÃO está/.test(i.txt)));
  assert.ok(P.interacoes('ceftriaxona', kit, DB).some(i => i.sev === 'grave' && i.com.includes('gluconato-calcio')));
  assert.ok(P.interacoes('naloxona', kit, DB).some(i => i.com.includes('morfina')));
  const geral = P.interacoesMaleta(kit, DB);
  assert.equal(geral.filter(i => i.sev === 'grave').length, 2);
});

test('dados: doses/interações referenciam medicamentos existentes', () => {
  const ids = new Set(D.DRUGS.map(d => d.id));
  for (const id of Object.keys(DB.DOSES)) assert.ok(ids.has(id), 'dose sem droga: ' + id);
  for (const r of DB.INTERACOES) for (const x of r.a.concat(r.b)) assert.ok(ids.has(x), 'interação: ' + x);
  for (const g of Object.values(DB.GRUPOS)) for (const x of g) assert.ok(ids.has(x), 'grupo: ' + x);
  for (const v of Object.values(DB.ANTIDOTOS)) if (typeof v === 'string') assert.ok(ids.has(v));
  for (const [id, d] of Object.entries(DB.DOSES)) {
    assert.ok(['infusao', 'bolus', 'pronto', 'continua', 'im'].includes(d.via), id);
    if (d.via === 'continua') assert.ok(D.INFUSIONS.some(i => i.id === d.infusao), id);
  }
});

test('ampliação: via IM, paracetamol por peso, QT em grupo, anticoagulantes', () => {
  const benz = P.preparo('penicilina-benzatina', 2400000, drug('penicilina-benzatina').conc, adulto, DB, 100, 30);
  near(benz.aspirar, 8); assert.equal(benz.diluenteMl, 0);
  assert.equal(P.preparoPadrao('enoxaparina', 40, drug('enoxaparina').conc, adulto, DB).tempo, 0);
  assert.equal(P.doseSugerida('paracetamol-ev', P.perfil({ peso: 45, idade: 30 }), DB, 'mg').valor, 675);
  assert.equal(P.doseSugerida('paracetamol-ev', adulto, DB, 'mg').valor, 1000);
  assert.equal(P.preparoPadrao('fluconazol', 400, drug('fluconazol').conc, adulto, DB).tempo, 120);
  assert.equal(P.preparoPadrao('levofloxacino', 750, drug('levofloxacino').conc, adulto, DB).tempo, 90);
  const qt = P.interacoes('haloperidol', ['haloperidol', 'azitromicina-ev', 'ondansetrona'], DB);
  assert.ok(qt.some(i => /QT/.test(i.txt) && i.com.length === 2));
  assert.ok(P.interacoes('enoxaparina', ['enoxaparina', 'heparina'], DB).some(i => i.sev === 'grave'));
  assert.ok(P.alertasPaciente('smx-tmp', P.perfil({ peso: 70, idade: 40, alergias: ['sulfas'] }), DB).some(a => a.sev === 'grave'));
  assert.ok(P.alertasPaciente('tenoxicam', crianca, DB).some(a => a.sev === 'grave'));
});
