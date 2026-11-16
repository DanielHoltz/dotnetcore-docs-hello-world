/*
 * EnfCalc — apresentações comerciais usuais no Brasil (para escolher a ampola/frasco em vez de digitar).
 * Cada item: [rótulo, quantidade, unidade, volume em mL (para pó: volume APÓS reconstituir)].
 * Confira sempre o rótulo do produto em mãos: concentrações variam entre fabricantes.
 */
(function (root) {
  'use strict';

  var AP = {
    'aciclovir': [['FA 250 mg pó + 10 mL AD', 250, 'mg', 10]],
    'adenosina': [['Ampola 6 mg/2 mL', 6, 'mg', 2]],
    'adrenalina': [['Ampola 1 mg/mL', 1, 'mg', 1], ['Diluída 0,1 mg/mL (1 mL + 9 mL SF)', 1, 'mg', 10]],
    'amicacina': [['Ampola 500 mg/2 mL', 500, 'mg', 2], ['Ampola 100 mg/2 mL', 100, 'mg', 2]],
    'amiodarona': [['Ampola 150 mg/3 mL', 150, 'mg', 3]],
    'ampicilina': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10], ['FA 500 mg pó + 5 mL AD', 500, 'mg', 5]],
    'ampi-sulbactam': [['FA 3 g pó + 6,4 mL AD (≈ 8 mL)', 3000, 'mg', 8], ['FA 1,5 g pó + 3,2 mL AD (≈ 4 mL)', 1500, 'mg', 4]],
    'atropina': [['Ampola 0,25 mg/mL', 0.25, 'mg', 1], ['Ampola 0,5 mg/mL', 0.5, 'mg', 1]],
    'azitromicina-ev': [['FA 500 mg pó + 4,8 mL AD (100 mg/mL)', 500, 'mg', 5]],
    'bicarbonato': [['Ampola 8,4% 10 mL (10 mEq)', 10, 'mEq', 10], ['Frasco 8,4% 250 mL (250 mEq)', 250, 'mEq', 250]],
    'bromoprida': [['Ampola 10 mg/2 mL', 10, 'mg', 2]],
    'cefalotina': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10]],
    'cefazolina': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10], ['FA 2 g pó + 20 mL AD', 2000, 'mg', 20]],
    'cefepima': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10], ['FA 2 g pó + 20 mL AD', 2000, 'mg', 20]],
    'cefoxitina': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10], ['FA 2 g pó + 20 mL AD', 2000, 'mg', 20]],
    'ceftazidima': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10], ['FA 2 g pó + 20 mL AD', 2000, 'mg', 20]],
    'ceftriaxona': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10], ['FA 500 mg pó + 5 mL AD', 500, 'mg', 5], ['FA 2 g pó + 20 mL AD', 2000, 'mg', 20]],
    'cefuroxima': [['FA 750 mg pó + 6 mL AD', 750, 'mg', 6], ['FA 750 mg pó + 10 mL AD', 750, 'mg', 10]],
    'cetoprofeno-ev': [['FA 100 mg pó diluído em 100 mL', 100, 'mg', 100], ['Ampola IM 100 mg/2 mL', 100, 'mg', 2]],
    'ciprofloxacino': [['Bolsa 200 mg/100 mL', 200, 'mg', 100], ['Bolsa 400 mg/200 mL', 400, 'mg', 200]],
    'clindamicina': [['Ampola 600 mg/4 mL', 600, 'mg', 4], ['Ampola 300 mg/2 mL', 300, 'mg', 2], ['Ampola 900 mg/6 mL', 900, 'mg', 6]],
    'cloreto-potassio': [['Ampola 19,1% 10 mL (25,6 mEq)', 25.6, 'mEq', 10], ['Ampola 10% 10 mL (13,4 mEq)', 13.4, 'mEq', 10]],
    'dexametasona': [['Ampola 4 mg/mL (2,5 mL = 10 mg)', 4, 'mg', 1], ['Ampola 2 mg/mL (1 mL)', 2, 'mg', 1]],
    'diazepam': [['Ampola 10 mg/2 mL', 10, 'mg', 2]],
    'dipirona': [['Ampola 1 g/2 mL (500 mg/mL)', 1000, 'mg', 2], ['Ampola 2,5 g/5 mL', 2500, 'mg', 5]],
    'dobutamina': [['Ampola 250 mg/20 mL', 250, 'mg', 20]],
    'dopamina': [['Ampola 50 mg/10 mL', 50, 'mg', 10]],
    'enoxaparina': [['Seringa 40 mg/0,4 mL', 40, 'mg', 0.4], ['Seringa 20 mg/0,2 mL', 20, 'mg', 0.2], ['Seringa 60 mg/0,6 mL', 60, 'mg', 0.6], ['Seringa 80 mg/0,8 mL', 80, 'mg', 0.8], ['Seringa 100 mg/1 mL', 100, 'mg', 1]],
    'ertapenem': [['FA 1 g pó + 10 mL AD', 1000, 'mg', 10]],
    'escopolamina': [['Ampola 20 mg/mL', 20, 'mg', 1]],
    'etomidato': [['Ampola 20 mg/10 mL (2 mg/mL)', 20, 'mg', 10]],
    'cetamina': [['Frasco 500 mg/10 mL (50 mg/mL)', 500, 'mg', 10]],
    'fenitoina': [['Ampola 250 mg/5 mL (50 mg/mL)', 250, 'mg', 5]],
    'fentanil': [['Ampola 50 mcg/mL — 2 mL (100 mcg)', 100, 'mcg', 2], ['Ampola 50 mcg/mL — 5 mL (250 mcg)', 250, 'mcg', 5], ['Ampola 50 mcg/mL — 10 mL (500 mcg)', 500, 'mcg', 10]],
    'fitomenadiona': [['Ampola 10 mg/mL', 10, 'mg', 1], ['Ampola pediátrica 2 mg/0,2 mL', 2, 'mg', 0.2]],
    'flumazenil': [['Ampola 0,5 mg/5 mL (0,1 mg/mL)', 0.5, 'mg', 5]],
    'fluconazol': [['Bolsa 200 mg/100 mL', 200, 'mg', 100]],
    'furosemida': [['Ampola 20 mg/2 mL', 20, 'mg', 2]],
    'gentamicina': [['Ampola 80 mg/2 mL', 80, 'mg', 2], ['Ampola 40 mg/1 mL', 40, 'mg', 1], ['Ampola 160 mg/2 mL', 160, 'mg', 2], ['Ampola pediátrica 20 mg/1 mL', 20, 'mg', 1]],
    'glicose-50': [['Ampola 50% 10 mL (5 g)', 5000, 'mg', 10], ['Ampola 25% 10 mL (2,5 g)', 2500, 'mg', 10]],
    'gluconato-calcio': [['Ampola 10% 10 mL (1 g)', 1000, 'mg', 10]],
    'haloperidol': [['Ampola 5 mg/mL', 5, 'mg', 1]],
    'heparina': [['Frasco 5.000 UI/mL — 5 mL (25.000 UI)', 25000, 'UI', 5], ['Ampola SC 5.000 UI/0,25 mL', 5000, 'UI', 0.25]],
    'hidralazina': [['Ampola 20 mg/mL', 20, 'mg', 1], ['Diluída 1 mg/mL (1 mL + 19 mL AD)', 20, 'mg', 20]],
    'hidrocortisona': [['FA 100 mg pó + 2 mL diluente', 100, 'mg', 2], ['FA 500 mg pó + 4 mL diluente', 500, 'mg', 4]],
    'imipenem': [['FA 500 mg preparado em 100 mL', 500, 'mg', 100]],
    'insulina-regular': [['Frasco 100 UI/mL (10 mL)', 100, 'UI', 1], ['Solução 1 UI/mL (100 UI + 99 mL SF)', 100, 'UI', 100]],
    'levofloxacino': [['Bolsa 500 mg/100 mL', 500, 'mg', 100], ['Bolsa 750 mg/150 mL', 750, 'mg', 150]],
    'linezolida': [['Bolsa 600 mg/300 mL', 600, 'mg', 300]],
    'meropenem': [['FA 1 g pó + 20 mL AD', 1000, 'mg', 20], ['FA 500 mg pó + 10 mL AD', 500, 'mg', 10], ['FA 2 g pó + 40 mL AD', 2000, 'mg', 40]],
    'metoclopramida': [['Ampola 10 mg/2 mL', 10, 'mg', 2]],
    'metronidazol': [['Bolsa 500 mg/100 mL', 500, 'mg', 100]],
    'midazolam': [['Ampola 15 mg/3 mL (5 mg/mL)', 15, 'mg', 3], ['Ampola 50 mg/10 mL (5 mg/mL)', 50, 'mg', 10], ['Ampola 5 mg/5 mL (1 mg/mL)', 5, 'mg', 5], ['Ampola 5 mg/mL — 1 mL', 5, 'mg', 1]],
    'morfina': [['Ampola 10 mg/mL', 10, 'mg', 1], ['Ampola 2 mg/2 mL (1 mg/mL)', 2, 'mg', 2], ['Diluída 1 mg/mL (1 mL + 9 mL)', 10, 'mg', 10]],
    'naloxona': [['Ampola 0,4 mg/mL', 0.4, 'mg', 1], ['Diluída 0,04 mg/mL (1 mL + 9 mL SF)', 0.4, 'mg', 10]],
    'nitroglicerina': [['Ampola 50 mg/10 mL', 50, 'mg', 10], ['Ampola 25 mg/5 mL', 25, 'mg', 5]],
    'nitroprussiato': [['Ampola 50 mg/2 mL', 50, 'mg', 2]],
    'noradrenalina': [['Ampola 4 mg/4 mL', 4, 'mg', 4]],
    'ocitocina': [['Ampola 5 UI/mL', 5, 'UI', 1]],
    'omeprazol': [['FA 40 mg + diluente 10 mL', 40, 'mg', 10]],
    'ondansetrona': [['Ampola 8 mg/4 mL', 8, 'mg', 4], ['Ampola 4 mg/2 mL', 4, 'mg', 2]],
    'oxacilina': [['FA 500 mg pó + 5 mL AD', 500, 'mg', 5], ['FA 500 mg pó + 10 mL AD', 500, 'mg', 10]],
    'pantoprazol': [['FA 40 mg + diluente 10 mL', 40, 'mg', 10]],
    'paracetamol-ev': [['Frasco 1 g/100 mL', 1000, 'mg', 100], ['Frasco 500 mg/50 mL', 500, 'mg', 50]],
    'penicilina-benzatina': [['FA 1.200.000 UI (4 mL)', 1200000, 'UI', 4]],
    'penicilina-cristalina': [['FA 5.000.000 UI + 8 mL AD (≈ 10 mL)', 5000000, 'UI', 10], ['FA 5.000.000 UI + 10 mL AD (≈ 12 mL)', 5000000, 'UI', 12]],
    'pipe-tazo': [['FA 4,5 g pó + 20 mL (≈ 23 mL)', 4500, 'mg', 23]],
    'propofol': [['Frasco/ampola 1% (10 mg/mL) — 20 mL', 200, 'mg', 20], ['Frasco 1% — 50 mL', 500, 'mg', 50], ['Frasco 1% — 100 mL', 1000, 'mg', 100], ['Frasco 2% (20 mg/mL) — 50 mL', 1000, 'mg', 50]],
    'rocuronio': [['Ampola 50 mg/5 mL (10 mg/mL)', 50, 'mg', 5]],
    'sacarato-ferro': [['Ampola 100 mg/5 mL', 100, 'mg', 5]],
    'smx-tmp': [['Ampola 5 mL (400 mg SMX + 80 mg TMP)', 80, 'mg', 5]],
    'succinilcolina': [['FA 100 mg pó + 5 mL AD (20 mg/mL)', 100, 'mg', 5], ['FA 100 mg pó + 10 mL AD (10 mg/mL)', 100, 'mg', 10], ['FA 500 mg pó + 10 mL AD (50 mg/mL)', 500, 'mg', 10]],
    'sulfato-magnesio': [['Ampola 50% 10 mL (5 g)', 5000, 'mg', 10], ['Ampola 10% 10 mL (1 g)', 1000, 'mg', 10]],
    'teicoplanina': [['FA 400 mg pó + 3 mL AD', 400, 'mg', 3], ['FA 200 mg pó + 3 mL AD', 200, 'mg', 3]],
    'tenoxicam': [['FA 20 mg + 2 mL diluente', 20, 'mg', 2], ['FA 40 mg + 2 mL diluente', 40, 'mg', 2]],
    'tramadol': [['Ampola 100 mg/2 mL', 100, 'mg', 2], ['Ampola 50 mg/1 mL', 50, 'mg', 1]],
    'tranexamico': [['Ampola 250 mg/5 mL', 250, 'mg', 5]],
    'vancomicina': [['FA 500 mg pó + 10 mL AD', 500, 'mg', 10], ['FA 1 g pó + 20 mL AD', 1000, 'mg', 20]],
    'vasopressina': [['Ampola 20 UI/mL', 20, 'UI', 1]]
  };

  function lista(id, concPadrao) {
    var l = (AP[id] || []).map(function (a) { return { rot: a[0], qtd: a[1], u: a[2], vol: a[3] }; });
    if (!l.length && concPadrao) l.push({ rot: concPadrao.qtd + ' ' + concPadrao.u + ' / ' + concPadrao.vol + ' mL', qtd: concPadrao.qtd, u: concPadrao.u, vol: concPadrao.vol });
    return l;
  }
  function igual(a, b) { return a && b && a.u === b.u && Math.abs(a.qtd / a.vol - b.qtd / b.vol) < 1e-9 && Math.abs(a.vol - b.vol) < 1e-9; }

  var api = { AP: AP, lista: lista, igual: igual };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Apresentacoes = api;
})(this);
