/*
 * EnfCalc — motor de cálculos (funções puras, sem DOM).
 * Pode ser usado no navegador (window.Calc) e no Node (require) para testes.
 */
(function (root) {
  'use strict';

  // ---------- Unidades ----------
  // Massa em mcg como base; UI em UI como base.
  var UNITS = {
    ng:  { cls: 'mass', f: 0.001 },
    mcg: { cls: 'mass', f: 1 },
    mg:  { cls: 'mass', f: 1000 },
    g:   { cls: 'mass', f: 1000000 },
    mUI: { cls: 'ui',   f: 0.001 },
    UI:  { cls: 'ui',   f: 1 },
    mEq: { cls: 'meq',  f: 1 },
    mL:  { cls: 'vol',  f: 1 },
    L:   { cls: 'vol',  f: 1000 }
  };

  function convert(value, from, to) {
    var a = UNITS[from], b = UNITS[to];
    if (!a || !b) throw new Error('Unidade desconhecida');
    if (a.cls !== b.cls) throw new Error('Unidades incompatíveis: ' + from + ' → ' + to);
    return value * a.f / b.f;
  }

  function sameClass(u1, u2) {
    return UNITS[u1] && UNITS[u2] && UNITS[u1].cls === UNITS[u2].cls;
  }

  // ---------- Gotejamento ----------
  // fator: gotas/mL (macrogotas = 20, microgotas = 60)
  function gotejamento(volumeMl, tempoMin, fator) {
    if (!(volumeMl > 0) || !(tempoMin > 0) || !(fator > 0)) return null;
    var gotasMin = volumeMl * fator / tempoMin;
    return {
      gotasMin: gotasMin,
      mlH: volumeMl / (tempoMin / 60),
      segPorGota: 60 / gotasMin
    };
  }

  // Tempo de infusão a partir de gotas/min
  function tempoInfusao(volumeMl, gotasMin, fator) {
    if (!(volumeMl > 0) || !(gotasMin > 0) || !(fator > 0)) return null;
    var min = volumeMl * fator / gotasMin;
    return { minutos: min, mlH: volumeMl / (min / 60) };
  }

  // ---------- Regra de três / dose ----------
  // dose prescrita (dose, doseU) com apresentação (qtd, qtdU em volMl) → mL a aspirar
  function volumeDose(dose, doseU, qtd, qtdU, volMl) {
    if (!(dose > 0) || !(qtd > 0) || !(volMl > 0)) return null;
    var doseConv = convert(dose, doseU, qtdU);
    return doseConv * volMl / qtd;
  }

  // ---------- Reconstituição ----------
  function reconstituicao(qtd, diluenteMl, deslocamentoMl) {
    var volFinal = diluenteMl + (deslocamentoMl || 0);
    if (!(qtd > 0) || !(volFinal > 0)) return null;
    return { volFinal: volFinal, conc: qtd / volFinal };
  }

  // ---------- Infusão contínua (drogas vasoativas, sedação etc.) ----------
  // doseUnit: { mass: 'mcg'|'mg'|'UI'|'mUI', perKg: bool, per: 'min'|'h' }
  var DOSE_UNITS = {
    'mcg/kg/min': { mass: 'mcg', perKg: true,  per: 'min' },
    'mcg/kg/h':   { mass: 'mcg', perKg: true,  per: 'h' },
    'mcg/min':    { mass: 'mcg', perKg: false, per: 'min' },
    'mcg/h':      { mass: 'mcg', perKg: false, per: 'h' },
    'mg/kg/h':    { mass: 'mg',  perKg: true,  per: 'h' },
    'mg/kg/min':  { mass: 'mg',  perKg: true,  per: 'min' },
    'mg/min':     { mass: 'mg',  perKg: false, per: 'min' },
    'mg/h':       { mass: 'mg',  perKg: false, per: 'h' },
    'UI/min':     { mass: 'UI',  perKg: false, per: 'min' },
    'UI/h':       { mass: 'UI',  perKg: false, per: 'h' },
    'UI/kg/h':    { mass: 'UI',  perKg: true,  per: 'h' },
    'mUI/min':    { mass: 'mUI', perKg: false, per: 'min' }
  };

  // concentração da solução na unidade da dose, por mL
  function concNaUnidadeDose(qtd, qtdU, volMl, doseUnit) {
    var du = DOSE_UNITS[doseUnit];
    return convert(qtd, qtdU, du.mass) / volMl;
  }

  function doseParaMlH(dose, doseUnit, pesoKg, qtd, qtdU, volMl) {
    var du = DOSE_UNITS[doseUnit];
    if (!du || !(qtd > 0) || !(volMl > 0) || !(dose >= 0)) return null;
    if (du.perKg && !(pesoKg > 0)) return null;
    var c = concNaUnidadeDose(qtd, qtdU, volMl, doseUnit);
    var porHora = dose * (du.perKg ? pesoKg : 1) * (du.per === 'min' ? 60 : 1);
    return porHora / c;
  }

  function mlHParaDose(mlH, doseUnit, pesoKg, qtd, qtdU, volMl) {
    var du = DOSE_UNITS[doseUnit];
    if (!du || !(qtd > 0) || !(volMl > 0) || !(mlH >= 0)) return null;
    if (du.perKg && !(pesoKg > 0)) return null;
    var c = concNaUnidadeDose(qtd, qtdU, volMl, doseUnit);
    return mlH * c / (du.perKg ? pesoKg : 1) / (du.per === 'min' ? 60 : 1);
  }

  // ---------- Transformação de soro ----------
  // C em %, volumes em mL. metodo: 'adicionar' (volume final aumenta)
  // ou 'substituir' (despreza x mL do soro e repõe x mL da solução hipertônica)
  function transformacaoSoro(volMl, cAtual, cDesejada, cAmpola, metodo) {
    if (!(volMl > 0) || !(cDesejada > cAtual) || !(cAmpola > cDesejada)) return null;
    var x, volFinal, desprezar = 0;
    if (metodo === 'substituir') {
      x = volMl * (cDesejada - cAtual) / (cAmpola - cAtual);
      desprezar = x;
      volFinal = volMl;
    } else {
      x = volMl * (cDesejada - cAtual) / (cAmpola - cDesejada);
      volFinal = volMl + x;
    }
    return {
      volHipertonico: x,
      desprezar: desprezar,
      volFinal: volFinal,
      gramasFinal: volFinal * cDesejada / 100
    };
  }

  // ---------- Pediatria ----------
  function holliday(pesoKg) {
    if (!(pesoKg > 0)) return null;
    var d;
    if (pesoKg <= 10) d = 100 * pesoKg;
    else if (pesoKg <= 20) d = 1000 + 50 * (pesoKg - 10);
    else d = 1500 + 20 * (pesoKg - 20);
    return { mlDia: d, mlH: d / 24 };
  }

  // ---------- Clínicos ----------
  function imc(pesoKg, alturaCm) {
    if (!(pesoKg > 0) || !(alturaCm > 0)) return null;
    var m = alturaCm / 100;
    return pesoKg / (m * m);
  }

  function classificaImc(v) {
    if (v < 18.5) return 'Baixo peso';
    if (v < 25) return 'Eutrofia';
    if (v < 30) return 'Sobrepeso';
    if (v < 35) return 'Obesidade grau I';
    if (v < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  }

  function superficieCorporal(pesoKg, alturaCm) { // Mosteller
    if (!(pesoKg > 0) || !(alturaCm > 0)) return null;
    return Math.sqrt(pesoKg * alturaCm / 3600);
  }

  function pam(pas, pad) {
    if (!(pas > 0) || !(pad > 0)) return null;
    return (pas + 2 * pad) / 3;
  }

  function cockcroftGault(idade, pesoKg, creat, feminino) {
    if (!(idade > 0) || !(pesoKg > 0) || !(creat > 0)) return null;
    var v = (140 - idade) * pesoKg / (72 * creat);
    return feminino ? v * 0.85 : v;
  }

  function parkland(pesoKg, scq, mlKg) {
    if (!(pesoKg > 0) || !(scq > 0)) return null;
    var total = (mlKg || 4) * pesoKg * scq;
    return {
      total: total,
      primeiras8h: total / 2,
      mlH8: total / 2 / 8,
      seguintes16h: total / 2,
      mlH16: total / 2 / 16
    };
  }

  // DUM em Date; ref em Date (hoje)
  function naegele(dum, ref) {
    if (!(dum instanceof Date) || isNaN(dum)) return null;
    var dpp = new Date(dum.getTime());
    dpp.setDate(dpp.getDate() + 280);
    var dias = Math.floor((Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate()) -
      Date.UTC(dum.getFullYear(), dum.getMonth(), dum.getDate())) / 86400000);
    return { dpp: dpp, semanas: Math.floor(dias / 7), dias: dias % 7, totalDias: dias };
  }

  function oxigenioCilindro(volHidraulicoL, pressao, reserva, fluxoLmin) {
    var util = pressao - (reserva || 0);
    if (!(volHidraulicoL > 0) || !(util > 0) || !(fluxoLmin > 0)) return null;
    var litros = volHidraulicoL * util;
    return { litros: litros, minutos: litros / fluxoLmin };
  }

  // Aprazamento: horários (min desde 00:00) das doses em 24 h a partir do início
  function aprazamento(inicioMin, intervaloH) {
    if (!(inicioMin >= 0) || inicioMin >= 1440 || !(intervaloH > 0) || intervaloH > 24) return null;
    var out = [];
    for (var t = 0; t < 24 * 60 - 1e-9; t += intervaloH * 60) {
      var abs = inicioMin + t;
      out.push({ min: Math.round(abs) % 1440, diaSeguinte: abs >= 1440 });
    }
    return out;
  }
  function hhmm(min) { var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }

  // Déficit de ferro (Ganzoni): peso × (Hb alvo − Hb atual) × 2,4 + reservas (500 mg se ≥ 35 kg; 15 mg/kg se < 35 kg)
  function ganzoni(pesoKg, hbAtual, hbAlvo) {
    if (!(pesoKg > 0) || !(hbAtual > 0) || !(hbAlvo > 0)) return null;
    var reservas = pesoKg >= 35 ? 500 : 15 * pesoKg;
    var hb = Math.max(0, pesoKg * (hbAlvo - hbAtual) * 2.4);
    return { hb: hb, reservas: reservas, total: hb + reservas };
  }

  // Adrogué-Madias: variação do Na sérico com 1 L da solução infundida
  // ACT = peso × fator (homem 0,6; mulher 0,5; idoso homem 0,5; idosa 0,45; criança 0,6)
  function adrogueMadias(naSerico, naSolucao, kSolucao, pesoKg, fatorACT) {
    if (!(naSerico > 0) || !(pesoKg > 0) || !(fatorACT > 0) || !(naSolucao >= 0)) return null;
    var act = pesoKg * fatorACT;
    var delta = ((naSolucao + (kSolucao || 0)) - naSerico) / (act + 1);
    return { act: act, deltaPorLitro: delta, litrosPara8: delta !== 0 ? 8 / Math.abs(delta) : null };
  }
  // Sódio corrigido pela glicemia (Katz: 1,6 mEq/L para cada 100 mg/dL acima de 100; Hillier: 2,4)
  function sodioCorrigido(na, glicemia) {
    if (!(na > 0) || !(glicemia > 0)) return null;
    var exc = Math.max(0, glicemia - 100) / 100;
    return { katz: na + 1.6 * exc, hillier: na + 2.4 * exc };
  }
  // Ânion gap = Na − (Cl + HCO3); corrigido pela albumina: + 2,5 × (4 − albumina g/dL)
  function anionGap(na, cl, hco3, albumina) {
    if (!(na > 0) || !(cl > 0) || !(hco3 >= 0)) return null;
    var ag = na - (cl + hco3);
    return { ag: ag, corrigido: albumina > 0 ? ag + 2.5 * (4 - albumina) : null };
  }

  function celsiusParaF(c) { return c * 9 / 5 + 32; }
  function fParaCelsius(f) { return (f - 32) * 5 / 9; }

  // NEWS2 (Royal College of Physicians, 2017) — escala 1 de SpO₂
  // v: { fr, spo2, o2 (bool), pas, fc, consc ('A' alerta | 'CVPU' confusão nova/voz/dor/sem resposta), temp }
  function news2(v) {
    function faixa(x, regras) { for (var i = 0; i < regras.length; i++) if (x <= regras[i][0]) return regras[i][1]; return regras[regras.length - 1][1]; }
    if (!(v.fr > 0) || !(v.spo2 > 0) || !(v.pas > 0) || !(v.fc > 0) || !(v.temp > 0) || !v.consc) return null;
    var p = {
      fr: faixa(v.fr, [[8, 3], [11, 1], [20, 0], [24, 2], [Infinity, 3]]),
      spo2: faixa(v.spo2, [[91, 3], [93, 2], [95, 1], [Infinity, 0]]),
      o2: v.o2 ? 2 : 0,
      pas: faixa(v.pas, [[90, 3], [100, 2], [110, 1], [219, 0], [Infinity, 3]]),
      fc: faixa(v.fc, [[40, 3], [50, 1], [90, 0], [110, 1], [130, 2], [Infinity, 3]]),
      consc: v.consc === 'A' ? 0 : 3,
      temp: faixa(v.temp, [[35.0, 3], [36.0, 1], [38.0, 0], [39.0, 1], [Infinity, 2]])
    };
    var score = 0, tres = false;
    Object.keys(p).forEach(function (k) { score += p[k]; if (p[k] === 3) tres = true; });
    var nivel = score >= 7 ? 'alto' : score >= 5 ? 'medio' : tres ? 'baixo-medio' : 'baixo';
    return { score: score, nivel: nivel, parciais: p, tres: tres };
  }

  // Horários de um medicamento no dia (00:00–23:59), a partir do 1º horário e do intervalo em horas (0 = dose única)
  function horariosDoDia(ini, intervaloH) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(ini || '');
    if (!m) return [];
    var t0 = (+m[1]) * 60 + (+m[2]);
    if (t0 >= 1440) return [];
    var out = [], passo = intervaloH > 0 ? intervaloH * 60 : 0;
    if (!passo) return [hhmmMin(t0)];
    var t = t0 % passo;                     // primeiro horário do dia na mesma "grade"
    for (; t < 1440; t += passo) out.push(hhmmMin(t));
    return out;
  }
  function hhmmMin(t) { var h = Math.floor(t / 60), mi = t % 60; return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi; }

  // Superfície corporal (Mosteller): √(peso kg × altura cm / 3600)
  function superficieCorporal(peso, altura) {
    if (!(peso > 0) || !(altura > 0)) return null;
    return Math.sqrt(peso * altura / 3600);
  }
  // Cálcio total corrigido pela albumina: Ca + 0,8 × (4 − albumina g/dL)
  function calcioCorrigido(ca, alb) {
    if (!(ca > 0) || !(alb > 0)) return null;
    return ca + 0.8 * (4 - alb);
  }
  // Déficit de água livre (L) = fator × peso × (Na/140 − 1); fator: 0,6 homem, 0,5 mulher/homem idoso, 0,45 mulher idosa
  function deficitAguaLivre(peso, na, fator) {
    if (!(peso > 0) || !(na > 0) || !(fator > 0)) return null;
    return fator * peso * (na / 140 - 1);
  }
  // Equivalência anti-inflamatória dos corticoides (mg equivalentes)
  var CORTICOIDES = { hidrocortisona: 20, cortisona: 25, prednisona: 5, prednisolona: 5, metilprednisolona: 4, triancinolona: 4, dexametasona: 0.75, betametasona: 0.6 };
  function equivCorticoide(dose, de, para) {
    if (!(dose > 0) || !CORTICOIDES[de] || !CORTICOIDES[para]) return null;
    return dose / CORTICOIDES[de] * CORTICOIDES[para];
  }
  var api = {
    superficieCorporal: superficieCorporal, calcioCorrigido: calcioCorrigido, deficitAguaLivre: deficitAguaLivre, CORTICOIDES: CORTICOIDES, equivCorticoide: equivCorticoide,
    news2: news2, horariosDoDia: horariosDoDia,
    UNITS: UNITS, DOSE_UNITS: DOSE_UNITS,
    convert: convert, sameClass: sameClass,
    gotejamento: gotejamento, tempoInfusao: tempoInfusao,
    volumeDose: volumeDose, reconstituicao: reconstituicao,
    concNaUnidadeDose: concNaUnidadeDose,
    doseParaMlH: doseParaMlH, mlHParaDose: mlHParaDose,
    transformacaoSoro: transformacaoSoro, holliday: holliday,
    imc: imc, classificaImc: classificaImc, superficieCorporal: superficieCorporal,
    pam: pam, cockcroftGault: cockcroftGault, parkland: parkland, naegele: naegele,
    oxigenioCilindro: oxigenioCilindro, aprazamento: aprazamento, hhmm: hhmm, ganzoni: ganzoni, adrogueMadias: adrogueMadias, sodioCorrigido: sodioCorrigido, anionGap: anionGap, celsiusParaF: celsiusParaF, fParaCelsius: fParaCelsius
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calc = api;
})(this);
