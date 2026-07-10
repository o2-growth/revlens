type DeltaProps = {
  label: string;
  direction: "up" | "down";
  tone: "good" | "bad" | "neutral";
  /** "era X" opcional */
  was?: string;
  className?: string;
};

function toneColor(tone: DeltaProps["tone"]) {
  if (tone === "good") return "text-rl-oxy";
  if (tone === "bad") return "text-rl-risk";
  return "text-rl-text-3";
}

/** Delta com seta + sinal, mono. Cor semântica (bom/ruim), não pela direção. */
export function Delta({ label, direction, tone, was, className = "" }: DeltaProps) {
  return (
    <span className={`rl-readout inline-flex items-center gap-1 text-[11px] ${toneColor(tone)} ${className}`}>
      <span aria-hidden className="text-[9px] leading-none">
        {direction === "up" ? "▲" : "▼"}
      </span>
      {label}
      {was ? <span className="text-rl-text-muted">· {was}</span> : null}
    </span>
  );
}
