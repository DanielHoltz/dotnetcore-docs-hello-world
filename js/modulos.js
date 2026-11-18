/*
 * EnfCalc — módulos por área de atuação: agrupam atalhos, protocolos, calculadoras,
 * medicamentos e escalas que mais se usam em cada cenário.
 * Estrutura: { id, nome, icon, desc, atalhos: [[href, ícone, título, descrição]], protocolos: [ids],
 *              calcs: [ids], drogas: [ids], cats: [categorias do bulário], escalas: [ids] }
 */
(function (root) {
  'use strict';

  var MODULOS = [
    { id: 'emergencia', nome: 'Emergência e PCR', icon: '🚨', desc: 'PCR, intubação, choque, intoxicações e antídotos',
      atalhos: [['#/pcr', '🚨', 'Modo PCR', 'Cronômetro, adrenalina e registro'], ['#/sri', '🫁', 'Intubação — sequência rápida', 'Passo a passo, doses e ventilação'],
        ['#/emergencia-ped', '👶', 'Emergência pediátrica', 'Doses e materiais por peso'], ['#/infusao/noradrenalina', '🫀', 'Drogas vasoativas', 'mcg/kg/min ↔ mL/h']],
      protocolos: ['pcr-adulto', 'bradicardia', 'taquicardia', 'trauma-xabcde', 'tce', 'sepse', 'choque-hipo', 'anafilaxia', 'sca', 'eap', 'avc', 'convulsao', 'asma', 'tep', 'emerg-has', 'hiperk', 'hipoglicemia', 'intox', 'peconhentos', 'afogamento', 'queimados', 'reacao-transfusional'],
      calcs: ['oxigenio', 'pam', 'parkland', 'dose'],
      drogas: ['adrenalina', 'amiodarona', 'atropina', 'adenosina', 'noradrenalina', 'naloxona', 'flumazenil', 'glicose-50', 'gluconato-calcio', 'cloreto-calcio', 'bicarbonato', 'sulfato-magnesio',
        'midazolam', 'diazepam', 'cetamina', 'etomidato', 'rocuronio', 'succinilcolina', 'sugamadex', 'tranexamico', 'carvao-ativado', 'azul-metileno', 'hidroxocobalamina', 'complexo-protrombinico', 'idarucizumabe'],
      escalas: ['glasgow', 'qsofa', 'news2'] },

    { id: 'uti', nome: 'UTI e terapia intensiva', icon: '🏥', desc: 'Vasoativos, sedação, eletrólitos e antimicrobianos de reserva',
      atalhos: [['#/infusao', '🫀', 'Infusão contínua', 'Vasoativos, sedação, insulina, heparina'], ['#/sri', '🫁', 'Intubação e ventilação inicial', 'Doses e parâmetros do ventilador'],
        ['#/compatibilidade', '🔗', 'Interações e compatibilidade', 'Checar medicamentos juntos']],
      protocolos: ['sepse', 'pcr-adulto', 'cad', 'ehh', 'hipona', 'hipok', 'hiperk', 'delirium', 'eap', 'tce', 'neutropenia-febril', 'tev-profilaxia', 'reacao-transfusional', 'alcool'],
      calcs: ['clearance', 'anion-gap', 'sodio-corrigido', 'adrogue', 'balanco', 'eletrolitos', 'vazao-bomba'],
      drogas: ['noradrenalina', 'vasopressina', 'adrenalina', 'dobutamina', 'dopamina', 'milrinona', 'nitroprussiato', 'nitroglicerina', 'propofol', 'midazolam', 'fentanil', 'dexmedetomidina', 'cetamina',
        'cisatracurio', 'rocuronio', 'heparina', 'insulina-regular', 'cloreto-potassio', 'fosfato-potassio', 'cloreto-sodio-20', 'sulfato-magnesio', 'meropenem', 'vancomicina', 'polimixina-b',
        'colistimetato', 'ceftazidima-avibactam', 'pantoprazol', 'clonidina'],
      escalas: ['rass', 'cpot', 'glasgow', 'braden'] },

    { id: 'clinica', nome: 'Clínica e enfermaria', icon: '🩺', desc: 'Preparo, soros, antibióticos e cuidados do dia a dia',
      atalhos: [['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Peso, idade, alergias e passo a passo'], ['#/compatibilidade', '🔗', 'Interações e compatibilidade', 'Checar medicamentos juntos']],
      protocolos: ['seguranca-paciente', 'quedas', 'tev-profilaxia', 'hipoglicemia', 'hipok', 'emerg-has', 'dor', 'delirium', 'dpoc', 'dengue', 'hda', 'alcool', 'celulite', 'reacao-transfusional'],
      calcs: ['gotejamento', 'tempo-infusao', 'vazao-bomba', 'dose', 'reconstituicao', 'aprazamento', 'transformacao-soro', 'eletrolitos', 'percentual', 'clearance', 'imc', 'ganzoni'],
      drogas: ['dipirona', 'paracetamol-ev', 'tramadol', 'morfina', 'ondansetrona', 'metoclopramida', 'bromoprida', 'omeprazol', 'ceftriaxona', 'cefazolina', 'pipe-tazo', 'ampi-sulbactam',
        'clindamicina', 'metronidazol', 'enoxaparina', 'furosemida', 'hidrocortisona', 'insulina-regular', 'cloreto-potassio', 'sacarato-ferro'],
      escalas: ['morse', 'braden', 'news2', 'dor'] },

    { id: 'pediatria', nome: 'Pediatria', icon: '🧸', desc: 'Dose por peso, hidratação e emergências da criança',
      atalhos: [['#/emergencia-ped', '👶', 'Emergência pediátrica', 'Doses, tubo e desfibrilação por peso'], ['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Informe peso e idade']],
      protocolos: ['reanimacao-neonatal', 'desidratacao-ped', 'bronquiolite', 'crupe', 'convulsao-febril', 'febre-ped', 'dengue', 'asma', 'anafilaxia'],
      calcs: ['dose-peso', 'holliday', 'dose', 'gotejamento'],
      drogas: ['paracetamol-oral', 'ibuprofeno', 'dipirona', 'amoxicilina', 'amoxi-clav', 'cefalexina', 'azitromicina-oral', 'prednisolona', 'dexametasona', 'salbutamol', 'ipratropio',
        'ondansetrona-oral', 'sro', 'sulfato-zinco', 'adrenalina', 'midazolam', 'diazepam', 'ceftriaxona', 'gentamicina', 'ampicilina'],
      escalas: ['apgar', 'flacc', 'glasgow'] },

    { id: 'obstetricia', nome: 'Obstetrícia', icon: '🤰', desc: 'Pré-eclâmpsia, hemorragia pós-parto e parto pré-termo',
      atalhos: [['#/calc/dpp', '📅', 'Idade gestacional e DPP', 'Regra de Naegele'], ['#/infusao/ocitocina', '🫀', 'Ocitocina em bomba', 'mUI/min ↔ mL/h']],
      protocolos: ['pre-eclampsia', 'hpp', 'tpp', 'hiperemese', 'reanimacao-neonatal'],
      calcs: ['dpp', 'gotejamento', 'vazao-bomba'],
      drogas: ['ocitocina', 'carbetocina', 'metilergometrina', 'misoprostol', 'tranexamico', 'sulfato-magnesio', 'gluconato-calcio', 'hidralazina', 'nifedipino', 'metildopa', 'betametasona',
        'atosibana', 'imunoglobulina-anti-d', 'penicilina-cristalina', 'cefazolina', 'sulfato-ferroso', 'acido-folico', 'ondansetrona', 'dimenidrinato'],
      escalas: ['apgar'] },

    { id: 'domiciliar', nome: 'Atenção domiciliar e paliativos', icon: '🏡', desc: 'Hipodermóclise, controle de sintomas, maletas e conforto',
      atalhos: [['#/hipodermoclise', '💧', 'Hipodermóclise', 'Via SC: soros e medicamentos'], ['#/maletas', '🧰', 'Minhas maletas', 'Kits do seu local de trabalho'],
        ['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Peso, idade e alergias']],
      protocolos: ['paliativo-sintomas', 'paliativo-gi', 'fim-de-vida', 'dor', 'lesao-pressao', 'quedas', 'seguranca-paciente', 'delirium', 'desidratacao-ped'],
      calcs: ['gotejamento', 'aprazamento', 'oxigenio', 'balanco', 'dose'],
      drogas: ['morfina', 'morfina-oral', 'metadona', 'oxicodona', 'fentanil-transdermico', 'buprenorfina-transdermica', 'tramadol-oral', 'dipirona', 'dexametasona', 'haloperidol',
        'levomepromazina', 'escopolamina', 'ondansetrona', 'metoclopramida', 'midazolam', 'bisacodil', 'lactulose', 'macrogol', 'enema-fosfato', 'enoxaparina', 'ceftriaxona', 'furosemida'],
      escalas: ['braden', 'morse', 'dor'] },

    { id: 'feridas', nome: 'Feridas e pele', icon: '🩹', desc: 'Lesão por pressão, úlceras, pé diabético e queimaduras',
      atalhos: [['#/escala/braden', '📋', 'Escala de Braden', 'Risco de lesão por pressão']],
      protocolos: ['lesao-pressao', 'ulcera-venosa', 'pe-diabetico', 'celulite', 'queimados'],
      calcs: ['parkland', 'imc'],
      cats: ['pele'],
      drogas: ['cefalexina', 'clindamicina-oral', 'amoxi-clav', 'pentoxifilina', 'dipirona', 'tramadol-oral'],
      escalas: ['braden', 'dor'] }
  ];

  var api = { MODULOS: MODULOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Modulos = api;
})(this);
