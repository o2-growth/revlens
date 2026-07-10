import { Sparkline } from "@/components/Sparkline";
import { Readout } from "@/components/Readout";
import { coachingVitalsDomain, type CloserCoaching } from "@/lib/mock/coaching";

type CoachingVitalsTrendProps = {
  closer: CloserCoaching;
};

type SparkTone = "oxy" | "risk";

function fmtMonologue(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Sparklines dos vitais de coaching — escala fixa comparável entre closers e entre telas. */
export function CoachingVitalsTrend({ closer }: CoachingVitalsTrendProps) {
  const lastTalk = closer.talkRatioTrend[closer.talkRatioTrend.length - 1];
  const lastMono = closer.longestMonologueTrend[closer.longestMonologueTrend.length - 1];
  const lastQph = closer.questionsPerHourTrend[closer.questionsPerHourTrend.length - 1];

  const talkTone: SparkTone = lastTalk >= 60 ? "risk" : "oxy";
  const monoTone: SparkTone = lastMono > 150 ? "risk" : "oxy";
  const qphTone: SparkTone = lastQph < 8 ? "risk" : "oxy";

  const vitals: {
    key: string;
    label: string;
    data: number[];
    domain: [number, number];
    value: React.ReactNode;
    tone: SparkTone;
  }[] = [
    {
      key: "talk",
      label: "Talk ratio",
      data: closer.talkRatioTrend,
      domain: coachingVitalsDomain.talkRatio,
      value: <Readout value={lastTalk} unit="%" tone={talkTone} />,
      tone: talkTone,
    },
    {
      key: "mono",
      label: "Maior monólogo",
      data: closer.longestMonologueTrend,
      domain: coachingVitalsDomain.longestMonologue,
      value: (
        <span className={`rl-readout ${lastMono > 150 ? "text-rl-risk" : "text-rl-oxy"}`}>
          {fmtMonologue(lastMono)}
        </span>
      ),
      tone: monoTone,
    },
    {
      key: "qph",
      label: "Perguntas/hora",
      data: closer.questionsPerHourTrend,
      domain: coachingVitalsDomain.questionsPerHour,
      value: <Readout value={lastQph} tone={qphTone} />,
      tone: qphTone,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {vitals.map((v) => (
        <div key={v.key} className="rl-raised rounded-rl-card bg-rl-surface-1 px-4 pt-4 pb-3">
          <div className="text-[10px] uppercase tracking-wider text-rl-text-3">{v.label}</div>
          <div className="mt-1.5 text-lg">{v.value}</div>
          <div className="mt-2.5 h-6">
            <Sparkline data={v.data} domain={v.domain} tone={v.tone} tail height={24} />
          </div>
          <div className="mt-1 text-[10px] text-rl-text-3">últimas {v.data.length} calls</div>
        </div>
      ))}
    </div>
  );
}
