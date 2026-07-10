import type { Call } from "@/lib/mock/calls";

type VitalsReadoutProps = {
  call: Call;
};

type Vital = {
  label: string;
  value: string;
  colorClass: string;
};

function talkRatioColor(ratio: number) {
  // saudável perto de 40-50% pro rep; acima de 60% = rep falando demais (âmbar)
  if (ratio >= 60) return "text-rl-risk";
  if (ratio <= 25) return "text-rl-prospect";
  return "text-rl-oxy";
}

function sentimentColor(sentiment: Call["sentiment"]) {
  if (sentiment === "positivo") return "text-rl-oxy";
  if (sentiment === "negativo") return "text-rl-danger";
  return "text-rl-text-2";
}

function objectionsColor(count: number) {
  if (count === 0) return "text-rl-oxy";
  if (count >= 3) return "text-rl-danger";
  return "text-rl-risk";
}

function signalsColor(count: number) {
  return count > 0 ? "text-rl-oxy" : "text-rl-text-2";
}

export function VitalsReadout({ call }: VitalsReadoutProps) {
  const vitals: Vital[] = [
    {
      label: "Talk ratio",
      value: `${call.talkRatioRep}%`,
      colorClass: talkRatioColor(call.talkRatioRep),
    },
    {
      label: "Sentimento",
      value: call.sentiment,
      colorClass: sentimentColor(call.sentiment),
    },
    {
      label: "Objeções",
      value: String(call.objectionsCount),
      colorClass: objectionsColor(call.objectionsCount),
    },
    {
      label: "Sinais de compra",
      value: String(call.buyingSignalsCount),
      colorClass: signalsColor(call.buyingSignalsCount),
    },
    {
      label: "Duração",
      value: call.durationLabel,
      colorClass: "text-rl-text",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-rl-card border border-rl-border bg-rl-border sm:grid-cols-5">
      {vitals.map((vital) => (
        <div key={vital.label} className="bg-rl-surface-1 px-4 py-3.5">
          <div className="text-[10px] uppercase tracking-wider text-rl-text-3">
            {vital.label}
          </div>
          <div className={`rl-readout mt-1 text-xl font-medium ${vital.colorClass}`}>
            {vital.value}
          </div>
        </div>
      ))}
    </div>
  );
}
