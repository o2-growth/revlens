import { EvidenceChip } from "@/components/EvidenceChip";
import type { CloserCoaching } from "@/lib/mock/coaching";

type AutocoachNoteProps = {
  closer: CloserCoaching;
};

function AutocoachIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M7.5 1.5v2M7.5 11.5v2M1.5 7.5h2M11.5 7.5h2M3.5 3.5l1.4 1.4M10.1 10.1l1.4 1.4M11.5 3.5l-1.4 1.4M4.9 10.1l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="7.5" r="2.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** Nota de autocoach (IA) + os dois momentos com maior peso: melhor e a maior falha. */
export function AutocoachNote({ closer }: AutocoachNoteProps) {
  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1">
      <div className="flex items-center gap-2 border-b border-rl-border px-5 py-3.5">
        <span className="text-rl-oxy">
          <AutocoachIcon />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Autocoach</span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <p className="text-sm leading-relaxed text-rl-text-2">{closer.autocoachNote}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-rl-control border border-rl-oxy/20 bg-rl-oxy-dim/30 p-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="rl-readout text-[10px] uppercase tracking-wide text-rl-oxy">
                Melhor momento
              </span>
              <EvidenceChip
                callId={closer.bestMoment.callId}
                timestamp={closer.bestMoment.atTimestamp}
                tone="oxy"
              />
            </div>
            <p className="text-sm leading-relaxed text-rl-text">
              &ldquo;{closer.bestMoment.quote}&rdquo;
            </p>
            <p className="mt-2 text-xs leading-relaxed text-rl-text-3">{closer.bestMoment.note}</p>
            <p className="mt-2 text-[11px] text-rl-text-3">{closer.bestMoment.account}</p>
          </div>

          <div className="rounded-rl-control border border-rl-risk/20 bg-rl-risk-dim/30 p-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="rl-readout text-[10px] uppercase tracking-wide text-rl-risk">
                Maior falha
              </span>
              <EvidenceChip
                callId={closer.worstMoment.callId}
                timestamp={closer.worstMoment.atTimestamp}
                tone="risk"
              />
            </div>
            <p className="text-sm leading-relaxed text-rl-text">
              &ldquo;{closer.worstMoment.quote}&rdquo;
            </p>
            <p className="mt-2 text-xs leading-relaxed text-rl-text-3">{closer.worstMoment.note}</p>
            <p className="mt-2 text-[11px] text-rl-text-3">{closer.worstMoment.account}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-rl-text-3">
            Objeções em que mais perde
          </div>
          <ul className="flex flex-wrap gap-2">
            {closer.objectionsLostMost.map((o) => (
              <li
                key={o.objection}
                className="rl-readout inline-flex items-center gap-1.5 rounded-full border border-rl-risk/25 bg-rl-risk-dim px-2.5 py-1 text-[11px] text-rl-risk"
              >
                {o.objection}
                <span className="text-rl-risk/70">×{o.lossCount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
