import type { CloserRanking } from "@/lib/mock/intelligence";

type TeamRankingProps = {
  items: CloserRanking[];
};

function talkRatioColor(ratio: number) {
  if (ratio >= 60) return "text-rl-risk";
  if (ratio <= 25) return "text-rl-prospect";
  return "text-rl-oxy";
}

function TrendGlyph({ trend }: { trend: CloserRanking["trend"] }) {
  if (trend === "up") {
    return (
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className="text-rl-oxy">
        <path d="M1 8.5L5 4.5L8 6.5L13 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className="text-rl-danger">
        <path d="M1 1.5L5 5.5L8 3.5L13 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className="text-rl-text-3">
      <path d="M1 5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function TeamRanking({ items }: TeamRankingProps) {
  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-surface-1">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Ranking do time</span>
        <span className="rl-readout text-[11px] text-rl-text-3">{items.length} closers</span>
      </div>

      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 sm:grid">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Closer</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Calls</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Talk ratio</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Sinais</span>
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Tend.</span>
      </div>

      <ul>
        {items.map((closer) => (
          <li
            key={closer.name}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-t border-rl-border-soft px-5 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rl-surface-2 text-[10px] font-medium text-rl-text-2">
                {closer.initials}
              </span>
              <span className="truncate text-sm text-rl-text">{closer.name}</span>
            </div>
            <span className="rl-readout text-sm text-rl-text-2">{closer.calls}</span>
            <span
              className={`rl-readout inline-flex w-14 items-center justify-center rounded-full border px-2 py-0.5 text-xs ${talkRatioColor(closer.talkRatio)} ${
                closer.talkRatio >= 60 ? "border-rl-risk/30 bg-rl-risk-dim" : "border-rl-oxy/25 bg-rl-oxy-dim"
              }`}
            >
              {closer.talkRatio}%
            </span>
            <span className="rl-readout text-sm text-rl-oxy">{closer.buyingSignals}</span>
            <TrendGlyph trend={closer.trend} />
          </li>
        ))}
      </ul>
    </div>
  );
}
