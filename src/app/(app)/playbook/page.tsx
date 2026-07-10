import { Topbar } from "@/components/Topbar";
import { Readout } from "@/components/Readout";
import { TargetBand } from "@/components/TargetBand";
import { ScriptTrace } from "@/components/ScriptTrace";
import {
  playbookStages,
  discoveryQuestionBank,
  objectionPlaybook,
  teamScriptAdherence,
} from "@/lib/mock/playbook";

export default function PlaybookPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Playbook" subtitle="A partitura de referência da call ideal" />

      <div className="flex flex-col gap-6 px-8 py-6">
        {/* aderência média do time — Readout no cabeçalho */}
        <div className="rl-raised flex flex-wrap items-center justify-between gap-4 rounded-rl-card bg-rl-surface-1 px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-rl-text-3">
              Aderência média do time ao script
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <Readout
                value={teamScriptAdherence}
                unit="%"
                tone={teamScriptAdherence >= 70 ? "oxy" : "risk"}
                hero
                className="text-2xl"
              />
              <span className="text-xs text-rl-text-3">
                média das calls avaliadas nas últimas 2 semanas
              </span>
            </div>
          </div>
          <div className="w-full max-w-xs sm:w-56">
            <TargetBand value={teamScriptAdherence} band={[70, 100]} scale={[0, 100]} />
          </div>
        </div>

        <ScriptTrace stages={playbookStages} />

        {/* etapas — editáveis na aparência, sem persistência (protótipo) */}
        <div className="flex flex-col gap-4">
          {playbookStages.map((stage, i) => (
            <div key={stage.key} className="rl-raised rl-enter rounded-rl-card bg-rl-surface-1" style={{ ["--i" as string]: i }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rl-border px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="rl-readout flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rl-surface-2 text-[11px] text-rl-text-2">
                    {i + 1}
                  </span>
                  <span className="rl-display text-lg tracking-tight text-rl-text">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-rl-text-3">
                  <span>Alvo de fala do rep</span>
                  <span className="rl-readout text-rl-oxy">{stage.targetTalkRatio}%</span>
                  <div className="w-24">
                    <TargetBand
                      value={stage.executedTalkRatio}
                      band={stage.talkRatioBand}
                      scale={[0, 100]}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-rl-text-3">
                    Objetivo da etapa
                  </label>
                  <textarea
                    defaultValue={stage.objective}
                    rows={4}
                    className="w-full resize-none rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2.5 text-sm leading-relaxed text-rl-text-2 outline-none transition-colors focus:border-rl-oxy/50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-rl-text-3">
                    Perguntas / movimentos esperados
                  </label>
                  <textarea
                    defaultValue={stage.expectedMoves.map((m) => `• ${m}`).join("\n")}
                    rows={stage.expectedMoves.length + 2}
                    className="w-full resize-none rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2.5 text-sm leading-relaxed text-rl-text-2 outline-none transition-colors focus:border-rl-oxy/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* banco de perguntas de descoberta obrigatórias */}
        <div className="rl-raised rounded-rl-card bg-rl-surface-1">
          <div className="border-b border-rl-border px-5 py-3.5">
            <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
              Banco de perguntas de descoberta obrigatórias
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 p-5 md:grid-cols-2">
            {discoveryQuestionBank.map((q, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-rl-text-2">
                <span className="rl-readout mt-0.5 shrink-0 text-[11px] text-rl-text-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* objeção → resposta recomendada */}
        <div className="rl-raised rounded-rl-card bg-rl-surface-1">
          <div className="border-b border-rl-border px-5 py-3.5">
            <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
              Objeção → resposta recomendada
            </span>
          </div>
          <div className="divide-y divide-rl-border-soft">
            {objectionPlaybook.map((entry) => (
              <div key={entry.objection} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1fr_1.6fr]">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rl-risk" />
                  <span className="text-sm font-medium text-rl-text">{entry.objection}</span>
                </div>
                <textarea
                  defaultValue={entry.recommendedResponse}
                  rows={3}
                  className="w-full resize-none rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2.5 text-sm leading-relaxed text-rl-text-2 outline-none transition-colors focus:border-rl-oxy/50"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
