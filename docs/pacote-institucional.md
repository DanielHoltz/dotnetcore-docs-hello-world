# Formato do pacote institucional (`enfcalc-instituicao-1`)

Arquivo JSON carregado em **Minha instituição** (`#/instituicao`). Fica só no aparelho. O app gera um modelo.

```json
{
  "formato": "enfcalc-instituicao-1",
  "nome": "Hospital Exemplo",
  "versao": "2027-01",
  "responsavel": "Comissão de Farmácia e Terapêutica",
  "contatos": [["CCIH", "Ramal 1234"], ["Farmácia clínica", "Ramal 2345"]],
  "protocolos": [{ "titulo": "Protocolo institucional de sepse", "texto": "Parágrafo 1\nParágrafo 2" }],
  "medicamentos": { "vancomicina": "Padrão da instituição para preparo e administração." }
}
```
- `medicamentos`: chave = id do medicamento no app (aparece na URL `#/droga/<id>`); o texto aparece no topo da ficha.
- Limites: 100 protocolos (20.000 caracteres cada), 500 medicamentos, 30 contatos. Texto é exibido como texto puro (sem HTML).
- Distribuição: intranet, e-mail ou QR code apontando para o arquivo; atualizar a `versao` a cada mudança.
