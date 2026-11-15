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

  var FONTE_PADRAO = 'Compilação de referências usuais (bulas brasileiras, guias hospitalares de diluição e literatura). Pendente de conferência com a bula Anvisa do fabricante utilizado.';

  // Referências recomendadas (exibidas na tela Sobre / Revisão)
  var REFERENCIAS = [
    { nome: 'Bulário Eletrônico — Anvisa', url: 'https://consultas.anvisa.gov.br/#/bulario/', desc: 'Bulas oficiais (profissional e paciente) de cada fabricante. Fonte primária para reconstituição, diluição, estabilidade e posologia aprovadas no Brasil.' },
    { nome: 'ISMP Brasil', url: 'https://www.ismp-brasil.org/', desc: 'Medicamentos potencialmente perigosos (alta vigilância), nomes semelhantes e boletins de segurança.' },
    { nome: 'RENAME / Formulário Terapêutico Nacional — Ministério da Saúde', url: 'https://www.gov.br/saude/pt-br/composicao/sectics/rename', desc: 'Relação nacional de medicamentos e monografias resumidas.' },
    { nome: 'DailyMed (NIH/FDA)', url: 'https://dailymed.nlm.nih.gov/dailymed/', desc: 'Bulas americanas (em inglês), úteis para conferência de doses pediátricas e segurança. Apresentações podem diferir das do Brasil.' },
    { nome: 'Compatibilidade em Y (Trissel’s / KingGuide)', url: '', desc: 'Referência padrão-ouro de compatibilidade (assinatura). Recomendada para validar as incompatibilidades do app.' }
  ];

  function termoAnvisa(d) {
    return BUSCA_ANVISA[d.id] || String(d.nome).replace(/\(.*?\)/g, '').replace(/\s[\d,]+\s?%/, '').trim();
  }
  function urlAnvisa(d) {
    return 'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=' + encodeURIComponent(termoAnvisa(d));
  }
  function revisao(id) { return REVISOES[id] || null; }

  var api = { BUSCA_ANVISA: BUSCA_ANVISA, REVISOES: REVISOES, FONTE_PADRAO: FONTE_PADRAO, REFERENCIAS: REFERENCIAS,
    termoAnvisa: termoAnvisa, urlAnvisa: urlAnvisa, revisao: revisao };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Revisoes = api;
})(this);
