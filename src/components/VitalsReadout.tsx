import type { Call } from "@/lib/mock/calls";
import { Readout } from "@/components/Readout";
import { TargetBand } from "@/components/TargetBand";
import { EvidenceChip } from "@/components/EvidenceChip";

type VitalsReadoutProps = {
  call: Call;
};

type Tone = "oxy" | "risk" | "danger" | "prospect" | "text" | "text-2" | "text-3";

function talkRatioTone(ratio: number): Tone {
  if (ratio >= 60) return "risk";
  if (ratio <= 25) return "prospect";
  return "oxy";
}
function sentimentTone(s: Call["sentiment"]): Tone {
  if (s === "positivo") return "oxy";
  if (s === "negativo") return "danger";
  return "text-2";
}
function objectionsTone(count: number): Tone {
  if (count === 0) return "oxy";
  if (count >= 3) return "danger";
  return "risk";
}
function monologueTone(sec: number): Tone {
  return sec > 150 ? "risk" : "oxy";
}
function questionsTone(qph: number): Tone {
  return qph < 8 ? "risk" : "oxy";
}

const toneText: Record<Tone, string> = {
  oxy: "text-rl-oxy",
  risk: "text-rl-risk",
  danger: "text-rl-danger",
  prospect: "text-rl-prospect",
  text: "text-rl-text",
  "text-2": "text-rl-text-2",
  "text-3": "text-rl-text-3",
};

function fmtMonologue(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Cell({
  label,
  children,
  band,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  band?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rl-raised flex flex-col rounded-rl-card bg-rl-surface-1 px-4 py-3.5">
      <div className="text-[10px] uppercase tracking-wider text-rl-text-3">{label}</div>
      <div className="mt-1 flex items-baseline gap-2 text-xl font-medium">{children}</div>
      {band ? <div className="mt-2.5">{band}</div> : null}
      {hint ? <div className="mt-2">{hint}</div> : null}
    </div>
  );
}

export function VitalsReadout({ call }: VitalsReadoutProps) {
  // recibo do sentimento: sinal (positivo) ou objeção (negativo/neutro)
  const sentimentTs =
    call.sentiment === "positivo"
      ? call.buyingSignalDetails?.[0]?.atTimestamp
      : call.objections?.[0]?.atTimestamp ?? call.buyingSignalDetails?.[0]?.atTimestamp;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      <Cell
        label="Talk ratio"
        band={<TargetBand value={call.talkRatioRep} band={[40, 55]} scale={[0, 100]} />}
      >
        <Readout value={call.talkRatioRep} unit="%" tone={talkRatioTone(call.talkRatioRep)} hero />
      </Cell>

      <Cell
        label="Sentimento"
        hint={
          sentimentTs ? (
            <EvidenceChip callId={call.id} timestamp={sentimentTs} tone={sentimentTone(call.sentiment) === "danger" ? "danger" : "oxy"} />
          ) : null
        }
      >
        <span className={`rl-readout-hero ${toneText[sentimentTone(call.sentiment)]}`}>
          {call.sentiment}
        </span>
      </Cell>

      <Cell label="Objeções">
        <Readout value={call.objectionsCount} tone={objectionsTone(call.objectionsCount)} hero />
      </Cell>

      <Cell label="Sinais de compra">
        <Readout value={call.buyingSignalsCount} tone={call.buyingSignalsCount > 0 ? "oxy" : "text-2"} hero />
      </Cell>

      <Cell label="Duração">
        <span className="rl-readout-hero text-rl-text">{call.durationLabel}</span>
      </Cell>

      <Cell
        label="Maior monólogo"
        band={<TargetBand value={call.longestMonologueSec} band={[0, 150]} scale={[0, 300]} />}
      >
        <span className={`rl-readout-hero ${toneText[monologueTone(call.longestMonologueSec)]}`}>
          {fmtMonologue(call.longestMonologueSec)}
        </span>
      </Cell>

      <Cell
        label="Perguntas/hora"
        band={<TargetBand value={call.questionsPerHour} band={[8, 30]} scale={[0, 30]} />}
      >
        <Readout value={call.questionsPerHour} tone={questionsTone(call.questionsPerHour)} hero />
      </Cell>
    </div>
  );
}
