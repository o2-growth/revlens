// Dados mock agregados — Painel de Inteligência Comercial.
// Derivados/coerentes com as 8 calls de src/lib/mock/calls.ts (sem backend).

import { calls } from "./calls";

export type Direction = "up" | "down";
export type Tone = "good" | "bad" | "neutral";

export type OperationMetric = {
  key: string;
  label: string;
  value: string;
  colorClass: string;
  deltaLabel: string;
  direction: Direction;
  tone: Tone;
};

export type WeeklyPoint = {
  weekLabel: string;
  calls: number;
  sentiment: number; // 0-100
};

export type CloserRanking = {
  name: string;
  initials: string;
  calls: number;
  talkRatio: number;
  buyingSignals: number;
  trend: Direction | "flat";
};

export type ObjectionRankingItem = {
  text: string;
  count: number;
  pctOfCalls: number;
};

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
    colorClass: "text-rl-text",
    deltaLabel: `${pct(totalCallsThisWeek, prevWeek.calls) >= 0 ? "+" : ""}${pct(totalCallsThisWeek, prevWeek.calls)}%`,
    direction: totalCallsThisWeek >= prevWeek.calls ? "up" : "down",
    tone: "good",
  },
  {
    key: "talk-ratio",
    label: "Talk ratio médio",
    value: `${avgTalkRatio}%`,
    colorClass: avgTalkRatio >= 60 ? "text-rl-risk" : "text-rl-oxy",
    deltaLabel: `${pct(avgTalkRatio, prevWeek.talkRatio) >= 0 ? "+" : ""}${pct(avgTalkRatio, prevWeek.talkRatio)}%`,
    direction: avgTalkRatio >= prevWeek.talkRatio ? "up" : "down",
    // rep falando menos que a semana passada é bom (mais espaço pro prospect)
    tone: avgTalkRatio <= prevWeek.talkRatio ? "good" : "bad",
  },
  {
    key: "signals",
    label: "Sinais de compra",
    value: String(totalBuyingSignals),
    colorClass: "text-rl-oxy",
    deltaLabel: `${pct(totalBuyingSignals, prevWeek.signals) >= 0 ? "+" : ""}${pct(totalBuyingSignals, prevWeek.signals)}%`,
    direction: totalBuyingSignals >= prevWeek.signals ? "up" : "down",
    tone: "good",
  },
  {
    key: "risk",
    label: "Deals em risco",
    value: String(dealsAtRisk),
    colorClass: dealsAtRisk >= 3 ? "text-rl-danger" : "text-rl-risk",
    deltaLabel: `${pct(dealsAtRisk, prevWeek.risk) >= 0 ? "+" : ""}${pct(dealsAtRisk, prevWeek.risk)}%`,
    direction: dealsAtRisk >= prevWeek.risk ? "up" : "down",
    tone: dealsAtRisk > prevWeek.risk ? "bad" : "good",
  },
  {
    key: "sentiment",
    label: "Sentimento médio",
    value: String(sentimentHealth),
    colorClass:
      sentimentHealth >= 60 ? "text-rl-oxy" : sentimentHealth >= 40 ? "text-rl-risk" : "text-rl-danger",
    deltaLabel: `${pct(sentimentHealth, prevWeek.sentiment) >= 0 ? "+" : ""}${pct(sentimentHealth, prevWeek.sentiment)}%`,
    direction: sentimentHealth >= prevWeek.sentiment ? "up" : "down",
    tone: sentimentHealth >= prevWeek.sentiment ? "good" : "bad",
  },
];

// ── Pulso do comercial: série de 8 semanas (volume + sentimento) ─────────
// Última semana (S0) bate com os agregados calculados acima.
export const weeklyTrend: WeeklyPoint[] = [
  { weekLabel: "S-7", calls: 5, sentiment: 54 },
  { weekLabel: "S-6", calls: 6, sentiment: 57 },
  { weekLabel: "S-5", calls: 7, sentiment: 61 },
  { weekLabel: "S-4", calls: 6, sentiment: 59 },
  { weekLabel: "S-3", calls: 9, sentiment: 66 },
  { weekLabel: "S-2", calls: 7, sentiment: 63 },
  { weekLabel: "S-1", calls: prevWeek.calls, sentiment: prevWeek.sentiment },
  { weekLabel: "Atual", calls: totalCallsThisWeek, sentiment: sentimentHealth },
];

// ── Ranking do time (derivado por closer a partir das calls prontas) ─────
export const teamRanking: CloserRanking[] = (() => {
  const byCloser = new Map<string, typeof readyCalls>();
  for (const c of readyCalls) {
    const list = byCloser.get(c.closer) ?? [];
    list.push(c);
    byCloser.set(c.closer, list);
  }

  return Array.from(byCloser.entries())
    .map(([name, list]) => {
      const talkRatio = Math.round(list.reduce((s, c) => s + c.talkRatioRep, 0) / list.length);
      const buyingSignals = list.reduce((s, c) => s + c.buyingSignalsCount, 0);
      const positives = list.filter((c) => c.signal === "sinal").length;
      const negatives = list.filter((c) => c.signal === "risco").length;
      const trend: Direction | "flat" =
        positives > negatives ? "up" : positives < negatives ? "down" : "flat";
      return {
        name,
        initials: list[0].closerInitials,
        calls: list.length,
        talkRatio,
        buyingSignals,
        trend,
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

// ── Precisa de atenção (deals em risco, acionável) ────────────────────────
export const attentionList: AttentionItem[] = [
  {
    callId: "cl-8839",
    account: "Cedro Farmacêutica",
    closer: "Camila Vasques",
    reason: "Objeção crítica sem resposta: contrato vigente + corte de orçamento",
    severity: "critica",
  },
  {
    callId: "cl-8819",
    account: "Multivix Educação",
    closer: "Bruno Kellner",
    reason: "Projeto despriorizado — decisor sem urgência declarada",
    severity: "critica",
  },
  {
    callId: "cl-8825",
    account: "Solaris Energia Renovável",
    closer: "Ísis Nogueira",
    reason: "Objeção de preço aberta, contraproposta ainda não enviada",
    severity: "risco",
  },
  {
    callId: "cl-8834",
    account: "Altiplano Seguros",
    closer: "Ísis Nogueira",
    reason: "Decisor final (CISO) ainda não engajado na conversa",
    severity: "risco",
  },
];

// ── Sinais de compra recentes ──────────────────────────────────────────────
export const buyingSignals: BuyingSignalItem[] = [
  {
    callId: "cl-8837",
    account: "Vórtice Alimentos",
    excerpt: "Se vocês me mandarem uma proposta formal essa semana, eu levo pro comitê na sexta.",
    closer: "Bruno Kellner",
    when: "09/07 · 11:00",
  },
  {
    callId: "cl-8841",
    account: "Nortex Logística",
    excerpt: "Budget de Q3 já aprovado pela diretoria — não é mais objeção de preço.",
    closer: "Bruno Kellner",
    when: "10/07 · 09:15",
  },
  {
    callId: "cl-8830",
    account: "Ferraz & Bittencourt Advogados",
    excerpt: "Se resolver essa parte de adoção, orçamento não vai ser problema.",
    closer: "Camila Vasques",
    when: "08/07 · 10:00",
  },
  {
    callId: "cl-8834",
    account: "Altiplano Seguros",
    excerpt: "Se a documentação estiver em ordem, me sinto confortável em recomendar avançar.",
    closer: "Ísis Nogueira",
    when: "08/07 · 16:20",
  },
];
