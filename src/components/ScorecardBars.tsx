import type { ScorecardCriterion } from "@/lib/mock/coaching";
import { Readout } from "@/components/Readout";

type ScorecardBarsProps = {
  criteria: ScorecardCriterion[];
};

/** Barras por critério de coaching — cor por threshold (faixa-alvo), nunca por ranking. */
export function ScorecardBars({ criteria }: ScorecardBarsProps) {
  return (
    <ul className="flex flex-col gap-3.5">
      {criteria.map((c) => {
        const healthy = c.value >= c.band[0] && c.value <= c.band[1];
        const tone = healthy ? "oxy" : "risk";
        return (
          <li key={c.key}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm text-rl-text-2">{c.label}</span>
              <Readout value={c.value} tone={tone} className="text-sm" />
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-rl-inset">
              {/* faixa saudável de fundo */}
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: `${c.band[0]}%`,
                  width: `${c.band[1] - c.band[0]}%`,
                  background: "var(--color-rl-oxy-band)",
                }}
              />
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${healthy ? "bg-rl-oxy" : "bg-rl-risk"}`}
                style={{ width: `${Math.min(100, c.value)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
