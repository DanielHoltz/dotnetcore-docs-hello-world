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
    'nitroprussiato': 'nitroprussiato de sódio'
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
    'adenosina': [F.aha]
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
