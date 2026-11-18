/*
 * EnfCalc — guia de antimicrobianos por perfil de resistência (texto próprio).
 * Base: IDSA Guidance on the Treatment of Antimicrobial-Resistant Gram-Negative Infections (2024),
 * IDSA MRSA (2011), IDSA/SHEA C. difficile (2021), Anvisa (prevenção de IRAS), BrCAST.
 * Uso: apoio à equipe de enfermagem para entender o antibiograma, as precauções e a administração.
 * A escolha do antimicrobiano, a dose e a duração são do médico assistente com a CCIH/SCIH.
 * Opções: [idDoApp | null, nome exibido, observação]
 */
(function (root) {
  'use strict';

  var BACTERIAS = [
    { id: 'saureus', icon: '🟣', nome: 'Staphylococcus aureus', ex: 'Pele, partes moles, cateter, bacteremia, pneumonia',
      perguntas: [{ id: 'oxa', txt: 'Resistente à oxacilina (ou à cefoxitina na triagem)?' }, { id: 'vanco', txt: 'Resistente ou com sensibilidade reduzida à vancomicina (VISA/VRSA)?' }] },
    { id: 'enterococo', icon: '🔗', nome: 'Enterococcus (faecalis / faecium)', ex: 'ITU, intra-abdominal, endocardite, cateter',
      perguntas: [{ id: 'amp', txt: 'Resistente à ampicilina?' }, { id: 'vanco', txt: 'Resistente à vancomicina (VRE)?' }] },
    { id: 'enterobac', icon: '🦠', nome: 'Enterobactérias', ex: 'E. coli, Klebsiella, Proteus, Enterobacter, Serratia, Citrobacter…',
      perguntas: [{ id: 'ampc', txt: 'É Enterobacter cloacae, Klebsiella aerogenes, Citrobacter freundii, Serratia ou Morganella (AmpC induzível)?' },
        { id: 'c3g', txt: 'Resistente a ceftriaxona/cefotaxima (sugere ESBL)?' }, { id: 'carba', txt: 'Resistente a carbapenêmico (meropenem, imipenem ou ertapenem)?' },
        { id: 'mec', txt: 'Mecanismo de resistência ao carbapenêmico informado pelo laboratório', tipo: 'sel', se: 'carba',
          opts: [['', 'Não informado'], ['kpc', 'KPC'], ['mbl', 'Metalo-betalactamase (NDM, VIM, IMP)'], ['oxa48', 'OXA-48']] }] },
    { id: 'pseudo', icon: '💧', nome: 'Pseudomonas aeruginosa', ex: 'Pneumonia associada à ventilação, ITU por sonda, feridas, queimados',
      perguntas: [{ id: 'carba', txt: 'Resistente a carbapenêmico (meropenem/imipenem)?' },
        { id: 'dtr', txt: 'Resistente TAMBÉM a pipe-tazo, cefepima, ceftazidima, aztreonam e quinolonas (DTR — difícil de tratar)?', se: 'carba' }] },
    { id: 'acineto', icon: '🧫', nome: 'Acinetobacter baumannii', ex: 'Pneumonia associada à ventilação, bacteremia, feridas em UTI',
      perguntas: [{ id: 'carba', txt: 'Resistente a carbapenêmico (CRAB)?' }] },
    { id: 'steno', icon: '🌿', nome: 'Stenotrophomonas maltophilia', ex: 'Pacientes em ventilação, uso prévio de carbapenêmico', perguntas: [] },
    { id: 'cdiff', icon: '💩', nome: 'Clostridioides difficile', ex: 'Diarreia associada a antibiótico (≥ 3 evacuações líquidas em 24 h)', perguntas: [] }
  ];

  var PRECAUCAO = {
    padrao: ['Precaução padrão', 'Higiene das mãos nos 5 momentos e EPI conforme o risco de exposição. Siga a orientação da CCIH, que pode indicar precaução de contato.'],
    contato: ['Precaução de CONTATO', 'Quarto privativo ou coorte; luvas e avental ao entrar no quarto; estetoscópio, termômetro e esfigmomanômetro exclusivos; sinalização na porta e no prontuário; avisar o setor de destino no transporte; limpeza concorrente reforçada. Notificar a CCIH.'],
    esporo: ['Precaução de CONTATO + esporos', 'Como na precaução de contato, e higiene das mãos com ÁGUA E SABÃO (o álcool não elimina os esporos); limpeza do ambiente com hipoclorito ou produto esporicida; manter até 48 h sem diarreia ou conforme a CCIH.']
  };

  var PERFIS = {
    mssa: { nome: 'S. aureus sensível à oxacilina (MSSA)', prec: 'padrao',
      ativos: [['oxacilina', 'Oxacilina', 'Preferida em bacteremia e infecções graves.'], ['cefazolina', 'Cefazolina', 'Alternativa equivalente, mais prática.'], ['cefalexina', 'Cefalexina', 'Via oral, infecções leves de pele e partes moles.'], ['clindamicina-oral', 'Clindamicina', 'Oral, se sensível no antibiograma.']],
      evitar: [['vancomicina', 'Vancomicina', 'Inferior aos betalactâmicos no MSSA; reservar para alergia grave.']],
      notas: ['Betalactâmico é o tratamento de escolha quando o S. aureus é sensível à oxacilina.'] },
    mrsa: { nome: 'S. aureus resistente à oxacilina (MRSA)', prec: 'contato',
      ativos: [['vancomicina', 'Vancomicina', 'Padrão em infecções graves; monitorar nível sérico e função renal.'], ['linezolida', 'Linezolida', 'Pneumonia e pele/partes moles; EV ou oral.'],
        ['daptomicina', 'Daptomicina', 'Bacteremia e endocardite. NÃO usar em pneumonia (inativada no pulmão).'], ['teicoplanina', 'Teicoplanina', 'Alternativa aos glicopeptídeos.'],
        ['ceftarolina', 'Ceftarolina', 'Única cefalosporina com ação anti-MRSA.'], ['smx-tmp-oral', 'Sulfametoxazol + trimetoprima', 'Oral, pele e partes moles, se sensível.'],
        ['doxiciclina', 'Doxiciclina', 'Oral, pele e partes moles, se sensível.'], ['clindamicina-oral', 'Clindamicina', 'Se sensível (atenção à resistência induzível — teste D).']],
      evitar: [['oxacilina', 'Oxacilina e cefazolina', 'Inativas no MRSA.'], [null, 'Demais betalactâmicos (amoxi-clav, ceftriaxona, pipe-tazo, carbapenêmicos)', 'Inativos no MRSA (exceto ceftarolina).']],
      notas: ['Descolonização e banho com clorexidina conforme o protocolo da CCIH.'] },
    vrsa: { nome: 'S. aureus com resistência ou sensibilidade reduzida à vancomicina (VISA/VRSA)', prec: 'contato',
      ativos: [['linezolida', 'Linezolida', ''], ['daptomicina', 'Daptomicina', 'Pode haver resistência cruzada no VISA: conferir o antibiograma.'], ['ceftarolina', 'Ceftarolina', ''], ['smx-tmp', 'Sulfametoxazol + trimetoprima', 'Se sensível.']],
      evitar: [['vancomicina', 'Vancomicina e teicoplanina', 'Falha terapêutica.']],
      notas: ['Achado raro: confirmar com o laboratório e comunicar imediatamente a CCIH (notificação).'] },
    'ente-s': { nome: 'Enterococcus sensível à ampicilina', prec: 'padrao',
      ativos: [['ampicilina', 'Ampicilina', 'Droga de escolha.'], ['amoxicilina', 'Amoxicilina', 'Via oral.'], ['nitrofurantoina', 'Nitrofurantoína', 'Cistite.'], ['vancomicina', 'Vancomicina', 'Se alergia grave à penicilina.'], ['gentamicina', 'Gentamicina', 'Apenas em associação (sinergismo) na endocardite, conforme protocolo.']],
      evitar: [[null, 'Cefalosporinas (todas)', 'Resistência intrínseca do Enterococcus.'], ['clindamicina', 'Clindamicina e sulfametoxazol-trimetoprima', 'Não confiáveis contra Enterococcus.']],
      notas: ['Endocardite por E. faecalis: ampicilina associada a ceftriaxona ou gentamicina, conforme a equipe.'] },
    'ente-ampr': { nome: 'Enterococcus resistente à ampicilina, sensível à vancomicina (em geral E. faecium)', prec: 'padrao',
      ativos: [['vancomicina', 'Vancomicina', ''], ['teicoplanina', 'Teicoplanina', ''], ['linezolida', 'Linezolida', ''], ['daptomicina', 'Daptomicina', 'Doses altas, conforme protocolo.']],
      evitar: [['ampicilina', 'Ampicilina e amoxicilina', 'Resistentes.'], [null, 'Cefalosporinas', 'Resistência intrínseca.']], notas: [] },
    vre: { nome: 'Enterococcus resistente à vancomicina (VRE)', prec: 'contato',
      ativos: [['linezolida', 'Linezolida', 'Opção de escolha em muitas infecções.'], ['daptomicina', 'Daptomicina', 'Bacteremia (doses altas); não em pneumonia.'], ['tigeciclina', 'Tigeciclina', 'Intra-abdominal; não usar em bacteremia.'],
        ['nitrofurantoina', 'Nitrofurantoína', 'Cistite.'], ['fosfomicina', 'Fosfomicina', 'Cistite.'], ['ampicilina', 'Ampicilina', 'Somente se o VRE for sensível à ampicilina (alguns E. faecalis).']],
      evitar: [['vancomicina', 'Vancomicina', 'Resistente.'], ['teicoplanina', 'Teicoplanina', 'Em geral resistente (fenótipo VanA).'], [null, 'Cefalosporinas', 'Resistência intrínseca.']],
      notas: ['Rastrear contatos conforme a CCIH (swab retal).'] },
    'ent-s': { nome: 'Enterobactéria sem resistência relevante', prec: 'padrao',
      ativos: [['ceftriaxona', 'Ceftriaxona', 'Infecções moderadas a graves, se sensível.'], ['amoxi-clav', 'Amoxicilina + clavulanato', 'Se sensível.'], ['ciprofloxacino', 'Ciprofloxacino', 'Se sensível.'],
        ['smx-tmp-oral', 'Sulfametoxazol + trimetoprima', 'Se sensível.'], ['nitrofurantoina', 'Nitrofurantoína', 'Cistite (E. coli, Klebsiella).'], ['fosfomicina', 'Fosfomicina', 'Cistite (principalmente E. coli).'], ['cefalexina', 'Cefalexina', 'Cistite, se sensível.']],
      evitar: [[null, 'Nitrofurantoína e polimixinas para Proteus, Morganella, Providencia e Serratia', 'Resistência intrínseca dessas espécies.']],
      notas: ['Usar o antibiótico de menor espectro ativo no antibiograma (descalonamento).'] },
    ampc: { nome: 'Enterobactéria com AmpC induzível', prec: 'padrao',
      ativos: [['cefepima', 'Cefepima', 'Preferida, se sensível no antibiograma.'], ['meropenem', 'Meropenem / ertapenem', 'Infecções graves ou se cefepima sem boa sensibilidade.'], ['ciprofloxacino', 'Ciprofloxacino / levofloxacino', 'Se sensível.'], ['smx-tmp', 'Sulfametoxazol + trimetoprima', 'Se sensível.']],
      evitar: [['ceftriaxona', 'Ceftriaxona, ceftazidima e pipe-tazo', 'Em infecções graves, risco de surgir resistência durante o tratamento, mesmo com "sensível" no antibiograma.'], ['amoxi-clav', 'Amoxi-clav, cefazolina e cefalexina', 'Resistência intrínseca.']],
      notas: ['Nas infecções leves (ex.: cistite), ceftriaxona pode ser aceitável quando sensível.'] },
    esbl: { nome: 'Enterobactéria produtora de ESBL', prec: 'contato',
      ativos: [['meropenem', 'Meropenem / imipenem', 'Preferidos em infecções graves e bacteremia.'], ['ertapenem', 'Ertapenem', 'Dose única diária; útil fora da UTI e em atenção domiciliar.'],
        ['nitrofurantoina', 'Nitrofurantoína', 'Cistite.'], ['fosfomicina', 'Fosfomicina', 'Cistite por E. coli.'], ['ciprofloxacino', 'Ciprofloxacino / levofloxacino', 'Se sensível (ITU, transição oral).'],
        ['smx-tmp-oral', 'Sulfametoxazol + trimetoprima', 'Se sensível.'], ['amicacina', 'Amicacina / gentamicina', 'ITU, se sensível.']],
      evitar: [['ceftriaxona', 'Ceftriaxona, cefepima, ceftazidima e aztreonam', 'Hidrolisados pela ESBL.'], ['pipe-tazo', 'Piperacilina + tazobactam', 'Não recomendada em infecção grave por ESBL, mesmo se "sensível".']],
      notas: ['A precaução de contato para ESBL varia entre instituições: siga a CCIH.'] },
    kpc: { nome: 'Enterobactéria resistente a carbapenêmico — KPC', prec: 'contato',
      ativos: [['ceftazidima-avibactam', 'Ceftazidima + avibactam', 'Opção preferencial.'], [null, 'Meropenem + vaborbactam', 'Disponibilidade variável no Brasil.'], ['c-cilastatina-imipenem-relebactam', 'Imipenem + relebactam', 'Alternativa.'],
        ['polimixina-b', 'Polimixina B', 'Alternativa de maior toxicidade, geralmente em associação.'], ['amicacina', 'Amicacina / gentamicina', 'Cistite, se sensível (dose única).']],
      evitar: [['meropenem', 'Carbapenêmico isolado', 'Resistente.'], [null, 'Demais cefalosporinas e penicilinas', 'Resistentes.']],
      notas: ['Mecanismo mais frequente no Brasil.', 'Isolamento, coorte, rastreio de contatos e notificação conforme a CCIH.'] },
    mbl: { nome: 'Enterobactéria resistente a carbapenêmico — metalo-betalactamase (NDM, VIM, IMP)', prec: 'contato',
      ativos: [['ceftazidima-avibactam', 'Ceftazidima + avibactam ASSOCIADA a aztreonam', 'Os dois juntos (o aztreonam escapa da metalo; o avibactam protege o aztreonam).'], ['aztreonam', 'Aztreonam', 'Sempre com ceftazidima-avibactam neste perfil.'], [null, 'Cefiderocol', 'Disponibilidade limitada no Brasil.']],
      evitar: [['ceftazidima-avibactam', 'Ceftazidima-avibactam sozinha', 'Inativa contra metalo-betalactamases.'], ['c-cilastatina-imipenem-relebactam', 'Imipenem-relebactam e meropenem-vaborbactam', 'Inativos contra metalo-betalactamases.']],
      notas: ['Administrar ceftazidima-avibactam e aztreonam no mesmo horário, conforme a prescrição.', 'Notificação e isolamento rigoroso: perfil de alto risco de disseminação.'] },
    oxa48: { nome: 'Enterobactéria resistente a carbapenêmico — OXA-48', prec: 'contato',
      ativos: [['ceftazidima-avibactam', 'Ceftazidima + avibactam', 'Opção preferencial.'], [null, 'Cefiderocol', 'Alternativa; disponibilidade limitada.']],
      evitar: [[null, 'Meropenem-vaborbactam e imipenem-relebactam', 'Atividade pouco confiável contra OXA-48.']], notas: [] },
    cre: { nome: 'Enterobactéria resistente a carbapenêmico — mecanismo não informado', prec: 'contato',
      ativos: [['ceftazidima-avibactam', 'Ceftazidima + avibactam', 'Frequentemente usada enquanto se aguarda o mecanismo, considerando a epidemiologia local (KPC é o mais comum no Brasil).'],
        ['aztreonam', 'Aztreonam (em associação)', 'Considerado quando há suspeita de metalo-betalactamase (NDM).'], ['polimixina-b', 'Polimixina B', 'Alternativa, geralmente em associação.']],
      evitar: [['meropenem', 'Carbapenêmico isolado', 'Resistente.']],
      notas: ['Peça ao laboratório o teste do mecanismo (KPC, NDM, OXA-48): muda a escolha do antibiótico.'] },
    'psa-s': { nome: 'Pseudomonas aeruginosa sensível', prec: 'padrao',
      ativos: [['pipe-tazo', 'Piperacilina + tazobactam', ''], ['cefepima', 'Cefepima', ''], ['ceftazidima', 'Ceftazidima', ''], ['meropenem', 'Meropenem / imipenem', 'Reservar quando outras opções não servirem.'],
        ['aztreonam', 'Aztreonam', 'Alternativa em alergia a betalactâmicos.'], ['ciprofloxacino', 'Ciprofloxacino / levofloxacino', 'Única classe oral eficaz.'], ['amicacina', 'Amicacina', 'Em geral em associação.']],
      evitar: [['ceftriaxona', 'Ceftriaxona, cefazolina, ertapenem, amoxi-clav, tigeciclina e sulfametoxazol-trimetoprima', 'Sem atividade contra Pseudomonas.']],
      notas: ['Infusão estendida de betalactâmicos é comum para Pseudomonas: siga o protocolo da instituição.'] },
    'psa-cr': { nome: 'Pseudomonas resistente a carbapenêmico (sensível a outros betalactâmicos)', prec: 'contato',
      ativos: [['pipe-tazo', 'Piperacilina + tazobactam', 'Se sensível — preferir em vez de carbapenêmico.'], ['cefepima', 'Cefepima', 'Se sensível.'], ['ceftazidima', 'Ceftazidima', 'Se sensível.']],
      evitar: [['meropenem', 'Meropenem / imipenem', 'Resistentes.']], notas: ['Em geral com infusão estendida, conforme o protocolo.'] },
    'psa-dtr': { nome: 'Pseudomonas difícil de tratar (DTR)', prec: 'contato',
      ativos: [['c-ceftolozana-tazobactam', 'Ceftolozano + tazobactam', 'Opção preferencial.'], ['ceftazidima-avibactam', 'Ceftazidima + avibactam', ''], ['c-cilastatina-imipenem-relebactam', 'Imipenem + relebactam', ''],
        [null, 'Cefiderocol', 'Disponibilidade limitada.'], ['polimixina-b', 'Polimixina B', 'Alternativa; cistite por Pseudomonas: aminoglicosídeo se sensível.'], ['amicacina', 'Amicacina', 'Cistite, se sensível.']],
      evitar: [['pipe-tazo', 'Pipe-tazo, cefepima, ceftazidima, aztreonam, carbapenêmicos e quinolonas', 'Resistentes por definição.']], notas: [] },
    'acb-s': { nome: 'Acinetobacter baumannii sensível a carbapenêmico', prec: 'contato',
      ativos: [['ampi-sulbactam', 'Ampicilina + sulbactam', 'O sulbactam tem ação própria contra Acinetobacter.'], ['meropenem', 'Meropenem / imipenem', ''], ['amicacina', 'Amicacina', 'Se sensível.']],
      evitar: [['ertapenem', 'Ertapenem', 'Sem atividade contra Acinetobacter.']], notas: ['Muitas CCIH mantêm contato para qualquer Acinetobacter em UTI.'] },
    crab: { nome: 'Acinetobacter resistente a carbapenêmico (CRAB)', prec: 'contato',
      ativos: [['ampi-sulbactam', 'Ampicilina + sulbactam em dose alta', 'Base do tratamento, em associação a outro agente ativo.'], ['polimixina-b', 'Polimixina B', 'Em associação (não usar sozinha).'],
        ['c-minociclina', 'Minociclina', 'Em associação.'], ['tigeciclina', 'Tigeciclina', 'Em associação; não usar em bacteremia isolada.'], [null, 'Cefiderocol / sulbactam-durlobactam', 'Disponibilidade limitada no Brasil.']],
      evitar: [['ceftazidima-avibactam', 'Ceftazidima-avibactam, meropenem-vaborbactam e ceftolozano-tazobactam', 'Inativos contra CRAB.'], ['meropenem', 'Carbapenêmico isolado', 'Resistente.']],
      notas: ['Alta transmissão ambiental: reforçar limpeza de superfícies e equipamentos.'] },
    steno: { nome: 'Stenotrophomonas maltophilia', prec: 'padrao',
      ativos: [['smx-tmp', 'Sulfametoxazol + trimetoprima', 'Opção preferencial.'], ['levofloxacino', 'Levofloxacino', 'Se sensível.'], ['c-minociclina', 'Minociclina', ''], [null, 'Cefiderocol', 'Disponibilidade limitada.'],
        ['ceftazidima-avibactam', 'Ceftazidima-avibactam + aztreonam', 'Em infecções graves, conforme a CCIH.']],
      evitar: [['meropenem', 'Carbapenêmicos', 'Resistência intrínseca (metalo-betalactamase própria).'], ['amicacina', 'Aminoglicosídeos', 'Resistência intrínseca.']],
      notas: ['Frequentemente coloniza a via aérea: confirmar se é infecção antes de tratar.'] },
    cdiff: { nome: 'Clostridioides difficile', prec: 'esporo',
      ativos: [['vancomicina', 'Vancomicina por VIA ORAL', 'Primeira linha (a forma EV não age no intestino).'], [null, 'Fidaxomicina', 'Primeira linha onde disponível.'], ['metronidazol-oral', 'Metronidazol oral', 'Somente se as opções acima não estiverem disponíveis, em casos não graves.']],
      evitar: [['vancomicina', 'Vancomicina por via EV', 'Não chega ao cólon.'], ['loperamida', 'Loperamida e outros antiperistálticos', 'Podem agravar o quadro.']],
      notas: ['Suspender o antibiótico desencadeante quando possível e rever o uso de IBP.', 'Não testar paciente assintomático nem repetir o teste para controle de cura.'] }
  };

  // Como aplicar (enfermagem). Tempos conforme bulas; protocolos institucionais podem usar infusão estendida.
  var APLICACAO = {
    oxacilina: 'EV em 15–30 min (ou bolus lento); flebite frequente — rodiziar acesso.',
    cefazolina: 'EV em bolus lento (3–5 min) ou infusão de 15–30 min.',
    cefalexina: 'VO, com ou sem alimento; completar o tratamento.',
    'clindamicina-oral': 'VO com copo cheio de água; atenção a diarreia (C. difficile).',
    clindamicina: 'EV diluída, nunca em bolus (máx. 30 mg/min); diarreia: comunicar.',
    vancomicina: 'EV diluída, em ≥ 60 min por grama (máx. 10 mg/min): infusão rápida causa a síndrome do "homem vermelho". Nível sérico (vale ou AUC) e creatinina conforme protocolo. Via oral apenas para C. difficile.',
    linezolida: 'EV em 30–120 min (bolsa pronta, não diluir) ou VO na mesma dose. Hemograma (plaquetas) se > 2 semanas; interação com ISRS (síndrome serotoninérgica).',
    daptomicina: 'EV em bolus de 2 min ou infusão de 30 min; incompatível com soro glicosado. CPK semanal; suspender estatina conforme orientação.',
    teicoplanina: 'EV em bolus (3–5 min) ou infusão de 30 min, ou IM. Dose de ataque nos primeiros dias.',
    ceftarolina: 'EV em 5–60 min, conforme a bula/protocolo.',
    'smx-tmp': 'EV bem diluída (ex.: cada ampola em 125 mL de SG 5%) em 60–90 min; hidratar; observar exantema e potássio.',
    'smx-tmp-oral': 'VO com bastante água; observar exantema.',
    doxiciclina: 'VO com copo cheio de água, sem deitar por 30 min; separar de cálcio, ferro e antiácidos.',
    ampicilina: 'EV em bolus lento (3–5 min) ou infusão; estabilidade curta após reconstituir — preparar perto do horário.',
    amoxicilina: 'VO; completar o tratamento.',
    nitrofurantoina: 'VO com alimento; urina pode escurecer.',
    fosfomicina: 'Sachê 3 g dissolvido em meio copo de água, em jejum, de preferência à noite após urinar; dose única na cistite.',
    gentamicina: 'EV em 30–60 min, em geral dose única diária; creatinina, nível sérico e audição.',
    amicacina: 'EV em 30–60 min, em geral dose única diária; creatinina, nível sérico e audição.',
    tigeciclina: 'EV em 30–60 min; náuseas e vômitos frequentes.',
    ceftriaxona: 'EV em bolus lento ou infusão de 30 min, ou IM (com lidocaína, nunca EV com lidocaína). Não infundir com soluções com cálcio.',
    'amoxi-clav': 'VO com alimento (reduz efeitos gastrointestinais); EV em bolus lento ou infusão de 30 min.',
    ciprofloxacino: 'EV em 60 min (bolsa pronta); VO separada de cálcio, ferro e antiácidos.',
    levofloxacino: 'EV em 60–90 min; VO na mesma dose (excelente biodisponibilidade).',
    cefepima: 'EV em 30 min ou infusão estendida conforme protocolo; ajuste renal (risco de neurotoxicidade).',
    meropenem: 'EV em 15–30 min ou infusão estendida (3 h) conforme protocolo; estabilidade curta em temperatura ambiente — conferir o tempo após o preparo.',
    ertapenem: 'EV em 30 min, 1x/dia, ou IM; não diluir em soro glicosado.',
    'pipe-tazo': 'EV em 30 min ou infusão estendida (4 h) conforme protocolo; incompatível em Y com aminoglicosídeos.',
    ceftazidima: 'EV em bolus lento ou infusão de 30 min; estendida conforme protocolo.',
    'ceftazidima-avibactam': 'EV em 2 horas, a cada 8 h; ajuste renal.',
    'c-cilastatina-imipenem-relebactam': 'EV em 30 min, a cada 6 h; ajuste renal.',
    'c-ceftolozana-tazobactam': 'EV em 1 hora, a cada 8 h; ajuste renal.',
    aztreonam: 'EV em bolus lento (3–5 min) ou infusão de 20–60 min.',
    'polimixina-b': 'EV em 60 min ou mais, com dose de ataque; prescrita em UI — conferir unidade. Nefrotoxicidade e neurotoxicidade (formigamento, fraqueza).',
    'ampi-sulbactam': 'EV em bolus lento (10–15 min) ou infusão de 15–30 min; em CRAB, doses altas com infusão prolongada conforme protocolo.',
    'c-minociclina': 'VO ou EV conforme a apresentação disponível; separar de cálcio e ferro.',
    'metronidazol-oral': 'VO com alimento; evitar álcool.',
    loperamida: '—'
  };

  var GERAL = ['Colher culturas (hemoculturas, urina, secreção) ANTES da 1ª dose, sem atrasar o antibiótico em sepse — 1ª dose em até 1 hora.',
    'Respeitar rigorosamente os horários: atrasos reduzem o efeito dos antibióticos tempo-dependentes (betalactâmicos).',
    'Conferir compatibilidade em Y e o tempo de infusão de cada droga (ver ficha).', 'Ajustar à função renal: avisar se a creatinina ou a diurese mudarem.',
    'Reavaliar em 48–72 h com o resultado das culturas (descalonar para o menor espectro).', 'Registrar e comunicar reações adversas; notificar germes multirresistentes à CCIH.'];

  function perfil(bact, r) {
    r = r || {};
    switch (bact) {
      case 'saureus': return r.vanco ? 'vrsa' : r.oxa ? 'mrsa' : 'mssa';
      case 'enterococo': return r.vanco ? 'vre' : r.amp ? 'ente-ampr' : 'ente-s';
      case 'enterobac':
        if (r.carba) return r.mec === 'kpc' ? 'kpc' : r.mec === 'mbl' ? 'mbl' : r.mec === 'oxa48' ? 'oxa48' : 'cre';
        if (r.c3g) return 'esbl';
        return r.ampc ? 'ampc' : 'ent-s';
      case 'pseudo': return r.carba ? (r.dtr ? 'psa-dtr' : 'psa-cr') : 'psa-s';
      case 'acineto': return r.carba ? 'crab' : 'acb-s';
      case 'steno': return 'steno';
      case 'cdiff': return 'cdiff';
    }
    return null;
  }


  // Tipo (sítio) de infecção: indicação empírica usual antes da cultura e regras por sítio
  var SITIOS = [
    { id: 'cistite', icon: '🚽', nome: 'Infecção urinária baixa (cistite)', germes: 'E. coli, Klebsiella, Proteus, Enterococcus',
      empirico: [['nitrofurantoina', 'Nitrofurantoína', 'Primeira linha.'], ['fosfomicina', 'Fosfomicina', 'Dose única.'], ['cefalexina', 'Cefalexina', 'Alternativa; opção na gestação.']],
      notas: ['Colher urocultura (jato médio ou pelo dispositivo da sonda — nunca da bolsa).', 'Bacteriúria sem sintomas em geral não se trata (exceto gestantes e antes de procedimento urológico).'] },
    { id: 'pielo', icon: '🫘', nome: 'Pielonefrite / ITU complicada', germes: 'Enterobactérias; Enterococcus; Pseudomonas se sonda/hospitalar',
      empirico: [['ceftriaxona', 'Ceftriaxona', 'Internação.'], ['ciprofloxacino', 'Ciprofloxacino / levofloxacino', 'Se a resistência local for baixa.'], ['amicacina', 'Amicacina / gentamicina', 'Alternativa.'], ['meropenem', 'Carbapenêmico', 'Se sepse e risco de ESBL.']],
      notas: ['Urocultura e hemoculturas antes da 1ª dose.', 'Sinais de sepse: acionar o protocolo de sepse.'] },
    { id: 'pac', icon: '🫁', nome: 'Pneumonia adquirida na comunidade', germes: 'Pneumococo, H. influenzae, atípicos (Mycoplasma, Legionella)',
      empirico: [['amoxicilina', 'Amoxicilina', 'Ambulatorial sem comorbidade.'], ['amoxi-clav', 'Amoxicilina + clavulanato', 'Com comorbidades, associada a macrolídeo.'],
        ['ceftriaxona', 'Ceftriaxona', 'Internação, associada a azitromicina.'], ['azitromicina-ev', 'Azitromicina', 'Cobertura de atípicos.'], ['levofloxacino', 'Levofloxacino', 'Alternativa (quinolona respiratória).']],
      notas: ['Hemoculturas e escarro nos internados graves, sem atrasar o antibiótico.', 'Ver também o protocolo de pneumonia e a escala CURB-65.'] },
    { id: 'pav', icon: '🫁', nome: 'Pneumonia hospitalar / associada à ventilação', germes: 'Pseudomonas, Klebsiella, Acinetobacter, S. aureus (MRSA)',
      empirico: [['pipe-tazo', 'Piperacilina + tazobactam', 'Antipseudomonas.'], ['cefepima', 'Cefepima', 'Antipseudomonas.'], ['meropenem', 'Meropenem', 'Se risco de ESBL ou multirresistência.'],
        ['vancomicina', 'Vancomicina ou linezolida', 'Associar se risco de MRSA.'], ['amicacina', 'Amicacina', 'Segundo antipseudomonas se alto risco, em associação.']],
      notas: ['A escolha depende do perfil microbiológico da UTI (CCIH).', 'Aspirado traqueal antes da 1ª dose; bundle de prevenção de PAV.'] },
    { id: 'pele', icon: '🩹', nome: 'Pele e partes moles (celulite, abscesso, ferida)', germes: 'Streptococcus, S. aureus (inclusive MRSA comunitário)',
      empirico: [['cefalexina', 'Cefalexina', 'Celulite não purulenta, ambulatorial.'], ['cefazolina', 'Cefazolina / oxacilina', 'Celulite internada.'], ['smx-tmp-oral', 'Sulfametoxazol + trimetoprima / doxiciclina', 'Abscesso ou celulite purulenta (MRSA comunitário), junto da drenagem.'],
        ['clindamicina', 'Clindamicina', 'Alergia a betalactâmico.'], ['vancomicina', 'Vancomicina + pipe-tazo', 'Infecção necrotizante ou grave: avaliação cirúrgica urgente.']],
      notas: ['Abscesso: drenagem é o tratamento principal.', 'Marcar a borda do eritema com caneta e registrar a evolução.'] },
    { id: 'abdome', icon: '🫃', nome: 'Intra-abdominal', germes: 'Enterobactérias, anaeróbios (B. fragilis), Enterococcus',
      empirico: [['ceftriaxona', 'Ceftriaxona + metronidazol', 'Comunitária leve a moderada.'], ['amoxi-clav', 'Amoxicilina + clavulanato', 'Comunitária leve.'], ['pipe-tazo', 'Piperacilina + tazobactam', 'Grave ou hospitalar.'], ['meropenem', 'Meropenem', 'Grave com risco de multirresistência.']],
      notas: ['Controle do foco (drenagem/cirurgia) é essencial.'] },
    { id: 'corrente', icon: '🩸', nome: 'Corrente sanguínea / cateter', germes: 'Staphylococcus (coagulase-negativo, S. aureus), gram-negativos, Candida',
      empirico: [['vancomicina', 'Vancomicina', 'Cobertura de gram-positivos (cateter).'], ['cefepima', 'Cefepima / pipe-tazo', 'Cobertura de gram-negativos.'], ['meropenem', 'Meropenem', 'Se choque séptico ou risco de ESBL.']],
      notas: ['2 pares de hemoculturas (periférica e do cateter) antes da 1ª dose.', 'Avaliar retirada do cateter; S. aureus na hemocultura exige retirada e investigação.'] },
    { id: 'pe', icon: '🦶', nome: 'Pé diabético infectado', germes: 'S. aureus, Streptococcus; gram-negativos e anaeróbios nas crônicas e graves',
      empirico: [['cefalexina', 'Cefalexina / amoxi-clav', 'Infecção leve.'], ['amoxi-clav', 'Amoxicilina + clavulanato EV', 'Moderada.'], ['pipe-tazo', 'Piperacilina + tazobactam', 'Grave, associar vancomicina se risco de MRSA.']],
      notas: ['Cultura de tecido profundo (não do swab superficial).', 'Ver protocolo de pé diabético; avaliar osteomielite.'] },
    { id: 'meningite', icon: '🧠', nome: 'Meningite bacteriana', germes: 'Pneumococo, meningococo; Listeria em > 50 anos e imunossuprimidos',
      empirico: [['ceftriaxona', 'Ceftriaxona', 'Base do esquema.'], ['vancomicina', 'Vancomicina', 'Associada (pneumococo resistente).'], ['ampicilina', 'Ampicilina', 'Associar se > 50 anos, gestante ou imunossuprimido (Listeria).'], ['dexametasona', 'Dexametasona', 'Antes ou junto da 1ª dose de antibiótico.']],
      notas: ['Antibiótico imediato (não atrasar pela punção lombar ou tomografia).', 'Precaução por GOTÍCULAS nas primeiras 24 h de tratamento (meningococo); notificação compulsória.'] }
  ];
  var SO_CISTITE = ['nitrofurantoina', 'fosfomicina'];
  var ORAIS = ['cefalexina', 'amoxicilina', 'smx-tmp-oral', 'doxiciclina', 'clindamicina-oral', 'metronidazol-oral'];
  var SNC_RUIM = ['cefazolina', 'daptomicina', 'tigeciclina', 'clindamicina', 'clindamicina-oral', 'amicacina', 'gentamicina', 'polimixina-b', 'amoxi-clav', 'c-minociclina', 'doxiciclina', 'cefalexina', 'nitrofurantoina', 'fosfomicina'];
  // Avalia uma opção no sítio escolhido → { ok, aviso }
  function noSitio(id, sitio) {
    if (!sitio || !id) return { ok: true };
    if (SO_CISTITE.indexOf(id) >= 0 && sitio !== 'cistite') return { ok: false, aviso: 'Só serve para cistite (não atinge nível no sangue e nos tecidos).' };
    if (id === 'daptomicina' && (sitio === 'pac' || sitio === 'pav')) return { ok: false, aviso: 'Inativada pelo surfactante: não usar em pneumonia.' };
    if (id === 'tigeciclina' && sitio === 'corrente') return { ok: false, aviso: 'Nível sanguíneo baixo: não usar em bacteremia.' };
    if (sitio === 'meningite' && SNC_RUIM.indexOf(id) >= 0) return { ok: false, aviso: 'Não atinge nível adequado no líquor.' };
    if ((sitio === 'pav' || sitio === 'corrente' || sitio === 'meningite') && ORAIS.indexOf(id) >= 0) return { ok: true, aviso: 'Via oral: só para transição após estabilidade, conforme a equipe.' };
    if ((id === 'amicacina' || id === 'gentamicina' || id === 'polimixina-b') && sitio !== 'cistite' && sitio !== 'pielo') return { ok: true, aviso: 'Fora da ITU, usar em associação.' };
    return { ok: true };
  }

  var FONTES = ['IDSA — Guidance on the Treatment of Antimicrobial-Resistant Gram-Negative Infections (2024)', 'IDSA — Clinical Practice Guidelines for MRSA Infections (2011)',
    'IDSA/SHEA — Clostridioides difficile: focused update (2021)', 'Anvisa — Medidas de prevenção de infecção relacionada à assistência à saúde (2017) e notas técnicas sobre multirresistentes',
    'IDSA/ATS — Hospital-acquired and ventilator-associated pneumonia (2016); ATS/IDSA — Community-acquired pneumonia (2019); IDSA — SSTI (2014) e Infecções intra-abdominais (2010); IWGDF (2023)',
    'BrCAST — Tabelas de pontos de corte para interpretação do antibiograma (versão vigente)'];

  var api = { BACTERIAS: BACTERIAS, PERFIS: PERFIS, PRECAUCAO: PRECAUCAO, APLICACAO: APLICACAO, GERAL: GERAL, FONTES: FONTES, perfil: perfil, SITIOS: SITIOS, noSitio: noSitio };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Antimicrobianos = api;
})(this);
