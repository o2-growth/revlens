"use client";

import { useState } from "react";

const OPTIONS = ["7 dias", "30 dias"] as const;

export function PeriodToggle() {
  const [active, setActive] = useState<(typeof OPTIONS)[number]>("7 dias");

  return (
    <div className="rl-readout inline-flex items-center rounded-rl-control border border-rl-border bg-rl-inset p-0.5 text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setActive(opt)}
          className={`rounded-[6px] px-3 py-1.5 transition-colors ${
            active === opt ? "bg-rl-surface-2 text-rl-text" : "text-rl-text-3 hover:text-rl-text-2"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
