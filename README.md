# EnfCalc — Calculadora de Enfermagem

App para profissionais de enfermagem (PWA: funciona offline e instala na tela inicial do celular), em `wwwroot/enfermagem/`. A raiz do site redireciona para ele.

## Funcionalidades

- **Infusão e gotejamento:** gotas/min e microgotas/min, tempo de infusão, vazão em bomba (mL/h).
- **Infusão contínua / drogas vasoativas:** dose ↔ mL/h (mcg/kg/min, mcg/min, mg/kg/h, UI/min, UI/kg/h, mUI/min…) com 15 soluções padrão (noradrenalina, adrenalina, dobutamina, dopamina, nitroprussiato, nitroglicerina, vasopressina, amiodarona, midazolam, fentanil, propofol, dexmedetomidina, insulina, heparina, ocitocina), aviso de dose fora da faixa e tabela de titulação.
- **Preparo de medicação:** regra de três com conversão de unidades, reconstituição de pó (com volume do pó, diluição e gotejamento), penicilina cristalina.
- **Maletas personalizadas:** monte maletas com os medicamentos do seu local de trabalho (do zero ou a partir de modelos: carrinho de emergência, atendimento domiciliar, UTI, obstetrícia). Por item: apresentação disponível no local (usada nos cálculos), estoque, validade com alertas (vencido / vence em 30 dias), protocolo local e medicamentos personalizados. Ficha de diluições da maleta para imprimir/PDF e compartilhamento por arquivo (WhatsApp, e-mail) com importação.
- **Diluições:** ficha de 48 medicamentos (apresentação, reconstituição, diluição, tempo de administração, estabilidade, cuidados, alerta de alta vigilância) com calculadora de volume.
- **Soluções:** transformação de soro (adicionar ou desprezar e repor), eletrólitos mEq ↔ mL, solução percentual.
- **Pediatria:** dose mg/kg (por dose ou por dia, com dose máxima), Holliday-Segar.
- **Avaliação clínica:** IMC/SC, PAM, clearance de creatinina, balanço hídrico, Parkland, IG/DPP, autonomia do cilindro de O₂.
- **Escalas:** Glasgow (com GCS-P), Braden, Morse, RASS, Ramsay, Apgar, qSOFA, dor numérica.
- Busca global, favoritos, tema escuro automático, funcionamento offline.

> ⚠️ Ferramenta de apoio. Não substitui prescrição, bula, protocolos institucionais ou julgamento clínico. Os dados de diluição precisam de revisão periódica por farmacêutico/enfermeiro responsável.

## Rodar localmente

- Só o app (sem .NET): `npm start` e abra http://localhost:8080/enfermagem/
- Com ASP.NET: `dotnet run` e abra a raiz do site.
- Testes dos cálculos: `npm test`

## Estrutura

- `js/calc.js` — fórmulas (funções puras, testadas em `tests/enfermagem/`)
- `js/data.js` — medicamentos, soluções de infusão, eletrólitos, escalas e modelos de maleta
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
