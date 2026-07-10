import type { WinLossMetric } from "@/lib/mock/coaching";
import { Readout } from "@/components/Readout";

type WinLossAnalysisProps = {
  metrics: WinLossMetric[];
  insight: string;
  wonCount: number;
  lostCount: number;
};

/**
 * Ganhos × Perdidos — barras espelhadas (ganho verde à direita, perdido vermelho à
 * esquerda) por vital. A leitura em texto é a inteligência mais forte: por que se ganha,
 * por que se perde.
 */
export function WinLossAnalysis({ metrics, insight, wonCount, lostCount }: WinLossAnalysisProps) {
  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Ganhos × Perdidos</span>
        <span className="flex items-center gap-3 text-[11px]">
          <span className="rl-readout flex items-center gap-1.5 text-rl-oxy">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" />
            {wonCount} ganhas
          </span>
          <span className="rl-readout flex items-center gap-1.5 text-rl-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-danger" />
            {lostCount} perdidas
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {metrics.map((m) => {
          // escala por-linha (não global) — cada vital tem sua própria unidade/grandeza,
          // uma escala compartilhada entre linhas esmagaria as de menor magnitude (ex.: nº objeções vs. %)
          const rowMax = Math.max(m.wonValue, m.lostValue, 1);
          const wonPct = (m.wonValue / rowMax) * 100;
          const lostPct = (m.lostValue / rowMax) * 100;
          return (
            <div key={m.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs text-rl-text-2">
                <span>{m.label}</span>
                {m.lowerIsBetter ? (
                  <span className="text-[10px] uppercase tracking-wide text-rl-text-3">menor é melhor</span>
                ) : null}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex justify-end">
                  <div className="h-2.5 w-full max-w-[220px] overflow-hidden rounded-full bg-rl-inset">
                    <div
                      className="ml-auto h-full rounded-full bg-rl-danger"
                      style={{ width: `${lostPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap">
                  <Readout
                    value={m.lostValue}
                    unit={m.unit}
                    tone="danger"
                    className="text-sm"
                    decimals={m.decimals}
                    animate={false}
                  />
                  <span className="text-rl-text-muted">·</span>
                  <Readout
                    value={m.wonValue}
                    unit={m.unit}
                    tone="oxy"
                    className="text-sm"
                    decimals={m.decimals}
                    animate={false}
                  />
                </div>
                <div className="flex justify-start">
                  <div className="h-2.5 w-full max-w-[220px] overflow-hidden rounded-full bg-rl-inset">
                    <div className="h-full rounded-full bg-rl-oxy" style={{ width: `${wonPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <p className="mt-1 rounded-rl-control border border-rl-oxy/20 bg-rl-oxy-dim/20 px-4 py-3 text-sm leading-relaxed text-rl-text-2">
          <span className="rl-readout mr-1.5 text-[10px] uppercase tracking-wide text-rl-oxy">Leitura</span>
          {insight}
        </p>
      </div>
    </div>
  );
}
