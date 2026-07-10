import { PeriodToggle } from "@/components/PeriodToggle";
import { Topbar } from "@/components/Topbar";
import { LeaderBriefing } from "@/components/LeaderBriefing";
import { OperationVitals } from "@/components/OperationVitals";
import { TrendChart } from "@/components/TrendChart";
import { InterventionQueue } from "@/components/InterventionQueue";
import { ObjectionRanking } from "@/components/ObjectionRanking";
import { TeamRanking } from "@/components/TeamRanking";
import { BuyingSignals } from "@/components/BuyingSignals";
import {
  operationMetrics,
  weeklyTrend,
  interventionQueue,
  objectionRanking,
  teamRanking,
  buyingSignals,
  sinceYesterday,
} from "@/lib/mock/intelligence";

export default function PainelPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Painel" subtitle="Gabriela Costa · Gestor" right={<PeriodToggle />} />

      <div className="flex flex-col gap-6 px-8 py-6">
        <LeaderBriefing headline={sinceYesterday.headline} items={sinceYesterday.items} />

        <OperationVitals metrics={operationMetrics} />

        <TrendChart data={weeklyTrend} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
          <InterventionQueue items={interventionQueue} />
          <ObjectionRanking items={objectionRanking} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TeamRanking items={teamRanking} />
          <BuyingSignals items={buyingSignals} />
        </div>
      </div>
    </div>
  );
}
