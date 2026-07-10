import Link from "next/link";
import type { AttentionItem } from "@/lib/mock/intelligence";

type AttentionListProps = {
  items: AttentionItem[];
};

function SeverityChip({ severity }: { severity: AttentionItem["severity"] }) {
  const isCritica = severity === "critica";
  return (
    <span
      className={`rl-readout inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
        isCritica
          ? "border-rl-danger/30 bg-rl-danger/10 text-rl-danger"
          : "border-rl-risk/30 bg-rl-risk-dim text-rl-risk"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isCritica ? "bg-rl-danger" : "bg-rl-risk"}`} />
      {isCritica ? "crítico" : "risco"}
    </span>
  );
}

export function AttentionList({ items }: AttentionListProps) {
  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-surface-1">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Precisa de atenção</span>
        <span className="rl-readout text-[11px] text-rl-text-3">{items.length} deals</span>
      </div>

      <ul>
        {items.map((item) => (
          <li key={item.callId} className="border-b border-rl-border last:border-b-0">
            <Link
              href={`/calls/${item.callId}`}
              className="group flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-rl-surface-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-rl-text">{item.account}</span>
                  <SeverityChip severity={item.severity} />
                </div>
                <div className="mt-1 truncate text-xs text-rl-text-2">{item.reason}</div>
                <div className="mt-1 text-[11px] text-rl-text-3">closer: {item.closer}</div>
              </div>
              <span className="mt-0.5 flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-rl-text-3 transition-colors group-hover:text-rl-oxy">
                ver call
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                  <path d="M2 5.5h7M6 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
