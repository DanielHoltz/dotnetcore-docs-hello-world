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

  var api = { pesoEstimado: pesoEstimado, tuboTraqueal: tuboTraqueal, energias: energias, dosesPCR: dosesPCR,
    mmss: mmss, statusAdrenalina: statusAdrenalina, CAUSAS: CAUSAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Emergencia = api;
})(this);
