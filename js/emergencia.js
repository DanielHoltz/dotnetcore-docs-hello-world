/*
 * EnfCalc — emergência: estimativas pediátricas (APLS/PALS) e apoio ao modo PCR (AHA).
 * Funções puras. Valores de referência — seguir o protocolo do serviço.
 */
(function (root) {
  'use strict';

  // Peso estimado por idade (APLS): < 1 ano (meses + 9)/2; 1–5 anos 2×idade + 8; 6–12 anos 3×idade + 7
  function pesoEstimado(idadeMeses) {
    if (!(idadeMeses >= 0)) return null;
    if (idadeMeses < 12) return { kg: (idadeMeses + 9) / 2, formula: '(meses + 9) ÷ 2' };
    var anos = Math.floor(idadeMeses / 12);
    if (anos <= 5) return { kg: 2 * anos + 8, formula: '2 × idade + 8' };
    if (anos <= 12) return { kg: 3 * anos + 7, formula: '3 × idade + 7' };
    return null; // acima de 12 anos: usar peso real
  }

  // Cânula traqueal (≥ 2 anos): com cuff idade/4 + 3,5; sem cuff idade/4 + 4 (mm DI)
  function tuboTraqueal(idadeMeses) {
    if (!(idadeMeses >= 24)) return null;
    var anos = Math.floor(idadeMeses / 12);
    var r = function (x) { return Math.round(x * 2) / 2; };
    return { comCuff: r(anos / 4 + 3.5), semCuff: r(anos / 4 + 4) };
  }

  // Energias (J): desfibrilação 2 J/kg → 4 J/kg → ≥ 4 J/kg (máx. 10 J/kg ou dose adulta)
  // cardioversão sincronizada 0,5–1 J/kg → até 2 J/kg
  function energias(pesoKg, doseAdulta) {
    if (!(pesoKg > 0)) return null;
    var max = Math.min(10 * pesoKg, doseAdulta || 200);
    return {
      desf1: Math.min(2 * pesoKg, max), desf2: Math.min(4 * pesoKg, max), desfMax: max,
      cardio1: [0.5 * pesoKg, 1 * pesoKg], cardio2: 2 * pesoKg
    };
  }

  // Doses do modo PCR (AHA): adulto adrenalina 1 mg a cada 3–5 min; amiodarona 300 mg → 150 mg.
  // Pediatria: adrenalina 0,01 mg/kg (máx. 1 mg); amiodarona 5 mg/kg (máx. 300 mg), até 3 doses.
  function dosesPCR(ped, pesoKg) {
    if (!ped) return {
      adrenalina: { mg: 1, txt: '1 mg EV/IO + flush 20 mL' },
      amiodarona: [{ mg: 300, txt: '1ª dose: 300 mg EV/IO em bolus' }, { mg: 150, txt: '2ª dose: 150 mg' }]
    };
    if (!(pesoKg > 0)) return null;
    var adr = Math.min(0.01 * pesoKg, 1), amio = Math.min(5 * pesoKg, 300);
    return {
      adrenalina: { mg: adr, ml01: adr / 0.1, txt: arred(adr) + ' mg = ' + arred(adr / 0.1) + ' mL da solução 0,1 mg/mL (1 mL de 1 mg/mL + 9 mL de SF)' },
      amiodarona: [{ mg: amio, txt: arred(amio) + ' mg (5 mg/kg) EV/IO em bolus — até 3 doses' }]
    };
  }

  function arred(v) {
    var a = Math.abs(v);
    var r = a >= 10 ? Math.round(v) : a >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
    return String(r).replace('.', ',');
  }

  // Formata segundos em mm:ss
  function mmss(seg) {
    seg = Math.max(0, Math.floor(seg));
    var m = Math.floor(seg / 60), s = seg % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Situação do lembrete de adrenalina: segundos desde a última dose
  function statusAdrenalina(segDesde) {
    if (segDesde == null) return { fase: 'nenhuma', txt: 'Nenhuma dose registrada' };
    if (segDesde < 180) return { fase: 'aguardar', txt: 'Próxima em ' + mmss(180 - segDesde) + ' (janela 3–5 min)' };
    if (segDesde <= 300) return { fase: 'janela', txt: 'Janela da adrenalina AGORA (3–5 min)' };
    return { fase: 'atrasada', txt: 'Passou de 5 min desde a última dose' };
  }

  // Causas reversíveis (5H e 5T)
  var CAUSAS = ['Hipovolemia', 'Hipóxia', 'H⁺ (acidose)', 'Hipo/hipercalemia', 'Hipotermia',
    'Tensão no tórax (pneumotórax)', 'Tamponamento cardíaco', 'Toxinas', 'Trombose pulmonar', 'Trombose coronária'];


  // ---- PCR guiada (algoritmo AHA ACLS/PALS): próxima ação a partir do estado ----
  // st: { ritmo: null|'chocavel'|'aesp'|'assistolia', rce, choquePendente, nChoques, nAdr, nAmio, ultimaAdr (ms), ciclo (ms), modo }
  var RITMOS = { chocavel: 'FV / TV sem pulso', aesp: 'AESP', assistolia: 'Assistolia' };
  function proximaAcao(st, agora) {
    var ped = st.modo === 'ped';
    if (st.rce) return { id: 'rce', nivel: 'ok', titulo: 'Retorno da circulação (RCE)', txt: 'Siga os cuidados pós-PCR abaixo. Reavalie pulso a cada 2 min; se perder o pulso, toque em “Perdeu pulso”.' };
    if (!st.ritmo) return { id: 'analisar', nivel: 'bad', titulo: 'Monitorizar e analisar o ritmo', txt: 'Compressões de alta qualidade e O₂ enquanto instala o monitor/DEA. Pausa máxima de 10 s para ver o ritmo e marque abaixo.' };
    var dc = (agora - st.ciclo) / 1000;
    if (dc >= 120) return { id: 'checar', nivel: 'bad', titulo: 'Checar ritmo AGORA', txt: 'Pausa ≤ 10 s. Troque o compressor. Ritmo organizado? Cheque pulso. Marque o ritmo encontrado.' };
    if (st.ritmo === 'chocavel' && st.choquePendente) return { id: 'choque', nivel: 'bad', titulo: '⚡ CHOQUE AGORA', txt: (ped ? 'Desfibrilação conforme o peso (2 J/kg no 1º, 4 J/kg no 2º, depois ≥ 4 J/kg).' : 'Bifásico: energia recomendada pelo fabricante (120–200 J) ou a máxima; monofásico 360 J.') + ' Carregue com compressões em andamento, afaste todos e retome RCP imediatamente após o choque.' };
    var segAdr = st.ultimaAdr ? (agora - st.ultimaAdr) / 1000 : null;
    var adrDevida = segAdr == null || segAdr >= 180;
    if (st.ritmo !== 'chocavel' && adrDevida) return { id: 'adrenalina', nivel: 'warn', titulo: st.nAdr ? 'Adrenalina (janela 3–5 min)' : 'Adrenalina o quanto antes', txt: 'Ritmo não chocável: adrenalina assim que houver acesso IV/IO, depois a cada 3–5 min. Mantenha RCP.' };
    if (st.ritmo === 'chocavel') {
      if (st.nChoques >= 2 && adrDevida) return { id: 'adrenalina', nivel: 'warn', titulo: 'Adrenalina', txt: 'FV/TV após o 2º choque: adrenalina e repetir a cada 3–5 min. Mantenha RCP.' };
      if (st.nChoques >= 3 && st.nAmio === 0) return { id: 'antiarritmico', nivel: 'warn', titulo: 'Antiarrítmico', txt: (ped ? 'Amiodarona 5 mg/kg em bolus (ou lidocaína 1 mg/kg).' : 'Amiodarona 300 mg em bolus (ou lidocaína 1–1,5 mg/kg).') + ' FV/TV refratária após o 3º choque.' };
      if (st.nChoques >= 4 && st.nAmio === 1 && !ped) return { id: 'antiarritmico', nivel: 'warn', titulo: 'Antiarrítmico — 2ª dose', txt: 'Amiodarona 150 mg (ou lidocaína 0,5–0,75 mg/kg).' };
    }
    return { id: 'rcp', nivel: 'info', titulo: 'RCP de alta qualidade', txt: 'Próxima checagem de ritmo em ' + mmss(120 - dc) + '. Considere via aérea avançada e capnografia; procure e trate causas reversíveis (5H e 5T).' };
  }

  // Sequência rápida de intubação: doses por peso (referências: MSD Manuals, protocolo de via aérea HCFMUSP, WikEM)
  // conc em mg/mL (fentanil em mcg/mL); faixa [min, max] por kg; padrao = dose usual por kg
  var SRI = [
    { id: 'fentanil', grupo: 'Pré-tratamento / analgesia', nome: 'Fentanil', u: 'mcg', faixa: [1, 3], padrao: 2, conc: 50, max: 200, obs: 'EV lento (rigidez torácica em bolus rápido). Cautela em hipotensão.' },
    { id: 'etomidato', grupo: 'Indutor', nome: 'Etomidato', u: 'mg', faixa: [0.2, 0.3], padrao: 0.3, conc: 2, max: 40, obs: 'Estabilidade hemodinâmica. Pode causar mioclonias; supressão adrenal transitória (cautela na sepse).' },
    { id: 'cetamina', grupo: 'Indutor', nome: 'Cetamina', u: 'mg', faixa: [1, 2], padrao: 1.5, conc: 50, max: 200, obs: 'Dose para cetamina RACÊMICA — com ESCETAMINA (S+) usar cerca de METADE. Preserva drive respiratório e PA; útil em broncoespasmo e choque. Cautela em hipertensão grave e isquemia coronariana.' },
    { id: 'propofol', grupo: 'Indutor', nome: 'Propofol', u: 'mg', faixa: [1, 2], padrao: 1.5, conc: 10, max: 200, obs: 'Hipotensão frequente — preferir em paciente hemodinamicamente estável; reduzir dose em idosos.' },
    { id: 'midazolam', grupo: 'Indutor', nome: 'Midazolam', u: 'mg', faixa: [0.1, 0.3], padrao: 0.2, conc: 5, max: 20, obs: 'Início mais lento; hipotensão. Alternativa quando os demais indutores não estão disponíveis.' },
    { id: 'rocuronio', grupo: 'Bloqueador neuromuscular', nome: 'Rocurônio', u: 'mg', faixa: [1, 1.2], padrao: 1.2, conc: 10, max: 200, obs: 'Início em ~60 s; duração de 30–60 min. Preferir quando a succinilcolina é contraindicada. Reversor: sugamadex.' },
    { id: 'succinilcolina', grupo: 'Bloqueador neuromuscular', nome: 'Succinilcolina', u: 'mg', faixa: [1, 1.5], padrao: 1.5, conc: 20, max: 200, obs: 'Início em 30–60 s; duração curta. CONTRAINDICADA: hipercalemia, queimadura ou trauma por esmagamento após 24–72 h, rabdomiólise, doença neuromuscular, imobilização prolongada, história de hipertermia maligna. Lactentes: 2 mg/kg.' }
  ];

  function sriDoses(pesoKg, ped) {
    if (!(pesoKg > 0)) return null;
    return SRI.map(function (x) {
      var porKg = x.padrao;
      if (x.id === 'succinilcolina' && ped && pesoKg < 10) porKg = 2;
      var dose = Math.min(porKg * pesoKg, x.max);
      return { id: x.id, grupo: x.grupo, nome: x.nome, u: x.u, porKg: porKg, faixa: [x.faixa[0] * pesoKg, Math.min(x.faixa[1] * pesoKg, x.max)],
        dose: dose, limitado: porKg * pesoKg > x.max, conc: x.conc, ml: dose / x.conc, obs: x.obs };
    });
  }

  // Hipodermóclise: hidratação por via subcutânea (SBGG/ANCP; tabela do Hospital São Camilo)
  // até 1500 mL/24 h por sítio (≈ 62,5 mL/h); para volume total V em H horas com S sítios
  function hipodermoclise(volMl, horas, sitios) {
    if (!(volMl > 0) || !(horas > 0) || !(sitios >= 1)) return null;
    var mlh = volMl / horas, porSitio = mlh / sitios, por24 = volMl / sitios * (24 / horas);
    return { mlh: mlh, porSitio: porSitio, gts: mlh / 3, porSitio24: por24,
      sitiosNecessarios: Math.max(1, Math.ceil(Math.max(porSitio * sitios / 62.5, volMl * (24 / horas) / 1500))),
      acimaVelocidade: porSitio > 62.5 + 1e-9, acimaVolume: por24 > 1500 + 1e-9 };
  }

  // Ventilação mecânica inicial (Diretrizes Brasileiras de VM AMIB/SBPT 2013; protocolo ARDSNet)
  // Peso predito: homem 50 + 0,91 × (altura − 152,4); mulher 45,5 + 0,91 × (altura − 152,4)
  function pesoPredito(alturaCm, sexo) {
    if (!(alturaCm > 0) || (sexo !== 'm' && sexo !== 'f')) return null;
    return Math.max(0, (sexo === 'm' ? 50 : 45.5) + 0.91 * (alturaCm - 152.4));
  }
  function ventInicial(o) {
    // o: { ped, idadeMeses, altura, sexo, peso }
    var base = o.ped ? (o.peso > 0 ? o.peso : null) : pesoPredito(o.altura, o.sexo);
    if (!base) return null;
    var fr;
    if (!o.ped) fr = [12, 16];
    else if (o.idadeMeses != null && o.idadeMeses < 12) fr = [25, 35];
    else if (o.idadeMeses != null && o.idadeMeses < 72) fr = [20, 30];
    else if (o.idadeMeses != null && o.idadeMeses < 144) fr = [16, 24];
    else fr = [14, 20];
    return { pesoBase: base, baseTipo: o.ped ? 'peso real/ideal' : 'peso predito',
      vc: [6 * base, 8 * base], vcProtetor: 6 * base, fr: fr, peep: 5, fio2Inicial: 100,
      metas: { spo2: '93–97% (DPOC: 88–92%)', pplat: '≤ 30 cmH₂O', driving: '≤ 15 cmH₂O' } };
  }

  var api = { pesoEstimado: pesoEstimado, tuboTraqueal: tuboTraqueal, energias: energias, dosesPCR: dosesPCR,
    mmss: mmss, statusAdrenalina: statusAdrenalina, CAUSAS: CAUSAS, RITMOS: RITMOS, proximaAcao: proximaAcao, SRI: SRI, sriDoses: sriDoses, hipodermoclise: hipodermoclise, pesoPredito: pesoPredito, ventInicial: ventInicial };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Emergencia = api;
})(this);
