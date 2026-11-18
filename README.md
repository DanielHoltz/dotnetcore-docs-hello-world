# EnfCalc — Calculadora de Enfermagem

App para profissionais de enfermagem (PWA: funciona offline e instala na tela inicial do celular), em `wwwroot/enfermagem/`. A raiz do site redireciona para ele.

## Funcionalidades

- **Processo de Enfermagem (COFEN 736/2024):** 20 focos de cuidado em linguagem comum; o app gera evidências, resultado esperado e prescrição de enfermagem com aprazamento, prontos para copiar.
- **POPs, exames e ECG:** 14 procedimentos (material, passo a passo, cuidados), 45 valores laboratoriais de referência e ECG básico (valores normais e 14 ritmos com conduta).
- **Calculadoras especializadas:** VIG neonatal, carboplatina (Calvert), dose por m² com teto de SC e calorias da nutrição parenteral.
- **Minha instituição:** pacote JSON com protocolos locais, contatos e padrões por medicamento (aparecem nas fichas). Ver `docs/pacote-institucional.md`.
- **Governança do conteúdo:** versão do conteúdo, histórico, conselho editorial, "Revisão profissional: pendente/revisado por" em cada item, botão "Reportar erro" e página de privacidade (`#/conteudo`). Roadmap e documentos de apoio (regulatório, LGPD, lojas, usabilidade) em `docs/`.
- **Antibióticos e resistência:** escolha o tipo de infecção (cistite, pielonefrite, pneumonia comunitária ou associada à ventilação, pele, intra-abdominal, corrente sanguínea, pé diabético, meningite), a bactéria e as resistências do antibiograma (MRSA, VRE, ESBL, AmpC, KPC, NDM/metalo, OXA-48, Pseudomonas DTR, CRAB, Stenotrophomonas, C. difficile). O app mostra as opções geralmente ativas, o que evitar, o que não serve naquele local (ex.: daptomicina em pneumonia), a precaução/isolamento e como aplicar cada antibiótico. Sem cultura: tratamento empírico usual do local. Base: IDSA 2024, Anvisa, BrCAST; a decisão é do médico com a CCIH.
- **Qualidade e acessibilidade (revisão técnica):** leitura estrita de números, bloqueio de combinações incompatíveis (via × tempo), gestão de foco nos diálogos, abas por teclado, offline robusto e testes de regressão no navegador — ver `docs/revisao-tecnica-respostas.md`.
- **Modo PCR guiado (AHA ACLS/PALS):** checklist de reconhecimento antes de iniciar; painel "Próxima ação" que segue o algoritmo conforme o ritmo marcado (FV/TV sem pulso, AESP, assistolia, RCE): choque, adrenalina (no não chocável já; no chocável após o 2º choque; janela de 3–5 min), antiarrítmico após o 3º choque, checagem de ritmo a cada 2 min, com som e vibração; contadores de ciclos, adrenalinas, choques e antiarrítmicos; energia e doses por peso, preparo das ampolas, lidocaína, EtCO₂; qualidade da RCP; 5H e 5T com a conduta de cada causa; drogas em situações especiais; papéis da equipe; checklist de cuidados pós-RCE ("perdeu pulso" retoma o algoritmo); resumo completo para o prontuário.
- **Visual health-tech e interações (design v3):** painel inicial escuro com grade, linha de ECG animada, relógio e status online/offline; números em fonte de monitor; **busca rápida** que abre de qualquer tela (🔍, tecla / ou Ctrl+K) com navegação pelo teclado; ondulação e vibração leve ao tocar; transições entre telas; contadores animados; deslizar o dedo para trocar de aba nas fichas; medidor circular nas escalas; botão de tema (automático, escuro, claro). Respeita a preferência de "reduzir movimento" do aparelho.
- **Navegação por tarefa (design v2):** a tela inicial é organizada pelo que o profissional precisa fazer: busca única, ações rápidas (PCR, Atender, Ler caixa, Infusão), painel "Meu plantão" (agenda com a próxima dose e atrasos, paciente em atendimento, validade das maletas), "Consultar" (Bulário, Cálculos, Protocolos, Escalas) e áreas de atuação. A barra inferior tem Início · Bulário · Cálculos · Protocolos · Plantão (hub com agenda, SBAR, leitor de caixa, maletas, interações e escalas de beira de leito).
- **Fichas de medicamento padronizadas:** cabeçalho com nome digitado (ou nome comercial), princípio ativo, classe, alta vigilância, tarja, uso hospitalar e genérico; conteúdo em abas (Resumo/Preparo · Calcular · Classe · Mercado · Fontes).
- **Escalas (41), com busca e grupos:** inclui NIHSS, Rankin, Glasgow pediátrica, CAM-ICU, SOFA, BPS, POSS (sedação por opioide), flebite e infiltração (INS), CHA₂DS₂-VASc, HAS-BLED, Wells-TVP, Pádua, Barthel, Fugulin (dimensionamento COFEN), Downton, Humpty Dumpty, Silverman-Andersen, Child-Pugh, Hunt-Hess e Karnofsky. O resultado pode ser copiado para a evolução ou salvo no aparelho (com leito), e cada escala leva ao protocolo relacionado.
- **Protocolos (71):** novos protocolos de FA, pneumonia, ITU, cefaleia, agitação psicomotora, insuficiência respiratória/oxigenoterapia, PCR pediátrica, sífilis na gestação, extravasamento, hemotransfusão, sondas (dieta e medicamentos), bundles de PAV, cateter central e sonda vesical, dermatite associada à incontinência, ferida operatória, hiperglicemia hospitalar e hipotermia — todos com referências brasileiras e internacionais.
- **Novas calculadoras:** cálcio corrigido, déficit de água livre e equivalência de corticoides.
- **Perfis de classe terapêutica:** 180+ perfis (texto próprio) com mecanismo de ação, efeitos adversos comuns, cuidados de enfermagem e alertas, exibidos na ficha de cada medicamento e na página da classe, junto com os demais medicamentos da mesma classe.
- **Infusão e gotejamento:** gotas/min e microgotas/min, tempo de infusão, vazão em bomba (mL/h).
- **Infusão contínua / drogas vasoativas:** dose ↔ mL/h (mcg/kg/min, mcg/min, mg/kg/h, UI/min, UI/kg/h, mUI/min…) com 15 soluções padrão (noradrenalina, adrenalina, dobutamina, dopamina, nitroprussiato, nitroglicerina, vasopressina, amiodarona, midazolam, fentanil, propofol, dexmedetomidina, insulina, heparina, ocitocina), aviso de dose fora da faixa e tabela de titulação.
- **Preparo de medicação:** regra de três com conversão de unidades, reconstituição de pó (com volume do pó, diluição e gotejamento), penicilina cristalina.
- **Maletas personalizadas:** monte maletas com os medicamentos do seu local de trabalho (do zero ou a partir de modelos: carrinho de emergência, atendimento domiciliar, UTI, obstetrícia). Por item: apresentação disponível no local (usada nos cálculos), estoque, validade com alertas (vencido / vence em 30 dias), protocolo local e medicamentos personalizados. Ficha de diluições da maleta para imprimir/PDF e compartilhamento por arquivo (WhatsApp, e-mail) com importação.
- **Modo atendimento ("abrir a maleta"):** informe peso, idade, altura e, se quiser, sexo, creatinina e alergias. Cada medicamento da maleta mostra a dose de referência adulto/pediátrica e a sugestão para o paciente (mg/kg com dose mínima/máxima), o passo a passo do preparo (aspirar, diluir respeitando concentração máxima, tempo respeitando velocidade máxima, mL/h e gotas), alertas (alergia e reação cruzada, idade/peso mínimo, ajuste renal por Cockcroft-Gault/Schwartz, obesidade, validade, estoque) e interações/incompatibilidades com os demais medicamentos da mesma maleta, incluindo se o antídoto está na maleta.
- **Escolha da ampola:** apresentações comerciais usuais de cada medicamento; tocar na ampola/frasco disponível recalcula tudo (ficha, atendimento e intubação) e o app lembra a escolha.
- **Protocolos (53), com referências:** cada protocolo lista as fontes em “📚 Referências”, separadas em 🇧🇷 Brasil (Ministério da Saúde, SAMU 192, Anvisa/PNSP, SBC, SBD, SBP, SBPT, Febrasgo, ILAS, ANCP, SOBRASA, SOBEST…) e 🌎 Internacionais (AHA, ILCOR, ERC, PHTLS, ATLS, Surviving Sepsis, GINA, GOLD, ADA, ESC, NPIAP, IWGDF…), com o Manual MSD como leitura complementar. Novos: PCR adulto, bradicardia, taquicardia, trauma XABCDE, TCE, dengue, animais peçonhentos, afogamento, reanimação neonatal, DPOC, estado hiperglicêmico hiperosmolar, segurança do paciente, quedas, profilaxia de TEV e neutropenia febril. Também: inclui pediatria (desidratação, bronquiolite, crupe, crise febril, febre), obstetrícia (pré-eclâmpsia, hemorragia pós-parto, parto pré-termo, hiperêmese), cuidados paliativos (dor/dispneia, náuseas/constipação, últimos dias), feridas (lesão por pressão, úlcera venosa, pé diabético, celulite/erisipela) e reação transfusional, além de: sepse, choque hipovolêmico, anafilaxia, cetoacidose, hipoglicemia, hiper/hipopotassemia, hiponatremia, emergência hipertensiva, SCA, edema agudo de pulmão, AVC, convulsões/estado de mal, delirium, asma grave, TEP, intoxicações e antídotos, abstinência alcoólica, hemorragia digestiva alta, queimaduras e dor — com passo a passo, medicamentos ligados ao bulário e link para o Manual MSD.
- **Classes de medicamentos:** navegação por 17 grupos (sistema do corpo) → 500 classes terapêuticas da CMED/EphMRA (mecanismo/atuação, ex.: “Antagonistas da angiotensina II puros”, “Inibidores diretos do fator Xa”) → medicamentos; cada ficha mostra a sua classe com link para os demais da mesma classe.
- **Fichas resumidas (286):** inclui 88 medicamentos de catálogo muito usados (estatinas, BRA, betabloqueadores, antidiabéticos orais, antidepressivos, antipsicóticos, antidemência, anticonvulsivantes, AINEs/coxibes, anti-histamínicos, IBPs, antifúngicos, bisfosfonatos, urológicos, colírios antiglaucoma…) com posologia conferida em bula oficial (FDA/DailyMed) ou marcada como sem fonte.
- **Nomes comerciais como itens do Bulário:** 7.195 nomes comerciais listados e filtráveis (⭐ referência, similar, novo, biológico…), além dos 2.432 princípios ativos.
- **Plantão:**
  - 📷 **Leitor de código de barras da caixa** — 27.815 códigos EAN da lista CMED/Anvisa: mostra nome comercial, tipo (referência, similar, genérico…), princípio ativo, apresentação e laboratório, e abre a ficha (câmera via BarcodeDetector ou ZXing; digitação como alternativa; base baixada só quando usada).
  - 🗓️ **Agenda de medicações** por leito: horários do dia a partir do 1º horário e do intervalo, checagem, contagem de atrasadas e lembretes com o app aberto.
  - 📝 **Passagem de plantão SBAR** com NEWS2 automático e pendências da agenda; gera texto para copiar/enviar.
  - 🎤 **Busca por voz** (quando o navegador permite).
- **Módulos por área (8):** Emergência e PCR, UTI, Clínica e enfermaria, Pediatria, Obstetrícia, Atenção domiciliar e paliativos, Feridas e pele, Atenção primária (UBS) — cada um reúne atalhos, protocolos, cálculos, medicamentos e escalas.
- **Escalas (20):** inclui Cincinnati (AVC), CURB-65, Wells (TEP), PUSH (cicatrização), Bishop, Katz, ECOG e Bristol.
- **Novas calculadoras:** débito urinário (mL/kg/h), índice de choque (geral e obstétrico), relação PaO₂/FiO₂, osmolalidade sérica e peso predito com volume corrente.
- **Selecionar em vez de digitar:** apresentações de mercado (ampolas/frascos), diluente, volume de bolsa/seringa e tempo de infusão em listas, com “Outro valor…” quando necessário; botões rápidos de volumes e tempos nas calculadoras.
- **Nomes comerciais com tipo:** cada medicamento mostra os nomes comerciais marcados como ⭐ Referência (listas A e B da Anvisa), Novo, Similar, Biológico, Específico, e quantos fabricantes de genérico existem; todos os nomes comerciais e as variações do nome (sais e grafias, ex.: Losartan / Losartana potássica) aparecem na ficha e valem na busca, que também aceita erros de digitação (ex.: “sivastatina”) e mostra o resultado com o nome digitado (ex.: “Losartan”, “Cozaar”); ao abrir, a ficha traz esse nome no título e indica o princípio ativo e o tipo (referência, similar…).
- **Catálogo oficial:** 2.180 princípios ativos — todos os da Lista de Preços CMED/Anvisa (09/11/2026) e os demais com registro ativo nos Dados Abertos da Anvisa (exceto homeopáticos); gerado por `tools/catalogo`: classe terapêutica, tarja, uso hospitalar, genérico disponível, nomes comerciais e apresentações — sem posologia (link para a bula da Anvisa). Busca também por nome comercial.
- **Bulário:** 2.429 princípios ativos no total — 79 com preparo, dose por paciente e fontes, 196 em ficha resumida e o catálogo; os 257 que já tinham ficha também mostram nomes comerciais e apresentações de mercado (nova categoria Pele, feridas e tópicos). Cada ficha resumida foi conferida com a bula oficial da FDA (DailyMed) ou o Manual MSD — veja `#/conferencia` com posologia de referência (inclusive orais e tópicos); botão para buscar no Manual MSD; resumo próprio (indicações, contraindicações, efeitos adversos, cuidados de enfermagem, gestação/lactação, interações com toda a biblioteca), com busca, índice A–Z e filtro por classe; cada ficha tem abas Preparo · Bula · Paciente · Fontes.
- **Diluições:** ficha de 75 medicamentos (71 conferidos com fontes publicadas, com links) (apresentação, reconstituição, diluição, tempo de administração, estabilidade, cuidados, alerta de alta vigilância) com calculadora de volume.
- **Soluções:** transformação de soro (adicionar ou desprezar e repor), eletrólitos mEq ↔ mL, solução percentual.
- **Pediatria:** dose mg/kg (por dose ou por dia, com dose máxima), Holliday-Segar.
- **Avaliação clínica:** IMC/SC, PAM, clearance de creatinina, balanço hídrico, Parkland, IG/DPP, autonomia do cilindro de O₂.
- **Escalas:** Glasgow (com GCS-P), Braden, Morse, RASS, Ramsay, Apgar, qSOFA, NEWS2, FLACC, CPOT, Aldrete e Kroulik, dor numérica.
- **Referências e revisão:** cada ficha mostra a fonte, o status de revisão profissional e um botão para a bula no Bulário Eletrônico da Anvisa (e ISMP Brasil para alta vigilância). O painel de revisão mostra o progresso e gera uma ficha de conferência para impressão/assinatura pelo farmacêutico. Na maleta, cada item pode ser marcado como "conferido com a bula do fabricante" (nome/registro e data).
- **Modo PCR:** cronômetro total, ciclos de 2 min com alarme, lembrete da adrenalina (janela 3–5 min), choques com energia por peso (pediatria), amiodarona, via aérea, acesso, RCE, metrônomo 110/min, 5H/5T e registro com horário para o prontuário (AHA).
- **Intubação guiada (sequência rápida):** escolha de pré-tratamento, indutor e bloqueador com a ampola disponível, sequência cronometrada com registro, parâmetros ventilatórios iniciais (peso predito, VC 6–8 mL/kg, FR, PEEP, FiO₂, metas) e doses por peso de fentanil, etomidato, cetamina, propofol, midazolam, rocurônio e succinilcolina em mg e mL (concentração editável), contraindicações e checklist SOAP-ME.
- **Hipodermóclise:** vazão por sítio com limites (62,5 mL/h; 1.500 mL/24 h), regras gerais e medicamentos descritos / contraindicados por via SC.
- **9 certos da medicação:** conferência obrigatória antes de registrar uma administração no atendimento.
- **Emergência pediátrica:** peso estimado (APLS), cânula traqueal, energias de desfibrilação/cardioversão, volume, glicose e doses das medicações de emergência em mg e mL.
- **Interações e compatibilidade avulsas:** escolha 2+ medicamentos (ou carregue uma maleta).
- **Registro de administração** no atendimento, com resumo para copiar/compartilhar.
- Busca global, favoritos, tema escuro automático, funcionamento offline.

> ⚠️ Ferramenta de apoio. Não substitui prescrição, bula, protocolos institucionais ou julgamento clínico. Os dados de diluição precisam de revisão periódica por farmacêutico/enfermeiro responsável.

## Rodar localmente

Testes: `npm test` (unidade) e, com `npm start` rodando, `npm run test:e2e` (navegador). Desempenho: `npm run test:desempenho`.


- Só o app (sem .NET): `npm start` e abra http://localhost:8080/enfermagem/
- Com ASP.NET: `dotnet run` e abra a raiz do site.
- Testes dos cálculos: `npm test`

## Estrutura

- `js/calc.js` — fórmulas (funções puras, testadas em `tests/enfermagem/`)
- `js/data.js` — medicamentos, soluções de infusão, eletrólitos, escalas e modelos de maleta
- `js/doses.js` — doses de referência, grupos, alergias, antídotos e interações (revisar com farmácia clínica)
- `js/paciente.js` — motor do modo atendimento (perfil, dose, preparo, alertas, interações), testado
- `js/revisoes.js` — fontes, termos de busca na Anvisa e registro de revisões profissionais (`REVISOES`)
- `js/conteudo.js` — POPs, Processo de Enfermagem, valores laboratoriais e ECG (texto próprio), testado
- `js/editorial.js` — versão do conteúdo, conselho editorial, histórico e contato para relatos de erro
- `js/antimicrobianos.js` — guia de antimicrobianos por sítio de infecção e perfil de resistência, testado
- `js/perfis.js` — perfis das classes terapêuticas (mecanismo, efeitos adversos, enfermagem, alertas), por código CMED/EphMRA, testado
- `js/protocolos.js` — protocolos clínicos resumidos (texto próprio) com links para o Manual MSD
- `js/apresentacoes.js` — apresentações comerciais usuais (para escolher a ampola)
- `js/bulario_extra.js` — bulário ampliado (fichas resumidas)
- `js/bulario.js` — bulário resumido (texto próprio, não reproduz bulas) e categorias
- `js/emergencia.js` — estimativas pediátricas e apoio ao modo PCR, testado
- `js/maletas.js` — modelo de dados das maletas (validade, importar/exportar), testado em `tests/enfermagem/`
- `js/app.js` — interface e calculadoras
- `js/ui.js` — camada de interação (toque, transições, swipe, tema, atalhos)
- `sw.js`, `manifest.webmanifest` — PWA/offline

---

# .NET 7 Hello World

This sample demonstrates a tiny Hello World .NET Core app for [App Service Web App](https://docs.microsoft.com/azure/app-service-web). This sample can be used in a .NET Azure App Service app as well as in a Custom Container Azure App Service app.

## Log in to Azure Container Registry

Using the Azure CLI, log in to the Azure Container Registry (ACR):

```azurecli
az acr login -n <your_registry_name>
```

## Running in a Docker Container

This repository contains 2 Dockerfiles, a Linux container and a Windows container.

### Publish the Windows image to your Registry

To build the Windows image locally and publish to ACR, run the following command:

```docker
docker build -f Dockerfile.windows -t dotnetcore-docs-hello-world-windows . 
docker tag dotnetcore-docs-hello-world-windows <your_registry_name>.azurecr.io/dotnetcore-docs-hello-world-windows:latest
docker push <your_registry_name>.azurecr.io/dotnetcore-docs-hello-world-windows:latest
```

### Publish the Linux image to your Registry

To build the Windows image locally and publish to ACR, run the following command:

```docker
docker build -f Dockerfile.linux -t dotnetcore-docs-hello-world-linux . 
docker tag dotnetcore-docs-hello-world-windows <your_registry_name>.azurecr.io/dotnetcore-docs-hello-world-linux:latest
docker push <your_registry_name>.azurecr.io/dotnetcore-docs-hello-world-linux:latest
```

# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
