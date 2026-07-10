import type { CompetitorPressure as CompetitorPressureItem } from "@/lib/mock/intelligence";
import { formatBRLCompact } from "@/lib/mock/deals";
import { EvidenceChip } from "@/components/EvidenceChip";

type CompetitorPressureProps = {
  items: CompetitorPressureItem[];
  totalDeals: number;
  totalValue: number;
};

const leanConfig: Record<
  CompetitorPressureItem["lean"],
  { label: string; tone: string; dot: string }
> = {
  ganhando: { label: "ganhando", tone: "text-rl-oxy", dot: "bg-rl-oxy" },
  disputado: { label: "disputado", tone: "text-rl-risk", dot: "bg-rl-risk" },
  perdendo: { label: "perdendo", tone: "text-rl-danger", dot: "bg-rl-danger" },
};

/**
 * Pressão competitiva — rollup das menções a concorrentes nas calls viram
 * inteligência: contra quem, quantos deals, R$ em jogo, ganhando/perdendo e o eixo
 * de perda. Cada linha linka à call (recibo).
 */
export function CompetitorPressure({ items, totalDeals, totalValue }: CompetitorPressureProps) {
  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-canvas">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Pressão competitiva
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">
          {totalDeals} deals · {formatBRLCompact(totalValue)} em jogo
        </span>
      </div>

      <ul>
        {items.map((c, i) => {
          const lean = leanConfig[c.lean];
          const chipTone = c.lean === "perdendo" ? "danger" : c.lean === "ganhando" ? "oxy" : "risk";
          return (
            <li
              key={c.competitor}
              className="rl-enter border-t border-rl-border-soft px-5 py-3 first:border-t-0"
              style={{ ["--i" as string]: i }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-rl-text">{c.competitor}</span>
                  <span className="rl-readout rounded-[4px] border border-rl-border bg-rl-inset/50 px-1.5 py-px text-[9px] uppercase tracking-wide text-rl-text-3">
                    {c.kind}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] ${lean.tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${lean.dot}`} />
                  <span className="rl-readout uppercase tracking-wide">{lean.label}</span>
                </span>
              </div>

              <p className="mt-1.5 text-xs text-rl-text-2">{c.detail}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-rl-text-3">
                <span className="rl-readout text-rl-text-2">{formatBRLCompact(c.valueAtStake)}</span>
                <span className="text-rl-text-muted">·</span>
                <span>
                  eixo: <span className="text-rl-text-2">{c.lossAxis}</span>
                </span>
                <span className="text-rl-text-muted">·</span>
                <EvidenceChip callId={c.callId} timestamp={c.atTimestamp} tone={chipTone} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
