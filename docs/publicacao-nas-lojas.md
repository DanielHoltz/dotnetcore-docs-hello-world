# Publicação na Play Store e na App Store

O EnfCalc é um PWA com manifesto completo (ícones, atalhos, categorias, capturas de tela) e service worker offline.

## Android (Play Store) — Trusted Web Activity
1. Hospedar em domínio próprio com HTTPS (recomendado em vez do GitHub Pages para controlar `/.well-known/`).
2. Gerar o projeto com **PWABuilder** (pwabuilder.com → Android) ou **Bubblewrap** (`npx @bubblewrap/cli init --manifest https://SEU-DOMINIO/manifest.webmanifest`).
3. Publicar `/.well-known/assetlinks.json` com o SHA-256 da chave de assinatura (o PWABuilder gera o arquivo).
4. Conta de desenvolvedor Google Play (taxa única); preencher a ficha (categoria Medicina), a política de privacidade (URL pública — ver `politica-de-privacidade.md`) e a declaração de dados ("nenhum dado coletado").
5. Notificações com o app fechado: exigem Web Push (servidor) ou camada nativa.

## iOS (App Store)
- O PWABuilder gera um projeto Xcode (WKWebView). Exige Mac, conta Apple Developer (anual) e revisão da Apple, que costuma exigir funcionalidade além de um site (o app atende: offline, PCR, cálculos).
- Alternativa: **Capacitor** (`npx cap add ios`), permitindo notificações locais da agenda.

## Antes de enviar
- Validação clínica registrada (conselho editorial) e posição regulatória (ver `regulatorio-e-lgpd.md`).
- Capturas de tela atualizadas em `wwwroot/enfermagem/screenshots/`.
