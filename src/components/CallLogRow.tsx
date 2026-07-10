import Link from "next/link";
import type { Call } from "@/lib/mock/calls";
import { PulseWave } from "@/components/PulseWave";
import { SignalChip } from "@/components/SignalChip";

type CallLogRowProps = {
  call: Call;
};

export function CallLogRow({ call }: CallLogRowProps) {
  const isProcessing = call.status === "processando";

  return (
    <Link
      href={`/calls/${call.id}`}
      className="group grid grid-cols-[1fr_auto_auto_96px_auto_auto] items-center gap-4 border-b border-rl-border px-4 py-3.5 transition-colors hover:bg-rl-surface-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_96px_auto_auto]"
    >
      <div className="min-w-0">
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

      <div className="rl-readout whitespace-nowrap text-xs text-rl-text-3">
        {call.dateLabel}
        <span className="mx-1.5 text-rl-text-muted">·</span>
        {call.durationLabel}
      </div>

      <div className="hidden h-6 sm:block">
        <PulseWave segments={call.pulse} variant="sparkline" />
      </div>

      <div>
        {isProcessing ? (
          <span className="rl-readout inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-rl-text-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rl-text-3" />
            processando
          </span>
        ) : (
          <SignalChip signal={call.signal} />
        )}
      </div>

      <div className="text-rl-text-muted transition-colors group-hover:text-rl-text-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
