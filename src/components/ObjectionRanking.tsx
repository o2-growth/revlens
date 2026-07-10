import type { ObjectionRankingItem } from "@/lib/mock/intelligence";
import { EvidenceChip } from "@/components/EvidenceChip";

type ObjectionRankingProps = {
  items: ObjectionRankingItem[];
  baseline: number;
};

/**
 * Objeções da semana — amarradas a DESFECHO, não só frequência. Cada objeção mostra
 * o win-rate quando ela está presente (barra pintada pela distância do baseline) e
 * um recibo pra melhor call onde foi contornada. Frequência + impacto no fechamento.
 */
export function ObjectionRanking({ items, baseline }: ObjectionRankingProps) {
  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-canvas">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Objeções → win-rate
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">baseline {baseline}%</span>
      </div>

      <ul className="px-5 py-4">
        {items.map((item, i) => {
          // win-rate saudável (acima do baseline) = verde; abaixo = âmbar/vermelho
          const hurts = item.deltaVsBaseline < 0;
          const barColor = !hurts
            ? "bg-rl-oxy"
            : item.winRateWhenPresent <= 25
              ? "bg-rl-danger"
              : "bg-rl-risk";
          const deltaColor = !hurts ? "text-rl-oxy" : item.winRateWhenPresent <= 25 ? "text-rl-danger" : "text-rl-risk";
          return (
            <li
              key={item.text}
              className={`py-2.5 ${i !== items.length - 1 ? "border-b border-rl-border-soft" : ""}`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="truncate text-sm text-rl-text-2">{item.text}</span>
                <span className="rl-readout shrink-0 text-xs text-rl-text-3">
                  <span className="text-rl-text-2">{item.count}</span> calls · {item.pctOfCalls}%
                </span>
              </div>
              {/* barra = win-rate quando presente (impacto no fechamento, não só frequência) */}
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rl-inset">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${item.winRateWhenPresent}%` }}
                  />
                </div>
                <span className={`rl-readout shrink-0 text-[11px] ${deltaColor}`}>
                  {item.winRateWhenPresent}%
                  <span className="ml-1 text-rl-text-3">
                    ({item.deltaVsBaseline >= 0 ? "+" : ""}
                    {item.deltaVsBaseline}pp)
                  </span>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-rl-text-3">
                <span>melhor contorno</span>
                <EvidenceChip
                  callId={item.bestHandledCallId}
                  timestamp={item.bestHandledTimestamp}
                  tone="oxy"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
