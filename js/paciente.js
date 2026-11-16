/*
 * EnfCalc — modo atendimento: perfil do paciente, dose sugerida, preparo,
 * alertas e interações dentro da maleta. Funções puras (testáveis no Node).
 */
(function (root) {
  'use strict';

  var STD_VOL = [5, 10, 20, 25, 50, 100, 150, 250, 500, 1000];

  function stdUp(v) {
    for (var i = 0; i < STD_VOL.length; i++) if (STD_VOL[i] >= v - 1e-9) return STD_VOL[i];
    return Math.ceil(v / 100) * 100;
  }

  function arred(v) {
    if (v == null || !isFinite(v)) return v;
    var a = Math.abs(v);
    if (a >= 10) return Math.round(v);
    if (a >= 1) return Math.round(v * 10) / 10;
    return Math.round(v * 100) / 100;
  }

  // p: { peso, idade, idadeU: 'anos'|'meses', altura, sexo: 'm'|'f'|'', creat, alergias: [] }
  function perfil(p) {
    p = p || {};
    var peso = p.peso > 0 ? +p.peso : null;
    var idadeMeses = p.idade >= 0 && p.idade !== '' && p.idade != null ? (p.idadeU === 'meses' ? +p.idade : +p.idade * 12) : null;
    var altura = p.altura > 0 ? +p.altura : null;
    var r = {
      peso: peso, idadeMeses: idadeMeses, idadeAnos: idadeMeses != null ? idadeMeses / 12 : null,
      altura: altura, sexo: p.sexo === 'm' || p.sexo === 'f' ? p.sexo : null,
      creat: p.creat > 0 ? +p.creat : null, alergias: Array.isArray(p.alergias) ? p.alergias.slice() : []
    };
    r.ped = idadeMeses != null ? (idadeMeses < 144 || (idadeMeses < 216 && peso != null && peso < 40)) : (peso != null && peso < 40);
    r.neonato = idadeMeses != null && idadeMeses < 1;
    if (peso && altura) {
      r.imc = peso / Math.pow(altura / 100, 2);
      r.sc = Math.sqrt(peso * altura / 3600);
    }
    if (!r.ped && altura && r.sexo) {
      r.pesoIdeal = (r.sexo === 'm' ? 50 : 45.5) + 0.91 * (altura - 152.4);
      if (peso && peso > 1.2 * r.pesoIdeal) r.pesoAjustado = r.pesoIdeal + 0.4 * (peso - r.pesoIdeal);
    }
    if (r.creat) {
      if (!r.ped && r.idadeAnos != null && peso && r.sexo) {
        r.clcr = (140 - r.idadeAnos) * peso / (72 * r.creat) * (r.sexo === 'f' ? 0.85 : 1);
        r.clcrMetodo = 'Cockcroft-Gault';
      } else if (r.ped && altura) {
        r.clcr = 0.413 * altura / r.creat;
        r.clcrMetodo = 'Schwartz (mL/min/1,73 m²)';
      }
    }
    if (r.ped && peso) {
      var d = peso <= 10 ? 100 * peso : peso <= 20 ? 1000 + 50 * (peso - 10) : 1500 + 20 * (peso - 20);
      r.holliday = { mlDia: d, mlH: d / 24 };
    }
    r.completo = !!peso;
    return r;
  }

  function grupoDe(id, GRUPOS) {
    for (var g in GRUPOS) if (GRUPOS[g].indexOf(id) >= 0) return g;
    return null;
  }

  // → { valor, u, ref, freq, calculo, limitado } | null
  function doseSugerida(id, pf, DB, unidade) {
    var d = DB.DOSES[id];
    if (!d) return null;
    var src = pf.ped ? d.ped : d.adulto;
    var out = { u: unidade, ref: src ? src.txt : (pf.ped ? 'Sem dose pediátrica de referência.' : ''), freq: (pf.ped && d.freqPed) || d.freq || '', valor: null };
    if (!src) return out;
    var v = null;
    if (src.porKg != null && pf.peso) { v = src.porKg * pf.peso; out.calculo = fmtN(src.porKg) + ' ' + unidade + '/kg × ' + fmtN(pf.peso) + ' kg'; }
    else if (src.valor != null) { v = src.valor; out.calculo = 'dose fixa ' + (pf.ped ? 'pediátrica' : 'adulto'); }
    if (v == null) return out;
    if (src.min != null && v < src.min) { v = src.min; out.limitado = 'dose mínima'; }
    if (src.max != null && v > src.max) { v = src.max; out.limitado = 'dose máxima'; }
    out.max = src.max; out.min = src.min;
    out.valor = arred(v);
    return out;
  }

  function fmtN(n) { return String(arred(n)).replace('.', ','); }

  function vmaxEfetiva(d, pf) {
    var v = d.vmax || Infinity;
    if (pf.ped && d.vmaxKgPed && pf.peso) v = Math.min(v, d.vmaxKgPed * pf.peso);
    return v;
  }

  // Valores iniciais de diluente (mL) e tempo (min) para a dose
  function preparoPadrao(id, dose, conc, pf, DB) {
    var d = DB.DOSES[id] || {};
    var via = d.via || 'bolus';
    var aspirar = dose > 0 && conc ? dose * conc.vol / conc.qtd : 0;
    var dil = 0;
    if (via === 'infusao') {
      var alvo = pf.ped ? (d.volDilPed || d.volDil || 50) : (d.volDil || 100);
      var minimo = d.concMax && dose > 0 ? dose / d.concMax - aspirar : 0;
      dil = stdUp(Math.max(alvo, minimo));
    }
    var t = via === 'im' ? 0 : (pf.ped && d.tempoPed) || d.tempo || 0;
    var vm = vmaxEfetiva(d, pf);
    if (dose > 0 && isFinite(vm)) t = Math.max(t, Math.ceil(dose / vm));
    return { via: via, diluenteMl: dil, tempo: t };
  }

  // Cálculo do preparo com diluente/tempo (possivelmente editados pelo usuário)
  function preparo(id, dose, conc, pf, DB, diluenteMl, tempo) {
    if (!(dose > 0) || !conc || !(conc.qtd > 0) || !(conc.vol > 0)) return null;
    var d = DB.DOSES[id] || {};
    var via = d.via || 'bolus';
    var aspirar = dose * conc.vol / conc.qtd;
    var dil = via === 'pronto' || via === 'im' ? 0 : Math.max(0, diluenteMl || 0);
    var total = aspirar + dil;
    var r = { via: via, aspirar: aspirar, unidades: aspirar / conc.vol, diluenteMl: dil, total: total, concFinal: dose / total, tempo: tempo || 0, avisos: [] };
    if (r.tempo > 0) {
      r.mlh = total / (r.tempo / 60);
      r.gts = total * 20 / r.tempo;
      r.mcgts = total * 60 / r.tempo;
    }
    if (r.unidades > 1.0001) r.avisos.push('Serão necessárias ' + Math.ceil(r.unidades - 1e-9) + ' unidades (ampolas/frascos) da apresentação.');
    if (d.concMax && r.concFinal > d.concMax * 1.001)
      r.avisos.push('Concentração final (' + fmtN(r.concFinal) + ' ' + conc.u + '/mL) acima do máximo recomendado (' + fmtN(d.concMax) + ' ' + conc.u + '/mL): aumente o volume de diluente.');
    var vm = vmaxEfetiva(d, pf);
    if (isFinite(vm) && r.tempo > 0 && dose / r.tempo > vm * 1.001)
      r.avisos.push('Velocidade acima do máximo (' + fmtN(vm) + ' ' + conc.u + '/min): infundir em no mínimo ' + Math.ceil(dose / vm) + ' min.');
    if (isFinite(vm) && r.tempo === 0 && via !== 'im') r.avisos.push('Este medicamento tem velocidade máxima: informe o tempo de administração.');
    return r;
  }

  // Alertas específicos do paciente para um medicamento
  function alertasPaciente(id, pf, DB, nomes) {
    var out = [], d = DB.DOSES[id] || {}, g = grupoDe(id, DB.GRUPOS);
    pf.alergias.forEach(function (aid) {
      var a = DB.ALERGIAS.filter(function (x) { return x.id === aid; })[0];
      if (!a || !g) return;
      if (a.grupos.indexOf(g) >= 0) out.push({ sev: 'grave', txt: 'Paciente ALÉRGICO a ' + a.nome.toLowerCase() + '. Não administrar sem avaliação médica.' });
      else if (a.cruzada && a.cruzada.grupos.indexOf(g) >= 0) out.push({ sev: 'moderada', txt: 'Alergia a ' + a.nome.toLowerCase() + ': ' + a.cruzada.txt });
    });
    if (d.idadeMinMeses && pf.idadeMeses != null && pf.idadeMeses < d.idadeMinMeses)
      out.push({ sev: 'grave', txt: 'Não recomendado abaixo de ' + (d.idadeMinMeses >= 12 ? (d.idadeMinMeses / 12) + ' ano(s)' : d.idadeMinMeses + ' mês(es)') + ' de idade.' });
    if (d.pesoMin && pf.peso && pf.peso < d.pesoMin)
      out.push({ sev: 'grave', txt: 'Não recomendado abaixo de ' + d.pesoMin + ' kg.' });
    if (pf.ped && DB.DOSES[id] && d.ped === null) out.push({ sev: 'moderada', txt: 'Sem dose pediátrica de referência no app — confirmar com prescritor/farmácia.' });
    if (pf.neonato) out.push({ sev: 'moderada', txt: 'Neonato: doses e intervalos diferem — seguir protocolo neonatal.' });
    if (d.renal) {
      if (pf.clcr != null && pf.clcr < d.renal.clcr) out.push({ sev: 'moderada', txt: 'Função renal (ClCr ≈ ' + Math.round(pf.clcr) + ' mL/min): ' + d.renal.txt });
      else if (pf.clcr == null) out.push({ sev: 'info', txt: 'Ajuste renal se ClCr < ' + d.renal.clcr + ' mL/min (informe a creatinina para calcular).' });
    }
    if (d.obs) out.push({ sev: 'info', txt: d.obs });
    if (d.obsPed && pf.ped) out.push({ sev: 'moderada', txt: d.obsPed });
    if (pf.pesoAjustado && /peso (ajustado|ideal)/.test(d.obs || ''))
      out.push({ sev: 'info', txt: 'Paciente obeso: peso ideal ≈ ' + Math.round(pf.pesoIdeal) + ' kg; peso ajustado ≈ ' + Math.round(pf.pesoAjustado) + ' kg.' });
    return out;
  }

  // Interações do medicamento `id` com os demais da maleta
  function interacoes(id, kitIds, DB, nomes) {
    var out = [], outros = kitIds.filter(function (x) { return x !== id; });
    DB.INTERACOES.forEach(function (r) {
      var parc = [];
      if (r.a.indexOf(id) >= 0) r.b.forEach(function (x) { if (outros.indexOf(x) >= 0 && parc.indexOf(x) < 0) parc.push(x); });
      if (r.b.indexOf(id) >= 0) r.a.forEach(function (x) { if (outros.indexOf(x) >= 0 && parc.indexOf(x) < 0) parc.push(x); });
      if (parc.length) out.push({ sev: r.sev, tipo: r.tipo, txt: r.txt, com: parc });
    });
    if (DB.VIA_EXCLUSIVA[id] && outros.length) out.push({ sev: 'moderada', tipo: 'Via exclusiva', txt: DB.VIA_EXCLUSIVA[id], com: [] });
    var ant = DB.ANTIDOTOS[id];
    if (typeof ant === 'string') {
      if (kitIds.indexOf(ant) >= 0) out.push({ sev: 'info', tipo: 'Antídoto', txt: 'Antídoto disponível nesta maleta.', com: [ant] });
      else out.push({ sev: 'moderada', tipo: 'Antídoto', txt: 'O antídoto (' + ((nomes && nomes[ant]) || ant) + ') NÃO está nesta maleta.', com: [] });
    } else if (ant && ant.nome) out.push({ sev: 'info', tipo: 'Antídoto', txt: 'Antídoto: ' + ant.nome + ' — confirme a disponibilidade no serviço.', com: [] });
    var revertidos = Object.keys(DB.ANTIDOTOS).filter(function (k) { return DB.ANTIDOTOS[k] === id && kitIds.indexOf(k) >= 0; });
    if (revertidos.length) out.push({ sev: 'info', tipo: 'Antídoto', txt: 'É o antídoto/reversor de medicamentos desta maleta.', com: revertidos });
    var peso = { grave: 0, moderada: 1, info: 2 };
    return out.sort(function (a, b) { return peso[a.sev] - peso[b.sev]; });
  }

  // Visão geral: uma entrada por regra, com os medicamentos da maleta de cada lado
  function interacoesMaleta(kitIds, DB) {
    var out = [];
    DB.INTERACOES.forEach(function (r) {
      var A = r.a.filter(function (x) { return kitIds.indexOf(x) >= 0; });
      var B = r.b.filter(function (x) { return kitIds.indexOf(x) >= 0; });
      var mesmo = r.a.length === r.b.length && r.a.every(function (x) { return r.b.indexOf(x) >= 0; });
      var ok = A.some(function (x) { return B.some(function (y) { return y !== x; }); });
      if (ok) out.push({ sev: r.sev, tipo: r.tipo, txt: r.txt, a: A, b: mesmo ? A : B, mesmoGrupo: mesmo });
    });
    return out.sort(function (a, b) { return (a.sev === 'grave' ? 0 : 1) - (b.sev === 'grave' ? 0 : 1); });
  }

  var api = { perfil: perfil, doseSugerida: doseSugerida, preparoPadrao: preparoPadrao, preparo: preparo,
    alertasPaciente: alertasPaciente, interacoes: interacoes, interacoesMaleta: interacoesMaleta, grupoDe: grupoDe, stdUp: stdUp, arred: arred };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Paciente = api;
})(this);
