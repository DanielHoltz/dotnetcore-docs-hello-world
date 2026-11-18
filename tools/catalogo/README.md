# Gerador do catálogo de medicamentos (CMED/Anvisa)

Gera `wwwroot/enfermagem/js/catalogo.js` a partir de dados públicos:

1. Lista de Preços de Medicamentos (PMC) da CMED/Anvisa — https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos
2. Listas A e B de medicamentos de referência da Anvisa (marcam qual nome comercial é a referência)
3. Dados Abertos Anvisa — `DADOS_ABERTOS_MEDICAMENTOS.csv` (registros ativos) — https://dados.anvisa.gov.br/dados/

Passos (rodar nesta pasta, com os arquivos baixados em `dl/`):

```
mkdir -p dl
# baixar a planilha PMC mais recente como dl/cmed.xlsx e o CSV como dl/reg.csv
python3 -c "import openpyxl,pickle;ws=openpyxl.load_workbook('dl/cmed.xlsx',read_only=True)['Lista PMC'];r=list(ws.iter_rows(values_only=True));pickle.dump(([str(c) for c in r[0]],r[1:]),open('dl/cmed.pkl','wb'))"
python3 -c "import csv,pickle;pickle.dump([x for x in csv.DictReader(open('dl/reg.csv',encoding='latin1'),delimiter=';') if x['SITUACAO_REGISTRO']=='Ativo'],open('dl/reg_val.pkl','wb'))"
# listas de medicamentos de referência (A e B) da Anvisa, em PDF, convertidas com pdftotext:
# https://www.gov.br/anvisa/pt-br/setorregulado/regularizacao/medicamentos/medicamentos-de-referencia/lista-de-medicamentos-de-referencia
cat dl/lista-a*.txt dl/lista-b*.txt | grep -oE '(^|[^0-9])1[0-9]{8}([^0-9]|$)' | grep -oE '1[0-9]{8}' | sort -u > dl/ref_registros.txt
python3 cat_build.py && python3 cat_reg.py && python3 cat_js.py && python3 cat_ean.py   # cat_ean gera js/ean.js (códigos de barras)
```

Atualize a data da fonte em `cat_js.py` ao usar uma lista nova. O catálogo não contém posologia.
