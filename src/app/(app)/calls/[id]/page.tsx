import Link from "next/link";
import { notFound } from "next/navigation";
import { getCallById, calls } from "@/lib/mock/calls";
import { PulseWave } from "@/components/PulseWave";
import { VitalsReadout } from "@/components/VitalsReadout";
import { SpeakerTurn } from "@/components/SpeakerTurn";

export function generateStaticParams() {
  return calls.map((call) => ({ id: call.id }));
}

export default async function CallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = getCallById(id);

  if (!call) notFound();

  const isProcessing = call.status === "processando";

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="border-b border-rl-border px-8 py-6">
        <Link
          href="/calls"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-rl-text-3 transition-colors hover:text-rl-text-2"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <path d="M8 2.5L3.5 6.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Calls
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-rl-text-3">
              {call.account}
            </div>
            <h1 className="rl-display text-3xl text-rl-text">
              {call.prospectName} <span className="text-rl-text-3">×</span> {call.closer}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-rl-text-2">
              <span>{call.prospectName} — {call.prospectRole}</span>
              <span className="text-rl-text-muted">·</span>
              <span>{call.closer} (closer)</span>
            </div>
          </div>
          <div className="rl-readout text-right text-sm text-rl-text-3">
            {call.dateLabel}
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        <VitalsReadout call={call} />

        <div className="mt-6 rounded-rl-card border border-rl-border bg-rl-surface-1 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
              Pulso da conversa
            </span>
            <span className="flex items-center gap-4 text-[11px] text-rl-text-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" /> {call.closer.split(" ")[0]}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rl-prospect" /> {call.prospectName.split(" ")[0]}
              </span>
            </span>
          </div>
          <PulseWave segments={call.pulse} variant="large" className="h-20 w-full" />
          <div className="mt-1 flex justify-between text-[10px] text-rl-text-muted">
            <span className="rl-readout">00:00</span>
            <span className="rl-readout">{call.durationLabel}</span>
          </div>
        </div>

        {isProcessing ? (
          <div className="mt-6 flex items-center gap-3 rounded-rl-card border border-rl-border bg-rl-surface-1 px-5 py-4">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rl-oxy" />
            <span className="text-sm text-rl-text-2">
              Gerando sinais… resumo, objeções e próximos passos ficam prontos em instantes.
            </span>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Resumo executivo">
              <p className="text-sm leading-relaxed text-rl-text-2">{call.summary}</p>
            </Panel>

            <Panel title="Pontos-chave">
              <ul className="flex flex-col gap-2.5">
                {call.keyPoints?.map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-rl-text-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rl-text-3" />
                    {point}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Objeções">
              {call.objections && call.objections.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {call.objections.map((obj, i) => (
                    <div
                      key={i}
                      className={`rounded-rl-control border px-3 py-2 text-sm ${
                        obj.severity === "critica"
                          ? "border-rl-danger/25 bg-rl-danger/10 text-rl-text"
                          : "border-rl-risk/25 bg-rl-risk-dim text-rl-text"
                      }`}
                    >
                      <span
                        className={`rl-readout mr-2 text-[10px] uppercase ${
                          obj.severity === "critica" ? "text-rl-danger" : "text-rl-risk"
                        }`}
                      >
                        {obj.severity === "critica" ? "crítica" : "risco"}
                      </span>
                      {obj.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-rl-text-3">Nenhuma objeção identificada nesta call.</p>
              )}
            </Panel>

            <Panel title="Próximos passos">
              <ul className="flex flex-col gap-2.5">
                {call.nextSteps?.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        step.done
                          ? "border-rl-oxy bg-rl-oxy-dim text-rl-oxy"
                          : "border-rl-border text-transparent"
                      }`}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M2 5l2.2 2.2L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={step.done ? "text-rl-text-3 line-through" : "text-rl-text-2"}>
                      {step.text}
                      <span className="ml-2 text-rl-text-muted">— {step.owner}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        <div className="mt-6 rounded-rl-card border border-rl-border bg-rl-surface-1 p-5">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-rl-text-3">
            Transcrição
          </div>
          <div className="divide-y divide-rl-border-soft">
            {call.transcript.map((turn, i) => (
              <SpeakerTurn key={i} turn={turn} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-rl-card border border-rl-border bg-rl-surface-1 p-5">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-rl-text-3">{title}</div>
      {children}
    </div>
  );
}
