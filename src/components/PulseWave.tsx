import type { PulseSegment } from "@/lib/mock/calls";

type PulseWaveProps = {
  segments: PulseSegment[];
  /** "sparkline" = mini inline (call log), "large" = página da call */
  variant?: "sparkline" | "large";
  /** id da call (ou outra string estável) — dá a cada pulso uma forma própria, sem Math.random */
  seed?: string;
  /** desenha o traço no mount (só no large — assinatura do instrumento vivo) */
  draw?: boolean;
  className?: string;
};

const REP_COLOR = "var(--color-rl-oxy)";
const PROSPECT_COLOR = "var(--color-rl-prospect)";

// Hash determinístico simples (string -> inteiro). Mesma call sempre gera o mesmo pulso,
// mas calls diferentes divergem em amplitude/fase — sem Math.random pra não quebrar SSR.
function hashSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

// Gera um traço tipo oxímetro: picos determinísticos por segmento (sem Math.random
// pra renderizar igual em server e client). `seedOffset` e `ampScale` variam por call
// pra cada pulso ter uma "assinatura" própria em vez de todos ficarem idênticos.
function buildPoints(
  segments: PulseSegment[],
  width: number,
  height: number,
  seedOffset: number,
  ampScale: number,
) {
  const mid = height / 2;
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0) || 1;
  const pxPerWeight = width / totalWeight;

  const runs: { speaker: PulseSegment["speaker"]; points: string }[] = [];
  let x = 0;

  segments.forEach((seg, i) => {
    const segWidth = seg.weight * pxPerWeight;
    const steps = Math.max(3, Math.round(seg.weight));
    const stepWidth = segWidth / steps;
    const amp = mid * ampScale * (0.35 + Math.min(seg.weight, 6) / 8);
    const pts: string[] = [`${x.toFixed(1)},${mid.toFixed(1)}`];

    for (let s = 1; s <= steps; s++) {
      const px = x + stepWidth * s;
      // padrão determinístico tipo batimento: sobe rápido, desce, pequena crista
      const phase = (seedOffset + i * 7 + s) % 4;
      const dir = seg.speaker === "rep" ? -1 : 1;
      let py = mid;
      if (phase === 0) py = mid + dir * amp;
      else if (phase === 1) py = mid + dir * amp * 0.3;
      else if (phase === 2) py = mid - dir * amp * 0.55;
      else py = mid;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    pts.push(`${(x + segWidth).toFixed(1)},${mid.toFixed(1)}`);

    runs.push({ speaker: seg.speaker, points: pts.join(" ") });
    x += segWidth;
  });

  return runs;
}

export function PulseWave({ segments, variant = "large", seed = "", draw = false, className = "" }: PulseWaveProps) {
  const isLarge = variant === "large";
  const width = isLarge ? 960 : 96;
  const height = isLarge ? 96 : 24;
  const h = hashSeed(seed || "revlens");
  const seedOffset = h % 4;
  const ampScale = 0.82 + ((h >> 3) % 9) / 20; // ~0.82 – 1.22, própria de cada call

  if (segments.length === 0) {
    // estado sem dados (call processando) — linha reta pontilhada, neutra
    return (
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={className}
        aria-hidden
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--color-rl-text-muted)"
          strokeWidth={1.5}
          strokeDasharray="2 4"
        />
      </svg>
    );
  }

  const runs = buildPoints(segments, width, height, seedOffset, ampScale);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Onda de tempo de fala: verde é o vendedor, teal é o prospect"
    >
      {runs.map((run, i) => (
        <polyline
          key={i}
          className={draw ? "rl-trace" : undefined}
          style={draw ? { animationDelay: run.speaker === "rep" ? "0ms" : "120ms" } : undefined}
          points={run.points}
          fill="none"
          stroke={run.speaker === "rep" ? REP_COLOR : PROSPECT_COLOR}
          strokeWidth={isLarge ? 1.75 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isLarge ? 0.95 : 0.85}
        />
      ))}
    </svg>
  );
}
