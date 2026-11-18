# Conselho editorial e revisão do conteúdo

## Composição sugerida
- Farmacêutico(a) clínico(a): fichas, diluições, estabilidade, compatibilidade, antimicrobianos.
- Enfermeiro(a): POPs, Processo de Enfermagem, escalas, protocolos assistenciais.
- Médico(a) intensivista/emergencista: PCR, protocolos de emergência, alta vigilância.
- Profissional da CCIH: guia de antimicrobianos e precauções.

Só publique nomes de quem **de fato revisou** e autorizou por escrito a publicação do nome e do registro.

## Como registrar
1. Membro do conselho — `wwwroot/enfermagem/js/editorial.js`, em `conselho`:
   `{ nome: 'Nome', funcao: 'Farmacêutico clínico', registro: 'CRF-SC 0000', area: 'Fichas de medicamentos', desde: '2027-01-10' }`
2. Revisão de um item — `wwwroot/enfermagem/js/revisoes.js`, em `REVISOES`, com a chave do item:
   - medicamento: `'ceftriaxona'`; protocolo: `'prot:sepse'`; escala: `'escala:glasgow'`; POP: `'pop:sne'`
   - `{ por: 'Nome', registro: 'CRF-SC 0000', data: '2027-01-15', fonte: 'Bula profissional Anvisa — Fabricante X, versão 2025', nota: '' }`
3. Atualizar `versao`, `data` e `historico` em `editorial.js` a cada publicação.
4. Configurar `contato` (e-mail ou link de formulário) para receber os relatos de erro.

## Checklist de revisão por tipo
**Ficha de medicamento:** apresentações comercializadas; reconstituição (diluente e volume); diluição e concentração máxima; tempo/velocidade de infusão; estabilidade; via(s); dose adulto e pediátrica; ajuste renal; alertas (alta vigilância, nomes parecidos); interações citadas. Fonte: bula brasileira (Bulário Anvisa).
**Protocolo:** diretriz vigente citada; doses e metas; fluxo compatível com a realidade brasileira (SUS/suplementar).
**Escala:** itens e pontos conforme publicação original; pontos de corte; versão validada em português.
**POP / Processo de Enfermagem:** coerência com normas do COFEN e da Anvisa e com o POP institucional.

## Triagem de relatos de erro
- Erro de dose, via, diluição ou velocidade: **crítico** — corrigir em até 24 h, publicar versão e registrar no histórico.
- Erro de texto ou referência: corrigir na próxima versão.
