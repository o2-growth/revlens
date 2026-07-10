import type { OperationMetric } from "@/lib/mock/intelligence";

type OperationVitalsProps = {
  metrics: OperationMetric[];
};

function DeltaArrow({ direction }: { direction: "up" | "down" }) {
  return direction === "up" ? (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
      <path d="M4.5 7.5V1.5M1.5 4.2L4.5 1.2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
      <path d="M4.5 1.5V7.5M1.5 4.8L4.5 7.8l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function toneColor(tone: OperationMetric["tone"]) {
  if (tone === "good") return "text-rl-oxy";
  if (tone === "bad") return "text-rl-risk";
  return "text-rl-text-3";
}

export function OperationVitals({ metrics }: OperationVitalsProps) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-rl-card border border-rl-border bg-rl-border sm:grid-cols-5">
      {metrics.map((m) => (
        <div key={m.key} className="bg-rl-surface-1 px-4 py-4">
          <div className="text-[10px] uppercase tracking-wider text-rl-text-3">{m.label}</div>
          <div className={`rl-readout mt-1.5 text-2xl font-medium ${m.colorClass}`}>{m.value}</div>
          <div className={`rl-readout mt-1.5 flex items-center gap-1 text-[11px] ${toneColor(m.tone)}`}>
            <DeltaArrow direction={m.direction} />
            {m.deltaLabel}
            <span className="text-rl-text-muted">vs. sem. passada</span>
          </div>
        </div>
      ))}
    </div>
  );
}
