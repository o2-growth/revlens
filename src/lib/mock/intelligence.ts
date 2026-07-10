// Dados mock agregados — Painel de Inteligência Comercial.
// Derivados/coerentes com as 8 calls de src/lib/mock/calls.ts (sem backend).

import { calls, getCallById } from "./calls";
import {
  deals,
  openDeals,
  wonDeals,
  lostDeals,
  dealExpectedValue,
  dealsAtRisk,
  valueAtRisk,
  stageProbability,
  getDealByCallId,
  formatBRLCompact,
  type Deal,
} from "./deals";

export type Direction = "up" | "down";
export type Tone = "good" | "bad" | "neutral";

export type OperationMetric = {
  key: string;
  label: string;
  value: string;
  numericValue: number; // pro count-up
  unit?: string; // unidade rebaixada (%, etc.)
  prefix?: string; // prefixo rebaixado (R$, etc.)
  decimals?: number;
  subLegend?: string; // sub-legenda (ex.: contagem sob o valor em R$)
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
  /** ranking normalizado: sinais por call (não contagem crua — não premia volume/sorte) */
  signalsPerCall: number;
  /** win-rate do closer (calls decididas) — eficácia, não volume */
  winRate: number;
  trend: Direction | "flat";
  talkRatioTrend: number[]; // últimas N calls — escala fixa 0-100
  vsTeamDelta: number; // pp vs. média do time (talk ratio)
  outOfBand: boolean; // fora da faixa-alvo de um vital (âmbar)
  /** UMA prescrição de coaching derivada dos vitais fora de faixa */
  prescription: string;
  prescriptionCallId: string; // deep-link à call que evidencia
  prescriptionTimestamp: string;
};

export type ObjectionRankingItem = {
  text: string;
  count: number;
  pctOfCalls: number;
  /** win-rate quando a objeção está presente (%) — amarra frequência a desfecho */
  winRateWhenPresent: number;
  /** delta vs. baseline de win-rate do time (pp) */
  deltaVsBaseline: number;
  /** melhor call onde foi contornada — recibo clicável */
  bestHandledCallId: string;
  bestHandledTimestamp: string;
};

// ── Pressão competitiva (rollup a partir das menções nas calls) ───────────
export type CompetitorLean = "ganhando" | "disputado" | "perdendo";
export type CompetitorPressure = {
  competitor: string;
  kind: "incumbente" | "concorrente";
  mentions: number;
  dealsAffected: number;
  valueAtStake: number;
  lean: CompetitorLean;
  lossAxis: string; // eixo de perda: preço / integração / incumbência
  detail: string;
  callId: string; // recibo
  atTimestamp: string;
};

// ── Composição do commit (bridge pra quota) ───────────────────────────────
// Motivo pelo qual um deal NÃO sustenta o commit ponderado — mesma semântica
// verde/âmbar/vermelho do Ganhos × Perdidos, aplicada à transparência de exclusão.
export type OutOfCommitReason = "estagio-inicial" | "sem-proximo-passo" | "esfriando" | "perdido";

export type CommitDealLine = {
  dealId: string;
  account: string;
  callId: string;
  rawValue: number;
  weightedValue: number;
  probability: number;
  stage: string;
  inQueue: boolean;
  momentum: Deal["momentum"];
  /** ganho (booked) — sustenta o commit a 100%, chip verde "booked" */
  booked: boolean;
  /** null = sustenta o commit; caso contrário, o motivo pelo qual está fora */
  outOfCommitReason: OutOfCommitReason | null;
};

export type OutOfCommitGroup = {
  reason: OutOfCommitReason;
  label: string;
  tone: "risk" | "danger";
  count: number;
  /** soma do valor bruto (não ponderado) — dinheiro que não é contado com confiança */
  value: number;
};

// ── Drivers da confiança do forecast (explica o número black-box) ─────────
export type ForecastDriver = {
  label: string;
  tone: "oxy" | "risk" | "danger" | "neutral";
  callId?: string;
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
  // ── contexto de DEAL (a fila raciocina por deal, não por call isolada) ──
  dealId: string;
  stage: string;
  dealContext: string; // ex.: "18d em validação técnica · 1 thread"
  momentum: Deal["momentum"];
  momentumTrend: number[]; // mini-sparkline de momentum do deal
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
// calls "processando" ainda não geraram talk-ratio/sentimento — excluídas dos vitais
// de qualidade de call (não da contagem bruta). Explicitado na sub-legenda pra não
// parecer que o número "sumiu" alguém.
const processingCount = calls.length - readyCalls.length; // 1 (Bravium)
const processingNote =
  processingCount > 0
    ? `exclui ${processingCount} processando`
    : undefined;

// ── Vitais da operação (semana atual vs. semana passada) ─────────────────
const totalCallsThisWeek = calls.length; // 8
const avgTalkRatio = Math.round(
  readyCalls.reduce((sum, c) => sum + c.talkRatioRep, 0) / readyCalls.length,
); // 52
const totalBuyingSignals = calls.reduce((sum, c) => sum + c.buyingSignalsCount, 0); // 13
const dealsAtRiskCount = dealsAtRisk.length; // deals ABERTOS em risco (pipeline vivo, ameaçado)
const avgSentimentScore =
  readyCalls.reduce((sum, c) => sum + c.sentimentScore, 0) / readyCalls.length; // ~20.7
const sentimentHealth = Math.round((avgSentimentScore + 100) / 2); // ~60

// ── Calls sem próximo passo concreto (leading indicator forte) ──
// "concreto" = ação com dono + data. Curado das calls: Cedro (lost, só "reagendar"),
// Multivix (retomada vaga em janeiro), Bravium (processando, sem next step ainda).
const callsWithoutNextStep = ["cl-8839", "cl-8819", "cl-8815"];
const noNextStepCount = callsWithoutNextStep.length; // 3
const noNextStepPct = Math.round((noNextStepCount / calls.length) * 100); // ~38%

// Valor de pipeline em risco (soma dos deals abertos em risco) — a língua do QBR
const riskValueMi = Math.round((valueAtRisk / 1_000_000) * 100) / 100; // ex.: 1.15

// Semana passada (fabricado, coerente com a série de tendência abaixo)
const prevWeek = {
  calls: 6,
  talkRatio: 58,
  signals: 9,
  riskValueMi: 0.94,
  riskCount: 2,
  noNextStep: 4,
  sentiment: 68,
};

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
    subLegend: processingNote,
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
    // R$ em risco (não contagem) — um deal de 480k não vale o mesmo que um de 140k.
    key: "risk",
    label: "R$ em risco",
    value: formatBRLCompact(valueAtRisk),
    numericValue: riskValueMi,
    prefix: "R$ ",
    unit: "Mi",
    decimals: 2,
    subLegend: `${dealsAtRiskCount} deals · pipeline aberto`,
    colorClass: riskValueMi >= 1 ? "text-rl-danger" : "text-rl-risk",
    deltaLabel: `${pct(riskValueMi, prevWeek.riskValueMi) >= 0 ? "+" : ""}${pct(riskValueMi, prevWeek.riskValueMi)}%`,
    prevValueLabel: `era R$ ${prevWeek.riskValueMi.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`,
    direction: riskValueMi >= prevWeek.riskValueMi ? "up" : "down",
    tone: riskValueMi > prevWeek.riskValueMi ? "bad" : "good",
    toneColor: riskValueMi >= 1 ? "danger" : "risk",
    history: [0.72, 0.61, 0.83, 0.55, 0.9, 0.88, 0.94, riskValueMi],
  },
  {
    // Calls sem próximo passo concreto — o preditor antecedente mais forte de escorregão.
    key: "no-next-step",
    label: "Sem próximo passo",
    value: String(noNextStepCount),
    numericValue: noNextStepCount,
    subLegend: `${noNextStepPct}% das calls`,
    colorClass: noNextStepPct >= 30 ? "text-rl-risk" : "text-rl-oxy",
    deltaLabel: `${pct(noNextStepCount, prevWeek.noNextStep) >= 0 ? "+" : ""}${pct(noNextStepCount, prevWeek.noNextStep)}%`,
    prevValueLabel: `era ${prevWeek.noNextStep}`,
    direction: noNextStepCount >= prevWeek.noNextStep ? "up" : "down",
    // menos calls sem próximo passo = bom (mais deals com data marcada)
    tone: noNextStepCount <= prevWeek.noNextStep ? "good" : "bad",
    toneColor: noNextStepPct >= 30 ? "risk" : "oxy",
    history: [5, 4, 5, 3, 4, 4, 4, noNextStepCount],
  },
  {
    key: "sentiment",
    label: "Sentimento médio",
    value: String(sentimentHealth),
    numericValue: sentimentHealth,
    subLegend: processingNote,
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

// ── Forecast do trimestre — DERIVADO DO PIPELINE, não do sentimento ────────
// Prever receita a partir do sentimento médio de call é ingênuo (sentimento é
// leading indicator ruidoso, não pipeline ponderado). Aqui o commit é a soma dos
// dealValue ponderados pela probabilidade do estágio (expected value):
//   ganho = 100% (booked) · perdido = 0% · aberto = valor × prob(estágio)
const bookedValue = wonDeals.reduce((s, d) => s + d.dealValue, 0);
const weightedPipeline = openDeals.reduce((s, d) => s + dealExpectedValue(d), 0);
const commitValue = bookedValue + weightedPipeline;

// Cenários: best/worst deslocam a probabilidade dos deals ABERTOS (booked não muda).
const bestPipeline = openDeals.reduce(
  (s, d) => s + d.dealValue * Math.min(stageProbability[d.stage] * 1.5, 0.95),
  0,
);
const worstPipeline = openDeals.reduce(
  (s, d) => s + d.dealValue * (stageProbability[d.stage] * 0.45),
  0,
);

const QUOTA = 1_800_000;

// Expected value contribuído pelos deals abertos que estão na Fila de Intervenção
// → é o "commit em risco" que corrói a confiança.
const atRiskDealAccounts = new Set(
  dealsAtRisk.map((d) => d.account),
);
const commitAtRisk = openDeals
  .filter((d) => atRiskDealAccounts.has(d.account))
  .reduce((s, d) => s + dealExpectedValue(d), 0);

// Confiança = 100% − parcela do commit que está em deals em risco (piso semântico).
const confidenceValue = Math.max(
  35,
  Math.round((1 - commitAtRisk / commitValue) * 100),
);

// top-5 deals por valor bruto — quantos estão escorregando (na fila)
const top5 = [...deals]
  .filter((d) => d.outcome !== "perdido")
  .sort((a, b) => b.dealValue - a.dealValue)
  .slice(0, 5);
const top5Slipping = top5.filter((d) => atRiskDealAccounts.has(d.account)).length;

export const forecast = {
  commit: Math.round(commitValue),
  best: Math.round(bookedValue + bestPipeline),
  worst: Math.round(bookedValue + worstPipeline),
  confidence: confidenceValue,
  quota: QUOTA,
  booked: Math.round(bookedValue),
  weightedPipeline: Math.round(weightedPipeline),
  commitAtRisk: Math.round(commitAtRisk),
};

// Drivers da confiança — o "64%" deixa de ser black-box.
export const forecastDrivers: ForecastDriver[] = [
  {
    label: `${top5Slipping} dos top-5 deals escorregando`,
    tone: top5Slipping >= 2 ? "risk" : "neutral",
  },
  {
    label: `${formatBRLCompact(commitAtRisk)} do commit em deals na fila`,
    tone: "risk",
  },
  {
    label: "sentimento -8pts em 2 semanas",
    tone: "risk",
  },
  {
    label: `${bookedValue > 0 ? formatBRLCompact(bookedValue) : "R$ 0"} já fechado (booked)`,
    tone: "oxy",
  },
];

// ── Composição do commit (bridge pra quota) — "o gap é fechado por QUAIS deals?
// e por que NÃO é fechado pelos outros?" ──────────────────────────────────
const inQueueAccounts = new Set(dealsAtRisk.map((d) => d.account));

// Motivo pelo qual um deal ABERTO não sustenta o commit com confiança — ordem de
// prioridade: probabilidade estrutural (estágio) > falta de ação agendada > momentum.
// Deals ganhos entram como "booked" (100%); deals perdidos como "perdido" (vermelho).
function outOfCommitReasonFor(d: Deal): OutOfCommitReason | null {
  if (d.stage === "descoberta") return "estagio-inicial";
  if (!d.hasNextStep) return "sem-proximo-passo";
  if (d.momentum === "esfriando" || d.momentum === "estagnado") return "esfriando";
  return null;
}

function toCommitLine(d: Deal, reason: OutOfCommitReason | null, booked: boolean): CommitDealLine {
  return {
    dealId: d.id,
    account: d.account,
    callId: d.primaryCallId,
    rawValue: d.dealValue,
    weightedValue: booked ? d.dealValue : reason === "perdido" ? 0 : Math.round(dealExpectedValue(d)),
    probability: booked ? 1 : reason === "perdido" ? 0 : stageProbability[d.stage],
    stage: d.stage,
    inQueue: inQueueAccounts.has(d.account),
    momentum: d.momentum,
    booked,
    outOfCommitReason: reason,
  };
}

const bookedLines = wonDeals.map((d) => toCommitLine(d, null, true));
const openLines = openDeals.map((d) => toCommitLine(d, outOfCommitReasonFor(d), false));
const lostLines = lostDeals.map((d) => toCommitLine(d, "perdido", false));

const outOfCommitLines = [...openLines.filter((l) => l.outOfCommitReason !== null), ...lostLines];

const outOfCommitReasonMeta: Record<OutOfCommitReason, { label: string; tone: "risk" | "danger" }> = {
  "estagio-inicial": { label: "estágio inicial", tone: "risk" },
  "sem-proximo-passo": { label: "sem próximo passo", tone: "risk" },
  esfriando: { label: "esfriando / estagnado", tone: "risk" },
  perdido: { label: "perdido", tone: "danger" },
};
const outOfCommitOrder: OutOfCommitReason[] = [
  "estagio-inicial",
  "sem-proximo-passo",
  "esfriando",
  "perdido",
];

export const commitComposition = {
  quota: QUOTA,
  commit: Math.round(commitValue),
  booked: Math.round(bookedValue),
  weightedPipeline: Math.round(weightedPipeline),
  gapToQuota: Math.round(QUOTA - commitValue),
  // deals que sustentam o commit: ganhos (booked) + abertos sem motivo de exclusão
  deals: [...bookedLines, ...openLines.filter((l) => l.outOfCommitReason === null)].sort(
    (a, b) => b.weightedValue - a.weightedValue,
  ),
  // fora do commit ponderado: abertos com motivo + perdidos recentes — transparência de exclusão
  outOfCommit: [...outOfCommitLines].sort((a, b) => b.rawValue - a.rawValue),
  outOfCommitGroups: outOfCommitOrder
    .map<OutOfCommitGroup | null>((reason) => {
      const matching = outOfCommitLines.filter((l) => l.outOfCommitReason === reason);
      if (matching.length === 0) return null;
      return {
        reason,
        label: outOfCommitReasonMeta[reason].label,
        tone: outOfCommitReasonMeta[reason].tone,
        count: matching.length,
        value: matching.reduce((s, l) => s + l.rawValue, 0),
      };
    })
    .filter((g): g is OutOfCommitGroup => g !== null),
  outOfCommitValue: outOfCommitLines.reduce((s, l) => s + l.rawValue, 0),
};

// Prescrição de coaching por closer — derivada do vital fora de faixa, com recibo.
// Coerente com coaching.ts (mesmos worstMoments) e com o conteúdo das calls.
const coachPrescription: Record<
  string,
  { text: string; callId: string; ts: string }
> = {
  "Camila Vasques": {
    text: "Talk-ratio 68% na Cedro com 0 perguntas de descoberta → treinar qualificação antes do pitch.",
    callId: "cl-8839",
    ts: "00:22",
  },
  "Ísis Nogueira": {
    text: "Objeção de preço recebida sem TCO na hora (Solaris) → chegar com número de custo-total pronto.",
    callId: "cl-8825",
    ts: "00:24",
  },
  "Bruno Kellner": {
    text: "Insiste no pitch quando o prospect sinaliza sem timing (Multivix) → encerrar e reagendar com data.",
    callId: "cl-8819",
    ts: "00:10",
  },
};

// ── Ranking do time (NORMALIZADO — sinais por call e win-rate, não contagem crua) ─
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
      const signalsPerCall = Math.round((buyingSignals / list.length) * 10) / 10;
      const decided = list.filter((c) => c.outcome !== "aberto");
      const won = decided.filter((c) => c.outcome === "ganho").length;
      const winRate = decided.length > 0 ? Math.round((won / decided.length) * 100) : 0;
      const positives = list.filter((c) => c.signal === "sinal").length;
      const negatives = list.filter((c) => c.signal === "risco").length;
      const trend: Direction | "flat" =
        positives > negatives ? "up" : positives < negatives ? "down" : "flat";
      // trend de talk-ratio por call (cronológico), escala fixa 0-100
      const talkRatioTrend = [...list]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((c) => c.talkRatioRep);
      // pior call (maior talk-ratio) — âmbar se qualquer call estourou a faixa
      const worstTalk = Math.max(...list.map((c) => c.talkRatioRep));
      const presc = coachPrescription[name] ?? {
        text: "Manter descoberta forte e próximos passos com data.",
        callId: list[0].id,
        ts: "00:00",
      };
      return {
        name,
        initials: list[0].closerInitials,
        calls: list.length,
        talkRatio,
        buyingSignals,
        signalsPerCall,
        winRate,
        trend,
        talkRatioTrend,
        vsTeamDelta: talkRatio - teamAvgTalk,
        outOfBand: worstTalk >= 60, // qualquer call fora da faixa saudável acende âmbar
        prescription: presc.text,
        prescriptionCallId: presc.callId,
        prescriptionTimestamp: presc.ts,
      };
    })
    // normalizado: ordena por eficácia (sinais/call), desempata por win-rate
    .sort((a, b) => b.signalsPerCall - a.signalsPerCall || b.winRate - a.winRate);
})();

// Baseline de win-rate do time (calls decididas) — âncora do impacto das objeções.
const decidedCalls = calls.filter((c) => c.outcome !== "aberto");
export const baselineWinRate = Math.round(
  (decidedCalls.filter((c) => c.outcome === "ganho").length / Math.max(1, decidedCalls.length)) *
    100,
); // 50%

// ── Objeções da semana — amarradas a DESFECHO (frequência + impacto no win-rate) ──
// winRateWhenPresent é mock coerente: objeção de timing/preço presente derruba o fechamento;
// bem contornada (recibo) é a call onde o rebuttal funcionou.
export const objectionRanking: ObjectionRankingItem[] = [
  {
    text: "Timing / orçamento não aprovado",
    count: 2,
    pctOfCalls: 29,
    winRateWhenPresent: 20,
    deltaVsBaseline: 20 - baselineWinRate,
    bestHandledCallId: "cl-8830",
    bestHandledTimestamp: "02:35",
  },
  {
    text: "Preço acima do concorrente",
    count: 2,
    pctOfCalls: 29,
    winRateWhenPresent: 33,
    deltaVsBaseline: 33 - baselineWinRate,
    bestHandledCallId: "cl-8825",
    bestHandledTimestamp: "01:40",
  },
  {
    text: "Integração com sistema atual (TMS/ERP)",
    count: 1,
    pctOfCalls: 14,
    winRateWhenPresent: 60,
    deltaVsBaseline: 60 - baselineWinRate,
    bestHandledCallId: "cl-8841",
    bestHandledTimestamp: "03:05",
  },
  {
    text: "Segurança de dados e compliance",
    count: 1,
    pctOfCalls: 14,
    winRateWhenPresent: 50,
    deltaVsBaseline: 50 - baselineWinRate,
    bestHandledCallId: "cl-8834",
    bestHandledTimestamp: "01:20",
  },
  {
    text: "Resistência interna da equipe",
    count: 1,
    pctOfCalls: 14,
    winRateWhenPresent: 75,
    deltaVsBaseline: 75 - baselineWinRate,
    bestHandledCallId: "cl-8830",
    bestHandledTimestamp: "02:10",
  },
];

// ── Pressão competitiva — rollup das menções a concorrentes nas calls ─────
// Os dados de calls.ts já são ricos em concorrentes; aqui viram inteligência acionável:
// contra quem, em quantos deals, quanto de R$ em jogo, ganhando/perdendo e por qual eixo.
export const competitorPressure: CompetitorPressure[] = [
  {
    competitor: "SunOps",
    kind: "concorrente",
    mentions: 1,
    dealsAffected: 1,
    valueAtStake: 410000,
    lean: "disputado",
    lossAxis: "preço (-20%)",
    detail: "Proposta 20% mais barata na Solaris; ganhamos no SLA/suporte local se agir rápido.",
    callId: "cl-8825",
    atTimestamp: "00:24",
  },
  {
    competitor: "RotaCerta",
    kind: "incumbente",
    mentions: 1,
    dealsAffected: 1,
    valueAtStake: 320000,
    lean: "perdendo",
    lossAxis: "incumbência (contrato até dez)",
    detail: "Incumbente na Cedro bloqueando urgência — contrato vigente até dezembro + corte de TI.",
    callId: "cl-8839",
    atTimestamp: "03:10",
  },
  {
    competitor: "LogTrack",
    kind: "concorrente",
    mentions: 1,
    dealsAffected: 1,
    valueAtStake: 480000,
    lean: "disputado",
    lossAxis: "comparativo técnico pendente",
    detail: "Nortex pediu comparativo técnico vs. LogTrack antes de avançar — janela aberta pra ganhar.",
    callId: "cl-8841",
    atTimestamp: "05:24",
  },
];

export const competitorTotals = {
  dealsAffected: competitorPressure.reduce((s, c) => s + c.dealsAffected, 0),
  valueAtStake: competitorPressure.reduce((s, c) => s + c.valueAtStake, 0),
};

// ── Fila de Intervenção — RACIOCINA POR DEAL (dias em estágio, gap de atividade,
// single-thread, momentum), não por métrica de uma call isolada. Cada item é
// enriquecido com o contexto do deal correspondente (deals.ts). ──
type RawIntervention = Omit<
  InterventionItem,
  "dealId" | "stage" | "dealContext" | "momentum" | "momentumTrend"
>;

const rawInterventions: RawIntervention[] = [
  {
    // Reframe: o risco do deal é a INCUMBÊNCIA (RotaCerta até dez), não o talk-ratio da call.
    callId: "cl-8839",
    account: "Cedro Farmacêutica",
    closer: "Camila Vasques",
    severity: "critica",
    reasonType: "CONCORRENTE CITADO",
    reasonDetail: "RotaCerta",
    evidence: "Incumbente até dezembro + corte de TI; sem próximo passo com data marcada.",
    evidenceTimestamp: "03:10",
    ageLabel: "há 1 dia",
    ageDays: 1,
    dealValue: 320000,
    recommendedAction: "Reenquadrar valor vs. incumbente",
  },
  {
    callId: "cl-8825",
    account: "Solaris Energia Renovável",
    closer: "Ísis Nogueira",
    severity: "critica",
    reasonType: "PREÇO SEM REAÇÃO",
    reasonDetail: "-20%",
    evidence: "SunOps 20% abaixo; contraproposta prometida e ainda não enviada há 3 dias.",
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
    evidence: "Decisão em comitê, mas o CTO (Ricardo) nunca entrou numa call — single-threaded.",
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
    reasonDetail: "1 thread",
    evidence: "Decisor final (CISO) ainda não engajado — só o gerente de TI na call, 18d no estágio.",
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
    reasonDetail: "40d parado",
    evidence: "Projeto despriorizado, sem verba até o próximo ano fiscal — congelado em descoberta.",
    evidenceTimestamp: "00:10",
    ageLabel: "há 4 dias",
    ageDays: 4,
    dealValue: 140000,
    recommendedAction: "Reativar em janeiro",
  },
];

// enriquece cada item com o contexto do DEAL (a fila raciocina por deal)
const enrichedInterventions: InterventionItem[] = rawInterventions.map((r) => {
  const deal = getDealByCallId(r.callId);
  const dealContext = deal
    ? `${deal.ageInStageDays}d em ${deal.stage} · ${deal.threadCount} thread${deal.threadCount > 1 ? "s" : ""}${deal.activityGapDays > 0 ? ` · gap ${deal.activityGapDays}d` : ""}`
    : "";
  return {
    ...r,
    dealId: deal?.id ?? r.callId,
    stage: deal?.stage ?? "",
    dealContext,
    momentum: deal?.momentum ?? "estagnado",
    momentumTrend: deal?.momentumTrend ?? [50, 50, 50, 50, 50, 50],
  };
});

// score de triagem: severidade (peso 3) + valor do deal (normalizado) − idade
const maxDeal = Math.max(...enrichedInterventions.map((i) => i.dealValue));
export const interventionQueue: InterventionItem[] = [...enrichedInterventions].sort((a, b) => {
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
