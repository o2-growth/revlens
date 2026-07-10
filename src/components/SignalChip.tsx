type SignalChipProps = {
  signal: "sinal" | "risco" | null;
};

export function SignalChip({ signal }: SignalChipProps) {
  if (signal === null) {
    return (
      <span className="rl-readout inline-flex items-center gap-1.5 rounded-full border border-rl-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-rl-text-3">
        <span className="h-1.5 w-1.5 rounded-full bg-rl-text-muted" />
        analisando
      </span>
    );
  }

  const isSinal = signal === "sinal";

  return (
    <span
      className={`rl-readout inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide ${
        isSinal
          ? "border-rl-oxy/30 bg-rl-oxy-dim text-rl-oxy"
          : "border-rl-risk/30 bg-rl-risk-dim text-rl-risk"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isSinal ? "bg-rl-oxy" : "bg-rl-risk"}`}
      />
      {isSinal ? "sinal de compra" : "risco"}
    </span>
  );
}
