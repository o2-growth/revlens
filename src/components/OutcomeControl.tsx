"use client";

import { useState } from "react";
import type { CallOutcome } from "@/lib/mock/calls";
import { toast } from "@/components/ToastHost";

type OutcomeControlProps = {
  account: string;
  initialOutcome: CallOutcome;
  dealValue?: number;
  /** "full" = call detail (label + valor); "compact" = ação rápida na linha do log */
  variant?: "full" | "compact";
  className?: string;
};

function formatBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v}`;
}

const OPTIONS: { key: CallOutcome; label: string }[] = [
  { key: "ganho", label: "Ganhou" },
  { key: "perdido", label: "Perdeu" },
  { key: "aberto", label: "Em aberto" },
];

function toneClasses(key: CallOutcome, active: boolean) {
  if (!active) {
    return "border-rl-border text-rl-text-3 hover:border-rl-border-strong hover:text-rl-text-2";
  }
  if (key === "ganho") return "border-rl-oxy/50 bg-rl-oxy-dim text-rl-oxy";
  if (key === "perdido") return "border-rl-danger/50 bg-rl-danger-dim text-rl-danger";
  return "border-rl-border-strong bg-rl-surface-2 text-rl-text-2";
}

/**
 * Controle de atribuição de resultado — manual por enquanto (liga no Pipefy depois).
 * Client-state, não persiste. Ao mudar, dispara o "apito do monitor" (toast).
 */
export function OutcomeControl({
  account,
  initialOutcome,
  dealValue,
  variant = "full",
  className = "",
}: OutcomeControlProps) {
  const [outcome, setOutcome] = useState<CallOutcome>(initialOutcome);

  function setAndAnnounce(next: CallOutcome, e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (next === outcome) return;
    setOutcome(next);
    const valueLabel = dealValue ? ` · ${formatBRL(dealValue)}` : "";
    if (next === "ganho") {
      toast(`Resultado atribuído: Ganho${valueLabel}`, "oxy");
    } else if (next === "perdido") {
      toast(`Resultado atribuído: Perdido${valueLabel}`, "danger");
    } else {
      toast(`Resultado atribuído: Em aberto · ${account}`, "neutral");
    }
  }

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            title={opt.label}
            onClick={(e) => setAndAnnounce(opt.key, e)}
            className={`rl-press flex h-5 w-5 items-center justify-center rounded-full border text-[9px] transition-colors ${toneClasses(opt.key, outcome === opt.key)}`}
          >
            {opt.key === "ganho" ? "✓" : opt.key === "perdido" ? "✕" : "·"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`rl-raised rounded-rl-card bg-rl-surface-1 px-4 py-3.5 ${className}`}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Resultado</span>
        {dealValue ? (
          <span className="rl-readout text-xs text-rl-text-3">{formatBRL(dealValue)}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={(e) => setAndAnnounce(opt.key, e)}
            className={`rl-press rl-readout inline-flex items-center gap-1.5 rounded-rl-control border px-2.5 py-1.5 text-xs transition-colors ${toneClasses(opt.key, outcome === opt.key)}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                outcome === opt.key
                  ? opt.key === "ganho"
                    ? "bg-rl-oxy"
                    : opt.key === "perdido"
                      ? "bg-rl-danger"
                      : "bg-rl-text-2"
                  : "bg-rl-text-muted"
              }`}
            />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
