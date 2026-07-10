// Dados mock agregados — Painel de Inteligência Comercial.
// Derivados/coerentes com as 8 calls de src/lib/mock/calls.ts (sem backend).

import { calls, getCallById } from "./calls";

export type Direction = "up" | "down";
export type Tone = "good" | "bad" | "neutral";

export type OperationMetric = {
  key: string;
  label: string;
  value: string;
  numericValue: number; // pro count-up
  unit?: string; // unidade rebaixada (%, etc.)
  colorClass: string;
  deltaLabel: string;
  prevValueLabel: string; // "era X"
  direction: Direction;
  tone: Tone;
  history: number[]; // 8 semanas, escala própria — sparkline de rodapé
  toneColor: "oxy" | "risk" | "danger" | "muted";
};

export type WeeklyPoint = {
  weekLabel: string;
  calls: number;
  sentiment: number; // 0-100
  future?: boolean; // ponto projetado (cone do forecast)
};

export type CloserRanking = {
  name: string;
  initials: string;
  calls: number;
  talkRatio: number;
  buyingSignals: number;
  trend: Direction | "flat";
  talkRatioTrend: number[]; // últimas N calls — escala fixa 0-100
  vsTeamDelta: number; // pp vs. média do time (talk ratio)
  outOfBand: boolean; // fora da faixa-alvo de um vital (âmbar)
};

export type ObjectionRankingItem = {
  text: string;
  count: number;
  pctOfCalls: number;
};

// ── Fila de Intervenção (triagem de UTI) ──────────────────────────────────
export type ReasonType =
  | "SINGLE-THREADED"
  | "CHAMPION INATIVO"
  | "PREÇO SEM REAÇÃO"
  | "SEM PRÓXIMO PASSO"
  | "CONCORRENTE CITADO"
  | "TALK-RATIO ALTO"
  | "DEAL CONGELADO";

export type InterventionItem = {
  callId: string;
  account: string;
  closer: string;
  severity: "risco" | "critica";
  reasonType: ReasonType;
  reasonDetail: string; // ex.: "12d" ou "4×"
  evidence: string; // prova literal
  evidenceTimestamp?: string; // recibo — deep-link pro turno
  ageLabel: string; // "há 12 dias"
  ageDays: number;
  dealValue: number;
  recommendedAction: string;
};

// Compat: tipo antigo ainda exportado (caso algo importe)
export type AttentionItem = {
  callId: string;
  account: string;
  closer: string;
  reason: string;
  severity: "risco" | "critica";
};

export type BuyingSignalItem = {
  callId: string;
  account: string;
  excerpt: string;
  closer: string;
  when: string;
  atTimestamp?: string; // recibo
};

const readyCalls = calls.filter((c) => c.status === "pronto");

// ── Vitais da operação (semana atual vs. semana passada) ─────────────────
const totalCallsThisWeek = calls.length; // 8
const avgTalkRatio = Math.round(
  readyCalls.reduce((sum, c) => sum + c.talkRatioRep, 0) / readyCalls.length,
); // 52
const totalBuyingSignals = calls.reduce((sum, c) => sum + c.buyingSignalsCount, 0); // 13
const dealsAtRisk = calls.filter((c) => c.signal === "risco").length; // 4
const avgSentimentScore =
  readyCalls.reduce((sum, c) => sum + c.sentimentScore, 0) / readyCalls.length; // ~20.7
const sentimentHealth = Math.round((avgSentimentScore + 100) / 2); // ~60

// Semana passada (fabricado, coerente com a série de tendência abaixo)
const prevWeek = { calls: 6, talkRatio: 58, signals: 9, risk: 2, sentiment: 68 };

function pct(current: number, prev: number) {
  if (prev === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - prev) / prev) * 100);
}

export const operationMetrics: OperationMetric[] = [
  {
    key: "calls",
    label: "Calls na semana",
    value: String(totalCallsThisWeek),
    numericValue: totalCallsThisWeek,
    colorClass: "text-rl-text",
    deltaLabel: `${pct(totalCallsThisWeek, prevWeek.calls) >= 0 ? "+" : ""}${pct(totalCallsThisWeek, prevWeek.calls)}%`,
    prevValueLabel: `era ${prevWeek.calls}`,
    direction: totalCallsThisWeek >= prevWeek.calls ? "up" : "down",
    // volume de calls é atividade, não sinal de saúde — mantém neutro (verde só é sinal)
    tone: "neutral",
    toneColor: "muted",
    history: [5, 6, 7, 6, 9, 7, 6, 8],
  },
  {
    key: "talk-ratio",
    label: "Talk ratio médio",
    value: `${avgTalkRatio}%`,
    numericValue: avgTalkRatio,
    unit: "%",
    colorClass: avgTalkRatio >= 60 ? "text-rl-risk" : "text-rl-oxy",
    deltaLabel: `${pct(avgTalkRatio, prevWeek.talkRatio) >= 0 ? "+" : ""}${pct(avgTalkRatio, prevWeek.talkRatio)}%`,
    prevValueLabel: `era ${prevWeek.talkRatio}%`,
    direction: avgTalkRatio >= prevWeek.talkRatio ? "up" : "down",
    // rep falando menos que a semana passada é bom (mais espaço pro prospect)
    tone: avgTalkRatio <= prevWeek.talkRatio ? "good" : "bad",
    toneColor: avgTalkRatio >= 60 ? "risk" : "oxy",
    history: [56, 59, 55, 61, 57, 60, 58, 52],
  },
  {
    key: "signals",
    label: "Sinais de compra",
    value: String(totalBuyingSignals),
    numericValue: totalBuyingSignals,
    colorClass: "text-rl-oxy",
    deltaLabel: `${pct(totalBuyingSignals, prevWeek.signals) >= 0 ? "+" : ""}${pct(totalBuyingSignals, prevWeek.signals)}%`,
    prevValueLabel: `era ${prevWeek.signals}`,
    direction: totalBuyingSignals >= prevWeek.signals ? "up" : "down",
    tone: "good",
    toneColor: "oxy",
    history: [7, 8, 6, 10, 8, 9, 9, 13],
  },
  {
    key: "risk",
    label: "Deals em risco",
    value: String(dealsAtRisk),
    numericValue: dealsAtRisk,
    colorClass: dealsAtRisk >= 3 ? "text-rl-danger" : "text-rl-risk",
    deltaLabel: `${pct(dealsAtRisk, prevWeek.risk) >= 0 ? "+" : ""}${pct(dealsAtRisk, prevWeek.risk)}%`,
    prevValueLabel: `era ${prevWeek.risk}`,
    direction: dealsAtRisk >= prevWeek.risk ? "up" : "down",
    tone: dealsAtRisk > prevWeek.risk ? "bad" : "good",
    toneColor: dealsAtRisk >= 3 ? "danger" : "risk",
    history: [3, 2, 3, 1, 2, 2, 2, 4],
  },
  {
    key: "sentiment",
    label: "Sentimento médio",
    value: String(sentimentHealth),
    numericValue: sentimentHealth,
    colorClass:
      sentimentHealth >= 60 ? "text-rl-oxy" : sentimentHealth >= 40 ? "text-rl-risk" : "text-rl-danger",
    deltaLabel: `${pct(sentimentHealth, prevWeek.sentiment) >= 0 ? "+" : ""}${pct(sentimentHealth, prevWeek.sentiment)}%`,
    prevValueLabel: `era ${prevWeek.sentiment}`,
    direction: sentimentHealth >= prevWeek.sentiment ? "up" : "down",
    tone: sentimentHealth >= prevWeek.sentiment ? "good" : "bad",
    toneColor: sentimentHealth >= 60 ? "oxy" : sentimentHealth >= 40 ? "risk" : "danger",
    history: [54, 57, 61, 59, 66, 63, 68, sentimentHealth],
  },
];

// ── Pulso do comercial: série de 8 semanas + 2 pontos projetados (cone) ───
// Última semana histórica (Atual) bate com os agregados calculados acima.
export const weeklyTrend: WeeklyPoint[] = [
  { weekLabel: "S-7", calls: 5, sentiment: 54 },
  { weekLabel: "S-6", calls: 6, sentiment: 57 },
  { weekLabel: "S-5", calls: 7, sentiment: 61 },
  { weekLabel: "S-4", calls: 6, sentiment: 59 },
  { weekLabel: "S-3", calls: 9, sentiment: 66 },
  { weekLabel: "S-2", calls: 7, sentiment: 63 },
  { weekLabel: "S-1", calls: prevWeek.calls, sentiment: prevWeek.sentiment },
  { weekLabel: "Atual", calls: totalCallsThisWeek, sentiment: sentimentHealth },
  { weekLabel: "S+1", calls: 8, sentiment: 56, future: true },
  { weekLabel: "S+2", calls: 8, sentiment: 53, future: true },
];

// Banda de incerteza do forecast (best/worst por semana projetada) — abre com o tempo
export const forecastBand = {
  commit: [sentimentHealth, 56, 53], // Atual, S+1, S+2 (linha central)
  best: [sentimentHealth, 63, 66],
  worst: [sentimentHealth, 49, 43],
  healthyFloor: 55, // faixa saudável mínima
};

// ── Forecast do trimestre (oxímetro projetado) ────────────────────────────
export const forecast = {
  commit: 2_450_000,
  best: 3_100_000,
  worst: 1_780_000,
  confidence: 64, // %
  quota: 3_000_000,
};

// ── Ranking do time (derivado por closer a partir das calls prontas) ─────
export const teamRanking: CloserRanking[] = (() => {
  const byCloser = new Map<string, typeof readyCalls>();
  for (const c of readyCalls) {
    const list = byCloser.get(c.closer) ?? [];
    list.push(c);
    byCloser.set(c.closer, list);
  }

  const teamAvgTalk = avgTalkRatio;

  return Array.from(byCloser.entries())
    .map(([name, list]) => {
      const talkRatio = Math.round(list.reduce((s, c) => s + c.talkRatioRep, 0) / list.length);
      const buyingSignals = list.reduce((s, c) => s + c.buyingSignalsCount, 0);
      const positives = list.filter((c) => c.signal === "sinal").length;
      const negatives = list.filter((c) => c.signal === "risco").length;
      const trend: Direction | "flat" =
        positives > negatives ? "up" : positives < negatives ? "down" : "flat";
      // trend de talk-ratio por call (cronológico), escala fixa 0-100
      const talkRatioTrend = [...list]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((c) => c.talkRatioRep);
      return {
        name,
        initials: list[0].closerInitials,
        calls: list.length,
        talkRatio,
        buyingSignals,
        trend,
        talkRatioTrend,
        vsTeamDelta: talkRatio - teamAvgTalk,
        outOfBand: talkRatio >= 60, // fora da faixa saudável de talk-ratio
      };
    })
    .sort((a, b) => b.buyingSignals - a.buyingSignals);
})();

// ── Objeções da semana (agrupadas por tema, cruzando as calls) ───────────
export const objectionRanking: ObjectionRankingItem[] = [
  { text: "Timing / orçamento não aprovado", count: 2, pctOfCalls: 29 },
  { text: "Preço acima do concorrente", count: 2, pctOfCalls: 29 },
  { text: "Integração com sistema atual (TMS/ERP)", count: 1, pctOfCalls: 14 },
  { text: "Segurança de dados e compliance", count: 1, pctOfCalls: 14 },
  { text: "Resistência interna da equipe", count: 1, pctOfCalls: 14 },
];

// ── Fila de Intervenção (prescritiva, ordenada por severidade × valor × recência) ──
const rawInterventions: InterventionItem[] = [
  {
    callId: "cl-8839",
    account: "Cedro Farmacêutica",
    closer: "Camila Vasques",
    severity: "critica",
    reasonType: "TALK-RATIO ALTO",
    reasonDetail: "68%",
    evidence: "Rep falou 68% do tempo — três objeções ficaram sem resposta com dado.",
    evidenceTimestamp: "03:10",
    ageLabel: "há 1 dia",
    ageDays: 1,
    dealValue: 320000,
    recommendedAction: "Reabrir com descoberta",
  },
  {
    callId: "cl-8825",
    account: "Solaris Energia Renovável",
    closer: "Ísis Nogueira",
    severity: "critica",
    reasonType: "PREÇO SEM REAÇÃO",
    reasonDetail: "20%",
    evidence: "SunOps 20% abaixo; contraproposta prometida e ainda não enviada.",
    evidenceTimestamp: "00:24",
    ageLabel: "há 3 dias",
    ageDays: 3,
    dealValue: 410000,
    recommendedAction: "Enviar contraproposta",
  },
  {
    callId: "cl-8841",
    account: "Nortex Logística",
    closer: "Bruno Kellner",
    severity: "risco",
    reasonType: "CHAMPION INATIVO",
    reasonDetail: "sem CTO",
    evidence: "Decisão em comitê, mas o CTO (Ricardo) nunca entrou numa call.",
    evidenceTimestamp: "03:30",
    ageLabel: "hoje",
    ageDays: 0,
    dealValue: 480000,
    recommendedAction: "Puxar CTO pra call",
  },
  {
    callId: "cl-8834",
    account: "Altiplano Seguros",
    closer: "Ísis Nogueira",
    severity: "risco",
    reasonType: "SINGLE-THREADED",
    reasonDetail: "1 contato",
    evidence: "Decisor final (CISO) ainda não engajado — só o gerente de TI na call.",
    evidenceTimestamp: "01:45",
    ageLabel: "há 2 dias",
    ageDays: 2,
    dealValue: 260000,
    recommendedAction: "Marcar call com CISO",
  },
  {
    callId: "cl-8819",
    account: "Multivix Educação",
    closer: "Bruno Kellner",
    severity: "critica",
    reasonType: "DEAL CONGELADO",
    reasonDetail: "sem verba",
    evidence: "Projeto despriorizado, sem verba até o próximo ano fiscal.",
    evidenceTimestamp: "00:10",
    ageLabel: "há 4 dias",
    ageDays: 4,
    dealValue: 140000,
    recommendedAction: "Reativar em janeiro",
  },
];

// score de triagem: severidade (peso 3) + valor do deal (normalizado) − idade
const maxDeal = Math.max(...rawInterventions.map((i) => i.dealValue));
export const interventionQueue: InterventionItem[] = [...rawInterventions].sort((a, b) => {
  const score = (i: InterventionItem) =>
    (i.severity === "critica" ? 3 : 1) * 100 +
    (i.dealValue / maxDeal) * 60 -
    i.ageDays * 4;
  return score(b) - score(a);
});

// Compat com o tipo antigo (não usado pelo novo Painel, mantido por segurança)
export const attentionList: AttentionItem[] = interventionQueue.map((i) => ({
  callId: i.callId,
  account: i.account,
  closer: i.closer,
  reason: i.evidence,
  severity: i.severity,
}));

// ── "Desde ontem" — faixa densa de mudanças (cada item tem número atrás) ──
export type SinceYesterdayItem = {
  label: string;
  tone: "oxy" | "risk" | "danger" | "neutral";
  direction?: Direction;
  callId?: string;
};

export const sinceYesterday: {
  headline: string;
  items: SinceYesterdayItem[];
} = {
  headline: "DOIS DEALS ESCORREGARAM ONTEM. O TIME FALA 6PP ACIMA DA FAIXA.",
  items: [
    { label: "+4 sinais de compra", tone: "oxy", direction: "up" },
    { label: "2 deals → risco", tone: "danger", direction: "up", callId: "cl-8839" },
    { label: "talk ratio 58%→52%", tone: "oxy", direction: "down" },
    { label: "Nortex: CTO ainda ausente", tone: "risk", callId: "cl-8841" },
  ],
};

// ── Sinais de compra recentes (com recibo) ────────────────────────────────
export const buyingSignals: BuyingSignalItem[] = [
  {
    callId: "cl-8837",
    account: "Vórtice Alimentos",
    excerpt: "Se vocês me mandarem uma proposta formal essa semana, eu levo pro comitê na sexta.",
    closer: "Bruno Kellner",
    when: "09/07 · 11:00",
    atTimestamp: "01:58",
  },
  {
    callId: "cl-8841",
    account: "Nortex Logística",
    excerpt: "Budget de Q3 já aprovado pela diretoria — não é mais objeção de preço.",
    closer: "Bruno Kellner",
    when: "10/07 · 09:15",
    atTimestamp: "04:20",
  },
  {
    callId: "cl-8830",
    account: "Ferraz & Bittencourt Advogados",
    excerpt: "Se resolver essa parte de adoção, orçamento não vai ser problema.",
    closer: "Camila Vasques",
    when: "08/07 · 10:00",
    atTimestamp: "02:35",
  },
  {
    callId: "cl-8834",
    account: "Altiplano Seguros",
    excerpt: "Se a documentação estiver em ordem, me sinto confortável em recomendar avançar.",
    closer: "Ísis Nogueira",
    when: "08/07 · 16:20",
    atTimestamp: "02:20",
  },
];

// util pequeno para outras telas
export { getCallById };
