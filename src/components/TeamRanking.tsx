import type { CloserRanking } from "@/lib/mock/intelligence";
import { Sparkline } from "@/components/Sparkline";

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

  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-canvas">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Scorecard de coaching
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">{items.length} closers</span>
      </div>

      <div className="hidden grid-cols-[1fr_72px_auto_auto_auto] items-center gap-4 px-5 py-2.5 sm:grid">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Closer</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Talk ratio</span>
        <span className="text-right text-[10px] uppercase tracking-wider text-rl-text-3">vs. time</span>
        <span className="text-right text-[10px] uppercase tracking-wider text-rl-text-3">Sinais</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Tend.</span>
      </div>

      <ul>
        {items.map((closer) => {
          const delta = closer.vsTeamDelta;
          const deltaTone = closer.outOfBand ? "text-rl-risk" : delta <= 0 ? "text-rl-oxy" : "text-rl-text-2";
          return (
            <li
              key={closer.name}
              className="grid grid-cols-[1fr_72px_auto_auto_auto] items-center gap-4 border-t border-rl-border-soft px-5 py-3"
            >
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

              <span className={`rl-readout text-right text-xs ${deltaTone}`}>
                {delta > 0 ? "+" : ""}
                {delta}pp
              </span>
              {/* verde só quando há sinal presente — gateado, não cor-de-coluna fixa
                  (mesma regra do VitalsReadout: buyingSignalsCount > 0 ? oxy : text-2) */}
              <span className={`rl-readout text-right text-sm ${closer.buyingSignals > 0 ? "text-rl-oxy" : "text-rl-text-2"}`}>
                {closer.buyingSignals}
              </span>
              <TrendGlyph trend={closer.trend} outOfBand={closer.outOfBand} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
