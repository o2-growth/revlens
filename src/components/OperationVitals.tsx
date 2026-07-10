import type { OperationMetric } from "@/lib/mock/intelligence";
import { Readout } from "@/components/Readout";
import { Sparkline } from "@/components/Sparkline";
import { Delta } from "@/components/Delta";

type OperationVitalsProps = {
  metrics: OperationMetric[];
};

const toneMap = {
  oxy: "oxy",
  risk: "risk",
  danger: "danger",
  muted: "text",
} as const;

const sparkTone = {
  oxy: "oxy",
  risk: "risk",
  danger: "danger",
  muted: "text-3",
} as const;

export function OperationVitals({ metrics }: OperationVitalsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {metrics.map((m, i) => {
        const dMin = Math.min(...m.history);
        const dMax = Math.max(...m.history);
        return (
          <div
            key={m.key}
            className="rl-raised rl-enter flex flex-col rounded-rl-card bg-rl-surface-1 px-4 pt-4 pb-3"
            style={{ ["--i" as string]: i }}
          >
            <div className="text-[10px] uppercase tracking-wider text-rl-text-3">{m.label}</div>
            <div className="mt-1.5 text-2xl">
              <Readout
                value={m.numericValue}
                unit={m.unit}
                tone={toneMap[m.toneColor]}
                hero
              />
            </div>
            <Delta
              className="mt-1.5"
              label={m.deltaLabel}
              direction={m.direction}
              tone={m.tone}
              was={m.prevValueLabel}
            />
            <div className="mt-2.5 h-5">
              <Sparkline
                data={m.history}
                domain={[dMin, dMax]}
                tone={sparkTone[m.toneColor]}
                tail
                height={20}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
