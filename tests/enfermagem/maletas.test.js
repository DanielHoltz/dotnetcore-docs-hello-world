// Testes do modelo de maletas. Executar: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../../wwwroot/enfermagem/js/maletas.js');
const D = require('../../wwwroot/enfermagem/js/data.js');
const ids = D.DRUGS.map(d => d.id);

test('criar maleta e adicionar sem duplicar', () => {
  const m = M.novaMaleta('  Domiciliar ', '🏠', 'GWD');
  assert.equal(m.nome, 'Domiciliar');
  assert.equal(M.adicionarDrogas(m, ['ceftriaxona', 'dipirona', 'ceftriaxona']), 2);
  assert.equal(M.adicionarDrogas(m, ['dipirona']), 0);
  assert.equal(m.itens.length, 2);
});

test('ícone inválido cai no padrão', () => {
  assert.equal(M.novaMaleta('x', '<script>').icon, M.ICONS[0]);
});

test('resolver aplica apresentação local sem alterar a biblioteca', () => {
  const lib = D.DRUGS.find(d => d.id === 'amicacina');
  const it = M.novoItem({ drugId: 'amicacina', conc: { qtd: 100, u: 'mg', vol: 2 } });
  const d = M.resolver(it, D.DRUGS);
  assert.deepEqual(d.conc, { qtd: 100, u: 'mg', vol: 2 });
  assert.deepEqual(d.concBiblioteca, lib.conc);
  assert.deepEqual(lib.conc, { qtd: 500, u: 'mg', vol: 2 });
});

test('medicamento personalizado', () => {
  const it = M.novoItem({ custom: { nome: 'Cefuroxima', conc: { qtd: 750, u: 'mg', vol: 8 } } });
  const d = M.resolver(it, D.DRUGS);
  assert.equal(d.nome, 'Cefuroxima'); assert.equal(d.personalizado, true); assert.equal(d.conc.qtd, 750);
  assert.equal(M.novoItem({ custom: { nome: '  ' } }).custom, null);
});

test('apresentação inválida é descartada', () => {
  assert.equal(M.cleanConc({ qtd: -1, u: 'mg', vol: 2 }), null);
  assert.equal(M.cleanConc({ qtd: 1, u: 'kg', vol: 2 }), null);
  assert.equal(M.cleanConc({ qtd: 1, u: 'mg', vol: 0 }), null);
});

test('status de validade', () => {
  const hoje = new Date(2026, 10, 15);
  assert.equal(M.statusValidade('2026-11-14', hoje), 'vencido');
  assert.equal(M.statusValidade('2026-11-15', hoje), 'vencendo');
  assert.equal(M.statusValidade('2026-12-15', hoje), 'vencendo');
  assert.equal(M.statusValidade('2026-12-16', hoje), 'ok');
  assert.equal(M.statusValidade('lixo', hoje), null);
  const m = M.novaMaleta('k');
  m.itens.push(M.novoItem({ drugId: 'dipirona', validade: '2026-01-01', qtd: 0 }), M.novoItem({ drugId: 'tramadol', validade: '2026-11-20' }));
  assert.deepEqual(M.alertas(m, hoje), { vencidos: 1, vencendo: 1, semEstoque: 1 });
});

test('modelos só usam medicamentos existentes', () => {
  for (const k of D.KITS) {
    const m = M.deModelo(k);
    assert.equal(m.itens.length, k.drogas.length, k.id);
    assert.ok(m.itens.every(i => M.resolver(i, D.DRUGS)), k.id);
  }
});

test('exportar → importar preserva conteúdo, gera novos ids e higieniza', () => {
  const m = M.novaMaleta('Emergência', '🚑', 'PS');
  m.itens.push(M.novoItem({ drugId: 'adrenalina', qtd: 10, validade: '2027-01-31', nota: 'Flush 20 mL' }));
  m.itens.push(M.novoItem({ custom: { nome: 'Droga X', diluicao: 'SF 100 mL' } }));
  const json = JSON.parse(JSON.stringify(M.exportar(m)));
  json.maleta.itens.push({ drugId: 'nao-existe' }, { drugId: 'adrenalina' }, null, { custom: { nome: '' } });
  json.maleta.itens[0].qtd = 'abc';
  const r = M.importar(json, ids);
  assert.equal(r.maleta.itens.length, 2);
  assert.equal(r.ignorados, 4);
  assert.notEqual(r.maleta.id, m.id);
  assert.equal(r.maleta.itens[0].qtd, null);
  assert.equal(r.maleta.itens[0].nota, 'Flush 20 mL');
  assert.equal(r.maleta.itens[1].custom.diluicao, 'SF 100 mL');
  assert.throws(() => M.importar({ tipo: 'outra' }, ids));
});

test('backup completo: exporta e restaura maletas e favoritos, higienizando', () => {
  const a = M.novaMaleta('A'); M.adicionarDrogas(a, ['dipirona']);
  const b = M.novaMaleta('B'); b.itens.push(M.novoItem({ custom: { nome: 'X' } }));
  const bk = JSON.parse(JSON.stringify(M.exportarBackup([a, b], ['calc:dose', 'droga:dipirona'])));
  bk.maletas.push('lixo'); bk.favs.push(42, 'x'.repeat(200));
  const r = M.importarBackup(bk, ids);
  assert.equal(r.maletas.length, 2);
  assert.deepEqual(r.maletas.map(m => m.itens.length), [1, 1]);
  assert.deepEqual(r.favs, ['calc:dose', 'droga:dipirona']);
  assert.throws(() => M.importarBackup({ tipo: 'enfcalc-maleta' }, ids));
});
