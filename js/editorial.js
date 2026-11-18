/*
 * EnfCalc — governança editorial do conteúdo.
 * CONSELHO: preencher SOMENTE com profissionais que de fato revisaram e autorizaram a publicação do nome e do registro.
 * Revisões por item continuam em revisoes.js (REVISOES), com nome, registro e data.
 * CONTATO: e-mail ou link de formulário para receber relatos de erro (deixe vazio para só copiar/compartilhar o relato).
 */
(function (root) {
  'use strict';
  var EDITORIAL = {
    versao: '2026.11.2',
    data: '2026-11-18',
    contato: '',
    conselho: [
      // { nome: 'Nome completo', funcao: 'Farmacêutico clínico', registro: 'CRF-UF 00000', area: 'Fichas de medicamentos', desde: 'AAAA-MM-DD' }
    ],
    funcoesPrevistas: ['Farmacêutico(a) clínico(a) — fichas, diluições, compatibilidade e antimicrobianos', 'Enfermeiro(a) — POPs, Processo de Enfermagem, escalas e protocolos assistenciais',
      'Médico(a) intensivista/emergencista — PCR, protocolos de emergência e doses de alta vigilância', 'Enfermeiro(a) ou médico(a) da CCIH — guia de antimicrobianos e precauções'],
    processo: ['Cada ficha, protocolo e escala recebe um revisor responsável, que confere o conteúdo com a bula brasileira (Anvisa) e as diretrizes citadas.',
      'Correções são registradas no histórico com data e versão do conteúdo.', 'Relatos de erro enviados pelo app são triados pelo conselho; erros de dose têm prioridade máxima e são corrigidos e comunicados.',
      'Revisão completa periódica (sugestão: anual) e sempre que uma diretriz de referência for atualizada.'],
    historico: [
      ['2026-11-18', '2026.11.2', 'Processo de Enfermagem, POPs, valores laboratoriais, ECG básico, calculadoras especializadas, pacote institucional, relato de erro e página de governança.'],
      ['2026-11-18', '2026.11.1', 'Guia de antibióticos por infecção e resistência; correções da revisão técnica de software (22 itens).'],
      ['2026-11-18', '2026.11.0', 'Modo PCR guiado; 21 escalas; 18 protocolos; 46 fichas resumidas conferidas em bulas FDA/DailyMed e Manual MSD; perfis de 182 classes.']
    ]
  };
  var api = { EDITORIAL: EDITORIAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Editorial = api;
})(this);
