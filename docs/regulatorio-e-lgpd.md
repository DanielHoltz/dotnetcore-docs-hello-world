# Checklist regulatório e LGPD

> Documento de apoio para a conversa com advogado e consultor regulatório. **Não é parecer jurídico.**

## Anvisa — software como dispositivo médico (SaMD)
- Normas de referência: **RDC nº 657/2022** (regularização de software como dispositivo médico) e **RDC nº 751/2022** (classificação de risco de dispositivos médicos). Confirmar a versão vigente.
- Pontos para a consulta:
  - O app **calcula doses e volumes** e sugere condutas (PCR guiada, antibióticos): avaliar se isso o enquadra como dispositivo médico e em qual classe de risco.
  - Partes de consulta/educação (bulário resumido, POPs, valores de referência) podem ter enquadramento diferente das calculadoras.
  - Se enquadrado: boas práticas de fabricação de software (ciclo de vida, gestão de riscos — ISO 14971, IEC 62304), rastreabilidade de requisitos e testes, responsável técnico, tecnovigilância (canal de reclamações já existe: "Reportar erro").
  - Alternativas a avaliar com o consultor: posicionar módulos como apoio educacional com avisos claros, ou regularizar.
- Evidências que o projeto já tem: testes automatizados (unidade e navegador), histórico de versões, relato de erros, conferência de doses documentada (`#/conferencia`), revisão técnica de software respondida (`revisao-tecnica-respostas.md`).

## LGPD
- Hoje: **sem servidor e sem coleta**. Dados de paciente ficam no aparelho (localStorage/sessionStorage); nada é enviado; sem analytics, anúncios ou cadastro.
- Riscos: aparelho compartilhado ou perdido. Mitigações já no app: identificação mínima (leito), botão de apagar dados, rascunhos de calculadora só na sessão.
- Se houver conta/sincronização no futuro: base legal, consentimento, DPO/encarregado, relatório de impacto (RIPD), criptografia, contrato com operadores, política de retenção.
- Relatos de erro: o texto gerado não inclui dados de paciente (orientação na própria tela).

## Outros
- Marca: busca e registro no INPI (classes 9, 42 e 44 a avaliar).
- Conselhos profissionais: conteúdo de enfermagem alinhado às resoluções do COFEN (ex.: 736/2024 — Processo de Enfermagem; 427/2012 — contenção).
- Direitos autorais: textos próprios; não reproduzir bulas, MSD, Nursebook, NANDA-I/NIC/NOC/CIPE sem licença.
