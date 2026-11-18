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
        ['#/emergencia-ped', '👶', 'Emergência pediátrica', 'Doses e materiais por peso'], ['#/infusao/noradrenalina', '🫀', 'Drogas vasoativas', 'mcg/kg/min ↔ mL/h'],
        ['#/protocolo/trauma-xabcde', '🚑', 'Trauma: XABCDE', 'Atendimento inicial ao politraumatizado'], ['#/escala/cincinnati', '🧠', 'Suspeita de AVC', 'Escala de Cincinnati']],
      protocolos: ['pcr-adulto', 'bradicardia', 'taquicardia', 'trauma-xabcde', 'tce', 'sepse', 'choque-hipo', 'anafilaxia', 'sca', 'eap', 'avc', 'convulsao', 'asma', 'tep', 'emerg-has', 'hiperk', 'hipoglicemia', 'intox', 'peconhentos', 'afogamento', 'queimados', 'reacao-transfusional'],
      calcs: ['indice-choque', 'oxigenio', 'pam', 'parkland', 'peso-predito', 'dose'],
      drogas: ['adrenalina', 'amiodarona', 'atropina', 'adenosina', 'noradrenalina', 'naloxona', 'flumazenil', 'glicose-50', 'gluconato-calcio', 'cloreto-calcio', 'bicarbonato', 'sulfato-magnesio',
        'midazolam', 'diazepam', 'cetamina', 'etomidato', 'rocuronio', 'succinilcolina', 'sugamadex', 'tranexamico', 'carvao-ativado', 'azul-metileno', 'hidroxocobalamina', 'complexo-protrombinico', 'idarucizumabe', 'lidocaina', 'dopamina', 'diltiazem', 'hidrocortisona', 'metoprolol', 'manitol'],
      escalas: ['glasgow', 'cincinnati', 'qsofa', 'news2', 'wells-tep', 'dor'] },

    { id: 'uti', nome: 'UTI e terapia intensiva', icon: '🏥', desc: 'Vasoativos, sedação, eletrólitos e antimicrobianos de reserva',
      atalhos: [['#/infusao', '🫀', 'Infusão contínua', 'Vasoativos, sedação, insulina, heparina'], ['#/sri', '🫁', 'Intubação e ventilação inicial', 'Doses e parâmetros do ventilador'],
        ['#/compatibilidade', '🔗', 'Interações e compatibilidade', 'Checar medicamentos juntos'],
        ['#/calc/relacao-pf', '🫁', 'Relação PaO₂/FiO₂', 'Oxigenação e SDRA'], ['#/calc/peso-predito', '📐', 'Volume corrente', 'Peso predito (6–8 mL/kg)']],
      protocolos: ['sepse', 'pcr-adulto', 'cad', 'ehh', 'hipona', 'hipok', 'hiperk', 'delirium', 'eap', 'tce', 'neutropenia-febril', 'tev-profilaxia', 'reacao-transfusional', 'alcool'],
      calcs: ['relacao-pf', 'peso-predito', 'debito-urinario', 'balanco', 'clearance', 'anion-gap', 'osmolalidade', 'sodio-corrigido', 'adrogue', 'eletrolitos', 'vazao-bomba'],
      drogas: ['noradrenalina', 'vasopressina', 'adrenalina', 'dobutamina', 'dopamina', 'milrinona', 'nitroprussiato', 'nitroglicerina', 'propofol', 'midazolam', 'fentanil', 'dexmedetomidina', 'cetamina',
        'cisatracurio', 'rocuronio', 'heparina', 'insulina-regular', 'cloreto-potassio', 'fosfato-potassio', 'cloreto-sodio-20', 'sulfato-magnesio', 'meropenem', 'vancomicina', 'polimixina-b',
        'colistimetato', 'ceftazidima-avibactam', 'pantoprazol', 'clonidina', 'cefepima', 'linezolida', 'micafungina', 'esmolol', 'neostigmina', 'sugamadex', 'albumina', 'enoxaparina'],
      escalas: ['rass', 'cpot', 'glasgow', 'braden', 'news2', 'curb65', 'wells-tep'] },

    { id: 'clinica', nome: 'Clínica e enfermaria', icon: '🩺', desc: 'Preparo, soros, antibióticos e cuidados do dia a dia',
      atalhos: [['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Peso, idade, alergias e passo a passo'], ['#/compatibilidade', '🔗', 'Interações e compatibilidade', 'Checar medicamentos juntos']],
      protocolos: ['seguranca-paciente', 'quedas', 'tev-profilaxia', 'hipoglicemia', 'hipok', 'emerg-has', 'dor', 'delirium', 'dpoc', 'dengue', 'hda', 'alcool', 'celulite', 'reacao-transfusional'],
      calcs: ['gotejamento', 'tempo-infusao', 'vazao-bomba', 'dose', 'reconstituicao', 'aprazamento', 'transformacao-soro', 'eletrolitos', 'percentual', 'debito-urinario', 'balanco', 'clearance', 'imc', 'pam', 'ganzoni'],
      drogas: ['dipirona', 'paracetamol-ev', 'tramadol', 'morfina', 'ondansetrona', 'metoclopramida', 'bromoprida', 'omeprazol', 'ceftriaxona', 'cefazolina', 'pipe-tazo', 'ampi-sulbactam',
        'clindamicina', 'metronidazol', 'enoxaparina', 'heparina', 'furosemida', 'hidrocortisona', 'insulina-regular', 'insulina-nph', 'cloreto-potassio', 'sacarato-ferro',
        'cefalotina', 'cefazolina', 'oxacilina', 'vancomicina', 'levofloxacino', 'pantoprazol', 'escopolamina', 'cetoprofeno-ev', 'haloperidol', 'lactulose'],
      escalas: ['morse', 'braden', 'news2', 'dor', 'curb65', 'bristol', 'glasgow'] },

    { id: 'pediatria', nome: 'Pediatria', icon: '🧸', desc: 'Dose por peso, hidratação e emergências da criança',
      atalhos: [['#/emergencia-ped', '👶', 'Emergência pediátrica', 'Doses, tubo e desfibrilação por peso'], ['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Informe peso e idade']],
      protocolos: ['reanimacao-neonatal', 'desidratacao-ped', 'bronquiolite', 'crupe', 'convulsao-febril', 'febre-ped', 'dengue', 'asma', 'anafilaxia'],
      calcs: ['dose-peso', 'holliday', 'debito-urinario', 'dose', 'gotejamento', 'imc', 'temperatura'],
      drogas: ['paracetamol-oral', 'ibuprofeno', 'dipirona', 'amoxicilina', 'amoxi-clav', 'cefalexina', 'azitromicina-oral', 'prednisolona', 'dexametasona', 'salbutamol', 'ipratropio',
        'ondansetrona-oral', 'sro', 'sulfato-zinco', 'adrenalina', 'midazolam', 'diazepam', 'ceftriaxona', 'gentamicina', 'ampicilina',
        'penicilina-benzatina', 'cefadroxila', 'nistatina', 'albendazol', 'sulfato-ferroso', 'dexclorfeniramina', 'budesonida', 'fenobarbital', 'oseltamivir'],
      escalas: ['apgar', 'flacc', 'glasgow', 'dor', 'bristol'] },

    { id: 'obstetricia', nome: 'Obstetrícia', icon: '🤰', desc: 'Pré-eclâmpsia, hemorragia pós-parto e parto pré-termo',
      atalhos: [['#/calc/dpp', '📅', 'Idade gestacional e DPP', 'Regra de Naegele'], ['#/infusao/ocitocina', '🫀', 'Ocitocina em bomba', 'mUI/min ↔ mL/h'],
        ['#/escala/bishop', '🤰', 'Índice de Bishop', 'Colo uterino para indução'], ['#/calc/indice-choque', '📉', 'Índice de choque obstétrico', 'Alerta de hemorragia (≥ 0,9)']],
      protocolos: ['pre-eclampsia', 'hpp', 'tpp', 'hiperemese', 'reanimacao-neonatal'],
      calcs: ['dpp', 'indice-choque', 'gotejamento', 'vazao-bomba', 'debito-urinario', 'dose'],
      drogas: ['ocitocina', 'carbetocina', 'metilergometrina', 'misoprostol', 'tranexamico', 'sulfato-magnesio', 'gluconato-calcio', 'hidralazina', 'nifedipino', 'metildopa', 'betametasona',
        'atosibana', 'imunoglobulina-anti-d', 'penicilina-cristalina', 'penicilina-benzatina', 'cefazolina', 'ampicilina', 'sulfato-ferroso', 'acido-folico', 'ondansetrona',
        'dimenidrinato', 'metoclopramida', 'dipirona', 'paracetamol-oral', 'escopolamina', 'enoxaparina', 'insulina-nph'],
      escalas: ['bishop', 'apgar', 'dor'] },

    { id: 'domiciliar', nome: 'Atenção domiciliar e paliativos', icon: '🏡', desc: 'Hipodermóclise, controle de sintomas, maletas e conforto',
      atalhos: [['#/hipodermoclise', '💧', 'Hipodermóclise', 'Via SC: soros e medicamentos'], ['#/maletas', '🧰', 'Minhas maletas', 'Kits do seu local de trabalho'],
        ['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Peso, idade e alergias']],
      protocolos: ['paliativo-sintomas', 'paliativo-gi', 'fim-de-vida', 'dor', 'lesao-pressao', 'quedas', 'seguranca-paciente', 'delirium', 'desidratacao-ped'],
      calcs: ['gotejamento', 'aprazamento', 'oxigenio', 'balanco', 'debito-urinario', 'dose', 'holliday', 'imc'],
      drogas: ['morfina', 'morfina-oral', 'metadona', 'oxicodona', 'fentanil-transdermico', 'buprenorfina-transdermica', 'tramadol-oral', 'dipirona', 'dexametasona', 'haloperidol',
        'levomepromazina', 'escopolamina', 'ondansetrona', 'metoclopramida', 'midazolam', 'bisacodil', 'lactulose', 'macrogol', 'enema-fosfato', 'glicerina-supositorio', 'enoxaparina',
        'ceftriaxona', 'ertapenem', 'furosemida', 'tramadol', 'gabapentina', 'mirtazapina', 'lorazepam', 'oxido-zinco', 'age', 'soro-fisiologico'],
      escalas: ['braden', 'morse', 'katz', 'ecog', 'dor', 'push', 'bristol'] },

    { id: 'feridas', nome: 'Feridas e pele', icon: '🩹', desc: 'Lesão por pressão, úlceras, pé diabético e queimaduras',
      atalhos: [['#/escala/braden', '📋', 'Escala de Braden', 'Risco de lesão por pressão'], ['#/escala/push', '📏', 'Escala PUSH', 'Evolução da cicatrização']],
      protocolos: ['lesao-pressao', 'ulcera-venosa', 'pe-diabetico', 'celulite', 'queimados'],
      calcs: ['parkland', 'imc', 'ganzoni'],
      cats: ['pele'],
      drogas: ['cefalexina', 'clindamicina-oral', 'amoxi-clav', 'smx-tmp-oral', 'cefazolina', 'oxacilina', 'pentoxifilina', 'dipirona', 'tramadol-oral', 'morfina', 'fentanil', 'cetamina', 'soro-fisiologico'],
      escalas: ['braden', 'push', 'dor', 'katz'] },

    { id: 'ubs', nome: 'Atenção primária (UBS)', icon: '🏘️', desc: 'Doenças crônicas, saúde da criança e da mulher, procedimentos ambulatoriais',
      atalhos: [['#/calc/imc', '📏', 'IMC e superfície corporal', 'Avaliação nutricional'], ['#/calc/dpp', '📅', 'Idade gestacional e DPP', 'Pré-natal'],
        ['#/calc/dose-peso', '⚖️', 'Dose por peso (criança)', 'mg/kg e volume'], ['#/maleta/lib/atender', '👤', 'Dose e preparo por paciente', 'Peso, idade e alergias']],
      protocolos: ['hipoglicemia', 'emerg-has', 'asma', 'dpoc', 'dengue', 'desidratacao-ped', 'febre-ped', 'celulite', 'pe-diabetico', 'ulcera-venosa', 'quedas', 'seguranca-paciente', 'anafilaxia'],
      calcs: ['imc', 'pam', 'dpp', 'dose-peso', 'holliday', 'dose', 'aprazamento', 'clearance', 'conversao', 'temperatura'],
      drogas: ['losartana', 'enalapril', 'captopril', 'anlodipino', 'hidroclorotiazida', 'atenolol', 'propranolol', 'metformina', 'glibenclamida', 'gliclazida', 'insulina-nph', 'insulina-regular',
        'sinvastatina', 'acido-acetilsalicilico', 'levotiroxina', 'amoxicilina', 'amoxi-clav', 'cefalexina', 'azitromicina-oral', 'smx-tmp-oral', 'nitrofurantoina', 'penicilina-benzatina',
        'metronidazol-oral', 'fluconazol-oral', 'nistatina', 'albendazol', 'ivermectina', 'sulfato-ferroso', 'acido-folico', 'paracetamol-oral', 'ibuprofeno', 'dipirona', 'omeprazol-oral',
        'loratadina', 'dexclorfeniramina', 'prednisona', 'salbutamol', 'budesonida', 'sro', 'fluoxetina', 'sertralina', 'amitriptilina', 'medroxiprogesterona'],
      escalas: ['katz', 'morse', 'dor', 'curb65', 'bristol'] }
  ];

  var api = { MODULOS: MODULOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Modulos = api;
})(this);
