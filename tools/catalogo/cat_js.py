import os as _os
JSDIR=_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),'..','..','wwwroot','enfermagem','js')+_os.sep
import json
d=json.load(open('catalogo.json'))
def arr(x): return [x['id'],x['nome'],x['comp'],x['cat'],x['classe'],x['tarja'],x['hosp'],x['gen'],x['labs'],x['marcas'],x['ap'],x['tmax'],x['o']]
L=["/*",
" * EnfCalc — CATÁLOGO de medicamentos comercializados no Brasil (gerado automaticamente).",
" * Fontes: Lista de Preços de Medicamentos da CMED/Anvisa (09/11/2026) e registros ativos de medicamentos (Dados Abertos Anvisa).",
" * Agrupado por princípio ativo; inclui classe terapêutica, apresentações e nomes comerciais.",
" * NÃO contém posologia: sempre consultar a bula (Bulário Eletrônico da Anvisa) e a prescrição.",
" * Formato de CAT: [id, nome, componentes, categoria, classe, tarja mais comum (-1 não informada, 0 sem tarja,",
" *                 1 vermelha, 2 vermelha com retenção, 3 preta), hospitalar(0/1), genérico disponível(0/1),",
" *                 nº de laboratórios, [marcas], [apresentações], tarja mais restritiva entre as apresentações,",
" *                 origem (0 CMED com venda em 2025, 1 CMED sem venda informada em 2025, 2 registro ativo na Anvisa sem preço CMED)]",
" */",
"(function (root) {","  'use strict';",
"  var FONTE = { nome: 'Lista de Preços de Medicamentos — CMED/Anvisa', data: '2026-11-09', url: 'https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos' };\n  var FONTE_REG = { nome: 'Dados Abertos Anvisa — medicamentos com registro ativo', data: '2026-11-16', url: 'https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv' };",
"  var CAT = ["]
L.append(',\n'.join('    '+json.dumps(arr(x),ensure_ascii=False) for x in d['cat']))
L.append("  ];")
L.append("  // Dados de mercado de medicamentos que já têm ficha no app: [classe, tarja, hospitalar, genérico, nº labs, [marcas], [apresentações], tarja máx.]")
L.append("  var MERCADO = {")
L.append(',\n'.join("    %s: %s"%(json.dumps(k),json.dumps([v['classe'],v['tarja'],v['hosp'],v['gen'],v['labs'],v['marcas'],v['ap'],v['tmax']],ensure_ascii=False)) for k,v in d['mercado'].items()))
L.append("  };")
L.append("""  function item(a) { return { id: a[0], nome: a[1], comp: a[2], cat: a[3], classe: a[4], tarja: a[5], hosp: a[6], gen: a[7], labs: a[8], marcas: a[9], ap: a[10], tmax: a[11], origem: a[12] }; }
  function mercado(id) { var m = MERCADO[id]; return m ? { classe: m[0], tarja: m[1], hosp: m[2], gen: m[3], labs: m[4], marcas: m[5], ap: m[6], tmax: m[7] } : null; }
  var TARJAS = ['Sem tarja / venda livre', 'Tarja vermelha (venda sob prescrição)', 'Tarja vermelha com retenção de receita', 'Tarja preta (controle especial)'];
  function tarjaTxt(t) { return t >= 0 ? TARJAS[t] : 'Tarja não informada na lista'; }
  var api = { FONTE: FONTE, FONTE_REG: FONTE_REG, CAT: CAT, item: item, mercado: mercado, TARJAS: TARJAS, tarjaTxt: tarjaTxt, total: CAT.length };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Catalogo = api;
})(this);""")
open(''+JSDIR+'catalogo.js','w').write('\n'.join(L)+'\n')
