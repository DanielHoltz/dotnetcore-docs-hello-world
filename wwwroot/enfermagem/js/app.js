/* EnfCalc — interface (SPA com rotas por hash) */
(function () {
  'use strict';

  var C = window.Calc, D = window.DATA, M = window.Maletas, P = window.Paciente, DB = window.DOSES, R = window.Revisoes;
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
        { id: 'vol', label: 'Volume a infundir', unit: 'mL', def: 500 },
        { id: 'h', label: 'Tempo (horas)', unit: 'h', def: 8 },
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
        { id: 'vol', label: 'Volume', unit: 'mL', def: 500 },
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
        { id: 'vol', label: 'Volume', unit: 'mL', def: 100 },
        { id: 'min', label: 'Tempo de infusão', unit: 'min', def: 30 }
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
        { id: 'qtd', label: 'Conteúdo do frasco', units: MASS_UNITS, defU: 'mg', def: 1000 },
        { id: 'dil', label: 'Diluente adicionado', unit: 'mL', def: 10 },
        { id: 'desl', label: 'Volume ocupado pelo pó (se informado na bula)', unit: 'mL', def: 0, hint: 'Deixe 0 se desconhecido' },
        { id: 'dose', label: 'Dose prescrita', units: MASS_UNITS, defU: 'mg', def: 500 },
        { id: 'diluir', label: 'Diluir depois em (opcional)', unit: 'mL', def: 100, optional: true },
        { id: 'tempo', label: 'Tempo de infusão (opcional)', unit: 'min', def: 30, optional: true }
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
        { id: 'dil', label: 'Diluente (AD)', unit: 'mL', def: 8 },
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
        { id: 'vol', label: 'Volume do soro disponível', unit: 'mL', def: 500 },
        { id: 'c1', label: 'Concentração atual', unit: '%', def: 5 },
        { id: 'c2', label: 'Concentração desejada', unit: '%', def: 10 },
        { id: 'ca', label: 'Concentração da ampola', unit: '%', def: 50 },
        { id: 'va', label: 'Volume de cada ampola', unit: 'mL', def: 10 },
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
        { id: 'pct', label: 'Concentração', unit: '%', def: 0.9 },
        { id: 'vol', label: 'Volume', unit: 'mL', def: 500 }
      ],
      compute: function (v) {
        if (!(v.pct > 0)) return null;
        var out = [{ label: 'Concentração', value: fmt(v.pct * 10, 2), unit: 'mg/mL', main: true }];
        if (v.vol > 0) out.push({ label: 'Soluto no volume', value: fmt(v.pct * v.vol / 100, 2), unit: 'g' });
        return { results: out, notes: ['x% = x g em 100 mL = x × 10 mg/mL.'] };
      } },

    { id: 'dose-peso', cat: 'pediatria', icon: '⚖️', title: 'Dose por peso (mg/kg)', desc: 'Dose pediátrica e volume a administrar',
      fields: [
        { id: 'peso', label: 'Peso', unit: 'kg', def: 12 },
        { id: 'dpk', label: 'Dose prescrita/recomendada', unit: 'mg/kg', def: 15 },
        { id: 'tipo', label: 'A dose em mg/kg é', type: 'seg', options: [['dose', 'Por dose'], ['dia', 'Por dia (dividir)']], def: 'dose' },
        { id: 'nx', label: 'Doses por dia', unit: 'vezes', def: 4 },
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
        { id: 'fl', label: 'Fluxo', unit: 'L/min', def: 5 }
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
    if (f.type === 'date') {
      return '<div class="field">' + lab + '<input type="date" id="' + id + '" data-k="' + f.id + '"></div>';
    }
    var unit = f.units
      ? '<select class="unit" data-k="' + f.id + '_u" aria-label="Unidade">' + f.units.map(function (u) { return '<option' + (u === f.defU ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select>'
      : (f.unit ? '<span class="unit">' + esc(f.unit) + '</span>' : '');
    return '<div class="field">' + lab + '<div class="input-wrap"><input id="' + id + '" data-k="' + f.id + '" type="text" inputmode="decimal" autocomplete="off" value="' +
      (f.def != null ? esc(String(f.def).replace('.', ',')) : '') + '" placeholder="' + (f.optional ? 'opcional' : '') + '">' + unit + '</div>' +
      (f.hint ? '<small>' + esc(f.hint) + '</small>' : '') + '</div>';
  }

  function readValues(form, fields) {
    var v = {};
    fields.forEach(function (f) {
      if (f.type === 'seg') {
        var r = form.querySelector('input[data-k="' + f.id + '"]:checked');
        v[f.id] = r ? r.value : f.def;
      } else if (f.type === 'select' || f.type === 'date') {
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
    var hash = location.hash || '#/';
    if (hash.indexOf('#/infusao') === 0) hash = '#/calc';
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      var r = a.getAttribute('data-route');
      a.classList.toggle('active', r === '#/' ? (hash === '#/' || hash === '#/sobre') : hash.indexOf(r) === 0);
    });
  }

  function card(href, icon, title, desc, favKey) {
    return '<a class="card" href="' + href + '"><span class="card-ic">' + icon + '</span><span class="card-t"><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></span>' +
      (favKey && isFav(favKey) ? '<span class="star">★</span>' : '') + '<span class="chev">›</span></a>';
  }

  function allEntries() {
    var e = [];
    e.push({ key: 'view:infusao', href: '#/infusao', icon: '🫀', title: 'Infusão contínua / DVA', desc: 'mcg/kg/min ↔ mL/h', search: 'droga vasoativa noradrenalina dobutamina sedacao bomba' });
    CALCS.forEach(function (c) { e.push({ key: 'calc:' + c.id, href: '#/calc/' + c.id, icon: c.icon, title: c.title, desc: c.desc, search: c.title + ' ' + c.desc }); });
    D.DRUGS.forEach(function (d) { e.push({ key: 'droga:' + d.id, href: '#/droga/' + d.id, icon: '💊', title: d.nome, desc: d.classe, search: d.nome + ' ' + d.classe + ' diluicao' }); });
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

  function viewHome() {
    setHeader('EnfCalc', false);
    var entries = allEntries();
    var f = favs();
    var favEntries = entries.filter(function (e) { return f.indexOf(e.key) >= 0; });
    $app.innerHTML =
      '<div class="search"><input id="q" type="search" placeholder="Buscar cálculo, medicamento ou escala…" autocomplete="off" aria-label="Buscar"></div>' +
      '<div id="search-res"></div>' +
      '<div id="home-main">' + homeMaletas() +
      '<div class="quick">' +
        '<a href="#/calc/gotejamento" class="qk"><span>💧</span>Gotejamento</a>' +
        '<a href="#/infusao" class="qk"><span>🫀</span>Drogas vasoativas</a>' +
        '<a href="#/drogas" class="qk"><span>💊</span>Diluições</a>' +
        '<a href="#/calc/dose" class="qk"><span>💉</span>Regra de três</a>' +
        '<a href="#/escalas" class="qk"><span>📋</span>Escalas</a>' +
        '<a href="#/calc/transformacao-soro" class="qk"><span>🔬</span>Transformar soro</a>' +
      '</div>' +
      (favEntries.length ? '<h2>★ Favoritos</h2><div class="list">' + favEntries.map(function (e) { return card(e.href, e.icon, e.title, e.desc); }).join('') + '</div>' : '') +
      CATS.map(function (cat) {
        var items = CALCS.filter(function (c) { return c.cat === cat.id; });
        var extra = cat.id === 'infusao' ? card('#/infusao', '🫀', 'Infusão contínua / DVA', 'mcg/kg/min ↔ mL/h com predefinições', 'view:infusao') : '';
        return '<h2>' + cat.icon + ' ' + esc(cat.nome) + '</h2><div class="list">' + extra +
          items.map(function (c) { return card('#/calc/' + c.id, c.icon, c.title, c.desc, 'calc:' + c.id); }).join('') + '</div>';
      }).join('') +
      '<p class="disclaimer">Ferramenta de apoio. Confira sempre a prescrição, a bula e os protocolos da instituição. <a href="#/sobre">Sobre</a></p>' +
      '</div>';

    var q = document.getElementById('q'), res = document.getElementById('search-res'), main = document.getElementById('home-main');
    q.addEventListener('input', function () {
      var t = norm(q.value.trim());
      if (!t) { res.innerHTML = ''; main.hidden = false; return; }
      main.hidden = true;
      var words = t.split(/\s+/);
      var hits = entries.filter(function (e) { var s = norm(e.search + ' ' + e.title); return words.every(function (w) { return s.indexOf(w) >= 0; }); });
      res.innerHTML = hits.length ? '<div class="list">' + hits.slice(0, 40).map(function (e) { return card(e.href, e.icon, e.title, e.desc); }).join('') + '</div>'
        : '<p class="empty-msg">Nada encontrado para “' + esc(q.value) + '”.</p>';
    });
  }

  function viewCalcList() {
    setHeader('Calculadoras', false);
    $app.innerHTML = '<div class="list">' + card('#/infusao', '🫀', 'Infusão contínua / DVA', 'mcg/kg/min ↔ mL/h', 'view:infusao') + '</div>' +
      CATS.map(function (cat) {
        return '<h2>' + cat.icon + ' ' + esc(cat.nome) + '</h2><div class="list">' +
          CALCS.filter(function (c) { return c.cat === cat.id; }).map(function (c) { return card('#/calc/' + c.id, c.icon, c.title, c.desc, 'calc:' + c.id); }).join('') + '</div>';
      }).join('');
  }

  function viewCalc(id) {
    var c = CALCS.filter(function (x) { return x.id === id; })[0];
    if (!c) return viewNotFound();
    setHeader(c.title, true);
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(c.desc) + '</p>' + favButton('calc:' + c.id) + '</div>' +
      '<form class="form" id="calc-form" autocomplete="off" onsubmit="return false">' + c.fields.map(function (f) { return fieldHtml(f); }).join('') + '</form>' +
      '<div id="calc-out" aria-live="polite"></div>' +
      '<button class="btn ghost" id="btn-clear" type="button">Limpar campos</button>';
    var form = document.getElementById('calc-form');
    var run = bindLiveForm(form, c.fields, c.compute, document.getElementById('calc-out'));
    document.getElementById('btn-clear').onclick = function () {
      form.querySelectorAll('input[type=text],input[type=date]').forEach(function (i) { i.value = ''; });
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
        '<div class="field"><label for="i-qtd">Quantidade de droga na solução</label><div class="input-wrap"><input id="i-qtd" type="text" inputmode="decimal">' +
          '<select class="unit" id="i-qtdu">' + ['mcg', 'mg', 'g', 'UI'].map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="field"><label for="i-vol">Volume total da solução</label><div class="input-wrap"><input id="i-vol" type="text" inputmode="decimal"><span class="unit">mL</span></div></div>' +
        '<div class="field"><label for="i-peso">Peso do paciente</label><div class="input-wrap"><input id="i-peso" type="text" inputmode="decimal" value="' + esc(String(peso).replace('.', ',')) + '"><span class="unit">kg</span></div></div>' +
        '<div class="field"><label for="i-du">Unidade da dose</label><select id="i-du">' + doseUnits.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><span class="lbl">Calcular</span><div class="seg">' +
          '<label class="seg-opt"><input type="radio" name="i-modo" value="dose" checked><span>Dose → mL/h</span></label>' +
          '<label class="seg-opt"><input type="radio" name="i-modo" value="mlh"><span>mL/h → Dose</span></label></div></div>' +
        '<div class="field"><label for="i-val" id="i-val-l">Dose desejada</label><div class="input-wrap"><input id="i-val" type="text" inputmode="decimal"><span class="unit" id="i-val-u"></span></div></div>' +
      '</form><div id="inf-out" aria-live="polite"></div>';

    var $ = function (id) { return document.getElementById(id); };
    var cur = p;

    function applyPreset(x) {
      cur = x;
      if (!x) { $('i-sol').textContent = 'Informe a solução preparada.'; return; }
      $('i-qtd').value = String(x.qtd).replace('.', ',');
      $('i-qtdu').value = x.u;
      $('i-vol').value = x.vol;
      $('i-du').value = x.doseUnit;
      $('i-val').value = String(x.dose).replace('.', ',');
      document.querySelector('input[name=i-modo][value=dose]').checked = true;
      $('i-sol').textContent = 'Solução padrão: ' + x.solucao + ' (ajuste ao protocolo da sua instituição).';
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
    form.addEventListener('input', function (e) { if (e.target.id !== 'i-preset') run(); });
    form.addEventListener('change', function (e) { if (e.target.id !== 'i-preset') run(); });
    applyPreset(p);
    run();
  }

  // ---- Medicamentos ----
  function viewDrugs() {
    setHeader('Diluições', false);
    $app.innerHTML = '<div class="search"><input id="dq" type="search" placeholder="Buscar medicamento…" autocomplete="off" aria-label="Buscar medicamento"></div>' +
      '<a class="card solo" href="#/revisao"><span class="card-ic">📚</span><span class="card-t"><b>Referências e revisão das fichas</b><small>' + D.DRUGS.filter(function (d) { return R.revisao(d.id); }).length + ' de ' + D.DRUGS.length + ' revisadas · bulas Anvisa · ficha de conferência</small></span><span class="chev">›</span></a>' +
      '<div class="list" id="dl"></div><p class="disclaimer">' + D.DRUGS.length + ' medicamentos. Informações de referência — confira a bula do fabricante e o protocolo institucional.</p>';
    var dl = document.getElementById('dl'), dq = document.getElementById('dq');
    function render() {
      var t = norm(dq.value.trim());
      var list = D.DRUGS.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); }).filter(function (d) { return !t || norm(d.nome + ' ' + d.classe).indexOf(t) >= 0; });
      dl.innerHTML = list.length ? list.map(function (d) { return card('#/droga/' + d.id, d.classe.indexOf('ALTA VIGILÂNCIA') >= 0 ? '🔴' : '💊', d.nome, d.classe, 'droga:' + d.id); }).join('')
        : '<p class="empty-msg">Nenhum medicamento encontrado.</p>';
    }
    dq.addEventListener('input', render);
    render();
  }

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

  function bindDrugCalc(d) {
    var form = document.getElementById('dform');
    if (!form || !d.conc) return;
    var units = C.UNITS[d.conc.u].cls === 'mass' ? ['mcg', 'mg', 'g'] : [d.conc.u];
    var fields = [
      { id: 'dose', label: 'Dose prescrita', units: units, defU: d.conc.u },
      { id: 'qtd', label: 'Apresentação: quantidade', units: units, defU: d.conc.u, def: d.conc.qtd },
      { id: 'vol', label: 'Apresentação: em volume de', unit: 'mL', def: d.conc.vol }
    ];
    form.innerHTML = fields.map(function (f) { return fieldHtml(f, 'd'); }).join('');
    bindLiveForm(form, fields, function (v) {
      var ml = C.volumeDose(v.dose, v.dose_u, v.qtd, v.qtd_u, v.vol);
      if (ml == null) return null;
      return { results: [{ label: 'Aspirar', value: fmt(ml, 2), unit: 'mL', main: true }],
        warns: ml > v.vol ? ['A dose excede uma unidade da apresentação (' + fmt(ml / v.vol, 2) + ' unidades).'] : [] };
    }, document.getElementById('dout'));
  }

  function viewDrug(id) {
    var d = D.DRUGS.filter(function (x) { return x.id === id; })[0];
    if (!d) return viewNotFound();
    setHeader(d.nome, true);
    var ms = loadMaletas();
    var add = '<div class="sec addkit"><h3>🧰 Adicionar a uma maleta</h3>' + (ms.length
      ? '<div class="row"><select id="kit-sel" aria-label="Maleta">' + ms.map(function (m) {
          return '<option value="' + esc(m.id) + '"' + (M.temDroga(m, d.id) ? ' disabled' : '') + '>' + esc(m.icon + ' ' + m.nome) + (M.temDroga(m, d.id) ? ' (já contém)' : '') + '</option>';
        }).join('') + '</select><button class="btn sm" id="kit-add" type="button">Adicionar</button></div>'
      : '<p>Você ainda não tem maletas. <a href="#/maletas/nova/' + esc(d.id) + '">Criar uma maleta com este medicamento</a></p>') + '</div>';
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(d.classe) + '</p>' + favButton('droga:' + d.id) + '</div>' + drugSheetHtml(d) + refsHtml(d) + add;
    bindDrugCalc(d);
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

  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'maleta'; }

  // ---- Maletas: telas ----
  function viewMaletas() {
    setHeader('Maletas', false);
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
      if (!confirm('Excluir a maleta “' + m.nome + '” e todos os seus itens? Esta ação não pode ser desfeita.')) return;
      if (deleteMaleta(m.id)) { toast('Maleta excluída.'); location.replace('#/maletas'); }
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
        '<button class="btn ghost" id="k-share" type="button">📤 Compartilhar</button>' +
        '<a class="btn ghost" href="#/maleta/' + esc(m.id) + '/editar">⚙️ Editar maleta</a>' +
      '</div>';

    var kq = document.getElementById('kq');
    if (kq) kq.oninput = function () {
      var t = norm(kq.value.trim());
      document.querySelectorAll('#kl .card').forEach(function (c) { c.hidden = t && c.getAttribute('data-name').indexOf(t) < 0; });
    };
    document.getElementById('k-share').onclick = function () {
      var json = JSON.stringify(M.exportar(m), null, 2);
      var name = slug(m.nome) + '.enfcalc.json';
      var file;
      try { file = new File([json], name, { type: 'application/json' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Maleta ' + m.nome, text: 'Maleta “' + m.nome + '” do EnfCalc — abra o EnfCalc › Maletas › Importar.' }).catch(function () {});
        return;
      }
      var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      var aEl = document.createElement('a');
      aEl.href = url; aEl.download = name;
      document.body.appendChild(aEl); aEl.click(); aEl.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('Arquivo “' + name + '” salvo.');
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
      if (!confirm('Remover “' + d.nome + '” da maleta?')) return;
      m.itens = m.itens.filter(function (x) { return x.id !== it.id; });
      if (saveMaleta(m)) { toast('Removido.'); location.replace('#/maleta/' + m.id); }
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
      '<button class="btn" type="button" onclick="window.print()">🖨️ Imprimir / salvar PDF</button></div>' +
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
        '<button class="btn" type="button" onclick="window.print()">🖨️ Imprimir ficha de conferência</button></div>' +
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
  function kitDrugIds(m) { return m.itens.filter(function (i) { return i.drugId; }).map(function (i) { return i.drugId; }); }

  // Atualiza o HTML só se mudou (evita recriar elementos sob o dedo do usuário)
  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el && el.getAttribute('data-h') !== html) { el.innerHTML = html; el.setAttribute('data-h', html); }
  }

  function viewAtender(id) {
    var m = getMaleta(id);
    if (!m) return viewNotFound();
    setHeader('Atendimento', true);
    var pac = loadPaciente();
    var pf0 = P.perfil(pac);
    $app.innerHTML =
      '<a class="crumb" href="#/maleta/' + esc(m.id) + '">' + esc(m.icon + ' ' + m.nome) + '</a>' +
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
      '<div id="pac-resumo"></div><div id="kit-int"></div><div id="atl"></div>' +
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
            var nInt = P.interacoes(it.drugId, ids, DB, NOMES).filter(function (i) { return i.sev !== 'info'; }).length;
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
          return '<a class="card" href="#/maleta/' + esc(m.id) + '/atender/' + esc(it.id) + '"><span class="card-ic">' + ic + '</span><span class="card-t"><b>' + esc(d.nome) + '</b><small>' + esc(sub) + '</small>' +
            (bs ? '<span class="badges">' + bs + '</span>' : '') + '</span><span class="chev">›</span></a>';
        }).join('') + '</div>');
    }
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
      if (!confirm('Limpar os dados do paciente atual?')) return;
      store.set('paciente', null);
      viewAtender(id);
      document.getElementById('p-peso').focus();
    };
    render();
    if (!pf0.completo) document.getElementById('p-peso').focus();
  }

  function viewAtenderItem(id, itemId) {
    var m = getMaleta(id);
    var it = m && M.daMaleta(m, itemId);
    var d = it && M.resolver(it, D.DRUGS);
    if (!d) return viewNotFound();
    var pf = P.perfil(loadPaciente());
    if (!pf.completo) { location.replace('#/maleta/' + id + '/atender'); return; }
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
        '<h2>🧪 Preparo para este paciente</h2><form class="form" id="prf" onsubmit="return false" autocomplete="off">' +
          '<div class="field"><label for="pr-dose">Dose prescrita</label><div class="input-wrap"><input id="pr-dose" type="text" inputmode="decimal" value="' + (sug && sug.valor != null ? esc(String(sug.valor).replace('.', ',')) : '') + '" placeholder="informe a dose"><span class="unit">' + esc(d.conc.u) + '</span></div>' +
          '<small>Apresentação: ' + esc(concTxt(d.conc)) + (it.conc ? ' (da sua maleta)' : '') + '</small></div>' +
          (pronto || im ? '' : '<div class="field"><label for="pr-dil">Diluir em' + (dd && dd.diluente ? ' (' + esc(dd.diluente) + ')' : '') + '</label><div class="input-wrap"><input id="pr-dil" type="text" inputmode="decimal"><span class="unit">mL</span></div><small>0 = sem diluição em bolsa (EV direto)</small></div>') +
          (im ? '' : '<div class="field"><label for="pr-t">Tempo de administração</label><div class="input-wrap"><input id="pr-t" type="text" inputmode="decimal"><span class="unit">min</span></div><small>0 = bolus</small></div>') +
        '</form><div id="prep" aria-live="polite"></div>') +
      '<h2>🔗 Interações com esta maleta</h2>' +
      (ints.length ? ints.map(function (i) {
        return '<div class="int-item ' + sevClass(i.sev) + '"><b>' + sevIcon(i.sev) + ' ' + esc(i.tipo) + '</b>' + (i.com.length ? ' — ' + i.com.map(itemLink).join(', ') : '') + '<p>' + esc(i.txt) + '</p></div>';
      }).join('') : '<p class="note">' + (did ? 'Nenhuma interação cadastrada com os outros medicamentos desta maleta.' : 'Medicamento personalizado: interações não verificadas.') + '</p>') +
      '<p class="note">A checagem cobre interações e incompatibilidades importantes e frequentes; não é exaustiva. Em caso de dúvida, consulte a farmácia.</p>' +
      '<details class="sheet-box"><summary>📄 Ficha completa e referências</summary>' + drugSheetHtml(d, true) + refsHtml(d, it) + '</details>';

    if (cont || !d.conc) return;
    var $d = document.getElementById('pr-dose'), $dil = document.getElementById('pr-dil'), $t = document.getElementById('pr-t');
    var dirtyDil = false, dirtyT = false;
    function defaults() {
      var pad = P.preparoPadrao(did, num($d.value), d.conc, pf, DB);
      if ($dil && !dirtyDil) $dil.value = pad.diluenteMl;
      if ($t && !dirtyT) $t.value = String(pad.tempo).replace('.', ',');
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
      if (r.diluenteMl > 0) steps.push('<b>Diluir</b> em ' + fmt(r.diluenteMl, 0) + ' mL de ' + esc((dd && dd.diluente) || 'diluente') + ' → volume final <b>' + fmt(r.total, 1) + ' mL</b> (' + fmt(r.concFinal, 3) + ' ' + esc(d.conc.u) + '/mL)');
      if (r.via === 'im') steps.push('<b>Aplicar</b> por via ' + esc(dd.viaTxt || 'IM/SC'));
      else if (r.tempo > 0) {
        steps.push((r.diluenteMl > 0 || r.via === 'pronto' ? '<b>Infundir</b> em ' : '<b>Administrar EV lento</b> em ') + fmtTempo(r.tempo) +
          (r.diluenteMl > 0 || r.via === 'pronto' ? ': <span class="big">' + fmt(r.mlh, 1) + ' mL/h</span> na bomba · ' + fmt(Math.round(r.gts), 0) + ' gts/min · ' + fmt(Math.round(r.mcgts), 0) + ' mcgts/min' : ''));
      } else steps.push('<b>Administrar</b> em bolus');
      if (dd && dd.admTxt) steps.push(esc(dd.admTxt));
      var av = r.avisos.slice();
      if (sug && sug.max != null && dose > sug.max * 1.001) av.unshift('Dose acima da máxima de referência (' + fmt(sug.max, 3) + ' ' + d.conc.u + '). Confirme com o prescritor.');
      if (sug && sug.valor != null && (dose > sug.valor * 2 || dose < sug.valor / 2)) av.push('Dose muito diferente da sugestão (' + fmt(sug.valor, 3) + ' ' + d.conc.u + '). Confira a prescrição e a unidade.');
      out.innerHTML = '<ol class="steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
        av.map(function (a) { return '<div class="alert warn">⚠️ ' + esc(a) + '</div>'; }).join('');
    }
    $d.addEventListener('input', function () { defaults(); run(); });
    if ($dil) $dil.addEventListener('input', function () { dirtyDil = true; run(); });
    if ($t) $t.addEventListener('input', function () { dirtyT = true; run(); });
    defaults(); run();
  }

  function fmtTempo(min) {
    if (min < 1) return Math.round(min * 60) + ' s';
    return min >= 60 ? fmtHM(min) : fmt(min, 1) + ' min';
  }

  // ---- Escalas ----
  function viewScales() {
    setHeader('Escalas', false);
    $app.innerHTML = '<div class="list">' + D.SCALES.map(function (s) { return card('#/escala/' + s.id, '📋', s.nome, s.desc, 'escala:' + s.id); }).join('') + '</div>';
  }

  function viewScale(id) {
    var s = D.SCALES.filter(function (x) { return x.id === id; })[0];
    if (!s) return viewNotFound();
    setHeader(s.nome, true);
    $app.innerHTML = '<div class="head-row"><p class="lead">' + esc(s.desc) + '</p>' + favButton('escala:' + s.id) + '</div>' +
      '<form id="sform" class="scale" onsubmit="return false">' + s.items.map(function (it, i) {
        return '<fieldset><legend>' + esc(it.label) + '</legend>' + it.opts.map(function (o) {
          return '<label class="opt"><input type="radio" name="s' + i + '" value="' + o[0] + '"><span class="opt-t">' + esc(o[1]) + '</span><span class="opt-p">' + (o[0] > 0 && s.id !== 'rass' ? '+' : '') + o[0] + '</span></label>';
        }).join('') + '</fieldset>';
      }).join('') + '</form>' +
      '<div class="score-bar" id="sbar"></div>' +
      '<button class="btn ghost" id="sreset" type="button">Reiniciar</button>';
    var form = document.getElementById('sform'), bar = document.getElementById('sbar');
    function run() {
      var vals = [], missing = 0, sum = 0;
      s.items.forEach(function (it, i) {
        var r = form.querySelector('input[name=s' + i + ']:checked');
        if (r) { vals[i] = +r.value; sum += +r.value; } else if (!it.optional) missing++;
      });
      if (missing) { bar.className = 'score-bar'; bar.innerHTML = '<span>Faltam ' + missing + ' ' + (missing > 1 ? 'itens' : 'item') + '</span><b>' + (vals.length ? sum : '—') + '</b>'; return; }
      var r = s.interp(sum, vals);
      bar.className = 'score-bar ' + r.level;
      bar.innerHTML = '<span>' + esc(r.txt) + (r.label ? '<small>' + esc(r.label) + '</small>' : '') + '</span><b>' + (r.score > 0 && s.id === 'rass' ? '+' : '') + r.score + '</b>';
    }
    form.addEventListener('change', run);
    document.getElementById('sreset').onclick = function () { form.reset(); run(); window.scrollTo(0, 0); };
    run();
  }

  function viewAbout() {
    setHeader('Sobre', true);
    $app.innerHTML = '<div class="sec"><h3>EnfCalc</h3><p>Calculadora de bolso para profissionais de enfermagem: gotejamento, regra de três, reconstituição, diluições, drogas vasoativas, transformação de soro, eletrólitos, pediatria, escalas e avaliações clínicas. Funciona offline e pode ser instalada na tela inicial do celular.</p></div>' +
      '<div class="alert warn">⚠️ <b>Aviso importante:</b> este aplicativo é uma ferramenta de apoio e não substitui o julgamento clínico, a prescrição médica, a bula do fabricante nem os protocolos institucionais. Diluições e doses variam entre fabricantes e serviços. Realize dupla checagem de medicamentos de alta vigilância.</div>' +
      '<div class="sec"><h3>Instalar no celular</h3><p>Android (Chrome): menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.<br>iPhone (Safari): botão Compartilhar → “Adicionar à Tela de Início”.</p></div>' +
      '<div class="sec"><h3>Fontes e revisão</h3><p>As fichas são uma compilação de referências usuais e indicam se já foram revisadas por farmacêutico. Cada ficha tem link para a bula oficial no Bulário da Anvisa. <a href="#/revisao">Ver painel de revisão e referências</a>.</p></div>' +
      '<div class="sec"><h3>Dados locais</h3><p>Favoritos e o último peso informado ficam salvos apenas neste aparelho.</p></div>' +
      '<button class="btn ghost" id="clear-data" type="button">Apagar favoritos e dados salvos</button>';
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
    switch (parts[0]) {
      case '': viewHome(); break;
      case 'calculadoras': viewCalcList(); break;
      case 'calc': viewCalc(parts[1]); break;
      case 'infusao': viewInfusao(parts[1]); break;
      case 'drogas': viewDrugs(); break;
      case 'droga': viewDrug(parts[1]); break;
      case 'escalas': viewScales(); break;
      case 'escala': viewScale(parts[1]); break;
      case 'sobre': viewAbout(); break;
      case 'revisao': viewRevisao(parts[1]); break;
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

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* offline indisponível */ }); });
  }

  // exposto para testes
  window.EnfCalc = { CALCS: CALCS, num: num, fmt: fmt };
})();
