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

  function celsiusParaF(c) { return c * 9 / 5 + 32; }
  function fParaCelsius(f) { return (f - 32) * 5 / 9; }

  var api = {
    UNITS: UNITS, DOSE_UNITS: DOSE_UNITS,
    convert: convert, sameClass: sameClass,
    gotejamento: gotejamento, tempoInfusao: tempoInfusao,
    volumeDose: volumeDose, reconstituicao: reconstituicao,
    concNaUnidadeDose: concNaUnidadeDose,
    doseParaMlH: doseParaMlH, mlHParaDose: mlHParaDose,
    transformacaoSoro: transformacaoSoro, holliday: holliday,
    imc: imc, classificaImc: classificaImc, superficieCorporal: superficieCorporal,
    pam: pam, cockcroftGault: cockcroftGault, parkland: parkland, naegele: naegele,
    oxigenioCilindro: oxigenioCilindro, aprazamento: aprazamento, hhmm: hhmm, ganzoni: ganzoni, celsiusParaF: celsiusParaF, fParaCelsius: fParaCelsius
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calc = api;
})(this);
