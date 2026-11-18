/* EnfCalc — interface (SPA com rotas por hash) */
(function () {
  'use strict';

  var C = window.Calc, D = window.DATA, M = window.Maletas, P = window.Paciente, DB = window.DOSES, R = window.Revisoes, B = window.Bulario, AP = window.Apresentacoes, BX = window.BularioExtra, PR = window.Protocolos, MOD = window.Modulos, CT = window.Catalogo;
  var $app = document.getElementById('app');
  var $title = document.getElementById('page-title');
  var $back = document.getElementById('btn-back');

  // ---------- utilitários ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(/\s/g, '');
    if (s === '') return NaN;
    // aceita "1.000,5", "5.000.000" (milhar pt-BR) e "1000.5"
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return parseFloat(s);
  }
  function fmt(n, d) {
    if (n == null || !isFinite(n)) return '—';
    if (d == null) d = Math.abs(n) >= 100 ? 1 : Math.abs(n) >= 1 ? 2 : 3;
    return n.toLocaleString('pt-BR', { maximumFractionDigits: d });
  }
  function fmtHM(min) {
    if (!isFinite(min)) return '—';
    var t = Math.round(min);
    var h = Math.floor(t / 60), m = t % 60;
    return (h ? h + ' h ' : '') + m + ' min';
  }
  function fmtDate(d) { return d.toLocaleDateString('pt-BR'); }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var store = {
    get: function (k, def) { try { var v = localStorage.getItem('enfcalc.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem('enfcalc.' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
    trySet: function (k, v) { try { localStorage.setItem('enfcalc.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  // ---------- definições das calculadoras ----------
  var MASS_UNITS = ['mcg', 'mg', 'g', 'UI', 'mEq'];
  var CATS = [
    { id: 'infusao', nome: 'Infusão e gotejamento', icon: '💧' },
    { id: 'medicacao', nome: 'Preparo de medicação', icon: '💉' },
    { id: 'solucoes', nome: 'Soluções e eletrólitos', icon: '🧪' },
    { id: 'pediatria', nome: 'Pediatria', icon: '👶' },
    { id: 'clinico', nome: 'Avaliação clínica', icon: '🩺' },
    { id: 'conversoes', nome: 'Conversões', icon: '🔁' }
  ];

  var CALCS = [
    { id: 'gotejamento', cat: 'infusao', icon: '💧', title: 'Gotejamento', desc: 'Gotas/min, microgotas/min e mL/h',
      fields: [
        { id: 'vol', label: 'Volume a infundir', unit: 'mL', def: 500, chips: [100, 250, 500, 1000] },
        { id: 'h', label: 'Tempo (horas)', unit: 'h', def: 8, chips: [1, 2, 4, 6, 8, 12, 24] },
        { id: 'min', label: 'Tempo adicional (minutos)', unit: 'min', def: 0 },
        { id: 'eq', label: 'Equipo', type: 'seg', options: [['20', 'Macrogotas (20 gts/mL)'], ['60', 'Microgotas (60 mcgts/mL)']], def: '20' }
      ],
      compute: function (v) {
        var t = (v.h || 0) * 60 + (v.min || 0), f = +v.eq;
        var r = C.gotejamento(v.vol, t, f);
        if (!r) return null;
        var out = [
          { label: f === 60 ? 'Microgotas por minuto' : 'Gotas por minuto', value: fmt(Math.round(r.gotasMin), 0), unit: f === 60 ? 'mcgts/min' : 'gts/min', main: true, sub: 'Valor exato: ' + fmt(r.gotasMin, 2) },
          { label: 'Vazão em bomba de infusão', value: fmt(r.mlH, 1), unit: 'mL/h' },
          { label: 'Intervalo entre gotas', value: fmt(r.segPorGota, 1), unit: 's/gota' }
        ];
        var notes = ['Fórmula: ' + (f === 60 ? 'mcgts/min = V ÷ T(h)' : 'gts/min = V ÷ (T(h) × 3)') + '. Arredonde para o inteiro mais próximo.'];
        return { results: out, notes: notes };
      } },

    { id: 'tempo-infusao', cat: 'infusao', icon: '⏱️', title: 'Tempo de infusão', desc: 'Quanto tempo leva com o gotejamento atual',
      fields: [
        { id: 'vol', label: 'Volume', unit: 'mL', def: 500, chips: [100, 250, 500, 1000] },
        { id: 'gts', label: 'Gotejamento atual', unit: 'gotas/min', def: 21 },
        { id: 'eq', label: 'Equipo', type: 'seg', options: [['20', 'Macrogotas'], ['60', 'Microgotas']], def: '20' }
      ],
      compute: function (v) {
        var r = C.tempoInfusao(v.vol, v.gts, +v.eq);
        if (!r) return null;
        var fim = new Date(Date.now() + r.minutos * 60000);
        return { results: [
          { label: 'Tempo total', value: fmtHM(r.minutos), main: true },
          { label: 'Término previsto (se iniciar agora)', value: fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
          { label: 'Equivale em bomba a', value: fmt(r.mlH, 1), unit: 'mL/h' }
        ] };
      } },

    { id: 'vazao-bomba', cat: 'infusao', icon: '⚙️', title: 'Vazão em bomba (mL/h)', desc: 'Volume e tempo → mL/h',
      fields: [
        { id: 'vol', label: 'Volume', unit: 'mL', def: 100, chips: [50, 100, 250, 500] },
        { id: 'min', label: 'Tempo de infusão', unit: 'min', def: 30, chips: [15, 30, 60, 120] }
      ],
      compute: function (v) {
        if (!(v.vol > 0) || !(v.min > 0)) return null;
        var mlh = v.vol / (v.min / 60);
        return { results: [
          { label: 'Programar a bomba em', value: fmt(mlh, 1), unit: 'mL/h', main: true },
          { label: 'Em macrogotas', value: fmt(Math.round(mlh / 3), 0), unit: 'gts/min' },
          { label: 'Em microgotas', value: fmt(Math.round(mlh), 0), unit: 'mcgts/min' }
        ] };
      } },

    { id: 'dose', cat: 'medicacao', icon: '💉', title: 'Dose (regra de três)', desc: 'Quantos mL aspirar da apresentação disponível',
      fields: [
        { id: 'apr', label: 'Medicamento e apresentação de mercado', type: 'apres', map: 'qtd:qtd,vol:vol' },
        { id: 'dose', label: 'Dose prescrita', units: MASS_UNITS, defU: 'mg', def: 250 },
        { id: 'qtd', label: 'Apresentação: quantidade', units: MASS_UNITS, defU: 'mg', def: 500 },
        { id: 'vol', label: 'Apresentação: em volume de', unit: 'mL', def: 2 }
      ],
      compute: function (v) {
        if (!C.sameClass(v.dose_u, v.qtd_u)) return { error: 'As unidades da dose e da apresentação não são compatíveis (' + v.dose_u + ' × ' + v.qtd_u + ').' };
        var ml = C.volumeDose(v.dose, v.dose_u, v.qtd, v.qtd_u, v.vol);
        if (ml == null) return null;
        var warns = [];
        if (ml > v.vol) warns.push('A dose é maior que o conteúdo de uma unidade da apresentação (' + fmt(ml / v.vol, 2) + ' unidades).');
        return { results: [
          { label: 'Aspirar', value: fmt(ml, 2), unit: 'mL', main: true },
          { label: 'Concentração da apresentação', value: fmt(v.qtd / v.vol, 3), unit: v.qtd_u + '/mL' }
        ], warns: warns, notes: ['Fórmula: mL = dose prescrita × volume ÷ quantidade disponível.'] };
      } },

    { id: 'reconstituicao', cat: 'medicacao', icon: '🧴', title: 'Reconstituição de pó', desc: 'Frasco-ampola: concentração, volume e infusão',
      fields: [
        { id: 'apr', label: 'Frasco-ampola de mercado', type: 'apres', map: 'qtd:qtd,vol:dil', po: true },
        { id: 'qtd', label: 'Conteúdo do frasco', units: MASS_UNITS, defU: 'mg', def: 1000 },
        { id: 'dil', label: 'Diluente adicionado', unit: 'mL', def: 10, chips: [2, 3, 5, 10, 20] },
        { id: 'desl', label: 'Volume ocupado pelo pó (se informado na bula)', unit: 'mL', def: 0, hint: 'Deixe 0 se desconhecido' },
        { id: 'dose', label: 'Dose prescrita', units: MASS_UNITS, defU: 'mg', def: 500 },
        { id: 'diluir', label: 'Diluir depois em (opcional)', unit: 'mL', def: 100, optional: true, chips: [50, 100, 250] },
        { id: 'tempo', label: 'Tempo de infusão (opcional)', unit: 'min', def: 30, optional: true, chips: [15, 30, 60, 120] }
      ],
      compute: function (v) {
        if (!C.sameClass(v.dose_u, v.qtd_u)) return { error: 'Unidades incompatíveis entre dose e frasco.' };
        var r = C.reconstituicao(v.qtd, v.dil, v.desl);
        if (!r || !(v.dose > 0)) return null;
        var ml = C.convert(v.dose, v.dose_u, v.qtd_u) / r.conc;
        var out = [
          { label: 'Aspirar do frasco', value: fmt(ml, 2), unit: 'mL', main: true },
          { label: 'Concentração após reconstituir', value: fmt(r.conc, 2), unit: v.qtd_u + '/mL' },
          { label: 'Volume final no frasco', value: fmt(r.volFinal, 1), unit: 'mL' }
        ];
        var warns = [];
        if (ml > r.volFinal) warns.push('A dose excede um frasco: serão necessários ' + fmt(Math.ceil(ml / r.volFinal), 0) + ' frascos.');
        if (v.diluir > 0) {
          var tot = v.diluir + ml;
          out.push({ label: 'Volume total da solução final', value: fmt(tot, 1), unit: 'mL' });
          out.push({ label: 'Concentração final', value: fmt(C.convert(v.dose, v.dose_u, v.qtd_u) / tot, 3), unit: v.qtd_u + '/mL' });
          if (v.tempo > 0) {
            out.push({ label: 'Bomba de infusão', value: fmt(tot / (v.tempo / 60), 1), unit: 'mL/h' });
            out.push({ label: 'Gotejamento (macrogotas)', value: fmt(Math.round(tot * 20 / v.tempo), 0), unit: 'gts/min' });
            out.push({ label: 'Gotejamento (microgotas)', value: fmt(Math.round(tot * 60 / v.tempo), 0), unit: 'mcgts/min' });
          }
        }
        return { results: out, warns: warns };
      } },

    { id: 'penicilina', cat: 'medicacao', icon: '🧫', title: 'Penicilina cristalina', desc: 'Frasco em UI com volume do pó',
      fields: [
        { id: 'ui', label: 'Frasco', type: 'select', options: [['5000000', '5.000.000 UI'], ['10000000', '10.000.000 UI'], ['1000000', '1.000.000 UI']], def: '5000000' },
        { id: 'dil', label: 'Diluente (AD)', unit: 'mL', def: 8, chips: [6, 8, 10] },
        { id: 'desl', label: 'Volume ocupado pelo pó', unit: 'mL', def: 2, hint: '≈ 2 mL no frasco de 5.000.000 UI (confira a bula)' },
        { id: 'dose', label: 'Dose prescrita', unit: 'UI', def: 2000000 }
      ],
      compute: function (v) {
        var r = C.reconstituicao(+v.ui, v.dil, v.desl);
        if (!r || !(v.dose > 0)) return null;
        var ml = v.dose / r.conc, warns = [];
        if (ml > r.volFinal) warns.push('Dose maior que um frasco.');
        return { results: [
          { label: 'Aspirar', value: fmt(ml, 2), unit: 'mL', main: true },
          { label: 'Concentração', value: fmt(r.conc, 0), unit: 'UI/mL' },
          { label: 'Volume final no frasco', value: fmt(r.volFinal, 1), unit: 'mL' }
        ], warns: warns, notes: ['Em seguida, diluir em 50–100 mL de SF 0,9% ou SG 5% e infundir em 30–60 min (confira protocolo).'] };
      } },

    { id: 'transformacao-soro', cat: 'solucoes', icon: '🔬', title: 'Transformação de soro', desc: 'Ex.: SG 5% → SG 10% com glicose 50%',
      fields: [
        { id: 'vol', label: 'Volume do soro disponível', unit: 'mL', def: 500, chips: [250, 500, 1000] },
        { id: 'c1', label: 'Concentração atual', unit: '%', def: 5, chips: [5, 10] },
        { id: 'c2', label: 'Concentração desejada', unit: '%', def: 10, chips: [7.5, 10, 12.5, 15, 20] },
        { id: 'ca', label: 'Concentração da ampola', unit: '%', def: 50, chips: [25, 50] },
        { id: 'va', label: 'Volume de cada ampola', unit: 'mL', def: 10, chips: [10, 20] },
        { id: 'met', label: 'Método', type: 'seg', options: [['adicionar', 'Apenas adicionar'], ['substituir', 'Desprezar e repor']], def: 'adicionar' }
      ],
      compute: function (v) {
        if (v.c2 <= v.c1) return { error: 'A concentração desejada deve ser maior que a atual.' };
        if (v.ca <= v.c2) return { error: 'A ampola precisa ser mais concentrada que a solução desejada.' };
        var r = C.transformacaoSoro(v.vol, v.c1, v.c2, v.ca, v.met);
        if (!r) return null;
        var out = [{ label: 'Adicionar de glicose ' + fmt(v.ca) + '%', value: fmt(r.volHipertonico, 1), unit: 'mL', main: true }];
        if (v.va > 0) out.push({ label: 'Em ampolas de ' + fmt(v.va) + ' mL', value: fmt(r.volHipertonico / v.va, 1), unit: 'ampolas' });
        if (v.met === 'substituir') out.push({ label: 'Desprezar antes do soro', value: fmt(r.desprezar, 1), unit: 'mL' });
        out.push({ label: 'Volume final', value: fmt(r.volFinal, 1), unit: 'mL' });
        out.push({ label: 'Glicose total na solução', value: fmt(r.gramasFinal, 1), unit: 'g' });
        return { results: out, notes: ['Atenção: % = g/100 mL. Ex.: glicose 50% tem 5 g em cada ampola de 10 mL.'] };
      } },

    { id: 'eletrolitos', cat: 'solucoes', icon: '⚡', title: 'Eletrólitos (mEq ↔ mL)', desc: 'KCl, NaCl, bicarbonato, cálcio, magnésio',
      fields: [
        { id: 'sol', label: 'Solução', type: 'select', options: D.ELECTROLYTES.map(function (e) { return [e.id, e.nome]; }), def: 'kcl191' },
        { id: 'modo', label: 'Calcular', type: 'seg', options: [['meq', 'mEq → mL'], ['ml', 'mL → mEq']], def: 'meq' },
        { id: 'val', label: 'Valor', unit: 'mEq ou mL', def: 10 }
      ],
      compute: function (v) {
        var e = D.ELECTROLYTES.filter(function (x) { return x.id === v.sol; })[0];
        if (!e || !(v.val > 0)) return null;
        var ml = v.modo === 'meq' ? v.val / e.meqMl : v.val;
        var meq = v.modo === 'meq' ? v.val : v.val * e.meqMl;
        var out = v.modo === 'meq'
          ? [{ label: 'Volume', value: fmt(ml, 2), unit: 'mL', main: true }, { label: 'Equivale a', value: fmt(ml * e.mgMl / 1000, 2), unit: 'g de sal' }]
          : [{ label: 'Quantidade', value: fmt(meq, 2), unit: 'mEq', main: true }, { label: 'Equivale a', value: fmt(ml * e.mgMl / 1000, 2), unit: 'g de sal' }];
        out.push({ label: 'Concentração da solução', value: fmt(e.meqMl, 3), unit: 'mEq/mL' });
        return { results: out, warns: e.alerta ? [e.alerta] : [] };
      } },

    { id: 'percentual', cat: 'solucoes', icon: '％', title: 'Solução percentual', desc: '% → mg/mL e gramas no volume',
      fields: [
        { id: 'pct', label: 'Concentração', unit: '%', def: 0.9, chips: [0.45, 0.9, 3, 5, 10, 20, 50] },
        { id: 'vol', label: 'Volume', unit: 'mL', def: 500, chips: [100, 250, 500, 1000] }
      ],
      compute: function (v) {
        if (!(v.pct > 0)) return null;
        var out = [{ label: 'Concentração', value: fmt(v.pct * 10, 2), unit: 'mg/mL', main: true }];
        if (v.vol > 0) out.push({ label: 'Soluto no volume', value: fmt(v.pct * v.vol / 100, 2), unit: 'g' });
        return { results: out, notes: ['x% = x g em 100 mL = x × 10 mg/mL.'] };
      } },

    { id: 'dose-peso', cat: 'pediatria', icon: '⚖️', title: 'Dose por peso (mg/kg)', desc: 'Dose pediátrica e volume a administrar',
      fields: [
        { id: 'apr', label: 'Medicamento e apresentação de mercado', type: 'apres', map: 'qtd:qtd,vol:vol', soMg: true },
        { id: 'peso', label: 'Peso', unit: 'kg', def: 12 },
        { id: 'dpk', label: 'Dose prescrita/recomendada', unit: 'mg/kg', def: 15 },
        { id: 'tipo', label: 'A dose em mg/kg é', type: 'seg', options: [['dose', 'Por dose'], ['dia', 'Por dia (dividir)']], def: 'dose' },
        { id: 'nx', label: 'Doses por dia', unit: 'vezes', def: 4, chips: [1, 2, 3, 4, 6] },
        { id: 'qtd', label: 'Apresentação: mg', unit: 'mg', def: 200 },
        { id: 'vol', label: 'Apresentação: em mL', unit: 'mL', def: 5 },
        { id: 'max', label: 'Dose máxima por dose (opcional)', unit: 'mg', optional: true }
      ],
      compute: function (v) {
        if (!(v.peso > 0) || !(v.dpk > 0)) return null;
        var porDose = v.tipo === 'dia' ? v.peso * v.dpk / (v.nx || 1) : v.peso * v.dpk;
        var warns = [];
        if (v.max > 0 && porDose > v.max) { warns.push('Dose calculada (' + fmt(porDose) + ' mg) excede a máxima informada. Usando ' + fmt(v.max) + ' mg.'); porDose = v.max; }
        var out = [{ label: 'Dose por administração', value: fmt(porDose, 2), unit: 'mg', main: v.qtd > 0 && v.vol > 0 ? false : true }];
        if (v.qtd > 0 && v.vol > 0) out.unshift({ label: 'Volume por dose', value: fmt(porDose * v.vol / v.qtd, 2), unit: 'mL', main: true });
        if (v.nx > 0) out.push({ label: 'Dose diária total', value: fmt(porDose * v.nx, 1), unit: 'mg/dia' });
        if (v.nx > 0) out.push({ label: 'Intervalo', value: 'de ' + fmt(24 / v.nx, 1) + ' em ' + fmt(24 / v.nx, 1) + ' h' });
        return { results: out, warns: warns };
      } },

    { id: 'aprazamento', cat: 'medicacao', icon: '🕒', title: 'Aprazamento', desc: 'Horários das doses a partir do início e do intervalo',
      fields: [
        { id: 'ini', label: 'Horário da 1ª dose', type: 'time', def: '08:00' },
        { id: 'int', label: 'Intervalo', type: 'select', def: '8', options: [['2', 'de 2 em 2 h (12x/dia)'], ['3', 'de 3 em 3 h (8x/dia)'], ['4', 'de 4 em 4 h (6x/dia)'], ['6', 'de 6 em 6 h (4x/dia)'], ['8', 'de 8 em 8 h (3x/dia)'], ['12', 'de 12 em 12 h (2x/dia)'], ['24', '1x ao dia']] }
      ],
      compute: function (v) {
        if (!/^\d{2}:\d{2}$/.test(v.ini || '')) return null;
        var p = v.ini.split(':'), lista = C.aprazamento(+p[0] * 60 + +p[1], +v.int);
        if (!lista) return null;
        var agora = new Date(), am = agora.getHours() * 60 + agora.getMinutes();
        var prox = lista.map(function (x) { return x.min; }).sort(function (a, b) { return ((a - am + 1440) % 1440) - ((b - am + 1440) % 1440); })[0];
        return { results: [
          { label: 'Horários em 24 h', value: lista.map(function (x) { return C.hhmm(x.min) + (x.diaSeguinte ? '*' : ''); }).join(' · '), main: true, sub: lista.some(function (x) { return x.diaSeguinte; }) ? '* dia seguinte' : '' },
          { label: 'Doses por dia', value: String(lista.length) },
          { label: 'Próxima dose (a partir de agora)', value: C.hhmm(prox) }
        ], notes: ['Ajuste ao padrão de horários da instituição e evite, quando possível, horários que interrompam o sono sem necessidade.'] };
      } },

    { id: 'holliday', cat: 'pediatria', icon: '🍼', title: 'Hidratação de manutenção', desc: 'Holliday-Segar (regra 4-2-1)',
      fields: [{ id: 'peso', label: 'Peso', unit: 'kg', def: 15 }],
      compute: function (v) {
        var r = C.holliday(v.peso);
        if (!r) return null;
        return { results: [
          { label: 'Volume em 24 h', value: fmt(r.mlDia, 0), unit: 'mL/dia', main: true },
          { label: 'Vazão', value: fmt(r.mlH, 1), unit: 'mL/h' },
          { label: 'Microgotas', value: fmt(Math.round(r.mlH), 0), unit: 'mcgts/min' }
        ], notes: ['100 mL/kg até 10 kg; +50 mL/kg de 10–20 kg; +20 mL/kg acima de 20 kg.'] };
      } },

    { id: 'imc', cat: 'clinico', icon: '📏', title: 'IMC e superfície corporal', desc: 'Índice de massa corporal e SC (Mosteller)',
      fields: [{ id: 'peso', label: 'Peso', unit: 'kg', def: 70 }, { id: 'alt', label: 'Altura', unit: 'cm', def: 170 }],
      compute: function (v) {
        var i = C.imc(v.peso, v.alt);
        if (i == null) return null;
        return { results: [
          { label: 'IMC', value: fmt(i, 1), unit: 'kg/m²', main: true, sub: C.classificaImc(i) },
          { label: 'Superfície corporal', value: fmt(C.superficieCorporal(v.peso, v.alt), 2), unit: 'm²' }
        ] };
      } },

    { id: 'pam', cat: 'clinico', icon: '❤️', title: 'Pressão arterial média', desc: 'PAM = (PAS + 2×PAD) ÷ 3',
      fields: [{ id: 'pas', label: 'PA sistólica', unit: 'mmHg', def: 120 }, { id: 'pad', label: 'PA diastólica', unit: 'mmHg', def: 80 }],
      compute: function (v) {
        var p = C.pam(v.pas, v.pad);
        if (p == null) return null;
        var warns = p < 65 ? ['PAM < 65 mmHg: hipoperfusão — comunicar equipe.'] : [];
        return { results: [{ label: 'PAM', value: fmt(p, 0), unit: 'mmHg', main: true }, { label: 'Pressão de pulso', value: fmt(v.pas - v.pad, 0), unit: 'mmHg' }], warns: warns };
      } },

    { id: 'clearance', cat: 'clinico', icon: '🫘', title: 'Clearance de creatinina', desc: 'Cockcroft-Gault',
      fields: [
        { id: 'idade', label: 'Idade', unit: 'anos', def: 60 },
        { id: 'peso', label: 'Peso', unit: 'kg', def: 70 },
        { id: 'cr', label: 'Creatinina sérica', unit: 'mg/dL', def: 1.0 },
        { id: 'sexo', label: 'Sexo', type: 'seg', options: [['m', 'Masculino'], ['f', 'Feminino']], def: 'm' }
      ],
      compute: function (v) {
        var r = C.cockcroftGault(v.idade, v.peso, v.cr, v.sexo === 'f');
        if (r == null) return null;
        var est = r >= 90 ? 'Normal' : r >= 60 ? 'Redução leve' : r >= 30 ? 'Redução moderada' : r >= 15 ? 'Redução grave' : 'Falência renal';
        return { results: [{ label: 'ClCr estimado', value: fmt(r, 0), unit: 'mL/min', main: true, sub: est }] };
      } },

    { id: 'ganzoni', cat: 'clinico', icon: '🩸', title: 'Déficit de ferro (Ganzoni)', desc: 'Dose total de ferro EV e nº de ampolas',
      fields: [
        { id: 'peso', label: 'Peso', unit: 'kg', def: 70 },
        { id: 'hb', label: 'Hemoglobina atual', unit: 'g/dL', def: 9 },
        { id: 'alvo', label: 'Hemoglobina alvo', unit: 'g/dL', def: 15, hint: 'Ganzoni: 15 g/dL se ≥ 35 kg; 13 g/dL se < 35 kg (ou conforme prescrição)' }
      ],
      compute: function (v) {
        var r = C.ganzoni(v.peso, v.hb, v.alvo);
        if (!r) return null;
        return { results: [
          { label: 'Déficit total de ferro', value: fmt(r.total, 0), unit: 'mg', main: true, sub: 'Hemoglobina: ' + fmt(r.hb, 0) + ' mg + reservas: ' + fmt(r.reservas, 0) + ' mg' },
          { label: 'Ampolas de 100 mg (sacarato férrico)', value: fmt(Math.ceil(r.total / 100), 0), unit: 'ampolas' },
          { label: 'Aplicações de 200 mg', value: fmt(Math.ceil(r.total / 200), 0), unit: 'aplicações' }
        ], notes: ['Fórmula de Ganzoni: peso × (Hb alvo − Hb atual) × 2,4 + reservas. A dose por aplicação e o intervalo seguem a prescrição e a bula.'] };
      } },

    { id: 'adrogue', cat: 'solucoes', icon: '🧂', title: 'Correção de sódio (Adrogué-Madias)', desc: 'Quanto 1 L de cada solução muda o sódio sérico',
      fields: [
        { id: 'na', label: 'Sódio sérico atual', unit: 'mEq/L', def: 118 },
        { id: 'peso', label: 'Peso', unit: 'kg', def: 70 },
        { id: 'pac', label: 'Paciente', type: 'select', def: '0.6', options: [['0.6', 'Homem adulto / criança (60%)'], ['0.5', 'Mulher adulta ou homem idoso (50%)'], ['0.45', 'Mulher idosa (45%)']] },
        { id: 'sol', label: 'Solução', type: 'select', def: '513', options: [['513', 'NaCl 3% (513 mEq/L)'], ['154', 'SF 0,9% (154 mEq/L)'], ['130', 'Ringer lactato (130 mEq/L)'], ['77', 'NaCl 0,45% (77 mEq/L)'], ['0', 'SG 5% (0 mEq/L)']] },
        { id: 'k', label: 'Potássio adicionado por litro (opcional)', unit: 'mEq/L', def: 0, optional: true }
      ],
      compute: function (v) {
        var r = C.adrogueMadias(v.na, +v.sol, v.k || 0, v.peso, +v.pac);
        if (!r) return null;
        var warns = [];
        if (Math.abs(r.deltaPorLitro) * 1 > 8) warns.push('Um litro já ultrapassaria 8 mEq/L — fracionar e infundir lentamente.');
        return { results: [
          { label: 'Variação do Na com 1 L', value: (r.deltaPorLitro > 0 ? '+' : '') + fmt(r.deltaPorLitro, 1), unit: 'mEq/L', main: true },
          { label: 'Volume que muda o Na em 8 mEq/L (limite de 24 h)', value: r.litrosPara8 ? fmt(r.litrosPara8 * 1000, 0) : '—', unit: 'mL' },
          { label: 'Água corporal total estimada', value: fmt(r.act, 1), unit: 'L' }
        ], warns: warns, notes: ['Limite de correção: até 8 mEq/L nas primeiras 24 h (risco de desmielinização osmótica). A fórmula é estimativa — dosar o sódio a cada 2–4 h. Fonte: Manual MSD — Hiponatremia.'] };
      } },

    { id: 'sodio-corrigido', cat: 'clinico', icon: '🍭', title: 'Sódio corrigido pela glicemia', desc: 'Hiperglicemia (cetoacidose, estado hiperosmolar)',
      fields: [{ id: 'na', label: 'Sódio medido', unit: 'mEq/L', def: 130 }, { id: 'gli', label: 'Glicemia', unit: 'mg/dL', def: 600 }],
      compute: function (v) {
        var r = C.sodioCorrigido(v.na, v.gli);
        if (!r) return null;
        return { results: [{ label: 'Sódio corrigido (Katz, 1,6)', value: fmt(r.katz, 1), unit: 'mEq/L', main: true }, { label: 'Sódio corrigido (Hillier, 2,4)', value: fmt(r.hillier, 1), unit: 'mEq/L' }],
          notes: ['Soma 1,6 (Katz) ou 2,4 (Hillier) mEq/L para cada 100 mg/dL de glicose acima de 100. Fonte: Manual MSD — Complicações agudas do diabetes.'] };
      } },

    { id: 'anion-gap', cat: 'clinico', icon: '⚖️', title: 'Ânion gap', desc: 'Investigação de acidose metabólica',
      fields: [{ id: 'na', label: 'Sódio', unit: 'mEq/L', def: 140 }, { id: 'cl', label: 'Cloro', unit: 'mEq/L', def: 100 }, { id: 'hco3', label: 'Bicarbonato', unit: 'mEq/L', def: 14 },
        { id: 'alb', label: 'Albumina (opcional)', unit: 'g/dL', optional: true }],
      compute: function (v) {
        var r = C.anionGap(v.na, v.cl, v.hco3, v.alb);
        if (!r) return null;
        var ref = r.corrigido != null ? r.corrigido : r.ag;
        return { results: [{ label: 'Ânion gap', value: fmt(r.ag, 1), unit: 'mEq/L', main: true, sub: ref > 12 ? 'Elevado (referência usual 8–12)' : 'Dentro da referência usual (8–12)' }]
          .concat(r.corrigido != null ? [{ label: 'Corrigido pela albumina', value: fmt(r.corrigido, 1), unit: 'mEq/L' }] : []),
          notes: ['AG = Na − (Cl + HCO₃). Elevado sugere cetoacidose, acidose lática, insuficiência renal ou intoxicações. Referência varia entre laboratórios.'] };
      } },

    { id: 'calcio-corrigido', cat: 'clinico', icon: '🦴', title: 'Cálcio corrigido pela albumina', desc: 'Hipoalbuminemia altera o cálcio total',
      fields: [{ id: 'ca', label: 'Cálcio total', unit: 'mg/dL', def: 7.8 }, { id: 'alb', label: 'Albumina', unit: 'g/dL', def: 2.5 }],
      compute: function (v) {
        var r = C.calcioCorrigido(v.ca, v.alb);
        if (r == null) return null;
        return { results: [{ label: 'Cálcio corrigido', value: fmt(r, 1), unit: 'mg/dL', main: true, sub: r < 8.5 ? 'Abaixo da referência usual (8,5–10,5)' : r > 10.5 ? 'Acima da referência usual (8,5–10,5)' : 'Dentro da referência usual (8,5–10,5)' }],
          notes: ['Ca corrigido = Ca + 0,8 × (4 − albumina). Estimativa: em pacientes graves prefira o cálcio iônico. Fonte: Manual MSD — Hipocalcemia.'] };
      } },

    { id: 'agua-livre', cat: 'solucoes', icon: '💧', title: 'Déficit de água livre', desc: 'Hipernatremia: quanto de água falta',
      fields: [{ id: 'peso', label: 'Peso', unit: 'kg', def: 70 }, { id: 'na', label: 'Sódio sérico', unit: 'mEq/L', def: 160 },
        { id: 'fat', label: 'Paciente', type: 'select', def: '0.6', options: [['0.6', 'Homem adulto (0,6)'], ['0.5', 'Mulher adulta ou homem idoso (0,5)'], ['0.45', 'Mulher idosa (0,45)']] }],
      compute: function (v) {
        var r = C.deficitAguaLivre(v.peso, v.na, parseFloat(v.fat));
        if (r == null) return null;
        if (r <= 0) return { results: [{ label: 'Déficit de água livre', value: '0', unit: 'L', main: true, sub: 'Sódio ≤ 140: sem déficit pela fórmula' }] };
        return { results: [{ label: 'Déficit de água livre', value: fmt(r, 1), unit: 'L', main: true }],
          warns: ['Corrigir lentamente: em geral não reduzir o sódio mais que 10 mEq/L em 24 h na hipernatremia crônica (risco de edema cerebral).'],
          notes: ['Déficit = fator × peso × (Na/140 − 1). Some as perdas contínuas. Use também a calculadora de Adrogué-Madias para estimar o efeito de cada solução. Fonte: Manual MSD — Hipernatremia.'] };
      } },

    { id: 'corticoides', cat: 'conversoes', icon: '💊', title: 'Equivalência de corticoides', desc: 'Converter dose entre corticoides (efeito anti-inflamatório)',
      fields: [{ id: 'dose', label: 'Dose atual', unit: 'mg', def: 40 },
        { id: 'de', label: 'De', type: 'select', def: 'prednisona', options: Object.keys(C.CORTICOIDES).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1) + ' (' + String(C.CORTICOIDES[k]).replace('.', ',') + ' mg)']; }) },
        { id: 'para', label: 'Para', type: 'select', def: 'dexametasona', options: Object.keys(C.CORTICOIDES).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1) + ' (' + String(C.CORTICOIDES[k]).replace('.', ',') + ' mg)']; }) }],
      compute: function (v) {
        var r = C.equivCorticoide(v.dose, v.de, v.para);
        if (r == null) return null;
        return { results: [{ label: 'Dose equivalente', value: fmt(r, 2), unit: 'mg de ' + v.para, main: true }],
          notes: ['Equivalência anti-inflamatória aproximada (hidrocortisona 20 = prednisona 5 = metilprednisolona 4 = dexametasona 0,75 mg). Não considera efeito mineralocorticoide nem duração de ação. Fonte: Manual MSD — Corticosteroides.'] };
      } },

    { id: 'debito-urinario', cat: 'clinico', icon: '🚽', title: 'Débito urinário', desc: 'Diurese em mL/kg/h',
      fields: [{ id: 'vol', label: 'Diurese no período', unit: 'mL', def: 300, chips: [100, 200, 300, 500, 1000] }, { id: 'h', label: 'Período', unit: 'h', def: 6, chips: [1, 6, 12, 24] },
        { id: 'peso', label: 'Peso', unit: 'kg', def: 70 }, { id: 'tipo', label: 'Paciente', type: 'seg', options: [['a', 'Adulto'], ['c', 'Criança']], def: 'a' }],
      compute: function (v) {
        if (!(v.vol >= 0) || !(v.h > 0) || !(v.peso > 0)) return null;
        var r = v.vol / v.h / v.peso, lim = v.tipo === 'c' ? 1 : 0.5;
        return { results: [{ label: 'Débito urinário', value: fmt(r, 2), unit: 'mL/kg/h', main: true, sub: r < lim ? 'Abaixo de ' + fmt(lim, 1) + ' mL/kg/h (oligúria)' : 'Adequado (≥ ' + fmt(lim, 1) + ' mL/kg/h)' },
          { label: 'Média por hora', value: fmt(v.vol / v.h, 0), unit: 'mL/h' }],
          warns: r < lim ? ['Débito urinário baixo: avaliar perfusão, hidratação e sonda; comunicar a equipe.'] : [] };
      } },

    { id: 'indice-choque', cat: 'clinico', icon: '📉', title: 'Índice de choque', desc: 'FC ÷ PAS — triagem de hipovolemia e hemorragia',
      fields: [{ id: 'fc', label: 'Frequência cardíaca', unit: 'bpm', def: 110 }, { id: 'pas', label: 'PA sistólica', unit: 'mmHg', def: 100 },
        { id: 'tipo', label: 'Contexto', type: 'seg', options: [['g', 'Geral'], ['o', 'Obstétrico']], def: 'g' }],
      compute: function (v) {
        if (!(v.fc > 0) || !(v.pas > 0)) return null;
        var ic = v.fc / v.pas, lim = v.tipo === 'o' ? 0.9 : 1;
        return { results: [{ label: 'Índice de choque', value: fmt(ic, 2), main: true, sub: ic >= lim ? 'Elevado (≥ ' + fmt(lim, 1) + ')' : 'Abaixo de ' + fmt(lim, 1) }],
          warns: ic >= lim ? [v.tipo === 'o' ? 'Índice de choque obstétrico ≥ 0,9: perda sanguínea importante provável — acionar protocolo de hemorragia pós-parto.' : 'Índice ≥ 1: sugere choque — avaliar sangramento e perfusão.'] : [],
          notes: ['Referência: valores normais em torno de 0,5–0,7. O índice obstétrico usa o ponto de corte 0,9 (OPAS/OMS).'] };
      } },

    { id: 'relacao-pf', cat: 'clinico', icon: '🫁', title: 'Relação PaO₂/FiO₂', desc: 'Oxigenação e classificação da SDRA',
      fields: [{ id: 'pao2', label: 'PaO₂ (gasometria arterial)', unit: 'mmHg', def: 80 }, { id: 'fio2', label: 'FiO₂', unit: '%', def: 40, chips: [21, 30, 40, 50, 60, 80, 100] }],
      compute: function (v) {
        if (!(v.pao2 > 0) || !(v.fio2 >= 21 && v.fio2 <= 100)) return { error: 'Informe a PaO₂ e a FiO₂ entre 21% e 100%.' };
        var pf = v.pao2 / (v.fio2 / 100);
        var cl = pf > 300 ? 'Acima de 300' : pf > 200 ? 'SDRA leve (200–300)' : pf > 100 ? 'SDRA moderada (100–200)' : 'SDRA grave (≤ 100)';
        return { results: [{ label: 'PaO₂/FiO₂', value: fmt(pf, 0), main: true, sub: cl }],
          notes: ['A classificação de SDRA (Berlim) vale com PEEP ≥ 5 cmH₂O e quadro compatível; a relação isolada não faz o diagnóstico.'] };
      } },

    { id: 'osmolalidade', cat: 'solucoes', icon: '🧂', title: 'Osmolalidade sérica calculada', desc: '2 × Na + glicose/18 + ureia/6',
      fields: [{ id: 'na', label: 'Sódio', unit: 'mEq/L', def: 140 }, { id: 'gli', label: 'Glicemia', unit: 'mg/dL', def: 100 }, { id: 'ur', label: 'Ureia', unit: 'mg/dL', def: 30 }],
      compute: function (v) {
        if (!(v.na > 0) || !(v.gli > 0) || !(v.ur >= 0)) return null;
        var o = 2 * v.na + v.gli / 18 + v.ur / 6, ef = 2 * v.na + v.gli / 18;
        return { results: [{ label: 'Osmolalidade calculada', value: fmt(o, 0), unit: 'mOsm/kg', main: true, sub: o < 275 ? 'Baixa (< 275)' : o > 295 ? 'Elevada (> 295)' : 'Referência usual 275–295' },
          { label: 'Osmolalidade efetiva (tonicidade)', value: fmt(ef, 0), unit: 'mOsm/kg', sub: ef > 300 ? '> 300: compatível com estado hiperosmolar se hiperglicemia grave' : '' }],
          notes: ['Com ureia em mg/dL divide-se por 6 (equivale a BUN ÷ 2,8). Referências variam entre laboratórios.'] };
      } },

    { id: 'peso-predito', cat: 'clinico', icon: '📐', title: 'Peso predito e volume corrente', desc: 'Ventilação protetora: 6–8 mL/kg de peso predito',
      fields: [{ id: 'alt', label: 'Altura', unit: 'cm', def: 170 }, { id: 'sexo', label: 'Sexo', type: 'seg', options: [['m', 'Masculino'], ['f', 'Feminino']], def: 'm' }],
      compute: function (v) {
        if (!(v.alt >= 120 && v.alt <= 230)) return { error: 'Informe a altura em centímetros (120–230).' };
        var pp = (v.sexo === 'f' ? 45.5 : 50) + 0.91 * (v.alt - 152.4);
        return { results: [{ label: 'Peso predito', value: fmt(pp, 1), unit: 'kg', main: true },
          { label: 'Volume corrente 6 mL/kg', value: fmt(pp * 6, 0), unit: 'mL' }, { label: '7 mL/kg', value: fmt(pp * 7, 0), unit: 'mL' }, { label: '8 mL/kg', value: fmt(pp * 8, 0), unit: 'mL' }],
          notes: ['Fórmula ARDSNet: homem 50 + 0,91 × (altura − 152,4); mulher 45,5 + 0,91 × (altura − 152,4). Use a altura, não o peso real.'] };
      } },

    { id: 'balanco', cat: 'clinico', icon: '📊', title: 'Balanço hídrico', desc: 'Entradas − saídas',
      fields: [
        { id: 'ev', label: 'Entradas: endovenosas', unit: 'mL', def: 1500 },
        { id: 'vo', label: 'Entradas: via oral / enteral', unit: 'mL', def: 800 },
        { id: 'oe', label: 'Entradas: outras', unit: 'mL', def: 0 },
        { id: 'diu', label: 'Saídas: diurese', unit: 'mL', def: 1600 },
        { id: 'dre', label: 'Saídas: drenos / sondas', unit: 'mL', def: 0 },
        { id: 'vom', label: 'Saídas: vômitos / evacuações', unit: 'mL', def: 0 },
        { id: 'peso', label: 'Peso p/ perdas insensíveis (opcional)', unit: 'kg', optional: true, hint: 'Estimativa: 0,5 mL/kg/h' },
        { id: 'horas', label: 'Período', unit: 'h', def: 24 }
      ],
      compute: function (v) {
        var ent = (v.ev || 0) + (v.vo || 0) + (v.oe || 0);
        var pi = v.peso > 0 ? v.peso * 0.5 * (v.horas || 24) : 0;
        var sai = (v.diu || 0) + (v.dre || 0) + (v.vom || 0) + pi;
        var bal = ent - sai;
        var out = [
          { label: 'Balanço', value: (bal > 0 ? '+' : '') + fmt(bal, 0), unit: 'mL', main: true, sub: bal > 0 ? 'Positivo' : bal < 0 ? 'Negativo' : 'Zerado' },
          { label: 'Total de entradas', value: fmt(ent, 0), unit: 'mL' },
          { label: 'Total de saídas', value: fmt(sai, 0), unit: 'mL' }
        ];
        if (pi) out.push({ label: 'Perdas insensíveis estimadas', value: fmt(pi, 0), unit: 'mL' });
        if (v.peso > 0 && v.horas > 0) out.push({ label: 'Débito urinário', value: fmt((v.diu || 0) / v.peso / v.horas, 2), unit: 'mL/kg/h' });
        var warns = (v.peso > 0 && v.horas > 0 && (v.diu || 0) / v.peso / v.horas < 0.5) ? ['Diurese < 0,5 mL/kg/h: oligúria.'] : [];
        return { results: out, warns: warns };
      } },

    { id: 'parkland', cat: 'clinico', icon: '🔥', title: 'Queimados (Parkland)', desc: 'Reposição volêmica nas primeiras 24 h',
      fields: [
        { id: 'peso', label: 'Peso', unit: 'kg', def: 70 },
        { id: 'scq', label: 'Superfície corporal queimada (2º e 3º graus)', unit: '%', def: 30 },
        { id: 'f', label: 'Fórmula', type: 'seg', options: [['4', 'Parkland (4 mL)'], ['2', 'ATLS adulto (2 mL)'], ['3', 'Criança (3 mL)']], def: '4' }
      ],
      compute: function (v) {
        var r = C.parkland(v.peso, v.scq, +v.f);
        if (!r) return null;
        return { results: [
          { label: 'Volume em 24 h (Ringer lactato)', value: fmt(r.total, 0), unit: 'mL', main: true },
          { label: '1ª metade nas primeiras 8 h', value: fmt(r.mlH8, 0), unit: 'mL/h', sub: fmt(r.primeiras8h, 0) + ' mL' },
          { label: '2ª metade nas 16 h seguintes', value: fmt(r.mlH16, 0), unit: 'mL/h', sub: fmt(r.seguintes16h, 0) + ' mL' }
        ], notes: ['Contar as 8 h a partir do momento da queimadura. Ajustar pelo débito urinário (adulto 0,5 mL/kg/h; criança 1 mL/kg/h).'] };
      } },

    { id: 'dpp', cat: 'clinico', icon: '🤰', title: 'Idade gestacional e DPP', desc: 'Regra de Naegele a partir da DUM',
      fields: [{ id: 'dum', label: 'Data da última menstruação (DUM)', type: 'date' }],
      compute: function (v) {
        if (!v.dum) return null;
        var p = v.dum.split('-');
        var r = C.naegele(new Date(+p[0], +p[1] - 1, +p[2]), new Date());
        if (!r) return null;
        if (r.totalDias < 0) return { error: 'A DUM está no futuro.' };
        return { results: [
          { label: 'Idade gestacional hoje', value: r.semanas + ' sem ' + r.dias + ' d', main: true },
          { label: 'Data provável do parto', value: fmtDate(r.dpp) }
        ] };
      } },

    { id: 'oxigenio', cat: 'clinico', icon: '🫁', title: 'Duração do cilindro de O₂', desc: 'Autonomia para transporte',
      fields: [
        { id: 'cap', label: 'Capacidade hidráulica do cilindro', unit: 'L', def: 10, hint: 'Volume interno (água) — veja o cilindro' },
        { id: 'p', label: 'Pressão no manômetro', unit: 'kgf/cm²', def: 150 },
        { id: 'res', label: 'Reserva de segurança', unit: 'kgf/cm²', def: 20 },
        { id: 'fl', label: 'Fluxo', unit: 'L/min', def: 5, chips: [1, 2, 3, 5, 10, 15] }
      ],
      compute: function (v) {
        var r = C.oxigenioCilindro(v.cap, v.p, v.res, v.fl);
        if (!r) return null;
        return { results: [
          { label: 'Autonomia estimada', value: fmtHM(r.minutos), main: true },
          { label: 'Volume de O₂ utilizável', value: fmt(r.litros, 0), unit: 'L' }
        ], notes: ['Estimativa: litros ≈ capacidade × (pressão − reserva). 1 kgf/cm² ≈ 1 bar.'] };
      } },

    { id: 'conversao', cat: 'conversoes', icon: '🔁', title: 'Conversão de unidades', desc: 'g, mg, mcg, ng, L, mL, UI',
      fields: [
        { id: 'val', label: 'Valor', units: ['g', 'mg', 'mcg', 'ng', 'L', 'mL', 'UI', 'mUI'], defU: 'mg', def: 1 },
        { id: 'para', label: 'Converter para', type: 'select', options: [['g', 'g'], ['mg', 'mg'], ['mcg', 'mcg'], ['ng', 'ng'], ['L', 'L'], ['mL', 'mL'], ['UI', 'UI'], ['mUI', 'mUI']], def: 'mcg' }
      ],
      compute: function (v) {
        if (!(v.val >= 0)) return null;
        if (!C.sameClass(v.val_u, v.para)) return { error: 'Não é possível converter ' + v.val_u + ' em ' + v.para + '.' };
        return { results: [{ label: fmt(v.val, 6) + ' ' + v.val_u + ' =', value: fmt(C.convert(v.val, v.val_u, v.para), 6), unit: v.para, main: true }] };
      } },

    { id: 'temperatura', cat: 'conversoes', icon: '🌡️', title: 'Temperatura e peso', desc: '°C ↔ °F e kg ↔ lb',
      fields: [
        { id: 'c', label: 'Celsius', unit: '°C', optional: true, def: 37 },
        { id: 'f', label: 'Fahrenheit', unit: '°F', optional: true },
        { id: 'kg', label: 'Quilogramas', unit: 'kg', optional: true },
        { id: 'lb', label: 'Libras', unit: 'lb', optional: true }
      ],
      compute: function (v) {
        var out = [];
        if (isFinite(v.c)) out.push({ label: fmt(v.c, 1) + ' °C', value: fmt(C.celsiusParaF(v.c), 1), unit: '°F', main: true });
        if (isFinite(v.f)) out.push({ label: fmt(v.f, 1) + ' °F', value: fmt(C.fParaCelsius(v.f), 1), unit: '°C' });
        if (isFinite(v.kg)) out.push({ label: fmt(v.kg) + ' kg', value: fmt(v.kg * 2.20462, 2), unit: 'lb' });
        if (isFinite(v.lb)) out.push({ label: fmt(v.lb) + ' lb', value: fmt(v.lb / 2.20462, 2), unit: 'kg' });
        return out.length ? { results: out } : null;
      } }
  ];

  // ---------- favoritos ----------
  function favs() { return store.get('favs', []); }
  function isFav(k) { return favs().indexOf(k) >= 0; }
  function toggleFav(k) {
    var f = favs(), i = f.indexOf(k);
    if (i >= 0) f.splice(i, 1); else f.push(k);
    store.set('favs', f);
    return i < 0;
  }
  function favButton(key) {
    var on = isFav(key);
    return '<button class="fav' + (on ? ' on' : '') + '" data-fav="' + esc(key) + '" aria-pressed="' + on + '" aria-label="Favoritar">' + (on ? '★' : '☆') + '</button>';
  }

  // ---------- componentes ----------
  function fieldHtml(f, prefix) {
    var id = (prefix || 'f') + '-' + f.id;
    var lab = '<label for="' + id + '">' + esc(f.label) + '</label>';
    if (f.type === 'seg') {
      return '<div class="field"><span class="lbl">' + esc(f.label) + '</span><div class="seg" role="radiogroup">' +
        f.options.map(function (o) {
          return '<label class="seg-opt"><input type="radio" name="' + id + '" data-k="' + f.id + '" value="' + esc(o[0]) + '"' + (o[0] === f.def ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>';
        }).join('') + '</div></div>';
    }
    if (f.type === 'select') {
      return '<div class="field">' + lab + '<select id="' + id + '" data-k="' + f.id + '">' +
        f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === f.def ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
        '</select></div>';
    }
    if (f.type === 'apres') {
      var grupos = Object.keys(AP.AP).map(function (k) { return { id: k, nome: nomeMed(k), l: AP.lista(k) }; })
        .concat(BX.EXTRAS.filter(function (x) { return x.ap && !AP.AP[x.id]; }).map(function (x) { return { id: x.id, nome: x.nome, l: x.ap.map(function (a) { return { rot: a[0], qtd: a[1], u: a[2], vol: a[3] }; }) }; }))
        .map(function (g) { g.l = g.l.filter(function (a) { return (!f.soMg || a.u === 'mg') && (!f.po || /p[óo]|FA /i.test(a.rot)); }); return g; })
        .filter(function (g) { return g.l.length; }).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
      return '<div class="field">' + lab + '<select id="' + id + '" data-apres="' + esc(f.map) + '"><option value="">— Escolher (ou digite abaixo) —</option>' +
        grupos.map(function (g) {
          return '<optgroup label="' + esc(g.nome) + '">' + g.l.map(function (a) { return '<option value="' + esc(JSON.stringify([a.qtd, a.u, a.vol])) + '">' + esc(g.nome + ' — ' + a.rot) + '</option>'; }).join('') + '</optgroup>';
        }).join('') + '</select><small>Preenche a apresentação automaticamente. Confira o rótulo do produto.</small></div>';
    }
    if (f.type === 'date' || f.type === 'time') {
      return '<div class="field">' + lab + '<input type="' + f.type + '" id="' + id + '" data-k="' + f.id + '" value="' + esc(f.def || '') + '"></div>';
    }
    var unit = f.units
      ? '<select class="unit" data-k="' + f.id + '_u" aria-label="Unidade">' + f.units.map(function (u) { return '<option' + (u === f.defU ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select>'
      : (f.unit ? '<span class="unit">' + esc(f.unit) + '</span>' : '');
    return '<div class="field">' + lab + '<div class="input-wrap"><input id="' + id + '" data-k="' + f.id + '" type="text" inputmode="decimal" autocomplete="off" value="' +
      (f.def != null ? esc(String(f.def).replace('.', ',')) : '') + '" placeholder="' + (f.optional ? 'opcional' : '') + '">' + unit + '</div>' +
      (f.chips ? '<div class="qchips">' + f.chips.map(function (c) { return '<button type="button" class="qchip" data-qv="' + c + '">' + esc(fmt(c, 2)) + '</button>'; }).join('') + '</div>' : '') +
      (f.hint ? '<small>' + esc(f.hint) + '</small>' : '') + '</div>';
  }
  function nomeMed(id) {
    var d = D.DRUGS.filter(function (x) { return x.id === id; })[0] || BX.EXTRAS.filter(function (x) { return x.id === id; })[0];
    return d ? d.nome : id;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-scroll]');
    if (!b) return;
    var alvo = document.getElementById(b.getAttribute('data-scroll'));
    if (alvo) {
      var aba = alvo.closest('[role=tabpanel]');
      if (aba && aba.hidden) { var t = document.getElementById('tab-' + aba.id.replace('pane-', '')); if (t) t.click(); alvo = document.getElementById(b.getAttribute('data-scroll')); }
      alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  // Toque rápido nos valores de mercado e escolha de apresentação (calculadoras)
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.qchip');
    if (!b) return;
    var inp = b.closest('.field').querySelector('input[type=text]');
    inp.value = fmtIn(+b.getAttribute('data-qv'));
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  document.addEventListener('change', function (e) {
    var sel = e.target;
    if (!sel.matches || !sel.matches('select[data-apres]') || !sel.value) return;
    var a = JSON.parse(sel.value), form = sel.form || sel.closest('form');
    sel.getAttribute('data-apres').split(',').forEach(function (par) {
      var kv = par.split(':'), alvo = form.querySelector('input[data-k="' + kv[1] + '"]');
      if (!alvo) return;
      alvo.value = fmtIn(kv[0] === 'qtd' ? a[0] : a[2]);
      if (kv[0] === 'qtd') {
        var u = form.querySelector('[data-k="' + kv[1] + '_u"]');
        if (u && Array.prototype.some.call(u.options, function (o) { return o.value === a[1] || o.text === a[1]; })) u.value = a[1];
      }
    });
    form.dispatchEvent(new Event('input'));
  });

  function readValues(form, fields) {
    var v = {};
    fields.forEach(function (f) {
      if (f.type === 'apres') return;
      if (f.type === 'seg') {
        var r = form.querySelector('input[data-k="' + f.id + '"]:checked');
        v[f.id] = r ? r.value : f.def;
      } else if (f.type === 'select' || f.type === 'date' || f.type === 'time') {
        v[f.id] = form.querySelector('[data-k="' + f.id + '"]').value;
      } else {
        v[f.id] = num(form.querySelector('input[data-k="' + f.id + '"]').value);
        var u = form.querySelector('[data-k="' + f.id + '_u"]');
        if (u) v[f.id + '_u'] = u.value;
      }
    });
    return v;
  }

  function resultsHtml(r) {
    if (!r) return '<div class="result empty">Preencha os campos para ver o resultado.</div>';
    if (r.error) return '<div class="alert bad">' + esc(r.error) + '</div>';
    var h = '<div class="result">' + r.results.map(function (x) {
      return '<div class="res' + (x.main ? ' main' : '') + '"><span class="res-l">' + esc(x.label) + '</span><span class="res-v">' + esc(x.value) +
        (x.unit ? ' <small>' + esc(x.unit) + '</small>' : '') + '</span>' + (x.sub ? '<span class="res-s">' + esc(x.sub) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
    (r.warns || []).forEach(function (w) { h += '<div class="alert warn">⚠️ ' + esc(w) + '</div>'; });
    (r.notes || []).forEach(function (n) { h += '<p class="note">' + esc(n) + '</p>'; });
    return h;
  }

  function bindLiveForm(form, fields, compute, out) {
    function run() {
      var r;
      try { r = compute(readValues(form, fields)); } catch (e) { r = { error: e.message }; }
      out.innerHTML = resultsHtml(r);
    }
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    run();
    return run;
  }

  // ---------- views ----------
  function setHeader(title, back) {
    $title.textContent = title;
    $back.hidden = !back;
    document.title = title === 'EnfCalc' ? 'EnfCalc — Calculadora de Enfermagem' : title + ' · EnfCalc';
    var pcrSt = store.get('pcr', null), pb = document.getElementById('pcr-btn');
    if (pb) pb.classList.toggle('on', !!(pcrSt && pcrSt.inicio && !pcrSt.fim));
    var hash = location.hash || '#/';
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      var rs = a.getAttribute('data-route').split(' ');
      a.classList.toggle('active', rs.some(function (r) { return r === '#/' ? (hash === '#/' || hash === '#' || hash === '#/sobre') : hash.indexOf(r) === 0; }));
    });
  }

  function card(href, icon, title, desc, favKey) {
    return '<a class="card" href="' + href + '"><span class="card-ic">' + icon + '</span><span class="card-t"><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></span>' +
      (favKey && isFav(favKey) ? '<span class="star">★</span>' : '') + '<span class="chev">›</span></a>';
  }

  // ---- Nomes comerciais e tipo (referência, genérico, similar...) ----
  var TIPO_NOME = { R: 'Referência', N: 'Novo', B: 'Biológico', E: 'Específico', S: 'Similar', F: 'Fitoterápico', O: 'Outro', G: 'Genérico' };
  var TIPO_ORD = ['R', 'N', 'B', 'E', 'S', 'F', 'O'];
  var TIPO_PLURAL = { N: 'Novos', B: 'Biológicos', E: 'Específicos', S: 'Similares', F: 'Fitoterápicos', O: 'Outros' };
  function nomesMarcas(ms) { return (ms || []).map(function (m) { return m[0]; }); }
  function marcasDe(id) { var m = CT.mercado(id); return (m ? nomesMarcas(m.marcas).concat(m.nomes).join(' ') : '') + ' ' + (R.BUSCA_ANVISA[id] || ''); }
  // Nome que corresponde ao que foi digitado (nome principal, nome comercial ou variação)
  function nomeBuscado(nome, marcas, nomes, t, words) {
    var cands = [{ n: nome, k: 'p' }].concat((marcas || []).map(function (m) { return { n: m[0], k: m[1] }; }), (nomes || []).map(function (n) { return { n: n, k: 'v' }; }));
    function sc(c) {
      var nn = norm(c.n);
      if (nn === t) return 0;
      if (nn.indexOf(t) === 0) return 1;
      if (words.every(function (w) { return nn.indexOf(w) >= 0; })) return 2;
      var d = parecido(nn, words); return d >= 0 ? 3 + d : 99;
    }
    var best = null, bs = 99;
    cands.forEach(function (c) {
      var v = sc(c);
      if (c.k === 'v' && c.n.indexOf('+') >= 0 && v > 0) return;   // variação de associação só se exata
      v += c.k === 'p' ? 0 : 0.1;
      if (v < bs || (v === bs && best && c.n.length < best.n.length)) { bs = v; best = c; }
    });
    if (!best || best.k === 'p' || bs >= 99) return null;
    return { n: best.n.charAt(0).toUpperCase() + best.n.slice(1), k: best.k };
  }
  function hrefAlias(id, al) { return '#/droga/' + id + (al ? '/' + encodeURIComponent(al.n) : ''); }
  function descAlias(al, classe) { return (al.k === 'v' ? 'Mesmo medicamento, outro nome' : TIPO_NOME[al.k] || 'Nome comercial') + ' · ' + classe; }
  // Cabeçalho quando a ficha é aberta por um nome comercial ou variação
  function aliasTopo(alias, nomePrincipal, mk) {
    if (!alias || norm(alias) === norm(nomePrincipal)) return '';
    var m = mk && mk.marcas.filter(function (x) { return norm(x[0]) === norm(alias); })[0];
    var tipo = m ? (TIPO_NOME[m[1]] || 'Nome comercial') : 'Outro nome';
    return '<div class="alias-box"><b>' + esc(alias) + '</b> <span class="tipo tipo-' + (m ? m[1] : 'O') + '">' + (m && m[1] === 'R' ? '⭐ ' : '') + esc(tipo) + '</span>' +
      '<br><small>Princípio ativo: <b>' + esc(nomePrincipal) + '</b> — as informações abaixo valem para ' + esc(alias) + '.</small></div>';
  }
  function outrosNomesHtml(mk) {
    return mk && mk.nomes && mk.nomes.length ? '<p class="marcas-linha">🔤 <b>Também chamado:</b> ' + esc(mk.nomes.join(' · ')) + '</p>' : '';
  }
  function marcasCurtas(ms, n) { return (ms || []).slice(0, n).map(function (m) { return m[0] + (m[1] === 'R' ? ' (ref.)' : ''); }).join(', '); }
  function marcasHtml(mk) {
    var grupos = TIPO_ORD.map(function (t) { return [t, mk.marcas.filter(function (m) { return m[1] === t; })]; }).filter(function (g) { return g[1].length; });
    return '<div class="marcas">' + grupos.map(function (g) {
      var nm = nomesMarcas(g[1]), lab = '<span class="tipo tipo-' + g[0] + '">' + (g[0] === 'R' ? '⭐ ' : '') + (g[1].length > 1 && g[0] !== 'R' ? TIPO_PLURAL[g[0]] : TIPO_NOME[g[0]]) + ' (' + nm.length + ')</span> ';
      return nm.length > 15 ? '<p>' + lab + esc(nm.slice(0, 15).join(', ')) + '</p><details class="mais"><summary>ver todos os ' + nm.length + '</summary><p>' + esc(nm.join(', ')) + '</p></details>'
        : '<p>' + lab + esc(nm.join(', ')) + '</p>';
    }).join('') + (mk.gen ? '<p><span class="tipo tipo-G">Genérico</span> ' + mk.gen + ' fabricante' + (mk.gen > 1 ? 's' : '') + ' (o nome na caixa é o do princípio ativo)</p>' : '') + '</div>';
  }
  function marcasLinha(mk) {
    if (!mk || (!mk.marcas.length && !mk.gen)) return outrosNomesHtml(mk);
    return '<p class="marcas-linha">🏷️ <b>Nomes comerciais' + (mk.marcas.length > 6 ? ' (' + mk.marcas.length + ')' : '') + ':</b> ' + esc(marcasCurtas(mk.marcas, 6) || '—') + (mk.marcas.length > 6 ? '… <button type="button" class="linklike" data-scroll="mercado">ver todos</button>' : '') + (mk.gen ? ' · <span class="tipo tipo-G">Genérico</span>' : '') + '</p>' + outrosNomesHtml(mk);
  }
  // Busca tolerante a erros de digitação (ex.: "sivastatina" → sinvastatina)
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var v = []; for (var j = 0; j <= b.length; j++) v[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var prev = v[0]; v[0] = i;
      for (var k = 1; k <= b.length; k++) { var tmp = v[k]; v[k] = Math.min(v[k] + 1, v[k - 1] + 1, prev + (a[i - 1] === b[k - 1] ? 0 : 1)); prev = tmp; }
    }
    return v[b.length];
  }
  // Distância total da busca ao texto (-1 = não parecido); menor = mais parecido
  function parecido(texto, words) {
    var toks = texto.split(/[^a-z0-9]+/), tot = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (texto.indexOf(w) >= 0) continue;
      if (w.length < 4) return -1;
      var lim = w.length >= 7 ? 2 : 1, best = 9;
      toks.forEach(function (t) {
        if (t.length < 3) return;
        var d = lev(w, t);
        if (t.length > w.length && w.length >= 5) d = Math.min(d, lev(w, t.slice(0, w.length)) + 0.5);
        if (d < best) best = d;
      });
      if (best > lim) return -1;
      tot += best;
    }
    return tot;
  }
  function aproximados(lista, txt, words, nomeDe) {
    return lista.map(function (x) { var d = parecido(txt(x), words); return [x, d < 0 ? d : d + (nomeDe && nomeDe(x).indexOf('+') >= 0 ? 0.3 : 0)]; }).filter(function (p) { return p[1] >= 0; })
      .sort(function (a, b) { return a[1] - b[1] || txt(a[0]).length - txt(b[0]).length; }).map(function (p) { return p[0]; });
  }
  function allEntries() {
    var e = [];
    e.push({ key: 'view:pcr', href: '#/pcr', icon: '🚨', title: 'Modo PCR', desc: 'Parada cardiorrespiratória: cronômetro e registro', search: 'pcr parada reanimacao rcp adrenalina choque' });
    e.push({ key: 'view:emergped', href: '#/emergencia-ped', icon: '👶', title: 'Emergência pediátrica', desc: 'Doses e materiais por peso/idade', search: 'pediatria pals crianca tubo canula desfibrilacao peso estimado' });
    e.push({ key: 'view:compat', href: '#/compatibilidade', icon: '🔗', title: 'Interações e compatibilidade', desc: 'Checar medicamentos juntos', search: 'interacao compatibilidade y incompatibilidade' });
    MOD.MODULOS.forEach(function (m) { e.push({ key: 'mod:' + m.id, href: '#/modulo/' + m.id, icon: m.icon, title: 'Módulo ' + m.nome, desc: m.desc, search: 'modulo area ' + m.nome + ' ' + m.desc }); });
    PR.PROTOCOLOS.forEach(function (p) { e.push({ key: 'prot:' + p.id, href: '#/protocolo/' + p.id, icon: '📑', title: p.nome, desc: 'Protocolo · ' + p.resumo, search: p.nome + ' ' + p.resumo + ' protocolo conduta' }); });
    e.push({ key: 'view:sri', href: '#/sri', icon: '🫁', title: 'Intubação — sequência rápida', desc: 'Doses por peso em mg e mL', search: 'intubacao sri iot etomidato cetamina rocuronio succinilcolina via aerea' });
    e.push({ key: 'view:hipo', href: '#/hipodermoclise', icon: '💧', title: 'Hipodermóclise', desc: 'Via subcutânea: hidratação e medicamentos', search: 'hipodermoclise subcutanea sc paliativo domiciliar' });
    Object.keys(CT.CLASSES).forEach(function (k) { e.push({ key: 'classe:' + k, href: '#/classe/' + k, icon: '🧭', title: CT.CLASSES[k], desc: 'Classe de medicamentos · ' + k, search: 'classe ' + CT.CLASSES[k] + ' ' + k }); });
    e.push({ key: 'view:classes', href: '#/classes', icon: '🧭', title: 'Classes de medicamentos', desc: 'Por sistema do corpo e classe terapêutica', search: 'classes classe terapeutica mecanismo atuacao farmacologica' });
    e.push({ key: 'view:scanner', href: '#/scanner', icon: '📷', title: 'Ler código de barras da caixa', desc: 'Identifica o medicamento pelo EAN', search: 'codigo de barras ean caixa camera scanner leitor' });
    e.push({ key: 'view:plantao', href: '#/plantao', icon: '🗓️', title: 'Agenda de medicações do plantão', desc: 'Horários por leito, checagem e lembretes', search: 'agenda aprazamento horarios checagem plantao lembrete' });
    e.push({ key: 'view:sbar', href: '#/sbar', icon: '📝', title: 'Passagem de plantão (SBAR)', desc: 'Com NEWS2 automático', search: 'passagem plantao sbar news2 handover' });
    e.push({ key: 'view:infusao', href: '#/infusao', icon: '🫀', title: 'Infusão contínua / DVA', desc: 'mcg/kg/min ↔ mL/h', search: 'droga vasoativa noradrenalina dobutamina sedacao bomba' });
    CALCS.forEach(function (c) { e.push({ key: 'calc:' + c.id, href: '#/calc/' + c.id, icon: c.icon, title: c.title, desc: c.desc, search: c.title + ' ' + c.desc }); });
    BX.EXTRAS.forEach(function (x) { var mk = CT.mercado(x.id); e.push({ id: x.id, marcas: mk ? mk.marcas : [], nomes: mk ? mk.nomes : [], key: 'droga:' + x.id, href: '#/droga/' + x.id, icon: '📄', title: x.nome, desc: x.classe + ' · ficha resumida', search: x.nome + ' ' + x.classe + ' ' + x.ind + ' bula ' + marcasDe(x.id) }); });
    CT.CAT.forEach(function (a) { var mc = marcasCurtas(a[9], 3); e.push({ id: a[0], marcas: a[9], nomes: a[13] || [], classe: a[4], key: 'droga:' + a[0], href: '#/droga/' + a[0], icon: '📚', title: a[1], desc: (mc ? '🏷️ ' + mc + ' · ' : '') + a[4] + ' · catálogo', search: a[1] + ' ' + a[2] + ' ' + a[4] + ' ' + nomesMarcas(a[9]).join(' ') + ' ' + (a[13] || []).join(' ') }); });
    D.DRUGS.forEach(function (d) { var bu = B.bula(d.id), mk = CT.mercado(d.id); e.push({ id: d.id, marcas: mk ? mk.marcas : [], nomes: (mk ? mk.nomes : []).concat(R.BUSCA_ANVISA[d.id] ? [R.BUSCA_ANVISA[d.id]] : []), key: 'droga:' + d.id, href: '#/droga/' + d.id, icon: '💊', title: d.nome, desc: d.classe, search: d.nome + ' ' + d.classe + ' diluicao bula ' + (bu ? bu.ind : '') + ' ' + marcasDe(d.id) }); });
    loadMaletas().forEach(function (m) { e.push({ key: 'maleta:' + m.id, href: '#/maleta/' + m.id, icon: m.icon, title: m.nome, desc: 'Maleta · ' + m.itens.length + ' medicamentos', search: m.nome + ' ' + m.local + ' maleta kit' }); });
    D.SCALES.forEach(function (s) { e.push({ key: 'escala:' + s.id, href: '#/escala/' + s.id, icon: '📋', title: s.nome, desc: s.desc, search: s.nome + ' ' + s.desc + ' escala' }); });
    return e;
  }

  function homeMaletas() {
    var ms = loadMaletas(), t = totalAlertas();
    return '<a class="kit-banner" href="#/maletas"><span class="kit-ic">🧰</span><span class="card-t"><b>Minhas maletas</b><small>' +
      (ms.length ? ms.length + ' maleta' + (ms.length > 1 ? 's' : '') + ' · ' + ms.map(function (m) { return esc(m.nome); }).join(', ') : 'Monte maletas com os medicamentos do seu local de trabalho') +
      '</small>' + (t.vencidos || t.vencendo ? '<span class="badges">' + badges(t) + '</span>' : '') + '</span><span class="chev">›</span></a>';
  }

  function addRecente(key) {
    var r = store.get('recentes', []).filter(function (k) { return k !== key; });
    r.unshift(key); store.set('recentes', r.slice(0, 8));
  }
  function homeRecentes(entries) {
    var r = store.get('recentes', []);
    var es = r.map(function (k) { return entries.filter(function (e) { return e.key === k; })[0]; }).filter(Boolean).slice(0, 6);
    if (!es.length) return '';
    return secT('Recentes') + '<div class="rec-row">' + es.map(function (e) { return '<a class="rec" href="' + e.href + '"><span>' + e.icon + '</span>' + esc(e.title) + '</a>'; }).join('') + '</div>';
  }
  function homePaciente() {
    var pf = P.perfil(loadPaciente());
    return '<a class="pac-home" href="#/maleta/lib/atender"><span class="pac-ic">👤</span><span class="card-t"><b>' + (pf.completo ? 'Paciente em atendimento' : 'Atender paciente') + '</b><small>' +
      (pf.completo ? esc(pacienteResumo(pf)) + ' · toque para doses e preparos' : 'Informe peso e idade e veja dose, diluição e alertas de qualquer medicamento') + '</small></span><span class="chev">›</span></a>';
  }

  // ---- Início: organizado por tarefa ----
  function saudacao() { var h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function qa(href, ic, t, cls) { return '<a class="qa-b ' + (cls || '') + '" href="' + href + '"><span class="qa-ic">' + ic + '</span>' + esc(t) + '</a>'; }
  function tileG(href, ic, t, d, cor) { return '<a class="tile" href="' + href + '" style="--c:' + cor + '"><span class="tile-ic">' + ic + '</span><b>' + esc(t) + '</b><small>' + esc(d) + '</small></a>'; }
  function secT(t, extra) { return '<div class="sec-t"><h2>' + esc(t) + '</h2>' + (extra || '') + '</div>'; }
  function painelTurno(semMaletas) {
    var pl = loadPlantao(), dia = hojeISO(), ds = dosesDoDia(pl, dia), r = resumoPlantao();
    var prox = ds.filter(function (d) { var s = statusDose(d, dia); return s === 'agora' || s === 'futuro'; })[0];
    var pf = P.perfil(loadPaciente()), t = totalAlertas(), ms = loadMaletas();
    var linhas = [];
    linhas.push('<a class="turno-l" href="#/plantao"><span class="turno-ic">🗓️</span><span class="card-t"><b>Agenda de medicações</b><small>' +
      (r.total ? (r.atrasado ? '<span class="txt-bad">⏰ ' + r.atrasado + ' atrasada' + (r.atrasado > 1 ? 's' : '') + '</span> · ' : '') + r.feito + ' de ' + r.total + ' checadas' +
        (prox ? ' · próxima ' + esc(prox.h) + ' — ' + esc(prox.it.med) + (prox.it.leito ? ' (leito ' + esc(prox.it.leito) + ')' : '') : '')
        : 'Cadastre horários por leito e receba alertas') + '</small></span><span class="chev">›</span></a>');
    linhas.push('<a class="turno-l" href="#/maleta/lib/atender"><span class="turno-ic">👤</span><span class="card-t"><b>' + (pf.completo ? 'Paciente em atendimento' : 'Atender paciente') + '</b><small>' +
      (pf.completo ? esc(pacienteResumo(pf)) : 'Peso e idade → dose, preparo e alertas') + '</small></span><span class="chev">›</span></a>');
    if (ms.length && !semMaletas) linhas.push('<a class="turno-l" href="#/maletas"><span class="turno-ic">🧰</span><span class="card-t"><b>Maletas</b><small>' + ms.length + ' maleta' + (ms.length > 1 ? 's' : '') + (t.vencidos || t.vencendo ? '' : ' · validade em dia') + '</small>' + (t.vencidos || t.vencendo ? '<span class="badges">' + badges(t) + '</span>' : '') + '</span><span class="chev">›</span></a>');
    return '<section class="turno">' + linhas.join('') + '</section>';
  }

  function viewHome() {
    setHeader('EnfCalc', false);
    var entries = allEntries();
    var f = favs();
    var favEntries = entries.filter(function (e) { return f.indexOf(e.key) >= 0; });
    var nDrog = (D.DRUGS.length + BX.EXTRAS.length + CT.total).toLocaleString('pt-BR');
    var hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    $app.innerHTML =
      '<section class="home-hero"><p class="hh-data">' + esc(hoje) + '</p><h2 class="hh-t">' + saudacao() + '! O que você precisa agora?</h2>' +
      '<div class="search"><input id="q" type="search" placeholder="Medicamento, nome comercial, cálculo ou escala…" autocomplete="off" aria-label="Buscar"></div></section>' +
      '<div id="search-res"></div>' +
      '<div id="home-main">' +
      '<div class="qa">' + qa('#/pcr', '🚨', 'PCR', 'qa-red') + qa('#/maleta/lib/atender', '👤', 'Atender') + qa('#/scanner', '📷', 'Ler caixa') + qa('#/infusao', '🫀', 'Infusão') + '</div>' +
      secT('Meu plantão', '<a class="sec-a" href="#/turno">Ver tudo ›</a>') + painelTurno() +
      secT('Consultar') +
      '<div class="tiles">' +
        tileG('#/drogas', '💊', 'Bulário', nDrog + ' medicamentos · ' + todasMarcas().length.toLocaleString('pt-BR') + ' nomes comerciais', '#0f766e') +
        tileG('#/calculadoras', '🧮', 'Cálculos', CALCS.length + 2 + ' calculadoras', '#2563eb') +
        tileG('#/protocolos', '📑', 'Protocolos', PR.PROTOCOLOS.length + ' condutas', '#7c3aed') +
        tileG('#/escalas', '📋', 'Escalas', D.SCALES.length + ' escalas clínicas', '#c2410c') +
      '</div>' +
      '<div class="pills">' +
        '<a class="pill" href="#/classes">🧭 Classes</a><a class="pill" href="#/emergencia">🚑 Emergência</a><a class="pill" href="#/compatibilidade">🔗 Interações</a>' +
        '<a class="pill" href="#/hipodermoclise">💧 Hipodermóclise</a><a class="pill" href="#/sbar">📝 Passagem SBAR</a><a class="pill" href="#/ferramentas">⚙️ Mais</a>' +
      '</div>' +
      secT('Por área de atuação') +
      '<div class="hscroll">' + MOD.MODULOS.map(function (m) {
        return '<a class="mod-c" href="#/modulo/' + m.id + '"><span class="mod-ic">' + m.icon + '</span><b>' + esc(m.nome) + '</b><small>' + esc(m.desc) + '</small></a>';
      }).join('') + '</div>' +
      homeRecentes(entries) +
      (favEntries.length ? secT('★ Favoritos') + '<div class="list">' + favEntries.map(function (e) { return card(e.href, e.icon, e.title, e.desc); }).join('') + '</div>' : '') +
      '<p class="disclaimer">Ferramenta de apoio. Confira sempre a prescrição, a bula e os protocolos da instituição. <a href="#/sobre">Sobre</a></p>' +
      '</div>';

    var q = document.getElementById('q'), res = document.getElementById('search-res'), main = document.getElementById('home-main');
    addVoz(q);
    q.addEventListener('input', function () {
      var t = norm(q.value.trim());
      if (!t) { res.innerHTML = ''; main.hidden = false; return; }
      main.hidden = true;
      var words = t.split(/\s+/);
      var hits = entries.filter(function (e) { var s = norm(e.search + ' ' + e.title); return words.every(function (w) { return s.indexOf(w) >= 0; }); });
      var relH = function (e) {
        var ns = [e.title].concat(nomesMarcas(e.marcas), e.nomes || []).map(norm);
        return (ns.some(function (n) { return n === t; }) ? 0 : ns.some(function (n) { return n.indexOf(t) === 0; }) ? 1 : 2) * 10 + (e.title.indexOf('+') >= 0 ? 5 : 0);
      };
      hits = hits.map(function (e, i) { return [e, relH(e), i]; }).sort(function (a, b) { return a[1] - b[1] || a[2] - b[2]; }).map(function (x) { return x[0]; });
      var aprox = false;
      if (!hits.length && t.length >= 4) { hits = aproximados(entries, function (e) { return norm(e.title + ' ' + e.search); }, words, function (e) { return e.title; }); aprox = hits.length > 0; }
      res.innerHTML = hits.length ? (aprox ? '<div class="alert info">Nenhum resultado exato para “' + esc(q.value.trim()) + '”. Você quis dizer:</div>' : '') + '<div class="list">' + hits.slice(0, 40).map(function (e) {
          var al = e.id ? nomeBuscado(e.title, e.marcas, e.nomes, t, words) : null;
          return al ? card(hrefAlias(e.id, al), al.k === 'v' ? '💊' : '🏷️', al.n, descAlias(al, e.classe || e.desc.replace(/^🏷️ [^·]*· /, ''))) : card(e.href, e.icon, e.title, e.desc);
        }).join('') + '</div>'
        : '<p class="empty-msg">Nada encontrado para “' + esc(q.value) + '”.</p>';
    });
  }

  // ---- Plantão: hub das ferramentas do turno ----
  function viewTurno() {
    setHeader('Plantão', false);
    $app.innerHTML = '<p class="lead">Tudo o que você usa durante o turno, em um lugar.</p>' + painelTurno(true) +
      secT('Ao lado do leito') + '<div class="list">' +
        card('#/scanner', '📷', 'Ler caixa do medicamento', 'Código de barras → ficha, nome comercial e tipo', 'view:scanner') +
        card('#/infusao', '🫀', 'Bomba de infusão / DVA', 'mcg/kg/min ↔ mL/h', 'view:infusao') +
        card('#/compatibilidade', '🔗', 'Interações e compatibilidade em Y', 'Checar 2 ou mais medicamentos', 'view:compat') + '</div>' +
      secT('Organização do turno') + '<div class="list">' +
        card('#/sbar', '📝', 'Passagem de plantão (SBAR)', 'Com NEWS2 e doses pendentes', 'view:sbar') +
        card('#/maletas', '🧰', 'Minhas maletas', 'Kits, validade e conferência') + '</div>' +
      secT('Avaliação rápida') + '<div class="list">' +
        ['news2', 'glasgow', 'braden', 'morse'].map(function (id) { var s = D.SCALES.filter(function (x) { return x.id === id; })[0]; return s ? card('#/escala/' + s.id, '📋', s.nome, s.desc, 'escala:' + s.id) : ''; }).join('') +
        card('#/escalas', '📋', 'Todas as escalas', D.SCALES.length + ' escalas clínicas') + '</div>';
  }

  // ---- Hub de emergência ----
  function viewEmergencia() {
    setHeader('Emergência', true);
    $app.innerHTML =
      '<a class="btn pcr-start" href="#/pcr">🚨 MODO PCR</a>' +
      '<h2>Suporte imediato</h2><div class="list">' +
        card('#/sri', '🫁', 'Intubação — sequência rápida', 'Indutores e bloqueadores em mg e mL + checklist', 'view:sri') +
        card('#/emergencia-ped', '👶', 'Emergência pediátrica', 'Doses, cânula e energia por idade/peso', 'view:emergped') +
        card('#/infusao', '🫀', 'Drogas vasoativas e sedação', 'mcg/kg/min ↔ mL/h', 'view:infusao') +
        card('#/maleta/lib/atender', '👤', 'Dose por paciente', 'Qualquer medicamento do bulário') + '</div>' +
      '<h2>Protocolos de emergência</h2><div class="list">' + ['sepse', 'anafilaxia', 'sca', 'avc', 'convulsao', 'hiperk', 'cad', 'intox'].map(function (id) {
        var p = PR.PROTOCOLOS.filter(function (x) { return x.id === id; })[0]; return card('#/protocolo/' + p.id, p.icon, p.nome, p.resumo, 'prot:' + p.id); }).join('') +
        card('#/protocolos', '📑', 'Todos os protocolos', PR.PROTOCOLOS.length + ' condutas') + '</div>' +
      '<h2>Avaliação rápida</h2><div class="list">' +
        ['glasgow', 'news2', 'qsofa', 'rass'].map(function (id) { var s = D.SCALES.filter(function (x) { return x.id === id; })[0]; return card('#/escala/' + s.id, '📋', s.nome, s.desc, 'escala:' + s.id); }).join('') + '</div>' +
      '<h2>Medicamentos de emergência</h2><div class="list">' +
        ['adrenalina', 'amiodarona', 'atropina', 'adenosina', 'naloxona', 'flumazenil', 'glicose-50', 'gluconato-calcio', 'bicarbonato'].map(function (id) {
          var d = D.DRUGS.filter(function (x) { return x.id === id; })[0]; return card('#/droga/' + d.id, '💊', d.nome, d.classe, 'droga:' + d.id);
        }).join('') + '</div>';
  }

  // ---- Ferramentas ----
  function viewFerramentas() {
    setHeader('Ferramentas', true);
    $app.innerHTML = '<div class="list">' +
      card('#/compatibilidade', '🔗', 'Interações e compatibilidade', 'Checar 2+ medicamentos ou uma maleta', 'view:compat') +
      card('#/hipodermoclise', '💧', 'Hipodermóclise', 'Hidratação e medicamentos por via SC', 'view:hipo') +
      card('#/revisao', '📚', 'Referências e revisão das fichas', 'Fontes, bulas Anvisa, ficha de conferência') +
      card('#/sobre', 'ℹ️', 'Sobre, backup e dados', 'Exportar/restaurar maletas, aviso legal') + '</div>';
  }

  function viewCalcList() {
    setHeader('Cálculos', false);
    var grupos = [{ id: 'g-infusao', icon: '💧', nome: 'Infusão' }].concat(CATS.filter(function (c) { return c.id !== 'infusao'; }).map(function (c) { return { id: 'g-' + c.id, icon: c.icon, nome: c.nome, cat: c.id }; }));
    $app.innerHTML =
      '<div class="chipnav" role="navigation" aria-label="Categorias">' + grupos.map(function (g) { return '<button type="button" class="chipnav-b" data-go="' + g.id + '">' + g.icon + ' ' + esc(g.nome.split(' ')[0]) + '</button>'; }).join('') + '</div>' +
      '<h2 id="g-infusao">💧 Infusão e gotejamento</h2><div class="list">' + card('#/infusao', '🫀', 'Infusão contínua / DVA', 'mcg/kg/min ↔ mL/h com predefinições', 'view:infusao') +
        card('#/hipodermoclise', '💧', 'Hipodermóclise', 'Vazão por sítio e medicamentos por via SC', 'view:hipo') +
        CALCS.filter(function (c) { return c.cat === 'infusao'; }).map(function (c) { return card('#/calc/' + c.id, c.icon, c.title, c.desc, 'calc:' + c.id); }).join('') + '</div>' +
      grupos.slice(1).map(function (g) {
        return '<h2 id="' + g.id + '">' + g.icon + ' ' + esc(g.nome) + '</h2><div class="list">' +
          CALCS.filter(function (c) { return c.cat === g.cat; }).map(function (c) { return card('#/calc/' + c.id, c.icon, c.title, c.desc, 'calc:' + c.id); }).join('') + '</div>';
      }).join('');
    $app.insertAdjacentHTML('beforeend', '<h2 id="g-escalas">📋 Escalas</h2><div class="list">' + D.SCALES.map(function (s) { return card('#/escala/' + s.id, '📋', s.nome, s.desc, 'escala:' + s.id); }).join('') + '</div>');
    var nav = $app.querySelector('.chipnav'); if (nav) nav.insertAdjacentHTML('beforeend', '<button type="button" class="chipnav-b" data-go="g-escalas">📋 Escalas</button>');
    $app.querySelectorAll('[data-go]').forEach(function (b) {
      b.onclick = function () { var el = document.getElementById(b.getAttribute('data-go')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    });
  }

  // ---- Bulário ----
  // Todos os nomes comerciais como itens da lista (uma entrada por nome + princípio ativo)
  var MARCAS_CACHE = null;
  function todasMarcas() {
    if (MARCAS_CACHE) return MARCAS_CACHE;
    var vistos = {}, out = [];
    function add(id, princ, cat, ms) {
      (ms || []).forEach(function (m) {
        var k = norm(m[0]) + '|' + id; if (vistos[k]) return; vistos[k] = 1;
        out.push({ id: id, nome: m[0], tm: m[1], princ: princ, classe: princ, cat: cat, txt: princ, tipo: 'marca', hv: false, marcas: [] });
      });
    }
    D.DRUGS.forEach(function (d) { var mk = CT.mercado(d.id), bu = B.bula(d.id); if (mk) add(d.id, d.nome, bu && bu.cat, mk.marcas); });
    BX.EXTRAS.forEach(function (x) { var mk = CT.mercado(x.id); if (mk) add(x.id, x.nome, x.cat, mk.marcas); });
    CT.CAT.forEach(function (a) { add(a[0], a[1], a[3], a[9]); });
    MARCAS_CACHE = out;
    return out;
  }
  function viewDrugs() {
    setHeader('Bulário', false);
    var filtro = store.get('bulCat', ''), tipoF = store.get('bulTipo', ''), letraSel = store.get('bulLetra', '');
    var todos = D.DRUGS.map(function (d) { var bu = B.bula(d.id), mk = CT.mercado(d.id); return { id: d.id, nome: d.nome, classe: d.classe, cat: bu && bu.cat, txt: (bu ? bu.ind : '') + ' ' + marcasDe(d.id), marcas: mk ? mk.marcas : [], nomes: (mk ? mk.nomes : []).concat(R.BUSCA_ANVISA[d.id] ? [R.BUSCA_ANVISA[d.id]] : []), hv: isHV(d), tipo: 'completa' }; })
      .concat(BX.EXTRAS.map(function (x) { var mk = CT.mercado(x.id); return { id: x.id, nome: x.nome, classe: x.classe, cat: x.cat, txt: x.ind + ' ' + x.via + ' ' + marcasDe(x.id), marcas: mk ? mk.marcas : [], nomes: mk ? mk.nomes : [], hv: !!x.hv || /ALTA VIGILÂNCIA/.test(x.classe), tipo: 'resumo' }; }))
      .concat(CT.CAT.map(function (a) { var c = CT.item(a); return { id: c.id, nome: c.nome, classe: c.classe, cat: c.cat, txt: c.comp + ' ' + nomesMarcas(c.marcas).join(' ') + ' ' + c.nomes.join(' '), marcas: c.marcas, nomes: c.nomes, hv: false, tipo: 'catalogo', origem: c.origem }; }))
      .concat(todasMarcas())
      .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
    todos.forEach(function (d) { d.busca = norm(d.nome + ' ' + d.classe + ' ' + d.txt); });
    var nTipo = {}; todos.forEach(function (d) { nTipo[d.tipo] = (nTipo[d.tipo] || 0) + 1; });
    $app.innerHTML = '<div class="search"><input id="dq" type="search" placeholder="Buscar por nome ou classe…" autocomplete="off" aria-label="Buscar medicamento"></div>' +
      '<div class="duo"><a class="duo-b" href="#/classes"><span>🧭</span><b>Por classe</b><small>mecanismo e atuação</small></a><a class="duo-b" href="#/scanner"><span>📷</span><b>Ler caixa</b><small>código de barras</small></a></div>' +
      '<label class="filtro-area">Área <select id="dcat" aria-label="Filtrar por área"><option value="">Todas as áreas</option>' +
        B.CATEGORIAS.map(function (c) { return '<option value="' + c.id + '">' + c.icon + ' ' + esc(c.nome) + '</option>'; }).join('') + '</select></label>' +
      '<div class="chipnav" id="dtipo" role="radiogroup" aria-label="Tipo de ficha">' + [['', 'Princípios ativos'], ['completa', '💊 Com preparo'], ['resumo', '📄 Resumidas'], ['catalogo', '📚 Catálogo'], ['marca', '🏷️ Nomes comerciais']].map(function (o) {
        return '<button type="button" class="chipnav-b' + (o[0] === tipoF ? ' on' : '') + '" data-tipo="' + o[0] + '">' + o[1] + (o[0] ? ' (' + (nTipo[o[0]] || 0).toLocaleString('pt-BR') + ')' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="az" id="daz"></div><div id="dl"></div>' +
      '<p class="disclaimer">' + (D.DRUGS.length + BX.EXTRAS.length + CT.total).toLocaleString('pt-BR') + ' medicamentos: ' + D.DRUGS.length + ' com preparo e dose, ' + BX.EXTRAS.length + ' em ficha resumida e ' + CT.total.toLocaleString('pt-BR') + ' no catálogo oficial (CMED e registros da Anvisa), com ' + (nTipo.marca || 0).toLocaleString('pt-BR') + ' nomes comerciais · resumo de referência, não substitui a bula do fabricante. <a href="#/revisao">Fontes e revisão</a> · <a href="#/conferencia">Conferência das fichas</a></p>';
    var dl = document.getElementById('dl'), dq = document.getElementById('dq');
    addVoz(dq);
    function render() {
      var t = norm(dq.value.trim());
      document.getElementById('dcat').value = filtro;
      var words = t ? t.split(/\s+/) : [];
      var list = todos.filter(function (d) {
        if (d.tipo === 'marca' && tipoF !== 'marca') return false;   // nomes comerciais: filtro próprio (na busca, já aparecem pelo nome digitado)
        return (!filtro || d.cat === filtro) && (!tipoF || d.tipo === tipoF) && words.every(function (w) { return d.busca.indexOf(w) >= 0; });
      });
      var aprox = false;
      if (!list.length && t.length >= 4) {
        list = aproximados(todos.filter(function (d) { return (!filtro || d.cat === filtro) && (!tipoF || d.tipo === tipoF); }), function (d) { return norm(d.nome + ' ' + nomesMarcas(d.marcas).join(' ') + ' ' + (d.nomes || []).join(' ')); }, words, function (d) { return d.nome; });
        aprox = list.length > 0;
      }
      var porLetra = {};
      list.forEach(function (d) { var l = norm(d.nome).charAt(0).toUpperCase(); if (!/[A-Z]/.test(l)) l = '#'; (porLetra[l] = porLetra[l] || []).push(d); });
      var letras = Object.keys(porLetra).sort(function (a, b) { return (a === '#') - (b === '#') || a.localeCompare(b); });
      if (aprox) {
        document.getElementById('daz').innerHTML = '';
        dl.innerHTML = '<div class="alert info">Nenhum resultado exato para “' + esc(dq.value.trim()) + '”. Você quis dizer:</div><div class="list">' + list.slice(0, 30).map(linha).join('') + '</div>';
        return;
      }
      if (t) {   // busca: lista única ordenada por relevância (nome exato, começa com, isolado antes de associação)
        var rel = function (d) {
          var nomes = [d.nome].concat(nomesMarcas(d.marcas), d.nomes || []).map(norm);
          var r = nomes.some(function (n) { return n === t; }) ? 0 : nomes.some(function (n) { return n.indexOf(t) === 0; }) ? 1 : 2;
          return r * 10 + (d.nome.indexOf('+') >= 0 ? 5 : 0);
        };
        list = list.map(function (d) { return [d, rel(d)]; }).sort(function (a, b) { return a[1] - b[1] || a[0].nome.length - b[0].nome.length; }).map(function (x) { return x[0]; });
        document.getElementById('daz').innerHTML = '';
        dl.innerHTML = '<p class="note">' + list.length.toLocaleString('pt-BR') + ' resultado' + (list.length > 1 ? 's' : '') + '</p><div class="list">' + list.slice(0, 300).map(linha).join('') + '</div>' +
          (list.length > 300 ? '<p class="note">Mostrando os 300 mais relevantes. Refine a busca.</p>' : '');
        return;
      }
      var paginar = !t && list.length > 250;   // lista grande: mostra uma letra por vez
      if (paginar && letras.indexOf(letraSel) < 0) letraSel = letras[0];
      document.getElementById('daz').innerHTML = letras.length > 3 ? letras.map(function (l) { return '<button type="button" data-l="' + l + '"' + (paginar && l === letraSel ? ' class="on"' : '') + '>' + l + '</button>'; }).join('') : '';
      var mostrar = paginar ? [letraSel] : letras, limite = 300, n = 0;
      function linha(d) {
        if (d.tipo === 'marca') return card(hrefAlias(d.id, { n: d.nome }), d.tm === 'R' ? '⭐' : '🏷️', d.nome, (TIPO_NOME[d.tm] || 'Nome comercial') + ' · ' + d.princ, 'droga:' + d.id);
        var al = t ? nomeBuscado(d.nome, d.marcas, d.nomes, t, words) : null;
        if (al) return card(hrefAlias(d.id, al), d.hv ? '🔴' : al.k === 'v' ? '💊' : '🏷️', al.n, descAlias(al, d.classe), 'droga:' + d.id);
        var cat = B.CATEGORIAS.filter(function (c) { return c.id === d.cat; })[0];
        var mc = marcasCurtas(d.marcas, 3), achou = '';
        if (words.length && !words.every(function (w) { return norm(d.nome).indexOf(w) >= 0; })) {
          var alt = nomesMarcas(d.marcas).concat(d.nomes || []).filter(function (n) { var nn = norm(n); return words.every(function (w) { return nn.indexOf(w) >= 0; }); })[0];
          if (alt) achou = '🔎 ' + alt + ' · ';
        }
        var desc = achou + (mc ? '🏷️ ' + mc + ' · ' : '') + d.classe + (d.tipo === 'catalogo' ? (d.origem === 2 ? ' · registro Anvisa' : ' · catálogo') : d.tipo === 'resumo' ? ' · ficha resumida' : '');
        return card('#/droga/' + d.id, d.hv ? '🔴' : d.tipo === 'catalogo' ? '📚' : (cat ? cat.icon : '💊'), d.nome, desc, 'droga:' + d.id);
      }
      dl.innerHTML = (aprox ? '<div class="alert info">Nenhum resultado exato para “' + esc(dq.value.trim()) + '”. Você quis dizer:</div>' : '') +
        (list.length ? '<p class="note">' + list.length.toLocaleString('pt-BR') + ' resultado' + (list.length > 1 ? 's' : '') + (paginar ? ' · letra ' + letraSel : '') + '</p>' : '') +
        (list.length ? mostrar.map(function (l) {
          if (n >= limite) return '';
          var itens = porLetra[l].slice(0, limite - n); n += itens.length;
          return '<h3 class="az-h" id="az-' + l + '">' + l + '</h3><div class="list">' + itens.map(linha).join('') + '</div>';
        }).join('') + (n < list.length && !paginar ? '<p class="note">Mostrando os primeiros ' + limite + '. Refine a busca para ver mais.</p>' : '') : '<p class="empty-msg">Nenhum medicamento encontrado.</p>');
      document.querySelectorAll('#daz [data-l]').forEach(function (b) {
        b.onclick = function () {
          var l = b.getAttribute('data-l');
          if (paginar) { letraSel = l; store.set('bulLetra', l); render(); window.scrollTo(0, 0); return; }
          var el = document.getElementById('az-' + l); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      });
    }
    document.getElementById('dcat').onchange = function () { filtro = this.value; store.set('bulCat', filtro); render(); };
    document.querySelectorAll('#dtipo [data-tipo]').forEach(function (b) { b.onclick = function () { tipoF = b.getAttribute('data-tipo'); store.set('bulTipo', tipoF); document.querySelectorAll('#dtipo [data-tipo]').forEach(function (x) { x.classList.toggle('on', x === b); }); render(); }; });
    dq.addEventListener('input', render);
    render();
  }

  // ---- Catálogo de mercado (CMED/Anvisa) ----
  function anvisaBusca(t) { return 'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=' + encodeURIComponent(t); }
  function mercadoHtml(mk, titulo) {
    if (!mk) return '';
    return '<div class="sec" id="mercado"><h3>🏷️ ' + (titulo || 'No mercado brasileiro') + '</h3>' +
      '<p class="badges"><span class="badge ' + (mk.tarja >= 3 ? 'bad' : mk.tarja === 2 ? 'warn' : 'info') + '">' + esc(CT.tarjaTxt(mk.tarja)) + '</span>' +
      (mk.hosp ? '<span class="badge">🏥 Uso hospitalar</span>' : '') + (mk.gen ? '<span class="badge ok">Genérico disponível</span>' : '<span class="badge">Sem genérico na lista</span>') +
      '<span class="badge">' + mk.labs + ' fabricante' + (mk.labs > 1 ? 's' : '') + '</span></p>' +
      (mk.tmax > mk.tarja ? '<p class="note">⚠️ Algumas apresentações têm tarja mais restritiva: ' + esc(CT.tarjaTxt(mk.tmax)) + '.</p>' : '') +
      ((mk.marcas.length || mk.gen) ? '<p><b>Nomes comerciais e tipo:</b></p>' + marcasHtml(mk) : '') +
      (mk.ap.length ? '<p><b>Apresentações:</b></p><ul class="fontes">' + mk.ap.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="note">Fonte: ' + esc(mk.origem === 2 ? CT.FONTE_REG.nome : CT.FONTE.nome) + ', ' + esc(fmtData(mk.origem === 2 ? CT.FONTE_REG.data : CT.FONTE.data)) + '. Confira o rótulo do produto em mãos.</p></div>';
  }
  // Apresentações líquidas do catálogo → [{rot, qtd, u, vol}] para calcular o volume a aspirar
  function apsCatalogo(lista) {
    var out = [], vistos = {};
    (lista || []).forEach(function (a) {
      if (/OFT|colírio|creme|pomada|gel|spray|nasal|inal|aerossol|capilar|tópic|vaginal|otológ|xampu|loção|DERM/i.test(a)) return;
      var m = a.match(/^\s*(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|UI|mEq)\s*\/\s*(\d+(?:[.,]\d+)?)?\s*mL\b/i);
      if (!m || /\+/.test(a.split(' ')[0])) return;
      var u = m[2].toLowerCase() === 'ui' ? 'UI' : m[2].toLowerCase() === 'meq' ? 'mEq' : m[2].toLowerCase();
      if (!C.UNITS[u]) return;
      var conc = num(m[1]) / (m[3] ? num(m[3]) : 1);
      var v = a.match(/—\s*(?:ampola|frasco-ampola|frasco|seringa|bolsa|caneta)\s+(\d+(?:[.,]\d+)?)\s*mL/i);
      var vol = v ? num(v[1]) : 1;
      if (!(conc > 0) || !(vol > 0)) return;
      var k = u + conc + '/' + vol;
      if (vistos[k]) return; vistos[k] = 1;
      out.push({ rot: a.replace(/\s+\(hosp\.\)$/, '') + (v ? '' : ' (por mL)'), qtd: +(conc * vol).toPrecision(10), u: u, vol: vol, porMl: !v });
    });
    out = out.filter(function (x) { return !x.porMl || !out.some(function (y) { return !y.porMl && y.u === x.u && Math.abs(y.qtd / y.vol - x.qtd) < 1e-9; }); });
    return out.slice(0, 10);
  }

  // ---- Ficha de medicamento: cabeçalho (hero) + abas comuns ----
  var PF = window.Perfis || { perfil: function () { return null; } };
  function heroDroga(o) {
    var mk = o.mk, temClasse = !!(o.cc || o.classe), k = temClasse ? chaveClasse(o.cc, o.cc ? '' : o.classe) : '';
    var usaAlias = o.alias && norm(o.alias) !== norm(o.nome);
    var m = usaAlias && mk && mk.marcas.filter(function (x) { return norm(x[0]) === norm(o.alias); })[0];
    var bs = [];
    if (o.hv) bs.push('<span class="badge bad">🔴 Alta vigilância</span>');
    if (mk) {
      bs.push('<span class="badge ' + (mk.tarja >= 3 ? 'bad' : mk.tarja === 2 ? 'warn' : 'info') + '">' + esc(CT.tarjaTxt(mk.tarja)) + '</span>');
      if (mk.hosp) bs.push('<span class="badge">🏥 Hospitalar</span>');
      if (mk.gen) bs.push('<span class="badge ok">Genérico disponível</span>');
    }
    if (o.via) bs.push('<span class="badge">Via ' + esc(o.via) + '</span>');
    bs.push('<span class="badge ficha">' + esc(o.tipoFicha) + '</span>');
    return '<section class="hero">' +
      '<div class="hero-top"><span class="hero-ic">' + (o.icon || '💊') + '</span><div class="hero-t"><h2 class="hero-n">' + esc(usaAlias ? o.alias : o.nome) + '</h2>' +
        (usaAlias ? '<div class="alias-box hero-sub"><span class="tipo tipo-' + (m ? m[1] : 'O') + '">' + (m && m[1] === 'R' ? '⭐ ' : '') + esc(m ? (TIPO_NOME[m[1]] || 'Nome comercial') : 'Outro nome') + '</span> Princípio ativo: <b>' + esc(o.nome) + '</b></div>' : '') +
        (temClasse ? '<a class="hero-classe" href="#/classe/' + encodeURIComponent(k) + '">' + esc(o.cc ? nomeClasse(k) : o.classe) + ' ›</a>' : '') +
      '</div>' + favButton(o.fav) + '</div>' +
      '<div class="badges">' + bs.join('') + '</div>' + marcasLinha(mk) + '</section>';
  }
  function perfilHtml(cc) {
    var p = cc && PF.perfil(cc);
    if (!p) return '';
    return '<div class="sec perfil"><h3>🧭 Sobre a classe</h3>' +
      '<div class="pf-it"><span>⚙️</span><p><b>Como atua</b>' + esc(p.mec) + '</p></div>' +
      '<div class="pf-it"><span>🤕</span><p><b>Efeitos adversos comuns</b>' + esc(p.ae) + '</p></div>' +
      '<div class="pf-it"><span>🩺</span><p><b>Cuidados de enfermagem</b>' + esc(p.enf) + '</p></div>' +
      '<div class="pf-it pf-al"><span>⚠️</span><p><b>Alertas da classe</b>' + esc(p.alerta) + '</p></div>' +
      '<p class="note">Perfil geral da classe. Cada medicamento pode ter particularidades: confira a bula.</p></div>';
  }
  function comoAtuaHtml(cc) {
    var p = cc && PF.perfil(cc);
    return p ? '<div class="sec"><h3>⚙️ Como atua</h3><p>' + esc(p.mec) + ' <button type="button" class="linklike" data-ir-aba="classe">Ver perfil da classe ›</button></p></div>' : '';
  }
  function classeAbaHtml(cc, classe, idAtual) {
    if (!cc && !classe) return '<p class="empty-msg">Classe terapêutica não informada.</p>';
    var k = chaveClasse(cc, cc ? '' : classe), irm = (indiceClasses()[k] || []).filter(function (i) { return i.id !== idAtual; });
    return (perfilHtml(cc) || '<div class="sec"><h3>🧭 ' + esc(nomeClasse(k)) + '</h3><p class="note">O perfil desta classe ainda não foi escrito. Veja abaixo os outros medicamentos com a mesma atuação.</p></div>') +
      (irm.length ? '<h3 class="sub-h">💊 Na mesma classe (' + irm.length + ')</h3><div class="list">' + irm.slice(0, 8).map(function (i) {
        var mc = marcasCurtas(i.marcas, 2);
        return card('#/droga/' + i.id, i.ic, i.nome, mc ? '🏷️ ' + mc : (i.ord === 2 ? 'catálogo' : 'ficha'));
      }).join('') + '</div>' + (irm.length > 8 ? '<div class="ref-btns"><a class="btn sm ghost" href="#/classe/' + encodeURIComponent(k) + '">Ver todos os ' + irm.length + ' ›</a></div>' : '') : '');
  }
  // abas: [[id, rótulo, html]] — devolve o HTML; ligarAbas() ativa depois de inserir no DOM
  function abasHtml(abas) {
    return '<div class="tabs" role="tablist">' + abas.map(function (a) {
      return '<button type="button" role="tab" class="tab" id="tab-' + a[0] + '" aria-controls="pane-' + a[0] + '" data-tab="' + a[0] + '">' + a[1] + '</button>';
    }).join('') + '</div>' + abas.map(function (a) { return '<div class="pane" role="tabpanel" id="pane-' + a[0] + '">' + a[2] + '</div>'; }).join('');
  }
  function ligarAbas(abas, chave, padrao) {
    var ids = abas.map(function (a) { return a[0]; });
    var aba = chave ? store.get(chave, padrao) : padrao;
    if (ids.indexOf(aba) < 0) aba = padrao;
    function mostrar(t, rolar) {
      if (chave) store.set(chave, t);
      ids.forEach(function (id) {
        var on = id === t, b = document.getElementById('tab-' + id);
        b.setAttribute('aria-selected', on);
        document.getElementById('pane-' + id).hidden = !on;
        if (on && b.scrollIntoView && rolar) b.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
      if (rolar) { var tb = $app.querySelector('.tabs'); if (tb && tb.getBoundingClientRect().top < 0) tb.scrollIntoView({ block: 'start' }); }
    }
    $app.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { mostrar(b.getAttribute('data-tab'), true); }; });
    $app.querySelectorAll('[data-ir-aba]').forEach(function (b) { b.onclick = function () { mostrar(b.getAttribute('data-ir-aba'), true); window.scrollTo(0, 0); }; });
    mostrar(aba, false);
  }

  function viewCatalogo(c, alias) {
    setHeader(alias || c.nome, true);
    var apsCat = apsCatalogo(c.ap);
    var cat = B.CATEGORIAS.filter(function (x) { return x.id === c.cat; })[0];
    var termo = (c.comp || c.nome).split(' + ')[0].replace(/\s—.*$/, '');
    var resumo = '<div class="alert info">📚 Ficha de catálogo com dados oficiais de mercado. <b>Não traz posologia</b>: consulte a bula e a prescrição.</div>' +
      (c.origem === 1 ? '<div class="alert warn">Consta na lista de preços da CMED, mas sem comercialização informada em 2025 — pode estar em falta no mercado.</div>' : '') +
      (c.origem === 2 ? '<div class="alert warn">Registro ativo na Anvisa, sem preço na lista da CMED (comum em soros, vacinas, fitoterápicos, gases e produtos hospitalares). Apresentações e tarja: ver bula.</div>' : '') +
      (c.comp ? '<div class="sec"><h3>🧪 Composição</h3><p>' + esc(c.comp) + '</p></div>' : '') +
      (cat ? '<div class="sec"><h3>' + cat.icon + ' Área</h3><p>' + esc(cat.nome) + '</p></div>' : '') +
      comoAtuaHtml(c.cc) +
      '<div class="ref-btns"><a class="btn sm" target="_blank" rel="noopener" href="' + esc(anvisaBusca((c.marcas[0] && c.marcas[0][0]) || termo)) + '">📄 Bula no Bulário da Anvisa</a></div>';
    var calc = apsCat.length ? '<p class="lead">Selecione a apresentação e informe a dose prescrita.</p><form class="form" id="dform" onsubmit="return false"></form><div id="dout" aria-live="polite"></div>'
      : '<div class="sec"><h3>💉 Sem apresentação líquida na lista</h3><p>Use a regra de três com a concentração do produto em mãos.</p></div><div class="ref-btns"><a class="btn sm" href="#/calc/dose/' + esc(c.id) + '">💉 Calcular dose (regra de três)</a></div>';
    var abas = [['resumo', '📋 Resumo', resumo], ['calcular', '💉 Calcular', calc], ['classe', '🧭 Classe', classeAbaHtml(c.cc, c.classe, c.id)],
      ['mercado', '🏷️ Mercado', mercadoHtml(c)],
      ['fontes', '📚 Fontes', '<div class="ref-btns"><a class="btn sm" target="_blank" rel="noopener" href="' + esc(anvisaBusca((c.marcas[0] && c.marcas[0][0]) || termo)) + '">📄 Bulário eletrônico da Anvisa</a>' + msdLinkHtml(termo) + '</div>' +
        '<p class="note">Catálogo gerado a partir da ' + esc(CT.FONTE.nome) + ' e do registro da Anvisa (dados públicos). Classe terapêutica, tarja e apresentações conforme as listas oficiais.</p>']];
    $app.innerHTML = heroDroga({ nome: c.nome, alias: alias, cc: c.cc, classe: c.classe, mk: c, fav: 'droga:' + c.id, icon: cat ? cat.icon : '📚', tipoFicha: 'Catálogo oficial' }) + abasHtml(abas);
    if (apsCat.length) bindDrugCalc({ conc: apsCat[0], aps: apsCat, semAviso: apsCat[0].porMl });
    ligarAbas(abas, null, 'resumo');
  }

  // Interações de um medicamento com toda a biblioteca (aba Bula)
  function interacoesBiblioteca(id) {
    var out = [];
    DB.INTERACOES.forEach(function (r) {
      var parc = [];
      if (r.a.indexOf(id) >= 0) r.b.forEach(function (x) { if (x !== id && parc.indexOf(x) < 0) parc.push(x); });
      if (r.b.indexOf(id) >= 0) r.a.forEach(function (x) { if (x !== id && parc.indexOf(x) < 0) parc.push(x); });
      if (parc.length) out.push({ sev: r.sev, tipo: r.tipo, txt: r.txt, com: parc });
    });
    return out.sort(function (a, b) { return (a.sev === 'grave' ? 0 : 1) - (b.sev === 'grave' ? 0 : 1); });
  }

  function viewExtra(x, alias) {
    setHeader(alias || x.nome, true);
    var cat = B.CATEGORIAS.filter(function (c) { return c.id === x.cat; })[0], mk = CT.mercado(x.id), cc = mk ? mk.cc : '';
    var aps = (x.ap || []).map(function (a) { return { rot: a[0], qtd: a[1], u: a[2], vol: a[3] }; });
    if (!aps.length && mk) aps = apsCatalogo(mk.ap);
    function li(t, v) { return v ? '<div class="sec"><h3>' + t + '</h3><p>' + esc(v) + '</p></div>' : ''; }
    var conf = BX.CONFERENCIA[x.id];
    var resumo = (x.hv ? '<div class="alert bad">🔴 Medicamento de alta vigilância: dupla checagem obrigatória.</div>' : '') +
      (BX.DOSE[x.id] ? '<div class="sec destaque"><h3>💊 Posologia usual (adulto)</h3><p>' + esc(BX.DOSE[x.id]) + '</p>' +
        (conf ? '<p class="conf-mini"><span class="badge ' + (CONF_ST[conf.st] || CONF_ST['sem-fonte'])[0] + '">' + (CONF_ST[conf.st] || CONF_ST['sem-fonte'])[1] + '</span> · <button type="button" class="linklike" data-ir-aba="fontes">ver fontes</button></p>' : '') + '</div>' : '') +
      li('🎯 Indicações', x.ind) + li('📦 Apresentações usuais', x.apres) + li('🩺 Cuidados de enfermagem', x.enf) +
      (x.alerta ? '<div class="sec alerta-sec"><h3>⚠️ Atenção</h3><p>' + esc(x.alerta) + '</p></div>' : '') +
      comoAtuaHtml(cc) + protRelHtml(x.id) +
      '<p class="note">📄 Ficha resumida, sem cálculo de dose por paciente. Resumo elaborado para o EnfCalc; não reproduz nem substitui a bula do fabricante.</p>';
    var calc = aps.length ? '<p class="lead">Selecione a apresentação e informe a dose prescrita para saber quanto aspirar.</p><form class="form" id="dform" onsubmit="return false"></form><div id="dout" aria-live="polite"></div>'
      : '<div class="sec"><h3>💉 Sem apresentação líquida cadastrada</h3><p>Use a regra de três com a concentração do produto em mãos.</p></div><div class="ref-btns"><a class="btn sm" href="#/calc/dose/' + esc(x.id) + '">💉 Calcular dose (regra de três)</a></div>';
    var abas = [['resumo', '📋 Resumo', resumo], ['calcular', '💉 Calcular', calc], ['classe', '🧭 Classe', classeAbaHtml(cc, cc ? '' : x.classe, x.id)]];
    if (mk) abas.push(['mercado', '🏷️ Mercado', mercadoHtml(mk)]);
    abas.push(['fontes', '📚 Fontes', confHtml(x.id) + '<div class="ref-btns">' + msdLinkHtml(x.nome) + '</div>' + refsHtml({ id: x.id, nome: x.nome, classe: x.classe })]);
    $app.innerHTML = heroDroga({ nome: x.nome, alias: alias, cc: cc, classe: x.classe, mk: mk, fav: 'droga:' + x.id, hv: x.hv, via: x.via, icon: cat ? cat.icon : '📄', tipoFicha: 'Ficha resumida' }) + abasHtml(abas);
    if (aps.length) bindDrugCalc({ conc: { qtd: aps[0].qtd, u: aps[0].u, vol: aps[0].vol }, aps: aps, semAviso: aps[0].porMl });
    ligarAbas(abas, null, 'resumo');
  }

  function viewDrug(id, alias) {
    var d = D.DRUGS.filter(function (x) { return x.id === id; })[0];
    if (!d) {
      var ex = BX.EXTRAS.filter(function (x) { return x.id === id; })[0];
      if (ex) return viewExtra(ex, alias);
      var ca = CT.CAT.filter(function (a) { return a[0] === id; })[0];
      return ca ? viewCatalogo(CT.item(ca), alias) : viewNotFound();
    }
    setHeader(alias || d.nome, true);
    var bu = B.bula(id), cat = B.categoria(id);
    var mkD = CT.mercado(id), ccD = mkD ? mkD.cc : '';
    function li(t, v) { return v ? '<div class="sec"><h3>' + t + '</h3><p>' + esc(v) + '</p></div>' : ''; }
    var ints = interacoesBiblioteca(id);
    var ant = DB.ANTIDOTOS[id], rev = Object.keys(DB.ANTIDOTOS).filter(function (k) { return DB.ANTIDOTOS[k] === id; });
    var ms = loadMaletas(), pf = P.perfil(loadPaciente());
    var bulaHtml = bu ? (
        li('🎯 Indicações', bu.ind) + li('⛔ Contraindicações', bu.contra) + li('⚠️ Efeitos adversos principais', bu.adv) +
        li('🩺 Cuidados de enfermagem', bu.enf) + li('🤰 Gestação e lactação', bu.gest) +
        (DB.VIA_EXCLUSIVA[id] ? li('🚫 Via exclusiva', DB.VIA_EXCLUSIVA[id]) : '') +
        (B.HIPO[id] ? '<div class="sec"><h3>💧 Hipodermóclise (via SC)</h3><p>' + (B.HIPO[id].st === 'sim' ? '✅ ' : B.HIPO[id].st === 'nao' ? '⛔ ' : '⚠️ ') + esc(B.HIPO[id].txt) + ' <a href="#/hipodermoclise">Ver guia</a></p></div>' : '') +
        (ant ? li('🛟 Antídoto / reversor', typeof ant === 'string' ? NOMES[ant] : ant.nome) : '') +
        (rev.length ? li('🛟 É antídoto de', rev.map(nm).join(', ')) : '') +
        '<h3 class="sub-h">🔗 Interações e incompatibilidades</h3>' +
        (ints.length ? ints.map(function (i) {
          return '<div class="int-item ' + sevClass(i.sev) + '"><b>' + sevIcon(i.sev) + ' ' + esc(i.tipo) + '</b> — ' +
            i.com.map(function (x) { return '<a href="#/droga/' + esc(x) + '">' + esc(nm(x)) + '</a>'; }).join(', ') + '<p>' + esc(i.txt) + '</p></div>';
        }).join('') : '<p class="note">Nenhuma interação cadastrada com outros medicamentos do bulário.</p>') +
        protRelHtml(id) + '<div class="ref-btns">' + msdLinkHtml(d.nome) + '</div>' +
        '<p class="note">Resumo de referência elaborado para o EnfCalc; não reproduz nem substitui a bula do fabricante. Confira na bula oficial (aba Fontes).</p>')
      : '<p class="empty-msg">Resumo de bula ainda não disponível.</p>';
    var addKit = '<div class="sec addkit"><h3>🧰 Adicionar a uma maleta</h3>' + (ms.length
      ? '<div class="row"><select id="kit-sel" aria-label="Maleta">' + ms.map(function (m) {
          return '<option value="' + esc(m.id) + '"' + (M.temDroga(m, d.id) ? ' disabled' : '') + '>' + esc(m.icon + ' ' + m.nome) + (M.temDroga(m, d.id) ? ' (já contém)' : '') + '</option>';
        }).join('') + '</select><button class="btn sm" id="kit-add" type="button">Adicionar</button></div>'
      : '<p>Você ainda não tem maletas. <a href="#/maletas/nova/' + esc(d.id) + '">Criar uma maleta com este medicamento</a></p>') + '</div>';
    var pacHtml = '<div class="sec"><h3>👤 Dose e preparo para um paciente</h3><p>' +
      (pf.completo ? 'Paciente em atendimento: <b>' + esc(pacienteResumo(pf)) + '</b>.' : 'Informe peso e idade para ver a dose sugerida, o preparo passo a passo e os alertas de alergia, idade e função renal.') +
      '</p><a class="btn" href="#/maleta/lib/atender/' + esc(d.id) + '">' + (pf.completo ? 'Calcular para este paciente' : 'Informar paciente e calcular') + '</a></div>' +
      (DB.DOSES[id] ? '<div class="sec"><h3>💊 Dose de referência</h3><p><b>Adulto:</b> ' + esc((DB.DOSES[id].adulto && DB.DOSES[id].adulto.txt) || '—') + '</p><p><b>Pediatria:</b> ' + esc(DB.DOSES[id].ped ? DB.DOSES[id].ped.txt : 'sem dose pediátrica de referência') + '</p>' +
        (DB.DOSES[id].freq ? '<p><b>Intervalo usual:</b> ' + esc(DB.DOSES[id].freq) + '</p>' : '') + '</div>' : '') + addKit;

    var abas = [['preparo', '💧 Preparo', drugSheetHtml(d).replace('<div class="alert bad">🔴 Medicamento de alta vigilância: dupla checagem obrigatória.</div>', '')],
      ['bula', '📖 Bula', bulaHtml], ['paciente', '👤 Paciente', pacHtml], ['classe', '🧭 Classe', classeAbaHtml(ccD, ccD ? '' : d.classe, d.id)]];
    if (mkD) abas.push(['mercado', '🏷️ Mercado', mercadoHtml(mkD)]);
    abas.push(['fontes', '📚 Fontes', refsHtml(d)]);
    $app.innerHTML = heroDroga({ nome: d.nome, alias: alias, cc: ccD, classe: ccD ? '' : d.classe.replace(/\s*[—-]\s*ALTA VIGILÂNCIA.*$/i, ''), mk: mkD, fav: 'droga:' + d.id, hv: isHV(d), icon: cat ? cat.icon : '💊', tipoFicha: 'Ficha completa' }) +
      (isHV(d) ? '<div class="alert bad">🔴 Medicamento de alta vigilância: dupla checagem obrigatória.</div>' : '') + abasHtml(abas);
    bindDrugCalc(d);
    ligarAbas(abas, 'drugTab', 'preparo');
    var btn = document.getElementById('kit-add');
    if (btn) {
      var sel = document.getElementById('kit-sel');
      var first = [].filter.call(sel.options, function (o) { return !o.disabled; })[0];
      if (first) sel.value = first.value; else btn.disabled = true;
      btn.onclick = function () {
        var m = getMaleta(sel.value);
        if (!m || M.temDroga(m, d.id)) return;
        M.adicionarDrogas(m, [d.id]);
        if (saveMaleta(m)) { toast('Adicionado a “' + m.nome + '”'); viewDrug(id); }
      };
    }
  }


  function viewCalc(id, drugId) {
    var c = CALCS.filter(function (x) { return x.id === id; })[0];
    if (!c) return viewNotFound();
    setHeader(c.title, true);
    var med = drugId ? nomeMed(drugId) : '';
    if (med === drugId) { var ca = CT.CAT.filter(function (a) { return a[0] === drugId; })[0]; med = ca ? ca[1] : ''; }
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(c.desc) + '</p>' + favButton('calc:' + c.id) + '</div>' +
      (med ? '<div class="alias-box">💊 <b>' + esc(med) + '</b><br><small>Informe a apresentação que você tem em mãos (veja o rótulo). <a href="#/droga/' + esc(drugId) + '">Voltar à ficha</a></small></div>' : '') +
      '<form class="form" id="calc-form" autocomplete="off" onsubmit="return false">' + c.fields.map(function (f) { return fieldHtml(f); }).join('') + '</form>' +
      '<div id="calc-out" aria-live="polite"></div>' +
      '<button class="btn ghost" id="btn-clear" type="button">Limpar campos</button>';
    var form = document.getElementById('calc-form');
    var run = bindLiveForm(form, c.fields, c.compute, document.getElementById('calc-out'));
    if (drugId) {   // pré-seleciona a apresentação de mercado do medicamento, se houver
      var sel = form.querySelector('select[data-apres]');
      var grp = sel && Array.prototype.filter.call(sel.querySelectorAll('optgroup'), function (g) { return g.label === nomeMed(drugId); })[0];
      if (grp && grp.querySelector('option')) { sel.value = grp.querySelector('option').value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    document.getElementById('btn-clear').onclick = function () {
      form.querySelectorAll('input[type=text],input[type=date],input[type=time]').forEach(function (i) { i.value = ''; });
      run();
      var first = form.querySelector('input[type=text]'); if (first) first.focus();
    };
  }

  // passos "redondos" para a tabela de titulação
  function titrationSteps(lo, hi, cur) {
    var out = [], r = function (x) { return +x.toPrecision(6); };
    if (hi / lo > 15) { // faixa ampla: sequência 1-2-5
      for (var e = Math.floor(Math.log10(lo)) ; e <= Math.ceil(Math.log10(hi)); e++)
        [1, 2, 5].forEach(function (m) { var v = r(m * Math.pow(10, e)); if (v >= lo && v <= hi) out.push(v); });
    } else { // faixa estreita: incremento linear "redondo"
      var raw = (hi - lo) / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
      var inc = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
      for (var v = Math.ceil(lo / inc - 1e-9) * inc; v <= hi + 1e-9; v += inc) out.push(r(v));
    }
    [lo, hi].concat(isFinite(cur) && cur > 0 ? [cur] : []).forEach(function (x) { if (out.indexOf(r(x)) < 0) out.push(r(x)); });
    return out.sort(function (a, b) { return a - b; });
  }

  // ---- Infusão contínua ----
  function viewInfusao(presetId) {
    setHeader('Infusão contínua', true);
    var presets = D.INFUSIONS;
    var p = presets.filter(function (x) { return x.id === presetId; })[0] || presets[0];
    var peso = store.get('peso', 70);
    var doseUnits = Object.keys(C.DOSE_UNITS);

    $app.innerHTML =
      '<div class="head-row"><p class="lead">Drogas vasoativas, sedação e outras infusões em bomba.</p>' + favButton('view:infusao') + '</div>' +
      '<form class="form" id="inf-form" autocomplete="off" onsubmit="return false">' +
        '<div class="field"><label for="i-preset">Medicamento</label><select id="i-preset">' +
          presets.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + esc(x.nome) + '</option>'; }).join('') +
          '<option value="custom">Personalizado…</option></select><small id="i-sol"></small></div>' +
        '<div class="field"><label for="i-ap">Apresentação (ampola/frasco)</label><select id="i-ap"></select></div>' +
        '<div class="row2"><div class="field"><label for="i-n">Quantidade</label><select id="i-n">' +
          [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(function (n) { return '<option value="' + n + '">' + n + (n > 1 ? ' unidades' : ' unidade') + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="i-vf">Volume final da solução</label><select id="i-vf">' + optsHtml(AP.VOL_FINAL, null, labVF) + '</select></div></div>' +
        '<div class="comp" id="i-comp" aria-live="polite"></div>' +
        '<details id="i-man"><summary>✏️ Digitar a solução manualmente</summary>' +
        '<div class="field"><label for="i-qtd">Quantidade de droga na solução</label><div class="input-wrap"><input id="i-qtd" type="text" inputmode="decimal">' +
          '<select class="unit" id="i-qtdu">' + ['mcg', 'mg', 'g', 'UI'].map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="field"><label for="i-vol">Volume total da solução</label><div class="input-wrap"><input id="i-vol" type="text" inputmode="decimal"><span class="unit">mL</span></div></div></details>' +
        '<div class="field"><label for="i-peso">Peso do paciente</label><div class="input-wrap"><input id="i-peso" type="text" inputmode="decimal" value="' + esc(String(peso).replace('.', ',')) + '"><span class="unit">kg</span></div></div>' +
        '<div class="field"><label for="i-du">Unidade da dose</label><select id="i-du">' + doseUnits.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><span class="lbl">Calcular</span><div class="seg">' +
          '<label class="seg-opt"><input type="radio" name="i-modo" value="dose" checked><span>Dose → mL/h</span></label>' +
          '<label class="seg-opt"><input type="radio" name="i-modo" value="mlh"><span>mL/h → Dose</span></label></div></div>' +
        '<div class="field"><label for="i-val" id="i-val-l">Dose desejada</label><div class="input-wrap"><input id="i-val" type="text" inputmode="decimal"><span class="unit" id="i-val-u"></span></div></div>' +
      '</form><div id="inf-out" aria-live="polite"></div>';

    var $ = function (id) { return document.getElementById(id); };
    var cur = p;

    var aps = [];
    function fillAp(x) {
      aps = x ? AP.paraInfusao(x.id) : [];
      $('i-ap').innerHTML = aps.map(function (a, i) { return '<option value="' + i + '">' + esc(a.rot) + '</option>'; }).join('') + '<option value="m">Outra (digitar)</option>';
    }
    function fromSel() {
      var v = $('i-ap').value, comp = $('i-comp');
      var auto = v !== 'm';
      $('i-n').closest('.field').hidden = !auto; $('i-vf').closest('.field').hidden = !auto;
      if (!auto) { $('i-man').open = true; comp.innerHTML = ''; return; }
      if ($('i-vf').value === 'outro') return;
      var a = aps[+v], n = +$('i-n').value, vf = num($('i-vf').value);
      $('i-qtd').value = fmtIn(a.qtd * n); $('i-qtdu').value = a.u; $('i-vol').value = fmtIn(vf);
      var asp = a.vol * n, dil = vf - asp;
      comp.innerHTML = dil < 0 ? '<div class="alert warn">⚠️ O volume das ampolas (' + fmt(asp, 1) + ' mL) passa do volume final escolhido.</div>'
        : '🧪 <b>Preparo:</b> aspirar ' + fmt(asp, 1) + ' mL (' + n + ' × ' + esc(a.rot) + ' = ' + fmt(a.qtd * n, 3) + ' ' + esc(a.u) + ')' +
          (dil > 0 ? ' + ' + fmt(dil, 1) + ' mL de diluente' : '') + ' → <b>' + fmt(vf, 0) + ' mL</b>';
    }
    function applyPreset(x) {
      cur = x;
      fillAp(x);
      if (!x) { $('i-sol').textContent = 'Informe a solução preparada.'; $('i-ap').value = 'm'; fromSel(); return; }
      $('i-qtd').value = String(x.qtd).replace('.', ',');
      $('i-qtdu').value = x.u;
      $('i-vol').value = x.vol;
      $('i-du').value = x.doseUnit;
      $('i-val').value = String(x.dose).replace('.', ',');
      document.querySelector('input[name=i-modo][value=dose]').checked = true;
      $('i-sol').textContent = 'Solução padrão: ' + x.solucao + ' (ajuste ao protocolo da sua instituição).';
      var c = AP.compor(aps, x.qtd, x.u);
      if (c) { $('i-ap').value = String(c.i); $('i-n').value = String(c.n); setSel($('i-vf'), x.vol, AP.VOL_FINAL, labVF); $('i-man').open = false; }
      else $('i-ap').value = 'm';
      fromSel();
    }

    function run() {
      var modo = document.querySelector('input[name=i-modo]:checked').value;
      var qtd = num($('i-qtd').value), qu = $('i-qtdu').value, vol = num($('i-vol').value);
      var pw = num($('i-peso').value), du = $('i-du').value, val = num($('i-val').value);
      var duInfo = C.DOSE_UNITS[du];
      $('i-val-l').textContent = modo === 'dose' ? 'Dose desejada' : 'Vazão atual da bomba';
      $('i-val-u').textContent = modo === 'dose' ? du : 'mL/h';
      $('i-peso').closest('.field').classList.toggle('dim', !duInfo.perKg);
      if (pw > 0) store.set('peso', pw);
      var out = $('inf-out');

      if (!C.sameClass(qu, duInfo.mass)) { out.innerHTML = resultsHtml({ error: 'A quantidade está em ' + qu + ', mas a dose está em ' + du + '. Escolha unidades compatíveis.' }); return; }
      if (!(qtd > 0) || !(vol > 0) || !(val >= 0) || (duInfo.perKg && !(pw > 0))) { out.innerHTML = resultsHtml(null); return; }

      var conc = C.concNaUnidadeDose(qtd, qu, vol, du);
      var res = [], warns = [], dose;
      if (modo === 'dose') {
        dose = val;
        var mlh = C.doseParaMlH(val, du, pw, qtd, qu, vol);
        res.push({ label: 'Programar a bomba em', value: fmt(mlh, 1), unit: 'mL/h', main: true, sub: 'Exato: ' + fmt(mlh, 3) + ' mL/h' });
      } else {
        dose = C.mlHParaDose(val, du, pw, qtd, qu, vol);
        res.push({ label: 'Dose infundida', value: fmt(dose, 3), unit: du, main: true });
      }
      res.push({ label: 'Concentração da solução', value: fmt(conc, 3), unit: duInfo.mass + '/mL' });
      var mlhAtual = modo === 'dose' ? C.doseParaMlH(val, du, pw, qtd, qu, vol) : val;
      if (mlhAtual > 0) res.push({ label: 'Duração da solução', value: fmtHM(vol / mlhAtual * 60) });

      var h = resultsHtml({ results: res });
      if (cur && cur.doseUnit === du) {
        var lo = cur.faixa[0], hi = cur.faixa[1];
        if (dose < lo || dose > hi) warns.push('Dose fora da faixa usual (' + fmt(lo, 3) + '–' + fmt(hi, 3) + ' ' + du + '). Confira a prescrição.');
        h += warns.map(function (w) { return '<div class="alert warn">⚠️ ' + esc(w) + '</div>'; }).join('');
        // tabela de titulação
        var rows = '';
        titrationSteps(lo, hi, dose).forEach(function (d) {
          var isCur = Math.abs(d - dose) < 1e-9;
          rows += '<tr' + (isCur ? ' class="cur"' : '') + '><td>' + fmt(d, 3) + (isCur ? ' ◀' : '') + '</td><td>' + fmt(C.doseParaMlH(d, du, pw, qtd, qu, vol), 1) + '</td></tr>';
        });
        h += '<h3>Tabela de titulação (' + esc(cur.nome) + ')</h3><table class="tbl"><thead><tr><th>' + esc(du) + '</th><th>mL/h</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }
      h += '<p class="note">mL/h = dose' + (duInfo.perKg ? ' × peso' : '') + (duInfo.per === 'min' ? ' × 60' : '') + ' ÷ concentração (' + duInfo.mass + '/mL).</p>';
      out.innerHTML = h;
    }

    $('i-preset').addEventListener('change', function (e) {
      var x = presets.filter(function (y) { return y.id === e.target.value; })[0];
      applyPreset(x || null);
      run();
    });
    var form = $('inf-form');
    ['i-ap', 'i-n', 'i-vf'].forEach(function (k) { $(k).addEventListener('change', fromSel); });
    bindOutro($('i-vf'), 'mL', AP.VOL_FINAL, labVF, function () { fromSel(); run(); });
    form.addEventListener('input', function (e) { if (e.target.id !== 'i-preset') run(); });
    form.addEventListener('change', function (e) { if (e.target.id !== 'i-preset') run(); });
    applyPreset(p);
    run();
  }

  // ---- Medicamentos ----

  // ---- Ficha do medicamento (biblioteca e maletas) ----
  function concTxt(c) { return c ? fmt(c.qtd, 4) + ' ' + c.u + ' / ' + fmt(c.vol, 2) + ' mL' : ''; }
  function isHV(d) { return (d.classe || '').indexOf('ALTA VIGILÂNCIA') >= 0; }

  function drugSheetHtml(d, noCalc) {
    function sec(t, v, ic) { return v ? '<div class="sec"><h3>' + ic + ' ' + t + '</h3><p>' + esc(v) + '</p></div>' : ''; }
    return (isHV(d) ? '<div class="alert bad">🔴 Medicamento de alta vigilância: dupla checagem obrigatória.</div>' : '') +
      (d.concBiblioteca ? '<div class="alert info">📦 Apresentação do seu local: <b>' + esc(concTxt(d.conc)) + '</b> (biblioteca: ' + esc(concTxt(d.concBiblioteca)) + '). Os cálculos usam a sua.</div>' : '') +
      sec('Apresentação', d.apresentacao, '📦') + sec('Reconstituição', d.reconstituicao, '🧴') + sec('Diluição', d.diluicao, '💧') +
      sec('Administração', d.administracao, '⏱️') + sec('Estabilidade', d.estabilidade, '🗓️') + sec('Observações', d.obs, '⚠️') +
      (d.infusao ? '<a class="btn" href="#/infusao/' + esc(d.infusao) + '">🫀 Calcular infusão contínua</a>' : '') +
      (d.conc && !noCalc ? '<h2>Calcular volume a aspirar</h2><form class="form" id="dform" onsubmit="return false"></form><div id="dout" aria-live="polite"></div>' : '') +
      '<p class="disclaimer">' + (d.personalizado ? 'Ficha criada por você.' : 'Dados de referência; podem variar entre fabricantes.') + ' Confira a bula e o protocolo da instituição.</p>';
  }

  // Apresentação escolhida pelo usuário (lembrada por medicamento)
  function apPref(id) { var p = store.get('apPref', {}); var c = p && p[id]; return c && c.qtd > 0 && c.vol > 0 && C.UNITS[c.u] ? c : null; }
  function apSet(id, a) { var p = store.get('apPref', {}) || {}; p[id] = { qtd: a.qtd, u: a.u, vol: a.vol, rot: a.rot }; store.set('apPref', p); }
  function mesmaConc(a, b) { return !!(a && b && a.u === b.u && Math.abs(a.qtd / a.vol - b.qtd / b.vol) <= 1e-9 * Math.max(1, a.qtd / a.vol)); }
  function apChipsHtml(lista, atual, attr) {
    if (!lista.length) return '';
    var sel = -1;
    lista.forEach(function (a, i) { if (sel < 0 && AP.igual(a, atual)) sel = i; });
    if (sel < 0) lista.forEach(function (a, i) { if (sel < 0 && mesmaConc(a, atual)) sel = i; });
    return '<div class="ap-box"><span class="lbl">Sua ampola / frasco — toque para escolher</span><div class="ap-chips">' + lista.map(function (a, i) {
      return '<button type="button" class="ap-chip' + (i === sel ? ' on' : '') + '" ' + attr + '="' + i + '">' + esc(a.rot) + '</button>';
    }).join('') + '</div></div>';
  }

  // ---- Listas de seleção (valores de mercado) com opção "Outro valor…" ----
  function fmtIn(n) { return String(+(+n).toPrecision(10)).replace('.', ','); }
  function labVol(x) { return x === 0 ? 'Sem diluir (EV direto)' : fmt(x, 0) + ' mL' + (x <= 20 ? ' (seringa)' : ' (bolsa/frasco)'); }
  function labVF(x) { return fmt(x, 0) + ' mL' + (x <= 50 ? ' (seringa)' : ' (bolsa)'); }
  function labTempo(x) { return x === 0 ? 'Bolus' : fmtTempo(x); }
  function optsHtml(vals, cur, lab) {
    var v = vals.slice();
    if (cur != null && isFinite(cur) && v.indexOf(cur) < 0) { v.push(cur); v.sort(function (a, b) { return a - b; }); }
    return v.map(function (x) { return '<option value="' + x + '"' + (x === cur ? ' selected' : '') + '>' + esc(lab(x)) + '</option>'; }).join('') +
      '<option value="outro">Outro valor…</option>';
  }
  function setSel(sel, v, vals, lab) {
    if (!sel || v == null || !isFinite(v)) return;
    var has = Array.prototype.some.call(sel.options, function (o) { return o.value === String(v); });
    if (!has) sel.innerHTML = optsHtml(vals, v, lab);
    sel.value = String(v); sel.setAttribute('data-prev', String(v));
  }
  function bindOutro(sel, unidade, vals, lab, done) {
    if (!sel) return;
    if (!sel.getAttribute('data-prev')) sel.setAttribute('data-prev', sel.value);
    sel.addEventListener('change', function () {
      if (sel.value !== 'outro') { sel.setAttribute('data-prev', sel.value); return; }
      var prev = sel.getAttribute('data-prev');
      ask({ titulo: 'Outro valor', msg: 'Informe o valor em ' + unidade + '.', input: true, ph: 'ex.: 75', ok: 'Usar' }).then(function (r) {
        var n = r == null ? NaN : num(r);
        if (isFinite(n) && n >= 0) setSel(sel, n, vals, lab); else sel.value = prev;
        done();
      });
    });
  }

  function bindDrugCalc(d) {
    var form = document.getElementById('dform');
    if (!form || !d.conc) return;
    var units = C.UNITS[d.conc.u].cls === 'mass' ? ['mcg', 'mg', 'g'] : [d.conc.u];
    var fields = [
      { id: 'dose', label: 'Dose prescrita', units: units, defU: d.conc.u },
      { id: 'qtd', label: 'Apresentação: quantidade', units: units, defU: d.conc.u, def: d.conc.qtd },
      { id: 'vol', label: 'Apresentação: em volume de', unit: 'mL', def: d.conc.vol }
    ];
    var lista = d.id ? AP.lista(d.id, d.conc) : (d.aps || []);
    var pref = d.id && !d.concBiblioteca ? apPref(d.id) : null;
    if (pref && C.sameClass(pref.u, d.conc.u)) { fields[1].def = pref.qtd; fields[1].defU = pref.u; fields[2].def = pref.vol; }
    form.innerHTML = fields.map(function (f) { return fieldHtml(f, 'd'); }).join('');
    var box = document.createElement('div');
    box.innerHTML = apChipsHtml(lista, pref || d.conc, 'data-ap');
    form.parentNode.insertBefore(box, form);
    var manual = !lista.length || !lista.some(function (a) { return mesmaConc(a, pref || d.conc); });
    function mostrarManual(on) {
      ['qtd', 'vol'].forEach(function (k) { var f = form.querySelector('[data-k=' + k + ']'); if (f) f.closest('.field').hidden = !on; });
      var bo = box.querySelector('[data-outra]'); if (bo) bo.classList.toggle('on', on);
    }
    var chips = box.querySelector('.ap-chips');
    if (chips) {
      chips.insertAdjacentHTML('beforeend', '<button type="button" class="ap-chip" data-outra>✏️ Outra apresentação</button>');
      box.querySelector('[data-outra]').onclick = function () {
        box.querySelectorAll('.ap-chip').forEach(function (x) { x.classList.remove('on'); });
        mostrarManual(true); form.querySelector('[data-k=qtd]').focus();
      };
    }
    mostrarManual(manual);
    box.querySelectorAll('[data-ap]').forEach(function (b) {
      b.onclick = function () {
        mostrarManual(false);
        var a = lista[+b.getAttribute('data-ap')];
        form.querySelector('[data-k=qtd]').value = String(a.qtd).replace('.', ',');
        var su = form.querySelector('[data-k=qtd_u]'); if (su) su.value = a.u;
        form.querySelector('[data-k=vol]').value = String(a.vol).replace('.', ',');
        if (d.id) apSet(d.id, a);
        box.querySelectorAll('.ap-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        form.dispatchEvent(new Event('input'));
      };
    });
    bindLiveForm(form, fields, function (v) {
      var ml = C.volumeDose(v.dose, v.dose_u, v.qtd, v.qtd_u, v.vol);
      if (ml == null) return null;
      return { results: [{ label: 'Aspirar', value: fmt(ml, 2), unit: 'mL', main: true }],
        warns: ml > v.vol && !(d.semAviso && v.vol === 1) ? ['A dose excede uma unidade da apresentação (' + fmt(ml / v.vol, 2) + ' unidades).'] : [] };
    }, document.getElementById('dout'));
  }


  // ---- Maletas: persistência ----
  function loadMaletas() { var a = store.get('maletas', []); return Array.isArray(a) ? a : []; }
  function getMaleta(id) { return loadMaletas().filter(function (m) { return m.id === id; })[0] || null; }
  function saveMaleta(m) {
    var a = loadMaletas(), i = -1;
    a.forEach(function (x, k) { if (x.id === m.id) i = k; });
    if (i >= 0) a[i] = m; else a.push(m);
    var ok = store.trySet('maletas', a);
    if (!ok) toast('Não foi possível salvar neste navegador (armazenamento bloqueado ou cheio).', true);
    else if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    return ok;
  }
  function deleteMaleta(id) { return store.trySet('maletas', loadMaletas().filter(function (m) { return m.id !== id; })); }

  function totalAlertas() {
    var t = { vencidos: 0, vencendo: 0 };
    loadMaletas().forEach(function (m) { var a = M.alertas(m); t.vencidos += a.vencidos; t.vencendo += a.vencendo; });
    return t;
  }

  function badges(a) {
    return (a.vencidos ? '<span class="badge bad">' + a.vencidos + ' vencido' + (a.vencidos > 1 ? 's' : '') + '</span>' : '') +
      (a.vencendo ? '<span class="badge warn">' + a.vencendo + ' vencendo</span>' : '') +
      (a.semEstoque ? '<span class="badge">' + a.semEstoque + ' sem estoque</span>' : '');
  }
  function validadeBadge(it) {
    var s = M.statusValidade(it.validade);
    if (!s) return '';
    var dt = it.validade.split('-').reverse().join('/');
    return s === 'vencido' ? '<span class="badge bad">Vencido ' + dt + '</span>' : s === 'vencendo' ? '<span class="badge warn">Vence ' + dt + '</span>' : '<span class="badge">Val. ' + dt + '</span>';
  }

  function toast(msg, bad) {
    var t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  // Modo "incorporado" (ex.: publicado como Artifact): sem impressão, download nem Web Share
  var EMBED = !!window.ENFCALC_EMBED;
  if (EMBED) document.documentElement.classList.add('embed');

  // Janela de confirmação/entrada do próprio app (substitui confirm/prompt nativos)
  function ask(o) {
    return new Promise(function (resolve) {
      var w = document.createElement('div');
      w.className = 'modal';
      w.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="ask-t"><h2 id="ask-t">' + esc(o.titulo || 'Confirmar') + '</h2>' +
        (o.msg ? '<p>' + esc(o.msg) + '</p>' : '') +
        (o.input ? '<input class="txt ask-in" id="ask-in" type="text" maxlength="200" placeholder="' + esc(o.ph || '') + '">' : '') +
        '<div class="ask-row"><button class="btn ghost" type="button" id="ask-no">Cancelar</button><button class="btn' + (o.perigo ? ' dangerb' : '') + '" type="button" id="ask-ok">' + esc(o.ok || 'Confirmar') + '</button></div></div>';
      document.body.appendChild(w);
      var inp = w.querySelector('#ask-in');
      function fim(v) { document.removeEventListener('keydown', key); w.remove(); resolve(v); }
      function key(e) { if (e.key === 'Escape') fim(null); if (e.key === 'Enter' && inp) fim(inp.value); }
      document.addEventListener('keydown', key);
      w.querySelector('#ask-no').onclick = function () { fim(null); };
      w.querySelector('#ask-ok').onclick = function () { fim(inp ? inp.value : true); };
      w.onclick = function (e) { if (e.target === w) fim(null); };
      (inp || w.querySelector('#ask-ok')).focus();
    });
  }

  // Exporta um arquivo JSON: compartilhar (celular) → baixar; no modo incorporado, copia o conteúdo
  function salvarArquivo(json, name, titulo) {
    if (EMBED) {
      try { navigator.clipboard.writeText(json).then(function () { toast('Conteúdo copiado. Cole num arquivo de texto “' + name + '” para guardar ou enviar.'); }, function () { toast('Não foi possível copiar aqui. Use o app instalado para exportar.', true); }); }
      catch (e) { toast('Não foi possível copiar aqui. Use o app instalado para exportar.', true); }
      return;
    }
    var file;
    try { file = new File([json], name, { type: 'application/json' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: titulo }).catch(function () {}); return; }
    var url = URL.createObjectURL(new Blob([json], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Arquivo “' + name + '” salvo.');
  }

  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'maleta'; }

  // ---- Maletas: telas ----
  function viewMaletas() {
    setHeader('Maletas', true);
    var ms = loadMaletas();
    $app.innerHTML =
      '<p class="lead">Monte maletas com os medicamentos que você tem no seu local de trabalho — carrinho de emergência, atendimento domiciliar, setor. Ajuste a apresentação disponível, o estoque, a validade e o protocolo local.</p>' +
      (ms.length ? '<div class="list">' + ms.map(function (m) {
        var a = M.alertas(m);
        return '<a class="card" href="#/maleta/' + esc(m.id) + '"><span class="card-ic">' + esc(m.icon) + '</span><span class="card-t"><b>' + esc(m.nome) + '</b><small>' +
          m.itens.length + ' medicamento' + (m.itens.length === 1 ? '' : 's') + (m.local ? ' · ' + esc(m.local) : '') + '</small>' +
          (a.vencidos || a.vencendo || a.semEstoque ? '<span class="badges">' + badges(a) + '</span>' : '') + '</span><span class="chev">›</span></a>';
      }).join('') + '</div>' : '<div class="empty-box">🧰<p>Nenhuma maleta ainda. Crie a sua do zero ou comece por um modelo.</p></div>') +
      '<a class="btn" href="#/maletas/nova">＋ Nova maleta</a>' +
      '<h2>Começar de um modelo</h2><div class="list">' + D.KITS.map(function (k) {
        return '<button class="card" type="button" data-kit="' + esc(k.id) + '"><span class="card-ic">' + esc(k.icon) + '</span><span class="card-t"><b>' + esc(k.nome) + '</b><small>' +
          k.drogas.length + ' medicamentos · ' + esc(k.local) + '</small></span><span class="chev">＋</span></button>';
      }).join('') + '</div>' +
      '<h2>Compartilhar e backup</h2>' +
      '<label class="btn ghost file-btn">📥 Importar maleta (.json)<input type="file" id="imp" accept=".json,application/json"></label>' +
      '<p class="note">As maletas ficam salvas neste aparelho. Use “Compartilhar” dentro de cada maleta para enviar a colegas (ex.: WhatsApp) ou guardar uma cópia de segurança.</p>';

    $app.querySelectorAll('[data-kit]').forEach(function (b) {
      b.onclick = function () {
        var k = D.KITS.filter(function (x) { return x.id === b.getAttribute('data-kit'); })[0];
        var m = M.deModelo(k);
        if (saveMaleta(m)) { toast('Maleta “' + m.nome + '” criada. Remova o que não tiver e ajuste ao seu local.'); location.hash = '#/maleta/' + m.id; }
      };
    });
    document.getElementById('imp').onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { toast('Arquivo grande demais.', true); return; }
      var r = new FileReader();
      r.onload = function () {
        try {
          var res = M.importar(JSON.parse(r.result), D.DRUGS.map(function (x) { return x.id; }));
          if (saveMaleta(res.maleta)) {
            toast('Maleta importada' + (res.ignorados ? ' (' + res.ignorados + ' item(ns) ignorado(s))' : '') + '.');
            location.hash = '#/maleta/' + res.maleta.id;
          }
        } catch (err) { toast(err instanceof SyntaxError ? 'Arquivo inválido.' : err.message, true); }
      };
      r.readAsText(f);
    };
  }

  function txtField(id, label, val, o) {
    o = o || {};
    var input = o.area
      ? '<textarea id="' + id + '" rows="' + (o.rows || 3) + '" placeholder="' + esc(o.ph || '') + '">' + esc(val || '') + '</textarea>'
      : '<input class="txt" id="' + id + '" type="text" value="' + esc(val || '') + '" placeholder="' + esc(o.ph || '') + '"' + (o.max ? ' maxlength="' + o.max + '"' : '') + '>';
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + input + (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') + '</div>';
  }

  function viewMaletaForm(id, addDrugId) {
    var m = id ? getMaleta(id) : null;
    if (id && !m) return viewNotFound();
    setHeader(m ? 'Editar maleta' : 'Nova maleta', true);
    var icon = m ? m.icon : M.ICONS[0];
    $app.innerHTML = '<form class="form" id="mf" onsubmit="return false">' +
      txtField('m-nome', 'Nome da maleta', m ? m.nome : '', { ph: 'Ex.: Maleta domiciliar, Carrinho PS, UTI 2', max: 60 }) +
      txtField('m-local', 'Local / setor (opcional)', m ? m.local : '', { ph: 'Ex.: Hospital X — Pronto-socorro', max: 120 }) +
      '<div class="field"><span class="lbl">Ícone</span><div class="icons">' + M.ICONS.map(function (ic) {
        return '<label class="ic-opt"><input type="radio" name="m-ic" value="' + ic + '"' + (ic === icon ? ' checked' : '') + '><span>' + ic + '</span></label>';
      }).join('') + '</div></div></form>' +
      '<button class="btn" id="m-save" type="button">' + (m ? 'Salvar' : 'Criar maleta') + '</button>' +
      (m ? '<button class="btn danger" id="m-del" type="button">Excluir maleta</button>' : '');
    document.getElementById('m-nome').focus();
    document.getElementById('m-save').onclick = function () {
      var nome = document.getElementById('m-nome').value.trim();
      if (!nome) { toast('Dê um nome à maleta.', true); document.getElementById('m-nome').focus(); return; }
      var ic = document.querySelector('input[name=m-ic]:checked').value;
      var local = document.getElementById('m-local').value;
      var mm = m || M.novaMaleta(nome, ic, local);
      if (m) { var t = M.novaMaleta(nome, ic, local); m.nome = t.nome; m.icon = t.icon; m.local = t.local; }
      if (!m && addDrugId && D.DRUGS.some(function (x) { return x.id === addDrugId; })) M.adicionarDrogas(mm, [addDrugId]);
      if (saveMaleta(mm)) location.replace('#/maleta/' + mm.id);
    };
    var del = document.getElementById('m-del');
    if (del) del.onclick = function () {
      ask({ titulo: 'Excluir maleta', msg: 'Excluir “' + m.nome + '” e todos os seus itens? Esta ação não pode ser desfeita.', ok: 'Excluir', perigo: true }).then(function (sim) {
        if (sim && deleteMaleta(m.id)) { toast('Maleta excluída.'); location.replace('#/maletas'); }
      });
    };
  }

  function itemRows(m) {
    return m.itens.map(function (it) { return { it: it, d: M.resolver(it, D.DRUGS) }; })
      .filter(function (x) { return x.d; })
      .sort(function (a, b) { return a.d.nome.localeCompare(b.d.nome, 'pt-BR'); });
  }

  function viewMaleta(id) {
    var m = getMaleta(id);
    if (!m) return viewNotFound();
    setHeader(m.nome, true);
    var a = M.alertas(m), rows = itemRows(m);
    $app.innerHTML =
      '<div class="kit-head"><span class="kit-ic">' + esc(m.icon) + '</span><div><b>' + esc(m.nome) + '</b>' + (m.local ? '<small>' + esc(m.local) + '</small>' : '') +
        '<small>' + rows.length + ' medicamento' + (rows.length === 1 ? '' : 's') + '</small></div></div>' +
      (rows.length ? '<a class="btn atender" href="#/maleta/' + esc(m.id) + '/atender">▶ Abrir maleta para um paciente<small>Peso e idade → dose, diluição, preparo e interações</small></a>' : '') +
      (a.vencidos ? '<div class="alert bad">⛔ ' + a.vencidos + ' item(ns) com validade vencida.</div>' : '') +
      (a.vencendo ? '<div class="alert warn">⏳ ' + a.vencendo + ' item(ns) vencem em até ' + M.DIAS_ALERTA + ' dias.</div>' : '') +
      (rows.length > 6 ? '<div class="search"><input id="kq" type="search" placeholder="Buscar nesta maleta…" aria-label="Buscar nesta maleta"></div>' : '') +
      (rows.length ? '<div class="list" id="kl">' + rows.map(function (x) {
        var it = x.it, d = x.d;
        var sub = [d.conc ? concTxt(d.conc) : (d.classe || '')];
        if (it.qtd != null) sub.push('Qtd: ' + it.qtd);
        return '<a class="card" data-name="' + esc(norm(d.nome + ' ' + (d.classe || ''))) + '" href="#/maleta/' + esc(m.id) + '/item/' + esc(it.id) + '"><span class="card-ic">' +
          (d.personalizado ? '✏️' : isHV(d) ? '🔴' : '💊') + '</span><span class="card-t"><b>' + esc(d.nome) + '</b><small>' + esc(sub.join(' · ')) + '</small>' +
          (it.validade || it.qtd === 0 || it.nota ? '<span class="badges">' + validadeBadge(it) + (it.qtd === 0 ? '<span class="badge">Sem estoque</span>' : '') + (it.nota ? '<span class="badge info">📌 Protocolo local</span>' : '') + '</span>' : '') +
          '</span><span class="chev">›</span></a>';
      }).join('') + '</div>' : '<div class="empty-box">💊<p>Maleta vazia. Adicione os medicamentos que você tem disponível.</p></div>') +
      '<div class="btn-grid">' +
        '<a class="btn" href="#/maleta/' + esc(m.id) + '/adicionar">＋ Adicionar da biblioteca</a>' +
        '<a class="btn ghost" href="#/maleta/' + esc(m.id) + '/novo">✏️ Medicamento personalizado</a>' +
        '<a class="btn ghost" href="#/maleta/' + esc(m.id) + '/ficha">📄 Ficha de diluições</a>' +
        '<a class="btn ghost" href="#/revisao/' + esc(m.id) + '">📚 Revisão das fichas</a>' +
        '<a class="btn ghost" href="#/compatibilidade/' + esc(m.id) + '">🔗 Interações</a>' +
        '<button class="btn ghost" id="k-share" type="button">📤 Compartilhar</button>' +
        '<a class="btn ghost" href="#/maleta/' + esc(m.id) + '/editar">⚙️ Editar maleta</a>' +
      '</div>';

    var kq = document.getElementById('kq');
    if (kq) kq.oninput = function () {
      var t = norm(kq.value.trim());
      document.querySelectorAll('#kl .card').forEach(function (c) { c.hidden = t && c.getAttribute('data-name').indexOf(t) < 0; });
    };
    document.getElementById('k-share').onclick = function () {
      salvarArquivo(JSON.stringify(M.exportar(m), null, 2), slug(m.nome) + '.enfcalc.json', 'Maleta ' + m.nome);
    };
  }

  function viewMaletaAdd(id) {
    var m = getMaleta(id);
    if (!m) return viewNotFound();
    setHeader('Adicionar medicamentos', true);
    var drugs = D.DRUGS.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
    $app.innerHTML = '<p class="lead">Marque os medicamentos disponíveis em “' + esc(m.nome) + '”.</p>' +
      '<div class="search"><input id="aq" type="search" placeholder="Buscar medicamento…" aria-label="Buscar medicamento"></div>' +
      '<a class="card solo" href="#/maleta/' + esc(m.id) + '/novo"><span class="card-ic">✏️</span><span class="card-t"><b>Não está na lista?</b><small>Criar medicamento personalizado</small></span><span class="chev">›</span></a>' +
      '<div class="list picks" id="al">' + drugs.map(function (d) {
        var has = M.temDroga(m, d.id);
        return '<label class="pick" data-name="' + esc(norm(d.nome + ' ' + d.classe)) + '"><input type="checkbox" value="' + esc(d.id) + '"' + (has ? ' checked disabled' : '') + '>' +
          '<span class="card-t"><b>' + esc(d.nome) + '</b><small>' + (has ? 'Já está na maleta' : esc(d.classe)) + '</small></span></label>';
      }).join('') + '</div>' +
      '<div class="sticky-act"><button class="btn" id="a-go" type="button" disabled>Adicionar</button></div>';
    var list = document.getElementById('al'), go = document.getElementById('a-go');
    function sel() { return [].map.call(list.querySelectorAll('input:checked:not(:disabled)'), function (i) { return i.value; }); }
    list.onchange = function () { var n = sel().length; go.disabled = !n; go.textContent = n ? 'Adicionar ' + n + ' medicamento' + (n > 1 ? 's' : '') : 'Adicionar'; };
    document.getElementById('aq').oninput = function (e) {
      var t = norm(e.target.value.trim());
      list.querySelectorAll('.pick').forEach(function (p) { p.hidden = t && p.getAttribute('data-name').indexOf(t) < 0; });
    };
    go.onclick = function () {
      var n = M.adicionarDrogas(m, sel());
      if (saveMaleta(m)) { toast(n + ' medicamento(s) adicionado(s).'); location.replace('#/maleta/' + m.id); }
    };
  }

  function concFields(prefix, c, ph) {
    return '<div class="field"><span class="lbl">Apresentação disponível (para os cálculos)</span><div class="conc-row">' +
      '<div class="input-wrap"><input id="' + prefix + '-cq" type="text" inputmode="decimal" placeholder="' + esc(ph ? fmt(ph.qtd, 4) : 'Qtd') + '" value="' + (c ? esc(fmt(c.qtd, 6)) : '') + '">' +
      '<select class="unit" id="' + prefix + '-cu" aria-label="Unidade">' + M.CONC_UNITS.map(function (u) { return '<option' + (u === (c ? c.u : ph ? ph.u : 'mg') ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></div>' +
      '<span class="em">em</span><div class="input-wrap"><input id="' + prefix + '-cv" type="text" inputmode="decimal" placeholder="' + esc(ph ? fmt(ph.vol, 4) : 'Vol') + '" value="' + (c ? esc(fmt(c.vol, 6)) : '') + '"><span class="unit">mL</span></div>' +
      '</div><small>Ex.: 500 mg em 2 mL. Para pó, use o volume após reconstituir.</small></div>';
  }
  function readConc(prefix) {
    var q = num(document.getElementById(prefix + '-cq').value), v = num(document.getElementById(prefix + '-cv').value);
    return M.cleanConc({ qtd: q, u: document.getElementById(prefix + '-cu').value, vol: v });
  }

  function viewCustomForm(id, itemId) {
    var m = getMaleta(id);
    if (!m) return viewNotFound();
    var it = itemId ? M.daMaleta(m, itemId) : null;
    if (itemId && (!it || !it.custom)) return viewNotFound();
    var c = it ? it.custom : {};
    setHeader(it ? 'Editar ficha' : 'Medicamento personalizado', true);
    $app.innerHTML = '<p class="lead">Cadastre um medicamento que não está na biblioteca, com as informações do seu protocolo.</p>' +
      '<form class="form" onsubmit="return false">' +
      txtField('c-nome', 'Nome *', c.nome, { ph: 'Ex.: Cefuroxima 750 mg', max: 80 }) +
      txtField('c-classe', 'Classe', c.classe, { ph: 'Ex.: Antibiótico' }) +
      txtField('c-apresentacao', 'Apresentação', c.apresentacao, { ph: 'Ex.: Frasco-ampola 750 mg (pó)' }) +
      concFields('c', c.conc) +
      txtField('c-reconstituicao', 'Reconstituição', c.reconstituicao, { area: true }) +
      txtField('c-diluicao', 'Diluição', c.diluicao, { area: true }) +
      txtField('c-administracao', 'Administração (via, tempo)', c.administracao, { area: true }) +
      txtField('c-estabilidade', 'Estabilidade', c.estabilidade, { area: true, rows: 2 }) +
      txtField('c-obs', 'Observações / cuidados', c.obs, { area: true }) +
      '</form><button class="btn" id="c-save" type="button">Salvar</button>';
    document.getElementById('c-save').onclick = function () {
      var o = {};
      M.TEXT_FIELDS.forEach(function (k) { o[k] = document.getElementById('c-' + k).value; });
      o.conc = readConc('c');
      var cc = M.cleanCustom(o);
      if (!cc) { toast('Informe o nome do medicamento.', true); document.getElementById('c-nome').focus(); return; }
      var target = it;
      if (target) target.custom = cc; else { target = M.novoItem({ custom: cc }); m.itens.push(target); }
      if (saveMaleta(m)) { toast('Ficha salva.'); location.replace('#/maleta/' + m.id + '/item/' + target.id); }
    };
  }

  function viewMaletaItem(id, itemId) {
    var m = getMaleta(id);
    var it = m && M.daMaleta(m, itemId);
    var d = it && M.resolver(it, D.DRUGS);
    if (!d) return viewNotFound();
    setHeader(d.nome, true);
    var lib = d.personalizado ? null : D.DRUGS.filter(function (x) { return x.id === it.drugId; })[0];
    $app.innerHTML =
      '<a class="crumb" href="#/maleta/' + esc(m.id) + '">' + esc(m.icon + ' ' + m.nome) + '</a>' +
      '<p class="lead">' + esc(d.classe || '') + '</p>' +
      '<div id="it-top"></div><div id="sheet"></div>' +
      '<h2>🧰 Nesta maleta</h2><form class="form" id="itf" onsubmit="return false">' +
        (d.personalizado ? '' : concFields('it', it.conc, lib && lib.conc)) +
        '<div class="field two"><div><label for="it-qtd">Quantidade em estoque</label><div class="input-wrap"><input id="it-qtd" type="text" inputmode="numeric" placeholder="opcional" value="' + (it.qtd != null ? it.qtd : '') + '"><span class="unit">unid.</span></div></div>' +
        '<div><label for="it-val">Validade</label><input type="date" id="it-val" value="' + esc(it.validade || '') + '"></div></div>' +
        txtField('it-nota', 'Protocolo / observação local', it.nota, { area: true, ph: 'Ex.: No nosso serviço diluímos em 100 mL de SF e infundimos em 1 h.' }) +
      '</form><div class="sec conf" id="it-conf"></div><p class="note" id="it-saved" aria-live="polite">As alterações são salvas automaticamente.</p>' +
      (d.personalizado ? '<a class="btn ghost" href="#/maleta/' + esc(m.id) + '/editar/' + esc(it.id) + '">✏️ Editar ficha</a>' : '<a class="btn ghost" href="#/droga/' + esc(it.drugId) + '">📚 Ver na biblioteca</a>') +
      '<button class="btn danger" id="it-del" type="button">Remover da maleta</button>';

    function renderTop() {
      $('it-top').innerHTML = (it.nota ? '<div class="alert info">📌 <b>Protocolo local:</b> ' + esc(it.nota) + '</div>' : '') +
        (M.statusValidade(it.validade) === 'vencido' ? '<div class="alert bad">⛔ Validade vencida — não utilizar.</div>' : M.statusValidade(it.validade) === 'vencendo' ? '<div class="alert warn">⏳ Vence em breve (' + esc(it.validade.split('-').reverse().join('/')) + ').</div>' : '') +
        (it.qtd === 0 ? '<div class="alert warn">📦 Sem estoque nesta maleta.</div>' : '');
    }
    function renderSheet() { d = M.resolver(it, D.DRUGS); $('sheet').innerHTML = drugSheetHtml(d) + refsHtml(d, it); bindDrugCalc(d); }
    function $(x) { return document.getElementById(x); }
    function renderConf() {
      var c = it.conferido;
      $('it-conf').innerHTML = '<h3>☑️ Conferência com a bula do fabricante</h3>' + (c
        ? '<p>Conferido por <b>' + esc(c.por) + '</b> em ' + esc(c.data.split('-').reverse().join('/')) + '.</p><button class="btn sm ghost" id="cf-undo" type="button">Desfazer</button>'
        : '<p class="note">Depois de comparar esta ficha com a bula do medicamento que você tem na maleta, registre aqui.</p>' +
          '<div class="row"><input class="txt" id="cf-por" type="text" maxlength="80" placeholder="Seu nome / registro (COREN, CRF)" value="' + esc(store.get('conferente', '')) + '"><button class="btn sm" id="cf-ok" type="button">Conferi hoje</button></div>');
      var ok = $('cf-ok'), un = $('cf-undo');
      if (ok) ok.onclick = function () {
        var por = $('cf-por').value.trim();
        if (!por) { toast('Informe seu nome/registro.', true); $('cf-por').focus(); return; }
        var h = new Date(), data = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
        it.conferido = M.cleanConferido({ por: por, data: data });
        store.set('conferente', por);
        if (saveMaleta(m)) toast('Conferência registrada.');
        renderConf(); renderSheet();
      };
      if (un) un.onclick = function () { it.conferido = null; saveMaleta(m); renderConf(); renderSheet(); };
    }
    renderTop(); renderSheet(); renderConf();

    var timer;
    function save(full) {
      if (!d.personalizado) {
        var cq = $('it-cq').value.trim(), cv = $('it-cv').value.trim();
        it.conc = cq || cv ? readConc('it') : null;
      }
      var q = $('it-qtd').value.trim();
      it.qtd = q === '' || !(num(q) >= 0) ? null : Math.floor(num(q));
      it.validade = $('it-val').value || null;
      it.nota = $('it-nota').value.trim().slice(0, 2000);
      if (saveMaleta(m)) $('it-saved').textContent = 'Salvo ✓';
      renderTop();
      if (full) renderSheet();
    }
    var form = $('itf');
    form.addEventListener('input', function () { clearTimeout(timer); $('it-saved').textContent = 'Salvando…'; timer = setTimeout(function () { save(false); }, 500); });
    form.addEventListener('change', function () { clearTimeout(timer); save(true); });
    $('it-del').onclick = function () {
      ask({ titulo: 'Remover da maleta', msg: 'Remover “' + d.nome + '” desta maleta?', ok: 'Remover', perigo: true }).then(function (sim) {
        if (!sim) return;
        m.itens = m.itens.filter(function (x) { return x.id !== it.id; });
        if (saveMaleta(m)) { toast('Removido.'); location.replace('#/maleta/' + m.id); }
      });
    };
  }

  function viewMaletaFicha(id) {
    var m = getMaleta(id);
    if (!m) return viewNotFound();
    setHeader('Ficha de diluições', true);
    var rows = itemRows(m), hoje = new Date().toLocaleDateString('pt-BR');
    function dd(t, v) { return v ? '<dt>' + t + '</dt><dd>' + esc(v) + '</dd>' : ''; }
    $app.innerHTML =
      '<div class="no-print"><p class="lead">Resumo de todos os medicamentos da maleta, para consulta rápida ou para imprimir e deixar junto da maleta.</p>' +
      '<button class="btn print-btn" type="button" onclick="window.print()">🖨️ Imprimir / salvar PDF</button></div>' +
      '<div class="ficha"><header><h2>' + esc(m.icon + ' ' + m.nome) + '</h2><p>' + esc(m.local || '') + ' · ' + rows.length + ' medicamentos · gerado em ' + hoje + '</p></header>' +
      rows.map(function (x) {
        var d = x.d, it = x.it;
        return '<article class="ficha-item"><h3>' + (isHV(d) ? '🔴 ' : '') + esc(d.nome) + (d.conc ? ' <small>' + esc(concTxt(d.conc)) + '</small>' : '') + '</h3><dl>' +
          dd('Apresentação', d.apresentacao) + dd('Reconstituição', d.reconstituicao) + dd('Diluição', d.diluicao) +
          dd('Administração', d.administracao) + dd('Estabilidade', d.estabilidade) + dd('Cuidados', d.obs) +
          dd('📌 Protocolo local', it.nota) + dd('Validade', it.validade ? it.validade.split('-').reverse().join('/') : '') + '</dl></article>';
      }).join('') +
      '<p class="disclaimer">EnfCalc — material de apoio. Confira prescrição, bula e protocolos institucionais.</p></div>';
  }

  // ---- Referências e revisão ----
  function revisaoBadge(id) {
    var r = R.revisao(id);
    if (r) return '<span class="badge ok">✅ Revisado</span>';
    return R.verificacao(id) ? '<span class="badge info">🔎 Conferido com fontes</span>' : '<span class="badge warn">⏳ Aguardando revisão</span>';
  }
  function refsHtml(d, it) {
    if (!d.id && !(it && it.conferido)) return '';
    var h = '<div class="sec refs"><h3>📚 Referências e revisão</h3>';
    if (d.id) {
      var r = R.revisao(d.id);
      var v = R.verificacao(d.id);
      h += r
        ? '<p>✅ <b>Revisado por ' + esc(r.por) + (r.registro ? ' (' + esc(r.registro) + ')' : '') + '</b> em ' + esc(r.data.split('-').reverse().join('/')) + '.<br><small>Fonte: ' + esc(r.fonte || '') + (r.nota ? ' — ' + esc(r.nota) : '') + '</small></p>'
        : '<p>⏳ <b>Ainda não revisada por farmacêutico.</b></p>';
      h += v
        ? '<p>🔎 <b>Conferida com fontes publicadas</b> em ' + esc(v.data.split('-').reverse().join('/')) + ':</p><ul class="fontes">' +
            v.fontes.map(function (f) { return '<li><a target="_blank" rel="noopener" href="' + esc(f.url) + '">' + esc(f.t) + '</a></li>'; }).join('') +
          '</ul><p class="note">Fontes podem divergir entre si e entre fabricantes; quando divergem, a ficha cita a mais conservadora ou as duas.</p>'
        : '<p><small>' + esc(R.FONTE_PADRAO) + '</small></p>';
      h += '<div class="ref-btns"><a class="btn sm" target="_blank" rel="noopener" href="' + esc(R.urlAnvisa(d)) + '">📄 Ver bula na Anvisa</a>' +
        (isHV(d) ? '<a class="btn sm ghost" target="_blank" rel="noopener" href="https://www.ismp-brasil.org/">⚠️ ISMP Brasil</a>' : '') + '</div>' +
        '<p class="note">No Bulário, busque por “' + esc(R.termoAnvisa(d)) + '” e abra a bula profissional do fabricante que você usa.</p>';
    }
    if (it && it.conferido) h += '<p>☑️ Conferido com a bula do fabricante por <b>' + esc(it.conferido.por) + '</b> em ' + esc(it.conferido.data.split('-').reverse().join('/')) + ' (nesta maleta).</p>';
    return h + '</div>';
  }

  function viewRevisao(filtroMaleta) {
    setHeader('Revisão das fichas', true);
    var ms = loadMaletas();
    var m = filtroMaleta ? getMaleta(filtroMaleta) : null;
    var lista = D.DRUGS.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
    if (m) lista = lista.filter(function (d) { return M.temDroga(m, d.id); });
    var nRev = lista.filter(function (d) { return R.revisao(d.id); }).length;
    var nVer = lista.filter(function (d) { return R.verificacao(d.id); }).length;
    var pct = lista.length ? Math.round(nRev / lista.length * 100) : 0;
    function dd(t, v) { return v ? '<dt>' + t + '</dt><dd>' + esc(v) + '</dd>' : ''; }
    $app.innerHTML =
      '<div class="no-print">' +
      '<p class="lead">Para o app ser confiável, cada ficha deve ser conferida por farmacêutico (ou enfermeiro responsável) com a <b>bula profissional da Anvisa</b> do fabricante usado no seu serviço.</p>' +
      '<div class="progress"><div class="bar" style="width:' + pct + '%"></div><div class="bar ver" style="width:' + Math.max(0, Math.round(nVer / Math.max(lista.length, 1) * 100) - pct) + '%"></div></div>' +
      '<p class="note">' + (m ? 'Maleta “' + esc(m.nome) + '”: ' : '') + '<b>✅ ' + nRev + '</b> revisadas por profissional · <b>🔎 ' + nVer + '</b> conferidas com fontes publicadas · <b>⏳ ' + (lista.length - nVer) + '</b> sem conferência (de ' + lista.length + ').</p>' +
      '<div class="field"><label for="rv-f">Mostrar</label><select id="rv-f"><option value="">Todos os medicamentos (' + D.DRUGS.length + ')</option>' +
        ms.map(function (x) { return '<option value="' + esc(x.id) + '"' + (m && m.id === x.id ? ' selected' : '') + '>' + esc(x.icon + ' ' + x.nome) + '</option>'; }).join('') + '</select></div>' +
      '<div class="sec"><h3>Como funciona</h3><ol class="howto">' +
        '<li>Imprima ou salve em PDF a <b>ficha de conferência</b> abaixo.</li>' +
        '<li>O farmacêutico confere cada item com a bula Anvisa e anota divergências.</li>' +
        '<li>Envie as correções (foto/PDF) para atualizarmos o app; a ficha passa a mostrar “✅ Revisado por … em …”.</li></ol>' +
        '<button class="btn print-btn" type="button" onclick="window.print()">🖨️ Imprimir ficha de conferência</button></div>' +
      '<h2>Referências recomendadas</h2><div class="list">' + R.REFERENCIAS.map(function (r) {
        return (r.url ? '<a class="card" target="_blank" rel="noopener" href="' + esc(r.url) + '">' : '<div class="card">') + '<span class="card-ic">📚</span><span class="card-t"><b>' + esc(r.nome) + '</b><small>' + esc(r.desc) + '</small></span>' + (r.url ? '<span class="chev">↗</span></a>' : '</div>');
      }).join('') + '</div>' +
      '<h2>Fichas</h2><div class="list">' + lista.map(function (d) {
        return '<a class="card" href="#/droga/' + esc(d.id) + '"><span class="card-ic">' + (R.revisao(d.id) ? '✅' : '⏳') + '</span><span class="card-t"><b>' + esc(d.nome) + '</b><small>' + esc(d.classe) + '</small></span><span class="chev">›</span></a>';
      }).join('') + '</div></div>' +
      '<div class="ficha print-only"><header><h2>Ficha de conferência — EnfCalc' + (m ? ' · ' + esc(m.nome) : '') + '</h2><p>Conferir cada item com a bula profissional Anvisa do fabricante utilizado. Gerado em ' + new Date().toLocaleDateString('pt-BR') + '.</p></header>' +
      lista.map(function (d) {
        var dz = DB.DOSES[d.id];
        return '<article class="ficha-item"><h3>' + esc(d.nome) + ' <small>' + esc(d.apresentacao) + '</small></h3><dl>' +
          dd('Reconstituição', d.reconstituicao) + dd('Diluição', d.diluicao) + dd('Administração', d.administracao) + dd('Estabilidade', d.estabilidade) + dd('Cuidados', d.obs) +
          (dz ? dd('Dose adulto', dz.adulto && dz.adulto.txt) + dd('Dose pediátrica', dz.ped ? dz.ped.txt : 'sem referência') + dd('Intervalo', dz.freq) +
            dd('Preparo (app)', [dz.diluente, dz.concMax ? 'conc. máx. ' + String(dz.concMax).replace('.', ',') + ' ' + d.conc.u + '/mL' : '', dz.tempo ? 'tempo ' + dz.tempo + ' min' : '', dz.vmax ? 'vel. máx. ' + String(+dz.vmax.toFixed(3)).replace('.', ',') + ' ' + d.conc.u + '/min' : ''].filter(Boolean).join(' · ')) : '') +
          '</dl><p class="check">☐ Conferido sem divergências &nbsp; ☐ Divergência: ____________________________________________<br>Fabricante/bula: ____________________ &nbsp; Revisor/registro: ____________________ &nbsp; Data: ___/___/_____</p></article>';
      }).join('') + '</div>';
    document.getElementById('rv-f').onchange = function (e) { location.hash = e.target.value ? '#/revisao/' + e.target.value : '#/revisao'; };
  }

  // ---- Modo atendimento (maleta aberta para um paciente) ----
  var NOMES = {};
  D.DRUGS.forEach(function (x) { NOMES[x.id] = x.nome; });

  function loadPaciente() { var p = store.get('paciente', null); return p && typeof p === 'object' ? p : { idadeU: 'anos', alergias: [] }; }
  function pacienteResumo(pf) {
    if (!pf.completo) return 'Informe o peso para calcular';
    var idade = pf.idadeMeses == null ? '' : pf.idadeMeses < 24 ? ' · ' + fmt(pf.idadeMeses, 0) + ' meses' : ' · ' + fmt(Math.floor(pf.idadeAnos), 0) + ' anos';
    return fmt(pf.peso, 1) + ' kg' + idade + (pf.altura ? ' · ' + fmt(pf.altura, 0) + ' cm' : '') + ' · ' + (pf.ped ? 'Pediátrico' : 'Adulto');
  }
  function sevIcon(s) { return s === 'grave' ? '⛔' : s === 'moderada' ? '⚠️' : 'ℹ️'; }
  function sevClass(s) { return s === 'grave' ? 'bad' : s === 'moderada' ? 'warn' : 'info'; }
  function alertList(list) { return list.map(function (a) { return '<div class="alert ' + sevClass(a.sev) + '">' + sevIcon(a.sev) + ' ' + esc(a.txt) + '</div>'; }).join(''); }
  function nm(id) { return NOMES[id] || id; }
  // "Maleta" virtual com toda a biblioteca (atender sem maleta)
  function getKit(id) {
    if (id !== 'lib') return getMaleta(id);
    return { id: 'lib', lib: true, nome: 'Biblioteca', icon: '📚', local: '', itens: D.DRUGS.map(function (d) {
      return { id: d.id, drugId: d.id, custom: null, conc: null, qtd: null, validade: null, nota: '', conferido: null }; }) };
  }
  function kitDrugIds(m) { if (m.lib) return []; return m.itens.filter(function (i) { return i.drugId; }).map(function (i) { return i.drugId; }); }

  // Atualiza o HTML só se mudou (evita recriar elementos sob o dedo do usuário)
  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el && el.getAttribute('data-h') !== html) { el.innerHTML = html; el.setAttribute('data-h', html); }
  }

  function viewAtender(id) {
    var m = getKit(id);
    if (!m) return viewNotFound();
    setHeader('Atendimento', true);
    var pac = loadPaciente();
    var pf0 = P.perfil(pac);
    $app.innerHTML =
      '<a class="crumb" href="' + (m.lib ? '#/drogas' : '#/maleta/' + esc(m.id)) + '">' + esc(m.icon + ' ' + m.nome) + (m.lib ? ' · todos os medicamentos' : '') + '</a>' +
      '<details class="pac-box" id="pacbox"' + (pf0.completo ? '' : ' open') + '><summary><span class="pac-ic">👤</span><span class="card-t"><b>Paciente</b><small id="pacsum">' + esc(pacienteResumo(pf0)) + '</small></span><span class="pac-edit">editar</span></summary>' +
      '<form class="pac-form" id="pf" onsubmit="return false" autocomplete="off">' +
        '<div class="field two"><div><label for="p-peso">Peso *</label><div class="input-wrap"><input id="p-peso" type="text" inputmode="decimal" value="' + esc(pac.peso != null ? String(pac.peso).replace('.', ',') : '') + '"><span class="unit">kg</span></div></div>' +
        '<div><label for="p-alt">Altura</label><div class="input-wrap"><input id="p-alt" type="text" inputmode="decimal" placeholder="opcional" value="' + esc(pac.altura != null ? String(pac.altura).replace('.', ',') : '') + '"><span class="unit">cm</span></div></div></div>' +
        '<div class="field"><label for="p-idade">Idade</label><div class="input-wrap"><input id="p-idade" type="text" inputmode="decimal" value="' + esc(pac.idade != null ? String(pac.idade).replace('.', ',') : '') + '">' +
          '<select class="unit" id="p-idu" aria-label="Unidade da idade"><option value="anos"' + (pac.idadeU !== 'meses' ? ' selected' : '') + '>anos</option><option value="meses"' + (pac.idadeU === 'meses' ? ' selected' : '') + '>meses</option></select></div></div>' +
        '<div class="field"><span class="lbl">Sexo</span><div class="seg">' + [['m', 'Masculino'], ['f', 'Feminino'], ['', 'Não informar']].map(function (o) {
          return '<label class="seg-opt"><input type="radio" name="p-sexo" value="' + o[0] + '"' + ((pac.sexo || '') === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
        }).join('') + '</div></div>' +
        '<div class="field"><label for="p-cr">Creatinina sérica (opcional)</label><div class="input-wrap"><input id="p-cr" type="text" inputmode="decimal" placeholder="para ajuste renal" value="' + esc(pac.creat != null ? String(pac.creat).replace('.', ',') : '') + '"><span class="unit">mg/dL</span></div></div>' +
        '<div class="field"><span class="lbl">Alergias</span><div class="chips">' + DB.ALERGIAS.map(function (a) {
          return '<label class="chip"><input type="checkbox" name="p-al" value="' + a.id + '"' + ((pac.alergias || []).indexOf(a.id) >= 0 ? ' checked' : '') + '><span>' + esc(a.nome) + '</span></label>';
        }).join('') + '</div></div>' +
      '</form><button class="btn ghost" id="pac-new" type="button">Novo paciente (limpar dados)</button></details>' +
      '<div id="pac-resumo"></div><div id="reg-area">' + registroHtml(m) + '</div><div id="kit-int"></div><div class="search" id="atq-w" hidden><input id="atq" type="search" placeholder="Buscar medicamento…" aria-label="Buscar medicamento"></div><div id="atl"></div>' +
      '<p class="disclaimer">Doses sugeridas são referências para conferência. Siga sempre a prescrição médica e os protocolos da instituição. Os dados do paciente ficam só neste aparelho; não registre nome.</p>';

    var form = document.getElementById('pf');
    function readPac() {
      var sx = form.querySelector('input[name=p-sexo]:checked');
      return {
        peso: num(document.getElementById('p-peso').value) || null,
        altura: num(document.getElementById('p-alt').value) || null,
        idade: isFinite(num(document.getElementById('p-idade').value)) ? num(document.getElementById('p-idade').value) : null,
        idadeU: document.getElementById('p-idu').value,
        sexo: sx ? sx.value : '',
        creat: num(document.getElementById('p-cr').value) || null,
        alergias: [].map.call(form.querySelectorAll('input[name=p-al]:checked'), function (i) { return i.value; }),
        inicio: pac.inicio || new Date().toISOString()
      };
    }
    function render() {
      var pf = P.perfil(pac);
      document.getElementById('pacsum').textContent = pacienteResumo(pf);
      var chips = [];
      if (pf.completo) {
        chips.push(pf.ped ? '👶 Pediátrico' : '🧑 Adulto');
        if (pf.neonato) chips.push('Neonato');
        if (pf.imc) chips.push('IMC ' + fmt(pf.imc, 1));
        if (pf.sc) chips.push('SC ' + fmt(pf.sc, 2) + ' m²');
        if (pf.clcr != null) chips.push('ClCr ' + fmt(pf.clcr, 0) + ' mL/min');
        if (pf.pesoAjustado) chips.push('Peso ajustado ' + fmt(pf.pesoAjustado, 0) + ' kg');
        if (pf.holliday) chips.push('Manutenção ' + fmt(pf.holliday.mlH, 0) + ' mL/h');
        pf.alergias.forEach(function (a) { var x = DB.ALERGIAS.filter(function (y) { return y.id === a; })[0]; if (x) chips.push('⚠️ Alérgico: ' + x.nome); });
      }
      setHtml('pac-resumo', chips.length ? '<div class="pchips">' + chips.map(function (c) { return '<span class="pchip' + (c.indexOf('Alérgico') >= 0 ? ' bad' : '') + '">' + esc(c) + '</span>'; }).join('') + '</div>' : '');

      var ids = kitDrugIds(m);
      var geral = P.interacoesMaleta(ids, DB);
      var keepOpen = document.querySelector('#kit-int details[open]');
      setHtml('kit-int', geral.length ?
        '<details class="int-box"><summary>⚠️ ' + geral.length + (geral.length > 1 ? ' alertas' : ' alerta') + ' de interação/incompatibilidade nesta maleta' +
        (geral.some(function (g) { return g.sev === 'grave'; }) ? ' <span class="badge bad">grave</span>' : '') + '</summary>' +
        geral.map(function (g) { return '<div class="int-item ' + sevClass(g.sev) + '"><b>' + esc(g.mesmoGrupo ? g.a.map(nm).join(' + ') : g.a.map(nm).join(', ') + ' + ' + g.b.map(nm).join(', ')) + '</b> <span class="badge ' + sevClass(g.sev) + '">' + esc(g.tipo) + '</span><p>' + esc(g.txt) + '</p></div>'; }).join('') + '</details>' : '');
      if (keepOpen && document.querySelector('#kit-int details')) document.querySelector('#kit-int details').open = true;

      var rows = itemRows(m);
      setHtml('atl', !pf.completo ? '<div class="empty-box">⚖️<p>Informe o peso do paciente para ver doses e preparos.</p></div>' :
        '<h2>Abra a medicação</h2><div class="list">' + rows.map(function (x) {
          var it = x.it, d = x.d, sub = '', bs = '';
          if (it.drugId) {
            var dd = DB.DOSES[it.drugId];
            var al = P.alertasPaciente(it.drugId, pf, DB);
            var nInt = m.lib ? 0 : P.interacoes(it.drugId, ids, DB, NOMES).filter(function (i) { return i.sev !== 'info'; }).length;
            if (dd && dd.via === 'continua') sub = 'Infusão contínua em bomba';
            else if (d.conc) {
              var s = P.doseSugerida(it.drugId, pf, DB, d.conc.u);
              sub = s && s.valor != null ? 'Sugestão: ' + fmt(s.valor, 3) + ' ' + d.conc.u + (s.calculo && s.calculo.indexOf('/kg') > 0 ? ' (' + s.calculo.split(' × ')[0] + ')' : '') : 'Dose conforme prescrição';
            }
            var graves = al.filter(function (a) { return a.sev === 'grave'; });
            if (graves.length) bs += '<span class="badge bad">' + esc(/ALÉRGICO/.test(graves[0].txt) ? 'Alergia' : 'Contraindicado') + '</span>';
            if (al.some(function (a) { return a.sev === 'moderada'; })) bs += '<span class="badge warn">Atenção</span>';
            if (nInt) bs += '<span class="badge warn">' + nInt + (nInt > 1 ? ' interações' : ' interação') + '</span>';
          } else sub = 'Personalizado · dose conforme prescrição';
          bs += validadeBadge(it).replace(/<span class="badge">Val\. [^<]*<\/span>/, '');
          var ic = /class="badge bad"/.test(bs) ? '⛔' : d.personalizado ? '✏️' : isHV(d) ? '🔴' : '💊';
          return '<a class="card" data-name="' + esc(norm(d.nome + ' ' + (d.classe || ''))) + '" href="#/maleta/' + esc(m.id) + '/atender/' + esc(it.id) + '"><span class="card-ic">' + ic + '</span><span class="card-t"><b>' + esc(d.nome) + '</b><small>' + esc(sub) + '</small>' +
            (bs ? '<span class="badges">' + bs + '</span>' : '') + '</span><span class="chev">›</span></a>';
        }).join('') + '</div>');
      document.getElementById('atq-w').hidden = !(pf.completo && rows.length > 10);
      if (document.getElementById('atq').value) filtrar();
    }
    var atq = document.getElementById('atq');
    function filtrar() {
      var t = norm(atq.value.trim());
      document.querySelectorAll('#atl .card').forEach(function (c) { c.hidden = !!t && c.getAttribute('data-name').indexOf(t) < 0; });
    }
    atq.oninput = filtrar;
    var timer;
    form.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(save, 250); });
    form.addEventListener('change', function (e) { if (e.target.type !== 'text') save(); });
    function save() {
      pac = readPac();
      store.set('paciente', pac);
      if (pac.peso) store.set('peso', pac.peso);
      render();
    }
    document.getElementById('pac-new').onclick = function () {
      ask({ titulo: 'Novo paciente', msg: 'Limpar os dados e o registro do paciente atual?', ok: 'Limpar' }).then(function (sim) {
        if (!sim) return;
        store.set('paciente', null);
        store.set('registro', []);
        viewAtender(id);
        document.getElementById('p-peso').focus();
      });
    };
    render();
    bindRegistro(m, function () { viewAtender(id); });
    if (!pf0.completo) document.getElementById('p-peso').focus();
  }

  function viewAtenderItem(id, itemId) {
    var m = getKit(id);
    var it = m && M.daMaleta(m, itemId);
    var d = it && M.resolver(it, D.DRUGS);
    if (!d) return viewNotFound();
    var pf = P.perfil(loadPaciente());
    if (!pf.completo) { location.replace('#/maleta/' + id + '/atender'); return; }
    if (m.lib && it.drugId) { var prefAp = apPref(it.drugId); if (prefAp && d.conc && C.sameClass(prefAp.u, d.conc.u)) d.conc = prefAp; }
    var listaAp = it.drugId ? AP.lista(it.drugId, d.conc) : [];
    setHeader(d.nome, true);
    var did = it.drugId, dd = did ? DB.DOSES[did] : null, ids = kitDrugIds(m);
    var sug = did && d.conc ? P.doseSugerida(did, pf, DB, d.conc.u) : null;
    var alertas = did ? P.alertasPaciente(did, pf, DB) : [];
    var st = M.statusValidade(it.validade);
    if (st === 'vencido') alertas.unshift({ sev: 'grave', txt: 'Item desta maleta com validade VENCIDA — não utilizar.' });
    else if (st === 'vencendo') alertas.push({ sev: 'moderada', txt: 'Vence em breve (' + it.validade.split('-').reverse().join('/') + ').' });
    if (it.qtd === 0) alertas.push({ sev: 'moderada', txt: 'Sem estoque nesta maleta.' });
    if (isHV(d)) alertas.unshift({ sev: 'grave', txt: 'Alta vigilância: dupla checagem obrigatória.' });
    var peso = { grave: 0, moderada: 1, info: 2 };
    alertas.sort(function (a, b) { return peso[a.sev] - peso[b.sev]; });

    function itemLink(drugId) {
      var x = m.itens.filter(function (i) { return i.drugId === drugId; })[0];
      return x ? '<a href="#/maleta/' + esc(m.id) + '/atender/' + esc(x.id) + '">' + esc(NOMES[drugId]) + '</a>' : esc(NOMES[drugId] || drugId);
    }
    var ints = did ? P.interacoes(did, ids, DB, NOMES) : [];
    var cont = dd && dd.via === 'continua';
    var pronto = dd && dd.via === 'pronto';
    var im = dd && dd.via === 'im';

    $app.innerHTML =
      '<a class="crumb" href="#/maleta/' + esc(m.id) + '/atender">‹ ' + esc(m.icon + ' ' + m.nome) + ' · atendimento</a>' +
      '<a class="pac-chip" href="#/maleta/' + esc(m.id) + '/atender">👤 ' + esc(pacienteResumo(pf)) + (pf.alergias.length ? ' · ⚠️ alergias' : '') + '</a>' +
      (it.nota ? '<div class="alert info">📌 <b>Protocolo local:</b> ' + esc(it.nota) + '</div>' : '') +
      alertList(alertas) +
      (did ? '<p class="rev-line">' + revisaoBadge(did) + (it.conferido ? ' <span class="badge ok">☑️ Conferido por ' + esc(it.conferido.por) + '</span>' : '') + '</p>' : '') +
      '<div class="sec"><h3>💊 Dose de referência (' + (pf.ped ? 'pediátrica' : 'adulto') + ')</h3>' +
        (sug || dd ? '<p>' + esc((sug && sug.ref) || (dd && (pf.ped ? (dd.ped && dd.ped.txt) || 'Sem dose pediátrica de referência.' : dd.adulto && dd.adulto.txt)) || '') + '</p>' +
          ((sug && sug.freq) ? '<p><b>Intervalo:</b> ' + esc(sug.freq) + '</p>' : '') +
          (sug && sug.valor != null ? '<p class="sug">Sugestão para este paciente: <b>' + esc(fmt(sug.valor, 3) + ' ' + sug.u) + '</b> <small>(' + esc(sug.calculo + (sug.limitado ? '; limitado à ' + sug.limitado : '')) + ')</small></p>' : '')
        : '<p>Sem dose de referência cadastrada' + (d.personalizado ? ' (medicamento personalizado)' : '') + '. Use a dose prescrita.</p>') +
      '</div>' +
      (cont ? '<a class="btn" href="#/infusao/' + esc(dd.infusao) + '">🫀 Calcular infusão contínua (' + esc(fmt(pf.peso, 1)) + ' kg)</a>' :
        !d.conc ? '<div class="alert warn">Cadastre a apresentação (quantidade em mL) deste medicamento na maleta para calcular o preparo.</div>' :
        '<h2>🧪 Preparo para este paciente</h2>' + apChipsHtml(listaAp, d.conc, 'data-apa') + '<form class="form" id="prf" onsubmit="return false" autocomplete="off">' +
          '<div class="field"><label for="pr-dose">Dose prescrita</label><div class="input-wrap"><input id="pr-dose" type="text" inputmode="decimal" value="' + (sug && sug.valor != null ? esc(String(sug.valor).replace('.', ',')) : '') + '" placeholder="informe a dose"><span class="unit">' + esc(d.conc.u) + '</span></div>' +
          '<small>Apresentação: ' + esc(concTxt(d.conc)) + (it.conc ? ' (da sua maleta)' : '') + '</small></div>' +
          (pronto || im ? '' : '<div class="row2"><div class="field"><label for="pr-diltipo">Diluente</label><select id="pr-diltipo">' +
            AP.diluentesDe(dd && dd.diluente).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="pr-dil">Volume do diluente</label><select id="pr-dil">' + optsHtml(AP.VOLUMES, null, labVol) + '</select></div></div>' +
            (dd && dd.diluente ? '<small class="hint-sel">Compatível pela ficha: ' + esc(dd.diluente) + '</small>' : '')) +
          (im ? '' : '<div class="field"><label for="pr-t">Tempo de administração</label><select id="pr-t">' + optsHtml(AP.TEMPOS, null, labTempo) + '</select></div>') +
        '</form><div id="prep" aria-live="polite"></div><button class="btn" id="reg-btn" type="button">✓ Registrar administração agora</button>') +
      (m.lib ? '<a class="btn ghost" href="#/compatibilidade">🔗 Checar interações com outros medicamentos</a><div hidden>' : '<div>') +
      '<h2>🔗 Interações com esta maleta</h2>' +
      (ints.length ? ints.map(function (i) {
        return '<div class="int-item ' + sevClass(i.sev) + '"><b>' + sevIcon(i.sev) + ' ' + esc(i.tipo) + '</b>' + (i.com.length ? ' — ' + i.com.map(itemLink).join(', ') : '') + '<p>' + esc(i.txt) + '</p></div>';
      }).join('') : '<p class="note">' + (did ? 'Nenhuma interação cadastrada com os outros medicamentos desta maleta.' : 'Medicamento personalizado: interações não verificadas.') + '</p>') +
      '<p class="note">A checagem cobre interações e incompatibilidades importantes e frequentes; não é exaustiva. Em caso de dúvida, consulte a farmácia.</p></div>' +
      '<details class="sheet-box"><summary>📄 Ficha completa e referências</summary>' + drugSheetHtml(d, true) + refsHtml(d, it) + '</details>';

    if (cont || !d.conc) return;
    var $d = document.getElementById('pr-dose'), $dil = document.getElementById('pr-dil'), $t = document.getElementById('pr-t'), $tipo = document.getElementById('pr-diltipo');
    function dilNome() { return $tipo ? $tipo.value : ((dd && dd.diluente) || 'diluente'); }
    $app.querySelectorAll('[data-apa]').forEach(function (b) {
      b.onclick = function () {
        var a = listaAp[+b.getAttribute('data-apa')];
        if (m.lib) apSet(it.drugId, a);
        else { it.conc = M.cleanConc(a); saveMaleta(m); toast('Apresentação salva na maleta.'); }
        viewAtenderItem(id, itemId);
      };
    });
    var dirtyDil = false, dirtyT = false, ultimo = null;
    function defaults() {
      var pad = P.preparoPadrao(did, num($d.value), d.conc, pf, DB);
      if ($dil && !dirtyDil) setSel($dil, pad.diluenteMl, AP.VOLUMES, labVol);
      if ($t && !dirtyT) setSel($t, pad.tempo, AP.TEMPOS, labTempo);
    }
    function run() {
      var dose = num($d.value), out = document.getElementById('prep');
      var r = P.preparo(did, dose, d.conc, pf, DB, $dil ? num($dil.value) || 0 : 0, $t ? num($t.value) || 0 : 0);
      if (!r) { out.innerHTML = resultsHtml(null); return; }
      var steps = [];
      var rec = d.reconstituicao && !/^(Solução pronta|Não necessita)/.test(d.reconstituicao) ? d.reconstituicao : '';
      if (rec) steps.push('<b>Reconstituir:</b> ' + esc(rec));
      steps.push(r.via === 'pronto' ? '<b>Separar</b> <span class="big">' + fmt(r.aspirar, 1) + ' mL</span> da bolsa pronta (' + esc(concTxt(d.conc)) + ')'
        : '<b>Aspirar</b> <span class="big">' + fmt(r.aspirar, 2) + ' mL</span>' + (r.unidades > 1.0001 ? ' (' + fmt(r.unidades, 2) + ' unidades)' : ''));
      if (r.diluenteMl > 0) steps.push('<b>Diluir</b> em ' + fmt(r.diluenteMl, 0) + ' mL de ' + esc(dilNome()) + ' → volume final <b>' + fmt(r.total, 1) + ' mL</b> (' + fmt(r.concFinal, 3) + ' ' + esc(d.conc.u) + '/mL)');
      if (r.via === 'im') steps.push('<b>Aplicar</b> por via ' + esc(dd.viaTxt || 'IM/SC'));
      else if (r.tempo > 0) {
        steps.push((r.diluenteMl > 0 || r.via === 'pronto' ? '<b>Infundir</b> em ' : '<b>Administrar EV lento</b> em ') + fmtTempo(r.tempo) +
          (r.diluenteMl > 0 || r.via === 'pronto' ? ': <span class="big">' + fmt(r.mlh, 1) + ' mL/h</span> na bomba · ' + fmt(Math.round(r.gts), 0) + ' gts/min · ' + fmt(Math.round(r.mcgts), 0) + ' mcgts/min' : ''));
      } else steps.push('<b>Administrar</b> em bolus');
      if (dd && dd.admTxt) steps.push(esc(dd.admTxt));
      var av = r.avisos.slice();
      if (sug && sug.max != null && dose > sug.max * 1.001) av.unshift('Dose acima da máxima de referência (' + fmt(sug.max, 3) + ' ' + d.conc.u + '). Confirme com o prescritor.');
      if (sug && sug.valor != null && (dose > sug.valor * 2 || dose < sug.valor / 2)) av.push('Dose muito diferente da sugestão (' + fmt(sug.valor, 3) + ' ' + d.conc.u + '). Confira a prescrição e a unidade.');
      ultimo = { dose: fmt(dose, 3) + ' ' + d.conc.u, prep: (r.via === 'im' ? 'aspirar ' + fmt(r.aspirar, 2) + ' mL; via ' + (dd.viaTxt || 'IM/SC')
        : (r.via === 'pronto' ? fmt(r.aspirar, 1) + ' mL da bolsa' : 'aspirar ' + fmt(r.aspirar, 2) + ' mL') +
          (r.diluenteMl > 0 ? '; diluir em ' + fmt(r.diluenteMl, 0) + ' mL de ' + dilNome() : '') +
          (r.tempo > 0 ? '; ' + (r.diluenteMl > 0 || r.via === 'pronto' ? 'infundir' : 'EV lento') + ' em ' + fmtTempo(r.tempo) + (r.mlh && (r.diluenteMl > 0 || r.via === 'pronto') ? ' (' + fmt(r.mlh, 1) + ' mL/h)' : '') : '; bolus')) };
      out.innerHTML = '<ol class="steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
        av.map(function (a) { return '<div class="alert warn">⚠️ ' + esc(a) + '</div>'; }).join('');
    }
    document.getElementById('reg-btn').onclick = function () {
      if (!ultimo || !(num($d.value) > 0)) { toast('Informe a dose antes de registrar.', true); return; }
      var dados = ultimo;
      confirmar9Certos(d.nome).then(function (sim) {
        if (!sim) return;
        var reg = loadRegistro();
        reg.push({ t: new Date().toISOString(), nome: d.nome, dose: dados.dose, prep: dados.prep, certos: true });
        store.set('registro', reg.slice(-200));
        toast('Administração registrada às ' + hhmm(reg[reg.length - 1].t) + ' (9 certos conferidos).');
      });
    };
    $d.addEventListener('input', function () { defaults(); run(); });
    if ($dil) { $dil.addEventListener('change', function () { dirtyDil = true; run(); }); bindOutro($dil, 'mL', AP.VOLUMES, labVol, run); }
    if ($t) { $t.addEventListener('change', function () { dirtyT = true; run(); }); bindOutro($t, 'minutos', AP.TEMPOS, labTempo, run); }
    if ($tipo) $tipo.addEventListener('change', run);
    defaults(); run();
  }

  function fmtTempo(min) {
    if (min < 1) return Math.round(min * 60) + ' s';
    return min >= 60 ? fmtHM(min) : fmt(min, 1) + ' min';
  }

  // ---- Registro de administração (atendimento) ----
  function loadRegistro() { var r = store.get('registro', []); return Array.isArray(r) ? r : []; }
  function hhmm(iso) { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function textoResumo(m) {
    var pf = P.perfil(loadPaciente()), reg = loadRegistro();
    var al = pf.alergias.map(function (a) { var x = DB.ALERGIAS.filter(function (y) { return y.id === a; })[0]; return x ? x.nome : a; });
    return 'EnfCalc — resumo do atendimento (' + new Date().toLocaleDateString('pt-BR') + ')\n' +
      'Paciente: ' + pacienteResumo(pf) + (al.length ? ' · Alergias: ' + al.join(', ') : '') + '\n' +
      (m && !m.lib ? 'Maleta: ' + m.nome + '\n' : '') + '\n' +
      reg.map(function (e) { return hhmm(e.t) + ' — ' + e.nome + ' ' + e.dose + (e.prep ? ': ' + e.prep : '') + (e.certos ? ' [9 certos conferidos]' : ''); }).join('\n') +
      '\n\nGerado pelo EnfCalc (ferramenta de apoio; confira a prescrição).';
  }
  function compartilharTexto(txt, titulo) {
    if (navigator.share && !EMBED) { navigator.share({ title: titulo, text: txt }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(txt).then(function () { toast('Resumo copiado.'); }, function () { toast('Não foi possível copiar.', true); }); }
    catch (e) { toast('Não foi possível copiar.', true); }
  }
  function registroHtml(m) {
    var reg = loadRegistro();
    if (!reg.length) return '';
    return '<details class="reg-box" open><summary>📝 Registro deste atendimento (' + reg.length + ')</summary><ul class="reg-list">' +
      reg.map(function (e) { return '<li><b>' + esc(hhmm(e.t)) + '</b> ' + esc(e.nome) + ' ' + esc(e.dose) + (e.prep ? '<small>' + esc(e.prep) + '</small>' : '') + '</li>'; }).join('') +
      '</ul><div class="row"><button class="btn sm" type="button" id="reg-share">📤 Copiar/compartilhar resumo</button><button class="btn sm ghost" type="button" id="reg-clear">Limpar</button></div></details>';
  }
  function bindRegistro(m, rerender) {
    var sh = document.getElementById('reg-share'), cl = document.getElementById('reg-clear');
    if (sh) sh.onclick = function () { compartilharTexto(textoResumo(m), 'Resumo do atendimento'); };
    if (cl) cl.onclick = function () { ask({ titulo: 'Limpar registro', msg: 'Apagar o registro deste atendimento?', ok: 'Apagar', perigo: true }).then(function (sim) { if (sim) { store.set('registro', []); rerender(); } }); };
  }

  // ---- Verificador de interações/compatibilidade (avulso) ----
  function viewCompat(preMaleta) {
    setHeader('Interações e compatibilidade', true);
    var sel = [];
    var m = preMaleta ? getMaleta(preMaleta) : null;
    if (m) sel = kitDrugIds(m);
    var ms = loadMaletas();
    var drugs = D.DRUGS.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
    $app.innerHTML =
      '<p class="lead">Escolha dois ou mais medicamentos para ver interações clínicas, incompatibilidades (mesma via/seringa), vias exclusivas e antídotos.</p>' +
      (ms.length ? '<div class="field"><label for="cp-m">Carregar de uma maleta</label><select id="cp-m"><option value="">—</option>' +
        ms.map(function (x) { return '<option value="' + esc(x.id) + '"' + (m && m.id === x.id ? ' selected' : '') + '>' + esc(x.icon + ' ' + x.nome) + '</option>'; }).join('') + '</select></div>' : '') +
      '<div id="cp-sel" class="pchips"></div><div id="cp-out" aria-live="polite"></div>' +
      '<h2>Medicamentos</h2><div class="search"><input id="cp-q" type="search" placeholder="Buscar medicamento…" aria-label="Buscar medicamento"></div>' +
      '<div class="list picks" id="cp-l">' + drugs.map(function (d) {
        return '<label class="pick" data-name="' + esc(norm(d.nome + ' ' + d.classe)) + '"><input type="checkbox" value="' + esc(d.id) + '"' + (sel.indexOf(d.id) >= 0 ? ' checked' : '') + '><span class="card-t"><b>' + esc(d.nome) + '</b><small>' + esc(d.classe) + '</small></span></label>';
      }).join('') + '</div>';
    var list = document.getElementById('cp-l');
    function render() {
      sel = [].map.call(list.querySelectorAll('input:checked'), function (i) { return i.value; });
      document.getElementById('cp-sel').innerHTML = sel.map(function (id) { return '<span class="pchip">' + esc(NOMES[id]) + '</span>'; }).join('');
      var out = document.getElementById('cp-out');
      if (sel.length < 2) { out.innerHTML = '<div class="result empty">Selecione pelo menos 2 medicamentos.</div>'; return; }
      var geral = P.interacoesMaleta(sel, DB);
      var excl = sel.filter(function (id) { return DB.VIA_EXCLUSIVA[id]; });
      var ants = [];
      sel.forEach(function (id) { var a = DB.ANTIDOTOS[id]; if (typeof a === 'string') ants.push({ de: id, ant: a, tem: sel.indexOf(a) >= 0 }); });
      out.innerHTML =
        (geral.length ? geral.map(function (g) {
          return '<div class="int-item ' + sevClass(g.sev) + '"><b>' + sevIcon(g.sev) + ' ' + esc(g.mesmoGrupo ? g.a.map(nm).join(' + ') : g.a.map(nm).join(', ') + ' + ' + g.b.map(nm).join(', ')) + '</b> <span class="badge ' + sevClass(g.sev) + '">' + esc(g.tipo) + '</span><p>' + esc(g.txt) + '</p></div>';
        }).join('') : '<div class="alert ok-box">✅ Nenhuma interação ou incompatibilidade cadastrada entre os selecionados.</div>') +
        excl.map(function (id) { return '<div class="int-item warn"><b>⚠️ Via exclusiva — ' + esc(NOMES[id]) + '</b><p>' + esc(DB.VIA_EXCLUSIVA[id]) + '</p></div>'; }).join('') +
        ants.map(function (a) { return '<div class="int-item ' + (a.tem ? 'info' : 'warn') + '"><b>' + (a.tem ? 'ℹ️' : '⚠️') + ' Antídoto de ' + esc(NOMES[a.de]) + ':</b> ' + esc(NOMES[a.ant]) + (a.tem ? ' (selecionado)' : ' — não está entre os selecionados') + '</div>'; }).join('') +
        '<p class="note">“Nenhuma interação cadastrada” não garante compatibilidade em Y. A checagem cobre as interações mais importantes; em caso de dúvida consulte a farmácia (Trissel’s, Micromedex).</p>';
    }
    list.onchange = render;
    document.getElementById('cp-q').oninput = function (e) {
      var t = norm(e.target.value.trim());
      list.querySelectorAll('.pick').forEach(function (p) { p.hidden = t && p.getAttribute('data-name').indexOf(t) < 0; });
    };
    var cm = document.getElementById('cp-m');
    if (cm) cm.onchange = function () { location.hash = cm.value ? '#/compatibilidade/' + cm.value : '#/compatibilidade'; };
    render();
  }

  // ---- Emergência pediátrica ----
  function viewEmergPed() {
    setHeader('Emergência pediátrica', true);
    var E = window.Emergencia;
    var pac = loadPaciente(), pf0 = P.perfil(pac);
    $app.innerHTML =
      '<p class="lead">Doses, energias e materiais por idade e peso (PALS/APLS). Use o peso real sempre que disponível.</p>' +
      '<form class="form" id="ep-f" onsubmit="return false" autocomplete="off">' +
        '<div class="field"><label for="ep-id">Idade</label><div class="input-wrap"><input id="ep-id" type="text" inputmode="decimal" value="' + (pf0.ped && pac.idade != null ? esc(String(pac.idade).replace('.', ',')) : '') + '">' +
          '<select class="unit" id="ep-u" aria-label="Unidade"><option value="anos"' + (pac.idadeU !== 'meses' ? ' selected' : '') + '>anos</option><option value="meses"' + (pac.idadeU === 'meses' ? ' selected' : '') + '>meses</option></select></div></div>' +
        '<div class="field"><label for="ep-p">Peso real (se souber)</label><div class="input-wrap"><input id="ep-p" type="text" inputmode="decimal" placeholder="vazio = estimar pela idade" value="' + (pf0.ped && pac.peso ? esc(String(pac.peso).replace('.', ',')) : '') + '"><span class="unit">kg</span></div></div>' +
      '</form><div id="ep-out" aria-live="polite"></div>' +
      '<a class="btn" href="#/pcr">🚨 Abrir modo PCR</a>' +
      '<p class="note">Fontes: algoritmo PALS de PCR (AHA); fórmulas APLS de estimativa de peso; cânula com cuff idade/4 + 3,5. Fórmulas de peso são menos precisas fora de 1–10 anos.</p>';
    function linhaDroga(id, rotulo, porKg, max, min, u, extra) {
      var d = D.DRUGS.filter(function (x) { return x.id === id; })[0];
      return { d: d, rotulo: rotulo, porKg: porKg, max: max, min: min, u: u || (d && d.conc.u), extra: extra || '' };
    }
    function run() {
      var idade = num(document.getElementById('ep-id').value), u = document.getElementById('ep-u').value;
      var meses = isFinite(idade) ? (u === 'meses' ? idade : idade * 12) : null;
      var pReal = num(document.getElementById('ep-p').value);
      var est = meses != null ? E.pesoEstimado(meses) : null;
      var peso = pReal > 0 ? pReal : est ? est.kg : null;
      var out = document.getElementById('ep-out');
      if (!peso) { out.innerHTML = '<div class="result empty">Informe a idade (até 12 anos) ou o peso.</div>'; return; }
      var tubo = meses != null ? E.tuboTraqueal(meses) : null, en = E.energias(peso);
      var rows = [
        { label: 'Peso utilizado', value: fmt(peso, 1), unit: 'kg', main: true, sub: pReal > 0 ? 'Peso real informado' : 'Estimado: ' + est.formula },
        { label: 'Cânula traqueal com cuff', value: tubo ? fmt(tubo.comCuff, 1) : '—', unit: tubo ? 'mm' : '', sub: tubo ? 'Sem cuff: ' + fmt(tubo.semCuff, 1) + ' mm · ter ±0,5 mm à mão' : 'Fórmula válida a partir de 2 anos — usar fita/tabela por comprimento' },
        { label: 'Desfibrilação', value: fmt(en.desf1, 0) + ' → ' + fmt(en.desf2, 0), unit: 'J', sub: '2 J/kg → 4 J/kg; seguintes ≥ 4 J/kg (máx. ' + fmt(en.desfMax, 0) + ' J = 10 J/kg ou dose adulta)' },
        { label: 'Cardioversão sincronizada', value: fmt(en.cardio1[0], 1) + '–' + fmt(en.cardio1[1], 0), unit: 'J', sub: '0,5–1 J/kg; se necessário até ' + fmt(en.cardio2, 0) + ' J (2 J/kg)' },
        { label: 'Bolus de volume (choque)', value: fmt(10 * peso, 0) + '–' + fmt(20 * peso, 0), unit: 'mL', sub: '10–20 mL/kg de cristaloide com reavaliação após cada bolus' },
        { label: 'Glicose 10% (hipoglicemia)', value: fmt(2 * peso, 0) + '–' + fmt(5 * peso, 0), unit: 'mL', sub: '2–5 mL/kg (0,2–0,5 g/kg)' }
      ];
      var hol = C.holliday(peso);
      if (hol) rows.push({ label: 'Hidratação de manutenção', value: fmt(hol.mlH, 0), unit: 'mL/h', sub: 'Holliday-Segar: ' + fmt(hol.mlDia, 0) + ' mL/dia' });
      var drogas = [
        linhaDroga('adrenalina', 'Adrenalina (PCR)', 0.01, 1, null, 'mg', 'Solução 0,1 mg/mL (1 mL + 9 mL SF): ' + fmt(Math.min(0.01 * peso, 1) / 0.1, 1) + ' mL'),
        linhaDroga('amiodarona', 'Amiodarona (FV/TVSP)', 5, 300),
        linhaDroga('adenosina', 'Adenosina — 1ª dose', 0.1, 6),
        linhaDroga('adenosina', 'Adenosina — 2ª dose', 0.2, 12),
        linhaDroga('atropina', 'Atropina', 0.02, 0.5, 0.1),
        linhaDroga('midazolam', 'Midazolam (crise convulsiva)', 0.1, 5),
        linhaDroga('diazepam', 'Diazepam (crise convulsiva)', 0.3, 10),
        linhaDroga('naloxona', 'Naloxona (intoxicação por opioide)', 0.1, 2),
        linhaDroga('hidrocortisona', 'Hidrocortisona', 2, 100),
        linhaDroga('gluconato-calcio', 'Gluconato de cálcio 10%', 60, 2000),
        linhaDroga('bicarbonato', 'Bicarbonato de sódio 8,4%', 1, null, null, 'mEq', 'Neonatos: usar 4,2%')
      ];
      var tab = drogas.map(function (x) {
        var v = x.porKg * peso;
        if (x.min != null && v < x.min) v = x.min;
        var lim = x.max != null && v > x.max; if (lim) v = x.max;
        var ml = x.d ? v * x.d.conc.vol / x.d.conc.qtd : null;
        return '<tr><td><b>' + esc(x.rotulo) + '</b><small>' + fmt(x.porKg, 3) + ' ' + esc(x.u) + '/kg' + (x.max != null ? ' · máx. ' + fmt(x.max, 3) : '') + (x.min != null ? ' · mín. ' + fmt(x.min, 3) : '') + (x.extra ? ' · ' + esc(x.extra) : '') + '</small></td>' +
          '<td class="num">' + fmt(v, 3) + ' ' + esc(x.u) + (lim ? ' <small>(máx.)</small>' : '') + '</td><td class="num">' + (ml != null ? fmt(ml, 2) + ' mL' : '—') + '<small>' + (x.d ? esc(concTxt(x.d.conc)) : '') + '</small></td></tr>';
      }).join('');
      out.innerHTML = resultsHtml({ results: rows }) +
        '<h3>Medicações de emergência</h3><div class="tbl-wrap"><table class="tbl ep"><thead><tr><th>Medicamento</th><th>Dose</th><th>Volume*</th></tr></thead><tbody>' + tab + '</tbody></table></div>' +
        '<p class="note">* Volume a aspirar da apresentação da biblioteca (confira a ampola disponível). Doses de referência — siga o protocolo e a prescrição.</p>';
    }
    document.getElementById('ep-f').addEventListener('input', run);
    document.getElementById('ep-f').addEventListener('change', run);
    run();
  }

  // ---- Modo PCR ----
  var pcrTimer = null, metroTimer = null, audioCtx = null, wakeLock = null;
  function beep(freq, dur) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq || 880; g.gain.value = 0.15;
      o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + (dur || 0.15));
    } catch (e) { /* sem áudio */ }
  }
  function pararPCRTimers() {
    if (pcrTimer) { clearInterval(pcrTimer); pcrTimer = null; }
    if (metroTimer) { clearInterval(metroTimer); metroTimer = null; }
    if (wakeLock) { try { wakeLock.release(); } catch (e) { /* ok */ } wakeLock = null; }
  }

  function viewPCR() {
    setHeader('Modo PCR', true);
    var E = window.Emergencia;
    var st = store.get('pcr', null);

    if (!st || !st.inicio) {
      var pac = loadPaciente();
      $app.innerHTML =
        '<div class="alert bad">🚨 Use em conjunto com o protocolo de RCP da instituição. O app apoia o registro e os tempos; não substitui o líder da reanimação.</div>' +
        '<form class="form" id="pcr-f" onsubmit="return false"><div class="field"><span class="lbl">Paciente</span><div class="seg">' +
          '<label class="seg-opt"><input type="radio" name="pcr-m" value="adulto" checked><span>Adulto</span></label>' +
          '<label class="seg-opt"><input type="radio" name="pcr-m" value="ped"><span>Pediátrico</span></label></div></div>' +
          '<div class="field" id="pcr-pf" hidden><label for="pcr-p">Peso (kg)</label><div class="input-wrap"><input id="pcr-p" type="text" inputmode="decimal" value="' + (pac.peso ? esc(String(pac.peso).replace('.', ',')) : '') + '"><span class="unit">kg</span></div><small>Sem peso? Estime em Emergência pediátrica.</small></div>' +
        '</form><button class="btn pcr-start" id="pcr-go" type="button">▶ INICIAR PCR</button>' +
        '<p class="note">Registra horário de início, ciclos de 2 min, adrenalina (lembrete 3–5 min), choques, amiodarona, via aérea, acesso e RCE, e gera um resumo para o prontuário. Fonte: diretrizes AHA de RCP.</p>';
      var f = document.getElementById('pcr-f');
      f.onchange = function () { document.getElementById('pcr-pf').hidden = f.querySelector('input[name=pcr-m]:checked').value !== 'ped'; };
      document.getElementById('pcr-go').onclick = function () {
        var modo = f.querySelector('input[name=pcr-m]:checked').value, peso = num(document.getElementById('pcr-p').value);
        if (modo === 'ped' && !(peso > 0)) { toast('Informe o peso da criança.', true); document.getElementById('pcr-p').focus(); return; }
        var agora = Date.now();
        store.set('pcr', { inicio: agora, ciclo: agora, modo: modo, peso: modo === 'ped' ? peso : null, ultimaAdr: null, nChoques: 0, nAmio: 0, eventos: [{ t: agora, txt: 'Início da PCR / RCP iniciada' }], causas: [] });
        beep(660, 0.2);
        viewPCR();
      };
      return;
    }

    var ped = st.modo === 'ped', doses = E.dosesPCR(ped, st.peso), en = ped ? E.energias(st.peso) : null;
    function salvar() { store.set('pcr', st); }
    function registrar(txt) { st.eventos.push({ t: Date.now(), txt: txt }); salvar(); renderLog(); }

    $app.innerHTML =
      '<div class="pcr-top"><div><small>Tempo total</small><b id="pcr-total">00:00</b></div><div><small>' + (ped ? 'Pediátrico · ' + fmt(st.peso, 1) + ' kg' : 'Adulto') + '</small><b id="pcr-clock"></b></div></div>' +
      (st.fim ? '' :
      '<div class="pcr-card" id="pcr-ciclo"><div class="pcr-row"><span>Ciclo de RCP (2 min)</span><b id="pcr-cic">02:00</b></div><div class="progress"><div class="bar" id="pcr-bar"></div></div>' +
        '<button class="btn" id="pcr-ritmo" type="button">🔎 Ritmo checado / trocar compressor → novo ciclo</button></div>' +
      '<div class="pcr-card" id="pcr-adr"><div class="pcr-row"><span>💉 Adrenalina</span><b id="pcr-adr-st"></b></div><small>' + esc(doses.adrenalina.txt) + ' · a cada 3–5 min</small>' +
        '<button class="btn" id="pcr-adr-b" type="button">Registrar adrenalina</button></div>' +
      '<div class="pcr-grid">' +
        '<button class="btn warnb" id="pcr-choque" type="button">⚡ Choque<small id="pcr-choque-s"></small></button>' +
        '<button class="btn ghost" id="pcr-amio" type="button">💊 Amiodarona<small id="pcr-amio-s"></small></button>' +
        '<button class="btn ghost" data-ev="Via aérea avançada instalada" type="button">🫁 Via aérea avançada</button>' +
        '<button class="btn ghost" data-ev="Acesso venoso/IO obtido" type="button">🩸 Acesso IV/IO</button>' +
        '<button class="btn ghost" id="pcr-outro" type="button">✏️ Outro evento</button>' +
        '<button class="btn okb" id="pcr-rce" type="button">❤️ RCE</button>' +
      '</div>' +
      '<div class="pcr-card"><div class="pcr-row"><span>🎵 Metrônomo 110/min</span><button class="btn sm ghost" id="pcr-metro" type="button">Ligar</button></div>' +
        '<small>' + (ped ? 'Compressão ≥ 1/3 do diâmetro do tórax (~4 cm lactente, ~5 cm criança). 15:2 com 2 socorristas; com via aérea avançada, 1 ventilação a cada 2–3 s.'
                        : 'Compressão 5–6 cm, 100–120/min, retorno total do tórax. 30:2; com via aérea avançada, 1 ventilação a cada 6 s.') + '</small></div>' +
      '<details class="pcr-card"><summary>🧩 Causas reversíveis (5H e 5T)</summary><div class="chips causas">' + E.CAUSAS.map(function (c, i) {
        return '<label class="chip"><input type="checkbox" data-c="' + i + '"' + (st.causas.indexOf(i) >= 0 ? ' checked' : '') + '><span>' + esc(c) + '</span></label>';
      }).join('') + '</div></details>' +
      '<button class="btn danger" id="pcr-fim" type="button">⏹ Encerrar PCR</button>') +
      '<h2>Registro</h2><ol class="pcr-log" id="pcr-log"></ol>' +
      (st.fim ? '<button class="btn" id="pcr-share" type="button">📤 Copiar/compartilhar resumo</button><button class="btn ghost" id="pcr-nova" type="button">Nova PCR (apagar registro)</button>' : '');

    var $ = function (id) { return document.getElementById(id); };
    function rel(t) { return E.mmss((t - st.inicio) / 1000); }
    function renderLog() {
      $('pcr-log').innerHTML = st.eventos.slice().reverse().map(function (e) {
        return '<li><b>' + rel(e.t) + '</b> <small>' + new Date(e.t).toLocaleTimeString('pt-BR') + '</small> ' + esc(e.txt) + '</li>';
      }).join('');
      if ($('pcr-choque-s')) {
        var n = st.nChoques + 1;
        $('pcr-choque-s').textContent = ped ? (n === 1 ? fmt(en.desf1, 0) : fmt(en.desf2, 0)) + ' J (' + (n === 1 ? '2' : '4') + ' J/kg)' : 'bifásico conforme aparelho';
        var a = ped ? doses.amiodarona[0] : doses.amiodarona[Math.min(st.nAmio, 1)];
        $('pcr-amio-s').textContent = (ped && st.nAmio >= 3) || (!ped && st.nAmio >= 2) ? 'doses máximas registradas' : a.txt;
      }
    }
    function tick() {
      var agora = Date.now();
      $('pcr-total').textContent = E.mmss(((st.fim || agora) - st.inicio) / 1000);
      $('pcr-clock').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (st.fim) return;
      var dc = (agora - st.ciclo) / 1000, rest = 120 - dc;
      $('pcr-cic').textContent = rest > 0 ? E.mmss(rest) : '+' + E.mmss(-rest);
      $('pcr-bar').style.width = Math.min(100, dc / 120 * 100) + '%';
      var alerta = rest <= 0;
      $('pcr-ciclo').classList.toggle('alarm', alerta);
      if (alerta && !st.avisouCiclo) { st.avisouCiclo = true; salvar(); beep(990, 0.4); try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { /* ok */ } }
      var sa = E.statusAdrenalina(st.ultimaAdr ? (agora - st.ultimaAdr) / 1000 : null);
      $('pcr-adr-st').textContent = sa.txt;
      $('pcr-adr').className = 'pcr-card adr-' + sa.fase;
      if (sa.fase === 'janela' && !st.avisouAdr) { st.avisouAdr = true; salvar(); beep(740, 0.3); }
    }

    renderLog(); tick();
    pararPCRTimers();
    pcrTimer = setInterval(tick, 500);
    try { if (navigator.wakeLock && !st.fim) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }).catch(function () {}); } catch (e) { /* ok */ }

    if (!st.fim) {
      $('pcr-ritmo').onclick = function () { st.ciclo = Date.now(); st.avisouCiclo = false; registrar('Checagem de ritmo / troca de compressor — novo ciclo'); };
      $('pcr-adr-b').onclick = function () { st.ultimaAdr = Date.now(); st.avisouAdr = false; registrar('Adrenalina ' + doses.adrenalina.txt.split(' EV')[0].split(' = ')[0]); };
      $('pcr-choque').onclick = function () {
        st.nChoques++;
        registrar('Choque nº ' + st.nChoques + (ped ? ' — ' + fmt(st.nChoques === 1 ? en.desf1 : en.desf2, 0) + ' J' : ''));
      };
      $('pcr-amio').onclick = function () {
        var a = ped ? doses.amiodarona[0] : doses.amiodarona[Math.min(st.nAmio, 1)];
        st.nAmio++; registrar('Amiodarona (dose ' + st.nAmio + ') — ' + fmt(a.mg, 3) + ' mg');
      };
      $app.querySelectorAll('[data-ev]').forEach(function (b) { b.onclick = function () { registrar(b.getAttribute('data-ev')); }; });
      $('pcr-outro').onclick = function () { ask({ titulo: 'Outro evento', input: true, ph: 'Ex.: ritmo FV, intubação, bicarbonato 50 mEq', ok: 'Registrar' }).then(function (t) { if (t && t.trim()) registrar(t.trim().slice(0, 200)); }); };
      $('pcr-rce').onclick = function () { registrar('RCE — retorno da circulação espontânea'); };
      $app.querySelectorAll('[data-c]').forEach(function (c) {
        c.onchange = function () {
          var i = +c.getAttribute('data-c');
          st.causas = st.causas.filter(function (x) { return x !== i; });
          if (c.checked) { st.causas.push(i); registrar('Causa considerada/tratada: ' + E.CAUSAS[i]); } else salvar();
        };
      });
      $('pcr-metro').onclick = function () {
        if (metroTimer) { clearInterval(metroTimer); metroTimer = null; this.textContent = 'Ligar'; return; }
        beep(1200, 0.04); metroTimer = setInterval(function () { beep(1200, 0.04); }, 60000 / 110); this.textContent = 'Desligar';
      };
      $('pcr-fim').onclick = function () {
        ask({ titulo: 'Encerrar PCR', msg: 'Desfecho (opcional):', input: true, ph: 'Ex.: RCE, óbito constatado, transferido', ok: 'Encerrar', perigo: true }).then(function (r) {
          if (r === null) return;
          st.eventos.push({ t: Date.now(), txt: 'Encerramento' + (r.trim() ? ': ' + r.trim().slice(0, 200) : '') });
          st.fim = Date.now(); salvar(); pararPCRTimers(); viewPCR();
        });
      };
    } else {
      $('pcr-share').onclick = function () {
        var txt = 'EnfCalc — registro de PCR (' + new Date(st.inicio).toLocaleDateString('pt-BR') + ')\n' +
          'Paciente: ' + (ped ? 'pediátrico, ' + fmt(st.peso, 1) + ' kg' : 'adulto') + '\nDuração: ' + E.mmss((st.fim - st.inicio) / 1000) +
          ' · Adrenalinas: ' + st.eventos.filter(function (e) { return /^Adrenalina/.test(e.txt); }).length + ' · Choques: ' + st.nChoques + '\n\n' +
          st.eventos.map(function (e) { return new Date(e.t).toLocaleTimeString('pt-BR') + ' (' + rel(e.t) + ') — ' + e.txt; }).join('\n') +
          '\n\nRegistro de apoio gerado pelo EnfCalc; transcrever para o prontuário.';
        compartilharTexto(txt, 'Registro de PCR');
      };
      $('pcr-nova').onclick = function () { ask({ titulo: 'Nova PCR', msg: 'Apagar este registro de PCR? Copie o resumo antes, se ainda não copiou.', ok: 'Apagar', perigo: true }).then(function (sim) { if (sim) { store.set('pcr', null); viewPCR(); } }); };
    }
  }

  // ---- Sequência rápida de intubação ----
  function viewSRI() {
    setHeader('Intubação (SRI)', true);
    var E = window.Emergencia, pac = loadPaciente();
    var sel = store.get('sri', { pre: 'fentanil', ind: 'etomidato', bnm: 'rocuronio' });
    var concSel = store.get('sriConc', {});
    var seq = store.get('sriSeq', null);
    var GR = [
      { k: 'pre', titulo: 'Pré-tratamento', ops: [['fentanil', 'Fentanil'], ['', 'Nenhum']], dica: 'Atenua a resposta simpática; omitir em hipotensão/choque.' },
      { k: 'ind', titulo: 'Indutor', ops: [['etomidato', 'Etomidato'], ['cetamina', 'Cetamina'], ['propofol', 'Propofol'], ['midazolam', 'Midazolam']], dica: 'Instável/choque: cetamina ou etomidato. Broncoespasmo: cetamina. Estável: propofol.' },
      { k: 'bnm', titulo: 'Bloqueador neuromuscular', ops: [['rocuronio', 'Rocurônio'], ['succinilcolina', 'Succinilcolina']], dica: 'Hipercalemia, queimado/esmagamento > 24 h, doença neuromuscular: usar rocurônio.' }
    ];
    $app.innerHTML =
      '<p class="lead">Escolha as drogas e as ampolas disponíveis: o app calcula dose e volume e guia a sequência com cronômetro.</p>' +
      '<form class="form" id="sri-f" onsubmit="return false" autocomplete="off">' +
        '<div class="field two"><div><label for="sri-p">Peso</label><div class="input-wrap"><input id="sri-p" type="text" inputmode="decimal" value="' + (pac.peso ? esc(String(pac.peso).replace('.', ',')) : '70') + '"><span class="unit">kg</span></div></div>' +
        '<div><label for="sri-a">Altura</label><div class="input-wrap"><input id="sri-a" type="text" inputmode="decimal" value="' + (pac.altura ? esc(String(pac.altura).replace('.', ',')) : '') + '" placeholder="p/ ventilação"><span class="unit">cm</span></div></div></div>' +
        '<div class="field"><span class="lbl">Paciente</span><div class="seg"><label class="seg-opt"><input type="radio" name="sri-m" value="a" checked><span>Adulto</span></label><label class="seg-opt"><input type="radio" name="sri-m" value="p"><span>Pediátrico</span></label></div></div>' +
        '<div class="field" id="sri-sx"><span class="lbl">Sexo (peso predito)</span><div class="seg"><label class="seg-opt"><input type="radio" name="sri-s" value="m"' + (pac.sexo === 'm' ? ' checked' : '') + '><span>Masculino</span></label><label class="seg-opt"><input type="radio" name="sri-s" value="f"' + (pac.sexo === 'f' ? ' checked' : '') + '><span>Feminino</span></label></div></div>' +
        '<div class="field" id="sri-idw" hidden><label for="sri-id">Idade</label><div class="input-wrap"><input id="sri-id" type="text" inputmode="decimal" value=""><span class="unit">anos</span></div></div>' +
      '</form>' +
      '<h2>1 · Preparar (SOAP-ME)</h2><div class="sec chk"><div class="chips col">' +
        ['Sucção testada e ao alcance', 'Oxigênio: pré-oxigenação por 3 min (máscara com reservatório ou VNI)', 'Via aérea: laringoscópio testado, cânulas (tamanho e ½ menor), fio-guia, bougie, dispositivo supraglótico de resgate',
         'Posição: alinhamento orelha–esterno, cabeceira elevada', 'Monitorização: ECG, PA, SpO₂ e capnografia', 'Medicações aspiradas, rotuladas e acesso venoso pérvio; vasopressor à mão'].map(function (t, i) {
          return '<label class="chk-i"><input type="checkbox" id="sri-c' + i + '"><span>' + esc(t) + '</span></label>'; }).join('') + '</div></div>' +
      '<h2>2 · Escolher drogas e ampolas</h2><div id="sri-esc"></div>' +
      '<h2>3 · Sequência</h2><div id="sri-seq"></div>' +
      '<h2>4 · Ventilação mecânica inicial</h2><div id="sri-vent"></div>' +
      '<h2>5 · Depois de intubar</h2><div class="sec"><ul class="howto">' +
        '<li>Confirmar com capnografia (onda contínua) e ausculta; observar expansão torácica.</li><li>Fixar a cânula e anotar a marca na rima labial.</li>' +
        '<li>Iniciar sedoanalgesia contínua (o bloqueador dura mais que o indutor).</li><li>Raio X de tórax; gasometria em 30–60 min; ajustar o ventilador.</li></ul>' +
        '<a class="btn ghost" href="#/infusao/fentanil">🫀 Sedação contínua (fentanil, midazolam, propofol)</a></div>' +
      '<p class="note">Fontes: MSD Manuals (medicamentos para intubação); protocolo de via aérea HCFMUSP; WikEM; Diretrizes Brasileiras de Ventilação Mecânica AMIB/SBPT 2013 (atualização em andamento desde 2023); protocolo ARDSNet. Doses de referência — siga o protocolo do serviço e a decisão da equipe médica.</p>';

    function pesoAtual() { return num(document.getElementById('sri-p').value); }
    function ped() { return document.querySelector('input[name=sri-m]:checked').value === 'p'; }
    function doseDe(id) {
      var r = E.sriDoses(pesoAtual(), ped());
      return r ? r.filter(function (x) { return x.id === id; })[0] : null;
    }
    function apsDe(id) {
      var vistos = {};
      return window.Apresentacoes.lista(id).filter(function (a) { var k = (a.qtd / a.vol).toFixed(6); if (vistos[k]) return false; vistos[k] = 1; return true; })
        .map(function (a) { return { rot: fmt(a.qtd / a.vol, 2) + ' ' + a.u + '/mL — ' + a.rot.replace(/\s*\(.*?\)\s*/g, ' ').trim(), qtd: a.qtd, u: a.u, vol: a.vol }; });
    }
    function concDe(id) {
      var aps = apsDe(id), c = concSel[id];
      if (c > 0) return c;
      var x = E.SRI.filter(function (s) { return s.id === id; })[0];
      return x ? x.conc : (aps[0] ? aps[0].qtd / aps[0].vol : 1);
    }
    function linhaDroga(id) {
      var x = doseDe(id);
      if (!x) return '<p class="note">Informe o peso.</p>';
      var c = concDe(id), aps = apsDe(id);
      return '<div class="sri-dose"><div><b>' + fmt(x.dose, 1) + ' ' + x.u + '</b><small>' + fmt(x.porKg, 2) + ' ' + x.u + '/kg' + (x.limitado ? ' · dose máx.' : '') + '</small></div>' +
        '<div class="sri-ml"><b>' + fmt(x.dose / c, 1) + ' mL</b><small>de ' + fmt(c, 2) + ' ' + x.u + '/mL</small></div></div>' +
        (aps.length ? '<div class="ap-chips">' + aps.map(function (a) {
          var ac = a.qtd / a.vol;
          return '<button type="button" class="ap-chip' + (Math.abs(ac - c) < 1e-9 ? ' on' : '') + '" data-sc="' + id + '" data-v="' + ac + '">' + esc(a.rot) + '</button>';
        }).join('') + '</div>' : '') +
        '<p class="note">' + esc(x.obs) + '</p>';
    }
    function renderEscolha() {
      document.getElementById('sri-esc').innerHTML = GR.map(function (g) {
        return '<div class="sec sri-g"><h3>' + esc(g.titulo) + '</h3><div class="seg">' + g.ops.map(function (o) {
          return '<label class="seg-opt"><input type="radio" name="sg-' + g.k + '" value="' + o[0] + '"' + (sel[g.k] === o[0] ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>';
        }).join('') + '</div><p class="note">💡 ' + esc(g.dica) + '</p>' + (sel[g.k] ? linhaDroga(sel[g.k]) : '') + '</div>';
      }).join('');
      document.querySelectorAll('#sri-esc input[type=radio]').forEach(function (r) {
        r.onchange = function () { sel[r.name.slice(3)] = r.value; store.set('sri', sel); renderEscolha(); renderSeq(); };
      });
      document.querySelectorAll('#sri-esc [data-sc]').forEach(function (b) {
        b.onclick = function () { concSel[b.getAttribute('data-sc')] = +b.getAttribute('data-v'); store.set('sriConc', concSel); renderEscolha(); renderSeq(); };
      });
    }
    function passos() {
      var p = [], d;
      p.push({ t: 0, txt: 'Pré-oxigenar com O₂ a 100% por 3 min; posicionar; checar o material' });
      if (sel.pre && (d = doseDe(sel.pre))) p.push({ t: 0, txt: 'Fentanil ' + fmt(d.dose, 0) + ' mcg (' + fmt(d.dose / concDe(sel.pre), 1) + ' mL) EV lento' });
      if (sel.ind && (d = doseDe(sel.ind))) p.push({ t: 180, txt: d.nome + ' ' + fmt(d.dose, 1) + ' mg (' + fmt(d.dose / concDe(sel.ind), 1) + ' mL) EV' });
      if (sel.bnm && (d = doseDe(sel.bnm))) p.push({ t: 180, txt: d.nome + ' ' + fmt(d.dose, 0) + ' mg (' + fmt(d.dose / concDe(sel.bnm), 1) + ' mL) EV logo após o indutor' });
      p.push({ t: sel.bnm === 'succinilcolina' ? 225 : 240, txt: 'Aguardar relaxamento (' + (sel.bnm === 'succinilcolina' ? '45 s; fasciculações cessam' : '60 s') + ') → laringoscopia e intubação' });
      p.push({ t: 300, txt: 'Confirmar com capnografia e ausculta; fixar a cânula; iniciar ventilação' });
      return p;
    }
    var timer = null;
    function renderSeq() {
      var ps = passos(), el = document.getElementById('sri-seq');
      if (!pesoAtual()) { el.innerHTML = '<p class="note">Informe o peso.</p>'; return; }
      var decor = seq ? (Date.now() - seq.inicio) / 1000 : null;
      el.innerHTML = '<div class="sec">' + (seq ? '<div class="pcr-row"><span>Tempo desde o início</span><b id="sri-tm">' + E.mmss(decor) + '</b></div>' : '') +
        '<ol class="steps sri-steps">' + ps.map(function (p, i) {
          var ativo = seq && decor >= p.t && (i === ps.length - 1 || decor < ps[i + 1].t);
          var feito = seq && seq.feitos && seq.feitos[i];
          return '<li class="' + (ativo ? 'now' : '') + (feito ? ' done' : '') + '"><small>' + E.mmss(p.t) + '</small> ' + esc(p.txt) +
            (seq && !feito ? ' <button type="button" class="btn sm ghost" data-feito="' + i + '">Feito</button>' : feito ? ' <small>✓ ' + esc(feito) + '</small>' : '') + '</li>';
        }).join('') + '</ol>' +
        (seq ? '<div class="ask-row"><button class="btn" type="button" id="sri-copy">📋 Copiar registro</button><button class="btn ghost" type="button" id="sri-reset">Nova sequência</button></div>'
             : '<button class="btn pcr-start" type="button" id="sri-go">▶ Iniciar sequência (cronômetro)</button>') + '</div>';
      var go = document.getElementById('sri-go');
      if (go) go.onclick = function () { seq = { inicio: Date.now(), feitos: {} }; store.set('sriSeq', seq); beep(660, 0.2); renderSeq(); tick(); };
      el.querySelectorAll('[data-feito]').forEach(function (b) {
        b.onclick = function () { seq.feitos[b.getAttribute('data-feito')] = new Date().toLocaleTimeString('pt-BR'); store.set('sriSeq', seq); renderSeq(); };
      });
      var cp = document.getElementById('sri-copy');
      if (cp) cp.onclick = function () {
        compartilharTexto('EnfCalc — intubação em sequência rápida (' + new Date(seq.inicio).toLocaleDateString('pt-BR') + ')\nPeso: ' + fmt(pesoAtual(), 1) + ' kg\n' +
          ps.map(function (p, i) { return (seq.feitos[i] ? seq.feitos[i] : '—') + ' · ' + p.txt; }).join('\n') + '\n\nRegistro de apoio; transcrever para o prontuário.', 'Registro da intubação');
      };
      var rs = document.getElementById('sri-reset');
      if (rs) rs.onclick = function () { ask({ titulo: 'Nova sequência', msg: 'Apagar o registro desta sequência?', ok: 'Apagar', perigo: true }).then(function (s) { if (s) { seq = null; store.set('sriSeq', null); renderSeq(); } }); };
    }
    var ultimoPasso = -1;
    function tick() {
      if (pcrTimer) clearInterval(pcrTimer);
      pcrTimer = setInterval(function () {
        if (!seq) return;
        var decor = (Date.now() - seq.inicio) / 1000, ps = passos();
        var idx = ps.reduce(function (a, p, i) { return decor >= p.t ? i : a; }, 0);
        if (idx !== ultimoPasso) { if (ultimoPasso >= 0) { beep(880, 0.25); try { navigator.vibrate && navigator.vibrate(200); } catch (e) { /* ok */ } } ultimoPasso = idx; renderSeq(); }
        var tm = document.getElementById('sri-tm'); if (tm) tm.textContent = E.mmss(decor);
      }, 500);
    }
    function renderVent() {
      var v = E.ventInicial({ ped: ped(), idadeMeses: num(document.getElementById('sri-id').value) * 12, altura: num(document.getElementById('sri-a').value),
        sexo: (document.querySelector('input[name=sri-s]:checked') || {}).value, peso: pesoAtual() });
      var el = document.getElementById('sri-vent');
      if (!v) { el.innerHTML = '<div class="result empty">' + (ped() ? 'Informe o peso.' : 'Informe altura e sexo para calcular o peso predito.') + '</div>'; return; }
      el.innerHTML = resultsHtml({ results: [
        { label: 'Volume corrente', value: fmt(v.vc[0], 0) + '–' + fmt(v.vc[1], 0), unit: 'mL', main: true, sub: '6–8 mL/kg do ' + v.baseTipo + ' (' + fmt(v.pesoBase, 1) + ' kg). Protetor: ' + fmt(v.vcProtetor, 0) + ' mL (6 mL/kg)' },
        { label: 'Frequência respiratória', value: v.fr[0] + '–' + v.fr[1], unit: 'irpm', sub: 'Ajustar pela capnografia e gasometria' },
        { label: 'PEEP inicial', value: String(v.peep), unit: 'cmH₂O' },
        { label: 'FiO₂ inicial', value: String(v.fio2Inicial), unit: '%', sub: 'Reduzir para manter SpO₂ ' + v.metas.spo2 },
        { label: 'Metas de segurança', value: 'Pplat ' + v.metas.pplat, sub: 'Driving pressure (Pplat − PEEP) ' + v.metas.driving + ' · relação I:E 1:2 a 1:3' }
      ] });
    }
    var form = document.getElementById('sri-f');
    function syncPed() {
      document.getElementById('sri-sx').hidden = ped();
      document.getElementById('sri-idw').hidden = !ped();
    }
    form.addEventListener('input', function () { renderEscolha(); renderSeq(); renderVent(); });
    form.addEventListener('change', function () { syncPed(); renderEscolha(); renderSeq(); renderVent(); });
    syncPed(); renderEscolha(); renderSeq(); renderVent();
    if (seq) tick();
  }

  // ---- Hipodermóclise ----
  function viewHipo() {
    setHeader('Hipodermóclise', true);
    var E = window.Emergencia;
    var lista = function (st) {
      return D.DRUGS.filter(function (d) { return B.HIPO[d.id] && B.HIPO[d.id].st === st; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); })
        .map(function (d) { return '<a class="card" href="#/droga/' + esc(d.id) + '"><span class="card-ic">' + (st === 'sim' ? '✅' : st === 'nao' ? '⛔' : '⚠️') + '</span><span class="card-t"><b>' + esc(d.nome) + '</b><small>' + esc(B.HIPO[d.id].txt) + '</small></span><span class="chev">›</span></a>'; }).join('');
    };
    $app.innerHTML =
      '<p class="lead">Infusão de líquidos e medicamentos pela via subcutânea — muito usada no domicílio, em idosos e em cuidados paliativos.</p>' +
      '<h2>💧 Hidratação por hipodermóclise</h2><form class="form" id="hp-f" onsubmit="return false" autocomplete="off">' +
        '<div class="field"><label for="hp-v">Volume prescrito</label><div class="input-wrap"><input id="hp-v" type="text" inputmode="decimal" value="1000"><span class="unit">mL</span></div></div>' +
        '<div class="field"><label for="hp-h">Em quantas horas</label><div class="input-wrap"><input id="hp-h" type="text" inputmode="decimal" value="24"><span class="unit">h</span></div></div>' +
        '<div class="field"><label for="hp-s">Número de sítios de punção</label><div class="input-wrap"><input id="hp-s" type="text" inputmode="numeric" value="1"><span class="unit">sítios</span></div></div>' +
      '</form><div id="hp-out" aria-live="polite"></div>' +
      '<div class="sec"><h3>📏 Regras gerais</h3><ul class="howto">' +
        '<li>Soluções: SF 0,9% ou SG 5% (preferir isotônicas; SG 5% pode ser associado a SF).</li>' +
        '<li>Volume: até <b>1.500 mL em 24 h por sítio</b> (≈ 62,5 mL/h); para mais volume, usar 2 sítios.</li>' +
        '<li>No máximo <b>3 medicamentos compatíveis</b> por sítio; dexametasona e omeprazol em sítio exclusivo.</li>' +
        '<li>Locais: abdômen, face anterior/lateral da coxa, região subclavicular, deltoide e escapular (conforme volume).</li>' +
        '<li>Preferir cateter flexível (não agulhado); lavar com 1–2 mL de SF entre medicamentos; observar edema, dor e hiperemia.</li>' +
        '<li>Não usar: eletrólitos concentrados, soluções hipertônicas, AINEs, diazepam (risco de necrose).</li></ul></div>' +
      '<h2>✅ Descritos em hipodermóclise</h2><div class="list">' + lista('sim') + '</div>' +
      '<h2>⛔ Não usar por via SC</h2><div class="list">' + lista('nao') + '</div>' +
      '<h2>⚠️ Fontes divergem</h2><div class="list">' + lista('diverge') + '</div>' +
      '<p class="note">Diluições e tempos variam entre instituições e o uso SC de muitos medicamentos é off-label. Siga a tabela de hipodermóclise do seu serviço. Fontes: Guia SBGG/ANCP “O uso da via subcutânea em geriatria e cuidados paliativos” (2ª ed., 2017); <a href="https://guiafarmaceutico.hospitalsaocamilosp.org.br/storags/2026/06/Tabela-hipodermoclise.pdf" target="_blank" rel="noopener">tabela de hipodermóclise — Hospital São Camilo SP</a>; revisão Infarma (CFF, 2023).</p>';
    function run() {
      var r = E.hipodermoclise(num(document.getElementById('hp-v').value), num(document.getElementById('hp-h').value), Math.floor(num(document.getElementById('hp-s').value)));
      var out = document.getElementById('hp-out');
      if (!r) { out.innerHTML = resultsHtml(null); return; }
      var warns = [];
      if (r.acimaVelocidade || r.acimaVolume) warns.push('Acima do limite por sítio (62,5 mL/h ou 1.500 mL/24 h). Use pelo menos ' + r.sitiosNecessarios + ' sítios ou aumente o tempo.');
      out.innerHTML = resultsHtml({ results: [
        { label: 'Vazão total', value: fmt(r.mlh, 1), unit: 'mL/h', main: true, sub: fmt(Math.round(r.gts), 0) + ' gts/min (macrogotas) · ' + fmt(Math.round(r.mlh), 0) + ' mcgts/min' },
        { label: 'Por sítio', value: fmt(r.porSitio, 1), unit: 'mL/h', sub: fmt(r.porSitio24, 0) + ' mL em 24 h por sítio' }
      ], warns: warns });
    }
    document.getElementById('hp-f').addEventListener('input', run);
    run();
  }

  // ---- Os 9 certos antes de registrar ----
  var NOVE_CERTOS = ['Paciente certo — conferir nome completo e identificação', 'Medicamento certo — conferir nome com a prescrição e alergias', 'Via certa', 'Hora certa', 'Dose certa — conferir o cálculo e a unidade',
    'Forma certa — apresentação e preparo adequados à via', 'Orientação certa — paciente/família orientados', 'Registro certo — horário e assinatura no prontuário', 'Resposta certa — observar efeito e reações'];
  function confirmar9Certos(nome) {
    return new Promise(function (resolve) {
      var w = document.createElement('div');
      w.className = 'modal';
      w.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="nc-t"><h2 id="nc-t">Os 9 certos — ' + esc(nome) + '</h2>' +
        '<div class="chips col">' + NOVE_CERTOS.map(function (t, i) { return '<label class="chk-i"><input type="checkbox" id="nc-' + i + '"><span>' + esc(t) + '</span></label>'; }).join('') + '</div>' +
        '<div class="ask-row"><button class="btn ghost" type="button" id="nc-no">Cancelar</button><button class="btn" type="button" id="nc-ok" disabled>Registrar (0/9)</button></div></div>';
      document.body.appendChild(w);
      var ok = w.querySelector('#nc-ok');
      w.addEventListener('change', function () { var n = w.querySelectorAll('input:checked').length; ok.disabled = n < 9; ok.textContent = 'Registrar (' + n + '/9)'; });
      function fim(v) { w.remove(); resolve(v); }
      w.querySelector('#nc-no').onclick = function () { fim(false); };
      ok.onclick = function () { fim(true); };
      w.querySelector('#nc-0').focus();
    });
  }

  // ---- Protocolos ----
  var CALC_PROT = { sepse: ['#/infusao/noradrenalina', '🫀 Noradrenalina em mL/h'], cad: ['#/infusao/insulina', '🫀 Insulina em bomba'], hipona: ['#/calc/adrogue', '🧂 Correção de sódio'],
    queimados: ['#/calc/parkland', '🔥 Calculadora de Parkland'], 'choque-hipo': ['#/calc/vazao-bomba', '⚙️ Vazão em bomba'], convulsao: ['#/emergencia-ped', '👶 Doses pediátricas de emergência'],
    tep: ['#/infusao/heparina', '🫀 Heparina em bomba'], 'emerg-has': ['#/infusao/nitroprussiato', '🫀 Nitroprussiato em mL/h'], eap: ['#/infusao/nitroglicerina', '🫀 Nitroglicerina em mL/h'],
    hipok: ['#/calc/eletrolitos', '⚡ Eletrólitos mEq ↔ mL'], intox: ['#/compatibilidade', '🔗 Interações'],
    'pcr-adulto': ['#/pcr', '🚨 Abrir o Modo PCR'], bradicardia: ['#/infusao/dopamina', '🫀 Dopamina em mL/h'], taquicardia: ['#/droga/adenosina', '💊 Adenosina: preparo'],
    'trauma-xabcde': ['#/droga/tranexamico', '💊 Ácido tranexâmico: preparo'], tce: ['#/escala/glasgow', '📋 Escala de Glasgow'], ehh: ['#/calc/sodio-corrigido', '🧂 Sódio corrigido pela glicemia'],
    dengue: ['#/calc/holliday', '🍼 Hidratação de manutenção (criança)'], 'reanimacao-neonatal': ['#/emergencia-ped', '👶 Emergência pediátrica'], quedas: ['#/escala/morse', '📋 Escala de Morse'],
    'seguranca-paciente': ['#/escala/braden', '📋 Escala de Braden'], 'tev-profilaxia': ['#/droga/enoxaparina', '💊 Enoxaparina: preparo'] };
  function nomeMed(id) {
    var d = D.DRUGS.filter(function (x) { return x.id === id; })[0];
    if (d) return d.nome;
    var x = BX.EXTRAS.filter(function (e) { return e.id === id; })[0];
    return x ? x.nome : id;
  }
  function protocolosDoMed(id) {
    return PR.PROTOCOLOS.filter(function (p) { return p.secoes.some(function (s) { return s.tipo === 'meds' && s.itens.some(function (i) { return i[0] === id; }); }); });
  }
  function protRelHtml(id) {
    var ps = protocolosDoMed(id);
    return ps.length ? '<div class="sec"><h3>📑 Protocolos em que aparece</h3><p>' + ps.map(function (p) { return '<a href="#/protocolo/' + p.id + '">' + esc(p.nome) + '</a>'; }).join(' · ') + '</p></div>' : '';
  }
  var CONF_ST = { ok: ['ok', '✅ Conferida com a fonte'], ajustado: ['info', '🛠️ Conferida e corrigida'], parcial: ['warn', '⚠️ Conferida em parte'], 'sem-fonte': ['bad', '❔ Sem fonte oficial automática'] };
  function confHtml(id) {
    var c = BX.CONFERENCIA && BX.CONFERENCIA[id];
    if (!c) return '';
    var st = CONF_ST[c.st] || CONF_ST['sem-fonte'];
    return '<div class="sec"><h3>📚 Conferência da ficha</h3><p><span class="badge ' + st[0] + '">' + st[1] + '</span> <small>em ' + esc(fmtData(BX.CONF_DATA)) + '</small></p>' +
      (c.nota ? '<p>' + esc(c.nota) + '</p>' : '') +
      (c.fontes.length ? '<ul class="fontes">' + c.fontes.map(function (f) {
        var url = f[1].charAt(0) === '/' ? PR.urlMsd(f[1]) : f[1];
        return '<li><a target="_blank" rel="noopener" href="' + esc(url) + '">' + esc(f[0]) + '</a></li>';
      }).join('') + '</ul>' : '') +
      '<p class="note">Conferência automatizada da posologia com bulas oficiais (FDA/DailyMed, em inglês) e o Manual MSD. Não substitui a bula brasileira nem a revisão de um farmacêutico. <a href="#/conferencia">Ver relatório</a></p></div>';
  }
  function fmtData(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }

  function viewConferencia() {
    setHeader('Conferência das fichas', true);
    var C2 = BX.CONFERENCIA || {}, ids = Object.keys(C2);
    var cont = {}; ids.forEach(function (k) { cont[C2[k].st] = (cont[C2[k].st] || 0) + 1; });
    var filtro = store.get('confFiltro', 'ajustado');
    var ordem = ['ajustado', 'parcial', 'sem-fonte', 'ok'];
    function nomeX(k) { var x = BX.EXTRAS.filter(function (e) { return e.id === k; })[0]; return x ? x.nome : k; }
    $app.innerHTML = '<p class="lead">As ' + ids.length + ' fichas resumidas tiveram a posologia comparada, uma a uma, com a bula oficial americana (FDA/DailyMed) e, quando não havia bula, com o Manual MSD. Conferência de ' + esc(fmtData(BX.CONF_DATA)) + '.</p>' +
      '<div class="chipnav">' + ordem.map(function (st) {
        return '<button type="button" class="chipnav-b' + (st === filtro ? ' on' : '') + '" data-f="' + st + '">' + CONF_ST[st][1] + ' (' + (cont[st] || 0) + ')</button>';
      }).join('') + '</div>' +
      '<div class="list">' + ids.filter(function (k) { return C2[k].st === filtro; }).sort(function (a, b) { return nomeX(a).localeCompare(nomeX(b)); }).map(function (k) {
        return card('#/droga/' + k, '💊', nomeX(k), C2[k].nota || (C2[k].fontes[0] ? C2[k].fontes[0][0] : ''));
      }).join('') + '</div>' +
      '<p class="disclaimer">As bulas da FDA refletem o registro nos EUA; doses, apresentações e indicações podem diferir no Brasil. Para uso profissional, confira a bula da Anvisa e peça a revisão de um farmacêutico.</p>';
    Array.prototype.forEach.call($app.querySelectorAll('[data-f]'), function (b) {
      b.addEventListener('click', function () { store.set('confFiltro', b.getAttribute('data-f')); viewConferencia(); });
    });
  }

  function msdLinkHtml(nome) {
    var termo = String(nome).replace(/\(.*?\)/g, '').replace(/\s[\d,]+\s?%/, '').trim();
    return '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(PR.buscaMsd(termo)) + '">📘 Buscar no Manual MSD</a>';
  }

  // ---- Módulos por área ----
  function drogaInfo(id) {
    var d = D.DRUGS.filter(function (x) { return x.id === id; })[0];
    if (d) return { id: id, nome: d.nome, desc: d.classe, ic: '💊' };
    var x = BX.EXTRAS.filter(function (e) { return e.id === id; })[0];
    return x ? { id: id, nome: x.nome, desc: x.classe, ic: '📄' } : null;
  }
  function viewModulo(id) {
    var m = MOD.MODULOS.filter(function (x) { return x.id === id; })[0];
    if (!m) return viewNotFound();
    setHeader(m.nome, true);
    var ps = m.protocolos.map(function (k) { return PR.PROTOCOLOS.filter(function (p) { return p.id === k; })[0]; }).filter(Boolean);
    var cs = m.calcs.map(function (k) { return CALCS.filter(function (c) { return c.id === k; })[0]; }).filter(Boolean);
    var es = m.escalas.map(function (k) { return D.SCALES.filter(function (sc) { return sc.id === k; })[0]; }).filter(Boolean);
    var ids = m.drogas.slice();
    (m.cats || []).forEach(function (c) { BX.EXTRAS.forEach(function (x) { if (x.cat === c && ids.indexOf(x.id) < 0) ids.push(x.id); }); });
    var ds = ids.map(drogaInfo).filter(Boolean).sort(function (a, b) { return a.nome.localeCompare(b.nome); });
    var secs = [['m-atalhos', '⚡ Atalhos', m.atalhos.length], ['m-prot', '📑 Protocolos', ps.length], ['m-calc', '🧮 Cálculos', cs.length], ['m-drog', '💊 Medicamentos', ds.length], ['m-esc', '📋 Escalas', es.length]]
      .filter(function (x) { return x[2]; });
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(m.desc) + '.</p>' + favButton('mod:' + m.id) + '</div>' +
      '<div class="chipnav">' + secs.map(function (x) { return '<button type="button" class="chipnav-b" data-go="' + x[0] + '">' + x[1] + ' (' + x[2] + ')</button>'; }).join('') + '</div>' +
      (m.atalhos.length ? '<h2 id="m-atalhos">⚡ Atalhos</h2><div class="list">' + m.atalhos.map(function (a) { return card(a[0], a[1], a[2], a[3]); }).join('') + '</div>' : '') +
      (ps.length ? '<h2 id="m-prot">📑 Protocolos</h2><div class="list">' + ps.map(function (p) { return card('#/protocolo/' + p.id, p.icon, p.nome, p.resumo, 'prot:' + p.id); }).join('') + '</div>' : '') +
      (cs.length ? '<h2 id="m-calc">🧮 Cálculos</h2><div class="list">' + cs.map(function (c) { return card('#/calc/' + c.id, c.icon, c.title, c.desc, 'calc:' + c.id); }).join('') + '</div>' : '') +
      (ds.length ? '<h2 id="m-drog">💊 Medicamentos</h2><div class="list">' + ds.map(function (d) { return card('#/droga/' + d.id, d.ic, d.nome, d.desc, 'droga:' + d.id); }).join('') + '</div>' : '') +
      (es.length ? '<h2 id="m-esc">📋 Escalas</h2><div class="list">' + es.map(function (sc) { return card('#/escala/' + sc.id, '📋', sc.nome, sc.desc, 'escala:' + sc.id); }).join('') + '</div>' : '') +
      '<p class="disclaimer">Seleção do módulo; todo o conteúdo continua disponível nas abas Cálculos, Bulário e Protocolos.</p>';
    $app.querySelectorAll('[data-go]').forEach(function (b) {
      b.onclick = function () { var t = document.getElementById(b.getAttribute('data-go')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    });
  }

  function viewProtocolos() {
    setHeader('Protocolos', false);
    $app.innerHTML = '<p class="lead">Condutas resumidas para a enfermagem, com passo a passo, medicamentos e link para o Manual MSD.</p>' +
      '<div class="search"><input id="pq" type="search" placeholder="Buscar protocolo…" aria-label="Buscar protocolo"></div><div id="pl"></div>' +
      '<p class="disclaimer">Texto próprio, elaborado a partir do Manual MSD (edição profissional) e de diretrizes consolidadas. Siga o protocolo da sua instituição.</p>';
    var pq = document.getElementById('pq');
    function render() {
      var t = norm(pq.value.trim());
      document.getElementById('pl').innerHTML = PR.GRUPOS.map(function (g) {
        var ps = PR.PROTOCOLOS.filter(function (p) { return p.grupo === g.id && (!t || norm(p.nome + ' ' + p.resumo).indexOf(t) >= 0); });
        return ps.length ? '<h2>' + g.icon + ' ' + esc(g.nome) + '</h2><div class="list">' + ps.map(function (p) { return card('#/protocolo/' + p.id, p.icon, p.nome, p.resumo, 'prot:' + p.id); }).join('') + '</div>' : '';
      }).join('') || '<p class="empty-msg">Nenhum protocolo encontrado.</p>';
    }
    pq.oninput = render; render();
  }

  function viewProtocolo(id) {
    var p = PR.PROTOCOLOS.filter(function (x) { return x.id === id; })[0];
    if (!p) return viewNotFound();
    setHeader(p.nome, true);
    var calc = CALC_PROT[p.id];
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(p.resumo) + '</p>' + favButton('prot:' + p.id) + '</div>' +
      (calc ? '<a class="btn" href="' + calc[0] + '">' + esc(calc[1]) + '</a>' : '') +
      p.secoes.map(function (s) {
        if (s.tipo === 'passos') return '<h2>' + esc(s.t) + '</h2><ol class="steps">' + s.itens.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
        if (s.tipo === 'meds') return '<h2>💊 ' + esc(s.t) + '</h2><div class="list">' + s.itens.map(function (i) {
          return i[0] ? '<a class="card" href="#/droga/' + esc(i[0]) + '"><span class="card-ic">💊</span><span class="card-t"><b>' + esc(nomeMed(i[0])) + '</b><small>' + esc(i[1]) + '</small></span><span class="chev">›</span></a>'
                      : '<div class="card"><span class="card-ic">💊</span><span class="card-t"><small>' + esc(i[1]) + '</small></span></div>';
        }).join('') + '</div>';
        return '<div class="sec"><h3>' + esc(s.t) + '</h3><ul class="howto">' + s.itens.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
      }).join('') +
      (function () {
        var fs = PR.fontes(p.id), br = fs.filter(function (f) { return f.br; }), it = fs.filter(function (f) { return !f.br; });
        function li(f) { return '<li><b>' + esc(f.org) + '</b> — ' + esc(f.t) + '</li>'; }
        return '<div class="sec refs"><h3>📚 Referências</h3>' +
          (br.length ? '<p class="ref-sub">🇧🇷 Brasil</p><ul class="fontes">' + br.map(li).join('') + '</ul>' : '') +
          (it.length ? '<p class="ref-sub">🌎 Internacionais</p><ul class="fontes">' + it.map(li).join('') + '</ul>' : '') +
          '<p class="ref-sub">📘 Leitura complementar — Manual MSD</p><ul class="fontes">' + p.msd.map(function (m) { return '<li><a target="_blank" rel="noopener" href="' + esc(PR.urlMsd(m[1])) + '">' + esc(m[0]) + '</a></li>'; }).join('') + '</ul>' +
          '<p class="note">Resumo próprio para consulta rápida, baseado nas referências acima (consulte sempre a versão vigente de cada uma). Doses e condutas variam com o protocolo institucional e a prescrição.</p></div>';
      })();
  }

  // =====================================================================
  // ---- Plantão: leitor de código de barras, agenda de medicações e SBAR
  // =====================================================================
  var pararCamera = null;
  window.addEventListener('hashchange', function () { if (pararCamera) { pararCamera(); pararCamera = null; } });

  function carregarEAN(cb) {
    if (window.EAN_DB && window.EAN_DB.mapa) return cb(window.EAN_DB);
    function prep() {
      var db = window.EAN_DB; db.mapa = {};
      db.E.split(',').forEach(function (x) { var k = x.indexOf(':'); db.mapa[x.slice(0, k)] = +x.slice(k + 1); });
      cb(db);
    }
    if (window.EAN_DB) return prep();
    var sc = document.createElement('script'); sc.src = 'js/ean.js';
    sc.onload = prep; sc.onerror = function () { cb(null); };
    document.head.appendChild(sc);
  }
  function nomeQualquer(id) {
    var n = nomeMed(id);
    if (n !== id) return n;
    var ca = CT.CAT.filter(function (a) { return a[0] === id; })[0];
    return ca ? ca[1] : id;
  }
  function eanResultadoHtml(db, codigo) {
    var i = db.mapa[codigo];
    if (i == null) return '<div class="alert warn">Código <b>' + esc(codigo) + '</b> não encontrado na lista oficial de preços (pode ser produto hospitalar sem preço CMED, manipulado, importado ou embalagem antiga). Busque pelo nome no Bulário.</div>';
    var p = db.P[i], id = db.IDS[p[0]], marca = db.BR[p[1]], tipo = p[4];
    var hist = store.get('scanHist', []).filter(function (h) { return h.c !== codigo; });
    hist.unshift({ c: codigo, m: marca, id: id }); store.set('scanHist', hist.slice(0, 10));
    return '<div class="scan-res"><div class="alias-box"><b>' + esc(marca) + '</b> <span class="tipo tipo-' + tipo + '">' + (tipo === 'R' ? '⭐ ' : '') + esc(TIPO_NOME[tipo] || 'Outro') + '</span>' +
      '<br><small>Princípio ativo: <b>' + esc(nomeQualquer(id)) + '</b></small></div>' +
      '<div class="sec"><p><b>Apresentação:</b> ' + esc(db.AP[p[2]] || '—') + '</p><p><b>Laboratório:</b> ' + esc(db.LABS[p[3]]) + '</p><p class="note">Código ' + esc(codigo) + ' · Fonte: lista CMED/Anvisa</p></div>' +
      '<a class="btn" href="' + esc(hrefAlias(id, { n: marca })) + '">📖 Abrir ficha de ' + esc(marca) + '</a>' +
      '<p class="note">Confira sempre o rótulo: nome, concentração, lote e validade.</p></div>';
  }
  function viewScanner() {
    setHeader('Ler código de barras', true);
    var hist = store.get('scanHist', []);
    $app.innerHTML = '<p class="lead">Aponte a câmera para o código de barras da caixa ou digite os números que aparecem abaixo dele.</p>' +
      '<div class="scan-area" id="scan-area" hidden><video id="scan-video" playsinline muted></video><div class="scan-mira"></div></div>' +
      '<div class="ref-btns"><button class="btn" id="scan-cam" type="button">📷 Abrir câmera</button></div>' +
      '<form class="form" id="scan-form" onsubmit="return false"><div class="field"><label for="scan-cod">Número do código de barras (EAN)</label>' +
      '<div class="row"><input id="scan-cod" type="text" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="ex.: 7891058001155"><button class="btn sm" id="scan-ok" type="submit">Buscar</button></div></div></form>' +
      '<div id="scan-out" aria-live="polite"></div>' +
      (hist.length ? '<h2>🕘 Lidos recentemente</h2><div class="list">' + hist.map(function (h) { return card(hrefAlias(h.id, { n: h.m }), '📦', h.m, nomeQualquer(h.id) + ' · ' + h.c); }).join('') + '</div>' : '') +
      '<p class="disclaimer">Base: códigos EAN da Lista de Preços CMED/Anvisa (' + esc(fmtData(CT.FONTE.data)) + '). Na primeira leitura o app baixa a base de códigos (≈ 1,6 MB).</p>';
    var out = document.getElementById('scan-out'), cod = document.getElementById('scan-cod');
    function buscar(c) {
      c = String(c || '').replace(/\D/g, '');
      if (c.length < 8) { out.innerHTML = '<div class="alert warn">Digite os 13 números do código de barras.</div>'; return; }
      out.innerHTML = '<p class="note">Carregando base de códigos…</p>';
      carregarEAN(function (db) { out.innerHTML = db ? eanResultadoHtml(db, c) : '<div class="alert bad">Não foi possível carregar a base de códigos. Verifique a conexão.</div>'; });
    }
    document.getElementById('scan-form').onsubmit = function () { buscar(cod.value); return false; };
    carregarEAN(function () {});   // pré-carrega em segundo plano
    document.getElementById('scan-cam').onclick = function () {
      var area = document.getElementById('scan-area'), video = document.getElementById('scan-video');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { out.innerHTML = '<div class="alert warn">Este navegador não permite usar a câmera aqui. Digite o número do código.</div>'; return; }
      function achou(c) {
        if (pararCamera) { pararCamera(); pararCamera = null; }
        area.hidden = true; cod.value = c; if (navigator.vibrate) navigator.vibrate(80); buscar(c);
      }
      if ('BarcodeDetector' in window) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (stream) {
          area.hidden = false; video.srcObject = stream; video.play();
          var det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'] }), vivo = true;
          pararCamera = function () { vivo = false; stream.getTracks().forEach(function (t) { t.stop(); }); };
          (function loop() {
            if (!vivo) return;
            det.detect(video).then(function (r) { if (r.length && vivo) achou(r[0].rawValue); else setTimeout(loop, 250); }).catch(function () { setTimeout(loop, 400); });
          })();
        }).catch(function () { out.innerHTML = '<div class="alert warn">Câmera não autorizada. Permita o acesso à câmera ou digite o número.</div>'; });
        return;
      }
      // Navegadores sem BarcodeDetector (ex.: iPhone): biblioteca ZXing sob demanda
      out.innerHTML = '<p class="note">Preparando o leitor…</p>';
      function iniciarZXing() {
        try {
          var leitor = new window.ZXing.BrowserMultiFormatReader();
          area.hidden = false; out.innerHTML = '';
          leitor.decodeFromVideoDevice(null, video, function (res) { if (res) achou(res.getText()); });
          pararCamera = function () { try { leitor.reset(); } catch (e) { /* ignore */ } };
        } catch (e) { out.innerHTML = '<div class="alert warn">Não foi possível usar a câmera. Digite o número do código.</div>'; }
      }
      if (window.ZXing) return iniciarZXing();
      var z = document.createElement('script'); z.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js';
      z.onload = iniciarZXing; z.onerror = function () { out.innerHTML = '<div class="alert warn">Leitor indisponível sem internet neste aparelho. Digite o número do código.</div>'; };
      document.head.appendChild(z);
    };
  }

  // ---- Agenda de medicações do plantão ----
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function agoraMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function minDe(h) { var p = h.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function loadPlantao() { var p = store.get('plantao', null); return p && Array.isArray(p.itens) ? p : { itens: [], feitos: {} }; }
  function dosesDoDia(pl, dia) {
    var out = [];
    pl.itens.forEach(function (it) {
      if (it.desde && dia < it.desde) return;
      if (it.ate && dia > it.ate) return;
      C.horariosDoDia(it.ini, +it.int).forEach(function (h) {
        if (it.desde === dia && minDe(h) < minDe(it.ini)) return;   // no 1º dia, só a partir do 1º horário
        var k = it.id + '|' + dia + '|' + h;
        out.push({ it: it, h: h, k: k, feito: pl.feitos[k] || null });
      });
    });
    return out.sort(function (a, b) { return minDe(a.h) - minDe(b.h) || (a.it.leito || '').localeCompare(b.it.leito || ''); });
  }
  function statusDose(d, dia) {
    if (d.feito) return 'feito';
    if (dia !== hojeISO()) return dia < hojeISO() ? 'atrasado' : 'futuro';
    var diff = minDe(d.h) - agoraMin();
    return diff < -30 ? 'atrasado' : diff <= 60 ? 'agora' : 'futuro';
  }
  function resumoPlantao() {
    var pl = loadPlantao(), dia = hojeISO(), ds = dosesDoDia(pl, dia), r = { atrasado: 0, agora: 0, feito: 0, total: ds.length };
    ds.forEach(function (d) { var s = statusDose(d, dia); if (r[s] != null) r[s]++; });
    return r;
  }
  function viewPlantao() {
    setHeader('Agenda do plantão', true);
    var pl = loadPlantao(), dia = store.get('plantaoDia', hojeISO());
    var nomes = D.DRUGS.map(function (d) { return d.nome; }).concat(BX.EXTRAS.map(function (x) { return x.nome; })).sort();
    var ds = dosesDoDia(pl, dia), cont = { atrasado: 0, agora: 0, feito: 0 };
    ds.forEach(function (d) { cont[statusDose(d, dia)] = (cont[statusDose(d, dia)] || 0) + 1; });
    var aviso = store.get('plantaoAviso', false);
    $app.innerHTML = '<p class="lead">Horários das medicações por leito, com checagem e alerta de atraso.</p>' +
      '<div class="row"><label class="lbl" for="pl-dia">Dia</label><input type="date" id="pl-dia" value="' + esc(dia) + '"></div>' +
      '<p class="badges"><span class="badge bad">⏰ Atrasadas: ' + (cont.atrasado || 0) + '</span><span class="badge warn">🔔 Próxima hora: ' + (cont.agora || 0) + '</span><span class="badge ok">✓ Feitas: ' + (cont.feito || 0) + ' de ' + ds.length + '</span></p>' +
      '<details class="sheet-box" id="pl-add"' + (pl.itens.length ? '' : ' open') + '><summary>➕ Adicionar medicação</summary><form class="form" id="pl-form" onsubmit="return false">' +
        '<div class="row2"><div class="field"><label for="pl-leito">Leito / paciente</label><input id="pl-leito" type="text" maxlength="40" placeholder="ex.: 12A" list="pl-leitos"></div>' +
        '<div class="field"><label for="pl-via">Via</label><select id="pl-via">' + ['EV', 'IM', 'SC', 'VO', 'SNE/SNG', 'Inalatória', 'Tópica', 'Retal', 'Outra'].map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select></div></div>' +
        '<datalist id="pl-leitos">' + pl.itens.map(function (i) { return i.leito; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).map(function (l) { return '<option value="' + esc(l) + '">'; }).join('') + '</datalist>' +
        '<div class="field"><label for="pl-med">Medicamento</label><input id="pl-med" type="text" maxlength="80" list="pl-meds" placeholder="digite ou escolha"><datalist id="pl-meds">' + nomes.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></div>' +
        '<div class="field"><label for="pl-dose">Dose</label><input id="pl-dose" type="text" maxlength="40" placeholder="ex.: 1 g, 500 mg, 10 UI"></div>' +
        '<div class="row2"><div class="field"><label for="pl-ini">1º horário</label><input id="pl-ini" type="time" value="08:00"></div>' +
        '<div class="field"><label for="pl-int">Intervalo</label><select id="pl-int">' + [[0, 'Dose única'], [2, '2/2 h'], [3, '3/3 h'], [4, '4/4 h'], [6, '6/6 h'], [8, '8/8 h'], [12, '12/12 h'], [24, '1x ao dia']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === 8 ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
        '<button class="btn" type="submit">Adicionar</button></form></details>' +
      '<div id="pl-lista">' + (ds.length ? ds.map(function (d) {
        var st = statusDose(d, dia);
        return '<div class="dose-row st-' + st + '"><span class="dose-h">' + d.h + '</span><span class="dose-t"><b>' + esc(d.it.med) + '</b> ' + esc(d.it.dose || '') + ' · ' + esc(d.it.via) +
          '<small>Leito ' + esc(d.it.leito || '—') + (d.feito ? ' · checado às ' + esc(d.feito) : st === 'atrasado' ? ' · ATRASADA' : st === 'agora' ? ' · próxima hora' : '') + '</small></span>' +
          '<button type="button" class="btn sm' + (d.feito ? ' ghost' : '') + '" data-chk="' + esc(d.k) + '">' + (d.feito ? '↩' : '✓') + '</button></div>';
      }).join('') : '<p class="empty-msg">Nenhuma medicação para este dia. Toque em “Adicionar medicação”.</p>') + '</div>' +
      (pl.itens.length ? '<details class="sheet-box"><summary>🗂️ Gerenciar prescrições (' + pl.itens.length + ')</summary><div class="list">' + pl.itens.map(function (it) {
        return '<div class="card"><span class="card-ic">💊</span><span class="card-t"><b>' + esc(it.med) + ' ' + esc(it.dose || '') + '</b><small>Leito ' + esc(it.leito || '—') + ' · ' + esc(it.via) + ' · ' + (it.int > 0 ? 'de ' + it.int + '/' + it.int + ' h' : 'dose única') + ' a partir de ' + esc(it.ini) + '</small></span>' +
          '<button type="button" class="btn sm ghost" data-del="' + esc(it.id) + '">Excluir</button></div>';
      }).join('') + '</div><button type="button" class="btn ghost" id="pl-limpar">Limpar tudo</button></details>' : '') +
      '<div class="ref-btns"><button type="button" class="btn sm ghost" id="pl-aviso">' + (aviso ? '🔕 Desativar lembretes' : '🔔 Ativar lembretes') + '</button>' +
      '<button type="button" class="btn sm ghost" id="pl-copiar">📋 Copiar resumo</button><a class="btn sm ghost" href="#/sbar">📝 Passagem de plantão</a></div>' +
      '<p class="disclaimer">Os dados ficam só neste aparelho. Os lembretes funcionam enquanto o app estiver aberto. A agenda não substitui a prescrição nem o registro oficial do prontuário.</p>';
    document.getElementById('pl-dia').onchange = function (e) { store.set('plantaoDia', e.target.value || hojeISO()); viewPlantao(); };
    document.getElementById('pl-form').onsubmit = function () {
      var med = document.getElementById('pl-med').value.trim(), ini = document.getElementById('pl-ini').value;
      if (!med || !ini) { toast('Informe o medicamento e o 1º horário.', true); return false; }
      pl.itens.push({ id: 'p' + Date.now().toString(36), leito: document.getElementById('pl-leito').value.trim(), med: med, dose: document.getElementById('pl-dose').value.trim(),
        via: document.getElementById('pl-via').value, ini: ini, int: +document.getElementById('pl-int').value, desde: dia });
      store.set('plantao', pl); toast('Medicação adicionada.'); viewPlantao(); return false;
    };
    $app.querySelectorAll('[data-chk]').forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-chk');
        if (pl.feitos[k]) delete pl.feitos[k]; else { var n = new Date(); pl.feitos[k] = ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); }
        store.set('plantao', pl); viewPlantao();
      };
    });
    $app.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-del');
        ask({ titulo: 'Excluir prescrição?', msg: 'Os horários desta medicação saem da agenda.', ok: 'Excluir', perigo: true }).then(function (sim) {
          if (!sim) return; pl.itens = pl.itens.filter(function (i) { return i.id !== id; }); store.set('plantao', pl); viewPlantao();
        });
      };
    });
    var lim = document.getElementById('pl-limpar');
    if (lim) lim.onclick = function () { ask({ titulo: 'Limpar a agenda?', msg: 'Remove todas as prescrições e checagens deste aparelho.', ok: 'Limpar', perigo: true }).then(function (sim) { if (sim) { store.set('plantao', { itens: [], feitos: {} }); viewPlantao(); } }); };
    document.getElementById('pl-aviso').onclick = function () {
      if (aviso) { store.set('plantaoAviso', false); viewPlantao(); return; }
      store.set('plantaoAviso', true);
      if (window.Notification && Notification.permission === 'default') Notification.requestPermission().then(function () { viewPlantao(); });
      else viewPlantao();
      toast('Lembretes ativados: o app avisa no horário de cada dose (com o app aberto).');
    };
    document.getElementById('pl-copiar').onclick = function () {
      var txt = 'Agenda de medicações — ' + dia.split('-').reverse().join('/') + '\n' + ds.map(function (d) {
        return d.h + ' · Leito ' + (d.it.leito || '—') + ' · ' + d.it.med + ' ' + (d.it.dose || '') + ' ' + d.it.via + ' — ' + (d.feito ? 'feito às ' + d.feito : statusDose(d, dia) === 'atrasado' ? 'ATRASADA' : 'pendente');
      }).join('\n');
      copiarTexto(txt);
    };
  }
  function copiarTexto(txt) {
    try {
      if (navigator.share && !EMBED && /Android|iPhone|iPad/i.test(navigator.userAgent)) { navigator.share({ text: txt }).catch(function () {}); return; }
      navigator.clipboard.writeText(txt).then(function () { toast('Texto copiado.'); }, function () { toast('Não foi possível copiar neste navegador.', true); });
    } catch (e) { toast('Não foi possível copiar neste navegador.', true); }
  }
  // Lembretes: verifica a cada minuto (com o app aberto)
  var ultimoAviso = '';
  setInterval(function () {
    if (!store.get('plantaoAviso', false)) return;
    var pl = loadPlantao(), dia = hojeISO(), agora = agoraMin();
    dosesDoDia(pl, dia).forEach(function (d) {
      if (d.feito || minDe(d.h) !== agora || ultimoAviso === d.k) return;
      ultimoAviso = d.k;
      var msg = d.h + ' — Leito ' + (d.it.leito || '—') + ': ' + d.it.med + ' ' + (d.it.dose || '') + ' ' + d.it.via;
      toast('🔔 ' + msg);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      try { if (window.Notification && Notification.permission === 'granted') new Notification('Hora da medicação', { body: msg }); } catch (e) { /* ignore */ }
    });
  }, 20000);

  // ---- Passagem de plantão (SBAR) com NEWS2 automático ----
  function viewSBAR() {
    setHeader('Passagem de plantão', true);
    var todos = store.get('sbar', {}), atual = store.get('sbarAtual', '');
    var f = todos[atual] || {};
    function campo(id, lab, tipo, ph) {
      return '<div class="field"><label for="sb-' + id + '">' + lab + '</label>' + (tipo === 'area' ? '<textarea id="sb-' + id + '" data-sb="' + id + '" rows="3" placeholder="' + esc(ph || '') + '">' + esc(f[id] || '') + '</textarea>'
        : '<input id="sb-' + id + '" data-sb="' + id + '" type="text" inputmode="' + (tipo === 'num' ? 'decimal' : 'text') + '" value="' + esc(f[id] || '') + '" placeholder="' + esc(ph || '') + '">') + '</div>';
    }
    var salvos = Object.keys(todos);
    $app.innerHTML = '<p class="lead">Passagem estruturada (SBAR): Situação, Breve histórico, Avaliação e Recomendações. O NEWS2 é calculado com os sinais vitais.</p>' +
      (salvos.length ? '<div class="chipnav">' + salvos.map(function (k) { return '<button type="button" class="chipnav-b' + (k === atual ? ' on' : '') + '" data-pac="' + esc(k) + '">🛏️ ' + esc(k) + '</button>'; }).join('') + '<button type="button" class="chipnav-b" data-pac="">➕ Novo</button></div>' : '') +
      '<form class="form" id="sb-form" onsubmit="return false">' + campo('leito', 'Leito / paciente', 'txt', 'ex.: 12A — Maria S.') + campo('dx', 'Diagnóstico / motivo da internação', 'txt') +
      '<h3 class="sub-h">S — Situação</h3>' + campo('s', 'O que está acontecendo agora', 'area', 'queixa atual, mudanças no plantão') +
      '<h3 class="sub-h">B — Breve histórico</h3>' + campo('b', 'Antecedentes, alergias, dispositivos, isolamento', 'area', 'ex.: HAS, DM; alergia a dipirona; AVP MSE (dia 2), SVD') +
      '<h3 class="sub-h">A — Avaliação</h3><div class="row2">' + campo('fr', 'FR (irpm)', 'num') + campo('spo2', 'SpO₂ (%)', 'num') + campo('pas', 'PA sistólica', 'num') + campo('pad', 'PA diastólica', 'num') +
      campo('fc', 'FC (bpm)', 'num') + campo('temp', 'Temperatura (°C)', 'num') + campo('gli', 'Glicemia (mg/dL)', 'num') + campo('dor', 'Dor (0–10)', 'num') + '</div>' +
      '<div class="field"><span class="lbl">Oxigênio suplementar</span><div class="seg"><label class="seg-opt"><input type="radio" name="sb-o2" value="n"' + (f.o2 !== 's' ? ' checked' : '') + '><span>Não (ar ambiente)</span></label><label class="seg-opt"><input type="radio" name="sb-o2" value="s"' + (f.o2 === 's' ? ' checked' : '') + '><span>Sim</span></label></div></div>' +
      '<div class="field"><span class="lbl">Consciência</span><div class="seg"><label class="seg-opt"><input type="radio" name="sb-consc" value="A"' + (f.consc !== 'CVPU' ? ' checked' : '') + '><span>Alerta</span></label><label class="seg-opt"><input type="radio" name="sb-consc" value="CVPU"' + (f.consc === 'CVPU' ? ' checked' : '') + '><span>Confusão nova / voz / dor / sem resposta</span></label></div></div>' +
      '<div id="sb-news"></div>' + campo('a', 'Sua avaliação', 'area', 'ex.: estável, melhora da dispneia; diurese 0,8 mL/kg/h') +
      '<h3 class="sub-h">R — Recomendações</h3>' + campo('r', 'Pendências e cuidados para o próximo plantão', 'area', 'exames, reavaliações, cuidados') +
      '<div id="sb-pend"></div></form>' +
      '<div class="ref-btns"><button type="button" class="btn" id="sb-copiar">📋 Copiar / enviar passagem</button><button type="button" class="btn ghost" id="sb-excluir">Excluir este paciente</button></div>' +
      '<p class="disclaimer">Os dados ficam só neste aparelho. Evite dados identificáveis desnecessários e siga a política de privacidade da instituição. NEWS2: Royal College of Physicians (2017).</p>';
    var form = document.getElementById('sb-form');
    function ler() {
      var o = {}; form.querySelectorAll('[data-sb]').forEach(function (el) { o[el.getAttribute('data-sb')] = el.value; });
      o.o2 = form.querySelector('input[name=sb-o2]:checked').value; o.consc = form.querySelector('input[name=sb-consc]:checked').value; return o;
    }
    function pendencias(leito) {
      if (!leito) return [];
      var pl = loadPlantao(), dia = hojeISO(), ag = agoraMin(), chave = norm(leito).split(/\s|—|-/)[0];
      return dosesDoDia(pl, dia).filter(function (d) { return !d.feito && d.it.leito && norm(d.it.leito).split(/\s|—|-/)[0] === chave && minDe(d.h) >= ag - 120 && minDe(d.h) <= ag + 360; });
    }
    function news(o) { return C.news2({ fr: num(o.fr), spo2: num(o.spo2), o2: o.o2 === 's', pas: num(o.pas), fc: num(o.fc), consc: o.consc, temp: num(o.temp) }); }
    var NIVEL = { baixo: ['ok', 'Risco baixo — manter monitorização de rotina'], 'baixo-medio': ['warn', 'Um parâmetro com 3 pontos — avaliação urgente pela equipe'], medio: ['warn', 'Risco médio — avaliação urgente; aumentar a frequência dos sinais vitais'], alto: ['bad', 'Risco alto — avaliação de emergência (time de resposta rápida)'] };
    function render() {
      var o = ler(), n = news(o), el = document.getElementById('sb-news');
      el.innerHTML = n ? '<div class="alert ' + (NIVEL[n.nivel][0] === 'ok' ? 'info' : NIVEL[n.nivel][0]) + '"><b>NEWS2 = ' + n.score + '</b> — ' + NIVEL[n.nivel][1] + '</div>' : '<p class="note">Preencha FR, SpO₂, PA sistólica, FC e temperatura para calcular o NEWS2.</p>';
      var pd = pendencias(o.leito);
      document.getElementById('sb-pend').innerHTML = pd.length ? '<div class="sec"><h3>🗓️ Pendências da agenda (próximas horas)</h3><ul class="howto">' + pd.map(function (d) { return '<li>' + d.h + ' — ' + esc(d.it.med + ' ' + (d.it.dose || '') + ' ' + d.it.via) + '</li>'; }).join('') + '</ul></div>' : '';
      var k = (o.leito || '').trim();
      if (k) { todos[k] = o; if (atual && atual !== k) delete todos[atual]; atual = k; store.set('sbar', todos); store.set('sbarAtual', k); }
    }
    form.addEventListener('input', render); form.addEventListener('change', render); render();
    $app.querySelectorAll('[data-pac]').forEach(function (b) { b.onclick = function () { store.set('sbarAtual', b.getAttribute('data-pac')); viewSBAR(); }; });
    document.getElementById('sb-copiar').onclick = function () {
      var o = ler(), n = news(o), pd = pendencias(o.leito);
      var sv = ['FR ' + (o.fr || '—'), 'SpO₂ ' + (o.spo2 || '—') + '%' + (o.o2 === 's' ? ' (com O₂)' : ''), 'PA ' + (o.pas || '—') + 'x' + (o.pad || '—'), 'FC ' + (o.fc || '—'), 'T ' + (o.temp || '—') + '°C'];
      if (o.gli) sv.push('Glicemia ' + o.gli); if (o.dor) sv.push('Dor ' + o.dor + '/10');
      var txt = 'PASSAGEM DE PLANTÃO (SBAR)\n' + (o.leito ? 'Leito/paciente: ' + o.leito + '\n' : '') + (o.dx ? 'Diagnóstico: ' + o.dx + '\n' : '') +
        '\nS — ' + (o.s || '—') + '\nB — ' + (o.b || '—') + '\nA — ' + sv.join(' · ') + (o.consc === 'CVPU' ? ' · Alteração de consciência' : ' · Alerta') +
        (n ? '\n    NEWS2 = ' + n.score + ' (' + NIVEL[n.nivel][1] + ')' : '') + (o.a ? '\n    ' + o.a : '') +
        '\nR — ' + (o.r || '—') + (pd.length ? '\n    Medicações pendentes: ' + pd.map(function (d) { return d.h + ' ' + d.it.med + ' ' + (d.it.dose || ''); }).join('; ') : '');
      copiarTexto(txt);
    };
    document.getElementById('sb-excluir').onclick = function () {
      if (!atual) { viewSBAR(); return; }
      ask({ titulo: 'Excluir ' + atual + '?', msg: 'Remove a passagem deste paciente deste aparelho.', ok: 'Excluir', perigo: true }).then(function (sim) {
        if (!sim) return; delete todos[atual]; store.set('sbar', todos); store.set('sbarAtual', ''); viewSBAR();
      });
    };
  }

  // ---- Busca por voz (quando o navegador permite) ----
  function addVoz(input) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !input || EMBED) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'voz-btn'; b.setAttribute('aria-label', 'Buscar por voz'); b.textContent = '🎤';
    input.parentNode.classList.add('com-voz'); input.parentNode.appendChild(b);
    b.onclick = function () {
      var r = new SR(); r.lang = 'pt-BR'; r.interimResults = false; r.maxAlternatives = 1;
      b.classList.add('ouvindo');
      r.onresult = function (e) { input.value = e.results[0][0].transcript.replace(/\.$/, ''); input.dispatchEvent(new Event('input', { bubbles: true })); };
      r.onend = function () { b.classList.remove('ouvindo'); };
      r.onerror = function () { b.classList.remove('ouvindo'); toast('Não foi possível ouvir. Verifique a permissão do microfone.', true); };
      r.start();
    };
  }

  // ---- Classes de medicamentos (classificação terapêutica CMED/EphMRA) ----
  var GRUPOS_CLASSE = {
    A: ['🍽️', 'Aparelho digestivo e metabolismo'], B: ['🩸', 'Sangue e órgãos hematopoéticos'], C: ['❤️', 'Aparelho cardiovascular'], D: ['🧴', 'Dermatológicos'],
    F: ['🌿', 'Fitoterápicos'], G: ['🚻', 'Aparelho geniturinário e hormônios sexuais'], H: ['🧬', 'Hormônios sistêmicos (exceto sexuais e insulinas)'],
    J: ['🦠', 'Anti-infecciosos de uso sistêmico'], K: ['💧', 'Soluções hospitalares'], L: ['🎗️', 'Antineoplásicos e imunomoduladores'], M: ['🦴', 'Aparelho musculoesquelético'],
    N: ['🧠', 'Sistema nervoso'], P: ['🪱', 'Antiparasitários'], R: ['🫁', 'Aparelho respiratório'], S: ['👁️', 'Órgãos dos sentidos'], T: ['🔬', 'Agentes de diagnóstico'],
    V: ['🧪', 'Vários (antídotos, radiofármacos e outros)'], Z: ['📋', 'Outras classes (registro Anvisa)']
  };
  var IDX_CLASSE = null;
  function chaveClasse(cc, classe) { return cc || ('Z:' + (classe || 'Sem classe')); }
  function nomeClasse(k) { return k.indexOf('Z:') === 0 ? k.slice(2) : (CT.CLASSES[k] || k); }
  function grupoDe(k) { return k.indexOf('Z:') === 0 ? 'Z' : k.charAt(0); }
  function indiceClasses() {
    if (IDX_CLASSE) return IDX_CLASSE;
    var idx = {};
    function add(k, item) { (idx[k] = idx[k] || []).push(item); }
    D.DRUGS.forEach(function (d) { var mk = CT.mercado(d.id); if (mk && mk.cc) add(mk.cc, { id: d.id, nome: d.nome, ic: '💊', marcas: mk.marcas, ord: 0 }); });
    BX.EXTRAS.forEach(function (x) { var mk = CT.mercado(x.id); if (mk && mk.cc) add(mk.cc, { id: x.id, nome: x.nome, ic: '📄', marcas: mk.marcas, ord: 1 }); });
    CT.CAT.forEach(function (a) { var c = CT.item(a); add(chaveClasse(c.cc, c.classe), { id: c.id, nome: c.nome, ic: '📚', marcas: c.marcas, ord: 2 }); });
    Object.keys(idx).forEach(function (k) { idx[k].sort(function (a, b) { return a.ord - b.ord || a.nome.localeCompare(b.nome, 'pt-BR'); }); });
    IDX_CLASSE = idx;
    return idx;
  }
  function classeLinha(cc, classe) {
    var k = chaveClasse(cc, classe);
    if (!cc && !classe) return '';
    return '<p class="marcas-linha">🧭 <b>Classe:</b> <a href="#/classe/' + encodeURIComponent(k) + '">' + esc(nomeClasse(k)) + '</a>' + (cc ? ' <small>(' + esc(cc) + ')</small>' : '') + '</p>';
  }
  function viewClasses(grupo) {
    var idx = indiceClasses(), chaves = Object.keys(idx);
    if (!grupo) {
      setHeader('Classes de medicamentos', true);
      var porG = {};
      chaves.forEach(function (k) { var g = grupoDe(k); porG[g] = porG[g] || { c: 0, m: 0 }; porG[g].c++; porG[g].m += idx[k].length; });
      $app.innerHTML = '<p class="lead">Navegue pelos medicamentos por sistema do corpo e por classe terapêutica (mecanismo/atuação).</p>' +
        '<div class="search"><input id="cq" type="search" placeholder="Buscar classe (ex.: estatinas, betabloqueadores, SSRI)…" autocomplete="off" aria-label="Buscar classe"></div><div id="cres"></div>' +
        '<div id="cgrid" class="hub">' + Object.keys(GRUPOS_CLASSE).filter(function (g) { return porG[g]; }).map(function (g) {
          return '<a class="hub-tile" href="#/classes/' + g + '"><span class="hub-ic">' + GRUPOS_CLASSE[g][0] + '</span><b>' + esc(GRUPOS_CLASSE[g][1]) + '</b><small>' + porG[g].c + ' classes · ' + porG[g].m.toLocaleString('pt-BR') + ' medicamentos</small></a>';
        }).join('') + '</div>' +
        '<p class="disclaimer">Classificação terapêutica da Lista de Preços CMED/Anvisa (padrão EphMRA). Medicamentos só do registro da Anvisa aparecem em “Outras classes”.</p>';
      var cq = document.getElementById('cq');
      addVoz(cq);
      cq.addEventListener('input', function () {
        var t = norm(cq.value.trim()), res = document.getElementById('cres');
        document.getElementById('cgrid').hidden = !!t;
        if (!t) { res.innerHTML = ''; return; }
        var ws = t.split(/\s+/);
        var hits = chaves.filter(function (k) { var n = norm(nomeClasse(k) + ' ' + k); return ws.every(function (w) { return n.indexOf(w) >= 0; }); })
          .sort(function (a, b) { return idx[b].length - idx[a].length; }).slice(0, 60);
        res.innerHTML = hits.length ? '<div class="list">' + hits.map(function (k) { var g = GRUPOS_CLASSE[grupoDe(k)] || ['🧭']; return card('#/classe/' + encodeURIComponent(k), g[0], nomeClasse(k), (k.indexOf('Z:') ? k + ' · ' : '') + idx[k].length + ' medicamento' + (idx[k].length > 1 ? 's' : '')); }).join('') + '</div>'
          : '<p class="empty-msg">Nenhuma classe encontrada.</p>';
      });
      return;
    }
    var G = GRUPOS_CLASSE[grupo] || ['🧭', grupo];
    setHeader(G[1], true);
    var ks = chaves.filter(function (k) { return grupoDe(k) === grupo; }).sort(function (a, b) { return grupo === 'Z' ? nomeClasse(a).localeCompare(nomeClasse(b)) : a.localeCompare(b, 'en', { numeric: true }); });
    $app.innerHTML = '<p class="lead">' + G[0] + ' ' + ks.length + ' classes · toque para ver os medicamentos.</p><div class="list">' + ks.map(function (k) {
      return card('#/classe/' + encodeURIComponent(k), G[0], nomeClasse(k), (grupo === 'Z' ? '' : k + ' · ') + idx[k].length + ' medicamento' + (idx[k].length > 1 ? 's' : ''));
    }).join('') + '</div>';
  }
  function viewClasse(k) {
    var idx = indiceClasses(), itens = idx[k];
    if (!itens) return viewNotFound();
    var G = GRUPOS_CLASSE[grupoDe(k)] || ['🧭', ''];
    setHeader(nomeClasse(k), true);
    $app.innerHTML = '<p class="lead"><a href="#/classes/' + grupoDe(k) + '">' + G[0] + ' ' + esc(G[1]) + '</a>' + (k.indexOf('Z:') ? ' › ' + esc(k) : '') + '<br><small>' + itens.length + ' medicamento' + (itens.length > 1 ? 's' : '') + ' nesta classe</small></p>' +
      (k.indexOf('Z:') ? perfilHtml(k) : '') + '<h3 class="sub-h">💊 Medicamentos</h3>' +
      '<div class="list">' + itens.map(function (i) {
        var mc = marcasCurtas(i.marcas, 3);
        return card('#/droga/' + i.id, i.ic, i.nome, (mc ? '🏷️ ' + mc : 'sem nome comercial na lista') + (i.ord === 2 ? ' · catálogo' : i.ord === 1 ? ' · ficha resumida' : ' · ficha completa'), 'droga:' + i.id);
      }).join('') + '</div>' +
      '<p class="disclaimer">💊 ficha completa (preparo e dose) · 📄 ficha resumida · 📚 catálogo oficial. Medicamentos da mesma classe podem ter doses e indicações diferentes.</p>';
  }

  // ---- Escalas ----
  var GRUPOS_ESCALA = [['neuro', '🧠', 'Neurológicas e consciência'], ['uti', '🏥', 'Terapia intensiva e sepse'], ['clinica', '🩺', 'Avaliação clínica'], ['dor', '😣', 'Dor e sedação'],
    ['pele', '🩹', 'Pele, feridas e acessos'], ['seguranca', '🛡️', 'Segurança do paciente (quedas)'], ['cardio', '🫀', 'Cardiovascular e tromboembolismo'], ['funcional', '🧍', 'Funcionalidade e dependência'], ['neo', '👶', 'Obstetrícia e neonatologia']];
  var CAT_ESCALA_ANT = { glasgow: 'neuro', cincinnati: 'neuro', braden: 'pele', push: 'pele', morse: 'seguranca', rass: 'uti', ramsay: 'uti', qsofa: 'uti', apgar: 'neo', bishop: 'neo', news2: 'clinica', curb65: 'clinica', aldrete: 'clinica', bristol: 'clinica', flacc: 'dor', cpot: 'dor', dor: 'dor', 'wells-tep': 'cardio', katz: 'funcional', ecog: 'funcional' };
  function catEscala(sc) { return sc.cat || CAT_ESCALA_ANT[sc.id] || 'clinica'; }
  function viewScales() {
    setHeader('Escalas', false);
    $app.innerHTML = '<div class="search"><input id="eq" type="search" placeholder="Buscar escala (ex.: dor, queda, AVC, sepse)…" autocomplete="off" aria-label="Buscar escala"></div>' +
      '<p class="note">' + D.SCALES.length + ' escalas e índices clínicos · toque para aplicar; o resultado pode ser copiado para a evolução.</p><div id="el"></div>' +
      (store.get('escHist', []).length ? '<div class="ref-btns"><a class="btn sm ghost" href="#/escala-historico">🗂️ Avaliações salvas (' + store.get('escHist', []).length + ')</a></div>' : '');
    var eq = document.getElementById('eq'), el = document.getElementById('el');
    function render() {
      var t = norm(eq.value.trim()), ws = t ? t.split(/\s+/) : [];
      var ok = D.SCALES.filter(function (sc) { var n = norm(sc.nome + ' ' + sc.desc + ' ' + (GRUPOS_ESCALA.filter(function (g) { return g[0] === catEscala(sc); })[0] || [, , ''])[2]); return ws.every(function (w) { return n.indexOf(w) >= 0; }); });
      el.innerHTML = GRUPOS_ESCALA.map(function (g) {
        var ss = ok.filter(function (sc) { return catEscala(sc) === g[0]; });
        return ss.length ? '<h3 class="sub-h">' + g[1] + ' ' + esc(g[2]) + '</h3><div class="list">' + ss.map(function (sc) { return card('#/escala/' + sc.id, g[1], sc.nome, sc.desc, 'escala:' + sc.id); }).join('') + '</div>' : '';
      }).join('') || '<p class="empty-msg">Nenhuma escala encontrada.</p>';
    }
    addVoz(eq); eq.addEventListener('input', render); render();
  }
  var ESCALA_PROT = { nihss: ['avc'], cincinnati: ['avc'], 'hunt-hess': ['avc'], rankin: ['avc'], qsofa: ['sepse'], sofa: ['sepse'], news2: ['sepse'], 'cam-icu': ['delirium'], 'wells-tep': ['tep'],
    'wells-tvp': ['tev-profilaxia'], padua: ['tev-profilaxia'], morse: ['quedas'], downton: ['quedas'], 'humpty-dumpty': ['quedas'], braden: ['lesao-pressao'], push: ['lesao-pressao'], glasgow: ['tce'], 'glasgow-ped': ['tce'],
    silverman: ['reanimacao-neonatal'], apgar: ['reanimacao-neonatal'], poss: ['dor'], dor: ['dor'], bps: ['dor'], cpot: ['dor'], flacc: ['dor'], flebite: ['extravasamento'], infiltracao: ['extravasamento'], cha2ds2vasc: ['fa'], hasbled: ['fa'], curb65: ['pneumonia'], 'child-pugh': ['hda'], bishop: ['tpp'] };
  function protEscala(id) {
    return (ESCALA_PROT[id] || []).map(function (pid) { var p = PR.PROTOCOLOS.filter(function (x) { return x.id === pid; })[0]; return p ? '<a class="btn sm ghost" href="#/protocolo/' + pid + '">' + p.icon + ' Protocolo: ' + esc(p.nome) + '</a>' : ''; }).join('');
  }
  function viewEscalaHistorico() {
    setHeader('Avaliações salvas', true);
    var h = store.get('escHist', []);
    $app.innerHTML = '<p class="lead">Resultados de escalas salvos neste aparelho (não saem do celular).</p>' +
      (h.length ? '<div class="list">' + h.map(function (r, i) {
        return '<div class="card"><span class="card-ic">📋</span><span class="card-t"><b>' + esc(r.nome) + ' = ' + esc(String(r.score)) + '</b><small>' + esc(r.txt) + '<br>' + esc(r.quando) + (r.ref ? ' · ' + esc(r.ref) : '') + '</small></span><button type="button" class="btn sm ghost" data-del="' + i + '" aria-label="Apagar">🗑️</button></div>';
      }).join('') + '</div><div class="ref-btns"><button class="btn sm" id="eh-copy" type="button">📋 Copiar todas</button><button class="btn sm ghost" id="eh-clear" type="button">Apagar todas</button></div>'
        : '<p class="empty-msg">Nenhuma avaliação salva ainda.</p>');
    $app.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { h.splice(+b.getAttribute('data-del'), 1); store.set('escHist', h); viewEscalaHistorico(); }; });
    var c = document.getElementById('eh-copy');
    if (c) c.onclick = function () { copiarTexto(h.map(function (r) { return r.quando + (r.ref ? ' — ' + r.ref : '') + ' — ' + r.nome + ': ' + r.score + ' (' + r.txt + ')'; }).join('\n')); };
    var cl = document.getElementById('eh-clear');
    if (cl) cl.onclick = function () { ask({ titulo: 'Apagar avaliações', msg: 'Apagar todas as avaliações salvas?', ok: 'Apagar', perigo: true }).then(function (sim) { if (sim) { store.set('escHist', []); viewEscalaHistorico(); } }); };
  }

  function viewScale(id) {
    var s = D.SCALES.filter(function (x) { return x.id === id; })[0];
    if (!s) return viewNotFound();
    setHeader(s.nome, true);
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(s.desc) + (s.fonte ? '<br><small>Fonte: ' + esc(s.fonte) + '</small>' : '') + '</p>' + favButton('escala:' + s.id) + '</div>' +
      '<form id="sform" class="scale" onsubmit="return false">' + s.items.map(function (it, i) {
        return '<fieldset><legend>' + esc(it.label) + '</legend>' + it.opts.map(function (o) {
          return '<label class="opt"><input type="radio" name="s' + i + '" value="' + o[0] + '"><span class="opt-t">' + esc(o[1]) + '</span><span class="opt-p">' + (o[0] > 0 && s.id !== 'rass' ? '+' : '') + o[0] + '</span></label>';
        }).join('') + '</fieldset>';
      }).join('') + '</form>' +
      '<div class="score-bar" id="sbar"></div>' +
      '<div class="esc-acoes" id="sacoes" hidden><input id="sref" type="text" placeholder="Leito / paciente (opcional)" aria-label="Identificação"><button class="btn sm" id="scopy" type="button">📋 Copiar</button><button class="btn sm ghost" id="ssave" type="button">💾 Salvar</button></div>' +
      '<button class="btn ghost" id="sreset" type="button">Reiniciar</button>' +
      (protEscala(s.id) ? '<div class="ref-btns">' + protEscala(s.id) + '</div>' : '');
    var ultimo = null;
    var form = document.getElementById('sform'), bar = document.getElementById('sbar');
    function run() {
      var vals = [], missing = 0, sum = 0;
      s.items.forEach(function (it, i) {
        var r = form.querySelector('input[name=s' + i + ']:checked');
        if (r) { vals[i] = +r.value; sum += +r.value; } else if (!it.optional) missing++;
      });
      document.getElementById('sacoes').hidden = !!missing;
      if (missing) { ultimo = null; bar.className = 'score-bar'; bar.innerHTML = '<span>Faltam ' + missing + ' ' + (missing > 1 ? 'itens' : 'item') + '</span><b>' + (vals.length ? sum : '—') + '</b>'; return; }
      var r = s.interp(sum, vals);
      ultimo = r;
      bar.className = 'score-bar ' + r.level;
      bar.innerHTML = '<span>' + esc(r.txt) + (r.label ? '<small>' + esc(r.label) + '</small>' : '') + '</span><b>' + (r.score > 0 && s.id === 'rass' ? '+' : '') + r.score + '</b>';
    }
    form.addEventListener('change', run);
    document.getElementById('sreset').onclick = function () { form.reset(); run(); window.scrollTo(0, 0); };
    function textoRes() {
      var itens = s.items.map(function (it, i) { var r = form.querySelector('input[name=s' + i + ']:checked'); return r ? it.label.replace(/^\d+[a-z]?\.\s*/, '') + ': ' + r.parentNode.querySelector('.opt-t').textContent : ''; }).filter(Boolean);
      var ref = document.getElementById('sref').value.trim();
      return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) + (ref ? ' — ' + ref : '') + '\n' + s.nome + ' = ' + ultimo.score + ' — ' + ultimo.txt + (s.items.length > 1 ? '\n(' + itens.join('; ') + ')' : '');
    }
    document.getElementById('scopy').onclick = function () { if (ultimo) copiarTexto(textoRes()); };
    document.getElementById('ssave').onclick = function () {
      if (!ultimo) return;
      var h = store.get('escHist', []);
      h.unshift({ id: s.id, nome: s.nome, score: ultimo.score, txt: ultimo.txt, ref: document.getElementById('sref').value.trim(), quando: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) });
      store.set('escHist', h.slice(0, 200)); toast('Avaliação salva');
    };
    run();
  }

  function viewAbout() {
    setHeader('Sobre', true);
    $app.innerHTML = '<div class="sec"><h3>EnfCalc</h3><p>Calculadora de bolso para profissionais de enfermagem: gotejamento, regra de três, reconstituição, diluições, drogas vasoativas, transformação de soro, eletrólitos, pediatria, escalas e avaliações clínicas. Funciona offline e pode ser instalada na tela inicial do celular.</p></div>' +
      '<div class="alert warn">⚠️ <b>Aviso importante:</b> este aplicativo é uma ferramenta de apoio e não substitui o julgamento clínico, a prescrição médica, a bula do fabricante nem os protocolos institucionais. Diluições e doses variam entre fabricantes e serviços. Realize dupla checagem de medicamentos de alta vigilância.</div>' +
      '<div class="sec"><h3>Instalar no celular</h3><p>Android (Chrome): menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.<br>iPhone (Safari): botão Compartilhar → “Adicionar à Tela de Início”.</p></div>' +
      '<div class="sec"><h3>Fontes e revisão</h3><p>As fichas são uma compilação de referências usuais e indicam se já foram revisadas por farmacêutico. Cada ficha tem link para a bula oficial no Bulário da Anvisa. <a href="#/revisao">Ver painel de revisão e referências</a>.</p></div>' +
      '<div class="sec"><h3>Backup e troca de aparelho</h3><p>Maletas, favoritos e registros ficam salvos apenas neste aparelho. Exporte um backup para guardar ou levar para outro celular.</p>' +
        '<button class="btn" id="bk-exp" type="button">📦 Exportar backup completo</button>' +
        '<label class="btn ghost file-btn">📥 Restaurar backup (.json)<input type="file" id="bk-imp" accept=".json,application/json"></label></div>' +
      '<button class="btn ghost" id="clear-data" type="button">Apagar favoritos e dados salvos</button>';
    document.getElementById('bk-exp').onclick = function () {
      salvarArquivo(JSON.stringify(M.exportarBackup(loadMaletas(), favs()), null, 2), 'enfcalc-backup-' + new Date().toISOString().slice(0, 10) + '.json', 'Backup EnfCalc');
    };
    document.getElementById('bk-imp').onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) { toast('Arquivo grande demais.', true); return; }
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var r = M.importarBackup(JSON.parse(rd.result), D.DRUGS.map(function (x) { return x.id; }));
          var atuais = loadMaletas(), nomes = atuais.map(function (m) { return m.nome; });
          var novas = r.maletas.filter(function (m) { return nomes.indexOf(m.nome) < 0; });
          if (!store.trySet('maletas', atuais.concat(novas))) { toast('Não foi possível salvar neste navegador.', true); return; }
          var fv = favs(); r.favs.forEach(function (k) { if (fv.indexOf(k) < 0) fv.push(k); }); store.set('favs', fv);
          toast(novas.length + ' maleta(s) restaurada(s)' + (r.maletas.length - novas.length ? '; ' + (r.maletas.length - novas.length) + ' já existia(m)' : '') + '.');
        } catch (err) { toast(err instanceof SyntaxError ? 'Arquivo inválido.' : err.message, true); }
      };
      rd.readAsText(f);
    };
    document.getElementById('clear-data').onclick = function () {
      store.set('favs', []); store.set('peso', 70);
      this.textContent = 'Dados apagados ✓';
    };
  }

  function viewNotFound() {
    setHeader('Não encontrado', true);
    $app.innerHTML = '<p class="empty-msg">Página não encontrada. <a href="#/">Voltar ao início</a></p>';
  }

  // ---------- roteador ----------
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    window.scrollTo(0, 0);
    pararPCRTimers();
    var rk = { protocolo: 'prot:' + parts[1], sri: 'view:sri', hipodermoclise: 'view:hipo', calc: 'calc:' + parts[1], droga: 'droga:' + parts[1], escala: 'escala:' + parts[1], pcr: 'view:pcr', 'emergencia-ped': 'view:emergped', compatibilidade: 'view:compat', infusao: 'view:infusao', modulo: 'mod:' + parts[1], scanner: 'view:scanner', classes: 'view:classes', plantao: 'view:plantao', sbar: 'view:sbar' }[parts[0]];
    if (rk && (parts[1] || rk.indexOf('view:') === 0)) addRecente(rk);
    switch (parts[0]) {
      case '': viewHome(); break;
      case 'calculadoras': viewCalcList(); break;
      case 'calc': viewCalc(parts[1], parts[2]); break;
      case 'infusao': viewInfusao(parts[1]); break;
      case 'drogas': viewDrugs(); break;
      case 'droga': viewDrug(parts[1], parts[2] ? decodeURIComponent(parts[2]) : ''); break;
      case 'escalas': viewScales(); break;
      case 'escala': viewScale(parts[1]); break;
      case 'escala-historico': viewEscalaHistorico(); break;
      case 'sobre': viewAbout(); break;
      case 'revisao': viewRevisao(parts[1]); break;
      case 'pcr': viewPCR(); break;
      case 'emergencia': viewEmergencia(); break;
      case 'protocolos': viewProtocolos(); break;
      case 'modulo': viewModulo(parts[1]); break;
      case 'conferencia': viewConferencia(); break;
      case 'protocolo': viewProtocolo(parts[1]); break;
      case 'sri': viewSRI(); break;
      case 'hipodermoclise': viewHipo(); break;
      case 'ferramentas': viewFerramentas(); break;
      case 'scanner': viewScanner(); break;
      case 'classes': viewClasses(parts[1]); break;
      case 'classe': viewClasse(decodeURIComponent(parts[1] || '')); break;
      case 'plantao': viewPlantao(); break;
      case 'turno': viewTurno(); break;
      case 'sbar': viewSBAR(); break;
      case 'atender': viewAtender('lib'); break;
      case 'emergencia-ped': viewEmergPed(); break;
      case 'compatibilidade': viewCompat(parts[1]); break;
      case 'maletas': if (parts[1] === 'nova') viewMaletaForm(null, parts[2]); else viewMaletas(); break;
      case 'maleta':
        if (!parts[2]) viewMaleta(parts[1]);
        else if (parts[2] === 'adicionar') viewMaletaAdd(parts[1]);
        else if (parts[2] === 'novo') viewCustomForm(parts[1]);
        else if (parts[2] === 'editar') { if (parts[3]) viewCustomForm(parts[1], parts[3]); else viewMaletaForm(parts[1]); }
        else if (parts[2] === 'item') viewMaletaItem(parts[1], parts[3]);
        else if (parts[2] === 'ficha') viewMaletaFicha(parts[1]);
        else if (parts[2] === 'atender') { if (parts[3]) viewAtenderItem(parts[1], parts[3]); else viewAtender(parts[1]); }
        else viewNotFound();
        break;
      default: viewNotFound();
    }
  }

  // favoritos (delegação)
  $app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (!b) return;
    var on = toggleFav(b.getAttribute('data-fav'));
    b.classList.toggle('on', on);
    b.textContent = on ? '★' : '☆';
    b.setAttribute('aria-pressed', on);
  });

  $back.addEventListener('click', function () {
    if (history.length > 1) history.back(); else location.hash = '#/';
  });

  // aviso inicial
  var modal = document.getElementById('disclaimer-modal');
  if (!store.get('aceite', false)) {
    modal.hidden = false;
    document.getElementById('btn-aceite').onclick = function () { store.set('aceite', true); modal.hidden = true; };
  }

  window.addEventListener('hashchange', route);
  route();

  if (!EMBED && 'serviceWorker' in navigator && location.protocol !== 'file:') {
    var tinhaSW = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!tinhaSW || document.getElementById('upd-bar')) return;
      var b = document.createElement('div'); b.id = 'upd-bar'; b.className = 'upd-bar';
      b.innerHTML = '✨ Nova versão do EnfCalc instalada. <button type="button" class="btn sm">Atualizar agora</button>';
      b.querySelector('button').onclick = function () { location.reload(); };
      document.body.appendChild(b);
    });
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* offline indisponível */ }); });
  }

  // exposto para testes
  window.EnfCalc = { CALCS: CALCS, num: num, fmt: fmt };
})();
