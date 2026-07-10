import Link from "next/link";
import type { SinceYesterdayItem } from "@/lib/mock/intelligence";

type LeaderBriefingProps = {
  headline: string;
  items: SinceYesterdayItem[];
  hasBaseline?: boolean;
};

const dot: Record<SinceYesterdayItem["tone"], string> = {
  oxy: "bg-rl-oxy",
  risk: "bg-rl-risk",
  danger: "bg-rl-danger",
  neutral: "bg-rl-text-3",
};

const text: Record<SinceYesterdayItem["tone"], string> = {
  oxy: "text-rl-oxy",
  risk: "text-rl-risk",
  danger: "text-rl-danger",
  neutral: "text-rl-text-2",
};

function Arrow({ direction, tone }: { direction: "up" | "down"; tone: SinceYesterdayItem["tone"] }) {
  return (
    <span aria-hidden className={`text-[9px] leading-none ${text[tone]}`}>
      {direction === "up" ? "▲" : "▼"}
    </span>
  );
}

/**
 * Briefing editorial do líder: manchete em Anton (gerada da IA) + faixa densa
 * "desde ontem". Regra: nenhuma frase sem número atrás; itens linkam pra evidência.
 */
export function LeaderBriefing({ headline, items, hasBaseline = true }: LeaderBriefingProps) {
  return (
    <section className="rl-enter">
      <h2 className="rl-display max-w-4xl text-2xl leading-[1.05] text-rl-text sm:text-[28px]">
        {headline}
      </h2>

      {hasBaseline ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
          <span className="rl-readout text-[10px] uppercase tracking-wider text-rl-text-3">
            desde ontem
          </span>
          {items.map((item, i) => {
            const inner = (
              <span className={`inline-flex items-center gap-1.5 ${text[item.tone]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dot[item.tone]}`} />
                {item.direction ? <Arrow direction={item.direction} tone={item.tone} /> : null}
                <span className="rl-readout text-[12px]">{item.label}</span>
              </span>
            );
            return (
              <span key={i} className="flex items-center gap-4">
                {i > 0 ? <span className="text-rl-text-muted">·</span> : null}
                {item.callId ? (
                  <Link
                    href={`/calls/${item.callId}`}
                    className="rl-press rounded transition-opacity hover:opacity-80"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-rl-text-3">
          Sem base de comparação ainda — o briefing aparece a partir da segunda semana de calls.
        </p>
      )}
    </section>
  );
}
