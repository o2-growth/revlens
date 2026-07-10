import Link from "next/link";
import type { Call } from "@/lib/mock/calls";
import { Sparkline } from "@/components/Sparkline";
import { SignalChip } from "@/components/SignalChip";
import { OutcomeControl } from "@/components/OutcomeControl";

const OUTCOME_LABEL: Record<Call["outcome"], string> = {
  ganho: "ganho",
  perdido: "perdido",
  aberto: "em aberto",
};

type CallLogRowProps = {
  call: Call;
  index?: number;
};

// domínio fixo compartilhado por todas as linhas — a anomalia salta pela silhueta
const TALK_DOMAIN: [number, number] = [0, 100];

export function CallLogRow({ call, index = 0 }: CallLogRowProps) {
  const isProcessing = call.status === "processando";
  const isRisk = call.signal === "risco";

  return (
    <Link
      href={`/calls/${call.id}`}
      data-callrow=""
      data-idx={index}
      className="group relative grid grid-cols-[1fr_auto_auto_96px_auto_auto] items-center gap-4 border-b border-rl-border px-4 py-3.5 outline-none transition-colors hover:bg-rl-surface-1 focus-visible:bg-rl-surface-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_96px_auto_auto]"
    >
      {/* rail: severidade sempre visível (risco); foco/hover acende oxy */}
      <span
        className={`absolute inset-y-0 left-0 w-[2px] origin-center ${
          isRisk ? "scale-y-100 bg-rl-risk" : "scale-y-0 bg-rl-oxy"
        } transition-transform duration-150 group-hover:scale-y-100 group-focus-visible:scale-y-100 group-focus-visible:bg-rl-oxy`}
        aria-hidden
      />

      <div className="min-w-0 pl-1.5">
        <div className="truncate text-sm font-medium text-rl-text">{call.account}</div>
        <div className="truncate text-xs text-rl-text-3">{call.prospectName}</div>
      </div>

      <div className="hidden min-w-0 sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rl-surface-2 text-[9px] font-medium text-rl-text-2">
            {call.closerInitials}
          </span>
          <span className="truncate text-xs text-rl-text-2">{call.closer}</span>
        </div>
      </div>

      <div className="rl-readout flex items-center gap-2 whitespace-nowrap text-xs text-rl-text-3">
        <span>{call.dateLabel}</span>
        {!isProcessing ? (
          <span className={call.talkRatioRep >= 60 ? "text-rl-risk" : "text-rl-text-2"}>
            {call.talkRatioRep}
            <span className="text-[0.7em] text-rl-text-3">% fala</span>
          </span>
        ) : null}
      </div>

      {/* mini-pulse de escala FIXA (talk-ratio por minuto) — comparável entre linhas */}
      <div
        className="hidden h-6 opacity-85 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
        style={{ viewTransitionName: `pulse-${call.id}` }}
      >
        {isProcessing || !call.talkRatioByMinute ? (
          <div className="relative h-full w-full">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rl-text-muted/40" />
            <div className="rl-blip absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-rl-oxy" style={{ left: "40%" }} />
          </div>
        ) : (
          <Sparkline
            data={call.talkRatioByMinute}
            domain={TALK_DOMAIN}
            tone={call.talkRatioRep >= 60 ? "risk" : "oxy"}
            height={24}
          />
        )}
      </div>

      <div className="flex flex-col items-start gap-1">
        {isProcessing ? (
          <span className="rl-readout inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-rl-text-3">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy rl-blip" />
            processando
          </span>
        ) : (
          <>
            <SignalChip signal={call.signal} />
            {call.outcome !== "aberto" ? (
              <span
                className={`rl-readout inline-flex items-center gap-1 text-[10px] uppercase tracking-wide ${
                  call.outcome === "ganho" ? "text-rl-oxy" : "text-rl-danger"
                }`}
              >
                <span
                  className={`h-1 w-1 rounded-full ${call.outcome === "ganho" ? "bg-rl-oxy" : "bg-rl-danger"}`}
                />
                {OUTCOME_LABEL[call.outcome]}
              </span>
            ) : null}
          </>
        )}
      </div>

      {/* ações reveladas em hover/foco + atribuição rápida de resultado + chevron */}
      <div className="flex items-center gap-3">
        {!isProcessing ? (
          <div className="hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
            <OutcomeControl
              account={call.account}
              initialOutcome={call.outcome}
              dealValue={call.dealValue}
              variant="compact"
            />
          </div>
        ) : null}
        <span className="rl-readout hidden text-[11px] text-rl-oxy opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 sm:inline">
          Abrir
        </span>
        <span className="text-rl-text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-rl-text-2 group-focus-visible:translate-x-0.5 group-focus-visible:text-rl-oxy">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
