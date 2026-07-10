// Dados mock — entidade DEAL (revenue intelligence de verdade). ADITIVO.
// A ferramenta se vende como REVENUE intelligence, mas as calls sozinhas raciocinam
// na unidade CALL. Um deal real tem N calls ao longo de semanas, uma trajetória,
// dias-em-estágio, threads crescendo/encolhendo e gap de atividade. Este módulo agrega
// as calls por conta num objeto Deal coerente (mesmas contas, owners, datas, outcomes).

import { calls, type Call, type CallOutcome } from "./calls";

export type DealStage =
  | "descoberta"
  | "validação técnica"
  | "proposta"
  | "negociação"
  | "fechamento";

export type DealMomentum = "aquecendo" | "estagnado" | "esfriando";

/** Probabilidade de fechamento por estágio — base do forecast (expected value). */
export const stageProbability: Record<DealStage, number> = {
  descoberta: 0.15,
  "validação técnica": 0.35,
  proposta: 0.55,
  negociação: 0.75,
  fechamento: 0.9,
};

export const stageOrder: DealStage[] = [
  "descoberta",
  "validação técnica",
  "proposta",
  "negociação",
  "fechamento",
];

export type Deal = {
  id: string;
  account: string;
  owner: string;
  ownerInitials: string;
  stage: DealStage;
  /** dias parado no estágio atual — sinal de deal, não de call */
  ageInStageDays: number;
  /** dias desde a última atividade/call — gap = deal esfriando */
  activityGapDays: number;
  /** nº de pessoas engajadas no comitê (1 = single-threaded = risco) */
  threadCount: number;
  momentum: DealMomentum;
  /** saúde do deal ao longo das últimas ~6 semanas (0-100) — mini-sparkline de momentum */
  momentumTrend: number[];
  dealValue: number;
  callIds: string[];
  outcome: CallOutcome;
  /** call mais recente do deal — recibo padrão pra deep-link */
  primaryCallId: string;
};

// Metadados de deal por conta (enrichment intencional e coerente com o conteúdo das calls).
// Não sobrescreve nada das calls — apenas adiciona a camada de trajetória que faltava.
type DealMeta = {
  stage: DealStage;
  ageInStageDays: number;
  activityGapDays: number;
  threadCount: number;
  momentum: DealMomentum;
  momentumTrend: number[];
  /** fallback de valor quando a call não traz dealValue (ex.: call ainda processando) */
  dealValueFallback?: number;
};

const dealMetaByAccount: Record<string, DealMeta> = {
  // Budget Q3 aprovado, mas o CTO (champion técnico) nunca entrou — single-threaded.
  // Sentimento positivo mantém o momentum aquecendo, apesar do risco de thread.
  "Nortex Logística": {
    stage: "validação técnica",
    ageInStageDays: 12,
    activityGapDays: 0,
    threadCount: 1,
    momentum: "aquecendo",
    momentumTrend: [48, 52, 55, 60, 64, 68],
  },
  // Incumbente (RotaCerta) até dezembro + corte de orçamento. Perdido, esfriando.
  "Cedro Farmacêutica": {
    stage: "negociação",
    ageInStageDays: 34,
    activityGapDays: 1,
    threadCount: 1,
    momentum: "esfriando",
    momentumTrend: [62, 55, 48, 40, 30, 18],
  },
  // Pediu proposta antes do rep sugerir. Ganho, aquecendo.
  "Vórtice Alimentos": {
    stage: "fechamento",
    ageInStageDays: 6,
    activityGapDays: 1,
    threadCount: 2,
    momentum: "aquecendo",
    momentumTrend: [70, 74, 78, 82, 88, 92],
  },
  // Bloqueio de segurança; CISO (decisor) não engajado — single-threaded, estagnado 18d.
  "Altiplano Seguros": {
    stage: "validação técnica",
    ageInStageDays: 18,
    activityGapDays: 2,
    threadCount: 1,
    momentum: "estagnado",
    momentumTrend: [40, 42, 41, 40, 39, 40],
  },
  // Sócia decide sozinha, boa energia. Ganho, aquecendo.
  "Ferraz & Bittencourt Advogados": {
    stage: "fechamento",
    ageInStageDays: 4,
    activityGapDays: 2,
    threadCount: 1,
    momentum: "aquecendo",
    momentumTrend: [55, 60, 66, 70, 76, 80],
  },
  // Preço 20% acima da SunOps, contraproposta prometida e não enviada — esfriando.
  "Solaris Energia Renovável": {
    stage: "proposta",
    ageInStageDays: 21,
    activityGapDays: 3,
    threadCount: 1,
    momentum: "esfriando",
    momentumTrend: [58, 56, 52, 48, 45, 41],
  },
  // Projeto despriorizado, sem verba até o próximo ano fiscal — congelado.
  "Multivix Educação": {
    stage: "descoberta",
    ageInStageDays: 40,
    activityGapDays: 4,
    threadCount: 1,
    momentum: "esfriando",
    momentumTrend: [45, 38, 30, 24, 18, 12],
  },
  // Call ainda processando — descoberta recém-aberta, estagnado até gerar sinais.
  "Bravium Construtora": {
    stage: "descoberta",
    ageInStageDays: 0,
    activityGapDays: 0,
    threadCount: 1,
    momentum: "estagnado",
    momentumTrend: [50, 50, 50, 50, 50, 50],
    dealValueFallback: 200000,
  },
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Agrega as calls por conta → um Deal por conta (coerente: mesmas datas/owners/outcomes).
export const deals: Deal[] = (() => {
  const byAccount = new Map<string, Call[]>();
  for (const c of calls) {
    const list = byAccount.get(c.account) ?? [];
    list.push(c);
    byAccount.set(c.account, list);
  }

  return Array.from(byAccount.entries()).map(([account, accountCalls]) => {
    const sorted = [...accountCalls].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    const meta = dealMetaByAccount[account];
    const withValue = sorted.find((c) => c.dealValue != null);
    const dealValue = withValue?.dealValue ?? meta?.dealValueFallback ?? 0;

    return {
      id: "dl-" + latest.id.replace("cl-", ""),
      account,
      owner: latest.closer,
      ownerInitials: latest.closerInitials || initialsOf(latest.closer),
      stage: meta?.stage ?? "descoberta",
      ageInStageDays: meta?.ageInStageDays ?? 0,
      activityGapDays: meta?.activityGapDays ?? 0,
      threadCount: meta?.threadCount ?? 1,
      momentum: meta?.momentum ?? "estagnado",
      momentumTrend: meta?.momentumTrend ?? [50, 50, 50, 50, 50, 50],
      dealValue,
      callIds: sorted.map((c) => c.id),
      outcome: latest.outcome,
      primaryCallId: latest.id,
    };
  });
})();

export function getDealById(id: string): Deal | undefined {
  return deals.find((d) => d.id === id);
}

export function getDealByAccount(account: string): Deal | undefined {
  return deals.find((d) => d.account === account);
}

export function getDealByCallId(callId: string): Deal | undefined {
  return deals.find((d) => d.callIds.includes(callId));
}

/** Valor esperado (expected value) do deal pro forecast: ganho=100%, perdido=0%, aberto=valor×prob. */
export function dealExpectedValue(d: Deal): number {
  if (d.outcome === "ganho") return d.dealValue;
  if (d.outcome === "perdido") return 0;
  return d.dealValue * stageProbability[d.stage];
}

export const openDeals = deals.filter((d) => d.outcome === "aberto");
export const wonDeals = deals.filter((d) => d.outcome === "ganho");
export const lostDeals = deals.filter((d) => d.outcome === "perdido");

/** Deals abertos em risco: momentum esfriando/estagnado (pipeline ainda vivo, mas ameaçado). */
export const dealsAtRisk = openDeals.filter((d) => d.momentum !== "aquecendo");
export const valueAtRisk = dealsAtRisk.reduce((s, d) => s + d.dealValue, 0);

const momentumLabel: Record<DealMomentum, string> = {
  aquecendo: "aquecendo",
  estagnado: "estagnado",
  esfriando: "esfriando",
};
export function momentumText(m: DealMomentum): string {
  return momentumLabel[m];
}

/** Formata R$ compacto (k / Mi) — mono, pt-BR. */
export function formatBRLCompact(v: number): string {
  if (v >= 1_000_000) {
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Mi`;
  }
  if (v >= 1000) return `R$ ${Math.round(v / 1000)}k`;
  return `R$ ${v}`;
}
