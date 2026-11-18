# EnfCalc — roadmap para ser referência no mercado

Situação em 18/11/2026 (conteúdo v2026.11.2). Legenda: ✅ feito no app · 🧱 estrutura pronta, falta ação humana · ⏳ pendente.

## 1. Confiança: validação clínica com assinatura
| Item | Situação |
|---|---|
| Versão do conteúdo, histórico de mudanças e página "Conteúdo e revisão" (`#/conteudo`) | ✅ |
| Linha "Revisão profissional: pendente / revisado por…" em fichas, protocolos, escalas e POPs | ✅ (lê `revisoes.js`) |
| Botão "Reportar erro" em todo conteúdo (gera relato sem dados de paciente) | ✅ — 🧱 configurar `contato` em `js/editorial.js` |
| Conselho editorial com nome e registro | 🧱 convidar e registrar em `js/editorial.js` (ver `conselho-editorial.md`) |
| Revisão item a item com a bula brasileira (Anvisa) | 🧱 registrar em `js/revisoes.js` conforme `conselho-editorial.md` |

## 2. Situação legal
| Item | Situação |
|---|---|
| Resumo de privacidade e natureza do app dentro do app | ✅ (`#/conteudo`) |
| Minutas de política de privacidade e termos de uso | 🧱 `politica-de-privacidade.md`, `termos-de-uso.md` — revisar com advogado |
| Enquadramento na Anvisa (software como dispositivo médico) | 🧱 checklist em `regulatorio-e-lgpd.md` — consulta regulatória |
| Registro da marca no INPI e domínio | ⏳ ação do responsável |

## 3. Conteúdo
| Item | Situação |
|---|---|
| Processo de Enfermagem (COFEN 736/2024): focos → metas e prescrição aprazada, copiar para prontuário | ✅ `#/processo-enfermagem` (20 focos, texto próprio) |
| POPs (14 procedimentos) | ✅ `#/pops` |
| Valores laboratoriais (45) e ECG básico (14 ritmos) | ✅ `#/laboratorio`, `#/ecg` |
| Calculadoras: VIG neonatal, Calvert, dose por m² com teto, calorias da NP | ✅ |
| Interações e compatibilidade em Y abrangentes | ⏳ exige base licenciada (Micromedex/Trissel's) ou curadoria farmacêutica |
| Doses neonatais completas | ⏳ exige revisão de neonatologista/farmacêutico |
| Calendário vacinal do PNI | ⏳ muda com frequência: manter link oficial ou curadoria periódica |
| Taxonomias NANDA-I/NIC/NOC/CIPE | ⏳ exigem licença; o app usa focos em linguagem comum |

## 4. Distribuição e plantão
| Item | Situação |
|---|---|
| Manifesto pronto para lojas (atalhos, categorias, capturas de tela) | ✅ |
| Publicação Play Store / App Store | 🧱 passos em `publicacao-nas-lojas.md` (requer contas de desenvolvedor) |
| Alertas da agenda com o app fechado | ⏳ depende do app nativo/notificações push |
| Pacote institucional (protocolos locais, contatos, padrão por medicamento) | ✅ `#/instituicao` — formato em `pacote-institucional.md` |
| Conta e sincronização entre aparelhos | ⏳ exige servidor e adequação à LGPD (decisão de produto) |

## 5. Qualidade comprovada
| Item | Situação |
|---|---|
| Testes: 92 de unidade + regressão no navegador (`npm run test:e2e`) | ✅ |
| Registro local de erros técnicos (sem dados de paciente) | ✅ `#/conteudo` |
| Anúncio de troca de tela para leitores de tela | ✅ |
| Medição de desempenho | ✅ `node tests/e2e/desempenho.js` — CPU 4× + 4G fraca: tela inicial ≈ 4,3 s na 1ª visita (550 KB com gzip); visitas seguintes do cache |
| Dividir o catálogo para abrir mais rápido na 1ª visita | ⏳ próximo passo técnico |
| Testes com enfermeiros e com leitores de tela reais | 🧱 roteiro em `testes-usabilidade-e-acessibilidade.md` |
