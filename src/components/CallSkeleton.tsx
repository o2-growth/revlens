/** Estado "processando" = skeleton que espelha o layout final. Zero spinner. */

const CELLS = [
  "Talk ratio",
  "Sentimento",
  "Objeções",
  "Sinais de compra",
  "Duração",
  "Maior monólogo",
  "Perguntas/hora",
];

export function VitalsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {CELLS.map((label) => (
        <div key={label} className="rl-raised flex flex-col rounded-rl-card bg-rl-surface-1 px-4 py-3.5">
          <div className="text-[10px] uppercase tracking-wider text-rl-text-3">{label}</div>
          <div className="rl-shimmer mt-2 h-6 w-2/3 rounded bg-rl-inset" />
          <div className="mt-3 h-[3px] w-full rounded-full bg-rl-inset" />
        </div>
      ))}
    </div>
  );
}

export function PulseSkeleton() {
  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Pulso da conversa</span>
        <span className="rl-readout inline-flex items-center gap-1.5 text-[11px] text-rl-oxy">
          <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy rl-blip" />
          gerando sinais…
        </span>
      </div>

      {/* flatline pulsante com blip verde varrendo (oxímetro calibrando) */}
      <div className="rl-shimmer relative h-20 w-full overflow-hidden rounded-rl-control bg-rl-inset/40">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rl-text-muted/40" />
        <div className="rl-blip absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-rl-oxy" style={{ left: "18%" }} />
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-rl-text-muted">
        <span className="rl-readout">00:00</span>
        <span className="rl-readout">calibrando</span>
      </div>
    </div>
  );
}
