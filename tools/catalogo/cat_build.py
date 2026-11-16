import os as _os
JSDIR=_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),'..','..','wwwroot','enfermagem','js')+_os.sep
import sys,os,re,json,pickle,collections,subprocess
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cat_norm import base,titulo,chave
JS=JSDIR
H,rows=pickle.load(open('dl/cmed.pkl','rb')); ix={h:i for i,h in enumerate(H)}
FORM=[(r'\bCOM REV\b','comprimido revestido'),(r'\bCOM EFEV\b','comprimido efervescente'),(r'\bCOM MAST\b','comprimido mastigável'),(r'\bCOM ORODISP\b','comprimido orodispersível'),
(r'\bCOM SUBL\b','comprimido sublingual'),(r'\bCOM\b','comprimido'),(r'\bCAP DURA\b','cápsula'),(r'\bCAP MOLE\b','cápsula mole'),(r'\bCAP\b','cápsula'),
(r'\bLIB PROL\b','lib. prolongada'),(r'\bLIB RETARD\b','lib. retardada'),(r'\bLIB MOD\b','lib. modificada'),(r'\bLIB CONTR\b','lib. controlada'),
(r'\bPO LIOF\b','pó liofilizado'),(r'\bP[OÓ] SOL INJ\b','pó para solução injetável'),(r'\bP[OÓ] P/ SOL INJ\b','pó para solução injetável'),(r'\bP/\s','para '),(r'\bSOL INJ\b','solução injetável'),(r'\bSUS INJ\b','suspensão injetável'),(r'\bEMU INJ\b','emulsão injetável'),
(r'\bSOL DIL INFUS\b','solução para diluição'),(r'\bSOL INFUS\b','solução para infusão'),(r'\bSOL OR GOT\b','gotas'),(r'\bSOL OR\b','solução oral'),(r'\bSUS OR\b','suspensão oral'),(r'\bGOT\b','gotas'),
(r'\bXPE\b','xarope'),(r'\bCREM DERM\b','creme'),(r'\bCREM VAG\b','creme vaginal'),(r'\bPOM DERM\b','pomada'),(r'\bPOM OFT\b','pomada oftálmica'),(r'\bPOM\b','pomada'),(r'\bGEL DERM\b','gel'),
(r'\bSOL OFT\b','colírio'),(r'\bSUS OFT\b','colírio (suspensão)'),(r'\bSOL OTO\b','solução otológica'),(r'\bSPR NAS\b','spray nasal'),(r'\bSUS AER\b','aerossol'),(r'\bAER\b','aerossol'),
(r'\bP[OÓ] INAL\b','pó inalante'),(r'\bSOL INAL\b','solução para inalação'),(r'\bADES TRANSD\b','adesivo transdérmico'),(r'\bSUP\b','supositório'),(r'\bGRAN\b','granulado'),
(r'\bP[OÓ] SUS OR\b','pó para suspensão oral'),(r'\bP[OÓ] OR\b','pó oral'),(r'\bSOL CAPI\b','solução capilar'),(r'\bSOL TOP\b','solução tópica'),(r'\bLOC\b','loção'),(r'\bSH\b','xampu')]
CONT=[(r'\bAMP\b','ampola'),(r'\bFA\b','frasco-ampola'),(r'\bSER\b','seringa'),(r'\bBOLS\b','bolsa'),(r'\bFR\b','frasco'),(r'\bCAN\b','caneta'),(r'\bBG\b','bisnaga')]
def apres(a):
    a=re.sub(r'\s+',' ',str(a or '')).strip()
    if not a: return None
    m=re.search(r'\s(CT|CX|DISPLAY|STRIP|ENV|EMB)\b',a)
    head=a[:m.start()] if m else a
    tail=a[m.start():] if m else ''
    vol=re.search(r'X (\d+(?:[.,]\d+)?) (ML|G|L)\b',tail)
    cont=next((n for p,n in CONT if re.search(p,tail)),None)
    h=head
    for p,n in FORM: h=re.sub(p,n,h)
    h=re.sub(r'\b(IV|IM|SC|IM/IV|IV/IM)\b',lambda m:m.group(1),h)
    h=re.sub(r'(\d)(MG|MCG|G|UI)\b',r'\1 \2',h)
    h=re.sub(r'(\d),0+ ',r'\1 ',h)
    h=re.sub(r'\bMG\b','mg',h); h=re.sub(r'\bMCG\b','mcg',h); h=re.sub(r'\bML\b','mL',h); h=re.sub(r'(?<=\d )G\b','g',h); h=re.sub(r'/G\b','/g',h)
    if vol and cont and re.search(r'injet|infus|diluição|oral|xarope|gotas|colírio|frasco|bolsa',h+' '+cont):
        h+=' — %s %s %s'%(cont,vol.group(1),vol.group(2).replace('ML','mL').replace('G','g'))
    elif vol and re.search(r'creme|pomada|gel|xarope|solução|suspensão|gotas|colírio',h):
        h+=' — %s %s'%(vol.group(1),vol.group(2).replace('ML','mL').replace('G','g'))
    if 'HOSP' in tail: h+=' (hosp.)'
    return h.strip()
def cat_de(cl):
    c=(cl or '').split(' ')[0]
    if c.startswith('A10'): return 'hormonio'
    if c.startswith('A11') or c.startswith('A13'): return 'outros'
    if c.startswith('A12'): return 'eletrolito'
    if c.startswith('V3'): return 'antidoto'
    if c.startswith('M1') : return 'analgesia'
    return {'A':'gastro','B':'hemato','C':'cardio','D':'pele','G':'hormonio','H':'hormonio','J':'antimicrobiano','K':'eletrolito','L':'onco','M':'outros','N':'analgesia','P':'antimicrobiano','R':'respiratorio','S':'oftalmo','T':'outros','V':'outros'}.get(c[:1],'outros')
TARJA={'Tarja Preta':3,'Tarja Vermelha sob restrição':2,'Tarja Vermelha':1}
G=collections.defaultdict(lambda:{'subs':collections.Counter(),'labs':set(),'prods':collections.Counter(),'ap':collections.Counter(),'classe':collections.Counter(),'tarja':collections.Counter(),'hosp':0,'tot':0,'gen':0,'com':0,'tipos':collections.Counter()})
for r in rows:
    s=r[ix['SUBSTÂNCIA']]
    if not s: continue
    b=base(s); g=G[b]
    g['subs'][s.strip()]+=1; g['labs'].add(r[ix['LABORATÓRIO']]); g['tot']+=1
    tipo=str(r[ix['TIPO DE PRODUTO (STATUS DO PRODUTO)']]); g['tipos'][tipo]+=1
    if tipo=='Genérico': g['gen']=1
    else:
        pn=str(r[ix['PRODUTO']]).strip()
        if pn and chave(pn)!=chave(b) and chave(pn)!=chave(s): g['prods'][pn]+=1
    a=apres(r[ix['APRESENTAÇÃO']]); 
    if a: g['ap'][a]+=1
    g['classe'][str(r[ix['CLASSE TERAPÊUTICA']])]+=1
    tj=str(r[ix['TARJA']]).strip()
    if tj.startswith('Tarja'): g['tarja'][TARJA.get(tj,0)]+=1
    if r[ix['RESTRIÇÃO HOSPITALAR']]=='Sim': g['hosp']+=1
    if r[ix['COMERCIALIZAÇÃO 2025']]=='Sim': g['com']+=1
# app drugs to link
app=json.loads(subprocess.run(['node','-e',"const D=require('%sdata.js'),X=require('%sbulario_extra.js'),R=require('%srevisoes.js');console.log(JSON.stringify([...D.DRUGS.map(d=>[d.id,d.nome,R.BUSCA_ANVISA[d.id]||'']),...X.EXTRAS.map(x=>[x.id,x.nome,''])]))"%(JS,JS,JS)],capture_output=True,text=True).stdout)
SIN={'cefalotina':'CEFALOTINA SODICA','heparina':'HEPARINA SÓDICA SUÍNA','nitroprussiato':'NITROPRUSSETO','fentanil':'FENTANILA','fentanil-transdermico':'FENTANILA','escopolamina':'BUTILBROMETO DE ESCOPOLAMINA',
'vasopressina':'VASOPRESSINA SINTETICA','cetamina':'ESCETAMINA','rocuronio':'BROMETO DE ROCURÔNIO','succinilcolina':'CLORETO DE SUXAMETÔNIO','cetorolaco':'CETOROLACO TROMETAMINA','valproato':'VALPROATO',
'isossorbida':'MONONITRATO DE ISOSSORBIDA','sinvastatina':'SINVASTATINA','apixabana':'APIXABANA','glibenclamida':'GLIBENCLAMIDA','insulina-glargina':'INSULINA GLARGINA','insulina-rapida':'INSULINA ASPARTE',
'prednisona':'PREDNISONA','budesonida':'BUDESONIDA','salbutamol':'SALBUTAMOL','albumina':'ALBUMINA HUMANA','carvao-ativado':'CARVÃO VEGETAL ATIVADO','cianocobalamina':'CIANOCOBALAMINA','manitol':'MANITOL',
'gabapentina':'GABAPENTINA','loratadina':'LORATADINA','pvpi':'IODO POVIDONA PVPI','neostigmina':'METILSULFATO DE NEOSTIGMINA','cisatracurio':'BESILATO DE CISATRACÚRIO','dabigatrana':'ETEXILATO DE DABIGATRANA',
'ceftarolina':'CEFTAROLINA FOSAMILA','ceftazidima-avibactam':'AVIBACTAM + CEFTAZIDIMA PENTAIDRATADA','buprenorfina-transdermica':'BUPRENORFINA','lidocaina':'LIDOCAÍNA',
'fosfato-potassio':'FOSFATO DE POTÁSSIO DIBÁSICO + FOSFATO DE POTÁSSIO MONOBÁSICO','adrenalina':'EPINEFRINA','noradrenalina':'NOREPINEFRINA','paracetamol-ev':'PARACETAMOL','paracetamol-oral':'PARACETAMOL',
'smx-tmp':'SULFAMETOXAZOL + TRIMETOPRIMA','smx-tmp-oral':'SULFAMETOXAZOL + TRIMETOPRIMA','amoxi-clav':'AMOXICILINA + CLAVULANATO','pipe-tazo':'PIPERACILINA + TAZOBACTAM','ampi-sulbactam':'AMPICILINA + SULBACTAM',
'penicilina-cristalina':'BENZILPENICILINA','penicilina-benzatina':'BENZILPENICILINA','insulina-regular':'INSULINA HUMANA','insulina-nph':'INSULINA HUMANA','glicose-50':'GLICOSE','soro-glicosado':'GLICOSE','soro-fisiologico':'CLORETO DE SÓDIO',
'tranexamico':'ÁCIDO TRANEXÂMICO','acido-acetilsalicilico':'ÁCIDO ACETILSALICÍLICO','acido-folico':'ÁCIDO FÓLICO','sacarato-ferro':'SACARATO DE HIDRÓXIDO FÉRRICO','codeina-paracetamol':'CODEÍNA + PARACETAMOL',
'cloreto-potassio':'CLORETO DE POTÁSSIO','cloreto-potassio-xarope':'CLORETO DE POTÁSSIO','gluconato-calcio':'GLUCONATO DE CÁLCIO','sulfato-magnesio':'SULFATO DE MAGNÉSIO','bicarbonato':'BICARBONATO DE SÓDIO',
'hioscina-dipirona':'BUTILBROMETO DE ESCOPOLAMINA + DIPIRONA','budesonida-formoterol':'BUDESONIDA + FORMOTEROL','alfaepoetina':'ALFAEPOETINA',
'sulfato-ferroso':'SULFATO FERROSO','oxido-zinco':'ÓXIDO DE ZINCO','sulfadiazina-prata':'SULFADIAZINA DE PRATA','imunoglobulina-anti-d':'IMUNOGLOBULINA ANTI-D','complexo-protrombinico':'COMPLEXO PROTROMBÍNICO'}
keys={chave(b):b for b in G}
link={}
for i,n,ba in app:
    cands=[SIN.get(i,''),ba,re.sub(r'\(.*?\)','',n).replace(' oral','').replace(' EV','')]
    for c in cands:
        if not c: continue
        b=keys.get(chave(base(c))) or (c in G and c) or None
        if b: link[i]=b; break
print('app vinculados:',len(link),'de',len(app))
usados=set(link.values())
sel=[(b,g) for b,g in G.items() if b not in usados]
sel.sort(key=lambda kv:(-len(kv[1]['labs']),-kv[1]['tot']))
print('catálogo candidatos:',len(sel))
def nome_de(b,g):
    parts=b.split(' + ')
    if len(parts)>3:
        top=g['prods'].most_common(1)
        return (titulo(top[0][0])+' — ' if top else '')+'associação de %d componentes'%len(parts)
    return titulo(b)
out=[];ids=set()
def mkid(n):
    k=re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',__import__('unicodedata').normalize('NFD',n.lower()).encode('ascii','ignore').decode())).strip('-')[:48]
    i=k;j=2
    while i in ids: i='%s-%d'%(k,j); j+=1
    ids.add(i); return 'c-'+i
def pack(b,g,id_=None):
    cl=g['classe'].most_common(1)[0][0]
    return {'id':id_ or mkid(b),'nome':nome_de(b,g),'comp':titulo(b) if len(b.split(' + '))>3 else '','cat':cat_de(cl),'classe':re.sub(r'^\S+\s+-\s+','',cl).capitalize(),
        'tarja':(g['tarja'].most_common(1)[0][0] if g['tarja'] else -1),'tmax':(max(g['tarja']) if g['tarja'] else -1),'hosp':1 if g['hosp']*2>=g['tot'] else 0,'gen':g['gen'],'labs':len(g['labs']),
        'marcas':[titulo(p) for p,_ in g['prods'].most_common(10)],'ap':[a for a,_ in g['ap'].most_common(10)],'o':0 if g['com']>0 else 1}
for b,g in sel: out.append(pack(b,g))
mercado={i:pack(b,G[b],'x') for i,b in link.items()}
json.dump({'bases':list(G.keys()),'ids':sorted(ids)},open('dl/cmed_meta.json','w'),ensure_ascii=False)
json.dump({'cat':out,'mercado':mercado},open('catalogo.json','w'),ensure_ascii=False)
print('entradas:',len(out)); print(json.dumps(out[:3],ensure_ascii=False)[:1500]); print(collections.Counter(o['cat'] for o in out))
print('sem vínculo:',[n for i,n,_ in app if i not in link][:80])
