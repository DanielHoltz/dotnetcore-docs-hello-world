# Gerador do catálogo de medicamentos (CMED/Anvisa)

Gera `wwwroot/enfermagem/js/catalogo.js` a partir de dados públicos:

1. Lista de Preços de Medicamentos (PMC) da CMED/Anvisa — https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos
2. Dados Abertos Anvisa — `DADOS_ABERTOS_MEDICAMENTOS.csv` (registros ativos) — https://dados.anvisa.gov.br/dados/

Passos (rodar nesta pasta, com os arquivos baixados em `dl/`):

```
mkdir -p dl
# baixar a planilha PMC mais recente como dl/cmed.xlsx e o CSV como dl/reg.csv
python3 -c "import openpyxl,pickle;ws=openpyxl.load_workbook('dl/cmed.xlsx',read_only=True)['Lista PMC'];r=list(ws.iter_rows(values_only=True));pickle.dump(([str(c) for c in r[0]],r[1:]),open('dl/cmed.pkl','wb'))"
python3 -c "import csv,pickle;pickle.dump([x for x in csv.DictReader(open('dl/reg.csv',encoding='latin1'),delimiter=';') if x['SITUACAO_REGISTRO']=='Ativo'],open('dl/reg_val.pkl','wb'))"
python3 cat_build.py && python3 cat_reg.py && python3 cat_js.py
```

Atualize a data da fonte em `cat_js.py` ao usar uma lista nova. O catálogo não contém posologia.
