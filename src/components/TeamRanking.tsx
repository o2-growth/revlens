import type { CloserRanking } from "@/lib/mock/intelligence";
import { Sparkline } from "@/components/Sparkline";
import { EvidenceChip } from "@/components/EvidenceChip";

type TeamRankingProps = {
  items: CloserRanking[];
};

/**
 * Cor pela SEMÂNTICA/outOfBand, não pela direção crua — up≠sempre-bom aqui
 * (mesma disciplina do Delta): fora-da-faixa = âmbar; dentro + melhorando = verde;
 * o resto (neutro/piorando-mas-em-faixa) = text-3.
 */
function TrendGlyph({ trend, outOfBand }: { trend: CloserRanking["trend"]; outOfBand: boolean }) {
  const toneClass = outOfBand ? "text-rl-risk" : trend === "up" ? "text-rl-oxy" : "text-rl-text-3";

  if (trend === "up") {
    return (
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className={toneClass}>
        <path d="M1 8.5L5 4.5L8 6.5L13 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className={toneClass}>
        <path d="M1 1.5L5 5.5L8 3.5L13 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className={toneClass}>
      <path d="M1 5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function TeamRanking({ items }: TeamRankingProps) {
  // domínio fixo compartilhado — comparabilidade real entre closers
  const allTalk = items.flatMap((c) => c.talkRatioTrend);
  const domain: [number, number] = [Math.min(...allTalk, 30), Math.max(...allTalk, 70)];
  const maxSpc = Math.max(...items.map((c) => c.signalsPerCall), 0.1);

  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-canvas">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Scorecard de coaching · por eficácia
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">sinais / call · win-rate</span>
      </div>

      <div className="hidden grid-cols-[1fr_64px_auto_auto_auto] items-center gap-4 px-5 py-2.5 sm:grid">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Closer</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Talk ratio</span>
        <span className="text-right text-[10px] uppercase tracking-wider text-rl-text-3">Win-rate</span>
        <span className="text-right text-[10px] uppercase tracking-wider text-rl-text-3">Sinais/call</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Tend.</span>
      </div>

      <ul>
        {items.map((closer) => {
          // sinais/call normalizado — verde só quando acima da média-de-esforço do time
          const spcHealthy = closer.signalsPerCall >= maxSpc * 0.5;
          return (
            <li
              key={closer.name}
              className="border-t border-rl-border-soft px-5 py-3"
            >
              <div className="grid grid-cols-[1fr_64px_auto_auto_auto] items-center gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rl-surface-2 text-[10px] font-medium text-rl-text-2">
                    {closer.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-rl-text">{closer.name}</div>
                    <div className="rl-readout text-[10px] text-rl-text-3">{closer.calls} calls</div>
                  </div>
                </div>

                {/* sparkline de talk-ratio, escala fixa compartilhada — anomalia salta */}
                <div className="h-6 w-full">
                  <Sparkline
                    data={closer.talkRatioTrend}
                    domain={domain}
                    tone={closer.outOfBand ? "risk" : "oxy"}
                    height={24}
                  />
                </div>

                <span className={`rl-readout text-right text-xs ${closer.winRate >= 50 ? "text-rl-oxy" : "text-rl-text-2"}`}>
                  {closer.winRate}%
                </span>
                {/* sinais/call: verde só acima do piso de eficácia, não cor-de-coluna fixa */}
                <span className={`rl-readout text-right text-sm ${spcHealthy && closer.signalsPerCall > 0 ? "text-rl-oxy" : "text-rl-text-2"}`}>
                  {closer.signalsPerCall.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <TrendGlyph trend={closer.trend} outOfBand={closer.outOfBand} />
              </div>

              {/* prescrição de coaching (diagnóstico → prescrição) com recibo */}
              <div className="mt-2 flex items-start gap-2 rounded-rl-control border-l-2 border-rl-risk/50 bg-rl-inset/40 px-2.5 py-1.5">
                <span className="rl-readout mt-px shrink-0 text-[9px] uppercase tracking-wide text-rl-risk">
                  treinar
                </span>
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-snug text-rl-text-2">
                  <span>{closer.prescription}</span>
                  <EvidenceChip
                    callId={closer.prescriptionCallId}
                    timestamp={closer.prescriptionTimestamp}
                    tone="risk"
                  />
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
