import os as _os
JSDIR=_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),'..','..','wwwroot','enfermagem','js')+_os.sep
import sys,os,re,json,pickle,collections,subprocess,unicodedata
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cat_norm import base1,titulo,chave
JS=JSDIR
val=pickle.load(open('dl/reg_val.pkl','rb'))
meta=json.load(open('dl/cmed_meta.json')); cat=json.load(open('catalogo.json'))
def nucleo(p): return ' '.join(re.findall(r'[a-z0-9]+',unicodedata.normalize('NFD',p.lower()).encode('ascii','ignore').decode())[:2])
def base_reg(pa):
    partes=[base1(p) for p in re.split(r',\s*|\s\+\s|;',pa) if p.strip()]
    partes=[p for p in partes if len(p)>2 and not re.search(r'^(TESTE|ÁGUA|AGUA|CELULOSE|LACTOSE|EXCIPIENTE|ASSOCIAÇÕES|ASSOCIACOES|VEÍCULO|ESTEARATO DE MAGNÉSIO|AMIDO|SACAROSE|TALCO)\b',p)]
    out=[]
    for p in sorted(set(partes),key=len):
        k=nucleo(p); ck=chave(p)
        if any(nucleo(q)==k or k.startswith(nucleo(q)) or (len(chave(q))>4 and chave(q) in ck) for q in out): continue
        out.append(p)
    return ' + '.join(sorted(out))
def ck(b): return '+'.join(sorted(chave(p) for p in b.split(' + ')))
conhecidos=set(ck(b) for b in meta['bases'])
app=json.loads(subprocess.run(['node','-e',"const D=require('%sdata.js'),X=require('%sbulario_extra.js');console.log(JSON.stringify([...D.DRUGS,...X.EXTRAS].map(d=>d.nome)))"%(JS,JS)],capture_output=True,text=True).stdout)
for n in app: conhecidos.add(ck(re.sub(r'\(.*?\)','',n).upper()))
for c in cat['cat']: conhecidos.add(ck(c['nome'].upper()))
def cat_de(cl):
    c=cl.upper()
    R=[('onco',r'NEOPL|IMUNOSSUPRESS|IMUNOMODUL|CITOST|QUIMIOT'),('antimicrobiano',r'ANTIBI|ANTIMICROB|ANTIVIR|ANTIFUNG|ANTIMIC[OÓ]T|ANTIPARASIT|ANTI-?HELM|ANTIMAL|TUBERCUL|ANTISS[EÉ]PTICO URIN|ANTIRRETROVIR|SULFONAM'),
       ('outros',r'VACINA|SORO|IMUNOGLOBUL|VITAMIN|SUPLEMENT|POLIVITAM|RADIOF|DIAGN|CONTRASTE|GASES'),('antidoto',r'ANT[IÍ]DOTO|DESINTOX'),
       ('analgesia',r'ANALG|ANTIDEPRESS|ANSIOL|ANTIPSIC|ANTIEPIL|ANTICONVULS|ANEST|HIPN[OÓ]T|SEDAT|ANTIENXAQ|ANTIPARKINS|ANTI-?INFLAM|ANTIRREUM|RELAXANTE MUSC|ESTIMULANTE|PSICO|DEMÊNCIA|ALZHEIM|OPI[OÓ]'),
       ('cardio',r'ANTI-?HIPERTENS|DIUR[EÉ]T|CARD|ANTIARR|VASODIL|ANTIANGIN|HIPOLIPEM|ANTILIPEM|VASOPROT|VARIZ|HEMORR[OÓ]ID'),('hemato',r'ANTICOAG|HEMOST|ANTIAN[EÊ]M|ANTITROMB|ANTIAGREG|FATOR|HEMAT|FERRO'),
       ('gastro',r'ANTI[AÁ]CID|LAXAT|ANTIEM[EÉ]T|ANTIESPASM|ANTIDIARR|DIGEST|ANTIULC|ANTIFL[AA]T|HEPAT|COLAG|PROBI|GASTR|ANTIFLATUL|ANTIGASES'),
       ('hormonio',r'HORM|ANTIDIAB|HIPOGLIC|INSULIN|CONTRACEP|TIRE|CORTIC|ESTROG|ANDROG|PROGEST|OVUL|FERTIL|OSTEOP'),('respiratorio',r'BRONCO|ANTITUSS|EXPECTOR|MUCOL|DESCONGEST|ANTIAL[EÉ]RG|ANTI-?HISTAM|ASMA|RESPIR|NASAL'),
       ('pele',r'DERMAT|ANTISS[EÉ]PT|CICATRIZ|QUERAT|ACNE|PSORI|ANTISEBORR|CAPILAR|EMOLIENTE'),('oftalmo',r'OFT|OTOL[OÓ]G|OCULAR|GLAUCOMA|LUBRIFICANTE OCUL'),('eletrolito',r'SOLU[CÇ]|ELETROL|HIDRAT|PARENTER|REPOSI|DIALIS|NUTRI')]
    for k,p in R:
        if re.search(p,c): return k
    return 'outros'
G=collections.defaultdict(lambda:{'emp':set(),'prods':collections.Counter(),'classe':collections.Counter(),'gen':0,'cats':collections.Counter()})
for x in val:
    catr=x['CATEGORIA_REGULATORIA'].upper()
    if 'DINAMIZ' in catr: continue
    pa=x['PRINCIPIO_ATIVO'].strip()
    if not pa: continue
    b=base_reg(pa.upper())
    if not b: continue
    g=G[b]; g['emp'].add(x['EMPRESA_DETENTORA_REGISTRO']); g['cats'][x['CATEGORIA_REGULATORIA']]+=1
    if x['CLASSE_TERAPEUTICA']: g['classe'][x['CLASSE_TERAPEUTICA']]+=1
    if catr=='GENÉRICO': g['gen']=1
    else:
        pn=x['NOME_PRODUTO'].strip()
        if pn and chave(pn)!=chave(b) and chave(pn) not in chave(pa): g['prods'][pn]+=1
ids=set(meta['ids']); novos=[]
def mkid(n):
    k=re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFD',n.lower()).encode('ascii','ignore').decode())).strip('-')[:48]
    i=k;j=2
    while i in ids: i='%s-%d'%(k,j); j+=1
    ids.add(i); return 'r-'+i
for b,g in sorted(G.items()):
    if ck(b) in conhecidos: continue
    parts=b.split(' + ')
    nome=((titulo(g['prods'].most_common(1)[0][0])+' — ') if g['prods'] and len(parts)>3 else '')+('associação de %d componentes'%len(parts) if len(parts)>3 else titulo(b))
    cl=g['classe'].most_common(1)[0][0] if g['classe'] else ''
    tipo=g['cats'].most_common(1)[0][0]
    novos.append({'id':mkid(b),'nome':nome,'comp':titulo(b) if len(parts)>3 else '','cat':cat_de(cl+' '+tipo),'classe':(cl.capitalize() if cl else tipo.capitalize()),
      'tarja':-1,'tmax':-1,'hosp':0,'gen':g['gen'],'labs':len(g['emp']),'marcas':[titulo(p) for p,_ in g['prods'].most_common(10)],'ap':[],'o':2})
print('registro: bases',len(G),'novas',len(novos)); print(collections.Counter(n['cat'] for n in novos))
import random; random.seed(5); print([n['nome'] for n in random.sample(novos,25)])
cat['cat']+=novos
json.dump(cat,open('catalogo.json','w'),ensure_ascii=False)
print('total catálogo',len(cat['cat']))
