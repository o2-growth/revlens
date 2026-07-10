type TargetBandProps = {
  /** valor atual (mesma unidade dos limites) */
  value: number;
  /** faixa saudável [min,max] */
  band: [number, number];
  /** escala total [min,max] */
  scale: [number, number];
  className?: string;
};

/**
 * Micro-barra 3px sob um readout: zona saudável em rl-oxy-band + ponteiro.
 * Ponteiro fica âmbar quando o valor está fora da faixa. Geometria fina, sem texto.
 */
export function TargetBand({ value, band, scale, className = "" }: TargetBandProps) {
  const [sMin, sMax] = scale;
  const total = sMax - sMin || 1;
  const clamp = (v: number) => Math.max(0, Math.min(100, ((v - sMin) / total) * 100));

  const bandStart = clamp(band[0]);
  const bandEnd = clamp(band[1]);
  const pos = clamp(value);
  const inBand = value >= band[0] && value <= band[1];

  return (
    <div className={`relative h-[3px] w-full overflow-visible rounded-full bg-rl-inset ${className}`}>
      {/* zona saudável */}
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${bandStart}%`,
          width: `${Math.max(0, bandEnd - bandStart)}%`,
          background: "var(--color-rl-oxy-band)",
          boxShadow: "inset 0 0 0 1px rgba(108,242,105,0.22)",
        }}
      />
      {/* ponteiro */}
      <div
        className="absolute top-1/2 h-2 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${pos}%`,
          background: inBand ? "var(--color-rl-oxy)" : "var(--color-rl-risk)",
        }}
      />
    </div>
  );
}
