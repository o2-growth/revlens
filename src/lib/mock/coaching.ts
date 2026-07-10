// Dados mock — Coaching ("prontuário do vendedor"). Sem backend.
// Coerente com src/lib/mock/calls.ts (mesmos closers, mesmas calls, mesmas citações).

import { calls, tsToSeconds, type Call } from "./calls";

export type ScorecardCriterion = {
  key: string;
  label: string;
  value: number; // 0-100
  band: [number, number]; // faixa saudável
};

export type CoachMoment = {
  callId: string;
  account: string;
  atTimestamp: string;
  quote: string;
  note: string;
};

export type ClosestObjectionLoss = {
  objection: string;
  lossCount: number;
};

export type CloserCoaching = {
  name: string;
  initials: string;
  scorecard: ScorecardCriterion[];
  /** vitais das últimas ~8 calls — escala fixa entre closers (sparklines comparáveis) */
  talkRatioTrend: number[];
  longestMonologueTrend: number[];
  questionsPerHourTrend: number[];
  bestMoment: CoachMoment;
  worstMoment: CoachMoment;
  objectionsLostMost: ClosestObjectionLoss[];
  autocoachNote: string;
};

export const coachingVitalsDomain = {
  talkRatio: [25, 90] as [number, number],
  longestMonologue: [0, 200] as [number, number],
  questionsPerHour: [0, 30] as [number, number],
};

export const coachingByCloser: CloserCoaching[] = [
  {
    name: "Bruno Kellner",
    initials: "BK",
    scorecard: [
      { key: "descoberta", label: "Descoberta", value: 82, band: [70, 100] },
      { key: "escuta", label: "Escuta Ativa", value: 75, band: [70, 100] },
      { key: "objecoes", label: "Tratamento de Objeção", value: 60, band: [70, 100] },
      { key: "proximos", label: "Próximos Passos", value: 88, band: [70, 100] },
      { key: "aderencia", label: "Aderência ao Script", value: 74, band: [70, 100] },
    ],
    talkRatioTrend: [58, 55, 52, 49, 54, 47, 44, 39],
    longestMonologueTrend: [96, 88, 84, 79, 90, 74, 68, 48],
    questionsPerHourTrend: [10, 11, 12, 13, 12, 14, 15, 18],
    bestMoment: {
      callId: "cl-8837",
      account: "Vórtice Alimentos",
      atTimestamp: "01:58",
      quote:
        "Se vocês me mandarem uma proposta formal essa semana, eu levo pro nosso comitê na sexta.",
      note: "Descoberta bem feita nas calls anteriores rendeu um prospect pedindo proposta antes do rep sugerir — o ápice de uma call liderada por perguntas.",
    },
    worstMoment: {
      callId: "cl-8819",
      account: "Multivix Educação",
      atTimestamp: "00:25",
      quote:
        "Entendo, mas já que estamos aqui, deixa eu te mostrar rapidinho a plataforma completa, acho que vale a pena.",
      note: "Prospect avisou logo no início que o projeto foi despriorizado. Rep ignorou o sinal e insistiu na demo — deveria ter fechado a call em 5 minutos e agendado retomada.",
    },
    objectionsLostMost: [
      { objection: "Timing / orçamento não aprovado", lossCount: 2 },
      { objection: "Integração com sistema atual (TMS/ERP)", lossCount: 1 },
    ],
    autocoachNote:
      "Seu talk ratio caiu 19pp nas últimas 8 calls — a descoberta está mais forte e isso aparece direto em sinais de compra. Ponto de atenção real: quando o prospect sinaliza falta de timing/verba logo na abertura (Multivix), insistir no pitch completo queima a call. Encerre rápido e proponha retomada com data, não deixe o script te empurrar pra frente.",
  },
  {
    name: "Ísis Nogueira",
    initials: "IN",
    scorecard: [
      { key: "descoberta", label: "Descoberta", value: 74, band: [70, 100] },
      { key: "escuta", label: "Escuta Ativa", value: 80, band: [70, 100] },
      { key: "objecoes", label: "Tratamento de Objeção", value: 66, band: [70, 100] },
      { key: "proximos", label: "Próximos Passos", value: 72, band: [70, 100] },
      { key: "aderencia", label: "Aderência ao Script", value: 69, band: [70, 100] },
    ],
    talkRatioTrend: [61, 57, 60, 54, 58, 51, 55, 52],
    longestMonologueTrend: [110, 98, 102, 90, 95, 84, 92, 92],
    questionsPerHourTrend: [7, 8, 9, 8, 10, 9, 11, 9],
    bestMoment: {
      callId: "cl-8825",
      account: "Solaris Energia Renovável",
      atTimestamp: "01:40",
      quote:
        "Posso te conectar com um cliente do setor de energia pra você validar isso na prática.",
      note: "Em vez de discursar sobre o SLA, ofereceu prova social imediata — o prospect topou pagar mais caro por suporte na resposta seguinte.",
    },
    worstMoment: {
      callId: "cl-8825",
      account: "Solaris Energia Renovável",
      atTimestamp: "00:24",
      quote: "Recebemos proposta da SunOps também, e o preço deles ficou uns 20% abaixo do de vocês.",
      note: "Objeção de preço crítica recebida sem contraproposta quantificada na hora — o comprometimento de enviar desconto de volume ficou para depois e segue pendente há dias.",
    },
    objectionsLostMost: [
      { objection: "Preço acima do concorrente", lossCount: 1 },
      { objection: "Segurança de dados e compliance", lossCount: 1 },
    ],
    autocoachNote:
      "Sua escuta ativa é o ponto mais forte do time (80/100), mas o tratamento de objeção de preço trava: você responde bem quando o assunto é técnico (segurança, suporte), mas hesita em quantificar diferença de preço na hora. Pratique ter um número de TCO pronto antes da call quando já souber que o prospect está comparando propostas.",
  },
  {
    name: "Camila Vasques",
    initials: "CV",
    scorecard: [
      { key: "descoberta", label: "Descoberta", value: 58, band: [70, 100] },
      { key: "escuta", label: "Escuta Ativa", value: 50, band: [70, 100] },
      { key: "objecoes", label: "Tratamento de Objeção", value: 45, band: [70, 100] },
      { key: "proximos", label: "Próximos Passos", value: 62, band: [70, 100] },
      { key: "aderencia", label: "Aderência ao Script", value: 55, band: [70, 100] },
    ],
    talkRatioTrend: [50, 55, 60, 58, 63, 66, 70, 68],
    longestMonologueTrend: [70, 80, 92, 88, 104, 120, 140, 156],
    questionsPerHourTrend: [14, 12, 10, 11, 8, 6, 5, 4],
    bestMoment: {
      callId: "cl-8830",
      account: "Ferraz & Bittencourt Advogados",
      atTimestamp: "02:35",
      quote: "Se resolver essa parte de adoção, orçamento não vai ser problema.",
      note: "Validou a objeção de resistência da equipe em vez de rebater, ofereceu onboarding assistido e case análogo — o prospect destravou o próprio orçamento na resposta.",
    },
    worstMoment: {
      callId: "cl-8839",
      account: "Cedro Farmacêutica",
      atTimestamp: "00:22",
      quote:
        "Sem problema, vou ser rápida. Então, a gente atende mais de duzentos clientes do setor farma, com módulo de rastreamento, dashboard executivo, alertas automáticos...",
      note: "Prospect avisou ter só 20 minutos e ainda assim recebeu o tour completo da plataforma sem qualificação prévia — o talk ratio chegou a 68% e nenhuma das 3 objeções foi respondida com dado.",
    },
    objectionsLostMost: [
      { objection: "Timing / orçamento não aprovado", lossCount: 2 },
    ],
    autocoachNote:
      "Seu talk ratio vem subindo 18pp nas últimas 8 calls — na Cedro isso custou o deal. O padrão: quando o prospect avisa que tem pouco tempo, a resposta automática tem sido acelerar o pitch em vez de cortar módulos e focar na dor. Vá direto ao ponto que ele mencionou e corte o resto — Ferraz mostra que você sabe fazer isso quando desacelera.",
  },
];

/** Métrica agregada de aderência ao script por call (mock) — alimenta o WinLossAnalysis. */
export const callScriptAdherence: Record<string, number> = {
  "cl-8841": 78,
  "cl-8839": 38,
  "cl-8837": 92,
  "cl-8834": 70,
  "cl-8830": 85,
  "cl-8825": 65,
  "cl-8819": 25,
};

export function getCallAdherence(callId: string): number | undefined {
  return callScriptAdherence[callId];
}

// ── Ganhos × Perdidos ──────────────────────────────────────────────────────
export type WinLossMetric = {
  key: string;
  label: string;
  unit?: string;
  wonValue: number;
  lostValue: number;
  /** true = valor menor é melhor (ex.: talk ratio, nº objeções) */
  lowerIsBetter?: boolean;
  /** casas decimais na leitura (Readout) */
  decimals?: number;
};

const wonCalls = calls.filter((c) => c.outcome === "ganho" && c.status === "pronto");
const lostCalls = calls.filter((c) => c.outcome === "perdido" && c.status === "pronto");

function avg(list: Call[], sel: (c: Call) => number) {
  if (list.length === 0) return 0;
  return list.reduce((s, c) => s + sel(c), 0) / list.length;
}

function avgAdherence(list: Call[]) {
  const values = list.map((c) => callScriptAdherence[c.id]).filter((v): v is number => v != null);
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

const wonTalkRatio = avg(wonCalls, (c) => c.talkRatioRep);
const lostTalkRatio = avg(lostCalls, (c) => c.talkRatioRep);
const wonObjections = avg(wonCalls, (c) => c.objectionsCount);
const lostObjections = avg(lostCalls, (c) => c.objectionsCount);
const wonSignals = avg(wonCalls, (c) => c.buyingSignalsCount);
const lostSignals = avg(lostCalls, (c) => c.buyingSignalsCount);
const wonAdherence = avgAdherence(wonCalls);
const lostAdherence = avgAdherence(lostCalls);
const wonQph = avg(wonCalls, (c) => c.questionsPerHour);
const lostQph = avg(lostCalls, (c) => c.questionsPerHour);

export const winLossMetrics: WinLossMetric[] = [
  {
    key: "talk-ratio",
    label: "Talk ratio do rep",
    unit: "%",
    wonValue: Math.round(wonTalkRatio),
    lostValue: Math.round(lostTalkRatio),
    lowerIsBetter: true,
  },
  {
    key: "objections",
    label: "Objeções por call",
    wonValue: Math.round(wonObjections * 10) / 10,
    lostValue: Math.round(lostObjections * 10) / 10,
    lowerIsBetter: true,
    decimals: 1,
  },
  {
    key: "signals",
    label: "Sinais de compra por call",
    wonValue: Math.round(wonSignals * 10) / 10,
    lostValue: Math.round(lostSignals * 10) / 10,
    decimals: 1,
  },
  {
    key: "adherence",
    label: "Aderência ao script",
    unit: "%",
    wonValue: Math.round(wonAdherence),
    lostValue: Math.round(lostAdherence),
  },
  {
    key: "questions",
    label: "Perguntas/hora",
    wonValue: Math.round(wonQph * 10) / 10,
    lostValue: Math.round(lostQph * 10) / 10,
    decimals: 1,
  },
];

const talkRatioDeltaPp = Math.round(lostTalkRatio - wonTalkRatio);
const questionsMultiple = lostQph > 0 ? Math.round((wonQph / lostQph) * 10) / 10 : wonQph;
const adherenceDeltaPp = Math.round(wonAdherence - lostAdherence);

export const winLossInsight = `Calls ganhas têm talk ratio ${talkRatioDeltaPp}pp menor, ${questionsMultiple}× mais perguntas por hora e ${adherenceDeltaPp}pp mais aderência ao script do que as perdidas.`;

/** deep-link helper compartilhado com EvidenceChip */
export { tsToSeconds };
