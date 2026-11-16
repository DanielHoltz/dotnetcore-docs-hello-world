/*
 * EnfCalc — protocolos clínicos resumidos para a enfermagem.
 * Texto próprio, elaborado a partir do Manual MSD (edição para profissionais, em português) e de diretrizes
 * consolidadas. Não reproduz o MSD: cada protocolo traz o link para o tópico original.
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
    { id: 'outros', nome: 'Trauma, sangramento e dor', icon: '🩹' }
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
      ] }
  ];

  function urlMsd(caminho) { return MSD + encodeURI(caminho); }
  function buscaMsd(termo) { return MSD + '/pt/profissional/searchresults?query=' + encodeURIComponent(termo); }

  var api = { GRUPOS: GRUPOS, PROTOCOLOS: PROTOCOLOS, urlMsd: urlMsd, buscaMsd: buscaMsd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Protocolos = api;
})(this);
