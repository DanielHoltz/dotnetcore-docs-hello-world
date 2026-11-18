import sys,os,re,json,pickle,collections
H0=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,H0)
from cat_norm import base,titulo
# reaproveita apres() do cat_build.py sem reexecutar o build inteiro
src=open(os.path.join(H0,'cat_build.py')).read()
ns={}
exec("import re\n"+src[src.index("FORM=["):src.index("def cat_de")],ns)
apres=ns['apres']
JSDIR=sys.argv[1] if len(sys.argv)>1 else os.path.join(H0,'..','..','wwwroot','enfermagem','js')+os.sep
H,rows=pickle.load(open('dl/cmed.pkl','rb')); ix={h:i for i,h in enumerate(H)}
cat=json.load(open('catalogo.json'))
b2id={}
for k,v in cat['mercado'].items(): b2id.setdefault(v['base'],k)
for c in cat['cat']: b2id.setdefault(c['base'],c['id'])
REF=set(open('dl/ref_registros.txt').read().split())
TIPO={'Novo':'N','Similar':'S','Genérico':'G','Específico':'E','Biológico':'B','Fitoterápico':'F'}
ids=[];idi={};labs=[];labi={};prods=[];pk={};E={};BR=[];bri={};AP=[];api={}
for r in rows:
    s=r[ix['SUBSTÂNCIA']]
    if not s: continue
    did=b2id.get(base(s))
    if not did: continue
    brand=titulo(str(r[ix['PRODUTO']]).strip())
    a=str(r[ix['APRESENTAÇÃO']] or '')
    ap=apres(a) or ''
    m=re.search(r'X\s*(\d+)\s*(?:\(|$)',a.strip())
    lab=re.sub(r'\s+(S\.?A\.?|LTDA\.?|S/A|EIRELI|ME)\b.*$','',str(r[ix['LABORATÓRIO']]).strip()).title()
    tipo='R' if str(r[ix['REGISTRO']] or '')[:9] in REF else TIPO.get(str(r[ix['TIPO DE PRODUTO (STATUS DO PRODUTO)']]),'O')
    if did not in idi: idi[did]=len(ids); ids.append(did)
    if lab not in labi: labi[lab]=len(labs); labs.append(lab)
    apx=ap+(' — embalagem com %s'%m.group(1) if m else '')
    if brand not in bri: bri[brand]=len(BR); BR.append(brand)
    if apx not in api: api[apx]=len(AP); AP.append(apx)
    key=(idi[did],bri[brand],api[apx],labi[lab],tipo)
    if key not in pk: pk[key]=len(prods); prods.append(list(key))
    for c in ('EAN 1','EAN 2','EAN 3'):
        e=re.sub(r'\D','',str(r[ix[c]] or ''))
        if len(e) in (8,12,13,14): E.setdefault(e,pk[key])
eanstr=','.join('%s:%d'%(e,i) for e,i in E.items())
js=("/* EnfCalc — códigos de barras (EAN) das embalagens: Lista de Preços CMED/Anvisa (09/11/2026). Gerado automaticamente.\n"
    " * P: [índice em IDS, índice em BR (nome comercial), índice em AP (apresentação), índice em LABS, tipo (R referência, N novo, S similar, G genérico, E específico, B biológico, F fitoterápico)] */\n"
    "window.EAN_DB = {\n  IDS: "+json.dumps(ids,ensure_ascii=False)+",\n  LABS: "+json.dumps(labs,ensure_ascii=False)+",\n  BR: "+json.dumps(BR,ensure_ascii=False,separators=(',',':'))+",\n  AP: "+json.dumps(AP,ensure_ascii=False,separators=(',',':'))+",\n  P: "+json.dumps(prods,ensure_ascii=False,separators=(',',':'))+",\n  E: '"+eanstr+"'\n};\n")
open(JSDIR+'ean.js','w').write(js)
print('ids',len(ids),'labs',len(labs),'produtos',len(prods),'eans',len(E),'KB',len(js.encode())//1024)
