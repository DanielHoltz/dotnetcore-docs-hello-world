# Roteiro de testes com enfermeiros e com leitores de tela

## Usabilidade (5 a 8 enfermeiros, de preferência em plantão real ou simulado)
Tarefas (cronometrar, contar toques e erros; meta: até 3 toques nas tarefas críticas):
1. Calcular quantos mL aspirar de dipirona 1 g para dose de 500 mg.
2. Ajustar noradrenalina para 0,1 mcg/kg/min num paciente de 70 kg (mL/h).
3. Encontrar "Losartan" pela busca e ver se é referência ou genérico.
4. Iniciar o Modo PCR, marcar FV, registrar choque e adrenalina e encerrar.
5. Ver se meropenem serve para Enterobacter com ESBL em pneumonia associada à ventilação.
6. Montar plano de cuidados para dor e risco de queda e copiar.
7. Cadastrar um horário na agenda e checar a dose.
Pós-teste: questionário SUS (System Usability Scale) e perguntas abertas ("o que te fez hesitar?").

## Acessibilidade
- Leitores de tela: TalkBack (Android/Chrome), VoiceOver (iOS/Safari), NVDA (Windows/Firefox ou Chrome).
- Verificar: anúncio da troca de tela (região `#sr-rota`), abas da ficha (setas), diálogos (foco preso e devolvido), erros de campo (`role="alert"`), status online/offline, botões com nome.
- Zoom de 200% e fonte grande do sistema sem perda de conteúdo; contraste nos dois temas.
- Registrar achados como issues com o passo a passo de reprodução.
