import type { TranscriptTurn } from "@/lib/mock/calls";

type SpeakerTurnProps = {
  turn: TranscriptTurn;
};

export function SpeakerTurn({ turn }: SpeakerTurnProps) {
  const isRep = turn.speaker === "rep";

  return (
    <div id={`t-${turn.timestamp}`} className="flex gap-3 py-2.5">
      <div
        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
          isRep ? "bg-rl-oxy" : "bg-rl-prospect"
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span
            className={`text-xs font-medium ${
              isRep ? "text-rl-oxy" : "text-rl-prospect"
            }`}
          >
            {turn.speakerName}
          </span>
          <span className="rl-readout text-[11px] text-rl-text-3">{turn.timestamp}</span>
        </div>
        <p className="text-sm leading-relaxed text-rl-text-2">{turn.text}</p>
      </div>
    </div>
  );
}
