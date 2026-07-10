import Link from "next/link";
import type { BuyingSignalItem } from "@/lib/mock/intelligence";

type BuyingSignalsProps = {
  items: BuyingSignalItem[];
};

export function BuyingSignals({ items }: BuyingSignalsProps) {
  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-surface-1">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Sinais de compra recentes</span>
        <span className="rl-readout text-[11px] text-rl-text-3">{items.length} destaques</span>
      </div>

      <ul>
        {items.map((item, i) => (
          <li key={`${item.callId}-${i}`} className="border-b border-rl-border-soft last:border-b-0">
            <Link
              href={`/calls/${item.callId}`}
              className="block px-5 py-3.5 transition-colors hover:bg-rl-surface-2"
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-rl-text">{item.account}</span>
                <span className="rl-readout inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rl-oxy/30 bg-rl-oxy-dim px-2 py-0.5 text-[10px] uppercase tracking-wide text-rl-oxy">
                  <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" />
                  sinal de compra
                </span>
              </div>
              <p className="text-xs text-rl-text-2">&ldquo;{item.excerpt}&rdquo;</p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-rl-text-3">
                <span>{item.closer}</span>
                <span className="text-rl-text-muted">·</span>
                <span className="rl-readout">{item.when}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
