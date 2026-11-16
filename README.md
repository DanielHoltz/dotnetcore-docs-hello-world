# EnfCalc — Calculadora de Enfermagem

App para profissionais de enfermagem (PWA: funciona offline e instala na tela inicial do celular), em `wwwroot/enfermagem/`. A raiz do site redireciona para ele.

## Funcionalidades

- **Infusão e gotejamento:** gotas/min e microgotas/min, tempo de infusão, vazão em bomba (mL/h).
- **Infusão contínua / drogas vasoativas:** dose ↔ mL/h (mcg/kg/min, mcg/min, mg/kg/h, UI/min, UI/kg/h, mUI/min…) com 15 soluções padrão (noradrenalina, adrenalina, dobutamina, dopamina, nitroprussiato, nitroglicerina, vasopressina, amiodarona, midazolam, fentanil, propofol, dexmedetomidina, insulina, heparina, ocitocina), aviso de dose fora da faixa e tabela de titulação.
- **Preparo de medicação:** regra de três com conversão de unidades, reconstituição de pó (com volume do pó, diluição e gotejamento), penicilina cristalina.
- **Maletas personalizadas:** monte maletas com os medicamentos do seu local de trabalho (do zero ou a partir de modelos: carrinho de emergência, atendimento domiciliar, UTI, obstetrícia). Por item: apresentação disponível no local (usada nos cálculos), estoque, validade com alertas (vencido / vence em 30 dias), protocolo local e medicamentos personalizados. Ficha de diluições da maleta para imprimir/PDF e compartilhamento por arquivo (WhatsApp, e-mail) com importação.
- **Modo atendimento ("abrir a maleta"):** informe peso, idade, altura e, se quiser, sexo, creatinina e alergias. Cada medicamento da maleta mostra a dose de referência adulto/pediátrica e a sugestão para o paciente (mg/kg com dose mínima/máxima), o passo a passo do preparo (aspirar, diluir respeitando concentração máxima, tempo respeitando velocidade máxima, mL/h e gotas), alertas (alergia e reação cruzada, idade/peso mínimo, ajuste renal por Cockcroft-Gault/Schwartz, obesidade, validade, estoque) e interações/incompatibilidades com os demais medicamentos da mesma maleta, incluindo se o antídoto está na maleta.
- **Escolha da ampola:** apresentações comerciais usuais de cada medicamento; tocar na ampola/frasco disponível recalcula tudo (ficha, atendimento e intubação) e o app lembra a escolha.
- **Protocolos (21):** sepse, choque hipovolêmico, anafilaxia, cetoacidose, hipoglicemia, hiper/hipopotassemia, hiponatremia, emergência hipertensiva, SCA, edema agudo de pulmão, AVC, convulsões/estado de mal, delirium, asma grave, TEP, intoxicações e antídotos, abstinência alcoólica, hemorragia digestiva alta, queimaduras e dor — com passo a passo, medicamentos ligados ao bulário e link para o Manual MSD.
- **Bulário:** 202 medicamentos — 79 com preparo, dose por paciente e fontes, e 123 em ficha resumida com posologia de referência (inclusive orais e tópicos); botão para buscar no Manual MSD; resumo próprio (indicações, contraindicações, efeitos adversos, cuidados de enfermagem, gestação/lactação, interações com toda a biblioteca), com busca, índice A–Z e filtro por classe; cada ficha tem abas Preparo · Bula · Paciente · Fontes.
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

- Só o app (sem .NET): `npm start` e abra http://localhost:8080/enfermagem/
- Com ASP.NET: `dotnet run` e abra a raiz do site.
- Testes dos cálculos: `npm test`

## Estrutura

- `js/calc.js` — fórmulas (funções puras, testadas em `tests/enfermagem/`)
- `js/data.js` — medicamentos, soluções de infusão, eletrólitos, escalas e modelos de maleta
- `js/doses.js` — doses de referência, grupos, alergias, antídotos e interações (revisar com farmácia clínica)
- `js/paciente.js` — motor do modo atendimento (perfil, dose, preparo, alertas, interações), testado
- `js/revisoes.js` — fontes, termos de busca na Anvisa e registro de revisões profissionais (`REVISOES`)
- `js/protocolos.js` — protocolos clínicos resumidos (texto próprio) com links para o Manual MSD
- `js/apresentacoes.js` — apresentações comerciais usuais (para escolher a ampola)
- `js/bulario_extra.js` — bulário ampliado (fichas resumidas)
- `js/bulario.js` — bulário resumido (texto próprio, não reproduz bulas) e categorias
- `js/emergencia.js` — estimativas pediátricas e apoio ao modo PCR, testado
- `js/maletas.js` — modelo de dados das maletas (validade, importar/exportar), testado em `tests/enfermagem/`
- `js/app.js` — interface e calculadoras
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
