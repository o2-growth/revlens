import Link from "next/link";

type Tone = "oxy" | "risk" | "danger" | "prospect" | "neutral";

const toneRing: Record<Tone, string> = {
  oxy: "border-rl-oxy/25 text-rl-oxy hover:border-rl-oxy/50",
  risk: "border-rl-risk/25 text-rl-risk hover:border-rl-risk/50",
  danger: "border-rl-danger/25 text-rl-danger hover:border-rl-danger/50",
  prospect: "border-rl-prospect/25 text-rl-prospect hover:border-rl-prospect/50",
  neutral: "border-rl-border text-rl-text-3 hover:border-rl-border-strong hover:text-rl-text-2",
};

type EvidenceChipProps = {
  callId: string;
  timestamp: string; // mm:ss
  tone?: Tone;
  label?: string;
  className?: string;
};

/**
 * Recibo clicável — se a IA afirma, tem prova.
 * Deep-link pro turno exato do transcript (#t-<timestamp>).
 */
export function EvidenceChip({
  callId,
  timestamp,
  tone = "neutral",
  label,
  className = "",
}: EvidenceChipProps) {
  return (
    <Link
      href={`/calls/${callId}#t-${timestamp}`}
      className={`rl-readout rl-press inline-flex shrink-0 items-center gap-1 rounded-[5px] border bg-rl-inset/40 px-1.5 py-0.5 text-[10px] transition-colors ${toneRing[tone]} ${className}`}
      title={`Ver no transcript · ${timestamp}`}
    >
      {label ? <span className="text-[9px] uppercase tracking-wide opacity-80">{label}</span> : null}
      {timestamp}
      <span aria-hidden className="opacity-70">›</span>
    </Link>
  );
}
