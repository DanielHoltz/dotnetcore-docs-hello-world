import os as _os
JSDIR=_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),'..','..','wwwroot','enfermagem','js')+_os.sep
import sys,os,re,json,pickle,collections,subprocess,unicodedata
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cat_norm import base1,titulo,chave
JS=''+JSDIR+''
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
REF=set(open('dl/ref_registros.txt').read().split())
TIPO={'NOVO':'N','SIMILAR':'S','GENÉRICO':'G','ESPECÍFICO':'E','BIOLÓGICO':'B','FITOTERÁPICO':'F','FITOTER?PICO':'F'}
G=collections.defaultdict(lambda:{'raw':set(),'emp':set(),'genemp':set(),'prods':{},'classe':collections.Counter(),'gen':0,'cats':collections.Counter()})
for x in val:
    catr=x['CATEGORIA_REGULATORIA'].upper()
    if 'DINAMIZ' in catr: continue
    pa=x['PRINCIPIO_ATIVO'].strip()
    if not pa: continue
    b=base_reg(pa.upper())
    if not b: continue
    g=G[b]; g['raw'].add(pa); g['emp'].add(x['EMPRESA_DETENTORA_REGISTRO']); g['cats'][x['CATEGORIA_REGULATORIA']]+=1
    if x['CLASSE_TERAPEUTICA']: g['classe'][x['CLASSE_TERAPEUTICA']]+=1
    pn=x['NOME_PRODUTO'].strip(); ref=x['NUMERO_REGISTRO_PRODUTO'].strip()[:9] in REF
    if catr=='GENÉRICO' and not ref: g['gen']=1; g['genemp'].add(x['EMPRESA_DETENTORA_REGISTRO'])
    elif pn and (ref or (chave(pn)!=chave(b) and chave(pn) not in chave(pa))):
        e=g['prods'].setdefault(pn,{'n':0,'t':collections.Counter(),'ref':False}); e['n']+=1; e['t'][TIPO.get(catr,'O')]+=1; e['ref']=e['ref'] or ref
ORD={'R':0,'N':1,'B':2,'E':3,'S':4,'F':5,'O':6,'G':7}
def marcas_de(prods):
    L=[[titulo(p),'R' if e['ref'] else e['t'].most_common(1)[0][0],e['n']] for p,e in prods.items()]
    L.sort(key=lambda x:(ORD.get(x[1],9),-x[2],x[0]))
    return [x[:2] for x in L]
def lev(a,b):
    v=list(range(len(b)+1))
    for i in range(1,len(a)+1):
        prev=v[0]; v[0]=i
        for j in range(1,len(b)+1):
            tmp=v[j]; v[j]=min(v[j]+1,v[j-1]+1,prev+(a[i-1]!=b[j-1])); prev=tmp
    return v[len(b)]
ids=set(meta['ids']); novos=[]
def mkid(n):
    k=re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFD',n.lower()).encode('ascii','ignore').decode())).strip('-')[:48]
    i=k;j=2
    while i in ids: i='%s-%d'%(k,j); j+=1
    ids.add(i); return 'r-'+i
EXC=r'^(TESTE|ÁGUA|AGUA|CELULOSE|LACTOSE|EXCIPIENTE|ASSOCIAÇÕES|ASSOCIACOES|VEÍCULO|ESTEARATO DE MAGNÉSIO|AMIDO|SACAROSE|TALCO)\b'
def nomes_de(raws,b):
    out=set()
    simples='+' not in b
    for x in raws:
        partes=[p.strip() for p in re.split(r',\s*|;|\s\+\s',x) if p.strip() and not re.search(EXC,p.strip().upper())]
        if simples: cand=partes
        else: cand=[' + '.join(partes)] if len(partes)<=4 else []
        for p in cand:
            t=titulo(re.sub(r'\s+',' ',p))
            if t and chave(t)!=chave(b): out.add(t)
    return out
IDX={}
for c in cat['cat']: IDX.setdefault(ck(c.get('base',c['nome'].upper())),c)
for i,v in cat['mercado'].items(): IDX.setdefault(ck(v.get('base','')),v)
def merge(e,b,g):
    nomes=set(e.get('nomes',[]))|nomes_de(g['raw'],b)
    if '+' not in b: nomes.add(titulo(b))
    e['nomes']=sorted(n for n in nomes if chave(n)!=chave(e['nome']))
    have=set(chave(m[0]) for m in e['marcas'])
    for m in marcas_de(g['prods']):
        if chave(m[0]) not in have: e['marcas'].append(m); have.add(chave(m[0]))
    e['marcas'].sort(key=lambda x:ORD.get(x[1],9))
    e['gen']=max(e['gen'],len(g['genemp']))
    e['fab']=max(e.get('labs',0),len(g['emp']))
for b,g in sorted(G.items()):
    kb=ck(b); alvo=IDX.get(kb)
    if alvo is None and '+' not in kb and len(kb)>=6:
        for k,e in IDX.items():
            if '+' in k: continue
            if (k.startswith(kb) or kb.startswith(k)) and abs(len(k)-len(kb))<=2: alvo=e; break
    if alvo is not None:
        merge(alvo,b,g); continue
    if kb in conhecidos: continue
    parts=b.split(' + ')
    top=sorted(g['prods'].items(),key=lambda kv:-kv[1]['n'])
    nome=((titulo(top[0][0])+' — ') if top and len(parts)>3 else '')+('associação de %d componentes'%len(parts) if len(parts)>3 else titulo(b))
    cl=g['classe'].most_common(1)[0][0] if g['classe'] else ''
    tipo=g['cats'].most_common(1)[0][0]
    novos.append({'id':mkid(b),'nome':nome,'comp':titulo(b) if len(parts)>3 else '','cat':cat_de(cl+' '+tipo),'classe':(cl.capitalize() if cl else tipo.capitalize()),
      'nomes':sorted(nomes_de(g['raw'],b)),'base':b,'tarja':-1,'tmax':-1,'hosp':0,'gen':len(g['genemp']),'labs':len(g['emp']),'marcas':marcas_de(g['prods']),'ap':[],'o':2})
print('registro: bases',len(G),'novas',len(novos)); print(collections.Counter(n['cat'] for n in novos))
import random; random.seed(5); print([n['nome'] for n in random.sample(novos,25)])
cat['cat']+=novos
json.dump(cat,open('catalogo.json','w'),ensure_ascii=False)
print('total catálogo',len(cat['cat']))
