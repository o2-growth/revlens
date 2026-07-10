import { Topbar } from "@/components/Topbar";
import { CoachingClient } from "./CoachingClient";
import { WinLossAnalysis } from "@/components/WinLossAnalysis";
import { winLossMetrics, winLossInsight } from "@/lib/mock/coaching";
import { calls } from "@/lib/mock/calls";

export default function CoachingPage() {
  const wonCount = calls.filter((c) => c.outcome === "ganho").length;
  const lostCount = calls.filter((c) => c.outcome === "perdido").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Coaching" subtitle="Prontuário do vendedor" />

      <div className="flex flex-col gap-8 px-8 py-6">
        <CoachingClient />

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="rl-display text-xl text-rl-text">Ganhos × Perdidos</h2>
            <span className="text-xs text-rl-text-3">
              O que separa uma call que fecha de uma que escorrega
            </span>
          </div>
          <WinLossAnalysis
            metrics={winLossMetrics}
            insight={winLossInsight}
            wonCount={wonCount}
            lostCount={lostCount}
          />
        </section>
      </div>
    </div>
  );
}
