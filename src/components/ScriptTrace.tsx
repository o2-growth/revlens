import type { PlaybookStage } from "@/lib/mock/playbook";

type ScriptTraceProps = {
  stages: PlaybookStage[];
};

const WIDTH = 900;
const CHART_HEIGHT = 120;
const LABEL_HEIGHT = 20;
const HEIGHT = CHART_HEIGHT + LABEL_HEIGHT;

/**
 * O "pulso de referência" — traço-fantasma do ritmo ideal da call (talk-ratio alvo por
 * etapa) sobreposto ao traço executado (média real do time). Ghost tracejado rl-text-3,
 * executado sólido colorido pela faixa (oxy dentro, risk fora). Mesma linguagem visual do
 * TrendChart/PulseWave — nunca preenchimento chapado, sempre traço.
 */
export function ScriptTrace({ stages }: ScriptTraceProps) {
  const slot = WIDTH / stages.length;
  const xOf = (i: number) => slot * i + slot / 2;
  const yOf = (v: number) => CHART_HEIGHT - (v / 100) * (CHART_HEIGHT - 16) - 8;

  const idealPts = stages.map((s, i) => ({ x: xOf(i), y: yOf(s.targetTalkRatio) }));
  const idealPath = idealPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const execPts = stages.map((s, i) => ({
    x: xOf(i),
    y: yOf(s.executedTalkRatio),
    outOfBand: s.executedTalkRatio < s.talkRatioBand[0] || s.executedTalkRatio > s.talkRatioBand[1],
  }));

  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Pulso de referência · talk ratio ideal vs. executado por etapa
        </span>
        <span className="flex flex-wrap items-center gap-4 text-[11px] text-rl-text-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-3.5 border-t border-dashed border-rl-text-3" /> ideal (script)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" /> executado (time)
          </span>
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-32 w-full"
        role="img"
        aria-label="Talk ratio ideal por etapa da call (ghost tracejado) comparado ao executado pelo time (traço sólido)"
      >
        {/* faixas-alvo por etapa (fundo saudável) */}
        {stages.map((s, i) => {
          const bandTop = yOf(s.talkRatioBand[1]);
          const bandBottom = yOf(s.talkRatioBand[0]);
          return (
            <rect
              key={`band-${s.key}`}
              x={slot * i + 4}
              y={bandTop}
              width={slot - 8}
              height={bandBottom - bandTop}
              rx={3}
              fill="var(--color-rl-oxy-band)"
            />
          );
        })}

        {/* traço-fantasma (ideal) */}
        <polyline
          points={idealPath}
          fill="none"
          stroke="var(--color-rl-text-3)"
          strokeWidth={1.5}
          strokeDasharray="3 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {idealPts.map((p, i) => (
          <circle key={`ipt-${i}`} cx={p.x} cy={p.y} r={1.8} fill="var(--color-rl-text-3)" />
        ))}

        {/* traço executado — sólido, acende risco fora da faixa */}
        {execPts.slice(1).map((p, i) => {
          const prev = execPts[i];
          return (
            <line
              key={`exec-${i}`}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke={p.outOfBand || prev.outOfBand ? "var(--color-rl-risk)" : "var(--color-rl-oxy)"}
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          );
        })}
        {execPts.map((p, i) => (
          <circle
            key={`ept-${i}`}
            cx={p.x}
            cy={p.y}
            r={2.4}
            fill={p.outOfBand ? "var(--color-rl-risk)" : "var(--color-rl-oxy)"}
          />
        ))}

        {/* labels das etapas */}
        {stages.map((s, i) => (
          <text
            key={`label-${s.key}`}
            x={xOf(i)}
            y={CHART_HEIGHT + 15}
            textAnchor="middle"
            className="rl-readout"
            fontSize={10}
            fill="var(--color-rl-text-3)"
          >
            {s.name.toUpperCase()}
          </text>
        ))}
      </svg>
    </div>
  );
}
