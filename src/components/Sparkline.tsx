type SparklineProps = {
  data: number[];
  /** domínio y compartilhado — garante comparabilidade entre sparklines */
  domain?: [number, number];
  tone?: "oxy" | "risk" | "danger" | "text-3" | "prospect";
  /** destaca o último ponto como cauda do delta */
  tail?: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
};

const toneVar: Record<NonNullable<SparklineProps["tone"]>, string> = {
  oxy: "var(--color-rl-oxy)",
  risk: "var(--color-rl-risk)",
  danger: "var(--color-rl-danger)",
  "text-3": "var(--color-rl-text-3)",
  prospect: "var(--color-rl-prospect)",
};

/** Mini-traço de escala fixa — silhueta comparável, estática (densidade > espetáculo). */
export function Sparkline({
  data,
  domain,
  tone = "text-3",
  tail = false,
  width = 72,
  height = 20,
  strokeWidth = 1.4,
  className = "",
}: SparklineProps) {
  if (data.length === 0) return null;

  const [min, max] = domain ?? [Math.min(...data), Math.max(...data)];
  const span = max - min || 1;
  const pad = strokeWidth + 1;
  const usableH = height - pad * 2;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + usableH - ((v - min) / span) * usableH;
    return { x, y };
  });

  const path = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const color = toneVar[tone];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polyline
        points={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {tail ? (
        <circle cx={last.x} cy={last.y} r={strokeWidth + 0.6} fill="var(--color-rl-oxy-bright)" />
      ) : null}
    </svg>
  );
}
