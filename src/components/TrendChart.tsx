"use client";

import { useEffect, useRef, useState } from "react";
import type { WeeklyPoint } from "@/lib/mock/intelligence";
import { forecastBand, forecast } from "@/lib/mock/intelligence";

type TrendChartProps = {
  data: WeeklyPoint[];
};

const DEFAULT_WIDTH = 900;
const CHART_HEIGHT = 168;
const LABEL_HEIGHT = 26;
const HEIGHT = CHART_HEIGHT + LABEL_HEIGHT;
const ASPECT = HEIGHT / DEFAULT_WIDTH;

function formatMi(v: number) {
  return `${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
}

/** Verde só acima do piso de confiança real — não decorativo (mesma disciplina do Delta). */
function confidenceTone(pct: number): "oxy" | "risk" | "danger" {
  if (pct >= 75) return "oxy";
  if (pct >= 55) return "risk";
  return "danger";
}
const confidenceClass: Record<ReturnType<typeof confidenceTone>, string> = {
  oxy: "text-rl-oxy",
  risk: "text-rl-risk",
  danger: "text-rl-danger",
};

export function TrendChart({ data }: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // largura medida do container — mantém o viewBox no MESMO aspect ratio do
  // elemento renderizado, então círculos ficam redondos e o stroke uniforme
  // (sem preserveAspectRatio="none" esticando eixos em taxas diferentes).
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const WIDTH = width;
  const renderHeight = WIDTH * ASPECT;

  const maxCalls = Math.max(...data.map((d) => d.calls));
  const slot = WIDTH / data.length;
  const yOf = (sentiment: number) => CHART_HEIGHT - (sentiment / 100) * (CHART_HEIGHT - 12) - 6;
  const xOf = (i: number) => slot * i + slot / 2;

  const historical = data.filter((d) => !d.future);
  const lastHistIdx = historical.length - 1; // índice do "Atual"
  const floor = forecastBand.healthyFloor;

  const histPoints = historical.map((d, i) => ({ x: xOf(i), y: yOf(d.sentiment), ...d }));
  const histPath = histPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Cone do forecast (Atual → S+2): índices lastHistIdx, +1, +2
  const coneIdx = [lastHistIdx, lastHistIdx + 1, lastHistIdx + 2];
  const bestPts = forecastBand.best.map((v, k) => ({ x: xOf(coneIdx[k]), y: yOf(v) }));
  const worstPts = forecastBand.worst.map((v, k) => ({ x: xOf(coneIdx[k]), y: yOf(v) }));
  const commitPts = forecastBand.commit.map((v, k) => ({ x: xOf(coneIdx[k]), y: yOf(v), v }));
  const conePath =
    "M " +
    bestPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ") +
    " L " +
    [...worstPts].reverse().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ") +
    " Z";

  const redlineX = xOf(lastHistIdx);
  const bandTopY = yOf(100);
  const bandBottomY = yOf(floor);

  const confPct = forecast.confidence;
  const tone = confidenceTone(confPct);

  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
            Linha do horizonte · sentimento + forecast
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`rl-readout-hero text-lg ${confidenceClass[tone]}`}>R$ {formatMi(forecast.commit)}</span>
            <span className="rl-readout text-[11px] text-rl-text-3">commit do trimestre</span>
            <span className="rl-readout text-[11px] text-rl-text-2">
              · confiança <span className={confidenceClass[tone]}>{confPct}%</span>
            </span>
          </div>
        </div>
        <span className="flex flex-wrap items-center gap-4 text-[11px] text-rl-text-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" /> sentimento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[7px] w-3.5 rounded-sm" style={{ background: "var(--color-rl-oxy-band)", boxShadow: "inset 0 0 0 1px rgba(108,242,105,0.22)" }} /> faixa saudável
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-3.5 border-t border-dashed border-rl-text-3" /> projeção
          </span>
        </span>
      </div>

      <div ref={containerRef} className="w-full">
        <svg
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ height: renderHeight, display: "block" }}
          className="w-full"
          role="img"
          aria-label="Sentimento das últimas 8 semanas continuado por um cone de forecast; faixa saudável marcada e linha 'agora' destacada"
        >
        <defs>
          <linearGradient id="rl-redline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-rl-oxy)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-rl-oxy)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-rl-oxy)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* faixa saudável (zona-alvo) */}
        <rect
          x={0}
          y={bandTopY}
          width={WIDTH}
          height={bandBottomY - bandTopY}
          fill="var(--color-rl-oxy-band)"
        />
        <line x1={0} x2={WIDTH} y1={bandBottomY} y2={bandBottomY} stroke="var(--color-rl-oxy)" strokeOpacity={0.2} strokeWidth={1} strokeDasharray="3 5" />

        {/* linhas de referência sutis */}
        {[0.25, 0.75].map((f) => (
          <line key={f} x1={0} x2={WIDTH} y1={CHART_HEIGHT * f} y2={CHART_HEIGHT * f} stroke="var(--color-rl-border-soft)" strokeWidth={1} />
        ))}

        {/* barras de volume (subtis, fundo — não competem com a linha) */}
        {data.map((d, i) => {
          const x = xOf(i) - slot * 0.16;
          const h = maxCalls > 0 ? (d.calls / maxCalls) * (CHART_HEIGHT * 0.4) : 0;
          return (
            <rect
              key={`bar-${i}`}
              x={x}
              y={CHART_HEIGHT - h}
              width={slot * 0.32}
              height={h}
              rx={2}
              fill="var(--color-rl-surface-3)"
              opacity={d.future ? 0.3 : 0.55}
            />
          );
        })}

        {/* cone do forecast (banda best/worst) */}
        <path d={conePath} fill="var(--color-rl-oxy-band)" stroke="none" />

        {/* commit projetado — dotted, por-segmento (risk fora da faixa) */}
        {commitPts.slice(1).map((p, k) => {
          const prev = commitPts[k];
          const belowFloor = p.v < floor || prev.v < floor;
          return (
            <line
              key={`commit-${k}`}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke={belowFloor ? "var(--color-rl-risk)" : "var(--color-rl-oxy)"}
              strokeWidth={1.75}
              strokeDasharray="2 4"
              strokeLinecap="round"
            />
          );
        })}
        {commitPts.map((p, k) => (
          <circle key={`cpt-${k}`} cx={p.x} cy={p.y} r={2} fill={p.v < floor ? "var(--color-rl-risk)" : "var(--color-rl-oxy)"} opacity={k === 0 ? 0 : 0.9} />
        ))}

        {/* linha histórica — traço único que se desenha (pathLength normalizado) */}
        <polyline
          className="rl-trace"
          pathLength={1}
          points={histPath}
          fill="none"
          stroke="var(--color-rl-oxy)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* segmentos abaixo da faixa acendem risco (sobreposto, sutil) */}
        {histPoints.slice(1).map((p, k) => {
          const prev = histPoints[k];
          if (p.sentiment >= floor && prev.sentiment >= floor) return null;
          return (
            <line key={`risk-${k}`} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y} stroke="var(--color-rl-risk)" strokeWidth={1.75} strokeLinecap="round" />
          );
        })}

        {histPoints.map((p, i) => (
          <circle key={`hpt-${i}`} cx={p.x} cy={p.y} r={i === lastHistIdx ? 3.2 : 2} fill={i === lastHistIdx ? "var(--color-rl-oxy-bright)" : "var(--color-rl-oxy)"} />
        ))}

        {/* redline "agora" com glow */}
        <line x1={redlineX} x2={redlineX} y1={0} y2={CHART_HEIGHT} stroke="url(#rl-redline)" strokeWidth={2} />

        {/* labels */}
        {data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={xOf(i)}
            y={CHART_HEIGHT + 17}
            textAnchor="middle"
            className="rl-readout"
            fontSize={11}
            fill={i === lastHistIdx ? "var(--color-rl-oxy)" : d.future ? "var(--color-rl-text-muted)" : "var(--color-rl-text-3)"}
          >
            {d.weekLabel}
          </text>
        ))}
        </svg>
      </div>
    </div>
  );
}
