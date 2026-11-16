/*
 * EnfCalc — base de dados clínica.
 * ATENÇÃO: conteúdo de referência educacional. Sempre confira bula,
 * protocolo institucional e prescrição médica. Revisão periódica obrigatória.
 */
(function (root) {
  'use strict';

  // conc: apresentação usada na calculadora da ficha (qtd em vol mL)
  // infusao: id do preset de infusão contínua relacionado
  var DRUGS = [
    { id: 'aciclovir', nome: 'Aciclovir', classe: 'Antiviral',
      apresentacao: 'Frasco-ampola 250 mg (pó liofilizado)',
      reconstituicao: '250 mg em 10 mL de água destilada (25 mg/mL).',
      diluicao: 'SF 0,9% ou SG 5%, 100 mL (concentração final ≤ 7 mg/mL).',
      administracao: 'EV em no mínimo 60 min. Não administrar em bolus nem IM.',
      estabilidade: '12 h em temperatura ambiente após diluição. Não refrigerar (precipita).',
      obs: 'Manter hidratação adequada (risco de nefrotoxicidade/cristalúria). Irritante: risco de flebite.',
      conc: { qtd: 250, u: 'mg', vol: 10 } },

    { id: 'adenosina', nome: 'Adenosina', classe: 'Antiarrítmico',
      apresentacao: 'Ampola 6 mg/2 mL (3 mg/mL)',
      reconstituicao: 'Não necessita.',
      diluicao: 'Não diluir.',
      administracao: 'EV em bolus RÁPIDO (1–2 s) em acesso calibroso e proximal, seguido imediatamente de flush de 20 mL de SF com elevação do membro. Dose usual adulto: 6 mg, se necessário 12 mg.',
      estabilidade: 'Não refrigerar (cristaliza).',
      obs: 'Paciente monitorizado. Pode causar assistolia transitória, rubor, dispneia e dor torácica.',
      conc: { qtd: 6, u: 'mg', vol: 2 } },

    { id: 'amicacina', nome: 'Amicacina', classe: 'Antibiótico (aminoglicosídeo)',
      apresentacao: 'Ampola 500 mg/2 mL (250 mg/mL); também 100 mg/2 mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SF 0,9% ou SG 5%, 100–200 mL.',
      administracao: 'EV em 30–60 min. Também IM.',
      estabilidade: '24 h em temperatura ambiente após diluição.',
      obs: 'Concentração usual ≤ 5 mg/mL. Nefro e ototóxica: monitorar função renal e diurese. Dose máx. 15 mg/kg/dia (adulto). Não misturar com betalactâmicos no mesmo frasco.',
      conc: { qtd: 500, u: 'mg', vol: 2 } },

    { id: 'amiodarona', nome: 'Amiodarona', classe: 'Antiarrítmico',
      apresentacao: 'Ampola 150 mg/3 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SOMENTE SG 5%. Ataque: 150 mg em 100 mL. Manutenção: 900 mg (6 amp) em 500 mL (1,8 mg/mL).',
      administracao: 'Ataque em 10–30 min. Manutenção: 1 mg/min por 6 h, depois 0,5 mg/min por 18 h. PCR (FV/TVSP): 300 mg EV em bolus, 2ª dose 150 mg.',
      estabilidade: '24 h após diluição em SG 5%. Infusões > 2 h: SG 5% e equipo/frasco SEM PVC (liberação de DEHP).',
      obs: 'Periférico por > 1 h: não exceder 2 mg/mL (flebite); preferir acesso central. Monitorar FC, PA e QT.',
      conc: { qtd: 150, u: 'mg', vol: 3 }, infusao: 'amiodarona' },

    { id: 'ampicilina', nome: 'Ampicilina', classe: 'Antibiótico (penicilina)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: '1 g em 5–10 mL de água destilada.',
      diluicao: 'SF 0,9%, 50–100 mL; concentração 2–30 mg/mL (menos estável em SG 5%).',
      administracao: 'EV direto lento (3–5 min) ou infusão em 15–30 min.',
      estabilidade: 'Administrar logo após o preparo; em SF até 8 h em temperatura ambiente.',
      obs: 'Perguntar sobre alergia a penicilinas.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'ampi-sulbactam', nome: 'Ampicilina + Sulbactam', classe: 'Antibiótico (penicilina + inibidor)',
      apresentacao: 'Frasco-ampola 3 g (2 g + 1 g) e 1,5 g',
      reconstituicao: '3 g em 6,4 mL de água destilada (volume final ≈ 8 mL; 375 mg/mL).',
      diluicao: 'SF 0,9%, 50–100 mL.',
      administracao: 'EV em 15–30 min (ou EV direto lento ≥ 3 min).',
      estabilidade: 'Em SF: 8 h em temperatura ambiente.',
      obs: 'Perguntar sobre alergia a penicilinas.',
      conc: { qtd: 3000, u: 'mg', vol: 8 } },

    { id: 'bicarbonato', nome: 'Bicarbonato de sódio 8,4%', classe: 'Alcalinizante / eletrólito',
      apresentacao: 'Ampola 10 mL e frasco 250 mL — 1 mEq/mL',
      reconstituicao: 'Não necessita.',
      diluicao: 'Pode ser usado puro ou diluído em SG 5%/AD conforme prescrição.',
      administracao: 'EV lento ou em infusão conforme prescrição.',
      estabilidade: 'Usar imediatamente.',
      obs: 'Vesicante (8,4% ≈ 2000 mOsm/L). Incompatível com cálcio (precipita) e inativa catecolaminas (dobutamina, dopamina, noradrenalina) — lavar o acesso antes e depois.',
      conc: { qtd: 1, u: 'mEq', vol: 1 } },

    { id: 'cefalotina', nome: 'Cefalotina', classe: 'Antibiótico (cefalosporina 1ª geração)',
      apresentacao: 'Frasco-ampola 1 g (pó)',
      reconstituicao: '1 g em 10 mL de água destilada.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV direto lento (3–5 min) ou infusão em 30 min.',
      estabilidade: '12 h em temperatura ambiente; 96 h refrigerado. IM: 5 mL de AD.',
      obs: 'Risco de flebite.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'cefazolina', nome: 'Cefazolina', classe: 'Antibiótico (cefalosporina 1ª geração)',
      apresentacao: 'Frasco-ampola 1 g (pó)',
      reconstituicao: '1 g em 10 mL de água destilada.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV direto lento (3–5 min) ou infusão em 30 min. Profilaxia cirúrgica: até 60 min antes da incisão.',
      estabilidade: 'Reconstituída: 24 h em temperatura ambiente / 96 h refrigerada. Diluída em 100 mL: 12 h em temperatura ambiente / 24 h refrigerada. Proteger da luz.',
      obs: '',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'cefepima', nome: 'Cefepima', classe: 'Antibiótico (cefalosporina 4ª geração)',
      apresentacao: 'Frasco-ampola 1 g e 2 g (pó)',
      reconstituicao: '1 g em 10 mL de água destilada.',
      diluicao: 'SF 0,9%, SG 5% ou Ringer lactato, 50–100 mL (concentração máx. 40 mg/mL).',
      administracao: 'EV em 30 min, ou EV direto em 3–5 min.',
      estabilidade: 'Reconstituído: 24 h em temperatura ambiente / 7 dias refrigerado. Diluído: 12 h em temperatura ambiente / 5 dias refrigerado.',
      obs: 'Ajustar dose na insuficiência renal (neurotoxicidade).',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'ceftriaxona', nome: 'Ceftriaxona', classe: 'Antibiótico (cefalosporina 3ª geração)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: 'EV: 1 g em 10 mL de água destilada. IM: 1 g em 3,5 mL de lidocaína 1% (apresentação IM).',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 30 min ou EV direto lento (2–4 min).',
      estabilidade: '6 h em temperatura ambiente; 24 h refrigerado.',
      obs: 'INCOMPATÍVEL com soluções que contenham cálcio (Ringer lactato/Hartmann, gluconato de cálcio, nutrição parenteral) — risco de precipitação. Não diluir no mesmo frasco com outros antimicrobianos (vancomicina, aminoglicosídeos, fluconazol). Solução com lidocaína NUNCA por via EV.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'ciprofloxacino', nome: 'Ciprofloxacino', classe: 'Antibiótico (quinolona)',
      apresentacao: 'Bolsa 200 mg/100 mL e 400 mg/200 mL (2 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'EV em no mínimo 60 min (infusão lenta reduz flebite). Não adicionar outros medicamentos à bolsa.',
      estabilidade: 'Proteger da luz. Não refrigerar.',
      obs: 'Pode prolongar QT.',
      conc: { qtd: 200, u: 'mg', vol: 100 } },

    { id: 'clindamicina', nome: 'Clindamicina', classe: 'Antibiótico (lincosamida)',
      apresentacao: 'Ampola 600 mg/4 mL (150 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL (≤ 18 mg/mL).',
      administracao: 'EV em 20–60 min (máx. 30 mg/min). NUNCA em bolus (risco de parada cardíaca).',
      estabilidade: '24 h em temperatura ambiente.',
      obs: '',
      conc: { qtd: 600, u: 'mg', vol: 4 } },

    { id: 'cloreto-potassio', nome: 'Cloreto de potássio 19,1%', classe: 'Eletrólito — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 10 mL — 2,5 mEq/mL',
      reconstituicao: 'Não necessita.',
      diluicao: 'SEMPRE diluído em SF 0,9% ou SG 5%. Acesso periférico: até 10 mEq em 100 mL (HSL/São Camilo); concentrações maiores somente em CVC/PICC.',
      administracao: 'Infusão em bomba. Periférico: máx. 10 mEq/h. Central com monitorização cardíaca: até 20–40 mEq/h conforme protocolo (bula: até 20 mEq/h).',
      estabilidade: 'Homogeneizar bem após adicionar ao soro.',
      obs: 'NUNCA administrar EV direto nem usar como diluente (risco de parada cardíaca). Vesicante. Dupla checagem. Armazenamento segregado.',
      conc: { qtd: 25, u: 'mEq', vol: 10 } },

    { id: 'dexametasona', nome: 'Dexametasona', classe: 'Corticosteroide',
      apresentacao: 'Ampola 4 mg/mL (2,5 mL = 10 mg)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser diluída em SF 0,9% ou SG 5%.',
      administracao: 'EV direto lento (1–5 min) ou infusão. Também IM.',
      estabilidade: '24 h após diluição.',
      obs: 'Monitorar glicemia.',
      conc: { qtd: 4, u: 'mg', vol: 1 } },

    { id: 'diazepam', nome: 'Diazepam', classe: 'Benzodiazepínico',
      apresentacao: 'Ampola 10 mg/2 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Preferir NÃO diluir (precipita). Não misturar com outras drogas.',
      administracao: 'EV direto lento: 0,5–1 mL/min (2,5–5 mg/min) em veia calibrosa; se necessário, pelo injetor do equipo o mais próximo possível da veia.',
      estabilidade: 'Proteger da luz.',
      obs: 'Risco de depressão respiratória. IM tem absorção errática.',
      conc: { qtd: 10, u: 'mg', vol: 2 } },

    { id: 'dipirona', nome: 'Dipirona', classe: 'Analgésico / antitérmico',
      apresentacao: 'Ampola 1 g/2 mL (500 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'AD ou SF 0,9% 10–20 mL (EV lento) ou SF 0,9%/SG 5%/Ringer lactato 100 mL.',
      administracao: 'EV lento: não exceder 1 mL/min (500 mg/min). Infusão em 100 mL: 15–30 min.',
      estabilidade: 'Usar logo após o preparo.',
      obs: 'Não misturar com outros injetáveis. Paciente deitado durante a aplicação. Evitar via parenteral em hipotensão/instabilidade hemodinâmica; doses únicas > 1 g exigem avaliação. Risco de agranulocitose. Verificar alergia.',
      conc: { qtd: 500, u: 'mg', vol: 1 } },

    { id: 'fenitoina', nome: 'Fenitoína', classe: 'Anticonvulsivante',
      apresentacao: 'Ampola 250 mg/5 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SOMENTE SF 0,9% (precipita em SG). Concentração final 1–10 mg/mL.',
      administracao: 'Máx. 50 mg/min em adultos (25–50 mg/min em situações de risco; 1–3 mg/kg/min em neonatos/crianças). Usar filtro de linha 0,22 µm quando disponível. Lavar o acesso com SF antes e depois.',
      estabilidade: 'Administrar em até 1 h após diluição.',
      obs: 'Vesicante (síndrome da luva púrpura). Monitorar FC/PA/ECG durante a infusão.',
      conc: { qtd: 250, u: 'mg', vol: 5 } },

    { id: 'furosemida', nome: 'Furosemida', classe: 'Diurético de alça',
      apresentacao: 'Ampola 20 mg/2 mL (10 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser usada sem diluir ou diluída em SF 0,9%.',
      administracao: 'EV direto lento (1–2 min). Máx. 4 mg/min (insuficiência renal grave: 2,5 mg/min). Diluição opcional em SF/SG 5%/Ringer a 1–2 mg/mL.',
      estabilidade: 'Proteger da luz.',
      obs: 'Ototoxicidade em infusão rápida. Monitorar diurese, PA e potássio.',
      conc: { qtd: 20, u: 'mg', vol: 2 } },

    { id: 'gentamicina', nome: 'Gentamicina', classe: 'Antibiótico (aminoglicosídeo)',
      apresentacao: 'Ampola 80 mg/2 mL (40 mg/mL); também 20, 40, 160, 280 mg',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SF 0,9% ou SG 5%, 50–200 mL (usual: 100 mL).',
      administracao: 'EV em 30–60 min (alguns protocolos: até 120 min). Também IM.',
      estabilidade: '24 h em temperatura ambiente.',
      obs: 'Nefro e ototóxica. Não misturar com betalactâmicos.',
      conc: { qtd: 80, u: 'mg', vol: 2 } },

    { id: 'gluconato-calcio', nome: 'Gluconato de cálcio 10%', classe: 'Eletrólito',
      apresentacao: 'Ampola 10 mL (100 mg/mL; 0,46 mEq/mL)',
      reconstituicao: 'Não necessita.',
      diluicao: 'SF 0,9% ou SG 5% (ex.: 10–20 mL em 100 mL).',
      administracao: 'EV lento (máx. 200 mg/min; ≥ 5–10 min no bolus) ou infusão; monitorização cardíaca. Nunca IM/SC (vesicante).',
      estabilidade: '24 h após diluição.',
      obs: 'Incompatível com bicarbonato, fosfatos e ceftriaxona. Irritante: risco de necrose em extravasamento.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'heparina', nome: 'Heparina sódica', classe: 'Anticoagulante — ALTA VIGILÂNCIA',
      apresentacao: 'Frasco 5.000 UI/mL (5 mL = 25.000 UI); ampola SC 5.000 UI/0,25 mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Infusão contínua usual: 25.000 UI (5 mL) + 245 mL SF 0,9% = 250 mL (100 UI/mL).',
      administracao: 'SC (profilaxia) ou EV contínua em bomba (equipo sem PVC) conforme nomograma (TTPa).',
      estabilidade: '24 h após diluição.',
      obs: 'Dupla checagem. Atenção às diferentes concentrações. Monitorar sangramentos e plaquetas. Antídoto: protamina.',
      conc: { qtd: 5000, u: 'UI', vol: 1 }, infusao: 'heparina' },

    { id: 'hidrocortisona', nome: 'Hidrocortisona', classe: 'Corticosteroide',
      apresentacao: 'Frasco-ampola 100 mg e 500 mg (pó)',
      reconstituicao: '100 mg em 2 mL do diluente (ou AD); 500 mg em 4 mL.',
      diluicao: 'Opcional: SF 0,9% ou SG 5%, 100 mL.',
      administracao: 'EV direto lento (30 s a 1 min para 100 mg) ou infusão em 20–30 min.',
      estabilidade: 'Usar logo após o preparo.',
      obs: 'Monitorar glicemia.',
      conc: { qtd: 100, u: 'mg', vol: 2 } },

    { id: 'insulina-regular', nome: 'Insulina regular', classe: 'Hipoglicemiante — ALTA VIGILÂNCIA',
      apresentacao: 'Frasco 100 UI/mL (10 mL)',
      reconstituicao: 'Não necessita.',
      diluicao: 'Infusão contínua usual: 100 UI (1 mL) + 99 mL SF 0,9% = 100 mL (1 UI/mL).',
      administracao: 'SC com seringa de insulina (U-100) ou EV contínua em bomba (somente insulina regular é EV).',
      estabilidade: 'Solução 1 UI/mL: até 24 h. Saturar o equipo (desprezar 20–50 mL) por adsorção ao plástico; preferir sistema sem PVC.',
      obs: 'Dupla checagem. Monitorar glicemia capilar de 1/1 h na infusão contínua e potássio.',
      conc: { qtd: 100, u: 'UI', vol: 1 }, infusao: 'insulina' },

    { id: 'meropenem', nome: 'Meropenem', classe: 'Antibiótico (carbapenêmico)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: '1 g em 20 mL de água destilada (50 mg/mL).',
      diluicao: 'SF 0,9% (mais estável) ou SG 5%, 50–100 mL.',
      administracao: 'EV direto (3–5 min) ou infusão em 15–30 min. Infusão estendida em 3 h, se prescrita.',
      estabilidade: 'Reconstituído (50 mg/mL) ou em SF: 3 h em temperatura ambiente / 15–16 h refrigerado. Em SG 5%: usar imediatamente. Alguns fabricantes orientam uso imediato.',
      obs: 'Diminui níveis de ácido valproico.',
      conc: { qtd: 1000, u: 'mg', vol: 20 } },

    { id: 'metoclopramida', nome: 'Metoclopramida', classe: 'Antiemético / procinético',
      apresentacao: 'Ampola 10 mg/2 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Até 10 mg: pode ser feita sem diluir. Doses maiores: diluir em 50 mL de SF 0,9%.',
      administracao: 'EV direto lento em no mínimo 3 min; doses maiores em infusão de 15–30 min. Também IM.',
      estabilidade: '24 h após diluição. Proteger da luz.',
      obs: 'Risco de reações extrapiramidais.',
      conc: { qtd: 10, u: 'mg', vol: 2 } },

    { id: 'metronidazol', nome: 'Metronidazol', classe: 'Antimicrobiano',
      apresentacao: 'Bolsa 500 mg/100 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'EV em no mínimo 20 min; padrão HSL: 60 min (risco de flebite).',
      estabilidade: 'Não refrigerar. Proteger da luz.',
      obs: 'Orientar não ingerir álcool.',
      conc: { qtd: 500, u: 'mg', vol: 100 } },

    { id: 'midazolam', nome: 'Midazolam', classe: 'Benzodiazepínico — ALTA VIGILÂNCIA',
      apresentacao: 'Ampolas 5 mg/mL (3 mL = 15 mg; 10 mL = 50 mg) e 1 mg/mL (5 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Infusão contínua usual: 150 mg (30 mL de 5 mg/mL) + 120 mL SF 0,9% = 150 mL (1 mg/mL).',
      administracao: 'EV direto lento ou infusão contínua em bomba. Também IM.',
      estabilidade: '24 h após diluição.',
      obs: 'Risco de depressão respiratória. Atenção às diferentes concentrações. Antídoto: flumazenil.',
      conc: { qtd: 5, u: 'mg', vol: 1 }, infusao: 'midazolam' },

    { id: 'morfina', nome: 'Morfina', classe: 'Opioide — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 10 mg/mL (1 mL); também 2 mg/2 mL e 1 mg/mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Diluir com AD ou SF 0,9% para 1–2 mg/mL (ex.: 1 mL de 10 mg/mL + 9 mL = 1 mg/mL).',
      administracao: 'EV lento (ex.: 15 mg em ≥ 3 min; doses usuais em 4–5 min). Também SC/IM.',
      estabilidade: '24 h após diluição.',
      obs: 'Avaliar FR, sedação e dor. Antídoto: naloxona.',
      conc: { qtd: 10, u: 'mg', vol: 1 } },

    { id: 'nitroglicerina', nome: 'Nitroglicerina', classe: 'Vasodilatador',
      apresentacao: 'Ampola 50 mg/10 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: '50 mg em SG 5% ou SF 0,9% até 250 mL (200 mcg/mL). Frasco de vidro e equipo sem PVC.',
      administracao: 'Infusão contínua em bomba, titulada em mcg/min.',
      estabilidade: '24–48 h.',
      obs: 'Monitorar PA. Contraindicada com inibidores da fosfodiesterase-5.',
      conc: { qtd: 50, u: 'mg', vol: 10 }, infusao: 'nitroglicerina' },

    { id: 'nitroprussiato', nome: 'Nitroprussiato de sódio', classe: 'Vasodilatador — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 50 mg/2 mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Dissolver o frasco em 2 mL de SG 5% e diluir em 250 mL de SG 5% (200 mcg/mL).',
      administracao: 'Infusão contínua em bomba; PA invasiva recomendada. Envolver frasco E equipo no envelope fotoprotetor.',
      estabilidade: 'FOTOSSENSÍVEL. Reconstituído: 4 h; solução para infusão: até 24 h protegida da luz (alguns fabricantes: uso imediato).',
      obs: 'Desprezar se a solução ficar azul, verde ou vermelho-escura. Risco de intoxicação por cianeto/tiocianato.',
      conc: { qtd: 50, u: 'mg', vol: 2 }, infusao: 'nitroprussiato' },

    { id: 'noradrenalina', nome: 'Noradrenalina', classe: 'Vasopressor — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 4 mg/4 mL (confira se a apresentação é expressa em base ou em sal)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SG 5% (preferencial) ou SF 0,9%. Ex.: 16 mg (4 amp) + 234 mL = 250 mL (64 mcg/mL).',
      administracao: 'Infusão contínua em bomba, preferencialmente em acesso central.',
      estabilidade: '24 h. Proteger da luz.',
      obs: 'Vesicante: em extravasamento, interromper e seguir protocolo (fentolamina). Monitorar PA (ideal invasiva).',
      conc: { qtd: 4, u: 'mg', vol: 4 }, infusao: 'noradrenalina' },

    { id: 'omeprazol', nome: 'Omeprazol', classe: 'Inibidor da bomba de prótons',
      apresentacao: 'Frasco-ampola 40 mg + diluente 10 mL',
      reconstituicao: '40 mg com 10 mL do diluente próprio (4 mg/mL).',
      diluicao: 'Opcional: SF 0,9% ou SG 5%, 100 mL.',
      administracao: 'EV lento em no mínimo 2,5 min (máx. 4 mL/min) ou infusão em 20–30 min.',
      estabilidade: 'Reconstituído: usar em até 4 h. Diluído em SF: infusão pode durar até 12 h; em SG 5%: 6 h.',
      obs: '',
      conc: { qtd: 40, u: 'mg', vol: 10 } },

    { id: 'ondansetrona', nome: 'Ondansetrona', classe: 'Antiemético',
      apresentacao: 'Ampola 8 mg/4 mL (2 mg/mL) e 4 mg/2 mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Até 8 mg: pode ser feita sem diluir. Acima de 8 mg: diluir em 50–100 mL de SF 0,9% ou SG 5%.',
      administracao: 'Até 8 mg: EV direto lento em 2–5 min. Acima de 8 mg: infusão em ~15 min. Também IM.',
      estabilidade: '48 h em temperatura ambiente (< 25 °C) após diluição.',
      obs: 'Pode prolongar QT.',
      conc: { qtd: 8, u: 'mg', vol: 4 } },

    { id: 'oxacilina', nome: 'Oxacilina', classe: 'Antibiótico (penicilina)',
      apresentacao: 'Frasco-ampola 500 mg (pó)',
      reconstituicao: '500 mg em 5 mL de AD (100 mg/mL) ou 10 mL (50 mg/mL), conforme protocolo — ajuste a apresentação na maleta.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 15–30 min (ou EV direto lento em 10 min).',
      estabilidade: 'Reconstituída: até 72 h em temperatura ambiente; diluída em SF: até 24 h (HUGG). Confira o fabricante.',
      obs: 'Risco de flebite. Perguntar sobre alergia a penicilinas.',
      conc: { qtd: 500, u: 'mg', vol: 5 } },

    { id: 'ocitocina', nome: 'Ocitocina', classe: 'Uterotônico — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 5 UI/mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Indução/condução: 5 UI em 500 mL de SG 5% ou SF 0,9% (10 mUI/mL).',
      administracao: 'Infusão em bomba: início usual 2 mUI/min (= 12 mL/h na solução 10 mUI/mL), aumentos a cada 15–30 min conforme protocolo; máx. em geral 32 mUI/min. Pós-parto conforme prescrição.',
      estabilidade: '24 h após diluição. Refrigerar a ampola (2–8 °C).',
      obs: 'Monitorar dinâmica uterina e BCF (risco de taquissistolia).',
      conc: { qtd: 5, u: 'UI', vol: 1 }, infusao: 'ocitocina' },

    { id: 'penicilina-cristalina', nome: 'Penicilina G cristalina', classe: 'Antibiótico (penicilina)',
      apresentacao: 'Frasco-ampola 5.000.000 UI (pó)',
      reconstituicao: 'Depende do fabricante: ex. 8 mL de AD → volume final ~10 mL (500.000 UI/mL); Aricilina: 2 mL de AD por milhão de UI (10 mL → ~12 mL). Ajuste na calculadora/maleta.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 30–60 min.',
      estabilidade: 'Reconstituído/diluído: 24 h em temperatura ambiente ou refrigerado (HSL — Aricilina); confira o fabricante.',
      obs: 'Use a calculadora "Penicilina cristalina" para o volume a aspirar. Perguntar sobre alergia.',
      conc: { qtd: 5000000, u: 'UI', vol: 10 } },

    { id: 'pipe-tazo', nome: 'Piperacilina + Tazobactam', classe: 'Antibiótico (penicilina + inibidor)',
      apresentacao: 'Frasco-ampola 4,5 g (4 g + 0,5 g) e 2,25 g',
      reconstituicao: '4,5 g em 20 mL de AD, SF 0,9% ou SG 5% → volume final ≈ 23 mL (≈ 196 mg/mL).',
      diluicao: 'SF 0,9% ou SG 5%, 50–150 mL.',
      administracao: 'EV em 30 min; infusão estendida em 4 h, se prescrita.',
      estabilidade: '24 h em temperatura ambiente; 48 h refrigerado.',
      obs: 'Ringer lactato: compatível apenas na formulação com EDTA (ex.: Tazocin); nas demais, não usar. Não misturar com aminoglicosídeos (inativação) nem diluir só em bicarbonato.',
      conc: { qtd: 4500, u: 'mg', vol: 23 } },

    { id: 'sulfato-magnesio', nome: 'Sulfato de magnésio 50%', classe: 'Eletrólito / anticonvulsivante — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 10 mL (500 mg/mL; 4 mEq/mL). Também 10% (100 mg/mL)',
      reconstituicao: 'Não necessita.',
      diluicao: 'Sempre diluir. Ex.: pré-eclâmpsia (Zuspan) ataque 4 g = 8 mL de 50% + 12 mL AD, EV em 15–20 min; manutenção 1 g/h (ex.: 10 mL a 50% + 490 mL SG 5% = 1 g/100 mL a 100 mL/h).',
      administracao: 'Infusão em bomba conforme protocolo. Manutenção: 1 g/h (até 2 g/h conforme protocolo do MS/serviço). A concentração final varia entre serviços.',
      estabilidade: '24 h após diluição.',
      obs: 'Monitorar reflexo patelar, FR (≥ 16 irpm) e diurese (≥ 25 mL/h). Antídoto: gluconato de cálcio 10%.',
      conc: { qtd: 5000, u: 'mg', vol: 10 } },

    { id: 'tramadol', nome: 'Tramadol', classe: 'Opioide',
      apresentacao: 'Ampola 100 mg/2 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SF 0,9% ou SG 5%, 100 mL.',
      administracao: 'Infusão em 20–30 min (ou EV direto lento em 2–3 min).',
      estabilidade: '24 h após diluição.',
      obs: 'Incompatível na mistura com diclofenaco, indometacina, diazepam, midazolam e nitroglicerina (bula). Náusea e vômitos frequentes. Reduz limiar convulsivo.',
      conc: { qtd: 100, u: 'mg', vol: 2 } },

    { id: 'vancomicina', nome: 'Vancomicina', classe: 'Antibiótico (glicopeptídeo)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: '500 mg em 10 mL de AD (50 mg/mL); 1 g em 20 mL.',
      diluicao: 'SF 0,9% ou SG 5% com concentração final ≤ 5 mg/mL (500 mg em ≥ 100 mL; 1 g em ≥ 200 mL). Restrição hídrica: até 10 mg/mL, conforme bula.',
      administracao: 'EV em no mínimo 60 min (máx. 10 mg/min).',
      estabilidade: 'Diluída: 24 h em temperatura ambiente; refrigerada 96 h a 14 dias conforme fabricante.',
      obs: 'Infusão rápida causa "síndrome do homem vermelho". Nefrotóxica: vancocinemia conforme protocolo. Vesicante.',
      conc: { qtd: 500, u: 'mg', vol: 10 } }
,

    { id: 'adrenalina', nome: 'Adrenalina (epinefrina)', classe: 'Vasopressor — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 1 mg/mL (1 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'PCR: sem diluição. Infusão contínua: ex.: 4 mg em 250 mL de SG 5% (16 mcg/mL).',
      administracao: 'PCR: 1 mg EV/IO a cada 3–5 min, seguido de flush de 20 mL de SF e elevação do membro. Anafilaxia: 0,5 mg IM (0,01 mg/kg; máx. 0,5 mg) no vasto lateral da coxa.',
      estabilidade: 'Proteger da luz. Infusão: 24 h.',
      obs: 'Não confundir mg com mL em diluições pediátricas. Vesicante em infusão periférica.',
      conc: { qtd: 1, u: 'mg', vol: 1 }, infusao: 'adrenalina' },

    { id: 'atropina', nome: 'Atropina', classe: 'Anticolinérgico',
      apresentacao: 'Ampola 0,25 mg/mL (1 mL); também 0,5 mg/mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Não necessita.',
      administracao: 'Bradicardia sintomática (adulto, AHA 2020): 1 mg EV em bolus a cada 3–5 min, máx. 3 mg (protocolos antigos: 0,5 mg). Confira a concentração da ampola disponível.',
      estabilidade: 'Temperatura ambiente.',
      obs: 'Paciente monitorizado. Doses < 0,5 mg podem causar bradicardia paradoxal. Antídoto em intoxicação por organofosforados (doses maiores).',
      conc: { qtd: 0.25, u: 'mg', vol: 1 } },

    { id: 'ertapenem', nome: 'Ertapenem', classe: 'Antibiótico (carbapenêmico)',
      apresentacao: 'Frasco-ampola 1 g (pó)',
      reconstituicao: 'EV: 1 g em 10 mL de AD ou SF 0,9%. IM: 1 g em 3,2 mL de lidocaína 1% sem vasoconstritor.',
      diluicao: 'SOMENTE SF 0,9%, 50 mL. NÃO diluir em soluções com glicose.',
      administracao: 'EV em 30 min, 1 vez ao dia (muito usado em atendimento domiciliar). IM profunda, se prescrito.',
      estabilidade: 'Diluído: 6 h em temperatura ambiente; 24 h refrigerado (usar em até 4 h após retirar da geladeira).',
      obs: 'Concentração máx. 20 mg/mL. Solução IM (com lidocaína): usar em até 1 h e NUNCA por via EV. Ajustar dose se ClCr ≤ 30 mL/min.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'fentanil', nome: 'Fentanil', classe: 'Opioide — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 50 mcg/mL (2 mL, 5 mL e 10 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Bolus: pode ser diluído em SF 0,9%. Infusão contínua: ex.: 20 mL (1.000 mcg) + 80 mL SF 0,9% = 100 mL (10 mcg/mL).',
      administracao: 'EV lento (1–2 min) ou infusão contínua em bomba.',
      estabilidade: 'Diluído em SF 0,9%: 24 h; em SG 5%: 6 h (temperatura ambiente). Proteger da luz.',
      obs: 'Pode ser infundido puro (50 mcg/mL) em bomba. Bolus rápido pode causar rigidez torácica. Monitorar FR e sedação. Antídoto: naloxona.',
      conc: { qtd: 50, u: 'mcg', vol: 1 }, infusao: 'fentanil' },

    { id: 'flumazenil', nome: 'Flumazenil', classe: 'Antídoto de benzodiazepínicos',
      apresentacao: 'Ampola 0,5 mg/5 mL (0,1 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser usado puro ou diluído em SF 0,9% / SG 5%.',
      administracao: 'EV: 0,2 mg em 15 s; se necessário, 0,1 mg a cada 60 s até máx. 1 mg.',
      estabilidade: 'Diluído: 24 h.',
      obs: 'Meia-vida curta: risco de ressedação. Pode desencadear convulsões em usuários crônicos de benzodiazepínicos.',
      conc: { qtd: 0.5, u: 'mg', vol: 5 } },

    { id: 'glicose-50', nome: 'Glicose 50%', classe: 'Hipertônico / correção de hipoglicemia',
      apresentacao: 'Ampola 10 mL (500 mg/mL = 5 g por ampola)',
      reconstituicao: 'Não necessita.',
      diluicao: 'Hipoglicemia: em geral sem diluição, em veia calibrosa. Também usada na transformação de soro.',
      administracao: 'Hipoglicemia (adulto): 25–50 mL (12,5–25 g) EV lento; repetir glicemia capilar em 15 min.',
      estabilidade: 'Uso imediato.',
      obs: 'Hiperosmolar: risco de flebite e necrose em extravasamento. Veja a calculadora "Transformação de soro".',
      conc: { qtd: 5000, u: 'mg', vol: 10 } },

    { id: 'naloxona', nome: 'Naloxona', classe: 'Antídoto de opioides',
      apresentacao: 'Ampola 0,4 mg/mL (1 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Para titulação: 1 mL (0,4 mg) + 9 mL SF 0,9% = 10 mL (0,04 mg/mL).',
      administracao: 'EV: 0,04–0,4 mg, repetir a cada 2–3 min conforme resposta. Também IM/SC.',
      estabilidade: 'Diluída: 24 h.',
      obs: 'Meia-vida menor que a de muitos opioides: risco de renarcotização. Pode desencadear abstinência aguda.',
      conc: { qtd: 0.4, u: 'mg', vol: 1 } }
,

    // ---------- Ampliação da biblioteca (conferida com fontes — ver revisoes.js) ----------
    { id: 'azitromicina-ev', nome: 'Azitromicina (EV)', classe: 'Antibiótico (macrolídeo)',
      apresentacao: 'Frasco-ampola 500 mg (pó)',
      reconstituicao: '500 mg em 4,8 mL de AD (100 mg/mL); agitar até dissolver.',
      diluicao: '250 mL (2 mg/mL) ou 500 mL (1 mg/mL) de SF 0,9%, Ringer lactato ou SG 5% com NaCl.',
      administracao: 'Infusão: 2 mg/mL em 1 h; 1 mg/mL em 3 h. NUNCA em bolus nem IM.',
      estabilidade: 'Reconstituída: 24 h em temperatura ambiente. Diluída: 24 h em temperatura ambiente / 7 dias refrigerada (alguns fabricantes: uso imediato).',
      obs: 'Pode prolongar QT.',
      conc: { qtd: 500, u: 'mg', vol: 5 } },

    { id: 'bromoprida', nome: 'Bromoprida', classe: 'Antiemético / procinético',
      apresentacao: 'Ampola 10 mg/2 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'EV: diluir em SF 0,9% ou SG 5%.',
      administracao: 'EV lenta em no mínimo 3 min (injeção rápida causa agitação/ansiedade transitórias seguidas de sonolência). Também IM.',
      estabilidade: 'Diluída: até 24 h em temperatura ambiente. Dose única — descartar sobras.',
      obs: 'Risco de reações extrapiramidais (sobretudo crianças e jovens). Não associar com metoclopramida.',
      conc: { qtd: 10, u: 'mg', vol: 2 } },

    { id: 'cefoxitina', nome: 'Cefoxitina', classe: 'Antibiótico (cefalosporina 2ª geração)',
      apresentacao: 'Frasco-ampola 1 g (pó)',
      reconstituicao: '1 g em 10 mL de AD.',
      diluicao: 'SF 0,9%, SG 5% ou Ringer lactato, 50–100 mL (concentração máx. 40 mg/mL).',
      administracao: 'Infusão em 30 min (ou EV direto lento em 3–5 min).',
      estabilidade: '24 h em temperatura ambiente / 48 h refrigerada.',
      obs: 'Muito usada em profilaxia cirúrgica.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'ceftazidima', nome: 'Ceftazidima', classe: 'Antibiótico (cefalosporina 3ª geração — antipseudomonas)',
      apresentacao: 'Frasco-ampola 1 g e 2 g (pó)',
      reconstituicao: '1 g em 10 mL de AD. Libera CO₂ ao dissolver: aguardar a solução clarear antes de aspirar. IM: lidocaína 0,5–1% ou AD.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'Infusão em 30 min ou EV direto em 3–5 min. Também IM.',
      estabilidade: 'Reconstituída: até 18 h em temperatura ambiente / 7 dias refrigerada (HUGG). Fotossensível.',
      obs: '',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'cefuroxima', nome: 'Cefuroxima', classe: 'Antibiótico (cefalosporina 2ª geração)',
      apresentacao: 'Frasco-ampola 750 mg (pó)',
      reconstituicao: 'EV: 750 mg em 6 mL (HSL) a 10 mL (São Camilo) de AD — ajuste o volume final na maleta.',
      diluicao: 'SF 0,9%, SG 5%, SG 10% ou Ringer lactato, 50–100 mL.',
      administracao: 'EV direto em 3–5 min ou infusão em 15–30 min. Também IM.',
      estabilidade: '24 h em temperatura ambiente / 48 h refrigerada. Proteger da luz.',
      obs: '',
      conc: { qtd: 750, u: 'mg', vol: 6 } },

    { id: 'cetoprofeno-ev', nome: 'Cetoprofeno (EV)', classe: 'Anti-inflamatório (AINE)',
      apresentacao: 'Frasco-ampola 100 mg (pó liofilizado)',
      reconstituicao: 'Dissolver conforme o fabricante.',
      diluicao: 'Diluir em 100–150 mL de SF 0,9% ou SG 5%.',
      administracao: 'Infusão EV lenta (em geral 20–30 min).',
      estabilidade: 'Usar imediatamente após o preparo.',
      obs: 'Máx. 300 mg/dia por até 48 h (EV). Contraindicado em crianças, úlcera péptica ativa/hemorrágica e insuficiência renal grave. Não associar com outro AINE.',
      conc: { qtd: 100, u: 'mg', vol: 100 } },

    { id: 'dobutamina', nome: 'Dobutamina', classe: 'Inotrópico — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 250 mg/20 mL (12,5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: '250 mg (20 mL) + 230 mL de SF 0,9% ou SG 5% = 250 mL (1 mg/mL).',
      administracao: 'Infusão contínua em bomba (2–20 mcg/kg/min).',
      estabilidade: 'Diluída: 24 h em temperatura ambiente; não congelar (cristaliza). Leve tom rosado não indica perda de potência.',
      obs: 'Inativada por soluções alcalinas (bicarbonato). Monitorar FC, PA e arritmias.',
      conc: { qtd: 250, u: 'mg', vol: 20 }, infusao: 'dobutamina' },

    { id: 'dopamina', nome: 'Dopamina', classe: 'Vasopressor / inotrópico — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 50 mg/10 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: '5 ampolas (250 mg) + 200 mL de SG 5% = 250 mL (1 mg/mL).',
      administracao: 'Infusão contínua em bomba, preferencialmente em acesso central.',
      estabilidade: '24 h. Desprezar se a solução escurecer.',
      obs: 'Vesicante: em extravasamento, interromper e seguir protocolo (fentolamina). Inativada por bicarbonato.',
      conc: { qtd: 50, u: 'mg', vol: 10 }, infusao: 'dopamina' },

    { id: 'enoxaparina', nome: 'Enoxaparina', classe: 'Anticoagulante (heparina de baixo peso molecular) — ALTA VIGILÂNCIA',
      apresentacao: 'Seringas preenchidas 20, 40, 60, 80 e 100 mg (100 mg/mL)',
      reconstituicao: 'Pronta para uso.',
      diluicao: 'Não diluir (uso SC).',
      administracao: 'SC na região anterolateral do abdômen, alternando os lados a cada dose. NÃO expelir a bolha de ar (retirar só o excesso quando a dose for menor que a seringa). Não friccionar o local.',
      estabilidade: 'Temperatura ambiente.',
      obs: 'Profilaxia: 40 mg 1x/dia (ClCr < 30: 20 mg/dia). Tratamento: 1 mg/kg a cada 12 h ou 1,5 mg/kg 1x/dia (ClCr < 30: 1 mg/kg 1x/dia). Monitorar plaquetas, sangramentos e anti-Xa quando indicado.',
      conc: { qtd: 100, u: 'mg', vol: 1 } },

    { id: 'escopolamina', nome: 'Escopolamina (butilbrometo)', classe: 'Antiespasmódico',
      apresentacao: 'Ampola 20 mg/mL (1 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser feita sem diluir; padrão HSL/InCor: diluir em 20 mL de SF 0,9%.',
      administracao: 'EV lenta em 2–3 min. Também IM ou SC.',
      estabilidade: 'Usar logo após o preparo.',
      obs: 'Máx. EV adulto: 100 mg/dia. Cautela em glaucoma, retenção urinária e taquiarritmias. Pode causar taquicardia e boca seca.',
      conc: { qtd: 20, u: 'mg', vol: 1 } },

    { id: 'fitomenadiona', nome: 'Fitomenadiona (vitamina K1)', classe: 'Vitamina / antídoto de anticoagulantes cumarínicos',
      apresentacao: 'Ampola 10 mg/mL (1 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'EV direto: diluir em 10 mL de SF 0,9% ou SG 5%. Infusão: 50–100 mL.',
      administracao: 'Preferir IM/SC/VO. EV somente se inevitável: lento, sem exceder 1 mg/min, com monitorização (anafilaxia possível já na 1ª dose).',
      estabilidade: 'Proteger da luz; usar logo após diluir.',
      obs: 'Antídoto da varfarina. Recém-nascido: profilaxia conforme protocolo neonatal (IM).',
      conc: { qtd: 10, u: 'mg', vol: 1 } },

    { id: 'fluconazol', nome: 'Fluconazol (EV)', classe: 'Antifúngico (azólico)',
      apresentacao: 'Bolsa 2 mg/mL (200 mg/100 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'Infusão EV; velocidade máx. ~200 mg/h (10 mL/min), conforme fabricante.',
      estabilidade: 'Não congelar.',
      obs: 'Inibidor enzimático: aumenta níveis de midazolam, fentanil e fenitoína. Pode prolongar QT.',
      conc: { qtd: 200, u: 'mg', vol: 100 } },

    { id: 'haloperidol', nome: 'Haloperidol', classe: 'Antipsicótico',
      apresentacao: 'Ampola 5 mg/mL (1 mL). Decanoato 50 mg/mL: SOMENTE IM',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Não necessita.',
      administracao: 'IM. Uso EV é off-label e exige monitorização contínua de ECG (risco de QT longo/torsades).',
      estabilidade: 'Proteger da luz.',
      obs: 'Decanoato (depósito) NUNCA EV. Reações extrapiramidais. Prolonga QT.',
      conc: { qtd: 5, u: 'mg', vol: 1 } },

    { id: 'hidralazina', nome: 'Hidralazina', classe: 'Anti-hipertensivo (vasodilatador)',
      apresentacao: 'Ampola 20 mg/mL (1 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: '1 mL (20 mg) + 19 mL de AD = 20 mL (1 mg/mL).',
      administracao: 'Crise hipertensiva na gestação: 5 mg (5 mL da solução 1 mg/mL) EV lento em 1–2 min; repetir a cada 15–20 min conforme PA (máx. 20 mg em bolus).',
      estabilidade: 'Usar logo após diluir.',
      obs: 'Meta usual: PAS 140–155 e PAD 90–100 mmHg. Monitorar PA a cada 5 min e BCF. Risco de hipotensão.',
      conc: { qtd: 20, u: 'mg', vol: 1 } },

    { id: 'imipenem', nome: 'Imipenem + cilastatina', classe: 'Antibiótico (carbapenêmico)',
      apresentacao: 'Frasco-ampola 500 mg (pó)',
      reconstituicao: 'Suspender o pó com parte do diluente da bolsa e transferir para a bolsa (a suspensão concentrada não é para injeção direta).',
      diluicao: 'SF 0,9% ou SG 5%, 100 mL (500 mg/100 mL).',
      administracao: '500 mg em 20–30 min; 1 g em 40–60 min.',
      estabilidade: 'Usar logo após o preparo (estabilidade curta; ver fabricante).',
      obs: 'Risco de convulsões (doses altas, insuficiência renal, SNC). Ajustar dose pela função renal.',
      conc: { qtd: 500, u: 'mg', vol: 100 } },

    { id: 'levofloxacino', nome: 'Levofloxacino (EV)', classe: 'Antibiótico (quinolona)',
      apresentacao: 'Bolsa 5 mg/mL (500 mg/100 mL; 750 mg/150 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'Infusão: mín. 60 min (250–500 mg) ou 90 min (750 mg). Nunca em bolus.',
      estabilidade: 'Não misturar com outros medicamentos nem infundir na mesma linha (lavar o equipo antes e depois).',
      obs: 'Pode prolongar QT. Risco de tendinopatia.',
      conc: { qtd: 500, u: 'mg', vol: 100 } },

    { id: 'linezolida', nome: 'Linezolida (EV)', classe: 'Antibiótico (oxazolidinona)',
      apresentacao: 'Bolsa 2 mg/mL (600 mg/300 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'Infusão em 30–120 min.',
      estabilidade: 'Manter na embalagem até o uso.',
      obs: 'Risco de síndrome serotoninérgica com outros serotoninérgicos; mielossupressão em uso > 2 semanas.',
      conc: { qtd: 600, u: 'mg', vol: 300 } },

    { id: 'pantoprazol', nome: 'Pantoprazol', classe: 'Inibidor da bomba de prótons',
      apresentacao: 'Frasco-ampola 40 mg + diluente 10 mL',
      reconstituicao: 'SOMENTE com o diluente próprio (10 mL) → 4 mg/mL.',
      diluicao: 'Infusão: diluir conforme fabricante (ex.: 100 mL de SF 0,9%).',
      administracao: 'EV direto em no mínimo 2 min ou infusão em 15 min.',
      estabilidade: 'Reconstituído: usar em até 4 h (refrigerado, protegido da luz).',
      obs: 'Não misturar com outros injetáveis.',
      conc: { qtd: 40, u: 'mg', vol: 10 } },

    { id: 'paracetamol-ev', nome: 'Paracetamol (EV)', classe: 'Analgésico / antitérmico',
      apresentacao: 'Frasco/bolsa 10 mg/mL (500 mg/50 mL e 1 g/100 mL)',
      reconstituicao: 'Pronto para uso.',
      diluicao: 'Pronto para uso; não adicionar outros medicamentos.',
      administracao: 'Infusão EV em 15 min.',
      estabilidade: 'Usar logo após abrir.',
      obs: 'Dose máxima diária considera TODAS as vias e produtos com paracetamol (risco hepático). ≥ 50 kg: 1 g a cada 6 h (máx. 4 g/dia); 33–50 kg: 15 mg/kg (máx. 3 g/dia).',
      conc: { qtd: 1000, u: 'mg', vol: 100 } },

    { id: 'penicilina-benzatina', nome: 'Penicilina G benzatina', classe: 'Antibiótico (penicilina) — somente IM',
      apresentacao: 'Frasco-ampola 1.200.000 UI (pó ou suspensão, conforme fabricante)',
      reconstituicao: 'Pó: 4 mL de água para injetáveis (Nota Informativa MS 4/2018) ou o diluente próprio até volume final de 4 mL; agitar vigorosamente até suspensão homogênea.',
      diluicao: 'Não diluir.',
      administracao: 'SOMENTE intramuscular profunda (ventroglútea ou dorsoglútea; máx. 4 mL por local). NUNCA EV. Aspirar antes; injeção lenta e contínua (evita obstruir a agulha).',
      estabilidade: 'Usar logo após reconstituir.',
      obs: 'Sífilis recente: 2.400.000 UI dose única (1.200.000 UI em cada glúteo). Latente tardia/terciária: 2.400.000 UI/semana por 3 semanas. Neurossífilis: NÃO usar benzatina. Observar o paciente por 30 min (anafilaxia) com adrenalina disponível.',
      conc: { qtd: 1200000, u: 'UI', vol: 4 } },

    { id: 'propofol', nome: 'Propofol', classe: 'Sedativo-hipnótico — ALTA VIGILÂNCIA',
      apresentacao: 'Emulsão 10 mg/mL (1%) e 20 mg/mL (2%)',
      reconstituicao: 'Agitar antes de usar.',
      diluicao: 'Preferir puro. Se diluir: somente SG 5%, concentração ≥ 2 mg/mL.',
      administracao: 'Bolus EV ou infusão contínua em bomba.',
      estabilidade: 'Puro: trocar frasco e equipo a cada 12 h. Diluído: usar em até 6 h (HSL). Técnica asséptica rigorosa (emulsão lipídica favorece crescimento bacteriano).',
      obs: 'Hipotensão e depressão respiratória; dor à injeção.',
      conc: { qtd: 10, u: 'mg', vol: 1 }, infusao: 'propofol' },

    { id: 'sacarato-ferro', nome: 'Sacarato de hidróxido férrico (ferro EV)', classe: 'Antianêmico',
      apresentacao: 'Ampola 100 mg de ferro/5 mL (20 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SOMENTE SF 0,9%: 100 mg em até 100 mL (fabricante); HSL: cada 1 mL em até 20 mL de SF.',
      administracao: 'Infusão: 100 mg em no mínimo 15 min. Dose-teste na 1ª aplicação conforme fabricante/protocolo. Nunca IM.',
      estabilidade: 'Usar logo após diluir.',
      obs: 'Observar hipersensibilidade durante e 30 min após a infusão. Extravasamento mancha a pele.',
      conc: { qtd: 100, u: 'mg', vol: 5 } },

    { id: 'smx-tmp', nome: 'Sulfametoxazol + trimetoprima (EV)', classe: 'Antibiótico (sulfonamida)',
      apresentacao: 'Ampola 5 mL (400 mg SMX + 80 mg TMP) — dose expressa em TMP',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Cada ampola em 125 mL de SG 5% (preferencial) ou SF 0,9%; restrição hídrica: 75 mL.',
      administracao: 'Infusão em 60–90 min.',
      estabilidade: 'Diluída em SG 5%: ~6 h em temperatura ambiente; não refrigerar.',
      obs: 'Perguntar sobre alergia a sulfas. Risco de hipercalemia e mielossupressão.',
      conc: { qtd: 80, u: 'mg', vol: 5 } },

    { id: 'teicoplanina', nome: 'Teicoplanina', classe: 'Antibiótico (glicopeptídeo)',
      apresentacao: 'Frasco-ampola 200 mg e 400 mg (pó)',
      reconstituicao: '400 mg: adicionar lentamente 3 mL de AD e rolar o frasco entre as mãos SEM AGITAR (evitar espuma).',
      diluicao: 'EV direto ou diluir em 20–200 mL de SF 0,9%, SG 5% ou Ringer lactato.',
      administracao: 'EV direto em 3–5 min ou infusão em 30 min. Também IM (muito usada em atendimento domiciliar).',
      estabilidade: 'Preferir uso imediato (HSL: 24 h refrigerada).',
      obs: 'Ataque: 400 mg (≈ 6 mg/kg) a cada 12 h por 3 doses; manutenção 400 mg 1x/dia EV ou IM (> 85 kg: 6 mg/kg). Infecções graves: até 10–12 mg/kg conforme protocolo. A partir do 4º dia ajustar se ClCr < 60.',
      conc: { qtd: 400, u: 'mg', vol: 3 } },

    { id: 'tenoxicam', nome: 'Tenoxicam', classe: 'Anti-inflamatório (AINE)',
      apresentacao: 'Frasco-ampola 20 mg e 40 mg (pó) + diluente 2 mL',
      reconstituicao: 'Adicionar todo o diluente (2 mL de AD) e usar imediatamente.',
      diluicao: 'Não é recomendado para infusão.',
      administracao: 'EV direto lento ou IM.',
      estabilidade: 'Usar imediatamente após reconstituir.',
      obs: 'AINE: risco de sangramento gastrointestinal e lesão renal; evitar em úlcera, insuficiência renal e gestação. Não associar com outro AINE.',
      conc: { qtd: 20, u: 'mg', vol: 2 } },

    { id: 'tranexamico', nome: 'Ácido tranexâmico', classe: 'Antifibrinolítico',
      apresentacao: 'Ampola 250 mg/5 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser diluído em SF 0,9%, SG 5% ou Ringer.',
      administracao: 'EV lenta: 1 mL/min (máx. 50 mg/min). SOMENTE EV — nunca intratecal/epidural.',
      estabilidade: 'Usar logo após o preparo.',
      obs: 'Ajustar dose na insuficiência renal. Contraindicado em trombose ativa.',
      conc: { qtd: 250, u: 'mg', vol: 5 } },

    { id: 'vasopressina', nome: 'Vasopressina', classe: 'Vasopressor — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 20 UI/mL (1 mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: '20 UI em 100 mL (0,2 UI/mL) ou em 200 mL de SF 0,9% (0,1 UI/mL — São Camilo).',
      administracao: 'Infusão contínua em bomba; choque: 0,01–0,04 UI/min (dose fixa, não titular como catecolamina).',
      estabilidade: 'Conforme fabricante (ampola sob refrigeração).',
      obs: 'Monitorar perfusão periférica, diurese e sódio.',
      conc: { qtd: 20, u: 'UI', vol: 1 }, infusao: 'vasopressina' }
,

    // ---------- Sequência rápida de intubação ----------
    { id: 'cetamina', nome: 'Cetamina (escetamina/cetamina)', classe: 'Anestésico dissociativo',
      apresentacao: 'Frasco 500 mg/10 mL (50 mg/mL); confira se é cetamina racêmica ou escetamina (doses diferentes)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Indução: sem diluir. Analgesia/sedação: diluir conforme protocolo (ex.: 10 mg/mL).',
      administracao: 'EV em cerca de 1 min (bolus muito rápido pode causar apneia). Também IM.',
      estabilidade: 'Usar logo após aspirar/diluir.',
      obs: 'Mantém drive respiratório e PA; broncodilatadora. Reação de emergência (alucinações), hipersalivação, aumento de PA e FC. Substância controlada.',
      conc: { qtd: 500, u: 'mg', vol: 10 } },

    { id: 'etomidato', nome: 'Etomidato', classe: 'Hipnótico (indutor anestésico)',
      apresentacao: 'Ampola 20 mg/10 mL (2 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Não diluir.',
      administracao: 'EV em 30–60 s, somente para indução (não usar em infusão contínua).',
      estabilidade: 'Usar logo após aspirar.',
      obs: 'Estabilidade hemodinâmica. Mioclonias, dor à injeção, náuseas; supressão adrenal transitória (cautela no choque séptico).',
      conc: { qtd: 20, u: 'mg', vol: 10 } },

    { id: 'rocuronio', nome: 'Rocurônio', classe: 'Bloqueador neuromuscular — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 50 mg/5 mL (10 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Não diluir no bolus.',
      administracao: 'EV em bolus, sempre após sedação adequada. Início em ~60 s; duração de 30–60 min.',
      estabilidade: 'Armazenar sob refrigeração (2–8 °C); fora da geladeira, validade reduzida conforme fabricante.',
      obs: 'Paralisa a respiração: usar só com equipe e material de via aérea prontos. Armazenamento segregado e identificado. Reversor: sugamadex.',
      conc: { qtd: 50, u: 'mg', vol: 5 } },

    { id: 'succinilcolina', nome: 'Succinilcolina (suxametônio)', classe: 'Bloqueador neuromuscular despolarizante — ALTA VIGILÂNCIA',
      apresentacao: 'Frasco-ampola 100 mg e 500 mg (pó)',
      reconstituicao: '100 mg em 5 mL de AD (20 mg/mL) ou 10 mL (10 mg/mL).',
      diluicao: 'Não diluir no bolus.',
      administracao: 'EV em bolus após o indutor. Início em 30–60 s (fasciculações); duração de 5–10 min.',
      estabilidade: 'Usar logo após reconstituir; frasco sob refrigeração conforme fabricante.',
      obs: 'CONTRAINDICADA: hipercalemia, queimadura ou trauma por esmagamento após 24–72 h, rabdomiólise, doença neuromuscular, imobilização prolongada, história pessoal/familiar de hipertermia maligna. Pode causar bradicardia (crianças, 2ª dose).',
      conc: { qtd: 100, u: 'mg', vol: 5 } }
  ];

  // Presets para infusão contínua (bomba)
  var INFUSIONS = [
    { id: 'noradrenalina', nome: 'Noradrenalina', qtd: 16, u: 'mg', vol: 250,
      solucao: '4 amp (4 mg/4 mL) + 234 mL SG 5%', doseUnit: 'mcg/kg/min', faixa: [0.01, 2], dose: 0.1 },
    { id: 'adrenalina', nome: 'Adrenalina', qtd: 4, u: 'mg', vol: 250,
      solucao: '4 amp (1 mg/mL) + 246 mL SG 5%', doseUnit: 'mcg/kg/min', faixa: [0.01, 0.5], dose: 0.05 },
    { id: 'dobutamina', nome: 'Dobutamina', qtd: 250, u: 'mg', vol: 250,
      solucao: '1 amp (250 mg/20 mL) + 230 mL SF 0,9% ou SG 5%', doseUnit: 'mcg/kg/min', faixa: [2, 20], dose: 5 },
    { id: 'dopamina', nome: 'Dopamina', qtd: 250, u: 'mg', vol: 250,
      solucao: '5 amp (50 mg/10 mL) + 200 mL SF 0,9% ou SG 5%', doseUnit: 'mcg/kg/min', faixa: [1, 20], dose: 5 },
    { id: 'nitroprussiato', nome: 'Nitroprussiato', qtd: 50, u: 'mg', vol: 250,
      solucao: '1 amp (50 mg/2 mL) + 248 mL SG 5% — proteger da luz', doseUnit: 'mcg/kg/min', faixa: [0.3, 10], dose: 0.5 },
    { id: 'nitroglicerina', nome: 'Nitroglicerina', qtd: 50, u: 'mg', vol: 250,
      solucao: '1 amp (50 mg/10 mL) + 240 mL SG 5%', doseUnit: 'mcg/min', faixa: [5, 200], dose: 10 },
    { id: 'vasopressina', nome: 'Vasopressina', qtd: 20, u: 'UI', vol: 100,
      solucao: '1 amp (20 UI/mL) + 99 mL SF 0,9%', doseUnit: 'UI/min', faixa: [0.01, 0.04], dose: 0.03 },
    { id: 'amiodarona', nome: 'Amiodarona (manutenção)', qtd: 900, u: 'mg', vol: 500,
      solucao: '6 amp (150 mg/3 mL) + 482 mL SG 5%', doseUnit: 'mg/min', faixa: [0.5, 1], dose: 1 },
    { id: 'midazolam', nome: 'Midazolam', qtd: 150, u: 'mg', vol: 150,
      solucao: '30 mL (5 mg/mL) + 120 mL SF 0,9%', doseUnit: 'mg/kg/h', faixa: [0.02, 0.2], dose: 0.05 },
    { id: 'fentanil', nome: 'Fentanil', qtd: 1000, u: 'mcg', vol: 100,
      solucao: '20 mL (50 mcg/mL) + 80 mL SF 0,9%', doseUnit: 'mcg/kg/h', faixa: [0.7, 10], dose: 1 },
    { id: 'propofol', nome: 'Propofol 1%', qtd: 1000, u: 'mg', vol: 100,
      solucao: 'Puro (10 mg/mL) — trocar frasco/equipo a cada 12 h', doseUnit: 'mg/kg/h', faixa: [0.3, 3], dose: 1 },
    { id: 'dexmedetomidina', nome: 'Dexmedetomidina', qtd: 200, u: 'mcg', vol: 50,
      solucao: '2 mL (100 mcg/mL) + 48 mL SF 0,9%', doseUnit: 'mcg/kg/h', faixa: [0.2, 1.4], dose: 0.4 },
    { id: 'insulina', nome: 'Insulina regular', qtd: 100, u: 'UI', vol: 100,
      solucao: '1 mL (100 UI) + 99 mL SF 0,9%', doseUnit: 'UI/h', faixa: [0.5, 15], dose: 2 },
    { id: 'heparina', nome: 'Heparina', qtd: 25000, u: 'UI', vol: 250,
      solucao: '5 mL (25.000 UI) + 245 mL SF 0,9%', doseUnit: 'UI/kg/h', faixa: [12, 18], dose: 18 },
    { id: 'ocitocina', nome: 'Ocitocina', qtd: 5, u: 'UI', vol: 500,
      solucao: '1 amp (5 UI) em 500 mL de SG 5% (10 mUI/mL)', doseUnit: 'mUI/min', faixa: [1, 32], dose: 2 }
  ];

  // Eletrólitos: mEq por mL e mg por mL
  var ELECTROLYTES = [
    { id: 'kcl191', nome: 'KCl 19,1%', meqMl: 2.56, mgMl: 191, alerta: 'Nunca EV direto. Diluir e infundir em bomba.' },
    { id: 'kcl10', nome: 'KCl 10%', meqMl: 1.34, mgMl: 100, alerta: 'Nunca EV direto. Diluir e infundir em bomba.' },
    { id: 'nacl20', nome: 'NaCl 20%', meqMl: 3.42, mgMl: 200, alerta: 'Solução hipertônica: sempre diluir.' },
    { id: 'nacl10', nome: 'NaCl 10%', meqMl: 1.71, mgMl: 100, alerta: 'Solução hipertônica: sempre diluir.' },
    { id: 'nacl3', nome: 'NaCl 3%', meqMl: 0.513, mgMl: 30, alerta: 'Hipertônico: monitorar sódio sérico.' },
    { id: 'nacl09', nome: 'NaCl 0,9% (SF)', meqMl: 0.154, mgMl: 9, alerta: '' },
    { id: 'bic84', nome: 'Bicarbonato de sódio 8,4%', meqMl: 1, mgMl: 84, alerta: 'Incompatível com cálcio.' },
    { id: 'bic10', nome: 'Bicarbonato de sódio 10%', meqMl: 1.19, mgMl: 100, alerta: 'Incompatível com cálcio.' },
    { id: 'gluca10', nome: 'Gluconato de cálcio 10%', meqMl: 0.465, mgMl: 100, alerta: 'Infundir lentamente com monitorização.' },
    { id: 'mg10', nome: 'Sulfato de magnésio 10%', meqMl: 0.81, mgMl: 100, alerta: '' },
    { id: 'mg50', nome: 'Sulfato de magnésio 50%', meqMl: 4.06, mgMl: 500, alerta: 'Sempre diluir.' }
  ];

  // Escalas — cada item: { label, opts: [[pontos, texto], ...] }
  var SCALES = [
    { id: 'glasgow', nome: 'Escala de Coma de Glasgow', desc: 'Nível de consciência (com reatividade pupilar — GCS-P)',
      items: [
        { label: 'Abertura ocular', opts: [[4, 'Espontânea'], [3, 'Ao som'], [2, 'À pressão'], [1, 'Ausente']] },
        { label: 'Resposta verbal', opts: [[5, 'Orientada'], [4, 'Confusa'], [3, 'Palavras'], [2, 'Sons'], [1, 'Ausente']] },
        { label: 'Resposta motora', opts: [[6, 'Obedece comandos'], [5, 'Localiza estímulo'], [4, 'Flexão normal'], [3, 'Flexão anormal'], [2, 'Extensão'], [1, 'Ausente']] },
        { label: 'Reatividade pupilar (subtrai)', opts: [[0, 'Ambas reagem à luz'], [-1, 'Uma pupila não reage'], [-2, 'Nenhuma reage']], optional: true }
      ],
      interp: function (s, v) {
        var gcs = v[0] + v[1] + v[2];
        var txt = gcs >= 13 ? 'TCE leve' : gcs >= 9 ? 'TCE moderado' : 'TCE grave — considerar via aérea definitiva (≤ 8)';
        return { score: s, label: 'GCS ' + gcs + (v[3] !== undefined ? ' · GCS-P ' + s : ''), txt: txt, level: gcs >= 13 ? 'ok' : gcs >= 9 ? 'warn' : 'bad' };
      } },

    { id: 'braden', nome: 'Escala de Braden', desc: 'Risco de lesão por pressão',
      items: [
        { label: 'Percepção sensorial', opts: [[1, 'Totalmente limitado'], [2, 'Muito limitado'], [3, 'Levemente limitado'], [4, 'Nenhuma limitação']] },
        { label: 'Umidade', opts: [[1, 'Completamente molhada'], [2, 'Muito molhada'], [3, 'Ocasionalmente molhada'], [4, 'Raramente molhada']] },
        { label: 'Atividade', opts: [[1, 'Acamado'], [2, 'Confinado à cadeira'], [3, 'Anda ocasionalmente'], [4, 'Anda frequentemente']] },
        { label: 'Mobilidade', opts: [[1, 'Totalmente imóvel'], [2, 'Bastante limitado'], [3, 'Levemente limitado'], [4, 'Não apresenta limitações']] },
        { label: 'Nutrição', opts: [[1, 'Muito pobre'], [2, 'Provavelmente inadequada'], [3, 'Adequada'], [4, 'Excelente']] },
        { label: 'Fricção e cisalhamento', opts: [[1, 'Problema'], [2, 'Problema em potencial'], [3, 'Nenhum problema aparente']] }
      ],
      interp: function (s) {
        if (s <= 9) return { score: s, txt: 'Risco muito alto', level: 'bad' };
        if (s <= 12) return { score: s, txt: 'Risco alto', level: 'bad' };
        if (s <= 14) return { score: s, txt: 'Risco moderado', level: 'warn' };
        if (s <= 18) return { score: s, txt: 'Risco baixo', level: 'warn' };
        return { score: s, txt: 'Sem risco', level: 'ok' };
      } },

    { id: 'morse', nome: 'Escala de Morse', desc: 'Risco de queda',
      items: [
        { label: 'Histórico de quedas', opts: [[0, 'Não'], [25, 'Sim']] },
        { label: 'Diagnóstico secundário', opts: [[0, 'Não'], [15, 'Sim']] },
        { label: 'Auxílio na deambulação', opts: [[0, 'Nenhum / acamado / auxiliado por profissional'], [15, 'Muletas / bengala / andador'], [30, 'Apoia-se no mobiliário']] },
        { label: 'Terapia endovenosa / dispositivo salinizado', opts: [[0, 'Não'], [20, 'Sim']] },
        { label: 'Marcha', opts: [[0, 'Normal / sem deambulação / acamado / cadeira de rodas'], [10, 'Fraca'], [20, 'Comprometida / cambaleante']] },
        { label: 'Estado mental', opts: [[0, 'Orientado / capaz quanto à própria capacidade'], [15, 'Superestima capacidade / esquece limitações']] }
      ],
      interp: function (s) {
        if (s >= 45) return { score: s, txt: 'Risco alto', level: 'bad' };
        if (s >= 25) return { score: s, txt: 'Risco moderado', level: 'warn' };
        return { score: s, txt: 'Risco baixo', level: 'ok' };
      } },

    { id: 'rass', nome: 'RASS', desc: 'Richmond Agitation-Sedation Scale',
      items: [
        { label: 'Nível', opts: [[4, '+4 Combativo'], [3, '+3 Muito agitado'], [2, '+2 Agitado'], [1, '+1 Inquieto'], [0, '0 Alerta e calmo'],
          [-1, '−1 Sonolento (desperta à voz > 10 s)'], [-2, '−2 Sedação leve (desperta à voz < 10 s)'], [-3, '−3 Sedação moderada (movimento à voz, sem contato visual)'],
          [-4, '−4 Sedação profunda (movimento ao estímulo físico)'], [-5, '−5 Não desperta']] }
      ],
      interp: function (s) {
        if (s > 0) return { score: s, txt: 'Agitação', level: s >= 3 ? 'bad' : 'warn' };
        if (s === 0) return { score: s, txt: 'Alerta e calmo', level: 'ok' };
        if (s >= -2) return { score: s, txt: 'Sedação leve (alvo usual: 0 a −2)', level: 'ok' };
        return { score: s, txt: 'Sedação moderada a profunda', level: 'warn' };
      } },

    { id: 'ramsay', nome: 'Escala de Ramsay', desc: 'Nível de sedação',
      items: [
        { label: 'Nível', opts: [[1, '1 — Ansioso, agitado ou inquieto'], [2, '2 — Cooperativo, orientado e tranquilo'], [3, '3 — Responde apenas a comandos'],
          [4, '4 — Resposta rápida a estímulo glabelar ou sonoro alto'], [5, '5 — Resposta lenta a estímulo glabelar ou sonoro alto'], [6, '6 — Sem resposta']] }
      ],
      interp: function (s) {
        if (s === 1) return { score: s, txt: 'Sedação insuficiente', level: 'warn' };
        if (s <= 4) return { score: s, txt: 'Sedação adequada (2–4)', level: 'ok' };
        return { score: s, txt: 'Sedação profunda', level: 'warn' };
      } },

    { id: 'apgar', nome: 'Índice de Apgar', desc: 'Vitalidade do recém-nascido (1º e 5º minuto)',
      items: [
        { label: 'Frequência cardíaca', opts: [[0, 'Ausente'], [1, '< 100 bpm'], [2, '≥ 100 bpm']] },
        { label: 'Esforço respiratório', opts: [[0, 'Ausente'], [1, 'Lento, irregular'], [2, 'Choro forte']] },
        { label: 'Tônus muscular', opts: [[0, 'Flácido'], [1, 'Alguma flexão'], [2, 'Movimentos ativos']] },
        { label: 'Irritabilidade reflexa', opts: [[0, 'Sem resposta'], [1, 'Careta'], [2, 'Choro / espirro / tosse']] },
        { label: 'Cor', opts: [[0, 'Cianose / palidez'], [1, 'Corpo róseo, extremidades cianóticas'], [2, 'Completamente róseo']] }
      ],
      interp: function (s) {
        if (s >= 7) return { score: s, txt: 'Boa vitalidade', level: 'ok' };
        if (s >= 4) return { score: s, txt: 'Asfixia moderada', level: 'warn' };
        return { score: s, txt: 'Asfixia grave', level: 'bad' };
      } },

    { id: 'qsofa', nome: 'qSOFA', desc: 'Triagem de risco em suspeita de sepse',
      items: [
        { label: 'Frequência respiratória ≥ 22 irpm', opts: [[0, 'Não'], [1, 'Sim']] },
        { label: 'Alteração do nível de consciência (Glasgow < 15)', opts: [[0, 'Não'], [1, 'Sim']] },
        { label: 'PA sistólica ≤ 100 mmHg', opts: [[0, 'Não'], [1, 'Sim']] }
      ],
      interp: function (s) {
        return s >= 2 ? { score: s, txt: 'Alto risco de desfecho desfavorável — acionar protocolo de sepse', level: 'bad' }
                      : { score: s, txt: 'Baixo risco pelo qSOFA (não exclui sepse)', level: 'ok' };
      } },

    { id: 'news2', nome: 'NEWS2', desc: 'Escore de alerta precoce de deterioração clínica (adultos)',
      fonte: 'Royal College of Physicians (2017); adaptação brasileira: Rev Gaúcha Enferm 2020',
      items: [
        { label: 'Frequência respiratória (irpm)', opts: [[3, '≤ 8'], [1, '9–11'], [0, '12–20'], [2, '21–24'], [3, '≥ 25']] },
        { label: 'SpO₂ — escala 1 (%)', opts: [[3, '≤ 91'], [2, '92–93'], [1, '94–95'], [0, '≥ 96']] },
        { label: 'Oxigênio suplementar', opts: [[0, 'Ar ambiente'], [2, 'Em uso de O₂']] },
        { label: 'PA sistólica (mmHg)', opts: [[3, '≤ 90'], [2, '91–100'], [1, '101–110'], [0, '111–219'], [3, '≥ 220']] },
        { label: 'Frequência cardíaca (bpm)', opts: [[3, '≤ 40'], [1, '41–50'], [0, '51–90'], [1, '91–110'], [2, '111–130'], [3, '≥ 131']] },
        { label: 'Nível de consciência', opts: [[0, 'Alerta'], [3, 'Confusão nova, responde à voz, à dor ou não responde (CVPU)']] },
        { label: 'Temperatura (°C)', opts: [[3, '≤ 35,0'], [1, '35,1–36,0'], [0, '36,1–38,0'], [1, '38,1–39,0'], [2, '≥ 39,1']] }
      ],
      interp: function (s, v) {
        var tres = v.some(function (x) { return x === 3; });
        if (s >= 7) return { score: s, txt: 'Risco ALTO — resposta de emergência (equipe de resposta rápida/médico imediatamente); monitorização contínua', level: 'bad' };
        if (s >= 5) return { score: s, txt: 'Risco MÉDIO — resposta urgente: avaliação médica imediata; sinais vitais no mínimo de 1/1 h', level: 'bad' };
        if (tres) return { score: s, txt: 'Risco baixo-médio (3 pontos em um parâmetro) — avaliação médica urgente; sinais vitais no mínimo de 1/1 h', level: 'warn' };
        if (s >= 1) return { score: s, txt: 'Risco baixo — avaliação pelo enfermeiro; sinais vitais no mínimo de 4/4 h', level: 'ok' };
        return { score: s, txt: 'Escore 0 — monitorização no mínimo de 12/12 h', level: 'ok' };
      } },

    { id: 'flacc', nome: 'Escala FLACC', desc: 'Dor em crianças (2 meses a 7 anos) ou pacientes que não verbalizam',
      fonte: 'Merkel et al. (1997); versões brasileiras validadas',
      items: [
        { label: 'Face', opts: [[0, 'Nenhuma expressão particular ou sorriso'], [1, 'Careta ou testa franzida ocasional; retraído, desinteressado'], [2, 'Queixo trêmulo frequente/constante; mandíbula cerrada']] },
        { label: 'Pernas', opts: [[0, 'Posição normal ou relaxadas'], [1, 'Inquietas, agitadas, tensas'], [2, 'Chutando ou encolhidas']] },
        { label: 'Atividade', opts: [[0, 'Deitado quieto, posição normal, move-se facilmente'], [1, 'Contorcendo-se, mudando de posição, tenso'], [2, 'Arqueado, rígido ou com movimentos bruscos']] },
        { label: 'Choro', opts: [[0, 'Sem choro'], [1, 'Gemidos ou choramingos; queixa ocasional'], [2, 'Choro contínuo, grito ou soluço; queixas frequentes']] },
        { label: 'Consolabilidade', opts: [[0, 'Contente, relaxado'], [1, 'Tranquilizado por toque, abraço ou conversa; distraível'], [2, 'Difícil de consolar ou confortar']] }
      ],
      interp: function (s) {
        if (s === 0) return { score: s, txt: 'Relaxado e confortável', level: 'ok' };
        if (s <= 3) return { score: s, txt: 'Desconforto leve', level: 'ok' };
        if (s <= 6) return { score: s, txt: 'Dor moderada', level: 'warn' };
        return { score: s, txt: 'Dor intensa', level: 'bad' };
      } },

    { id: 'cpot', nome: 'CPOT', desc: 'Dor em paciente crítico que não verbaliza (intubado ou não)',
      fonte: 'Gélinas et al. (2006); versão brasileira validada (Rev Bras Ter Intensiva)',
      items: [
        { label: 'Expressão facial', opts: [[0, 'Relaxada, neutra'], [1, 'Tensa (testa franzida, sobrancelhas abaixadas)'], [2, 'Careta (todos os anteriores + pálpebras fortemente fechadas)']] },
        { label: 'Movimentos corporais', opts: [[0, 'Ausência de movimentos ou posição normal'], [1, 'Proteção (movimentos lentos e cautelosos, toca o local da dor)'], [2, 'Inquietação/agitação (puxa o tubo, tenta sentar, debate-se)']] },
        { label: 'Ventilador (intubado) OU vocalização (extubado)', opts: [[0, 'Tolera o ventilador / fala em tom normal ou não emite sons'], [1, 'Tosse mas tolera / suspira, geme'], [2, 'Briga com o ventilador / grita, soluça']] },
        { label: 'Tensão muscular (flexão/extensão passiva dos membros superiores)', opts: [[0, 'Relaxado, sem resistência'], [1, 'Tenso, rígido (resistência)'], [2, 'Muito tenso ou rígido (forte resistência)']] }
      ],
      interp: function (s) {
        return s > 2 ? { score: s, txt: 'Dor provável (> 2) — tratar e reavaliar', level: s >= 5 ? 'bad' : 'warn' }
                     : { score: s, txt: 'Dor improvável (≤ 2)', level: 'ok' };
      } },

    { id: 'aldrete', nome: 'Aldrete e Kroulik', desc: 'Recuperação pós-anestésica (alta da SRPA)',
      fonte: 'Aldrete & Kroulik (1970), versão modificada com SpO₂ (1995)',
      items: [
        { label: 'Atividade motora', opts: [[2, 'Move os 4 membros (voluntariamente ou sob comando)'], [1, 'Move 2 membros'], [0, 'Não move os membros']] },
        { label: 'Respiração', opts: [[2, 'Respira profundamente e tosse livremente'], [1, 'Dispneia ou respiração limitada'], [0, 'Apneia']] },
        { label: 'Circulação (PA em relação ao pré-anestésico)', opts: [[2, 'Variação até 20%'], [1, 'Variação de 20–49%'], [0, 'Variação ≥ 50%']] },
        { label: 'Consciência', opts: [[2, 'Completamente acordado'], [1, 'Desperta ao ser chamado'], [0, 'Não responde']] },
        { label: 'Saturação de O₂', opts: [[2, '> 92% em ar ambiente'], [1, 'Necessita de O₂ para manter > 90%'], [0, '< 90% mesmo com O₂']] }
      ],
      interp: function (s) {
        return s >= 8 ? { score: s, txt: 'Critério de alta da SRPA atingido (8–10) — avaliar também dor, náuseas, temperatura e sangramento', level: 'ok' }
                      : { score: s, txt: 'Manter na SRPA e reavaliar', level: s >= 5 ? 'warn' : 'bad' };
      } },

    { id: 'dor', nome: 'Escala Numérica de Dor', desc: 'Intensidade da dor (0–10)',
      items: [
        { label: 'Intensidade referida', opts: [[0, '0 — Sem dor'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [7, '7'], [8, '8'], [9, '9'], [10, '10 — Pior dor imaginável']] }
      ],
      interp: function (s) {
        if (s === 0) return { score: s, txt: 'Sem dor', level: 'ok' };
        if (s <= 3) return { score: s, txt: 'Dor leve', level: 'ok' };
        if (s <= 6) return { score: s, txt: 'Dor moderada', level: 'warn' };
        return { score: s, txt: 'Dor intensa', level: 'bad' };
      } }
  ];

  // Modelos de maleta (ponto de partida; o usuário personaliza)
  var KITS = [
    { id: 'emergencia', nome: 'Carrinho de emergência', icon: '🚑', local: 'Parada / urgência',
      drogas: ['adrenalina', 'amiodarona', 'atropina', 'adenosina', 'bicarbonato', 'gluconato-calcio', 'sulfato-magnesio', 'glicose-50',
        'midazolam', 'diazepam', 'fentanil', 'naloxona', 'flumazenil', 'furosemida', 'hidrocortisona', 'noradrenalina'] },
    { id: 'domiciliar', nome: 'Atendimento domiciliar', icon: '🏠', local: 'Antibioticoterapia e suporte em casa',
      drogas: ['ceftriaxona', 'cefepima', 'ertapenem', 'meropenem', 'pipe-tazo', 'amicacina', 'gentamicina', 'vancomicina', 'teicoplanina',
        'enoxaparina', 'sacarato-ferro', 'dipirona', 'escopolamina', 'ondansetrona', 'bromoprida', 'tramadol', 'furosemida', 'omeprazol'] },
    { id: 'uti', nome: 'UTI — sedação e DVA', icon: '🫀', local: 'Terapia intensiva',
      drogas: ['noradrenalina', 'adrenalina', 'nitroglicerina', 'nitroprussiato', 'amiodarona', 'midazolam', 'fentanil', 'morfina',
        'heparina', 'insulina-regular', 'cloreto-potassio', 'sulfato-magnesio', 'dobutamina', 'dopamina', 'vasopressina', 'propofol'] },
    { id: 'obstetricia', nome: 'Obstetrícia', icon: '🤰', local: 'Centro obstétrico',
      drogas: ['ocitocina', 'sulfato-magnesio', 'gluconato-calcio', 'hidralazina', 'tranexamico', 'cefazolina', 'dipirona', 'ondansetrona'] },
    { id: 'ubs', nome: 'UBS / atenção primária', icon: '🩺', local: 'Unidade básica de saúde',
      drogas: ['penicilina-benzatina', 'adrenalina', 'hidrocortisona', 'dexametasona', 'dipirona', 'escopolamina', 'bromoprida', 'glicose-50', 'fitomenadiona'] }
  ];

  root.DATA = { DRUGS: DRUGS, INFUSIONS: INFUSIONS, ELECTROLYTES: ELECTROLYTES, SCALES: SCALES, KITS: KITS };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DATA;
})(typeof window !== 'undefined' ? window : this);
