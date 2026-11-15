/* EnfCalc — interface (SPA com rotas por hash) */
(function () {
  'use strict';

  var C = window.Calc, D = window.DATA;
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
    set: function (k, v) { try { localStorage.setItem('enfcalc.' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
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
    D.SCALES.forEach(function (s) { e.push({ key: 'escala:' + s.id, href: '#/escala/' + s.id, icon: '📋', title: s.nome, desc: s.desc, search: s.nome + ' ' + s.desc + ' escala' }); });
    return e;
  }

  function viewHome() {
    setHeader('EnfCalc', false);
    var entries = allEntries();
    var f = favs();
    var favEntries = entries.filter(function (e) { return f.indexOf(e.key) >= 0; });
    $app.innerHTML =
      '<div class="search"><input id="q" type="search" placeholder="Buscar cálculo, medicamento ou escala…" autocomplete="off" aria-label="Buscar"></div>' +
      '<div id="search-res"></div>' +
      '<div id="home-main">' +
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
      '<div class="list" id="dl"></div><p class="disclaimer">' + D.DRUGS.length + ' medicamentos. Informações de referência — confira a bula do fabricante e o protocolo institucional.</p>';
    var dl = document.getElementById('dl'), dq = document.getElementById('dq');
    function render() {
      var t = norm(dq.value.trim());
      var list = D.DRUGS.filter(function (d) { return !t || norm(d.nome + ' ' + d.classe).indexOf(t) >= 0; });
      dl.innerHTML = list.length ? list.map(function (d) { return card('#/droga/' + d.id, d.classe.indexOf('ALTA VIGILÂNCIA') >= 0 ? '🔴' : '💊', d.nome, d.classe, 'droga:' + d.id); }).join('')
        : '<p class="empty-msg">Nenhum medicamento encontrado.</p>';
    }
    dq.addEventListener('input', render);
    render();
  }

  function viewDrug(id) {
    var d = D.DRUGS.filter(function (x) { return x.id === id; })[0];
    if (!d) return viewNotFound();
    setHeader(d.nome, true);
    var hv = d.classe.indexOf('ALTA VIGILÂNCIA') >= 0;
    function sec(t, v, ic) { return v ? '<div class="sec"><h3>' + ic + ' ' + t + '</h3><p>' + esc(v) + '</p></div>' : ''; }
    var units = C.UNITS[d.conc.u].cls === 'mass' ? ['mcg', 'mg', 'g'] : [d.conc.u];
    var fields = [
      { id: 'dose', label: 'Dose prescrita', units: units, defU: d.conc.u },
      { id: 'qtd', label: 'Apresentação: quantidade', units: units, defU: d.conc.u, def: d.conc.qtd },
      { id: 'vol', label: 'Apresentação: em volume de', unit: 'mL', def: d.conc.vol }
    ];
    $app.innerHTML =
      '<div class="head-row"><p class="lead">' + esc(d.classe) + '</p>' + favButton('droga:' + d.id) + '</div>' +
      (hv ? '<div class="alert bad">🔴 Medicamento de alta vigilância: dupla checagem obrigatória.</div>' : '') +
      sec('Apresentação', d.apresentacao, '📦') + sec('Reconstituição', d.reconstituicao, '🧴') + sec('Diluição', d.diluicao, '💧') +
      sec('Administração', d.administracao, '⏱️') + sec('Estabilidade', d.estabilidade, '🗓️') + sec('Observações', d.obs, '⚠️') +
      (d.infusao ? '<a class="btn" href="#/infusao/' + d.infusao + '">🫀 Calcular infusão contínua</a>' : '') +
      '<h2>Calcular volume a aspirar</h2><form class="form" id="dform" onsubmit="return false">' + fields.map(function (f) { return fieldHtml(f, 'd'); }).join('') + '</form>' +
      '<div id="dout" aria-live="polite"></div>' +
      '<p class="disclaimer">Dados de referência; podem variar entre fabricantes. Confira a bula e o protocolo da instituição.</p>';
    bindLiveForm(document.getElementById('dform'), fields, function (v) {
      var ml = C.volumeDose(v.dose, v.dose_u, v.qtd, v.qtd_u, v.vol);
      if (ml == null) return null;
      return { results: [{ label: 'Aspirar', value: fmt(ml, 2), unit: 'mL', main: true }],
        warns: ml > v.vol ? ['A dose excede uma unidade da apresentação (' + fmt(ml / v.vol, 2) + ' unidades).'] : [] };
    }, document.getElementById('dout'));
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
