import Link from "next/link";
import type { InterventionItem } from "@/lib/mock/intelligence";
import { EvidenceChip } from "@/components/EvidenceChip";

type InterventionQueueProps = {
  items: InterventionItem[];
};

function formatBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v}`;
}

export function InterventionQueue({ items }: InterventionQueueProps) {
  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Fila de intervenção
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">
          triagem · {items.length} deals
        </span>
      </div>

      <ul>
        {items.map((item, i) => {
          const isCritica = item.severity === "critica";
          return (
            <li
              key={item.callId}
              className="rl-enter relative border-b border-rl-border-soft last:border-b-0"
              style={{ ["--i" as string]: i }}
            >
              {/* rail de severidade — ping uma vez no crítico */}
              <span
                className={`absolute inset-y-0 left-0 w-[2px] ${
                  isCritica ? "bg-rl-danger rl-ping" : "bg-rl-risk"
                }`}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-4 px-5 py-3.5 pl-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <Link
                      href={`/calls/${item.callId}`}
                      className="truncate text-sm font-medium text-rl-text rl-t-hover transition-colors hover:text-rl-oxy"
                    >
                      {item.account}
                    </Link>
                    <span
                      className={`rl-readout text-[10px] uppercase tracking-wide ${
                        isCritica ? "text-rl-danger" : "text-rl-risk"
                      }`}
                    >
                      {item.reasonType}
                      {item.reasonDetail ? (
                        <span className="ml-1 text-rl-text-3">{item.reasonDetail}</span>
                      ) : null}
                    </span>
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-rl-text-2">
                    <span className="min-w-0">{item.evidence}</span>
                    {item.evidenceTimestamp ? (
                      <EvidenceChip
                        callId={item.callId}
                        timestamp={item.evidenceTimestamp}
                        tone={isCritica ? "danger" : "risk"}
                      />
                    ) : null}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-rl-text-3">
                    <span>{item.closer}</span>
                    <span className="text-rl-text-muted">·</span>
                    <span className="rl-readout">{item.ageLabel}</span>
                    <span className="text-rl-text-muted">·</span>
                    <span className="rl-readout text-rl-text-2">{formatBRL(item.dealValue)}</span>
                  </div>
                </div>

                {/* ação recomendada de um clique */}
                <Link
                  href={`/calls/${item.callId}`}
                  className="rl-press rl-cta-glow mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-rl-control border border-rl-oxy/30 bg-rl-oxy-dim px-2.5 py-1.5 text-[11px] font-medium text-rl-oxy rl-t-hover transition-colors hover:border-rl-oxy/60 hover:bg-rl-oxy/15"
                >
                  {item.recommendedAction}
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none" aria-hidden>
                    <path d="M2 5.5h7M6 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
