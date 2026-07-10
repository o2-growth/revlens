import type { WeeklyPoint } from "@/lib/mock/intelligence";

type TrendChartProps = {
  data: WeeklyPoint[];
};

const WIDTH = 900;
const CHART_HEIGHT = 168;
const LABEL_HEIGHT = 26;
const HEIGHT = CHART_HEIGHT + LABEL_HEIGHT;

export function TrendChart({ data }: TrendChartProps) {
  const maxCalls = Math.max(...data.map((d) => d.calls));
  const slot = WIDTH / data.length;
  const barWidth = slot * 0.4;

  const linePoints = data.map((d, i) => {
    const x = slot * i + slot / 2;
    const y = CHART_HEIGHT - (d.sentiment / 100) * (CHART_HEIGHT - 12) - 6;
    return { x, y, ...d };
  });

  const linePath = linePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-surface-1 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Pulso do comercial · 8 semanas
        </span>
        <span className="flex items-center gap-4 text-[11px] text-rl-text-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-surface-3 border border-rl-border-strong" />
            volume de calls
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" />
            sentimento
          </span>
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-56 w-full"
        role="img"
        aria-label="Tendência de 8 semanas: volume de calls em barras e sentimento médio em linha"
      >
        {/* linhas de referência sutis */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={CHART_HEIGHT * f}
            y2={CHART_HEIGHT * f}
            stroke="var(--color-rl-border-soft)"
            strokeWidth={1}
          />
        ))}

        {/* barras de volume */}
        {data.map((d, i) => {
          const x = slot * i + slot / 2 - barWidth / 2;
          const h = maxCalls > 0 ? (d.calls / maxCalls) * (CHART_HEIGHT - 20) : 0;
          const isCurrent = i === data.length - 1;
          return (
            <rect
              key={`bar-${d.weekLabel}-${i}`}
              x={x}
              y={CHART_HEIGHT - h}
              width={barWidth}
              height={h}
              rx={2}
              fill={isCurrent ? "var(--color-rl-oxy-dim)" : "var(--color-rl-surface-3)"}
              stroke={isCurrent ? "var(--color-rl-oxy)" : "var(--color-rl-border-strong)"}
              strokeOpacity={isCurrent ? 0.4 : 1}
              strokeWidth={1}
            />
          );
        })}

        {/* linha de sentimento — traço de oxímetro */}
        <polyline
          points={linePath}
          fill="none"
          stroke="var(--color-rl-oxy)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {linePoints.map((p, i) => {
          const isCurrent = i === linePoints.length - 1;
          return (
            <circle
              key={`pt-${p.weekLabel}-${i}`}
              cx={p.x}
              cy={p.y}
              r={isCurrent ? 3 : 2}
              fill={isCurrent ? "var(--color-rl-oxy-bright)" : "var(--color-rl-oxy)"}
            />
          );
        })}

        {/* eixo: semanas + valores */}
        {data.map((d, i) => {
          const x = slot * i + slot / 2;
          const isCurrent = i === data.length - 1;
          return (
            <text
              key={`label-${d.weekLabel}-${i}`}
              x={x}
              y={CHART_HEIGHT + 17}
              textAnchor="middle"
              className="rl-readout"
              fontSize={11}
              fill={isCurrent ? "var(--color-rl-text-2)" : "var(--color-rl-text-3)"}
            >
              {d.weekLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
