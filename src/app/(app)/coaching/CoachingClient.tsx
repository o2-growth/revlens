"use client";

import { useMemo, useState } from "react";
import { coachingByCloser } from "@/lib/mock/coaching";
import { ScorecardBars } from "@/components/ScorecardBars";
import { CoachingVitalsTrend } from "@/components/CoachingVitalsTrend";
import { AutocoachNote } from "@/components/AutocoachNote";

export function CoachingClient() {
  const [selected, setSelected] = useState(coachingByCloser[0].name);

  const closer = useMemo(
    () => coachingByCloser.find((c) => c.name === selected) ?? coachingByCloser[0],
    [selected],
  );

  const avgScore = Math.round(
    closer.scorecard.reduce((sum, c) => sum + c.value, 0) / closer.scorecard.length,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* seletor de closer — chips/tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {coachingByCloser.map((c) => {
          const isActive = c.name === selected;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setSelected(c.name)}
              className={`rl-press inline-flex items-center gap-2 rounded-rl-control border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-rl-oxy/50 bg-rl-oxy-dim text-rl-oxy"
                  : "border-rl-border text-rl-text-2 hover:border-rl-border-strong hover:text-rl-text"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${
                  isActive ? "bg-rl-oxy text-rl-oxy-ink" : "bg-rl-surface-2 text-rl-text-2"
                }`}
              >
                {c.initials}
              </span>
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="rl-raised rounded-rl-card bg-rl-surface-1 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
              Scorecard de coaching
            </span>
            <span
              className={`rl-readout text-sm ${avgScore >= 70 ? "text-rl-oxy" : "text-rl-risk"}`}
            >
              {avgScore}
              <span className="text-[0.7em] text-rl-text-3"> médio</span>
            </span>
          </div>
          <ScorecardBars criteria={closer.scorecard} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-rl-text-3">
              Vitais das últimas 8 calls
            </div>
            <CoachingVitalsTrend closer={closer} />
          </div>
        </div>
      </div>

      <AutocoachNote closer={closer} />
    </div>
  );
}
