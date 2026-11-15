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
      obs: 'Nefro e ototóxica: monitorar função renal e diurese. Não misturar com betalactâmicos no mesmo frasco.',
      conc: { qtd: 500, u: 'mg', vol: 2 } },

    { id: 'amiodarona', nome: 'Amiodarona', classe: 'Antiarrítmico',
      apresentacao: 'Ampola 150 mg/3 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SOMENTE SG 5%. Ataque: 150 mg em 100 mL. Manutenção: 900 mg (6 amp) em 500 mL (1,8 mg/mL).',
      administracao: 'Ataque em 10–30 min. Manutenção: 1 mg/min por 6 h, depois 0,5 mg/min por 18 h. PCR (FV/TVSP): 300 mg EV em bolus, 2ª dose 150 mg.',
      estabilidade: '24 h após diluição em SG 5%. Para infusões > 2 h preferir frasco/equipo sem PVC.',
      obs: 'Concentrações > 2 mg/mL: preferir acesso central (flebite). Monitorar FC, PA e QT.',
      conc: { qtd: 150, u: 'mg', vol: 3 }, infusao: 'amiodarona' },

    { id: 'ampicilina', nome: 'Ampicilina', classe: 'Antibiótico (penicilina)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: '1 g em 5–10 mL de água destilada.',
      diluicao: 'SF 0,9%, 50–100 mL (menos estável em SG 5%).',
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
      obs: 'Vesicante. Incompatível com cálcio (precipita) e inativa catecolaminas — lavar o acesso antes e depois.',
      conc: { qtd: 1, u: 'mEq', vol: 1 } },

    { id: 'cefalotina', nome: 'Cefalotina', classe: 'Antibiótico (cefalosporina 1ª geração)',
      apresentacao: 'Frasco-ampola 1 g (pó)',
      reconstituicao: '1 g em 10 mL de água destilada.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV direto lento (3–5 min) ou infusão em 30 min.',
      estabilidade: '12 h em temperatura ambiente; 96 h refrigerado.',
      obs: 'Risco de flebite.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'cefazolina', nome: 'Cefazolina', classe: 'Antibiótico (cefalosporina 1ª geração)',
      apresentacao: 'Frasco-ampola 1 g (pó)',
      reconstituicao: '1 g em 10 mL de água destilada.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV direto lento (3–5 min) ou infusão em 30 min. Profilaxia cirúrgica: até 60 min antes da incisão.',
      estabilidade: '24 h em temperatura ambiente; 10 dias refrigerado (reconstituído).',
      obs: '',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'cefepima', nome: 'Cefepima', classe: 'Antibiótico (cefalosporina 4ª geração)',
      apresentacao: 'Frasco-ampola 1 g e 2 g (pó)',
      reconstituicao: '1 g em 10 mL de água destilada.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 30 min.',
      estabilidade: '24 h em temperatura ambiente; 7 dias refrigerado.',
      obs: 'Ajustar dose na insuficiência renal (neurotoxicidade).',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'ceftriaxona', nome: 'Ceftriaxona', classe: 'Antibiótico (cefalosporina 3ª geração)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: 'EV: 1 g em 10 mL de água destilada. IM: 1 g em 3,5 mL de lidocaína 1% (apresentação IM).',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 30 min ou EV direto lento (2–4 min).',
      estabilidade: '6 h em temperatura ambiente; 24 h refrigerado.',
      obs: 'INCOMPATÍVEL com soluções que contenham cálcio (Ringer lactato, gluconato de cálcio) — risco de precipitação. Nunca usar lidocaína por via EV.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'ciprofloxacino', nome: 'Ciprofloxacino', classe: 'Antibiótico (quinolona)',
      apresentacao: 'Bolsa 200 mg/100 mL e 400 mg/200 mL (2 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'EV em 60 min (infusão lenta reduz flebite).',
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
      diluicao: 'SEMPRE diluído em SF 0,9% ou SG 5%. Acesso periférico: em geral até 40 mEq/L (conforme protocolo).',
      administracao: 'Infusão em bomba. Velocidade usual ≤ 10 mEq/h em periférico; até 20 mEq/h em central com monitorização cardíaca.',
      estabilidade: 'Homogeneizar bem após adicionar ao soro.',
      obs: 'NUNCA administrar EV direto (risco de parada cardíaca). Dupla checagem. Armazenamento segregado.',
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
      administracao: 'EV direto lento (máx. 5 mg/min) em veia calibrosa.',
      estabilidade: 'Proteger da luz.',
      obs: 'Risco de depressão respiratória. IM tem absorção errática.',
      conc: { qtd: 10, u: 'mg', vol: 2 } },

    { id: 'dipirona', nome: 'Dipirona', classe: 'Analgésico / antitérmico',
      apresentacao: 'Ampola 1 g/2 mL (500 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'AD ou SF 0,9% 10–20 mL (EV lento) ou SF 100 mL.',
      administracao: 'EV lento: não exceder 1 mL/min (500 mg/min). Infusão em 100 mL: 15–30 min.',
      estabilidade: 'Usar logo após o preparo.',
      obs: 'Risco de hipotensão (infusão rápida) e agranulocitose. Verificar alergia.',
      conc: { qtd: 500, u: 'mg', vol: 1 } },

    { id: 'fenitoina', nome: 'Fenitoína', classe: 'Anticonvulsivante',
      apresentacao: 'Ampola 250 mg/5 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SOMENTE SF 0,9% (precipita em SG). Concentração final 1–10 mg/mL.',
      administracao: 'Máx. 50 mg/min em adultos (1–3 mg/kg/min em crianças). Usar filtro de linha 0,22 µm quando disponível. Lavar o acesso com SF antes e depois.',
      estabilidade: 'Administrar em até 1 h após diluição.',
      obs: 'Vesicante (síndrome da luva púrpura). Monitorar FC/PA/ECG durante a infusão.',
      conc: { qtd: 250, u: 'mg', vol: 5 } },

    { id: 'furosemida', nome: 'Furosemida', classe: 'Diurético de alça',
      apresentacao: 'Ampola 20 mg/2 mL (10 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser usada sem diluir ou diluída em SF 0,9%.',
      administracao: 'EV direto lento (1–2 min). Doses altas: máx. 4 mg/min.',
      estabilidade: 'Proteger da luz.',
      obs: 'Ototoxicidade em infusão rápida. Monitorar diurese, PA e potássio.',
      conc: { qtd: 20, u: 'mg', vol: 2 } },

    { id: 'gentamicina', nome: 'Gentamicina', classe: 'Antibiótico (aminoglicosídeo)',
      apresentacao: 'Ampola 80 mg/2 mL (40 mg/mL); também 20, 40, 160, 280 mg',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SF 0,9% ou SG 5%, 50–200 mL.',
      administracao: 'EV em 30–60 min. Também IM.',
      estabilidade: '24 h em temperatura ambiente.',
      obs: 'Nefro e ototóxica. Não misturar com betalactâmicos.',
      conc: { qtd: 80, u: 'mg', vol: 2 } },

    { id: 'gluconato-calcio', nome: 'Gluconato de cálcio 10%', classe: 'Eletrólito',
      apresentacao: 'Ampola 10 mL (100 mg/mL; 0,46 mEq/mL)',
      reconstituicao: 'Não necessita.',
      diluicao: 'SF 0,9% ou SG 5% (ex.: 10–20 mL em 100 mL).',
      administracao: 'EV lento (≥ 5–10 min no bolus) ou infusão; monitorização cardíaca.',
      estabilidade: '24 h após diluição.',
      obs: 'Incompatível com bicarbonato, fosfatos e ceftriaxona. Irritante: risco de necrose em extravasamento.',
      conc: { qtd: 1000, u: 'mg', vol: 10 } },

    { id: 'heparina', nome: 'Heparina sódica', classe: 'Anticoagulante — ALTA VIGILÂNCIA',
      apresentacao: 'Frasco 5.000 UI/mL (5 mL = 25.000 UI); ampola SC 5.000 UI/0,25 mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Infusão contínua usual: 25.000 UI (5 mL) + 245 mL SF 0,9% = 250 mL (100 UI/mL).',
      administracao: 'SC (profilaxia) ou EV contínua em bomba conforme nomograma (TTPa).',
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
      estabilidade: 'Solução para infusão: 24 h. Saturar o equipo (desprezar ~20 mL) por adsorção ao plástico.',
      obs: 'Dupla checagem. Monitorar glicemia capilar de 1/1 h na infusão contínua e potássio.',
      conc: { qtd: 100, u: 'UI', vol: 1 }, infusao: 'insulina' },

    { id: 'meropenem', nome: 'Meropenem', classe: 'Antibiótico (carbapenêmico)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: '1 g em 20 mL de água destilada (50 mg/mL).',
      diluicao: 'SF 0,9% (mais estável) ou SG 5%, 50–100 mL.',
      administracao: 'EV direto (3–5 min) ou infusão em 15–30 min. Infusão estendida em 3 h, se prescrita.',
      estabilidade: 'Em SF: ~ 3 h em temperatura ambiente; em SG, usar imediatamente.',
      obs: 'Diminui níveis de ácido valproico.',
      conc: { qtd: 1000, u: 'mg', vol: 20 } },

    { id: 'metoclopramida', nome: 'Metoclopramida', classe: 'Antiemético / procinético',
      apresentacao: 'Ampola 10 mg/2 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pode ser diluída em SF 0,9% ou SG 5%.',
      administracao: 'EV lento em no mínimo 3 min. Também IM.',
      estabilidade: '24 h após diluição. Proteger da luz.',
      obs: 'Risco de reações extrapiramidais.',
      conc: { qtd: 10, u: 'mg', vol: 2 } },

    { id: 'metronidazol', nome: 'Metronidazol', classe: 'Antimicrobiano',
      apresentacao: 'Bolsa 500 mg/100 mL (5 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Pronto para uso.',
      administracao: 'EV em 30–60 min.',
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
      diluicao: '1 mL (10 mg) + 9 mL de AD ou SF 0,9% = 10 mL (1 mg/mL).',
      administracao: 'EV lento em 4–5 min. Também SC/IM.',
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
      diluicao: 'SOMENTE SG 5%: 50 mg em 250 mL (200 mcg/mL).',
      administracao: 'Infusão contínua em bomba; PA invasiva recomendada.',
      estabilidade: 'FOTOSSENSÍVEL: proteger frasco e equipo da luz. Validade ~ 24 h.',
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
      estabilidade: 'Reconstituído: 4 h. Em SF: 12 h; em SG 5%: 6 h.',
      obs: '',
      conc: { qtd: 40, u: 'mg', vol: 10 } },

    { id: 'ondansetrona', nome: 'Ondansetrona', classe: 'Antiemético',
      apresentacao: 'Ampola 8 mg/4 mL (2 mg/mL) e 4 mg/2 mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Opcional: SF 0,9% ou SG 5%, 50 mL.',
      administracao: 'EV lento (2–5 min) ou infusão em 15 min. Também IM.',
      estabilidade: '24 h após diluição.',
      obs: 'Pode prolongar QT.',
      conc: { qtd: 8, u: 'mg', vol: 4 } },

    { id: 'oxacilina', nome: 'Oxacilina', classe: 'Antibiótico (penicilina)',
      apresentacao: 'Frasco-ampola 500 mg (pó)',
      reconstituicao: '500 mg em 5 mL de água destilada (100 mg/mL).',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 15–30 min (ou EV direto lento em 10 min).',
      estabilidade: 'Diluída: 6 h em temperatura ambiente.',
      obs: 'Risco de flebite. Perguntar sobre alergia a penicilinas.',
      conc: { qtd: 500, u: 'mg', vol: 5 } },

    { id: 'ocitocina', nome: 'Ocitocina', classe: 'Uterotônico — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 5 UI/mL',
      reconstituicao: 'Solução pronta.',
      diluicao: 'Indução/condução: 5 UI em 500 mL de SG 5% ou SF 0,9% (10 mUI/mL).',
      administracao: 'Infusão em bomba, titulada em mUI/min conforme protocolo; pós-parto conforme prescrição.',
      estabilidade: '24 h após diluição. Refrigerar a ampola (2–8 °C).',
      obs: 'Monitorar dinâmica uterina e BCF (risco de taquissistolia).',
      conc: { qtd: 5, u: 'UI', vol: 1 }, infusao: 'ocitocina' },

    { id: 'penicilina-cristalina', nome: 'Penicilina G cristalina', classe: 'Antibiótico (penicilina)',
      apresentacao: 'Frasco-ampola 5.000.000 UI (pó)',
      reconstituicao: '5.000.000 UI em 8 mL de AD → volume final 10 mL (o pó ocupa ~2 mL) = 500.000 UI/mL.',
      diluicao: 'SF 0,9% ou SG 5%, 50–100 mL.',
      administracao: 'EV em 30–60 min.',
      estabilidade: 'Reconstituído: 24 h refrigerado. Diluído: usar em até 24 h refrigerado / conforme fabricante.',
      obs: 'Use a calculadora "Penicilina cristalina" para o volume a aspirar. Perguntar sobre alergia.',
      conc: { qtd: 5000000, u: 'UI', vol: 10 } },

    { id: 'pipe-tazo', nome: 'Piperacilina + Tazobactam', classe: 'Antibiótico (penicilina + inibidor)',
      apresentacao: 'Frasco-ampola 4,5 g (4 g + 0,5 g) e 2,25 g',
      reconstituicao: '4,5 g em 20 mL de AD ou SF 0,9%.',
      diluicao: 'SF 0,9% ou SG 5%, 50–150 mL.',
      administracao: 'EV em 30 min; infusão estendida em 4 h, se prescrita.',
      estabilidade: '24 h em temperatura ambiente; 48 h refrigerado.',
      obs: 'Compatibilidade com Ringer lactato depende do fabricante. Não misturar com aminoglicosídeos.',
      conc: { qtd: 4500, u: 'mg', vol: 20 } },

    { id: 'sulfato-magnesio', nome: 'Sulfato de magnésio 50%', classe: 'Eletrólito / anticonvulsivante — ALTA VIGILÂNCIA',
      apresentacao: 'Ampola 10 mL (500 mg/mL; 4 mEq/mL). Também 10% (100 mg/mL)',
      reconstituicao: 'Não necessita.',
      diluicao: 'Sempre diluir. Ex.: pré-eclâmpsia (Zuspan) ataque 4 g = 8 mL de 50% + 12 mL AD, EV em 15–20 min; manutenção 1 g/h (ex.: 10 mL a 50% + 490 mL SG 5% = 1 g/100 mL a 100 mL/h).',
      administracao: 'Infusão em bomba conforme protocolo.',
      estabilidade: '24 h após diluição.',
      obs: 'Monitorar reflexo patelar, FR (≥ 16 irpm) e diurese (≥ 25 mL/h). Antídoto: gluconato de cálcio 10%.',
      conc: { qtd: 5000, u: 'mg', vol: 10 } },

    { id: 'tramadol', nome: 'Tramadol', classe: 'Opioide',
      apresentacao: 'Ampola 100 mg/2 mL (50 mg/mL)',
      reconstituicao: 'Solução pronta.',
      diluicao: 'SF 0,9% ou SG 5%, 100 mL.',
      administracao: 'Infusão em 20–30 min (ou EV direto lento em 2–3 min).',
      estabilidade: '24 h após diluição.',
      obs: 'Náusea e vômitos frequentes. Reduz limiar convulsivo.',
      conc: { qtd: 100, u: 'mg', vol: 2 } },

    { id: 'vancomicina', nome: 'Vancomicina', classe: 'Antibiótico (glicopeptídeo)',
      apresentacao: 'Frasco-ampola 500 mg e 1 g (pó)',
      reconstituicao: '500 mg em 10 mL de AD (50 mg/mL); 1 g em 20 mL.',
      diluicao: 'SF 0,9% ou SG 5% com concentração final ≤ 5 mg/mL (500 mg em ≥ 100 mL; 1 g em ≥ 200 mL).',
      administracao: 'EV em no mínimo 60 min (máx. 10 mg/min).',
      estabilidade: 'Diluída: 24 h em temperatura ambiente; 14 dias refrigerada (conforme fabricante).',
      obs: 'Infusão rápida causa "síndrome do homem vermelho". Nefrotóxica: vancocinemia conforme protocolo. Vesicante.',
      conc: { qtd: 500, u: 'mg', vol: 10 } }
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
      solucao: '1 amp (5 UI) em 500 mL de SG 5% (10 mUI/mL)', doseUnit: 'mUI/min', faixa: [1, 20], dose: 2 }
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

  root.DATA = { DRUGS: DRUGS, INFUSIONS: INFUSIONS, ELECTROLYTES: ELECTROLYTES, SCALES: SCALES };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DATA;
})(typeof window !== 'undefined' ? window : this);
