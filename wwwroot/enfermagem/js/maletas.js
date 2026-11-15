/*
 * EnfCalc — Maletas personalizadas (modelo de dados, sem DOM).
 * Maleta = { id, nome, icon, local, criada, itens: [Item] }
 * Item   = { id, drugId | null, custom | null, conc | null, qtd | null, validade | null, nota }
 *   drugId → medicamento da biblioteca; custom → ficha criada pelo usuário.
 *   conc   → apresentação disponível no local (substitui a da biblioteca).
 */
(function (root) {
  'use strict';

  var ICONS = ['🧰', '🚑', '🏥', '🏠', '💼', '🩺', '🫀', '👶', '🤰', '🧪', '🚨', '💊'];
  var CONC_UNITS = ['mcg', 'mg', 'g', 'UI', 'mEq'];
  var TEXT_FIELDS = ['nome', 'classe', 'apresentacao', 'reconstituicao', 'diluicao', 'administracao', 'estabilidade', 'obs'];
  var DIAS_ALERTA = 30;

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max || 2000) : ''; }
  function posNum(v) { v = typeof v === 'string' ? parseFloat(v) : v; return typeof v === 'number' && isFinite(v) && v > 0 ? v : null; }
  function isDate(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T00:00:00')); }

  function cleanConc(c) {
    if (!c || typeof c !== 'object') return null;
    var qtd = posNum(c.qtd), vol = posNum(c.vol);
    if (!qtd || !vol || CONC_UNITS.indexOf(c.u) < 0) return null;
    return { qtd: qtd, u: c.u, vol: vol };
  }

  function cleanCustom(c) {
    if (!c || typeof c !== 'object') return null;
    var out = {};
    TEXT_FIELDS.forEach(function (k) { out[k] = str(c[k], k === 'nome' ? 80 : 2000); });
    if (!out.nome) return null;
    out.conc = cleanConc(c.conc);
    return out;
  }

  function novaMaleta(nome, icon, local) {
    return { id: uid(), nome: str(nome, 60) || 'Minha maleta', icon: ICONS.indexOf(icon) >= 0 ? icon : ICONS[0], local: str(local, 120), criada: new Date().toISOString(), itens: [] };
  }

  function novoItem(o) {
    o = o || {};
    return {
      id: uid(),
      drugId: o.custom ? null : (str(o.drugId, 60) || null),
      custom: o.custom ? cleanCustom(o.custom) : null,
      conc: cleanConc(o.conc),
      qtd: o.qtd != null && isFinite(+o.qtd) && +o.qtd >= 0 ? Math.floor(+o.qtd) : null,
      validade: isDate(o.validade) ? o.validade : null,
      nota: str(o.nota, 2000)
    };
  }

  function daMaleta(m, itemId) { return m.itens.filter(function (i) { return i.id === itemId; })[0] || null; }
  function temDroga(m, drugId) { return m.itens.some(function (i) { return i.drugId === drugId; }); }

  function adicionarDrogas(m, drugIds) {
    var n = 0;
    drugIds.forEach(function (id) { if (!temDroga(m, id)) { m.itens.push(novoItem({ drugId: id })); n++; } });
    return n;
  }

  // Ficha final do medicamento: biblioteca (ou personalizado) + apresentação local
  function resolver(item, drugs) {
    var base = item.custom ? item.custom : drugs.filter(function (d) { return d.id === item.drugId; })[0];
    if (!base) return null;
    var d = {};
    for (var k in base) d[k] = base[k];
    d.personalizado = !!item.custom;
    d.classe = d.classe || (item.custom ? 'Medicamento personalizado' : '');
    if (item.conc) { d.concBiblioteca = base.conc; d.conc = item.conc; }
    if (!d.conc) d.conc = null;
    return d;
  }

  // 'vencido' | 'vencendo' (≤ 30 dias) | 'ok' | null
  function statusValidade(validade, hoje) {
    if (!isDate(validade)) return null;
    var h = hoje || new Date();
    var ref = Date.UTC(h.getFullYear(), h.getMonth(), h.getDate());
    var p = validade.split('-');
    var dias = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - ref) / 86400000);
    if (dias < 0) return 'vencido';
    if (dias <= DIAS_ALERTA) return 'vencendo';
    return 'ok';
  }

  function alertas(m, hoje) {
    var r = { vencidos: 0, vencendo: 0, semEstoque: 0 };
    m.itens.forEach(function (i) {
      var s = statusValidade(i.validade, hoje);
      if (s === 'vencido') r.vencidos++;
      else if (s === 'vencendo') r.vencendo++;
      if (i.qtd === 0) r.semEstoque++;
    });
    return r;
  }

  function deModelo(kit) {
    var m = novaMaleta(kit.nome, kit.icon, kit.local);
    adicionarDrogas(m, kit.drogas);
    return m;
  }

  // ---------- exportar / importar ----------
  function exportar(m) {
    return { tipo: 'enfcalc-maleta', versao: 1, exportadaEm: new Date().toISOString(), maleta: m };
  }

  // Valida e higieniza um arquivo importado. Gera ids novos. Lança Error se inválido.
  function importar(obj, drugIds) {
    if (!obj || obj.tipo !== 'enfcalc-maleta' || !obj.maleta || typeof obj.maleta !== 'object') throw new Error('Arquivo não é uma maleta do EnfCalc.');
    var src = obj.maleta;
    var m = novaMaleta(src.nome, src.icon, src.local);
    var ignorados = 0;
    (Array.isArray(src.itens) ? src.itens : []).slice(0, 500).forEach(function (i) {
      if (!i || typeof i !== 'object') { ignorados++; return; }
      if (i.custom) {
        var it = novoItem(i);
        if (it.custom) m.itens.push(it); else ignorados++;
      } else if (drugIds.indexOf(i.drugId) >= 0 && !temDroga(m, i.drugId)) {
        m.itens.push(novoItem(i));
      } else ignorados++;
    });
    return { maleta: m, ignorados: ignorados };
  }

  var api = {
    ICONS: ICONS, CONC_UNITS: CONC_UNITS, TEXT_FIELDS: TEXT_FIELDS, DIAS_ALERTA: DIAS_ALERTA,
    novaMaleta: novaMaleta, novoItem: novoItem, daMaleta: daMaleta, temDroga: temDroga,
    adicionarDrogas: adicionarDrogas, resolver: resolver, statusValidade: statusValidade,
    alertas: alertas, deModelo: deModelo, exportar: exportar, importar: importar,
    cleanConc: cleanConc, cleanCustom: cleanCustom
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Maletas = api;
})(this);
