# Revisão técnica do EnfCalc — respostas e correções

Revisão recebida sobre o commit `39e5642` (22 achados de software). Abaixo, o que foi feito em cada item e como verificar.
Testes de unidade: `npm test` (agora roda todos os arquivos). Testes de navegador: `npm start` em um terminal e `npm run test:e2e` em outro.

> Como a própria revisão ressalta, isto trata de defeitos de software. **Não** é validação clínica de doses, protocolos ou fórmulas, que continua exigindo revisão por profissional habilitado.

## Prioridade alta

| # | Achado | Correção | Teste |
|---|--------|----------|-------|
| 1 | Parser aceitava `2mg` e lia `1.234` como 1234 | Leitura estrita (`Calc.numInfo`): rejeita sufixos e separadores inválidos; `1.234` é tratado como **ambíguo** e o campo pede correção. Todo campo numérico mostra o erro e a calculadora não calcula enquanto houver campo inválido. | `revisao-tecnica.test.js`, e2e 1a–1c |
| 2 | "Dose por dia" com doses/dia vazio ou 0 dividia por 1 | Exige número finito > 0; caso contrário, mostra o erro e não calcula dose nem volume. | e2e 2a–2c |
| 3 | Tempo 0 gerava "Administrar em bolus" para medicamento de infusão | O preparo bloqueia a combinação (via infusão/contínua/pronto, velocidade máxima cadastrada ou volume > 20 mL com tempo 0) e não gera instrução nem permite registrar. O seletor só oferece "Bolus" quando o cadastro permite (`Paciente.permiteBolus`). | `revisao-tecnica.test.js`, e2e 3 |

## Prioridade média

| # | Achado | Correção |
|---|--------|----------|
| 4 | "Apagar dados" deixava paciente e registro | Botão renomeado ("Apagar dados do paciente e do uso — mantém as maletas"), com confirmação e lista do que é apagado; remove todas as chaves de uso e só confirma depois de verificar a remoção. |
| 5 | Salvamento atrasado gravava o paciente anterior | "Novo paciente" cancela o salvamento pendente; o salvamento ignora a tela antiga. |
| 6 | Falha do localStorage confirmava sucesso | `store.set` devolve sucesso/falha; registro de administração e perfil avisam quando não foi possível gravar. |
| 7 | 1 ng → g aparecia como 0 | Valores não nulos menores que a precisão usam algarismos significativos ou notação científica (`1 × 10⁻⁹`). |
| 8 | Foco com contraste baixo | Token `--focus` (#0e7490 no claro, #67e8f9 no escuro), contorno de 3 px. |
| 9 | Diálogos sem gestão de foco | Aviso inicial, confirmações e busca rápida: foco movido para o diálogo, Tab/Shift+Tab presos, fundo inerte e foco devolvido ao controle que abriu. |
| 10 | Enter em "Cancelar" confirmava | Enter só envia com o foco no campo; nos botões vale a ação do botão. |
| 11 | Semântica de abas e grupos | Abas com `aria-labelledby`, tabindex móvel e navegação por setas/Home/End; grupos de opção com `role="radiogroup"` ligado ao rótulo. |
| 12 | Online/offline não anunciado | `#hh-status` com `role="status"`; o texto só muda quando o estado muda (relógio fora da região viva). |
| 13 | Scripts síncronos | Todos os scripts com `defer` (ordem preservada). Dados grandes continuam no carregamento inicial; medição de LCP/INP em aparelhos reais segue pendente. |
| 14 | Instalação offline frágil | Service worker guarda cada arquivo individualmente (uma falha não impede a instalação), completa o que faltou ao ativar e informa o status do cache à página. |
| 15 | Cache miss offline sem Response | Navegação offline cai no `index.html` guardado (ou página offline); demais recursos recebem 504 controlado. |
| 16 | Base EAN fora do precache | Baixada em segundo plano após a instalação; o leitor mostra "baixando", "pronta (funciona offline)" ou "indisponível — tentar de novo". |

## Prioridade baixa

| # | Achado | Correção |
|---|--------|----------|
| 17 | Calculadora perdia os valores | Rascunho por calculadora em `sessionStorage` (só na sessão, não fica gravado no aparelho). |
| 18 | Timer órfão no "Nova PCR" | `viewPCR` limpa os timers ao entrar, não cria intervalo para PCR encerrada e o intervalo se encerra se a tela sumir. |
| 19 | Busca de protocolos ignorava o conteúdo | Busca indexa seções, itens e nomes dos medicamentos citados (sem acentos). |
| 20 | Rota malformada lançava URIError | Decodificação protegida; cai em "Não encontrado". |
| 21 | Nomes de controles e rota atual | Seletores de unidade nomeados pelo campo ("Unidade de dose prescrita"); `aria-current="page"` na navegação. |
| 22 | `npm test` incompleto | Script usa `node --test tests/enfermagem/*.test.js`; `npm run test:e2e` roda a regressão no navegador. |

## Pendências reconhecidas
- Teste com leitores de tela (NVDA, VoiceOver, TalkBack) e anúncio de troca de rota da SPA.
- Medição de desempenho (LCP/INP/TBT) em aparelhos e redes representativos; avaliar dividir `catalogo.js`.
- Validação clínica independente de todo o conteúdo.
