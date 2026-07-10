import Link from "next/link";
import type { CommitDealLine, OutOfCommitGroup } from "@/lib/mock/intelligence";
import { formatBRLCompact } from "@/lib/mock/deals";
import { Readout } from "@/components/Readout";

type CommitCompositionProps = {
  quota: number;
  commit: number;
  booked: number;
  weightedPipeline: number;
  gapToQuota: number;
  deals: CommitDealLine[];
  outOfCommit: CommitDealLine[];
  outOfCommitGroups: OutOfCommitGroup[];
  outOfCommitValue: number;
};

const momentumTone: Record<CommitDealLine["momentum"], string> = {
  aquecendo: "text-rl-oxy",
  estagnado: "text-rl-text-3",
  esfriando: "text-rl-risk",
};

const reasonTone: Record<OutOfCommitGroup["tone"], string> = {
  risk: "border-rl-risk/30 bg-rl-risk-dim text-rl-risk",
  danger: "border-rl-danger/30 bg-rl-danger-dim text-rl-danger",
};

/**
 * Composição do commit — bridge pra quota. Responde: "o gap pra quota é fechado
 * por QUAIS deals, e quais estão em risco?" — e, na seção "Fora do commit",
 * "por que os outros deals NÃO contam pra esse número?" (estágio inicial, sem
 * próximo passo, esfriando/estagnado, perdido). Deals abertos ordenados por peso
 * (expected value); os que estão na Fila de Intervenção são marcados.
 */
export function CommitComposition({
  quota,
  commit,
  booked,
  weightedPipeline,
  gapToQuota,
  deals,
  outOfCommit,
  outOfCommitGroups,
  outOfCommitValue,
}: CommitCompositionProps) {
  const gapOpen = gapToQuota > 0;
  // largura das barras do bridge (booked + pipeline sobre a quota)
  const bookedPct = quota > 0 ? (booked / quota) * 100 : 0;
  const pipePct = quota > 0 ? (weightedPipeline / quota) * 100 : 0;
  const gapPct = Math.max(0, 100 - bookedPct - pipePct);

  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Composição do commit · bridge pra quota
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">
          quota {formatBRLCompact(quota)}
        </span>
      </div>

      <div className="px-5 py-4">
        {/* leitura-herói: commit vs. gap */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-rl-text-3">Commit ponderado</div>
            <div className="mt-1 text-2xl">
              <Readout
                value={Math.round((commit / 1_000_000) * 100) / 100}
                prefix="R$ "
                unit="Mi"
                decimals={2}
                tone="text"
                hero
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-rl-text-3">
              {gapOpen ? "Gap pra quota" : "Acima da quota"}
            </div>
            <div className="mt-1 text-2xl">
              <Readout
                value={Math.round((Math.abs(gapToQuota) / 1_000_000) * 100) / 100}
                prefix="R$ "
                unit="Mi"
                decimals={2}
                tone={gapOpen ? "risk" : "oxy"}
                hero
              />
            </div>
          </div>
        </div>

        {/* bridge: booked (verde) + pipeline ponderado (borda) + gap (âmbar) */}
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-rl-inset">
          <div className="h-full bg-rl-oxy" style={{ width: `${bookedPct}%` }} title="Booked" />
          <div
            className="h-full"
            style={{
              width: `${pipePct}%`,
              background: "var(--color-rl-oxy-band)",
              boxShadow: "inset 0 0 0 1px rgba(108,242,105,0.25)",
            }}
            title="Pipeline ponderado"
          />
          {gapPct > 0 ? (
            <div
              className="h-full"
              style={{ width: `${gapPct}%`, background: "var(--color-rl-risk-dim)" }}
              title="Gap"
            />
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-rl-text-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" />
            <span className="rl-readout">{formatBRLCompact(booked)}</span> booked
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-3 rounded-sm"
              style={{ background: "var(--color-rl-oxy-band)", boxShadow: "inset 0 0 0 1px rgba(108,242,105,0.25)" }}
            />
            <span className="rl-readout">{formatBRLCompact(weightedPipeline)}</span> pipeline ponderado
          </span>
          {gapOpen ? (
            <span className="flex items-center gap-1.5 text-rl-risk">
              <span className="inline-block h-1.5 w-3 rounded-sm" style={{ background: "var(--color-rl-risk-dim)" }} />
              <span className="rl-readout">{formatBRLCompact(gapToQuota)}</span> a descobrir
            </span>
          ) : null}
        </div>

        {/* deals que preenchem/ameaçam o gap, ordenados por peso */}
        <div className="mt-4 mb-1.5 text-[10px] uppercase tracking-wider text-rl-text-3">
          Deals que sustentam o commit
        </div>
        <ul>
          {deals.map((d) => (
            <li
              key={d.dealId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-rl-border-soft py-2.5 first:border-t-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <Link
                    href={`/calls/${d.callId}`}
                    className="truncate text-sm text-rl-text rl-t-hover transition-colors hover:text-rl-oxy"
                  >
                    {d.account}
                  </Link>
                  {d.booked ? (
                    <span className="rl-readout rounded-[4px] border border-rl-oxy/30 bg-rl-oxy-dim px-1.5 py-px text-[9px] uppercase tracking-wide text-rl-oxy">
                      booked
                    </span>
                  ) : d.inQueue ? (
                    <span className="rl-readout rounded-[4px] border border-rl-risk/30 bg-rl-risk-dim px-1.5 py-px text-[9px] uppercase tracking-wide text-rl-risk">
                      na fila
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-rl-text-3">
                  <span className="rl-readout uppercase tracking-wide">{d.stage}</span>
                  <span className="text-rl-text-muted">·</span>
                  <span className="rl-readout">{Math.round(d.probability * 100)}% prob</span>
                  <span className="text-rl-text-muted">·</span>
                  <span className={d.booked ? "rl-readout text-rl-oxy" : `rl-readout ${momentumTone[d.momentum]}`}>
                    {d.booked ? "fechado" : d.momentum}
                  </span>
                </div>
              </div>
              <Link
                href={`/calls/${d.callId}`}
                className="rl-press text-right rl-t-hover transition-opacity hover:opacity-80"
                title={`Peso no commit — ${formatBRLCompact(d.weightedValue)} de ${formatBRLCompact(d.rawValue)}`}
              >
                <div className="rl-readout text-sm text-rl-text">{formatBRLCompact(d.weightedValue)}</div>
                <div className="rl-readout text-[10px] text-rl-text-3">
                  de {formatBRLCompact(d.rawValue)}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* transparência de exclusão — "por que este dinheiro não está no commit?".
            Mesma semântica de Ganhos × Perdidos: âmbar = risco/estágio, vermelho = perdido. */}
        {outOfCommit.length > 0 ? (
          <>
            <div className="mt-5 mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-rl-border pt-4">
              <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
                Fora do commit
              </span>
              <span className="rl-readout text-[11px] text-rl-text-3">
                {formatBRLCompact(outOfCommitValue)} não contados · {outOfCommit.length}{" "}
                {outOfCommit.length === 1 ? "deal" : "deals"}
              </span>
            </div>

            {/* resumo por motivo — a resposta direta pra "por que o gap não fecha" */}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {outOfCommitGroups.map((g) => (
                <span
                  key={g.reason}
                  className={`rl-readout inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide ${reasonTone[g.tone]}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${g.tone === "danger" ? "bg-rl-danger" : "bg-rl-risk"}`}
                  />
                  {formatBRLCompact(g.value)} · {g.count} {g.count === 1 ? "deal" : "deals"} {g.label}
                </span>
              ))}
            </div>

            <ul>
              {outOfCommit.map((d) => (
                <li
                  key={d.dealId}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-rl-border-soft py-2.5 first:border-t-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Link
                        href={`/calls/${d.callId}`}
                        className="truncate text-sm text-rl-text-2 rl-t-hover transition-colors hover:text-rl-text"
                      >
                        {d.account}
                      </Link>
                      {d.outOfCommitReason ? (
                        <span
                          className={`rl-readout rounded-[4px] border px-1.5 py-px text-[9px] uppercase tracking-wide ${reasonTone[outOfCommitGroups.find((g) => g.reason === d.outOfCommitReason)?.tone ?? "risk"]}`}
                        >
                          {outOfCommitGroups.find((g) => g.reason === d.outOfCommitReason)?.label}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-rl-text-3">
                      <span className="rl-readout uppercase tracking-wide">{d.stage}</span>
                      <span className="text-rl-text-muted">·</span>
                      <span className="rl-readout">{Math.round(d.probability * 100)}% prob</span>
                    </div>
                  </div>
                  <Link
                    href={`/calls/${d.callId}`}
                    className="rl-press text-right rl-t-hover transition-opacity hover:opacity-80"
                    title="Valor bruto não ponderado no commit"
                  >
                    <div className="rl-readout text-sm text-rl-text-3">{formatBRLCompact(d.rawValue)}</div>
                    <div className="rl-readout text-[10px] text-rl-text-3">não contado</div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
