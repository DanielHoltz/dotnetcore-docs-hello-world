/*
 * EnfCalc — protocolos clínicos resumidos para a enfermagem.
 * Texto próprio, elaborado a partir de diretrizes brasileiras e internacionais (lista em REFS/FONTES) e do
 * Manual MSD (edição para profissionais, em português), usado como leitura complementar. Não reproduz o MSD: cada protocolo traz o link para o tópico original.
 * Sempre seguir o protocolo institucional e a prescrição médica.
 *
 * Estrutura: { id, nome, icon, grupo, resumo, msd: [ [título, caminho] ], secoes: [ { t, tipo: 'lista'|'passos'|'meds', itens } ] }
 * Em 'meds', cada item: [idDoMedicamentoNoApp|null, texto]
 */
(function (root) {
  'use strict';

  var MSD = 'https://www.msdmanuals.com';
  var GRUPOS = [
    { id: 'choque', nome: 'Choque, sepse e reanimação', icon: '🫀' },
    { id: 'metabolico', nome: 'Metabólico e eletrólitos', icon: '🧪' },
    { id: 'cardio', nome: 'Cardiovascular', icon: '❤️' },
    { id: 'neuro', nome: 'Neurológico', icon: '🧠' },
    { id: 'resp', nome: 'Respiratório', icon: '🫁' },
    { id: 'tox', nome: 'Intoxicações e abstinência', icon: '☠️' },
    { id: 'outros', nome: 'Trauma, sangramento, transfusão e dor', icon: '🩹' },
    { id: 'ped', nome: 'Pediatria', icon: '🧸' },
    { id: 'obst', nome: 'Obstetrícia', icon: '🤰' },
    { id: 'palia', nome: 'Cuidados paliativos', icon: '🕊️' },
    { id: 'feridas', nome: 'Feridas e pele', icon: '🩹' },
    { id: 'infecto', nome: 'Infecções e arboviroses', icon: '🦟' }
  ];

  var PROTOCOLOS = [
    { id: 'sepse', nome: 'Sepse e choque séptico', icon: '🦠', grupo: 'choque',
      resumo: 'Disfunção orgânica por resposta desregulada à infecção. Tempo é decisivo: antibiótico e volume na primeira hora.',
      msd: [['Sepse e choque séptico', '/pt/profissional/medicina-de-cuidados-críticos/sepse-e-choque-séptico/sepse-e-choque-séptico']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Suspeita de infecção + disfunção orgânica: confusão, hipotensão (PAS ≤ 100), FR ≥ 22, oligúria, hipoxemia, plaquetopenia, lactato > 2 mmol/L.',
          'Triagem rápida: qSOFA ≥ 2 ou NEWS2 ≥ 5 — acionar o protocolo de sepse da instituição.',
          'Choque séptico: necessidade de vasopressor para PAM ≥ 65 mmHg e lactato > 2 mmol/L apesar de volume adequado.'] },
        { t: 'Pacote da primeira hora', tipo: 'passos', itens: ['Monitorizar (PA, FC, SpO₂, diurese) e garantir 2 acessos calibrosos; O₂ se SpO₂ baixa.',
          'Coletar lactato e 2 pares de hemoculturas (e outras culturas) ANTES do antibiótico, sem atrasá-lo.',
          'Administrar antibiótico de amplo espectro prescrito o mais rápido possível (idealmente na 1ª hora).',
          'Hipotensão ou lactato ≥ 4: cristaloide 30 mL/kg nas primeiras 3 horas, reavaliando a resposta e sinais de sobrecarga.',
          'Persistindo PAM < 65 após volume: iniciar noradrenalina (pode iniciar em acesso periférico calibroso até obter acesso central).',
          'Repetir o lactato em 2–4 h se inicial > 2 mmol/L; buscar e controlar o foco infeccioso.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['noradrenalina', 'Vasopressor de 1ª escolha — titular para PAM ≥ 65 mmHg'], ['vasopressina', 'Associar se noradrenalina em dose crescente (dose fixa 0,03 UI/min)'],
          ['hidrocortisona', 'Choque refratário a vasopressor: 50 mg EV a cada 6 h (conforme prescrição)'], ['ceftriaxona', 'Exemplo de antibiótico empírico comunitário — esquema conforme foco e protocolo'],
          ['pipe-tazo', 'Exemplo de cobertura hospitalar/antipseudomonas'], ['meropenem', 'Exemplo para risco de germes multirresistentes']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Registrar o horário de cada etapa (início da suspeita, culturas, antibiótico, volume, vasopressor).', 'Sondagem vesical só se essencial; débito urinário-alvo ≥ 0,5 mL/kg/h.',
          'Reavaliar perfusão (tempo de enchimento capilar, consciência, pele moteada) após cada etapa.', 'Controle glicêmico (alvo usual 140–180 mg/dL).'] },
        { t: 'Metas', tipo: 'lista', itens: ['PAM ≥ 65 mmHg', 'Diurese ≥ 0,5 mL/kg/h', 'Queda do lactato', 'Melhora do nível de consciência e da perfusão periférica'] }
      ] },

    { id: 'choque-hipo', nome: 'Choque hipovolêmico e reposição volêmica', icon: '💧', grupo: 'choque',
      resumo: 'Perfusão inadequada por perda de volume (sangramento, desidratação, queimaduras).',
      msd: [['Choque', '/pt/profissional/medicina-de-cuidados-críticos/choque-e-reanimação-volêmica/choque'], ['Reanimação volêmica intravenosa', '/pt/profissional/medicina-de-cuidados-críticos/choque-e-reanimação-volêmica/reanimação-volêmica-intravenosa']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Taquicardia, hipotensão, pele fria e pegajosa, enchimento capilar lento, oligúria, alteração de consciência.', 'Índice de choque (FC ÷ PAS) > 1 sugere choque significativo.'] },
        { t: 'Conduta imediata', tipo: 'passos', itens: ['Controlar sangramento externo (compressão direta, torniquete se indicado).', 'Dois acessos calibrosos (ou intraósseo); colher tipagem e prova cruzada.',
          'Cristaloide aquecido em bolus (adulto 500–1.000 mL; criança 10–20 mL/kg), reavaliando após cada bolus.', 'No choque hemorrágico, priorizar hemoderivados precocemente e limitar cristaloide (protocolo de transfusão maciça quando indicado).',
          'Ácido tranexâmico no trauma com sangramento em até 3 h, conforme prescrição.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['ringer-lactato', 'Cristaloide balanceado para reposição'], ['soro-fisiologico', 'Alternativa de cristaloide'], ['tranexamico', 'Trauma/hemorragia pós-parto: 1 g EV em 10 min (conforme protocolo)'], ['albumina', 'Casos selecionados']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Prevenir hipotermia (soros e hemoderivados aquecidos, mantas).', 'Balanço hídrico rigoroso e diurese horária.', 'Observar sinais de sobrecarga: crepitações, queda de SpO₂, turgência jugular.'] }
      ] },

    { id: 'anafilaxia', nome: 'Anafilaxia', icon: '🐝', grupo: 'choque',
      resumo: 'Reação alérgica grave e rápida. A adrenalina IM é o tratamento de primeira linha — não atrase.',
      msd: [['Anafilaxia', '/pt/profissional/imunologia-distúrbios-alérgicos/distúrbios-alérgicos-autoimunes-e-outras-reações-de-hipersensibilidade/anafilaxia']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Início súbito (minutos a horas) após exposição: urticária/angioedema + dificuldade respiratória, estridor, sibilos, hipotensão ou sintomas gastrointestinais.', 'Pode ocorrer sem lesões de pele, sobretudo com hipotensão.'] },
        { t: 'Conduta imediata', tipo: 'passos', itens: ['Interromper o agente (ex.: infusão do medicamento suspeito) e pedir ajuda.', 'ADRENALINA IM no vasto lateral da coxa imediatamente; repetir a cada 5–15 min se necessário.',
          'Posicionar deitado com pernas elevadas (sentado se dispneia; decúbito lateral se gestante); não levantar o paciente bruscamente.', 'O₂ em alto fluxo; preparar via aérea avançada se estridor ou edema de glote.',
          'Hipotensão: cristaloide em bolus (adulto 1–2 L rápido; criança 20 mL/kg).', 'Broncoespasmo persistente: beta-2 agonista inalatório.', 'Anti-histamínico e corticoide são adjuvantes — nunca substituem a adrenalina.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['adrenalina', 'Adulto 0,5 mg IM (0,5 mL de 1 mg/mL); criança 0,01 mg/kg (máx. 0,3–0,5 mg)'], ['salbutamol', 'Broncoespasmo'], ['prometazina', 'Anti-histamínico (adjuvante)'],
          ['hidrocortisona', 'Corticoide (adjuvante)'], ['soro-fisiologico', 'Reposição volêmica']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Observar por no mínimo 4–6 h (risco de reação bifásica).', 'Registrar o agente e identificar o paciente como alérgico (pulseira/prontuário).', 'Orientar sobre adrenalina autoinjetável e retorno se sintomas.'] }
      ] },

    { id: 'cad', nome: 'Cetoacidose diabética', icon: '🩸', grupo: 'metabolico',
      resumo: 'Hiperglicemia + cetose + acidose metabólica. Prioridades: volume, potássio e insulina — nessa ordem.',
      msd: [['Complicações agudas do diabetes', '/pt/profissional/distúrbios-endócrinos-e-metabólicos/diabetes-melito-e-hipoglicemia/complicações-agudas-do-diabetes-mellitus']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Glicemia geralmente > 250 mg/dL, pH < 7,3 e/ou bicarbonato < 18, cetonemia/cetonúria, ânion gap elevado.', 'Polidipsia, poliúria, náuseas, vômitos, dor abdominal, respiração de Kussmaul, hálito cetônico, rebaixamento.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['SF 0,9% 1–1,5 L na 1ª hora no adulto (criança: 10–20 mL/kg com cautela pelo risco de edema cerebral).',
          'Dosar potássio ANTES da insulina: se K < 3,3 mEq/L, repor potássio e adiar a insulina.', 'Insulina regular EV em bomba (ex.: 0,1 U/kg/h, com ou sem bolus de 0,1 U/kg conforme protocolo) se K ≥ 3,3.',
          'Repor potássio quando K < 5,0–5,3 com diurese presente, mantendo 4–5 mEq/L.', 'Glicemia < 200–250 mg/dL: acrescentar soro glicosado e reduzir a insulina (sem suspender até resolver a acidose).',
          'Bicarbonato apenas em acidose muito grave (pH < 7), conforme prescrição.', 'Transição para insulina SC: aplicar a SC 1–2 h antes de desligar a bomba.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Reposição volêmica'], ['insulina-regular', 'Infusão contínua EV'], ['cloreto-potassio', 'Reposição de potássio diluída em bomba'], ['bicarbonato', 'Somente pH < 7 (exceção)'], ['soro-glicosado', 'Quando a glicemia cair']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Glicemia capilar de 1/1 h; potássio e gasometria a cada 2–4 h.', 'Balanço hídrico e diurese horária.', 'Avaliar nível de consciência (em crianças: cefaleia, vômitos e bradicardia sugerem edema cerebral).', 'Investigar fator precipitante (infecção, omissão de insulina).'] }
      ] },

    { id: 'hipoglicemia', nome: 'Hipoglicemia', icon: '🍬', grupo: 'metabolico',
      resumo: 'Glicemia ≤ 70 mg/dL em diabéticos (ou < 55 com sintomas em não diabéticos). Corrigir já e investigar a causa.',
      msd: [['Hipoglicemia', '/pt/profissional/distúrbios-endócrinos-e-metabólicos/diabetes-melito-e-hipoglicemia/hipoglicemia']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Sudorese, tremor, palpitação, fome, ansiedade; confusão, alteração de comportamento, convulsão, coma.', 'Confirmar com glicemia capilar sempre que possível — sem atrasar o tratamento se grave.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Consciente e deglutindo: 15–20 g de carboidrato de absorção rápida por via oral; repetir a glicemia em 15 min (regra dos 15).',
          'Rebaixado ou sem via oral: glicose EV (adulto 25 g = 50 mL de glicose 50%; criança: glicose 10% 2–5 mL/kg).', 'Sem acesso venoso: glucagon IM/SC conforme disponibilidade.',
          'Após recuperar, oferecer refeição com carboidrato complexo; manter soro glicosado se sulfonilureia ou insulina de longa ação.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['glicose-50', 'Adulto 25 g EV (50 mL) — veia calibrosa'], ['soro-glicosado', 'Manutenção após o bolus'], ['tiamina', 'Etilistas/desnutridos: tiamina antes ou junto da glicose']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Glicemia de 15/15 min até estabilizar, depois de 1/1 h.', 'Rever horários de insulina e alimentação; orientar paciente e família.', 'Hipoglicemia por sulfonilureia pode recorrer por 24 h ou mais — observação prolongada.'] }
      ] },

    { id: 'hiperk', nome: 'Hiperpotassemia', icon: '⚡', grupo: 'metabolico',
      resumo: 'Potássio elevado com risco de arritmia. Proteger o coração, deslocar o potássio para dentro da célula e eliminá-lo.',
      msd: [['Hiperpotassemia', '/pt/profissional/nefrologia/distúrbios-eletrolíticos/hiperpotassemia']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['K > 5,5 mEq/L; grave se > 6,5 ou com alterações no ECG (onda T apiculada, QRS alargado, onda sinusoidal).', 'Excluir pseudo-hipercalemia (hemólise da amostra).'] },
        { t: 'Conduta (moderada a grave)', tipo: 'passos', itens: ['Monitorização cardíaca contínua; suspender fontes de potássio (soros, suplementos, IECA/BRA, espironolactona).',
          'Alteração no ECG: gluconato de cálcio 10% 10–20 mL EV em 5–10 min (efeito em minutos, dura 20–30 min; pode repetir).', 'Insulina regular 5–10 U EV junto com 50 mL de glicose 50% (adulto); glicemia de 1/1 h depois.',
          'Salbutamol inalatório em dose alta como adjuvante.', 'Eliminar o potássio: resinas/quelantes, diurético de alça se volume adequado; hemodiálise nos casos graves ou refratários.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['gluconato-calcio', 'Estabiliza a membrana cardíaca — 10–20 mL de 10% em 5–10 min'], ['insulina-regular', '5–10 U EV com glicose'], ['glicose-50', '50 mL junto com a insulina'],
          ['salbutamol', 'Nebulização em dose alta (adjuvante)'], ['furosemida', 'Se volume adequado e diurese preservada'], ['bicarbonato', 'Apenas se acidose associada (efeito limitado)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Gluconato de cálcio: nunca com bicarbonato na mesma via; cautela em uso de digoxina.', 'Glicemia capilar de 1/1 h por 4–6 h após a insulina (risco de hipoglicemia).', 'Repetir potássio em 1–2 h.'] }
      ] },

    { id: 'hipok', nome: 'Hipopotassemia', icon: '🔋', grupo: 'metabolico',
      resumo: 'K < 3,5 mEq/L. Reposição oral sempre que possível; EV com limites rígidos de concentração e velocidade.',
      msd: [['Hipopotassemia', '/pt/profissional/nefrologia/distúrbios-eletrolíticos/hipopotassemia']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Fraqueza, cãibras, íleo, arritmias (onda U, ectopias), especialmente com digoxina.', 'Corrigir também o magnésio — hipomagnesemia impede a correção do potássio.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Leve e assintomática: reposição oral.', 'Grave, com arritmia ou sem via oral: KCl EV diluído em bomba de infusão.',
          'Periférico: até 10 mEq/100 mL e 10 mEq/h; central com monitorização: até 20–40 mEq/h conforme protocolo.', 'Dosar K a cada 2–4 h durante a reposição EV.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['cloreto-potassio', 'NUNCA EV direto — sempre diluído e em bomba'], ['sulfato-magnesio', 'Repor se magnésio baixo']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Dupla checagem (alta vigilância).', 'Observar dor e flebite no acesso; reduzir concentração se dor.', 'Monitorização cardíaca nas reposições rápidas.'] }
      ] },

    { id: 'hipona', nome: 'Hiponatremia', icon: '🧂', grupo: 'metabolico',
      resumo: 'Na < 135 mEq/L. O perigo está nos dois extremos: sintomas neurológicos graves e correção rápida demais.',
      msd: [['Hiponatremia', '/pt/profissional/nefrologia/distúrbios-eletrolíticos/hiponatremia']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Náuseas, cefaleia, confusão, letargia; convulsões e coma nos casos graves ou de instalação rápida.', 'Classificar o volume: hipovolêmico, euvolêmico ou hipervolêmico.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Hipovolêmica: SF 0,9%.', 'Hipervolêmica (IC, cirrose): restrição hídrica ± diurético.', 'Euvolêmica: tratar a causa (ex.: SIADH, medicamentos).',
          'Sintomas graves: NaCl 3% em bolus conforme protocolo para elevar 4–6 mEq/L rapidamente.', 'LIMITE DE CORREÇÃO: no máximo 8 mEq/L nas primeiras 24 h (risco de síndrome de desmielinização osmótica).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Hipovolemia'], [null, 'NaCl 3% (hipertônico) — sintomas graves, em bomba, sob prescrição']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Sódio sérico a cada 2–4 h na correção ativa.', 'Diurese horária: aumento súbito de diurese pode acelerar a correção — comunicar.', 'Use a calculadora “Correção de sódio (Adrogué-Madias)” para estimar o efeito de cada litro.'] }
      ] },

    { id: 'emerg-has', nome: 'Emergência hipertensiva', icon: '📈', grupo: 'cardio',
      resumo: 'PA muito elevada COM lesão aguda de órgão-alvo. Reduzir de forma controlada, não abrupta.',
      msd: [['Emergências hipertensivas', '/pt/profissional/doenças-cardiovasculares/hipertensão/emergências-hipertensivas']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Lesão de órgão-alvo: encefalopatia, AVC, síndrome coronariana, edema pulmonar, dissecção de aorta, lesão renal aguda, eclâmpsia.', 'Sem lesão de órgão-alvo = urgência hipertensiva: redução gradual em horas/dias com medicação oral.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['UTI ou sala de emergência com monitorização contínua (PA invasiva quando possível).',
          'Reduzir a PAM em 20–25% na primeira hora com medicamento EV titulável; depois reduzir gradualmente nas 24–48 h.', 'Exceções: dissecção de aorta (meta rápida, PAS ~120 em 20 min) e AVC isquêmico (limites próprios).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['nitroprussiato', 'Infusão titulável (proteger da luz)'], ['nitroglicerina', 'Preferido na isquemia miocárdica e edema pulmonar'], ['hidralazina', 'Gestação (pré-eclâmpsia)'], ['esmolol', 'Dissecção de aorta / controle de FC'], ['metoprolol', 'Alternativa betabloqueadora']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['PA a cada 5–15 min durante a titulação.', 'Avaliação neurológica seriada.', 'Evitar quedas bruscas de PA (risco de isquemia cerebral, coronariana e renal).'] }
      ] },

    { id: 'sca', nome: 'Dor torácica e síndrome coronariana aguda', icon: '💔', grupo: 'cardio',
      resumo: 'ECG em até 10 minutos da chegada. Supra de ST = reperfusão urgente.',
      msd: [['Infarto agudo do miocárdio', '/pt/profissional/doenças-cardiovasculares/doença-coronariana/infarto-agudo-do-miocárdio-iam'], ['Medicamentos para SCA', '/pt/profissional/doenças-cardiovasculares/doença-coronariana/medicamentos-para-síndromes-coronarianas-agudas']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Dor ou pressão retroesternal, irradiação para braço/mandíbula, dispneia, sudorese, náuseas.', 'Idosos, mulheres e diabéticos podem ter sintomas atípicos.'] },
        { t: 'Conduta imediata', tipo: 'passos', itens: ['ECG de 12 derivações em até 10 min; repetir se dor persistir.', 'Monitorização, acesso venoso, coletar troponina.', 'O₂ apenas se SpO₂ < 90%.',
          'AAS 160–325 mg mastigado (se não houver contraindicação).', 'Nitrato sublingual para dor se PAS adequada (evitar em infarto de VD, hipotensão ou uso de sildenafila/tadalafila).',
          'Supra de ST: acionar fluxo de reperfusão (angioplastia; trombólise se angioplastia não disponível em tempo).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['acido-acetilsalicilico', '160–325 mg mastigado'], ['clopidogrel', 'Dose de ataque conforme protocolo'], ['isossorbida', 'Dinitrato sublingual para dor'], ['nitroglicerina', 'Dor persistente/HAS/congestão'],
          ['enoxaparina', 'Anticoagulação conforme protocolo'], ['heparina', 'Alternativa / sala de hemodinâmica'], ['morfina', 'Dor refratária (uso cada vez mais restrito)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Registrar o horário do início da dor e da chegada (tempo porta-ECG e porta-balão).', 'Repouso, monitorização contínua e desfibrilador disponível.', 'Preparar para cateterismo (acesso radial preservado quando possível).'] }
      ] },

    { id: 'eap', nome: 'Edema agudo de pulmão', icon: '🌊', grupo: 'cardio',
      resumo: 'Congestão pulmonar aguda com hipoxemia. Sentar, oxigenar, ventilação não invasiva, vasodilatador e diurético.',
      msd: [['Edema pulmonar', '/pt/profissional/doenças-cardiovasculares/insuficiência-cardíaca/edema-pulmonar']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Dispneia intensa, ortopneia, crepitações, escarro róseo espumoso, hipoxemia, sudorese.', 'PAS < 100 mmHg é sinal de gravidade (choque cardiogênico).'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Sentar com pernas pendentes; O₂ e ventilação não invasiva (CPAP/BiPAP) se desconforto ou hipoxemia.',
          'Nitroglicerina (sublingual ou EV) se PA adequada.', 'Diurético de alça EV.', 'Hipotensão: não usar vasodilatador — considerar inotrópico/vasopressor conforme prescrição.', 'Intubação se falha da VNI, rebaixamento ou fadiga.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['furosemida', 'Diurético de alça EV'], ['nitroglicerina', 'Vasodilatador titulável'], ['isossorbida', 'Sublingual enquanto prepara a infusão'], ['dobutamina', 'Baixo débito/hipotensão'], ['morfina', 'Uso restrito (piores desfechos em estudos)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['SpO₂ contínua e PA frequente.', 'Sondagem vesical/diurese horária e balanço hídrico.', 'Ajustar a máscara da VNI e acalmar o paciente.'] }
      ] },

    { id: 'avc', nome: 'AVC isquêmico agudo', icon: '🧠', grupo: 'neuro',
      resumo: 'Tempo é cérebro. Reconhecer, registrar a hora do último momento bem e acionar o protocolo de AVC.',
      msd: [['Acidente vascular cerebral isquêmico', '/pt/profissional/distúrbios-neurológicos/acidente-vascular-cerebral/acidente-vascular-cerebral-isquêmico']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Déficit súbito: face caída, fraqueza de braço/perna, fala alterada (escala de Cincinnati/SAMU), perda visual, desequilíbrio.', 'Anotar a hora do ÚLTIMO MOMENTO EM QUE O PACIENTE FOI VISTO BEM.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Acionar o protocolo de AVC; glicemia capilar imediata (hipoglicemia simula AVC).', 'Tomografia de crânio urgente.',
          'Trombólise (alteplase) em candidatos dentro da janela (em geral até 4,5 h): PA deve estar < 185/110 antes e < 180/105 nas 24 h seguintes.', 'Avaliar trombectomia mecânica em oclusão de grande vaso.',
          'Sem trombólise: tolerar PA até 220/120 nas primeiras 24 h, salvo outra indicação.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['alteplase', '0,9 mg/kg (máx. 90 mg): 10% em bolus em 1 min e o restante em 60 min'], ['glicose-50', 'Corrigir hipoglicemia'], ['acido-acetilsalicilico', 'Após excluir hemorragia e fora das 24 h pós-trombólise']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Escala neurológica seriada (NIHSS) e PA a cada 15 min nas 2 primeiras horas pós-trombólise.', 'Jejum até avaliação da deglutição.', 'Observar sangramentos e piora neurológica súbita (hemorragia).', 'Cabeceira conforme protocolo; prevenir aspiração e lesão por pressão.'] }
      ] },

    { id: 'convulsao', nome: 'Crise convulsiva e estado de mal epiléptico', icon: '⚡', grupo: 'neuro',
      resumo: 'Crise > 5 min ou crises repetidas sem recuperação = estado de mal. Benzodiazepínico já, depois anticonvulsivante de 2ª linha.',
      msd: [['Transtornos convulsivos', '/pt/profissional/distúrbios-neurológicos/transtornos-convulsivos/transtornos-convulsivos'], ['Anticonvulsivantes', '/pt/profissional/distúrbios-neurológicos/transtornos-convulsivos/anticonvulsivantes']],
      secoes: [
        { t: 'Conduta imediata', tipo: 'passos', itens: ['Proteger o paciente (lateralizar, afastar objetos, não colocar nada na boca); anotar a hora de início.',
          'O₂, aspirar secreções, monitorizar; glicemia capilar.', 'Aos 5 min: benzodiazepínico EV (diazepam 0,15–0,2 mg/kg até 10 mg, ou midazolam); sem acesso: midazolam IM.',
          'Persistindo após 2 doses: 2ª linha — fenitoína, levetiracetam ou valproato EV conforme protocolo.', 'Refratário: sedação contínua e intubação em UTI.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['diazepam', '0,15–0,2 mg/kg EV (máx. 10 mg)'], ['midazolam', '0,2 mg/kg (máx. 10 mg) IM/EV'], ['fenitoina', 'Ataque 20 mg/kg (SF, máx. 50 mg/min)'], ['levetiracetam', 'Alternativa de 2ª linha'], ['fenobarbital', 'Alternativa de 2ª/3ª linha'], ['tiamina', 'Etilistas: antes da glicose']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Registrar duração e características da crise.', 'Monitorar FR e SpO₂ após benzodiazepínico.', 'Grades elevadas e acolchoadas; observar o período pós-ictal.'] }
      ] },

    { id: 'asma', nome: 'Crise de asma grave', icon: '🫁', grupo: 'resp',
      resumo: 'Broncodilatador inalatório repetido, corticoide sistêmico precoce e O₂ para SpO₂ 93–95%.',
      msd: [['Tratamento das agudizações da asma', '/pt/profissional/distúrbios-pulmonares/asma-e-doenças-relacionadas/tratamento-das-agudizações-da-asma']],
      secoes: [
        { t: 'Reconhecer gravidade', tipo: 'lista', itens: ['Fala em palavras, uso de musculatura acessória, FR > 30, FC > 120, SpO₂ < 90%.', 'Risco de morte: tórax silencioso, cianose, confusão, bradicardia, exaustão.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['O₂ para SpO₂ 93–95% (crianças 94–98%).', 'Beta-2 agonista inalatório a cada 20 min na 1ª hora (aerossol com espaçador ou nebulização) + ipratrópio nas crises graves.',
          'Corticoide sistêmico na 1ª hora (oral se deglute, ou EV).', 'Sem resposta: sulfato de magnésio EV.', 'Preparar via aérea se exaustão ou rebaixamento.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['salbutamol', 'A cada 20 min na 1ª hora'], ['ipratropio', 'Associado nas crises graves'], ['prednisona', 'Corticoide oral'], ['metilprednisolona', 'Corticoide EV'], ['sulfato-magnesio', '2 g EV em 20 min (adulto) nas crises graves'], ['terbutalina', 'Alternativa parenteral']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Reavaliar FR, uso de musculatura, SpO₂ e pico de fluxo após cada ciclo.', 'Paciente sentado, ambiente calmo.', 'Orientar técnica inalatória e plano de ação na alta.'] }
      ] },

    { id: 'tep', nome: 'Tromboembolismo pulmonar', icon: '🫀', grupo: 'resp',
      resumo: 'Dispneia súbita, dor pleurítica, taquicardia. Anticoagular cedo; trombólise se instabilidade.',
      msd: [['Embolia pulmonar', '/pt/profissional/distúrbios-pulmonares/embolia-pulmonar/embolia-pulmonar-ep']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Dispneia súbita, taquipneia, taquicardia, dor torácica pleurítica, hemoptise, síncope; fatores de risco (imobilização, cirurgia, câncer, TVP).'] },
        { t: 'Conduta', tipo: 'passos', itens: ['O₂, monitorização, acesso venoso.', 'Anticoagulação assim que houver suspeita relevante (heparina, enoxaparina ou anticoagulante oral direto).',
          'Instabilidade hemodinâmica (TEP de alto risco): trombólise ou embolectomia.', 'Cautela com volume excessivo (sobrecarga do ventrículo direito).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['heparina', 'Bolus + infusão por nomograma (TTPa 1,5–2,5 × controle)'], ['enoxaparina', '1 mg/kg a cada 12 h (ajuste renal)'], ['apixabana', 'Anticoagulante oral direto'], ['alteplase', 'TEP maciço: conforme protocolo (ex.: 100 mg em 2 h)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Observar sangramentos durante a anticoagulação.', 'Plaquetas na heparina (trombocitopenia induzida).', 'Prevenção de TVP em todos os internados conforme risco.'] }
      ] },

    { id: 'intox', nome: 'Intoxicação aguda — abordagem e antídotos', icon: '☠️', grupo: 'tox',
      resumo: 'Estabilizar (ABC), identificar o agente, descontaminar quando indicado e usar antídoto específico. Contato com o CIATox.',
      msd: [['Princípios gerais da intoxicação', '/pt/profissional/lesões-intoxicação/intoxicação/princípios-gerais-da-intoxicação'], ['Intoxicação por paracetamol', '/pt/profissional/lesões-intoxicação/intoxicação/intoxicação-por-paracetamol']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Via aérea, respiração, circulação; glicemia capilar.', 'Identificar agente, dose, horário e via (embalagens, testemunhas).',
          'Ligar para o CIATox (Disque-Intoxicação 0800 722 6001).', 'Carvão ativado em ingestões recentes (idealmente < 1 h) com via aérea protegida, se indicado.', 'Antídoto específico quando houver.'] },
        { t: 'Antídotos disponíveis no app', tipo: 'meds', itens: [['naloxona', 'Opioides'], ['flumazenil', 'Benzodiazepínicos (cautela: convulsões)'], ['acetilcisteina', 'Paracetamol (≥ 150 mg/kg é potencialmente tóxico; nível ≥ 4 h no nomograma)'],
          ['atropina', 'Organofosforados/carbamatos'], ['bicarbonato', 'Antidepressivos tricíclicos (QRS alargado)'], ['glicose-50', 'Hipoglicemiantes'], ['fitomenadiona', 'Varfarina/cumarínicos'], ['protamina', 'Heparina'],
          ['gluconato-calcio', 'Bloqueadores de canal de cálcio; magnésio'], ['carvao-ativado', 'Descontaminação gastrointestinal']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Monitorização contínua; ECG (QT, QRS).', 'Guardar embalagens e amostras.', 'Avaliar risco de autoagressão — vigilância e acionar saúde mental.'] }
      ] },

    { id: 'alcool', nome: 'Abstinência alcoólica', icon: '🍺', grupo: 'tox',
      resumo: 'Tremor, ansiedade, sudorese e taquicardia 6–24 h após a última dose; risco de convulsão e delirium tremens.',
      msd: [['Intoxicação e abstinência de álcool', '/pt/profissional/tópicos-especiais/drogas-ilícitas-e-intoxicantes/intoxicação-e-abstinência-de-álcool']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Tiamina 100 mg EV antes/junto de soro glicosado (prevenir encefalopatia de Wernicke).', 'Benzodiazepínico guiado por sintomas (escala CIWA-Ar): diazepam 5–10 mg a cada hora até sedação leve, conforme prescrição.',
          'Hidratação e correção de eletrólitos (magnésio, potássio, fósforo).', 'Ambiente calmo, iluminado, orientação frequente.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['tiamina', '100 mg EV'], ['diazepam', 'Controle dos sintomas'], ['complexo-b', 'Suplementação'], ['sulfato-magnesio', 'Repor se baixo'], ['fenobarbital', 'Alternativa/adjuvante em casos refratários']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Aplicar a escala de abstinência periodicamente.', 'Prevenção de quedas e de autoextubação/retirada de dispositivos.', 'Sinais vitais e nível de consciência frequentes.'] }
      ] },

    { id: 'hda', nome: 'Hemorragia digestiva alta', icon: '🩸', grupo: 'outros',
      resumo: 'Hematêmese ou melena. Estabilizar, transfundir com critério e endoscopia precoce.',
      msd: [['Visão geral do sangramento gastrointestinal', '/pt/profissional/distúrbios-gastrointestinais/sangramento-gastrointestinal/visão-geral-do-sangramento-gastrointestinal'], ['Varizes', '/pt/profissional/distúrbios-gastrointestinais/sangramento-gastrointestinal/varizes']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Proteger a via aérea (risco de aspiração); 2 acessos calibrosos; tipagem.', 'Reposição volêmica criteriosa.',
          'Transfusão restritiva: em geral se Hb < 7 g/dL (alvo 7–9); em coronariopatas, limiar maior (~8).', 'Inibidor de bomba de prótons EV.', 'Suspeita de varizes (cirrose): vasoconstritor esplâncnico (terlipressina ou octreotida) e antibiótico profilático.', 'Endoscopia em até 24 h (antes se instável).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['pantoprazol', 'IBP EV'], ['omeprazol', 'IBP EV'], ['terlipressina', 'Varizes'], ['octreotida', 'Varizes'], ['ceftriaxona', 'Profilaxia em cirróticos com sangramento']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Sinais vitais frequentes e índice de choque.', 'Registrar volume e aspecto do sangramento.', 'Jejum até a endoscopia; cabeceira elevada.'] }
      ] },

    { id: 'queimados', nome: 'Queimaduras — atendimento inicial', icon: '🔥', grupo: 'outros',
      resumo: 'Interromper a queimadura, via aérea, estimar a área e repor volume pela fórmula de Parkland nas grandes queimaduras.',
      msd: [['Queimaduras', '/pt/profissional/lesões-intoxicação/queimaduras/queimaduras'], ['Inalação de fumaça', '/pt/profissional/lesões-intoxicação/queimaduras/inalação-de-fumaça']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Interromper o processo (retirar roupas e adornos; resfriar com água corrente, sem gelo).', 'Via aérea: suspeitar de inalação (queimadura de face, fuligem, rouquidão, estridor) — intubação precoce.',
          'Estimar a superfície corporal queimada (regra dos nove ou palma da mão ≈ 1%).', 'Grandes queimaduras (> 20% SCQ adulto): Ringer lactato pela fórmula de Parkland, ajustando pela diurese.',
          'Analgesia adequada; profilaxia antitetânica; cobrir com curativo limpo.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['ringer-lactato', 'Parkland: 2–4 mL × kg × %SCQ em 24 h (metade nas 8 h iniciais)'], ['morfina', 'Analgesia'], ['fentanil', 'Analgesia para curativos']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Diurese-alvo: adulto 0,5 mL/kg/h; criança 1 mL/kg/h.', 'Prevenir hipotermia.', 'Use a calculadora Parkland do app.'] }
      ] },

    { id: 'dor', nome: 'Manejo da dor', icon: '💊', grupo: 'outros',
      resumo: 'Avaliar com escala, tratar por intensidade (escada analgésica), reavaliar e prevenir efeitos adversos.',
      msd: [['Tratamento da dor', '/pt/profissional/distúrbios-neurológicos/dor/tratamento-da-dor']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Avaliar a dor com escala adequada (numérica, FLACC, CPOT).', 'Leve: analgésico simples (dipirona, paracetamol) ± AINE se não houver contraindicação.',
          'Moderada: associar opioide fraco (tramadol, codeína).', 'Intensa: opioide forte (morfina, oxicodona, fentanil) + adjuvantes; analgesia multimodal.', 'Dor neuropática: adjuvantes (ex.: amitriptilina, gabapentinoides).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['dipirona', 'Leve a moderada'], ['paracetamol-ev', 'Leve a moderada'], ['cetoprofeno-ev', 'AINE por curto período'], ['tramadol', 'Moderada'], ['morfina', 'Intensa'], ['metadona', 'Dor crônica intensa'], ['amitriptilina', 'Neuropática']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Reavaliar a dor após cada intervenção (EV: 15–30 min; VO: 1 h).', 'Opioides: avaliar sedação e FR; prevenir constipação desde o início.', 'Registrar a dor como 5º sinal vital.'] }
      ] },

    { id: 'delirium', nome: 'Delirium', icon: '🌀', grupo: 'neuro',
      resumo: 'Alteração aguda e flutuante da atenção e da consciência. Investigar a causa e priorizar medidas não farmacológicas.',
      msd: [['Delirium', '/pt/profissional/distúrbios-neurológicos/delirium-e-demência/delirium']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Rastrear (CAM/CAM-UTI) e investigar causas: infecção, hipóxia, distúrbios metabólicos, dor, retenção urinária, constipação, medicamentos, abstinência.',
          'Medidas não farmacológicas: reorientação, óculos e aparelho auditivo, sono noturno preservado, mobilização precoce, presença da família.', 'Antipsicótico em dose baixa apenas se agitação com risco a si ou a outros.', 'Evitar benzodiazepínicos (exceto abstinência alcoólica).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['haloperidol', 'Agitação grave (ECG: QT)'], ['quetiapina', 'Alternativa']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Evitar contenção física sempre que possível.', 'Revisar a lista de medicamentos (anticolinérgicos, opioides, sedativos).', 'Prevenir quedas e retirada de dispositivos.'] }
      ] },

    // ======================= Pediatria =======================
    { id: 'desidratacao-ped', nome: 'Desidratação em crianças', icon: '🥤', grupo: 'ped',
      resumo: 'Estimar o grau de desidratação e reidratar — por via oral sempre que possível (TRO), venosa nos casos graves.',
      msd: [['Desidratação em crianças', '/pt/profissional/pediatria/desidratação-e-fluidoterapia-em-crianças/desidratação-em-crianças'], ['Terapia de reidratação oral', '/pt/profissional/pediatria/desidratação-e-fluidoterapia-em-crianças/terapia-de-reidratação-oral']],
      secoes: [
        { t: 'Avaliar o grau', tipo: 'lista', itens: ['Leve (≈ 3–5% do peso): sinais mínimos — mucosa pouco seca, sede, diurese levemente reduzida.',
          'Moderada (≈ 6–9%): mucosa seca, taquicardia, olhos fundos, fontanela deprimida, turgor diminuído, pouca diurese, letargia.',
          'Grave (≥ 10%): somam-se pulso fino, enchimento capilar lento, pele moteada, hipotensão e alteração de consciência — EMERGÊNCIA.',
          'Combinar vários sinais é mais confiável que um sinal isolado; a perda de peso recente (se conhecida) estima o déficit.'] },
        { t: 'Reidratação oral (leve a moderada)', tipo: 'passos', itens: ['Usar SRO (osmolaridade reduzida); não usar refrigerante, suco ou bebida esportiva.',
          'Leve: ≈ 50 mL/kg em 4 h. Moderada: ≈ 100 mL/kg em 4 h.', 'Repor 10 mL/kg (até 240 mL) a cada evacuação líquida.',
          'Com vômitos: volumes pequenos e frequentes (5 mL a cada 5 min com seringa ou colher), aumentando conforme tolerância.',
          'Reavaliar em 4 h; se ainda desidratada, repetir o volume. Após reidratar, manter SRO para as perdas e retomar a dieta/aleitamento.'] },
        { t: 'Desidratação grave', tipo: 'passos', itens: ['Acesso venoso (ou intraósseo) imediato; monitorizar.', 'Bolus de cristaloide isotônico 20 mL/kg em 15–30 min, reavaliando após cada bolus (repetir conforme prescrição).',
          'Dosar glicemia capilar (hipoglicemia é comum em lactentes) e eletrólitos.', 'Após estabilizar, repor o déficit restante e a manutenção (use a calculadora Holliday-Segar).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['sro', 'Plano de reidratação oral'], ['soro-fisiologico', 'Bolus 20 mL/kg na desidratação grave'], ['ringer-lactato', 'Alternativa de cristaloide isotônico'], ['sulfato-zinco', 'Diarreia aguda: 10–14 dias (OMS)'], ['ondansetrona-oral', 'Vômitos que impedem a TRO, conforme prescrição']] },
        { t: 'Sinais de alarme (orientar a família)', tipo: 'lista', itens: ['Sonolência ou irritabilidade intensa', 'Não consegue beber ou vomita tudo', 'Sangue nas fezes', 'Diurese muito reduzida (fralda seca > 6–8 h)', 'Lactente < 6 meses'] }
      ] },

    { id: 'bronquiolite', nome: 'Bronquiolite viral aguda', icon: '👶', grupo: 'ped',
      resumo: 'Infecção viral (geralmente VSR) em < 2 anos. O tratamento é de suporte: oxigênio, hidratação e aspiração nasal.',
      msd: [['Bronquiolite', '/pt/profissional/pediatria/distúrbios-respiratórios-em-crianças-pequenas/bronquiolite']],
      secoes: [
        { t: 'Sinais de gravidade (internação)', tipo: 'lista', itens: ['Desconforto respiratório progressivo (tiragem, gemência, batimento de asa nasal)', 'Hipoxemia (SpO₂ < 90–92% conforme protocolo)', 'Apneia', 'Aspecto toxêmico, cianose, letargia',
          'Recusa alimentar ou desidratação', 'Maior risco: < 3 meses, prematuros, cardiopatas, pneumopatas e imunodeprimidos'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Desobstrução nasal com SF 0,9% e aspiração suave antes das mamadas e da inalação.', 'Oxigênio para manter SpO₂ > 90% (cateter nasal, máscara); cateter de alto fluxo ou CPAP se piora, para evitar intubação.',
          'Hidratação: fracionar a dieta; sonda ou venosa se não aceitar via oral.', 'Cabeceira elevada; manuseio mínimo.',
          'Broncodilatador NÃO é rotina: só teste terapêutico se prescrito, mantendo apenas se houver resposta clara.', 'Corticoide e antibiótico NÃO são indicados no primeiro episódio sem outra causa.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Lavagem nasal'], ['salbutamol', 'Apenas teste terapêutico, se prescrito'], ['paracetamol-oral', 'Febre/desconforto']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Monitorizar FR, esforço, SpO₂ e apneias; registrar a aceitação alimentar e a diurese.', 'Precaução de contato e gotículas; higiene das mãos rigorosa.', 'Orientar sinais de alarme na alta.'] }
      ] },

    { id: 'crupe', nome: 'Crupe (laringotraqueobronquite)', icon: '🦭', grupo: 'ped',
      resumo: 'Tosse "de cachorro", rouquidão e estridor em crianças de 6 meses a 3 anos. Corticoide para todos; adrenalina inalatória se estridor em repouso.',
      msd: [['Crupe', '/pt/profissional/pediatria/distúrbios-respiratórios-em-crianças-pequenas/crupe']],
      secoes: [
        { t: 'Classificar', tipo: 'lista', itens: ['Leve: tosse ladrante, sem estridor em repouso.', 'Moderado: estridor em repouso, tiragem leve a moderada.', 'Grave: estridor intenso, tiragem importante, agitação ou letargia, cianose — risco de obstrução.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Manter a criança calma, no colo do responsável; evitar procedimentos que causem choro (inspeção da orofaringe desnecessária).',
          'Corticoide em dose única para todos os graus (dexametasona VO, IM ou EV).', 'Estridor em repouso: nebulização com adrenalina; observar por 2–4 h após (efeito rebote).',
          'Oxigênio umidificado se hipoxemia.', 'Grave/refratário: preparar via aérea avançada com tubo menor que o previsto para a idade.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['dexametasona', '0,15–0,6 mg/kg em dose única (VO/IM/EV), conforme prescrição'], ['adrenalina', 'Nebulização (ampola 1 mg/mL): 0,5 mL/kg, máx. 5 mL, sem diluir ou completar com SF — conforme protocolo'], ['prednisolona', 'Alternativa oral ao corticoide']] },
        { t: 'Alerta', tipo: 'lista', itens: ['Febre alta, aspecto toxêmico, salivação e posição em tripé sugerem epiglotite ou traqueíte bacteriana: não examinar a garganta e acionar equipe de via aérea.'] }
      ] },

    { id: 'convulsao-febril', nome: 'Crise febril', icon: '🌡️', grupo: 'ped',
      resumo: 'Convulsão com febre em criança de 6 meses a 5 anos, sem infecção do SNC. Se durar ≥ 5 min, tratar como estado de mal.',
      msd: [['Crises febris', '/pt/profissional/pediatria/distúrbios-neurológicos-em-crianças/crises-febris']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Simples: generalizada, < 15 min, não se repete em 24 h.', 'Complexa: ≥ 15 min, focal ou recorrente em 24 h — investigar mais.',
          'Sinais de meningite (rigidez de nuca, fontanela abaulada, petéquias, sonolência persistente) exigem avaliação médica imediata.'] },
        { t: 'Durante a crise', tipo: 'passos', itens: ['Anotar o horário de início; posicionar em decúbito lateral; proteger a cabeça; não colocar nada na boca.', 'Aspirar secreções, oferecer O₂, medir glicemia capilar.',
          'Crise ≥ 5 min: benzodiazepínico (EV; ou intranasal, bucal, IM ou retal se sem acesso).', 'Persistindo após 2 doses: segunda linha (fenitoína, levetiracetam, fenobarbital ou valproato), conforme protocolo.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['midazolam', 'IM, intranasal ou bucal quando não há acesso venoso'], ['diazepam', 'EV ou retal'], ['fenitoina', '2ª linha'], ['levetiracetam', '2ª linha'], ['paracetamol-oral', 'Conforto (antitérmico não previne recorrência)'], ['ibuprofeno', 'Antitérmico (> 6 meses)']] },
        { t: 'Orientar a família', tipo: 'lista', itens: ['A maioria é benigna e não causa dano cerebral; o risco de epilepsia futura é baixo.', 'Antitérmico serve para conforto, não para prevenir convulsão.', 'Ensinar a conduta durante a crise e quando procurar o serviço (crise > 5 min, dificuldade para respirar, não recupera a consciência).'] }
      ] },

    { id: 'febre-ped', nome: 'Febre em lactentes e crianças', icon: '🤒', grupo: 'ped',
      resumo: 'Febre = temperatura retal ≥ 38 °C. Quanto menor a idade, maior o risco de infecção bacteriana grave.',
      msd: [['Febre em lactentes e crianças', '/pt/profissional/pediatria/sintomas-em-lactentes-e-crianças/febre-em-lactentes-e-crianças']],
      secoes: [
        { t: 'Sinais de alerta', tipo: 'lista', itens: ['Recém-nascido (≤ 28 dias) com febre: SEMPRE avaliação médica imediata — investigação completa (sangue, urina por sondagem, líquor).', 'Lactente < 3 meses com febre: avaliação médica no mesmo momento.',
          'Qualquer idade: aspecto toxêmico, letargia, gemência, petéquias, desidratação, desconforto respiratório, convulsão, rigidez de nuca, febre > 5 dias.'] },
        { t: 'Conduta de enfermagem', tipo: 'passos', itens: ['Aferir temperatura, FC, FR, SpO₂, enchimento capilar e estado geral (use as escalas e o NEWS pediátrico da instituição).', 'Avaliar hidratação e diurese.',
          'Antitérmico por desconforto, na dose por peso (confira na ficha do medicamento).', 'Roupas leves e oferta de líquidos; banho frio, álcool ou compressas geladas NÃO são recomendados.', 'Reavaliar em 1 h após o antitérmico.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['paracetamol-oral', '10–15 mg/kg/dose a cada 6 h'], ['ibuprofeno', '5–10 mg/kg/dose a cada 6–8 h (> 6 meses)'], ['dipirona', 'Conforme prescrição e dose por peso']] }
      ] },

    // ======================= Obstetrícia =======================
    { id: 'pre-eclampsia', nome: 'Pré-eclâmpsia grave e eclâmpsia', icon: '🤰', grupo: 'obst',
      resumo: 'Hipertensão após 20 semanas com proteinúria ou lesão de órgão-alvo. Sulfato de magnésio previne e trata a convulsão; controlar a PA grave.',
      msd: [['Pré-eclâmpsia e eclâmpsia', '/pt/profissional/ginecologia-e-obstetrícia/complicações-pré-natais/pré-eclâmpsia-e-eclâmpsia']],
      secoes: [
        { t: 'Sinais de gravidade', tipo: 'lista', itens: ['PA ≥ 160 x 110 mmHg', 'Cefaleia intensa, escotomas, dor epigástrica ou no hipocôndrio direito', 'Oligúria, edema pulmonar, plaquetopenia, elevação de enzimas hepáticas (HELLP)', 'Eclâmpsia: convulsão tônico-clônica sem outra causa'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Decúbito lateral esquerdo, O₂ se necessário, acesso venoso calibroso; na convulsão, proteger e manter via aérea.',
          'Sulfato de magnésio: ataque 4 g EV em 10–20 min; manutenção 1–2 g/h em bomba (Zuspan, padrão no Brasil: 1 g/h; o MSD cita 2 g/h). Manter 24 h após o parto ou a última crise.',
          'PA ≥ 160 x 110: anti-hipertensivo de ação rápida (hidralazina EV ou nifedipino VO), com alvo ≈ 140–150 x 90–100 — sem quedas bruscas.', 'Restringir volume (risco de edema pulmonar) — ex.: ≈ 100–125 mL/h no total.',
          'Corticoide para maturação pulmonar se < 34 semanas e o parto puder aguardar; avaliar vitalidade fetal. O tratamento definitivo é o parto.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['sulfato-magnesio', 'Ataque 4 g EV + manutenção 1–2 g/h'], ['gluconato-calcio', 'Antídoto do magnésio: 1 g (10 mL a 10%) EV lento'], ['hidralazina', '5 mg EV, repetir a cada 20 min (máx. 30 mg), conforme protocolo'], ['nifedipino', '10 mg VO, repetir a cada 20–30 min (máx. 30 mg) — via oral apenas'], ['betametasona', 'Maturação pulmonar fetal: 12 mg IM, 2 doses com 24 h']] },
        { t: 'Monitorizar o magnésio (a cada 1 h)', tipo: 'lista', itens: ['Reflexo patelar presente', 'FR ≥ 12–16 irpm', 'Diurese ≥ 25–30 mL/h', 'Ausente o reflexo, FR baixa ou oligúria: suspender a infusão e avisar o médico; depressão respiratória: gluconato de cálcio.'] }
      ] },

    { id: 'hpp', nome: 'Hemorragia pós-parto', icon: '🩸', grupo: 'obst',
      resumo: 'Principal causa evitável de morte materna. Pensar nos 4 Ts (tônus, trauma, tecido, trombina) e agir na "hora de ouro".',
      msd: [['Hemorragia pós-parto', '/pt/profissional/ginecologia-e-obstetrícia/complicações-intraparto/hemorragia-pós-parto']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Perda ≥ 500 mL (parto vaginal) ou ≥ 1.000 mL (cesárea), ou qualquer perda com instabilidade.', 'Índice de choque obstétrico (FC ÷ PAS) ≥ 0,9 indica perda importante — acionar ajuda.',
          'Causas (4 Ts): Tônus (atonia, a mais comum), Trauma (lacerações), Tecido (restos placentários), Trombina (coagulopatia).'] },
        { t: 'Prevenção', tipo: 'lista', itens: ['Ocitocina 10 UI IM logo após o nascimento para todas as parturientes (ou carbetocina, conforme protocolo).'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Pedir ajuda e registrar o horário; 2 acessos calibrosos; colher hemograma, coagulograma, tipagem e prova cruzada.', 'Massagem uterina bimanual; esvaziar a bexiga (sonda vesical).',
          'Ocitocina EV conforme protocolo (ex.: 5 UI EV lento + infusão de 20–40 UI em 500 mL; o MSD cita 10–20 UI em 1.000 mL a 125–200 mL/h).', 'Ácido tranexâmico 1 g EV em 10 min, idealmente nas 3 primeiras horas (repetir após 30 min se persistir).',
          'Sem resposta: metilergometrina (se não hipertensa) e/ou misoprostol; balão de tamponamento; preparar para centro cirúrgico.', 'Cristaloide aquecido e hemoderivados precocemente; prevenir hipotermia.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['ocitocina', '1ª linha (prevenção e tratamento)'], ['carbetocina', 'Prevenção (dose única)'], ['tranexamico', '1 g EV em 10 min'], ['metilergometrina', '0,2 mg IM — contraindicada em hipertensão/pré-eclâmpsia'], ['misoprostol', '800 mcg via retal ou sublingual'], ['ringer-lactato', 'Reposição volêmica aquecida']] }
      ] },

    { id: 'tpp', nome: 'Trabalho de parto pré-termo', icon: '⏱️', grupo: 'obst',
      resumo: 'Contrações regulares com modificação do colo antes de 37 semanas. Corticoide, neuroproteção com magnésio e profilaxia do estreptococo B.',
      msd: [['Trabalho de parto pré-termo', '/pt/profissional/ginecologia-e-obstetrícia/complicações-pré-natais/trabalho-de-parto-pré-termo'], ['Ruptura prematura de membranas', '/pt/profissional/ginecologia-e-obstetrícia/complicações-pré-natais/ruptura-prematura-de-membranas']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Confirmar idade gestacional, dinâmica uterina, vitalidade fetal; colher culturas (estreptococo do grupo B, urina) e pesquisar infecção.',
          'Corticoide antenatal entre 24 e 34 semanas (considerar a partir de 23) se há risco de parto em 7 dias.', 'Sulfato de magnésio para neuroproteção fetal se < 32 semanas e parto iminente.',
          'Tocólise por até 48 h (para o corticoide agir e/ou transferir) quando não houver contraindicação.', 'Profilaxia para estreptococo do grupo B se cultura positiva ou desconhecida, até o parto.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['betametasona', '12 mg IM, 2 doses com 24 h de intervalo'], ['dexametasona', 'Alternativa: 6 mg IM a cada 12 h, 4 doses'], ['sulfato-magnesio', 'Neuroproteção: conforme protocolo (ex.: 4 g EV + 1 g/h)'], ['nifedipino', 'Tocolítico oral, conforme protocolo'], ['atosibana', 'Tocolítico EV'], ['penicilina-cristalina', 'Profilaxia do estreptococo do grupo B']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Monitorizar contrações, BCF, PA e FC materna (nifedipino: hipotensão e taquicardia).', 'Registrar horários do corticoide (o efeito máximo ocorre 24 h após a 2ª dose).', 'Comunicar a equipe neonatal com antecedência.'] }
      ] },

    { id: 'hiperemese', nome: 'Hiperêmese gravídica', icon: '🤢', grupo: 'obst',
      resumo: 'Vômitos persistentes na gestação com desidratação, cetose e perda de peso. Hidratar, repor tiamina e tratar as náuseas.',
      msd: [['Hiperêmese gravídica', '/pt/profissional/ginecologia-e-obstetrícia/complicações-pré-natais/hiperêmese-gravídica'], ['Náuseas e vômitos no início da gestação', '/pt/profissional/ginecologia-e-obstetrícia/sintomas-durante-a-gestação/náuseas-e-vômitos-no-início-da-gestação']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Jejum temporário e hidratação EV (SF 0,9% ou Ringer); corrigir potássio e magnésio.', 'Tiamina ANTES de soluções com glicose (prevenção da encefalopatia de Wernicke).',
          'Antiemético conforme prescrição; reintroduzir dieta fracionada, seca e fria quando tolerar.', 'Pesar diariamente; cetonúria, diurese e balanço hídrico.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Hidratação'], ['tiamina', 'Antes da glicose'], ['metoclopramida', 'Antiemético'], ['ondansetrona', 'Antiemético (avaliar risco-benefício no 1º trimestre)'], ['dimenidrinato', 'Antiemético'], ['cloreto-potassio', 'Reposição se hipopotassemia (diluído)']] }
      ] },

    // ======================= Cuidados paliativos =======================
    { id: 'paliativo-sintomas', nome: 'Controle de dor e dispneia em cuidados paliativos', icon: '🕊️', grupo: 'palia',
      resumo: 'Antecipar, prevenir e tratar o sofrimento. Opioide em dose adequada alivia dor e dispneia sem encurtar a vida quando bem titulado.',
      msd: [['Alívio dos sintomas para o paciente terminal', '/pt/profissional/tópicos-especiais/paciente-terminal/alívio-dos-sintomas-para-o-paciente-terminal'], ['Paciente terminal', '/pt/profissional/tópicos-especiais/paciente-terminal/paciente-terminal']],
      secoes: [
        { t: 'Dor', tipo: 'passos', itens: ['Avaliar com escala (inclusive comportamental se não verbaliza) e investigar a causa quando isso não traz sofrimento.', 'Prescrever horário fixo + doses de resgate (geralmente 10–15% da dose diária de opioide).',
          'Via preferencial: oral; se não for possível, subcutânea (hipodermóclise) — evitar IM.', 'Adjuvantes: corticoide (dor inflamatória/edema), antidepressivos e gabapentinoides (neuropática).', 'Iniciar laxante junto com o opioide.'] },
        { t: 'Dispneia', tipo: 'passos', itens: ['Posição sentada, ventilador direcionado ao rosto, ambiente calmo e arejado.', 'Morfina em dose baixa reduz a sensação de falta de ar (paciente sem opioide: ex. 2,5–5 mg VO ou 1–2,5 mg SC, conforme prescrição).',
          'Oxigênio só se houver hipoxemia e benefício percebido.', 'Benzodiazepínico se ansiedade associada.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['morfina-oral', 'Dor e dispneia (VO)'], ['morfina', 'Via SC/EV'], ['dipirona', 'Dor leve; adjuvante'], ['dexametasona', 'Dor inflamatória, compressão, anorexia'], ['gabapentina', 'Dor neuropática'], ['lorazepam', 'Ansiedade associada à dispneia'], ['midazolam', 'Ansiedade/dispneia refratária (SC), conforme equipe'], ['bisacodil', 'Prevenir constipação por opioide']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Reavaliar o sintoma após cada dose e registrar.', 'Usar a hipodermóclise do app para conferir medicamentos compatíveis com a via SC.', 'Apoio à família e decisões compartilhadas (diretivas antecipadas).'] }
      ] },

    { id: 'paliativo-gi', nome: 'Náuseas, vômitos e constipação em cuidados paliativos', icon: '🫃', grupo: 'palia',
      resumo: 'Tratar pela causa provável: medicamentos, constipação, gastroparesia, obstrução, hipercalcemia, hipertensão intracraniana.',
      msd: [['Alívio dos sintomas para o paciente terminal', '/pt/profissional/tópicos-especiais/paciente-terminal/alívio-dos-sintomas-para-o-paciente-terminal'], ['Náuseas e vômitos', '/pt/profissional/distúrbios-gastrointestinais/sintomas-dos-distúrbios-gastrointestinais/náuseas-e-vômitos'], ['Constipação', '/pt/profissional/distúrbios-gastrointestinais/sintomas-dos-distúrbios-gastrointestinais/constipação']],
      secoes: [
        { t: 'Náuseas e vômitos', tipo: 'passos', itens: ['Revisar medicamentos e constipação (causas frequentes).', 'Gastroparesia/estase: procinético (metoclopramida), exceto se obstrução completa.',
          'Causa química (opioides, uremia, hipercalcemia): haloperidol em dose baixa.', 'Hipertensão intracraniana: dexametasona. Refratárias: levomepromazina ou associação, conforme equipe.', 'Obstrução intestinal maligna: jejum, hioscina e corticoide; sonda nasogástrica se vômitos volumosos.'] },
        { t: 'Constipação', tipo: 'passos', itens: ['Prevenir: laxante regular desde o início do opioide (estimulante ± osmótico).', 'Avaliar a última evacuação a cada dia; toque retal se > 3 dias sem evacuar.', 'Fecaloma: supositório ou enema; laxantes orais em dose maior.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['metoclopramida', 'Procinético'], ['haloperidol', 'Náusea química (dose baixa)'], ['ondansetrona', 'Náuseas'], ['levomepromazina', 'Refratárias'], ['escopolamina', 'Cólica/obstrução, secreção'], ['bisacodil', 'Laxante estimulante'], ['macrogol', 'Laxante osmótico'], ['lactulose', 'Laxante osmótico']] }
      ] },

    { id: 'fim-de-vida', nome: 'Últimos dias de vida', icon: '🌅', grupo: 'palia',
      resumo: 'Foco em conforto: suspender o que não traz benefício, manter medicamentos de sintomas por via SC e cuidar da família.',
      msd: [['Paciente terminal', '/pt/profissional/tópicos-especiais/paciente-terminal/paciente-terminal'], ['Alívio dos sintomas para o paciente terminal', '/pt/profissional/tópicos-especiais/paciente-terminal/alívio-dos-sintomas-para-o-paciente-terminal']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Revisar prescrição com a equipe: suspender exames, sinais vitais frequentes e medicamentos sem benefício de conforto.', 'Garantir medicamentos de resgate por via SC (dor, dispneia, agitação, náuseas, secreção).',
          'Higiene oral e lábios hidratados a cada 2 h (boca seca é muito comum); mudança de decúbito para conforto.', 'Respiração ruidosa (sororoca): reposicionar lateralmente, evitar aspiração profunda; anticolinérgico conforme prescrição.',
          'Delirium/agitação terminal: excluir retenção urinária, dor e fecaloma; antipsicótico; sedação paliativa só por decisão da equipe e com consentimento.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['morfina', 'Dor/dispneia (SC)'], ['escopolamina', 'Secreção (sororoca)'], ['haloperidol', 'Delirium, náuseas'], ['levomepromazina', 'Agitação terminal'], ['midazolam', 'Agitação/sedação paliativa (decisão da equipe)']] },
        { t: 'Família', tipo: 'lista', itens: ['Explicar as mudanças esperadas (respiração, extremidades frias, sonolência).', 'Oferecer presença, privacidade e apoio espiritual conforme desejo.', 'Orientar a quem avisar e o que fazer no óbito em domicílio (atestado, serviço de referência).'] }
      ] },

    // ======================= Feridas =======================
    { id: 'lesao-pressao', nome: 'Lesão por pressão — prevenção e tratamento', icon: '🛏️', grupo: 'feridas',
      resumo: 'Avaliar risco (Braden), aliviar a pressão, cuidar da pele e da nutrição. Tratar a lesão com limpeza, desbridamento e cobertura adequada.',
      msd: [['Lesões por pressão', '/pt/profissional/distúrbios-dermatológicos/lesão-por-pressão/lesões-de-pressão'], ['Como limpar, irrigar e fazer curativos em feridas', '/pt/profissional/lesões-intoxicação/como-cuidar-de-feridas-e-lacerações/como-limpar-irrigar-desbridar-e-fazer-curativos-em-feridas']],
      secoes: [
        { t: 'Classificação (NPIAP)', tipo: 'lista', itens: ['Estágio 1: pele íntegra com eritema que não embranquece.', 'Estágio 2: perda parcial da pele com derme exposta (leito rosado, úmido; ou flictena).', 'Estágio 3: perda total da pele, gordura visível; pode haver esfacelo e túneis.',
          'Estágio 4: perda total da pele e tecidos, com fáscia, músculo, tendão ou osso expostos.', 'Não classificável: leito coberto por esfacelo ou escara. Tissular profunda: área vermelho-escura/púrpura persistente.', 'Também: relacionada a dispositivo médico e em membranas mucosas.'] },
        { t: 'Prevenção', tipo: 'passos', itens: ['Braden na admissão e periodicamente (use a escala do app).', 'Reposicionar em intervalos regulares (ex.: 2/2 h, ajustando ao risco e à superfície); cabeceira ≤ 30° quando possível.',
          'Colchão/superfície de redistribuição; elevar calcâneos (sem apoio sob o tendão).', 'Pele limpa e seca; protetor de barreira na incontinência; hidratar a pele.', 'Avaliar e otimizar nutrição e hidratação; proteger a pele sob dispositivos.'] },
        { t: 'Tratamento da lesão', tipo: 'passos', itens: ['Limpar a cada troca com SF 0,9% morno, por irrigação (ex.: seringa de 20 mL com agulha 40x12).', 'Evitar antissépticos citotóxicos no tecido de granulação.',
          'Remover tecido desvitalizado: autolítico (hidrogel), enzimático (colagenase, papaína) ou instrumental (profissional habilitado). Não desbridar escara seca e estável de calcâneo sem avaliação vascular.',
          'Escolher cobertura pelo exsudato: seco → hidrogel; pouco → hidrocoloide/filme; moderado a intenso → alginato ou espuma; infecção local → prata; odor → carvão ativado.', 'Medir e fotografar semanalmente; tratar a dor antes do curativo.'] },
        { t: 'Medicamentos e produtos', tipo: 'meds', itens: [['colagenase', 'Desbridamento enzimático'], ['papaina', 'Desbridamento enzimático'], ['age', 'Prevenção na pele íntegra'], ['oxido-zinco', 'Barreira na dermatite por incontinência'], ['sulfadiazina-prata', 'Lesão colonizada/infectada (conforme protocolo)'], ['dipirona', 'Analgesia antes do curativo']] }
      ] },

    { id: 'ulcera-venosa', nome: 'Úlcera venosa e úlcera de perna', icon: '🦵', grupo: 'feridas',
      resumo: 'A compressão é a base do tratamento da úlcera venosa — desde que a circulação arterial esteja preservada (ITB).',
      msd: [['Insuficiência venosa crônica', '/pt/profissional/doenças-cardiovasculares/doenças-venosas-periféricas/insuficiência-venosa-crônica-e-síndrome-pós-trombótica'], ['Dermatite de estase', '/pt/profissional/distúrbios-dermatológicos/dermatite/dermatite-de-estase']],
      secoes: [
        { t: 'Diferenciar', tipo: 'lista', itens: ['Venosa: região maleolar medial, bordas irregulares, exsudativa, edema, hiperpigmentação, lipodermatoesclerose; dor melhora com elevação.',
          'Arterial: pés/dedos, bordas regulares "em saca-bocado", leito pálido, pulsos ausentes, pele fria; dor piora com elevação.', 'Medir o índice tornozelo-braquial (ITB) antes de comprimir: ITB < 0,8 contraindica compressão alta (< 0,5: não comprimir; encaminhar).'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Limpeza com SF 0,9% e cuidado da pele perilesional (hidratante; barreira se maceração).', 'Cobertura conforme exsudato (alginato ou espuma nas exsudativas).',
          'Terapia compressiva: bandagem multicamadas ou bota de Unna (troca semanal); depois da cicatrização, meia de compressão 30–40 mmHg para evitar recidiva.', 'Elevar os membros acima do coração 30 min, 3–4x/dia; caminhar e exercitar a panturrilha.', 'Sinais de infecção (celulite, dor crescente): avaliação médica.'] },
        { t: 'Medicamentos e produtos', tipo: 'meds', itens: [['oxido-zinco', 'Bota de Unna'], ['pentoxifilina', 'Adjuvante à compressão'], ['age', 'Hidratação da pele'], ['cefalexina', 'Se celulite associada (prescrição)']] }
      ] },

    { id: 'pe-diabetico', nome: 'Pé diabético', icon: '🦶', grupo: 'feridas',
      resumo: 'Neuropatia + isquemia + infecção. Prevenção com inspeção diária e calçado adequado; úlcera exige alívio de carga e avaliação de infecção e circulação.',
      msd: [['Complicações a longo prazo do diabetes', '/pt/profissional/distúrbios-endócrinos-e-metabólicos/diabetes-melito-e-hipoglicemia/complicações-a-longo-prazo-do-diabetes-mellitus'], ['Infecção necrosante de tecidos moles', '/pt/profissional/distúrbios-dermatológicos/infecções-bacterianas-da-pele/infecção-necrosante-de-tecidos-moles']],
      secoes: [
        { t: 'Avaliação', tipo: 'lista', itens: ['Sensibilidade protetora (monofilamento 10 g), pulsos pediosos e tibiais, deformidades, calosidades e calçados.', 'Úlcera: profundidade, exposição óssea (risco de osteomielite), exsudato, odor.',
          'Infecção: ≥ 2 de eritema, calor, edema, dor e secreção. Febre, eritema extenso, crepitação ou necrose = grave → urgência.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Alívio de carga (offloading): calçado ou bota de descarga, repouso do membro.', 'Limpeza e desbridamento de calosidade/necrose por profissional habilitado; cobertura conforme exsudato.',
          'Infecção: antibiótico conforme gravidade e prescrição (oral nas leves; EV nas moderadas a graves).', 'Controle glicêmico, avaliação vascular e encaminhamento ao serviço especializado.'] },
        { t: 'Educação', tipo: 'lista', itens: ['Inspecionar os pés todos os dias (espelho se necessário); nunca andar descalço.', 'Secar entre os dedos; hidratar sem aplicar entre os dedos; cortar unhas retas.', 'Calçados confortáveis, sem costuras internas; meias sem elástico apertado.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['cefalexina', 'Infecção leve (prescrição)'], ['amoxi-clav', 'Infecção leve a moderada'], ['clindamicina-oral', 'Alternativa em alergia'], ['pipe-tazo', 'Infecção grave (EV)'], ['insulina-regular', 'Controle glicêmico']] }
      ] },

    { id: 'celulite', nome: 'Celulite e erisipela', icon: '🔴', grupo: 'feridas',
      resumo: 'Infecção de pele e subcutâneo. Demarcar, elevar o membro e iniciar antibiótico; reconhecer sinais de infecção necrosante.',
      msd: [['Celulite', '/pt/profissional/distúrbios-dermatológicos/infecções-bacterianas-da-pele/celulite'], ['Erisipela', '/pt/profissional/distúrbios-dermatológicos/infecções-bacterianas-da-pele/erisipela'], ['Infecção necrosante de tecidos moles', '/pt/profissional/distúrbios-dermatológicos/infecções-bacterianas-da-pele/infecção-necrosante-de-tecidos-moles']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Erisipela: placa vermelha brilhante, elevada, de bordas bem definidas, geralmente em perna ou face.', 'Celulite: eritema, calor e edema de limites imprecisos.',
          'Alerta de infecção necrosante: dor desproporcional, bolhas hemorrágicas, crepitação, anestesia da pele, toxemia — emergência cirúrgica.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Demarcar as bordas com caneta e anotar data/hora (acompanhar progressão).', 'Elevar o membro; tratar a porta de entrada (micose interdigital, fissuras, úlcera).',
          'Antibiótico oral nos casos leves; EV se sinais sistêmicos, progressão rápida ou falha do oral.', 'Analgesia; reavaliar em 24–48 h.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['cefalexina', 'Oral, casos leves'], ['amoxicilina', 'Erisipela (estreptococo)'], ['clindamicina-oral', 'Alergia à penicilina / suspeita de MRSA'], ['smx-tmp-oral', 'Suspeita de MRSA'], ['cefazolina', 'EV, casos moderados'], ['oxacilina', 'EV'], ['penicilina-cristalina', 'Erisipela grave EV']] }
      ] },

    // ======================= Outros =======================
    { id: 'reacao-transfusional', nome: 'Reação transfusional', icon: '🩸', grupo: 'outros',
      resumo: 'Qualquer sinal novo durante ou após a transfusão: parar a transfusão, manter o acesso e avisar médico e banco de sangue.',
      msd: [['Complicações da transfusão', '/pt/profissional/hematologia/medicina-transfusional/complicações-da-transfusão'], ['Técnicas transfusionais', '/pt/profissional/hematologia/medicina-transfusional/técnicas-transfusionais']],
      secoes: [
        { t: 'Sinais', tipo: 'lista', itens: ['Febre (↑ ≥ 1 °C), calafrios, urticária, prurido, rubor', 'Dispneia, hipoxemia, sibilância, estridor', 'Hipotensão ou hipertensão, taquicardia, dor torácica ou lombar',
          'Urina escura (hemoglobinúria), sangramento difuso', 'Ansiedade, sensação de morte iminente'] },
        { t: 'Conduta imediata', tipo: 'passos', itens: ['PARAR a transfusão; manter o acesso com SF 0,9% em novo equipo.', 'Verificar sinais vitais e conferir à beira do leito a identificação do paciente e da bolsa.', 'Avisar médico e banco de sangue/agência transfusional.',
          'Enviar bolsa e equipo e colher amostras conforme a rotina (sangue e urina).', 'Tratar conforme o tipo e notificar (hemovigilância).'] },
        { t: 'Conforme o tipo', tipo: 'lista', itens: ['Febril não hemolítica: antitérmico; investigar hemólise e contaminação.', 'Alérgica leve (urticária isolada): anti-histamínico; reiniciar só com autorização médica.',
          'Anafilaxia: adrenalina IM, O₂, volume — não reiniciar.', 'Hemolítica aguda (ABO): hidratação vigorosa, manter diurese (≈ 100 mL/h no adulto), monitorizar coagulação.',
          'Sobrecarga circulatória (TACO): sentar o paciente, O₂, diurético. Lesão pulmonar (TRALI): suporte ventilatório.', 'Bacteriana (febre alta, hipotensão): hemoculturas e antibiótico.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['dipirona', 'Febre'], ['difenidramina', 'Reação alérgica'], ['hidrocortisona', 'Reação alérgica moderada (100–200 mg EV, conforme prescrição)'], ['adrenalina', 'Anafilaxia (IM)'], ['furosemida', 'Sobrecarga circulatória'], ['soro-fisiologico', 'Manter acesso / hidratação']] },
        { t: 'Prevenção', tipo: 'lista', itens: ['Dupla checagem da identificação na beira do leito.', 'Sinais vitais antes, nos primeiros 15 min (ficar ao lado do paciente) e ao final.', 'Iniciar devagar nos primeiros 15 min; terminar em até 4 h após a saída do banco.'] }
      ] },

    // ======================= Ampliação: emergência, trauma, infecção e segurança =======================
    { id: 'pcr-adulto', nome: 'Parada cardiorrespiratória (adulto)', icon: '🚨', grupo: 'choque',
      resumo: 'Compressões de alta qualidade, desfibrilação precoce nos ritmos chocáveis, adrenalina e busca das causas reversíveis.',
      msd: [['Reanimação cardiopulmonar em adultos', '/pt/profissional/medicina-de-cuidados-críticos/parada-cardíaca-e-reanimação-cardiopulmonar-rcp/reanimação-cardiopulmonar-rcp-em-adultos'], ['Parada cardíaca', '/pt/profissional/medicina-de-cuidados-críticos/parada-cardíaca-e-reanimação-cardiopulmonar-rcp/parada-cardíaca']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Não responsivo, sem respiração normal (ou só gasping) e sem pulso central palpável em até 10 s.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Chamar ajuda, acionar o código e pedir o desfibrilador/DEA; anotar o horário.',
          'Compressões: 100–120/min, profundidade 5–6 cm, retorno total do tórax, interrupções < 10 s; trocar o compressor a cada 2 min.',
          'Sem via aérea avançada: 30 compressões : 2 ventilações. Com via aérea avançada: compressões contínuas + 1 ventilação a cada 6 s.',
          'Checar o ritmo a cada 2 min. FV/TV sem pulso: choque e reiniciar a RCP imediatamente. AESP/assistolia: RCP e adrenalina o quanto antes.',
          'Adrenalina 1 mg EV/IO a cada 3–5 min. Ritmo chocável refratário: amiodarona 300 mg, depois 150 mg (ou lidocaína).',
          'Buscar causas reversíveis (5H e 5T): hipovolemia, hipóxia, H+ (acidose), hipo/hipercalemia, hipotermia; tensão no tórax (pneumotórax), tamponamento, toxinas, trombose coronariana e pulmonar.',
          'Capnografia: ETCO₂ < 10 mmHg sugere RCP inadequada; aumento súbito sugere retorno da circulação.',
          'Após o retorno da circulação: SpO₂ 92–98%, PAS ≥ 90 / PAM ≥ 65 mmHg, ECG de 12 derivações, controle de temperatura e glicemia.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['adrenalina', '1 mg a cada 3–5 min'], ['amiodarona', 'FV/TV refratária: 300 mg, depois 150 mg'], ['lidocaina', 'Alternativa à amiodarona'],
          ['sulfato-magnesio', 'Torsades de pointes'], ['gluconato-calcio', 'Hipercalemia / intoxicação por bloqueador de canal de cálcio'], ['bicarbonato', 'Situações específicas (hipercalemia, intoxicação por tricíclico)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Use o Modo PCR do app para cronometrar ciclos, choques e adrenalina.', 'Definir funções na equipe (compressão, via aérea, medicação, registro).', 'Acesso venoso calibroso ou intraósseo; lavar cada droga com 20 mL de SF e elevar o membro.'] }
      ] },

    { id: 'bradicardia', nome: 'Bradicardia com pulso', icon: '🐢', grupo: 'cardio',
      resumo: 'FC baixa com sinais de instabilidade exige atropina e, se ineficaz, marca-passo transcutâneo ou droga cronotrópica.',
      msd: [['Visão geral das arritmias', '/pt/profissional/doenças-cardiovasculares/visão-geral-de-arritmias-e-doenças-de-condução/visão-geral-das-arritmias'], ['Bloqueio atrioventricular', '/pt/profissional/doenças-cardiovasculares/arritmias-cardíacas-específicas/bloqueio-atrioventricular']],
      secoes: [
        { t: 'Sinais de instabilidade', tipo: 'lista', itens: ['Hipotensão, alteração aguda da consciência, sinais de choque, dor torácica isquêmica, insuficiência cardíaca aguda.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Manter via aérea; O₂ se hipoxemia; monitor, oximetria, acesso venoso e ECG de 12 derivações.',
          'Instável: atropina 1 mg EV, repetir a cada 3–5 min (máx. 3 mg).', 'Sem resposta: marca-passo transcutâneo e/ou infusão de dopamina ou adrenalina, enquanto se prepara marca-passo transvenoso.',
          'Investigar causas: hipercalemia, isquemia, hipotermia, medicamentos (betabloqueador, bloqueador de canal de cálcio, digoxina).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['atropina', '1 mg EV a cada 3–5 min (máx. 3 mg)'], ['dopamina', 'Infusão 5–20 mcg/kg/min'], ['adrenalina', 'Infusão 2–10 mcg/min'], ['glucagon', 'Intoxicação por betabloqueador (conforme prescrição)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Marca-passo transcutâneo: pás bem aderidas, analgesia/sedação, confirmar captura elétrica E pulso.', 'Registrar ritmo e resposta a cada intervenção.'] }
      ] },

    { id: 'taquicardia', nome: 'Taquicardia com pulso', icon: '⚡', grupo: 'cardio',
      resumo: 'Instável: cardioversão elétrica sincronizada. Estável: definir QRS estreito ou largo, regular ou irregular, e tratar conforme o ritmo.',
      msd: [['Taquicardias supraventriculares paroxísticas', '/pt/profissional/doenças-cardiovasculares/arritmias-cardíacas-específicas/taquicardias-supraventriculares-por-reentrada-paroxísticas-tsvp'], ['Fibrilação atrial', '/pt/profissional/doenças-cardiovasculares/arritmias-cardíacas-específicas/fibrilação-atrial'], ['Taquicardia ventricular', '/pt/profissional/doenças-cardiovasculares/arritmias-cardíacas-específicas/taquicardia-ventricular-tv']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Monitor, O₂ se hipoxemia, acesso venoso, ECG de 12 derivações.',
          'Instável (hipotensão, alteração de consciência, choque, dor isquêmica, IC aguda): cardioversão SINCRONIZADA com sedação, conforme o ritmo e o aparelho.',
          'QRS estreito regular estável: manobra vagal; adenosina 6 mg em bolus rápido + 20 mL de SF; se necessário, 12 mg.',
          'Fibrilação/flutter atrial estável: controle da FC (betabloqueador ou diltiazem) e avaliação de anticoagulação, conforme prescrição.',
          'QRS largo regular estável: consulta especializada; amiodarona 150 mg em 10 min conforme protocolo.',
          'QRS largo irregular ou TV polimórfica instável: tratar como FV (desfibrilação não sincronizada).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['adenosina', '6 mg → 12 mg, bolus rápido'], ['amiodarona', '150 mg em 10 min'], ['diltiazem', 'Controle de FC'], ['metoprolol', 'Controle de FC'], ['midazolam', 'Sedação para cardioversão'], ['fentanil', 'Analgesia para cardioversão']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Adenosina: acesso calibroso e próximo ao coração; avisar sobre sensação de mal-estar transitório; registrar o traçado.', 'Na cardioversão, conferir se o modo SINCRONIZADO está ativo antes de cada choque.'] }
      ] },

    { id: 'trauma-xabcde', nome: 'Atendimento inicial ao trauma (XABCDE)', icon: '🚑', grupo: 'outros',
      resumo: 'Sequência XABCDE: controlar a hemorragia exsanguinante primeiro, depois via aérea, respiração, circulação, neurológico e exposição.',
      msd: [['Abordagem do paciente de trauma', '/pt/profissional/lesões-intoxicação/abordagem-do-paciente-de-trauma/abordagem-do-paciente-de-trauma'], ['Choque', '/pt/profissional/medicina-de-cuidados-críticos/choque-e-reanimação-volêmica/choque']],
      secoes: [
        { t: 'Sequência', tipo: 'passos', itens: ['X — hemorragia exsanguinante: compressão direta, curativo compressivo, torniquete (anotar o horário).',
          'A — via aérea com restrição de movimento da coluna cervical quando indicado.', 'B — ventilação: frequência, SpO₂, expansão; suspeitar de pneumotórax hipertensivo (desvio de traqueia, ausência de murmúrio, hipotensão).',
          'C — circulação: pulsos, perfusão, 2 acessos calibrosos; cristaloide aquecido em volume limitado e hemoderivados precoces no choque hemorrágico.',
          'D — neurológico: Glasgow, pupilas, glicemia capilar.', 'E — exposição completa e prevenção de hipotermia (mantas, fluidos aquecidos).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['tranexamico', '1 g EV em 10 min, até 3 h do trauma'], ['ringer-lactato', 'Cristaloide aquecido'], ['fentanil', 'Analgesia'], ['cetamina', 'Analgesia/sedação no instável']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Reavaliar o XABCDE a cada intervenção ou piora.', 'Registrar horários (torniquete, ácido tranexâmico, hemoderivados).', 'Prevenir hipotermia: ela piora a coagulopatia.'] }
      ] },

    { id: 'tce', nome: 'Traumatismo cranioencefálico (TCE)', icon: '🧠', grupo: 'neuro',
      resumo: 'Evitar hipóxia e hipotensão (lesão secundária), classificar pelo Glasgow e reconhecer sinais de herniação.',
      msd: [['Traumatismo cranioencefálico', '/pt/profissional/lesões-intoxicação/traumatismo-cranioencefálico-tce/traumatismo-cranioencefálico-tce']],
      secoes: [
        { t: 'Classificar', tipo: 'lista', itens: ['Leve: Glasgow 13–15. Moderado: 9–12. Grave: ≤ 8 (indicação de via aérea definitiva).',
          'Sinais de herniação: anisocoria, rebaixamento progressivo, postura de decorticação/descerebração, tríade de Cushing (hipertensão, bradicardia, respiração irregular).'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Restrição de movimento da coluna cervical; cabeceira a 30° com alinhamento cervical.', 'Evitar hipóxia (SpO₂ ≥ 94%) e hipotensão (PAS ≥ 100–110 mmHg conforme a idade).',
          'Manter normocapnia, normotermia e glicemia controlada.', 'Sinais de herniação: avisar imediatamente; terapia hiperosmolar (manitol ou salina hipertônica) conforme prescrição.',
          'Paciente anticoagulado: avaliação e reversão conforme protocolo; tomografia de crânio.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['manitol', 'Hipertensão intracraniana (prescrição)'], ['cloreto-sodio-20', 'Preparo de salina hipertônica'], ['levetiracetam', 'Profilaxia de crises no TCE grave (conforme protocolo)'], ['fentanil', 'Analgesia/sedação'], ['propofol', 'Sedação no paciente intubado']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Glasgow e pupilas seriados (ex.: a cada 1 h nas primeiras horas).', 'Evitar soluções hipotônicas (soro glicosado puro).', 'Use a escala de Glasgow do app.'] }
      ] },

    { id: 'dengue', nome: 'Dengue — classificação e hidratação', icon: '🦟', grupo: 'infecto',
      resumo: 'Classificar em grupos A, B, C ou D pelos sinais de alarme e de choque; hidratação é o tratamento principal.',
      msd: [['Dengue', '/pt/profissional/doenças-infecciosas/arbovírus-arenavírus-e-filovírus/dengue']],
      secoes: [
        { t: 'Sinais de alarme', tipo: 'lista', itens: ['Dor abdominal intensa e contínua; vômitos persistentes; acúmulo de líquidos (ascite, derrame pleural ou pericárdico).',
          'Hipotensão postural ou lipotimia; hepatomegalia > 2 cm; sangramento de mucosa; letargia ou irritabilidade; aumento progressivo do hematócrito.'] },
        { t: 'Classificação (Ministério da Saúde)', tipo: 'lista', itens: ['Grupo A: sem sinais de alarme, sem sangramento e sem condição especial — tratamento ambulatorial.',
          'Grupo B: sangramento de pele (espontâneo ou prova do laço positiva) OU condição especial/comorbidade/risco social — observação e hemograma.',
          'Grupo C: algum sinal de alarme — internação e hidratação venosa.', 'Grupo D: choque, sangramento grave ou disfunção grave de órgão — emergência/UTI.'] },
        { t: 'Hidratação', tipo: 'passos', itens: ['Grupos A e B (adulto): 60 mL/kg/dia, cerca de 1/3 com SRO e o restante em água, sucos e chás, com retorno se sinais de alarme.',
          'Grupo C: SF 0,9% 10 mL/kg na 1ª hora; reavaliar e repetir (até 3 vezes) conforme a resposta clínica e o hematócrito.',
          'Grupo D: SF 0,9% ou Ringer 20 mL/kg em até 20 min; reavaliar e repetir até 3 vezes; acionar UTI.', 'Seguir o fluxograma vigente do Ministério da Saúde para adulto e criança.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['dipirona', 'Febre e dor'], ['paracetamol-oral', 'Febre e dor'], ['sro', 'Hidratação oral'], ['soro-fisiologico', 'Hidratação venosa (grupos C e D)'],
          [null, 'NÃO usar ácido acetilsalicílico nem anti-inflamatórios (risco de sangramento).']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Prova do laço: manguito na PA média por 5 min (criança 3 min); positiva com ≥ 20 petéquias em 2,5 cm² (criança ≥ 10).', 'Balanço hídrico, diurese e sinais vitais seriados.', 'Notificação compulsória.'] }
      ] },

    { id: 'peconhentos', nome: 'Acidentes por animais peçonhentos', icon: '🐍', grupo: 'tox',
      resumo: 'Cobras, escorpiões e aranhas: medidas gerais, classificação da gravidade e soroterapia específica pelo protocolo do Ministério da Saúde.',
      msd: [['Mordidas de cobra', '/pt/profissional/lesões-intoxicação/mordidas-e-picadas/mordidas-de-cobra'], ['Picadas de escorpião', '/pt/profissional/lesões-intoxicação/mordidas-e-picadas/picadas-de-escorpião']],
      secoes: [
        { t: 'Primeiras medidas', tipo: 'passos', itens: ['Lavar o local com água e sabão; manter a vítima em repouso e o membro em posição funcional.',
          'NÃO fazer torniquete, cortes, sucção nem aplicar substâncias no local.', 'Identificar o animal se possível (foto, sem risco), o horário e a região da picada.',
          'Avaliar sinais locais (dor, edema, bolhas, necrose) e sistêmicos (sangramentos, urina escura, ptose palpebral, visão turva, dispneia, vômitos, sudorese).',
          'Colher tempo de coagulação e exames conforme o tipo; acionar o CIATox e o serviço de referência para soroterapia.'] },
        { t: 'Soroterapia', tipo: 'lista', itens: ['Indicada conforme o tipo de acidente e a classificação de gravidade, em número de ampolas definido pelo protocolo do Ministério da Saúde.',
          'Administração EV, diluída, em ambiente com material de reanimação; observar reação precoce (urticária, broncoespasmo, hipotensão).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [[null, 'Soros antivenenos (antibotrópico, anticrotálico, antielapídico, antiescorpiônico etc.) — distribuídos pelo Ministério da Saúde.'],
          ['adrenalina', 'Reação anafilática ao soro'], ['dipirona', 'Dor'], ['lidocaina', 'Bloqueio anestésico na picada de escorpião (sem vasoconstritor)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Medir e anotar a circunferência do membro e a diurese.', 'Verificar a vacinação antitetânica.', 'Notificação compulsória.'] }
      ] },

    { id: 'afogamento', nome: 'Afogamento', icon: '🌊', grupo: 'resp',
      resumo: 'A hipóxia é o problema central: priorizar a ventilação e o oxigênio; classificar a gravidade (Szpilman).',
      msd: [['Afogamento', '/pt/profissional/lesões-intoxicação/afogamento/afogamento']],
      secoes: [
        { t: 'Gravidade (Szpilman)', tipo: 'lista', itens: ['Grau 1: tosse sem espuma. Grau 2: pouca espuma na boca/nariz. Grau 3: muita espuma, pulso radial presente.',
          'Grau 4: muita espuma com hipotensão. Grau 5: parada respiratória isolada. Grau 6: parada cardiorrespiratória.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Retirar da água com segurança; restrição da coluna só se houver suspeita de trauma (mergulho, queda).',
          'Parada respiratória ou PCR: iniciar pelas ventilações (5 ventilações de resgate) e seguir com RCP.', 'Oxigênio em alto fluxo; decúbito lateral se respira e há vômitos.',
          'Graus 4–6: via aérea avançada e ventilação com PEEP conforme a equipe.', 'Hipotermia: retirar roupas molhadas, aquecer, monitorizar ritmo.', 'Não tentar "retirar água" dos pulmões (manobra de Heimlich é contraindicada).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [[null, 'Oxigênio em alto fluxo'], ['adrenalina', 'PCR'], ['soro-fisiologico', 'Aquecido, se hipotensão']] }
      ] },

    { id: 'reanimacao-neonatal', nome: 'Reanimação neonatal', icon: '🍼', grupo: 'ped',
      resumo: 'O "Minuto de Ouro": iniciar ventilação com pressão positiva em até 60 s no RN que não respira adequadamente.',
      msd: [['Reanimação neonatal', '/pt/profissional/pediatria/problemas-perinatais/reanimação-neonatal']],
      secoes: [
        { t: 'Ao nascer', tipo: 'passos', itens: ['Avaliar: gestação a termo? Respira ou chora? Bom tônus? Se sim: clampeamento tardio do cordão e contato pele a pele.',
          'Se não: passos iniciais (prover calor, posicionar a cabeça, aspirar boca e narinas só se necessário, secar) e avaliar FC e respiração.',
          'Apneia, respiração irregular ou FC < 100 bpm: ventilação com pressão positiva com máscara em até 60 s de vida (≥ 34 semanas: iniciar com ar ambiente).',
          'Monitorar SpO₂ (mão direita) e FC (monitor cardíaco).', 'FC < 60 bpm após 30 s de ventilação efetiva: intubar e iniciar massagem cardíaca (3:1) com O₂ 100%.',
          'FC < 60 bpm apesar de ventilação e massagem: adrenalina EV pela veia umbilical, conforme diretriz da SBP; considerar expansor de volume se houver suspeita de hipovolemia.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['adrenalina', 'EV (veia umbilical): diluir e dosar por peso conforme diretriz da SBP'], ['soro-fisiologico', 'Expansor de volume 10 mL/kg (suspeita de hipovolemia)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Checar material antes de todo parto (fonte de calor, balão autoinflável e máscaras, aspirador, laringoscópio, cânulas, material de cateterismo umbilical).', 'Prevenir hipotermia: campos aquecidos; saco plástico no prematuro < 34 semanas.', 'Registrar horários (nascimento, início da VPP, massagem, medicações).'] }
      ] },

    { id: 'dpoc', nome: 'Exacerbação da DPOC', icon: '🫁', grupo: 'resp',
      resumo: 'Broncodilatador, corticoide sistêmico, oxigênio controlado e ventilação não invasiva quando há acidose respiratória.',
      msd: [['Tratamento da exacerbação aguda da DPOC', '/pt/profissional/distúrbios-pulmonares/doença-pulmonar-obstrutiva-crônica-e-doenças-relacionadas/tratamento-da-exacerbação-aguda-da-dpoc']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['O₂ controlado com alvo de SpO₂ 88–92% (evitar hiperóxia); gasometria arterial.',
          'Broncodilatador de curta ação (salbutamol ± ipratrópio) por aerossol com espaçador ou nebulização.', 'Corticoide sistêmico (ex.: prednisona 40 mg/dia por 5 dias), conforme prescrição.',
          'Antibiótico se escarro purulento com aumento de volume/dispneia ou necessidade de ventilação.', 'Ventilação não invasiva se acidose respiratória (pH ≤ 7,35 e PaCO₂ > 45 mmHg) ou desconforto importante.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['salbutamol', 'Broncodilatador'], ['ipratropio', 'Associado ao salbutamol'], ['prednisona', 'Corticoide oral'], ['metilprednisolona', 'Corticoide EV'], ['amoxi-clav', 'Antibiótico (se indicado)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Posição sentada; monitorar sonolência (retenção de CO₂).', 'Revisar técnica inalatória e vacinação na alta.'] }
      ] },

    { id: 'ehh', nome: 'Estado hiperglicêmico hiperosmolar', icon: '🍬', grupo: 'metabolico',
      resumo: 'Hiperglicemia grave com desidratação intensa e hiperosmolaridade, sem cetoacidose importante. Volume primeiro, insulina depois.',
      msd: [['Complicações agudas do diabetes', '/pt/profissional/distúrbios-endócrinos-e-metabólicos/diabetes-melito-e-hipoglicemia/complicações-agudas-do-diabetes-mellitus']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Glicemia muito elevada (geralmente > 600 mg/dL), osmolalidade efetiva > 300 mOsm/kg, desidratação importante e alteração da consciência, sem acidose cetótica significativa.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Reposição volêmica com SF 0,9% (adulto sem cardiopatia: cerca de 1–1,5 L na 1ª hora), depois conforme o sódio corrigido e a diurese.',
          'Potássio: repor antes/junto da insulina; não iniciar insulina com K < 3,5 mEq/L.', 'Insulina regular EV em bomba após iniciar a hidratação, conforme protocolo.',
          'Associar soro glicosado quando a glicemia se aproximar de 250–300 mg/dL.', 'Corrigir a osmolalidade e o sódio lentamente (risco de edema cerebral); profilaxia de TEV.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Reposição volêmica'], ['insulina-regular', 'Infusão EV'], ['cloreto-potassio', 'Reposição de potássio'], ['soro-glicosado', 'Quando a glicemia cair'], ['enoxaparina', 'Profilaxia de TEV']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Glicemia capilar a cada 1 h; eletrólitos a cada 2–4 h.', 'Balanço hídrico rigoroso e nível de consciência.', 'Use a calculadora de sódio corrigido do app.'] }
      ] },

    { id: 'seguranca-paciente', nome: 'Segurança do paciente — as 6 metas', icon: '🛡️', grupo: 'outros',
      resumo: 'Protocolos básicos do Programa Nacional de Segurança do Paciente: identificação, comunicação, medicamentos, cirurgia segura, higiene das mãos, quedas e lesão por pressão.',
      msd: [['Erros de medicação', '/pt/profissional/farmacologia-clínica/conceitos-em-farmacoterapia/erros-de-medicação']],
      secoes: [
        { t: 'Metas', tipo: 'passos', itens: ['Identificar corretamente o paciente: pulseira com pelo menos 2 identificadores (nome completo e data de nascimento, por exemplo) — conferir antes de todo procedimento.',
          'Comunicação efetiva: passagem de plantão estruturada (ex.: SBAR); ordens verbais repetidas e confirmadas.',
          'Medicamentos de alta vigilância: dupla checagem, rotulagem e conferência dos certos da medicação.',
          'Cirurgia segura: lista de verificação (antes da indução, antes da incisão e antes de sair da sala).',
          'Higiene das mãos nos 5 momentos (antes do contato, antes de procedimento asséptico, após risco de fluidos, após contato, após tocar o entorno).',
          'Reduzir quedas e lesões por pressão: avaliação de risco (Morse e Braden) e medidas preventivas.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [[null, 'Exemplos de alta vigilância: eletrólitos concentrados, insulinas, anticoagulantes, opioides, bloqueadores neuromusculares, quimioterápicos.'],
          ['cloreto-potassio', 'Nunca EV direto; armazenamento segregado'], ['insulina-regular', 'Dupla checagem'], ['heparina', 'Dupla checagem'], ['morfina', 'Dupla checagem']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Notificar incidentes e eventos adversos (cultura justa, sem punição).', 'Envolver paciente e família na conferência da identificação e da medicação.'] }
      ] },

    { id: 'quedas', nome: 'Prevenção de quedas', icon: '🦯', grupo: 'outros',
      resumo: 'Avaliar o risco na admissão e periodicamente (Morse), aplicar medidas preventivas e revisar medicamentos que aumentam o risco.',
      msd: [['Quedas em idosos', '/pt/profissional/geriatria/quedas-em-idosos/quedas-em-idosos']],
      secoes: [
        { t: 'Medidas', tipo: 'passos', itens: ['Escala de Morse na admissão, a cada mudança clínica e após queda (use a escala do app).',
          'Cama baixa e travada, campainha ao alcance, iluminação adequada, piso seco, calçado antiderrapante.', 'Acompanhar ao banheiro quem tem risco; horários programados de eliminação.',
          'Revisar medicamentos: sedativos, hipnóticos, opioides, anti-hipertensivos, diuréticos, hipoglicemiantes.', 'Sinalizar o risco (pulseira/placa) e orientar paciente e família.'] },
        { t: 'Após uma queda', tipo: 'lista', itens: ['Avaliar dano (sinais vitais, dor, deformidades, nível de consciência; atenção a TCE em anticoagulados).', 'Comunicar a equipe médica e notificar o evento.'] },
        { t: 'Medicamentos que aumentam o risco', tipo: 'meds', itens: [['clonazepam', 'Benzodiazepínico'], ['zolpidem', 'Hipnótico'], ['morfina', 'Opioide'], ['furosemida', 'Diurético'], ['insulina-regular', 'Hipoglicemia']] }
      ] },

    { id: 'tev-profilaxia', nome: 'Profilaxia de tromboembolismo venoso', icon: '🦵', grupo: 'cardio',
      resumo: 'Avaliar risco de trombose e de sangramento em todo paciente internado; profilaxia mecânica e/ou farmacológica conforme o risco.',
      msd: [['Prevenção da trombose venosa profunda', '/pt/profissional/doenças-cardiovasculares/doenças-venosas-periféricas/prevenção-da-trombose-venosa-profunda-tvp']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Avaliar o risco na admissão (ex.: escore de Padua no clínico, Caprini no cirúrgico) e o risco de sangramento.',
          'Estimular deambulação precoce e mobilização no leito.', 'Profilaxia farmacológica conforme prescrição (ex.: enoxaparina 40 mg SC 1x/dia ou heparina 5.000 UI SC 2–3x/dia; ajuste na insuficiência renal).',
          'Contraindicação a anticoagulante: compressão pneumática intermitente ou meias, conforme protocolo.', 'Reavaliar diariamente e na alta.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['enoxaparina', 'SC 1x/dia'], ['heparina', 'SC 2–3x/dia'], ['fondaparinux', 'Alternativa']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Aplicar SC no abdome, alternando lados, sem aspirar e sem massagear.', 'Observar sangramentos e plaquetas (plaquetopenia por heparina).'] }
      ] },

    { id: 'neutropenia-febril', nome: 'Neutropenia febril', icon: '🌡️', grupo: 'infecto',
      resumo: 'Emergência oncológica: febre em paciente com neutrófilos baixos exige culturas e antibiótico de amplo espectro em até 1 hora.',
      msd: [['Neutropenia', '/pt/profissional/hematologia/leucopenias/neutropenia']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Temperatura ≥ 38,3 °C (ou ≥ 38 °C por 1 h) e neutrófilos < 500/mm³ (ou < 1.000 com queda prevista).', 'Pode haver poucos sinais de infecção: valorizar febre isolada.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Triagem prioritária; sinais vitais e avaliação de sepse.', 'Hemoculturas (periférica e de cada lúmen do cateter) e outras culturas, sem atrasar o antibiótico.',
          'Antibiótico de amplo espectro com ação antipseudomonas em até 60 min, conforme protocolo (ex.: cefepima).', 'Associar vancomicina se suspeita de infecção de cateter, pele, pneumonia ou instabilidade.',
          'Precauções conforme o protocolo da CCIH; evitar procedimentos retais.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['cefepima', '1ª linha usual'], ['pipe-tazo', 'Alternativa'], ['meropenem', 'Risco de multirresistência / instabilidade'], ['vancomicina', 'Situações específicas'], ['dipirona', 'Antitérmico (evitar AINE)'], ['filgrastim', 'Casos selecionados (prescrição)']] }
      ] },

    // ---------- Protocolos ampliados ----------
    { id: 'fa', nome: 'Fibrilação atrial aguda', icon: '💓', grupo: 'cardio',
      resumo: 'Instável: cardioversão elétrica sincronizada. Estável: controle da frequência, avaliação do risco de AVC (CHA₂DS₂-VASc) e anticoagulação.',
      msd: [['Fibrilação atrial', '/pt/profissional/doenças-cardiovasculares/arritmias-cardíacas-específicas/fibrilação-atrial']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Pulso irregularmente irregular; ECG com ausência de onda P e intervalos RR irregulares.', 'Sinais de instabilidade: hipotensão, choque, dor torácica isquêmica, insuficiência cardíaca aguda, alteração da consciência.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Monitorização cardíaca, oximetria, PA, acesso venoso e ECG de 12 derivações.',
          'Instável: preparar cardioversão elétrica sincronizada com sedação (modo SINC ligado a cada choque).',
          'Estável: controle da frequência com betabloqueador ou bloqueador de cálcio não di-hidropiridínico (evitar este na IC com fração de ejeção reduzida); amiodarona ou digoxina em situações específicas, conforme prescrição.',
          'FA com mais de 48 h ou duração desconhecida: não cardioverter eletivamente sem anticoagulação adequada ou ecocardiograma transesofágico.',
          'Calcular CHA₂DS₂-VASc (risco de AVC) e HAS-BLED (sangramento) para decidir anticoagulação.', 'Tratar causas: infecção, hipovolemia, distúrbios eletrolíticos, hipertireoidismo, álcool.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['metoprolol', 'Controle de frequência'], ['diltiazem', 'Controle de frequência (evitar na IC com FE reduzida)'], ['amiodarona', 'Controle de ritmo/frequência'], ['digoxina', 'Controle de frequência na IC'], ['heparina', 'Anticoagulação inicial'], ['apixabana', 'Anticoagulante oral'], ['rivaroxabana', 'Anticoagulante oral']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Registrar FC (apical) e ritmo; observar sinais de baixo débito.', 'Na cardioversão: jejum, consentimento, desfibrilador pronto, via aérea e material de sedação.', 'Orientar adesão e sinais de sangramento quando anticoagulado.'] }
      ] },

    { id: 'pneumonia', nome: 'Pneumonia adquirida na comunidade', icon: '🫁', grupo: 'resp',
      resumo: 'Avaliar gravidade (CURB-65, sinais de sepse), oxigênio se necessário, culturas nos casos graves e antibiótico precoce.',
      msd: [['Pneumonia adquirida na comunidade', '/pt/profissional/distúrbios-pulmonares/pneumonia/pneumonia-adquirida-na-comunidade']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Tosse, febre, dispneia, dor pleurítica, crepitações; em idosos pode haver só confusão ou queda do estado geral.', 'Gravidade: CURB-65, SpO₂, FR, PA, lactato; procurar critérios de sepse.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Oxigênio para manter SpO₂ ≥ 92% (88–92% em retentores de CO₂).', 'Internados: hemoculturas e escarro antes do antibiótico, sem atrasar a primeira dose.',
          'Antibiótico na primeira hora em sepse/choque; nos demais, o mais cedo possível após o diagnóstico.', 'Hidratação, antitérmico e fisioterapia respiratória conforme a necessidade.',
          'Reavaliar em 48–72 h; trocar para via oral quando estável e aceitando dieta.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['amoxicilina', 'Ambulatorial sem comorbidades'], ['azitromicina-oral', 'Cobertura de atípicos'], ['amoxi-clav', 'Com comorbidades'], ['ceftriaxona', 'Internação'], ['azitromicina-ev', 'Associação na internação'], ['levofloxacino', 'Alternativa (quinolona respiratória)'], ['claritromicina', 'Alternativa macrolídeo']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Cabeceira elevada; monitorar FR, SpO₂ e nível de consciência.', 'Registrar o horário da 1ª dose de antibiótico.', 'Incentivar tosse, mobilização precoce e hidratação; checar vacinação (influenza, pneumocócica) na alta.'] }
      ] },

    { id: 'itu', nome: 'Infecção urinária e pielonefrite', icon: '🚽', grupo: 'infecto',
      resumo: 'Diferenciar cistite de pielonefrite, colher urocultura corretamente antes do antibiótico e observar sinais de sepse.',
      msd: [['Infecções bacterianas do trato urinário', '/pt/profissional/doenças-infecciosas/infecções-do-trato-urinário/infecções-bacterianas-do-trato-urinário']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Cistite: disúria, polaciúria, urgência, dor suprapúbica, sem febre.', 'Pielonefrite: febre, calafrios, dor lombar (Giordano positivo), náuseas/vômitos.', 'Idosos: confusão e queda funcional podem ser os únicos sinais; bacteriúria assintomática geralmente não se trata (exceto gestantes e antes de procedimentos urológicos).'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Urocultura de jato médio (higiene prévia) ou por punção do dispositivo de coleta da sonda — nunca da bolsa coletora.',
          'Cistite não complicada: antibiótico oral de curta duração conforme prescrição.', 'Pielonefrite: hidratação, analgesia, antitérmico e antibiótico (oral ou EV conforme gravidade).',
          'Sinais de sepse: acionar protocolo de sepse.', 'Gestantes: sempre tratar e fazer controle de cura.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['nitrofurantoina', 'Cistite'], ['fosfomicina', 'Cistite (dose única)'], ['cefalexina', 'Cistite (alternativa, gestantes)'], ['ceftriaxona', 'Pielonefrite'], ['ciprofloxacino', 'Pielonefrite (quando indicado)'], ['dipirona', 'Analgesia e febre']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Balanço hídrico e diurese.', 'Orientar hidratação, micção frequente e completar o antibiótico.', 'Em sondados: avaliar necessidade diária da sonda.'] }
      ] },

    { id: 'cefaleia', nome: 'Cefaleia na emergência', icon: '🤕', grupo: 'neuro',
      resumo: 'Procurar sinais de alarme (cefaleia secundária). Na crise de enxaqueca: analgesia, antiemético, hidratação e ambiente calmo.',
      msd: [['Abordagem do paciente com cefaleia', '/pt/profissional/distúrbios-neurológicos/cefaleia/abordagem-do-paciente-com-cefaleia'], ['Enxaqueca', '/pt/profissional/distúrbios-neurológicos/cefaleia/enxaqueca']],
      secoes: [
        { t: 'Sinais de alarme', tipo: 'lista', itens: ['Início súbito e máximo em segundos ("a pior da vida") — suspeitar de hemorragia subaracnóidea.', 'Febre com rigidez de nuca; déficit neurológico focal, convulsão ou alteração da consciência.',
          'Início após os 50 anos, padrão novo ou progressivo; imunossupressão, câncer, gestação/puerpério, anticoagulação ou trauma recente.', 'Piora com Valsalva ou ao deitar; papiledema.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Sinais vitais, glicemia, avaliação neurológica (Glasgow, pupilas, força).', 'Com sinal de alarme: comunicar imediatamente, preparar para imagem.',
          'Enxaqueca: analgésico/anti-inflamatório + antiemético EV conforme prescrição; hidratação; dexametasona pode reduzir recorrência.', 'Evitar opioides como primeira escolha na enxaqueca.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['dipirona', 'Analgésico'], ['cetoprofeno-ev', 'Anti-inflamatório'], ['metoclopramida', 'Antiemético (também analgésico na enxaqueca)'], ['dexametasona', 'Prevenção de recorrência'], ['soro-fisiologico', 'Hidratação']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Ambiente escuro e silencioso.', 'Reavaliar dor (escala 0–10) após 30–60 min.', 'Observar acatisia/distonia após metoclopramida.'] }
      ] },

    { id: 'agitacao', nome: 'Agitação psicomotora', icon: '🧠', grupo: 'neuro',
      resumo: 'Segurança de todos, desescalada verbal primeiro, investigar causas orgânicas; contenção química ou mecânica só quando necessário e com monitorização.',
      msd: [['Agitação e confusão em pacientes criticamente enfermos', '/pt/profissional/medicina-de-cuidados-críticos/abordagem-do-paciente-criticamente-enfermo/agitação-confusão-e-bloqueio-neuromuscular-em-pacientes-criticamente-enfermos']],
      secoes: [
        { t: 'Conduta', tipo: 'passos', itens: ['Ambiente seguro: retirar objetos perigosos, manter rota de saída, equipe suficiente.',
          'Desescalada verbal: tom calmo, frases curtas, escuta, oferecer escolhas.', 'Investigar causas orgânicas: hipoglicemia, hipóxia, dor, retenção urinária, infecção, intoxicação ou abstinência, delirium.',
          'Contenção química conforme prescrição, preferindo via oral quando o paciente aceita.', 'Contenção mecânica: último recurso, com prescrição, técnica adequada, equipe treinada e registro (Resolução COFEN 427/2012).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['haloperidol', 'Antipsicótico'], ['prometazina', 'Associada ao haloperidol'], ['midazolam', 'Sedação (monitorar respiração)'], ['olanzapina', 'Antipsicótico atípico'], ['lorazepam', 'Abstinência alcoólica'], ['biperideno', 'Se distonia aguda']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Na contenção: sinais vitais, perfusão, pele e conforto dos membros em intervalos curtos; liberar o quanto antes.', 'Após sedação: FR, SpO₂ e nível de consciência; ECG se haloperidol EV ou doses repetidas.', 'Registrar motivo, horário, técnica e reavaliações.'] }
      ] },

    { id: 'irpa', nome: 'Insuficiência respiratória e oxigenoterapia', icon: '💨', grupo: 'resp',
      resumo: 'Reconhecer o desconforto respiratório, escolher o dispositivo de O₂ pelo alvo de saturação e escalar suporte (CNAF, VNI, intubação) a tempo.',
      msd: [['Insuficiência respiratória hipoxêmica aguda', '/pt/profissional/medicina-de-cuidados-críticos/insuficiência-respiratória-e-ventilação-mecânica/insuficiência-respiratória-hipoxêmica-aguda-irha-sdra'], ['Insuficiência ventilatória', '/pt/profissional/medicina-de-cuidados-críticos/insuficiência-respiratória-e-ventilação-mecânica/insuficiência-ventilatória']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Taquipneia, uso de musculatura acessória, tiragem, fala entrecortada, cianose, SpO₂ baixa.', 'Sinais de exaustão: respiração paradoxal, sonolência, bradipneia — risco de parada.'] },
        { t: 'Oxigenoterapia', tipo: 'passos', itens: ['Alvo de SpO₂ 92–96% na maioria; 88–92% em retentores de CO₂ (DPOC, obesidade-hipoventilação).',
          'Cateter nasal: baixo fluxo, para hipoxemia leve.', 'Máscara simples ou Venturi: FiO₂ intermediária/controlada (Venturi indicada quando se quer FiO₂ precisa).',
          'Máscara com reservatório: hipoxemia grave, fluxo alto suficiente para manter a bolsa inflada.', 'Cânula nasal de alto fluxo ou VNI conforme indicação; preparar intubação se não houver melhora.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['salbutamol', 'Broncoespasmo'], ['ipratropio', 'Broncoespasmo (associado)'], ['furosemida', 'Congestão pulmonar'], ['metilprednisolona', 'Asma/DPOC graves']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Posição sentada/Fowler; reavaliar SpO₂ e FR após cada ajuste.', 'Umidificar O₂ em fluxos altos e prolongados; proteger pele de pressão da máscara.', 'Use a calculadora de oxigênio e a relação P/F do app.'] }
      ] },

    { id: 'pcr-ped', nome: 'PCR pediátrica (PALS)', icon: '🧸', grupo: 'ped',
      resumo: 'Compressões de qualidade, ventilação, adrenalina precoce nos ritmos não chocáveis e desfibrilação por peso nos chocáveis.',
      msd: [['RCP em lactentes e crianças', '/pt/profissional/medicina-de-cuidados-críticos/parada-cardíaca-e-reanimação-cardiopulmonar-rcp/reanimação-cardiopulmonar-rcp-em-lactentes-e-crianças']],
      secoes: [
        { t: 'RCP de alta qualidade', tipo: 'passos', itens: ['Compressões 100–120/min, profundidade de ao menos 1/3 do diâmetro do tórax (≈ 4 cm no lactente, ≈ 5 cm na criança), retorno completo, mínimas interrupções.',
          'Sem via aérea avançada: 30:2 com um socorrista, 15:2 com dois.', 'Com via aérea avançada: compressões contínuas e 1 ventilação a cada 2–3 s.', 'Trocar quem comprime a cada 2 min.'] },
        { t: 'Ritmos', tipo: 'passos', itens: ['Não chocável (assistolia/AESP): adrenalina o quanto antes e a cada 3–5 min.',
          'Chocável (FV/TV sem pulso): choque 2 J/kg, depois 4 J/kg; seguintes ≥ 4 J/kg (máximo 10 J/kg ou dose de adulto).', 'Após o 2º choque: adrenalina; amiodarona ou lidocaína na FV/TV refratária.',
          'Causas reversíveis (Hs e Ts): hipóxia é a mais comum em crianças.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['adrenalina', '0,01 mg/kg EV/IO (máx. 1 mg) a cada 3–5 min'], ['amiodarona', '5 mg/kg em bolus na FV/TV refratária (até 3 doses)'], ['lidocaina', 'Alternativa à amiodarona'], ['glicose-50', 'Se hipoglicemia (diluir para criança)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Use a Emergência pediátrica do app para doses e cânula pelo peso/idade.', 'Acesso intraósseo se o venoso não for obtido rapidamente.', 'Registrar horários de doses e choques; acolher a família.'] }
      ] },

    { id: 'sifilis-gestacao', nome: 'Sífilis na gestação', icon: '🤰', grupo: 'obst',
      resumo: 'Testar no pré-natal e no parto, tratar a gestante e a parceria com penicilina benzatina conforme o estágio e acompanhar com VDRL.',
      msd: [['Sífilis', '/pt/profissional/doenças-infecciosas/infecções-sexualmente-transmissíveis/sífilis'], ['Sífilis congênita', '/pt/profissional/pediatria/infecções-em-neonatos/sífilis-congênita']],
      secoes: [
        { t: 'Rastreio', tipo: 'lista', itens: ['Teste rápido/VDRL na 1ª consulta, no 3º trimestre, no parto ou aborto, e após exposição de risco.', 'Teste rápido reagente: iniciar tratamento sem aguardar o VDRL (gestante).'] },
        { t: 'Tratamento (PCDT-IST)', tipo: 'passos', itens: ['Sífilis recente (primária, secundária, latente recente): penicilina benzatina 2,4 milhões UI IM em dose única (1,2 milhão em cada glúteo).',
          'Sífilis tardia ou de duração ignorada: 2,4 milhões UI IM por semana, 3 semanas (total 7,2 milhões UI).', 'Na gestante, se o intervalo entre doses ultrapassar o permitido no protocolo, reiniciar o esquema.',
          'Tratar a(s) parceria(s) sexual(is).', 'Somente a penicilina benzatina é considerada tratamento adequado da gestante para prevenção da sífilis congênita.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['penicilina-benzatina', 'Tratamento de escolha'], ['ceftriaxona', 'Alternativa excepcional (não trata adequadamente o feto)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['IM profunda no glúteo (ventroglútea preferencial); nunca EV; observar por 30 min.', 'Orientar reação de Jarisch-Herxheimer (febre e mal-estar nas primeiras 24 h).', 'Notificação compulsória; VDRL mensal na gestante até o parto; avaliar o RN ao nascer.'] }
      ] },

    { id: 'extravasamento', nome: 'Extravasamento, infiltração e flebite', icon: '💉', grupo: 'feridas',
      resumo: 'Interromper a infusão, aspirar o resíduo, retirar o cateter, delimitar e tratar conforme o agente; prevenir com escolha do acesso e vigilância.',
      msd: [['Acesso vascular', '/pt/profissional/medicina-de-cuidados-críticos/abordagem-do-paciente-criticamente-enfermo/acesso-vascular']],
      secoes: [
        { t: 'Conduta imediata', tipo: 'passos', itens: ['Interromper a infusão; não lavar a via.', 'Aspirar o resíduo pelo cateter e então retirá-lo (exceto quando o protocolo pede manter para antídoto).',
          'Delimitar a área, fotografar e medir; elevar o membro.', 'Compressa conforme o agente (frio para a maioria; calor para alcaloides da vinca e algumas soluções), segundo o protocolo institucional.',
          'Comunicar o médico, aplicar antídoto quando indicado e notificar o evento.'] },
        { t: 'Prevenção', tipo: 'lista', itens: ['Vesicantes e vasopressores: preferir acesso central; se periférico, veia calibrosa, longe de articulações, com refluxo testado.', 'Avaliar o sítio antes de cada administração e a cada turno (escalas de flebite e infiltração da INS).', 'Fixação adequada e orientação ao paciente para relatar dor ou ardor.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['noradrenalina', 'Vasopressor vesicante'], ['gluconato-calcio', 'Irritante'], ['bicarbonato', 'Vesicante'], ['fenitoina', 'Vesicante (síndrome da luva roxa)'], [null, 'Antídotos conforme o agente e protocolo: fentolamina (vasopressores), hialuronidase (soluções hiperosmolares, alguns citostáticos), dexrazoxano (antraciclinas)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Aplicar as escalas de flebite e infiltração do app.', 'Reavaliar o local em 24, 48 h e até a resolução.'] }
      ] },

    { id: 'hemotransfusao', nome: 'Administração segura de hemocomponentes', icon: '🩸', grupo: 'outros',
      resumo: 'Dupla checagem à beira do leito, sinais vitais, infusão lenta nos primeiros 15 min com observação e tempo máximo de infusão.',
      msd: [['Técnicas transfusionais', '/pt/profissional/hematologia/medicina-transfusional/técnicas-transfusionais'], ['Hemoderivados', '/pt/profissional/hematologia/medicina-transfusional/hemoderivados']],
      secoes: [
        { t: 'Antes', tipo: 'passos', itens: ['Conferir prescrição, consentimento e identificação do paciente (pulseira e verbal) com a etiqueta da bolsa — dupla checagem por dois profissionais.',
          'Verificar tipo, validade, integridade e aspecto da bolsa.', 'Sinais vitais basais (temperatura, PA, FC, FR, SpO₂).'] },
        { t: 'Durante', tipo: 'passos', itens: ['Equipo exclusivo com filtro; via sem outros medicamentos (somente SF 0,9% é compatível).',
          'Infundir lentamente nos primeiros 15 min, permanecendo junto ao paciente; repetir sinais vitais.', 'Concentrado de hemácias: concluir em até 4 h; plaquetas e plasma: conforme orientação do serviço de hemoterapia.',
          'Não aquecer fora de aquecedor próprio nem refrigerar plaquetas.'] },
        { t: 'Reação transfusional', tipo: 'passos', itens: ['Parar a transfusão, manter o acesso com SF 0,9% e chamar o médico.', 'Conferir novamente bolsa e paciente; devolver a bolsa e o equipo à agência transfusional.', 'Notificar (hemovigilância).'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Única solução compatível na via'], ['furosemida', 'Sobrecarga volêmica, se prescrita'], ['difenidramina', 'Reações alérgicas'], ['hidrocortisona', 'Reações alérgicas'], ['adrenalina', 'Anafilaxia']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Registrar horário de início e fim, número da bolsa e sinais vitais.', 'Veja também o protocolo de reação transfusional.'] }
      ] },

    { id: 'nutricao-enteral', nome: 'Sondas: dieta e medicamentos', icon: '🥤', grupo: 'outros',
      resumo: 'Confirmar posição, cabeceira elevada, lavar a sonda entre medicamentos e nunca triturar formas de liberação prolongada ou com revestimento entérico.',
      msd: [['Nutrição enteral', '/pt/profissional/distúrbios-nutricionais/suporte-nutricional/nutrição-enteral']],
      secoes: [
        { t: 'Segurança', tipo: 'passos', itens: ['Confirmar o posicionamento após a passagem (radiografia para sondas de alimentação) e verificar a marcação externa antes de cada uso.',
          'Cabeceira a 30–45° durante a dieta e por 30–60 min após.', 'Conectores próprios para enteral (nunca conectar a vias venosas).', 'Rotular equipo e frasco; seguir validade e troca conforme protocolo.'] },
        { t: 'Medicamentos pela sonda', tipo: 'passos', itens: ['Preferir formas líquidas; triturar comprimidos simples separadamente e diluir em água.',
          'Não triturar: liberação prolongada (LP, XR, retard), revestimento entérico, sublinguais, citotóxicos.', 'Lavar a sonda com água antes, entre cada medicamento e depois (volume conforme protocolo; adultos em geral 15–30 mL).',
          'Não misturar medicamentos entre si nem com a dieta; pausar a dieta quando houver interação (ex.: fenitoína, levotiroxina), conforme protocolo.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['fenitoina', 'Interage com a dieta: pausar conforme protocolo'], ['levotiroxina', 'Em jejum: pausar a dieta'], ['omeprazol-oral', 'Não triturar os microgrânulos'], [null, 'Consultar a farmácia para formas que não podem ser trituradas']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Sonda obstruída: água morna com seringa de 20 mL e movimentos suaves; nunca usar fio-guia para desobstruir.', 'Observar distensão, vômitos, diarreia e glicemia.', 'Higiene oral e da narina; trocar a fixação diariamente.'] }
      ] },

    { id: 'pav', nome: 'Prevenção de pneumonia associada à ventilação', icon: '🫁', grupo: 'infecto',
      resumo: 'Pacote de medidas (bundle): cabeceira elevada, interrupção diária da sedação, higiene oral, cuff adequado e cuidados com o circuito.',
      msd: [['Pneumonia associada ao ventilador', '/pt/profissional/distúrbios-pulmonares/pneumonia/pneumonia-associada-ao-ventilador']],
      secoes: [
        { t: 'Bundle', tipo: 'passos', itens: ['Cabeceira elevada a 30–45°.', 'Interrupção diária da sedação e avaliação da possibilidade de extubação.',
          'Higiene oral com escovação conforme protocolo institucional.', 'Pressão do cuff entre 20 e 30 cmH₂O, verificada periodicamente.',
          'Aspiração subglótica quando o tubo permitir; evitar trocas rotineiras do circuito (trocar se sujo ou com mau funcionamento).', 'Drenar condensado do circuito para longe do paciente.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['clorexidina', 'Higiene oral conforme protocolo'], ['dexmedetomidina', 'Sedação mais leve'], ['propofol', 'Sedação (interrupção diária)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Checar o bundle a cada turno e registrar adesão.', 'Higiene das mãos antes e depois de manipular a via aérea.', 'Aspiração traqueal só quando necessária, com técnica asséptica.'] }
      ] },

    { id: 'ics-cvc', nome: 'Prevenção de infecção de cateter central', icon: '🧷', grupo: 'infecto',
      resumo: 'Bundle de inserção e de manutenção: barreira máxima, clorexidina, desinfecção dos conectores, curativo íntegro e retirada assim que possível.',
      msd: [['Acesso vascular', '/pt/profissional/medicina-de-cuidados-críticos/abordagem-do-paciente-criticamente-enfermo/acesso-vascular'], ['Bacteremia', '/pt/profissional/doenças-infecciosas/biologia-das-doenças-infecciosas/bacteremia']],
      secoes: [
        { t: 'Inserção', tipo: 'passos', itens: ['Higiene das mãos e precaução de barreira máxima (gorro, máscara, avental e luvas estéreis, campo amplo).',
          'Antissepsia da pele com clorexidina alcoólica, aguardando secar.', 'Preferir subclávia ou jugular a femoral em adultos; usar ultrassom; checklist de inserção.'] },
        { t: 'Manutenção', tipo: 'passos', itens: ['Desinfetar conectores e torneirinhas com álcool 70% por fricção antes de cada acesso.',
          'Curativo transparente trocado conforme protocolo (em geral a cada 7 dias) ou gaze a cada 48 h — ou antes, se úmido, solto ou sujo.', 'Trocar equipos conforme o tipo de infusão e protocolo.',
          'Avaliar diariamente a necessidade do cateter e retirar o quanto antes.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['clorexidina', 'Antissepsia da pele'], [null, 'Álcool 70% para desinfecção de conectores']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Inspecionar o sítio a cada turno (hiperemia, secreção, dor).', 'Febre sem foco em paciente com cateter: comunicar, colher hemoculturas conforme protocolo.'] }
      ] },

    { id: 'itu-cateter', nome: 'Prevenção de ITU associada à sonda vesical', icon: '🧪', grupo: 'infecto',
      resumo: 'Indicar corretamente, inserir com técnica asséptica, manter sistema fechado e retirar a sonda o mais cedo possível.',
      msd: [['ITU relacionada a cateter', '/pt/profissional/doenças-infecciosas/infecções-do-trato-urinário/infecções-bacterianas-do-trato-urinário-relacionadas-a-catéter'], ['Cateterismo vesical', '/pt/profissional/distúrbios-geniturinários/abordagem-do-paciente-com-problemas-urológicos/cateterismo-vesical']],
      secoes: [
        { t: 'Bundle', tipo: 'passos', itens: ['Sondar só com indicação (retenção, débito urinário em pacientes críticos, cirurgias específicas, cuidados de fim de vida); considerar alternativas.',
          'Técnica asséptica, material estéril e o menor calibre adequado.', 'Sistema fechado; bolsa abaixo do nível da bexiga, sem tocar o chão; fluxo sem dobras.',
          'Esvaziar a bolsa com frasco individual, sem contato da saída com o frasco.', 'Fixar a sonda (coxa ou abdome) e higienizar o meato com água e sabão diariamente.', 'Rever a necessidade todos os dias e retirar assim que possível.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['clorexidina', 'Antissepsia na inserção (conforme protocolo)'], ['lidocaina', 'Gel anestésico para inserção']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Não trocar a sonda rotineiramente em intervalos fixos.', 'Coletar urina pelo dispositivo próprio, nunca da bolsa.'] }
      ] },

    { id: 'dai', nome: 'Dermatite associada à incontinência', icon: '🧴', grupo: 'feridas',
      resumo: 'Limpeza suave, proteção com barreira e controle da incontinência; diferenciar de lesão por pressão.',
      msd: [['Incontinência urinária em adultos', '/pt/profissional/distúrbios-geniturinários/distúrbios-miccionais/incontinência-urinária-em-adultos'], ['Intertrigo', '/pt/profissional/distúrbios-dermatológicos/infecções-fúngicas-da-pele/intertrigo']],
      secoes: [
        { t: 'Reconhecer', tipo: 'lista', itens: ['Eritema e erosões difusas, superficiais, de bordas mal definidas em área exposta a urina/fezes (períneo, glúteos, virilha).', 'Lesão por pressão costuma ser localizada sobre proeminência óssea, com bordas definidas.', 'Lesões satélites e prurido sugerem candidíase associada.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Limpar logo após cada episódio com produto de pH próximo ao da pele, sem esfregar.',
          'Secar delicadamente e aplicar protetor de barreira (óxido de zinco, polímero acrílico ou dimeticona).', 'Manejar a causa: horários de troca, coletores, avaliação da diarreia.', 'Candidíase: antifúngico tópico conforme prescrição.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['oxido-zinco', 'Barreira'], ['nistatina', 'Candidíase'], ['clotrimazol', 'Candidíase']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Evitar múltiplas camadas de fralda/forros.', 'Registrar a evolução e fotografar conforme protocolo.'] }
      ] },

    { id: 'ferida-operatoria', nome: 'Ferida operatória', icon: '🩹', grupo: 'feridas',
      resumo: 'Curativo estéril inicial, avaliação diária, reconhecimento precoce de infecção de sítio cirúrgico e deiscência.',
      msd: [['Como limpar, irrigar, desbridar e fazer curativos em feridas', '/pt/profissional/lesões-intoxicação/como-cuidar-de-feridas-e-lacerações/como-limpar-irrigar-desbridar-e-fazer-curativos-em-feridas']],
      secoes: [
        { t: 'Cuidados', tipo: 'passos', itens: ['Manter o curativo estéril do centro cirúrgico pelas primeiras 24–48 h, salvo se saturado ou solto.',
          'Trocar com técnica asséptica; limpar com SF 0,9% do centro para fora.', 'Avaliar: bordas, secreção, hiperemia, calor, edema, dor e febre.',
          'Drenos: registrar débito e aspecto; fixar sem tração.'] },
        { t: 'Sinais de alerta', tipo: 'lista', itens: ['Infecção: secreção purulenta, hiperemia progressiva, calor, dor crescente, febre.', 'Deiscência: cobrir com gaze umedecida em SF 0,9% e comunicar.', 'Evisceração: emergência — paciente em repouso, cobrir com compressa estéril úmida, não reintroduzir as vísceras, comunicar a equipe cirúrgica.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Limpeza'], ['clorexidina', 'Antissepsia de pele íntegra'], ['cefazolina', 'Profilaxia cirúrgica (dose pré-incisão)']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Orientar a alta: banho, sinais de infecção, retirada de pontos.', 'Controle glicêmico e nutrição favorecem a cicatrização.'] }
      ] },

    { id: 'hiperglicemia-hosp', nome: 'Hiperglicemia no paciente internado', icon: '🩸', grupo: 'metabolico',
      resumo: 'Metas de glicemia hospitalar, insulina basal-bolus em vez de escala isolada, monitorização e prevenção de hipoglicemia.',
      msd: [['Diabetes mellitus tipo 2', '/pt/profissional/distúrbios-endócrinos-e-metabólicos/diabetes-melito-e-hipoglicemia/diabetes-mellitus-tipo-2'], ['Hipoglicemia', '/pt/profissional/distúrbios-endócrinos-e-metabólicos/diabetes-melito-e-hipoglicemia/hipoglicemia']],
      secoes: [
        { t: 'Metas e monitorização', tipo: 'lista', itens: ['Meta habitual 140–180 mg/dL para a maioria dos internados (ADA).', 'Glicemia capilar antes das refeições e ao deitar se come; a cada 4–6 h em jejum ou dieta contínua.', 'Hipoglicemia: < 70 mg/dL; grave: < 54 mg/dL ou necessidade de ajuda.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Preferir esquema basal + prandial + correção; a escala de correção isolada não é recomendada como tratamento único.',
          'Jejum: manter insulina basal com dose ajustada conforme prescrição; suspender a prandial.', 'Hipoglicemia consciente: 15 g de carboidrato de absorção rápida e repetir glicemia em 15 min; inconsciente: glicose EV ou glucagon.',
          'Sempre registrar a causa da hipoglicemia e comunicar.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['insulina-glargina', 'Basal'], ['insulina-nph', 'Basal'], ['insulina-rapida', 'Prandial/correção'], ['insulina-regular', 'Prandial/correção ou EV'], ['glicose-50', 'Hipoglicemia grave'], ['glucagon', 'Hipoglicemia sem acesso venoso']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Dupla checagem de insulina; relacionar o horário com a chegada da refeição.', 'Rodízio de locais; nunca aspirar insulina de caneta com seringa.', 'Use a Agenda do plantão para os horários de glicemia.'] }
      ] },

    { id: 'hipotermia', nome: 'Hipotermia acidental', icon: '🥶', grupo: 'outros',
      resumo: 'Manuseio cuidadoso, retirar roupas molhadas, aquecimento conforme a gravidade e RCP adaptada na parada.',
      msd: [['Hipotermia', '/pt/profissional/lesões-intoxicação/lesões-por-frio/hipotermia']],
      secoes: [
        { t: 'Classificar', tipo: 'lista', itens: ['Leve: 32–35 °C (tremores, confusão leve).', 'Moderada: 28–32 °C (tremores cessam, rebaixamento).', 'Grave: < 28 °C (inconsciência, risco de arritmias e PCR).', 'Usar termômetro de baixa leitura/central quando possível.'] },
        { t: 'Conduta', tipo: 'passos', itens: ['Manusear delicadamente e manter horizontal (risco de fibrilação ventricular).',
          'Retirar roupas molhadas, secar, isolar do ambiente (cobertores, manta térmica).', 'Aquecimento ativo externo (mantas de ar quente) e fluidos EV aquecidos; O₂ aquecido e umidificado.',
          'Grave/PCR: RCP de alta qualidade e encaminhar para reaquecimento avançado; a morte só é confirmada após reaquecimento.'] },
        { t: 'Medicamentos', tipo: 'meds', itens: [['soro-fisiologico', 'Aquecido (38–42 °C)'], ['ringer-lactato', 'Alternativa aquecida'], ['glicose-50', 'Se hipoglicemia']] },
        { t: 'Enfermagem', tipo: 'lista', itens: ['Monitorização cardíaca contínua e temperatura seriada.', 'Atenção a lesões por frio associadas e queimaduras por aquecedores.'] }
      ] }
  ];

  // ---------- Referências (instituições brasileiras e internacionais) ----------
  // br: true = referência brasileira. Edições/anos indicados quando conhecidos; consultar sempre a versão vigente.
  var REFS = {
    // Brasil
    'ms-pnsp': { br: true, org: 'Ministério da Saúde / Anvisa / Fiocruz', t: 'Protocolos básicos de segurança do paciente — Programa Nacional de Segurança do Paciente (2013)' },
    'ms-hemo': { br: true, org: 'Ministério da Saúde', t: 'Guia para uso de hemocomponentes (2ª ed., 2015)' },
    'anvisa-hemovig': { br: true, org: 'Anvisa', t: 'Marco conceitual e operacional de hemovigilância: guia para a hemovigilância no Brasil (2015)' },
    'ms-gar': { br: true, org: 'Ministério da Saúde', t: 'Manual de Gestação de Alto Risco (2022)' },
    'ms-avc': { br: true, org: 'Ministério da Saúde', t: 'Manual de rotinas para atenção ao AVC (2013)' },
    'ms-queimados': { br: true, org: 'Ministério da Saúde', t: 'Cartilha para tratamento de emergência das queimaduras (2012)' },
    'ms-diarreia': { br: true, org: 'Ministério da Saúde', t: 'Manejo do paciente com diarreia — planos A, B e C (material vigente)' },
    'ms-dengue': { br: true, org: 'Ministério da Saúde', t: 'Dengue: diagnóstico e manejo clínico — adulto e criança (6ª ed., 2024)' },
    'ms-peconhentos': { br: true, org: 'Ministério da Saúde', t: 'Manual de diagnóstico e tratamento de acidentes por animais peçonhentos (2ª ed.) e Guia de Vigilância em Saúde (vigente)' },
    'ms-samu': { br: true, org: 'Ministério da Saúde — SAMU 192', t: 'Protocolos de Suporte Básico e de Suporte Avançado de Vida (versão vigente)' },
    'ciatox': { br: true, org: 'Anvisa / Rede Nacional de Centros de Informação e Assistência Toxicológica (CIATox)', t: 'Disque-Intoxicação 0800 722 6001 — orientação 24 h' },
    'ilas': { br: true, org: 'Instituto Latino-Americano de Sepse (ILAS)', t: 'Roteiro de implementação de protocolo assistencial gerenciado de sepse (versão vigente)' },
    'sbc-rcp': { br: true, org: 'Sociedade Brasileira de Cardiologia (SBC)', t: 'Atualização da Diretriz de Ressuscitação Cardiopulmonar e Cuidados Cardiovasculares de Emergência (2019)' },
    'sbc-has': { br: true, org: 'SBC / Sociedade Brasileira de Hipertensão / Sociedade Brasileira de Nefrologia', t: 'Diretrizes Brasileiras de Hipertensão Arterial (versão vigente)' },
    'sbc-ic': { br: true, org: 'Sociedade Brasileira de Cardiologia (SBC)', t: 'Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda (2018) e atualizações' },
    'sbc-sca': { br: true, org: 'Sociedade Brasileira de Cardiologia (SBC)', t: 'Diretrizes sobre angina instável e infarto agudo do miocárdio sem e com supradesnível do ST (versões vigentes)' },
    'sbpt-tep': { br: true, org: 'Sociedade Brasileira de Pneumologia e Tisiologia (SBPT)', t: 'Recomendações para o manejo da tromboembolia pulmonar (2010)' },
    'sbpt-asma': { br: true, org: 'Sociedade Brasileira de Pneumologia e Tisiologia (SBPT)', t: 'Recomendações para o manejo da asma (2020)' },
    'sbpt-dpoc': { br: true, org: 'Sociedade Brasileira de Pneumologia e Tisiologia (SBPT)', t: 'Recomendações para o tratamento da DPOC (versão vigente)' },
    'sbd': { br: true, org: 'Sociedade Brasileira de Diabetes (SBD)', t: 'Diretriz da Sociedade Brasileira de Diabetes (edição vigente)' },
    'sbp': { br: true, org: 'Sociedade Brasileira de Pediatria (SBP)', t: 'Documentos científicos e Tratado de Pediatria (edição vigente)' },
    'sbp-vsr': { br: true, org: 'Sociedade Brasileira de Pediatria (SBP)', t: 'Diretrizes para o manejo da infecção causada pelo vírus sincicial respiratório (2017)' },
    'sbp-prn': { br: true, org: 'Sociedade Brasileira de Pediatria (SBP) — Programa de Reanimação Neonatal', t: 'Reanimação do recém-nascido ≥ 34 semanas e < 34 semanas: diretrizes 2022' },
    'febrasgo-pe': { br: true, org: 'Federação Brasileira das Associações de Ginecologia e Obstetrícia (Febrasgo)', t: 'Pré-eclâmpsia nos seus diversos aspectos — Série Orientações e Recomendações (2017)' },
    'febrasgo': { br: true, org: 'Federação Brasileira das Associações de Ginecologia e Obstetrícia (Febrasgo)', t: 'Protocolos Febrasgo de Obstetrícia (edição vigente)' },
    'opas-hpp': { br: true, org: 'OPAS/OMS — Brasil', t: 'Recomendações assistenciais para prevenção, diagnóstico e tratamento da hemorragia obstétrica (2018)' },
    'ancp': { br: true, org: 'Academia Nacional de Cuidados Paliativos (ANCP)', t: 'Manual de Cuidados Paliativos (2ª ed., 2012)' },
    'sobest': { br: true, org: 'SOBEST / SOBENDE', t: 'Classificação das lesões por pressão — consenso NPUAP 2016 adaptado culturalmente para o Brasil' },
    'sobrasa': { br: true, org: 'Sociedade Brasileira de Salvamento Aquático (SOBRASA)', t: 'Diretrizes de atendimento ao afogamento — classificação de Szpilman' },
    'ms-ist': { br: true, org: 'Ministério da Saúde', t: 'Protocolo Clínico e Diretrizes Terapêuticas para Atenção Integral às Pessoas com IST (PCDT-IST, 2022)' },
    'anvisa-iras': { br: true, org: 'Anvisa', t: 'Medidas de prevenção de infecção relacionada à assistência à saúde (Série Segurança do Paciente, 2017)' },
    'sbc-fa': { br: true, org: 'Sociedade Brasileira de Cardiologia (SBC)', t: 'II Diretrizes Brasileiras de Fibrilação Atrial (2016)' },
    'sbpt-pac': { br: true, org: 'Sociedade Brasileira de Pneumologia e Tisiologia (SBPT)', t: 'Diretrizes brasileiras para pneumonia adquirida na comunidade em adultos imunocompetentes (2009) e recomendações atualizadas' },
    'abp-agitacao': { br: true, org: 'Associação Brasileira de Psiquiatria (ABP)', t: 'Diretrizes brasileiras para o manejo da agitação psicomotora (Baldaçara et al., Braz J Psychiatry, 2019)' },
    'cofen-427': { br: true, org: 'Conselho Federal de Enfermagem (COFEN)', t: 'Resolução COFEN nº 427/2012 — contenção mecânica de pacientes' },
    'sbcef': { br: true, org: 'Sociedade Brasileira de Cefaleia (SBCe)', t: 'Recomendações para o tratamento da crise migranosa (Arq Neuropsiquiatr, 2000) e atualizações' },
    'braspen': { br: true, org: 'Sociedade Brasileira de Nutrição Parenteral e Enteral (BRASPEN)', t: 'Diretrizes BRASPEN de terapia nutricional (edição vigente)' },
    // Internacionais
    'esc-fa': { org: 'European Society of Cardiology (ESC)', t: 'Guidelines for the management of atrial fibrillation (2024)' },
    'ats-pac': { org: 'American Thoracic Society / IDSA', t: 'Diagnosis and Treatment of Adults with Community-acquired Pneumonia (2019)' },
    'idsa-itu': { org: 'Infectious Diseases Society of America (IDSA)', t: 'International Clinical Practice Guidelines for Acute Uncomplicated Cystitis and Pyelonephritis in Women (2011)' },
    'ahs-cefaleia': { org: 'American Headache Society (AHS)', t: 'Parenteral pharmacotherapy for acute migraine in the emergency department (2016)' },
    'bts-o2': { org: 'British Thoracic Society (BTS)', t: 'Guideline for oxygen use in healthcare and emergency settings (2017)' },
    'aspen-ne': { org: 'American Society for Parenteral and Enteral Nutrition (ASPEN)', t: 'Safe Practices for Enteral Nutrition Therapy (2017)' },
    'shea-pav': { org: 'SHEA / IDSA / APIC', t: 'Strategies to prevent ventilator-associated pneumonia and events in acute-care hospitals (2022)' },
    'cdc-cvc': { org: 'Centers for Disease Control and Prevention (CDC)', t: 'Guidelines for the Prevention of Intravascular Catheter-Related Infections (2011, atualizado 2017)' },
    'cdc-cauti': { org: 'Centers for Disease Control and Prevention (CDC)', t: 'Guideline for Prevention of Catheter-Associated Urinary Tract Infections (2009, atualizado 2019)' },
    'ins': { org: 'Infusion Nurses Society (INS)', t: 'Infusion Therapy Standards of Practice (9ª ed., 2024)' },
    'globiad': { org: 'Beeckman et al. / Universidade de Ghent', t: 'Ghent Global IAD Categorisation Tool (GLOBIAD, 2017)' },
    'oms-isc': { org: 'Organização Mundial da Saúde (OMS)', t: 'Global guidelines for the prevention of surgical site infection (2ª ed., 2018)' },
    'wms-hipotermia': { org: 'Wilderness Medical Society', t: 'Clinical Practice Guidelines for the Out-of-Hospital Evaluation and Treatment of Accidental Hypothermia (2019)' },
    'aha': { org: 'American Heart Association (AHA)', t: 'Guidelines for CPR and Emergency Cardiovascular Care — ACLS/BLS (edição vigente)' },
    'aha-pals': { org: 'American Heart Association (AHA)', t: 'Pediatric Advanced Life Support — PALS (edição vigente)' },
    'ilcor': { org: 'International Liaison Committee on Resuscitation (ILCOR)', t: 'Consensus on Science with Treatment Recommendations — CoSTR (atualização anual)' },
    'erc': { org: 'European Resuscitation Council (ERC)', t: 'European Resuscitation Council Guidelines (edição vigente)' },
    'phtls': { org: 'NAEMT', t: 'PHTLS — Atendimento Pré-hospitalar ao Traumatizado (edição vigente)' },
    'atls': { org: 'American College of Surgeons', t: 'ATLS — Advanced Trauma Life Support (edição vigente)' },
    'btf': { org: 'Brain Trauma Foundation', t: 'Guidelines for the Management of Severe Traumatic Brain Injury (4ª ed., 2016)' },
    'trauma-sangramento': { org: 'Força-tarefa europeia (Rossaint et al.)', t: 'European guideline on management of major bleeding and coagulopathy following trauma (2023)' },
    'ssc': { org: 'Surviving Sepsis Campaign (SCCM/ESICM)', t: 'International Guidelines for Management of Sepsis and Septic Shock (2021)' },
    'wao': { org: 'World Allergy Organization (WAO)', t: 'Anaphylaxis Guidance (2020)' },
    'ada-crise': { org: 'American Diabetes Association (ADA) e sociedades parceiras', t: 'Hyperglycemic Crises in Adults With Diabetes: A Consensus Report (2024)' },
    'ada-soc': { org: 'American Diabetes Association (ADA)', t: 'Standards of Care in Diabetes (edição anual)' },
    'ukka-k': { org: 'UK Kidney Association', t: 'Clinical Practice Guideline: Treatment of Acute Hyperkalaemia in Adults (versão vigente)' },
    'eu-na': { org: 'ESE / ESICM / ERA-EDTA', t: 'Clinical practice guideline on diagnosis and treatment of hyponatraemia (2014)' },
    'esc-sca': { org: 'European Society of Cardiology (ESC)', t: 'Guidelines for the management of acute coronary syndromes (2023)' },
    'esc-ic': { org: 'European Society of Cardiology (ESC)', t: 'Guidelines for the diagnosis and treatment of acute and chronic heart failure (2021) e atualização 2023' },
    'esc-tep': { org: 'European Society of Cardiology (ESC)', t: 'Guidelines for the diagnosis and management of acute pulmonary embolism (2019)' },
    'aha-avc': { org: 'American Heart Association / American Stroke Association', t: 'Guidelines for the Early Management of Patients With Acute Ischemic Stroke (2019)' },
    'aes': { org: 'American Epilepsy Society', t: 'Evidence-based guideline: treatment of convulsive status epilepticus (2016)' },
    'gina': { org: 'Global Initiative for Asthma (GINA)', t: 'Global Strategy for Asthma Management and Prevention (relatório anual)' },
    'gold': { org: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD)', t: 'Global Strategy for Prevention, Diagnosis and Management of COPD (relatório anual)' },
    'asam': { org: 'American Society of Addiction Medicine (ASAM)', t: 'Clinical Practice Guideline on Alcohol Withdrawal Management (2020)' },
    'acg-hda': { org: 'American College of Gastroenterology (ACG)', t: 'Guideline: Upper Gastrointestinal and Ulcer Bleeding (2021)' },
    'baveno': { org: 'Baveno VII', t: 'Renewing consensus in portal hypertension (2022)' },
    'oms-dor': { org: 'Organização Mundial da Saúde (OMS)', t: 'Guidelines for the pharmacological and radiotherapeutic management of cancer pain in adults and adolescents (2018)' },
    'padis': { org: 'Society of Critical Care Medicine (SCCM)', t: 'Clinical Practice Guidelines for Pain, Agitation/Sedation, Delirium, Immobility and Sleep — PADIS (2018)' },
    'aap-bronq': { org: 'American Academy of Pediatrics (AAP)', t: 'Clinical Practice Guideline: The Diagnosis, Management, and Prevention of Bronchiolitis (2014)' },
    'aap-febril': { org: 'American Academy of Pediatrics (AAP)', t: 'Febrile Seizures: guideline for the neurodiagnostic evaluation (2011) e manejo a longo prazo (2008)' },
    'aap-lactente': { org: 'American Academy of Pediatrics (AAP)', t: 'Evaluation and Management of Well-Appearing Febrile Infants 8 to 60 Days Old (2021)' },
    'oms-diarreia': { org: 'Organização Mundial da Saúde (OMS)', t: 'The treatment of diarrhoea: a manual for physicians and other senior health workers (2005)' },
    'oms-hpp': { org: 'Organização Mundial da Saúde (OMS)', t: 'Recommendations for the prevention and treatment of postpartum haemorrhage (2012) e atualizações' },
    'acog-pe': { org: 'American College of Obstetricians and Gynecologists (ACOG)', t: 'Practice Bulletin 222: Gestational Hypertension and Preeclampsia (2020)' },
    'oms-prematuro': { org: 'Organização Mundial da Saúde (OMS)', t: 'Recommendations on interventions to improve preterm birth outcomes (2015) e atualização 2022' },
    'oms-paliativo': { org: 'Organização Mundial da Saúde (OMS)', t: 'Integrating palliative care and symptom relief into primary health care (2018)' },
    'npiap': { org: 'NPIAP / EPUAP / PPPIA', t: 'Prevention and Treatment of Pressure Ulcers/Injuries: Clinical Practice Guideline (2019)' },
    'iwgdf': { org: 'International Working Group on the Diabetic Foot (IWGDF)', t: 'Guidelines on the prevention and management of diabetes-related foot disease (2023)' },
    'svs-ulcera': { org: 'Society for Vascular Surgery / American Venous Forum', t: 'Management of venous leg ulcers: clinical practice guidelines (2014)' },
    'idsa-pele': { org: 'Infectious Diseases Society of America (IDSA)', t: 'Practice Guidelines for the Diagnosis and Management of Skin and Soft Tissue Infections (2014)' },
    'idsa-nf': { org: 'IDSA / ASCO', t: 'Antimicrobial agents in neutropenic patients with cancer (IDSA, 2010) e manejo ambulatorial da neutropenia febril (ASCO/IDSA, 2018)' },
    'ash-tev': { org: 'American Society of Hematology (ASH)', t: 'Guidelines for management of venous thromboembolism: prophylaxis for hospitalized and nonhospitalized medical patients (2018)' },
    'oms-seguranca': { org: 'Organização Mundial da Saúde (OMS)', t: 'Global Patient Safety Action Plan 2021–2030 e Cirurgia Segura Salva Vidas (lista de verificação)' },
    'opas-dengue': { org: 'OPAS/OMS', t: 'Dengue: guidelines for patient care in the Region of the Americas (2016)' },
    'oms-afogamento': { org: 'Organização Mundial da Saúde (OMS)', t: 'Global report on drowning (2014) e recomendações de prevenção' },
    'accp': { org: 'American College of Chest Physicians (CHEST)', t: 'Antithrombotic Therapy and Prevention of Thrombosis, 9ª ed. (2012) — prevenção de TEV' },
    'aabb': { org: 'AABB', t: 'Technical Manual (edição vigente) — reações transfusionais' }
  };

  // Fontes de cada protocolo (chaves de REFS). O Manual MSD aparece à parte, como leitura complementar.
  var FONTES = {
    'fa': ['sbc-fa', 'esc-fa', 'aha'], 'pneumonia': ['sbpt-pac', 'ats-pac'], 'itu': ['idsa-itu', 'ms-gar'], 'cefaleia': ['sbcef', 'ahs-cefaleia'],
    'agitacao': ['abp-agitacao', 'cofen-427'], 'irpa': ['bts-o2', 'sbpt-dpoc'], 'pcr-ped': ['sbc-rcp', 'aha-pals', 'ilcor'], 'sifilis-gestacao': ['ms-ist', 'ms-gar'],
    'extravasamento': ['ins', 'ms-pnsp'], 'hemotransfusao': ['ms-hemo', 'anvisa-hemovig', 'aabb'], 'nutricao-enteral': ['braspen', 'aspen-ne'], 'pav': ['anvisa-iras', 'shea-pav'],
    'ics-cvc': ['anvisa-iras', 'cdc-cvc', 'ins'], 'itu-cateter': ['anvisa-iras', 'cdc-cauti'], 'dai': ['sobest', 'globiad'], 'ferida-operatoria': ['anvisa-iras', 'oms-isc'],
    'hiperglicemia-hosp': ['sbd', 'ada-soc'], 'hipotermia': ['wms-hipotermia', 'erc', 'aha'],
    'sepse': ['ilas', 'ssc'], 'choque-hipo': ['phtls', 'atls', 'trauma-sangramento', 'ms-samu'], 'anafilaxia': ['wao', 'aha', 'ms-samu'],
    'cad': ['sbd', 'ada-crise'], 'hipoglicemia': ['sbd', 'ada-soc', 'ms-samu'], 'hiperk': ['ukka-k', 'aha'], 'hipok': ['ukka-k', 'sbc-rcp'], 'hipona': ['eu-na'],
    'emerg-has': ['sbc-has'], 'sca': ['sbc-sca', 'esc-sca', 'aha', 'ms-samu'], 'eap': ['sbc-ic', 'esc-ic'], 'avc': ['ms-avc', 'aha-avc', 'ms-samu'],
    'convulsao': ['aes', 'sbp', 'ms-samu'], 'asma': ['sbpt-asma', 'gina'], 'tep': ['sbpt-tep', 'esc-tep'], 'intox': ['ciatox', 'aha'],
    'alcool': ['asam'], 'hda': ['acg-hda', 'baveno'], 'queimados': ['ms-queimados', 'atls', 'phtls'], 'dor': ['oms-dor', 'ancp'], 'delirium': ['padis'],
    'desidratacao-ped': ['ms-diarreia', 'oms-diarreia', 'sbp'], 'bronquiolite': ['sbp-vsr', 'aap-bronq'], 'crupe': ['sbp', 'aha-pals'],
    'convulsao-febril': ['sbp', 'aap-febril', 'aes'], 'febre-ped': ['sbp', 'aap-lactente'],
    'pre-eclampsia': ['ms-gar', 'febrasgo-pe', 'acog-pe'], 'hpp': ['opas-hpp', 'ms-gar', 'oms-hpp'], 'tpp': ['ms-gar', 'febrasgo', 'oms-prematuro'], 'hiperemese': ['ms-gar', 'febrasgo'],
    'paliativo-sintomas': ['ancp', 'oms-paliativo', 'oms-dor'], 'paliativo-gi': ['ancp', 'oms-paliativo'], 'fim-de-vida': ['ancp', 'oms-paliativo'],
    'lesao-pressao': ['ms-pnsp', 'sobest', 'npiap'], 'ulcera-venosa': ['svs-ulcera'], 'pe-diabetico': ['sbd', 'iwgdf'], 'celulite': ['idsa-pele'],
    'reacao-transfusional': ['ms-hemo', 'anvisa-hemovig', 'aabb'],
    'pcr-adulto': ['sbc-rcp', 'aha', 'ilcor', 'erc', 'ms-samu'], 'bradicardia': ['sbc-rcp', 'aha', 'ms-samu'], 'taquicardia': ['sbc-rcp', 'aha', 'ms-samu'],
    'trauma-xabcde': ['phtls', 'atls', 'trauma-sangramento', 'ms-samu'], 'tce': ['btf', 'atls', 'phtls', 'ms-samu'], 'dengue': ['ms-dengue', 'opas-dengue'],
    'peconhentos': ['ms-peconhentos', 'ciatox'], 'afogamento': ['sobrasa', 'erc', 'oms-afogamento', 'ms-samu'], 'reanimacao-neonatal': ['sbp-prn', 'ilcor'],
    'dpoc': ['sbpt-dpoc', 'gold'], 'ehh': ['sbd', 'ada-crise'], 'seguranca-paciente': ['ms-pnsp', 'oms-seguranca'], 'quedas': ['ms-pnsp', 'oms-seguranca'],
    'tev-profilaxia': ['ash-tev', 'accp'], 'neutropenia-febril': ['idsa-nf']
  };

  function fontes(id) { return (FONTES[id] || []).map(function (k) { var r = REFS[k]; return r ? { id: k, br: !!r.br, org: r.org, t: r.t } : null; }).filter(Boolean).sort(function (a, b) { return (b.br ? 1 : 0) - (a.br ? 1 : 0); }); }

  function urlMsd(caminho) { return MSD + encodeURI(caminho); }
  function buscaMsd(termo) { return MSD + '/pt/profissional/searchresults?query=' + encodeURIComponent(termo); }

  var api = { GRUPOS: GRUPOS, PROTOCOLOS: PROTOCOLOS, REFS: REFS, FONTES: FONTES, fontes: fontes, urlMsd: urlMsd, buscaMsd: buscaMsd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Protocolos = api;
})(this);
