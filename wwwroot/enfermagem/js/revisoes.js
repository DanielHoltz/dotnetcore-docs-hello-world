/*
 * EnfCalc — rastreabilidade das fichas: fontes e revisão profissional.
 *
 * Para registrar uma revisão, adicione em REVISOES:
 *   'ceftriaxona': { por: 'Nome Sobrenome', registro: 'CRF-SC 0000', data: '2026-11-20',
 *                    fonte: 'Bula profissional Anvisa — Fabricante X, versão de 2025', nota: '' }
 * Só registre aqui revisões feitas de fato por profissional habilitado.
 */
(function (root) {
  'use strict';

  // Termo de busca no Bulário Eletrônico da Anvisa (quando difere do nome exibido)
  var BUSCA_ANVISA = {
    'adrenalina': 'epinefrina',
    'noradrenalina': 'norepinefrina',
    'ampi-sulbactam': 'sulbactam',
    'pipe-tazo': 'tazobactam',
    'penicilina-cristalina': 'benzilpenicilina',
    'bicarbonato': 'bicarbonato de sódio',
    'cloreto-potassio': 'cloreto de potássio',
    'gluconato-calcio': 'gluconato de cálcio',
    'sulfato-magnesio': 'sulfato de magnésio',
    'glicose-50': 'glicose',
    'insulina-regular': 'insulina humana',
    'heparina': 'heparina sódica',
    'nitroprussiato': 'nitroprussiato de sódio',
    'paracetamol-ev': 'paracetamol',
    'azitromicina-ev': 'azitromicina',
    'cetoprofeno-ev': 'cetoprofeno',
    'smx-tmp': 'sulfametoxazol',
    'sacarato-ferro': 'hidróxido férrico',
    'tranexamico': 'ácido tranexâmico',
    'penicilina-benzatina': 'benzilpenicilina benzatina',
    'imipenem': 'imipenem',
    'escopolamina': 'escopolamina'
  };

  // Revisões profissionais registradas (vazio até que um profissional revise)
  var REVISOES = {};

  var FONTE_PADRAO = 'Compilação de referências usuais (bulas brasileiras, guias hospitalares de diluição e literatura). Ainda não conferida com fontes publicadas no app.';

  // Referências recomendadas (exibidas na tela Sobre / Revisão)
  var REFERENCIAS = [
    { nome: 'Bulário Eletrônico — Anvisa', url: 'https://consultas.anvisa.gov.br/#/bulario/', desc: 'Bulas oficiais (profissional e paciente) de cada fabricante. Fonte primária para reconstituição, diluição, estabilidade e posologia aprovadas no Brasil.' },
    { nome: 'ISMP Brasil', url: 'https://www.ismp-brasil.org/', desc: 'Medicamentos potencialmente perigosos (alta vigilância), nomes semelhantes e boletins de segurança.' },
    { nome: 'RENAME / Formulário Terapêutico Nacional — Ministério da Saúde', url: 'https://www.gov.br/saude/pt-br/composicao/sectics/rename', desc: 'Relação nacional de medicamentos e monografias resumidas.' },
    { nome: 'DailyMed (NIH/FDA)', url: 'https://dailymed.nlm.nih.gov/dailymed/', desc: 'Bulas americanas (em inglês), úteis para conferência de doses pediátricas e segurança. Apresentações podem diferir das do Brasil.' },
    { nome: 'Manual de preparo e administração de injetáveis — HUPE/UERJ (2025)', url: 'https://www.hupe.uerj.br/wp-content/uploads/2025/12/Manual-para-Preparo-e-Administra%C3%A7%C3%A3o-de-Medicamentos-Injet%C3%A1veis_3%C2%AA_edi%C3%A7%C3%A3o_2025-1-1.pdf', desc: 'Manual amplo de hospital universitário: reconstituição, diluição, tempo e estabilidade de injetáveis.' },
    { nome: 'Guia Farmacêutico — Hospital Sírio-Libanês', url: 'https://guiafarmaceutico.hsl.org.br/', desc: 'Fichas de preparo e administração por medicamento (adulto e pediatria).' },
    { nome: 'Compatibilidade em Y (Trissel’s / KingGuide)', url: '', desc: 'Referência padrão-ouro de compatibilidade (assinatura). Recomendada para validar as incompatibilidades do app.' }
  ];


  // Fontes publicadas consultadas (guias institucionais brasileiros e bulas)
  var F = {
    hsl: function (slug, nome) { return { t: 'Guia Farmacêutico — Hospital Sírio-Libanês' + (nome ? ' (' + nome + ')' : ''), url: 'https://guiafarmaceutico.hsl.org.br/' + slug }; },
    hslPed: { t: 'Tabela de diluição pediátrica — Hospital Sírio-Libanês', url: 'https://guiafarmaceutico.hsl.org.br/manuais-e-rotinas-da-farmacia/PublishingImages/diluicao-pediatria/Tabela%20-%20Dilui%C3%A7%C3%A3o%20Pediatria.pdf' },
    scAdulto: { t: 'Tabela de preparo adulto — Hospital São Camilo SP (2026)', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/storags/2026/06/TABELA-DE-PREPARO-ADULTO-26-06-26.pdf' },
    scPed: { t: 'Tabela de preparo pediátrico — Hospital São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/wp-content/uploads/2023/01/TABELA-DE-PREPARO-PEDIATRICO.pdf' },
    scFlebite: { t: 'Lista de medicamentos com risco de flebite — Hospital São Camilo SP (2026)', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/storags/2026/06/LISTA-DE-MEDICAMENTOS-RISCO-DE-FLEBITE2026.pdf' },
    scAV: { t: 'Medicamentos de alta vigilância — Hospital São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/wp-content/uploads/2023/01/Novembro.22-Medicamentos-de-Alta-Vigilancia-1.pdf' },
    ufam: { t: 'Guia de preparo e administração de antimicrobianos — UFAM (2016)', url: 'https://antigo.ufam.edu.br/attachments/article/5223/Guia%20de%20preparo%20e%20administra%C3%A7%C3%A3o%20de%20antimicrobianos_2016.pdf' },
    hugg: { t: 'Planilha de estabilidade e diluição de antibióticos — HUGG/UNIRIO', url: 'https://www.unirio.br/hugg/setor-de-farmacia-1/arquivos/Planilha%20de%20estabilidade%20e%20diluicao%20de%20antibioticos%20-HUGG.pdf' },
    isgh: { t: 'Plano medicamentoso — tabelas de diluição — ISGH (2017)', url: 'https://isgh.org.br/intranet/images/Servicos/Manuais/2017/PLANO_MEDICAMENTOSO_TABELAS_141117.pdf' },
    incorNora: { t: 'Nota técnica norepinefrina — Serviço de Farmácia InCor/USP', url: 'https://www.incor.usp.br/onadocs/SFARM/SFARM-NTC-DSF-231.pdf' },
    incorCrit: { t: 'Manual de preparo — pacientes críticos — InCor/USP', url: 'https://www.incor.usp.br/onadocs/SFARM/UFARM-MAN-DUF-010-E003.pdf' },
    fiocruzNeo: { t: 'Tabela de diluição de injetáveis (neonatologia) — Fiocruz/IFF', url: 'https://portaldeboaspraticas.iff.fiocruz.br/wp-content/uploads/2021/11/Tabela-de-diluicao-de-medicamentos-injetaveis-neo.pdf' },
    ufrjFoto: { t: 'Fotossensibilidade e estabilidade em pacientes críticos — IPPMG/UFRJ', url: 'https://ippmg.ufrj.br/wp-content/uploads/2023/04/Fotossenbilidade_de_medicamentos_usados_em_pacientes_criticos-1.pdf' },
    meUfrjMg: { t: 'POP 74 — sulfato de magnésio 50% — Maternidade-Escola UFRJ', url: 'https://www.me.ufrj.br/images/pdfs/protocolos/enfermagem/2021rev/pop_74_administracao_sulfato_magnesio_a_50_pre_eclampsia_e_eclampsia_revisao_2_cris.pdf' },
    hcUfmgMg: { t: 'Protocolo pré-eclâmpsia/eclâmpsia — HC-UFMG/Ebserh', url: 'https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-sudeste/hc-ufmg/saude/protocolos-assistenciais-hc-ufmg-ebserh/PR_224_Preeclampsia_eclampsia_V01.pdf' },
    aha: { t: 'Diretrizes AHA 2020 de RCP e ACE', url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines' },
    hupe: { t: 'Manual de preparo e administração de injetáveis — HUPE/UERJ (3ª ed., 2025)', url: 'https://www.hupe.uerj.br/wp-content/uploads/2025/12/Manual-para-Preparo-e-Administra%C3%A7%C3%A3o-de-Medicamentos-Injet%C3%A1veis_3%C2%AA_edi%C3%A7%C3%A3o_2025-1-1.pdf' },
    poa: { t: 'Manual de administração de medicamentos — Prefeitura de Porto Alegre', url: 'https://bvaps.portoalegre.rs.gov.br/sites/default/files/usu_doc/areas-profissionais/manual%20(1).pdf' },
    incorPPI: { t: 'Nota técnica IBP injetáveis — InCor/USP', url: 'https://www.incor.usp.br/onadocs/SFARM/SFARM-NTC-DSF-057.pdf' },
    scPreparo: { t: 'Tabela de preparo — Hospital São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/wp-content/uploads/2024/06/TABELA-DE-PREPARO-Atualizado.pdf' },
    scGuia: function (p) { return { t: 'Guia Farmacêutico — Hospital São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/?p=' + p }; },
    sbd: { t: 'Posicionamento SBD 01/2024 — insulina endovenosa', url: 'https://profissional.diabetes.org.br/wp-content/uploads/2024/09/Posicionamento-SBD-01-2024-1.pdf' },
    huabOcit: { t: 'POP indução do parto com ocitocina — HUAB/UFRN (Ebserh)', url: 'https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-nordeste/huab-ufrn/documentos-institucionais/arquivos-documentos-institucionais-geral/pop-dm-007-inducao-do-trabalho-de-parto-com-ocitocina.pdf' },
    meUfrjPE: { t: 'Pré-eclâmpsia/eclâmpsia — Maternidade-Escola UFRJ (2023)', url: 'https://www.me.ufrj.br/images/pdfs/protocolos/obstetricia/capitulo_68_pre_eclampsia_eclampsia_new_2023.pdf' },
    telessaudeSifilis: { t: 'Administração de penicilina benzatina na sífilis — TelessaúdeRS/UFRGS', url: 'https://www.ufrgs.br/telessauders/perguntas/como-deve-ser-administrada-benzilpenicilina-benzatina-para-o-tratamento-de-sifilis/' },
    univasf: { t: 'Boletim antibióticos de uso em bomba — HU-UNIVASF (Ebserh)', url: 'https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-nordeste/hu-univasf/saude/setor-de-farmacia-hospitalar/Boletim02AntibiticosdeUsoemBombadeInfuso1.pdf' },
    bula: function (nome, url) { return { t: 'Bula — ' + nome + ' (cópia em site de terceiros)', url: url }; }
  };

  // Conferência com fontes publicadas (feita pelo desenvolvimento do app; NÃO é revisão profissional)
  var DATA_CONF = '2026-11-15';
  var VERIFICACOES = {
    'vancomicina': [F.bula('Novamicin', 'https://bula.com.br/novamicin'), F.bula('Vancomicina Blau', 'https://drconsulta.com/conteudo/cloridrato-de-vancomicina-blau-bula/'), { t: 'Estabilidade da vancomicina em infusão prolongada — Acta Paul Enferm (SciELO)', url: 'https://new.scielo.br/j/ape/a/xPKXgLj6QHLbnX5fQhmVcPv/?lang=en' }],
    'ertapenem': [F.hsl('ertapenem'), F.isgh, F.bula('Ertapenem Schering-Plough', 'https://drconsulta.com/conteudo/ertapenem-sodico-schering-plough-bula/')],
    'meropenem': [F.bula('Meropeném 1 g (bula original)', 'https://bula.com.br/original/meropenem-injetavel-1-g'), F.bula('Meropeném BioChimico', 'https://bula.com.br/meropenem-biochimico'), { t: 'Estabilidade do meropenem em bolsas de infusão — UFRGS', url: 'https://lume.ufrgs.br/bitstream/10183/208253/1/Resumo_63358.pdf' }],
    'pipe-tazo': [F.bula('Tazpen', 'https://bula.com.br/tazpen'), F.bula('Novataz', 'https://drconsulta.com/conteudo/novataz-bula/'), F.bula('Tazocin', 'https://drconsulta.com/conteudo/tazocin-bula/'), F.bula('Piperacilina+Tazobactam ABL', 'https://drconsulta.com/conteudo/piperacilina-sodica-tazobactam-sodico-abl-brasil-bula/')],
    'cefepima': [F.hsl('cefepima'), F.scAdulto, F.bula('Maxcef', 'https://drconsulta.com/conteudo/maxcef-bula/')],
    'ceftriaxona': [F.hsl('ceftriaxona'), F.bula('Keftron', 'https://bula.com.br/keftron/posologia-como-usar'), F.bula('Ceftriaxona ABL', 'https://bula.com.br/ceftriaxona-dissodica-hemieptaidratada-abl-brasil'), F.hugg],
    'amicacina': [F.hugg, F.scFlebite, F.bula('Amicilon', 'https://drconsulta.com/conteudo/amicilon-bula/')],
    'gentamicina': [F.hugg, F.scFlebite, F.isgh],
    'dipirona': [F.bula('Dipirona Hypofarma (profissional)', 'https://bula.com.br/dipirona-monoidratada-hypofarma'), F.bula('Dipifarma', 'https://drconsulta.com/conteudo/dipifarma-bula/'), F.bula('Novalgina injetável', 'https://bula.com.br/novalgina-injetavel')],
    'ondansetrona': [F.hsl('ondansetrona')],
    'metoclopramida': [F.hsl('metoclopramida'), { t: 'Preparo e administração de medicamentos — ambulatório — InCor/USP', url: 'https://www.incor.usp.br/onadocs/CENF/FOR%20CENF%200025%20-%20INFORMA%C3%87%C3%95ES%20PARA%20O%20PREPARO%20E%20ADMINISTRA%C3%87%C3%83O%20DE%20MEDICAMENTOS%20AMBULAT%C3%93RIO.pdf' }],
    'tramadol': [F.bula('Tramal injetável', 'https://drconsulta.com/conteudo/tramal-injetavel-bula/')],
    'noradrenalina': [F.incorNora, F.bula('Novanor', 'https://drconsulta.com/conteudo/novanor-bula/'), F.bula('Hyponor', 'https://drconsulta.com/conteudo/hyponor-bula/')],
    'cloreto-potassio': [F.hsl('cloreto-de-potassio-injetavel'), F.scFlebite, F.scAV, F.bula('KCl 19,1% Halex Istar', 'https://bula.com.br/original/cloreto-de-potassio-halex-istar-injetavel-191')],
    'amiodarona': [F.hsl('amiodarona-injetavel'), F.incorCrit],
    'fenitoina': [F.bula('Fenital', 'https://drconsulta.com/conteudo/fenital-bula/'), { t: 'Ficha técnica fenitoína — AEMPS (Espanha)', url: 'https://cima.aemps.es/cima/pdfs/es/ft/65372/FT_65372.pdf' }],
    'midazolam': [F.hsl('midazolam-(injetavel)'), F.ufrjFoto],
    'fentanil': [F.ufrjFoto],
    'heparina': [F.hsl('heparina')],
    'sulfato-magnesio': [F.meUfrjMg, F.hcUfmgMg],
    'clindamicina': [F.bula('Clindamicina União Química', 'https://drconsulta.com/conteudo/fosfato-de-clindamicina-uniao-quimica-bula/'), F.scPed, F.fiocruzNeo],
    'aciclovir': [F.hugg, F.fiocruzNeo],
    'cefazolina': [F.hugg, F.bula('Kefazol', 'https://drconsulta.com/conteudo/kefazol-bula/'), F.bula('Cezolin', 'https://drconsulta.com/conteudo/cezolin-bula/')],
    'oxacilina': [F.hugg, F.ufam],
    'ampicilina': [F.ufam, F.hugg],
    'gluconato-calcio': [{ t: 'Guia Farmacêutico — Hospital São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/?p=4401' }],
    'adrenalina': [F.aha],
    'atropina': [F.aha],
    'adenosina': [F.aha],
    // etapa 1 (fichas existentes)
    'omeprazol': [F.incorPPI, F.bula('Oprazon', 'https://bula.com.br/oprazon/posologia-como-usar')],
    'morfina': [F.hsl('morfina-injetavel'), F.scGuia(3700)],
    'naloxona': [F.scGuia(3700)],
    'flumazenil': [F.scGuia(3700)],
    'nitroprussiato': [F.bula('Nitroprus', 'https://bula.com.br/original/nitroprus'), { t: 'Bula profissional nitroprussiato — Cristália', url: 'https://cristalia.com.br/produto/138/bula-profissional' }],
    'penicilina-cristalina': [F.hsl('aricilina-5-000-000ui-frasco'), { t: 'Benzilpenicilina potássica — Guia Farmacêutico São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/benzilpenicilina-potassica' }, F.bula('Megapen', 'https://bula.com.br/megapen')],
    'insulina-regular': [F.hsl('insulina-regular-humana'), F.sbd],
    'furosemida': [F.hsl('furosemida'), F.bula('Lasix injetável', 'https://drconsulta.com/conteudo/lasix-injetavel-bula/')],
    'ciprofloxacino': [F.hsl('ciprofloxacino'), F.bula('Cipro I.V. Flexibag', 'https://drconsulta.com/conteudo/cipro-iv-flexibag-bula/')],
    'metronidazol': [F.hsl('metronidazol')],
    'diazepam': [F.bula('Uni-Diazepax', 'https://bula.com.br/uni-diazepax-solucao-injetavel'), F.bula('Compaz', 'https://drconsulta.com/conteudo/compaz-bula/')],
    'ocitocina': [F.huabOcit, F.hsl('ocitocina'), { t: 'Distúrbios da contratilidade uterina — Maternidade-Escola UFRJ', url: 'https://www.me.ufrj.br/images/pdfs/protocolos/obstetricia/disturbios_da_contratilidade_uterina.pdf' }],
    'bicarbonato': [F.bula('Bicarbonato de sódio 8,4%', 'https://bula.com.br/original/bicarbonato-de-sodio-injetavel-84'), { t: 'Irritantes e vesicantes — Guia Farmacêutico HSL', url: 'https://guiafarmaceutico.hsl.org.br/apoio-a-prescricao/irritantes-e-vesicantes' }],
    'cefalotina': [F.isgh],
    'glicose-50': [F.isgh],
    // ampliação
    'azitromicina-ev': [F.bula('Zitromax IV', 'https://bula.com.br/zitromax-iv'), F.bula('Azitromicina ABL', 'https://drconsulta.com/conteudo/azitromicina-monoidratada-abl-brasil-bula/')],
    'bromoprida': [{ t: 'Bula profissional bromoprida — Fresenius Kabi', url: 'https://www.fresenius-kabi.com/br/documents/2.bromoprida_Bula_Profissional.pdf' }, F.bula('Bromoprida Nova Farma', 'https://drconsulta.com/conteudo/bromoprida-nova-farma-bula/')],
    'cefoxitina': [F.scPed],
    'ceftazidima': [F.hugg],
    'cefuroxima': [F.hsl('cefuroxima'), F.scPed],
    'cetoprofeno-ev': [{ t: 'Bula profissional cetoprofeno IV — Cristália', url: 'https://cristalia.com.br/produto/62/bula-profissional' }, { t: 'Bula Profenid IV', url: 'https://www.saudedireta.com.br/catinc/drugs/bulas/profenidiv.pdf' }],
    'dobutamina': [F.bula('Dobutrex', 'https://drconsulta.com/conteudo/dobutrex-bula/'), F.incorCrit],
    'dopamina': [F.scGuia(4366), F.incorCrit],
    'enoxaparina': [F.hsl('enoxaparina-sodica'), F.bula('Clexane', 'https://bula.com.br/clexane/posologia-como-usar'), F.bula('Versa', 'https://bula.com.br/versa/posologia-como-usar')],
    'escopolamina': [F.hsl('escopolamina'), { t: 'Preparo e administração — ambulatório — InCor/USP', url: 'https://www.incor.usp.br/onadocs/CENF/FOR%20CENF%200025%20-%20INFORMA%C3%87%C3%95ES%20PARA%20O%20PREPARO%20E%20ADMINISTRA%C3%87%C3%83O%20DE%20MEDICAMENTOS%20AMBULAT%C3%93RIO.pdf' }],
    'fitomenadiona': [{ t: 'Fitomenadiona 10 mg — Guia Farmacêutico HSL', url: 'https://guiafarmaceutico.hsl.org.br/SiteAssets/vitamina-k-fitomenadiona/Fitomenadiona%2010%20mg_rev%2011.pdf' }, F.bula('Kavit', 'https://bula.com.br/kavit')],
    'fluconazol': [{ t: 'Bula fluconazol 2 mg/mL (bolsa)', url: 'https://www.sara.com.br/bula-do-paciente-fluconazol-2-mgml-solucao-para-infusao-intravenosa-caixa-30-envol-bols-plas-pp-t/7898170788308' }],
    'haloperidol': [F.hsl('haloperidol'), { t: 'Medicamentos irritantes e vesicantes — São Camilo SP', url: 'https://guiafarmaceutico.hospitalsaocamilosp.org.br/preparoeadministracaodemedicamentos/medicamentos-irritantes-e-vesicantes' }],
    'hidralazina': [F.meUfrjPE, { t: 'Bula profissional Nepresol — Cristália', url: 'https://www.cristalia.com.br/produto/135/bula-profissional' }],
    'imipenem': [F.univasf],
    'levofloxacino': [F.bula('Levaflox', 'https://bula.com.br/levaflox'), F.bula('Levofloxacino Halex Istar', 'https://bula.com.br/levofloxacino-halex-istar')],
    'linezolida': [F.hsl('linezolida'), { t: 'Bula linezolida — Eurofarma', url: 'https://eurofarma.com.br/produtos/bulas/healthcare/pt/bula-linezolida.pdf' }],
    'pantoprazol': [F.hsl('pantoprazol'), F.incorPPI, F.hupe],
    'paracetamol-ev': [F.bula('Halexminophen', 'https://bula.com.br/original/halexminophen'), { t: 'Paracetamol injetável — MSF Essential Drugs', url: 'https://medicalguidelines.msf.org/en/viewport/EssDr/english/paracetamol-acetaminophen-injectable-16683025.html' }],
    'penicilina-benzatina': [F.hsl('benzilpenicilina'), F.telessaudeSifilis],
    'propofol': [F.hsl('propofol'), F.bula('Spiva MCT/LCT', 'https://bula.com.br/spiva-mct-lct/posologia-como-usar')],
    'sacarato-ferro': [F.hsl('ferro-(injetavel)'), F.bula('Noripurum EV', 'https://bula.com.br/original/noripurum-ev-solucao-injetavel-endovenosa')],
    'smx-tmp': [F.univasf, F.hugg],
    'teicoplanina': [F.hsl('teicoplanina'), F.bula('Teicoplanina BioChimico', 'https://bula.com.br/teicoplanina-biochimico/posologia-como-usar')],
    'tenoxicam': [{ t: 'Bula profissional tenoxicam — Eurofarma', url: 'https://cdn.eurofarma.com.br//wp-content/uploads/2016/09/Bula_Tenoxicam_Profissional.pdf' }],
    'tranexamico': [{ t: 'Bula profissional ácido tranexâmico — Fresenius Kabi', url: 'https://www.fresenius-kabi.com/content/dam/fresenius-kabi/br/documents/bulas/medicamentos/%C3%81cido%20Tranex%C3%A2mico%20-%20Bula%20Profissional%20da%20Sa%C3%BAde.pdf.coredownload.inline.pdf' }],
    'vasopressina': [F.scGuia(4366), F.incorCrit]
  };
  function verificacao(id) { return VERIFICACOES[id] ? { data: DATA_CONF, fontes: VERIFICACOES[id] } : null; }

  function termoAnvisa(d) {
    return BUSCA_ANVISA[d.id] || String(d.nome).replace(/\(.*?\)/g, '').replace(/\s[\d,]+\s?%/, '').trim();
  }
  function urlAnvisa(d) {
    return 'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=' + encodeURIComponent(termoAnvisa(d));
  }
  function revisao(id) { return REVISOES[id] || null; }

  var api = { BUSCA_ANVISA: BUSCA_ANVISA, REVISOES: REVISOES, FONTE_PADRAO: FONTE_PADRAO, REFERENCIAS: REFERENCIAS,
    termoAnvisa: termoAnvisa, urlAnvisa: urlAnvisa, revisao: revisao,
    VERIFICACOES: VERIFICACOES, verificacao: verificacao, DATA_CONF: DATA_CONF };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Revisoes = api;
})(this);
