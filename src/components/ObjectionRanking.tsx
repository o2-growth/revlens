import type { ObjectionRankingItem } from "@/lib/mock/intelligence";

type ObjectionRankingProps = {
  items: ObjectionRankingItem[];
};

export function ObjectionRanking({ items }: ObjectionRankingProps) {
  const maxPct = Math.max(...items.map((i) => i.pctOfCalls));

  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Objeções da semana</span>
        <span className="rl-readout text-[11px] text-rl-text-3">{items.length} temas</span>
      </div>

      <ul className="px-5 py-4">
        {items.map((item, i) => (
          <li key={item.text} className={`py-2.5 ${i !== items.length - 1 ? "border-b border-rl-border-soft" : ""}`}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="truncate text-sm text-rl-text-2">{item.text}</span>
              <span className="rl-readout shrink-0 text-xs text-rl-text-3">
                <span className="text-rl-text">{item.count}</span> calls · {item.pctOfCalls}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-rl-inset">
              <div
                className="h-full rounded-full bg-rl-risk"
                style={{ width: `${maxPct > 0 ? (item.pctOfCalls / maxPct) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
