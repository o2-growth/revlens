"use client";

import { useState } from "react";
import Link from "next/link";
import type { InterventionItem } from "@/lib/mock/intelligence";
import { EvidenceChip } from "@/components/EvidenceChip";
import { Sparkline } from "@/components/Sparkline";

type InterventionQueueProps = {
  items: InterventionItem[];
};

function formatBRL(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v}`;
}

type ItemState = "open" | "done" | "snoozed";

const momentumSparkTone: Record<InterventionItem["momentum"], "oxy" | "risk" | "text-3"> = {
  aquecendo: "oxy",
  estagnado: "text-3",
  esfriando: "risk",
};

export function InterventionQueue({ items }: InterventionQueueProps) {
  // ação produz ESTADO (mock, local) — a fila drena ao concluir/adiar, com contagem e undo.
  const [states, setStates] = useState<Record<string, ItemState>>({});

  const resolve = (callId: string, state: ItemState) =>
    setStates((prev) => ({ ...prev, [callId]: state }));
  const reopen = (callId: string) =>
    setStates((prev) => {
      const next = { ...prev };
      delete next[callId];
      return next;
    });

  const openItems = items.filter((i) => (states[i.callId] ?? "open") === "open");
  const resolvedCount = items.length - openItems.length;
  const valueInQueue = openItems.reduce((s, i) => s + i.dealValue, 0);

  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1">
      <div className="flex items-center justify-between border-b border-rl-border px-5 py-3.5">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">
          Fila de intervenção
        </span>
        <span className="rl-readout text-[11px] text-rl-text-3">
          {openItems.length} deals · {formatBRL(valueInQueue)}
          {resolvedCount > 0 ? (
            <span className="ml-1.5 text-rl-oxy">· {resolvedCount} tratado{resolvedCount > 1 ? "s" : ""}</span>
          ) : null}
        </span>
      </div>

      {openItems.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-5 py-10 text-center">
          <span className="rl-readout text-sm text-rl-oxy">fila zerada</span>
          <span className="text-xs text-rl-text-3">
            Todos os {items.length} deals em risco foram tratados ou adiados.
          </span>
          <button
            type="button"
            onClick={() => setStates({})}
            className="rl-press mt-2 rounded-rl-control border border-rl-border px-2.5 py-1 text-[11px] text-rl-text-2 rl-t-hover transition-colors hover:border-rl-border-strong hover:text-rl-text"
          >
            Restaurar fila
          </button>
        </div>
      ) : (
        <ul>
          {openItems.map((item, i) => {
            const isCritica = item.severity === "critica";
            return (
              <li
                key={item.callId}
                className="rl-enter relative border-b border-rl-border-soft last:border-b-0"
                style={{ ["--i" as string]: i }}
              >
                {/* rail de severidade — ping uma vez no crítico */}
                <span
                  className={`absolute inset-y-0 left-0 w-[2px] ${
                    isCritica ? "bg-rl-danger rl-ping" : "bg-rl-risk"
                  }`}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-4 px-5 py-3.5 pl-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Link
                        href={`/calls/${item.callId}`}
                        className="truncate text-sm font-medium text-rl-text rl-t-hover transition-colors hover:text-rl-oxy"
                      >
                        {item.account}
                      </Link>
                      <span
                        className={`rl-readout text-[10px] uppercase tracking-wide ${
                          isCritica ? "text-rl-danger" : "text-rl-risk"
                        }`}
                      >
                        {item.reasonType}
                        {item.reasonDetail ? (
                          <span className="ml-1 text-rl-text-3">{item.reasonDetail}</span>
                        ) : null}
                      </span>
                    </div>

                    {/* contexto de DEAL — dias em estágio, threads, gap (não métrica de call isolada) */}
                    {item.dealContext ? (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-4 w-14">
                          <Sparkline
                            data={item.momentumTrend}
                            domain={[0, 100]}
                            tone={momentumSparkTone[item.momentum]}
                            height={16}
                            width={56}
                            tail
                          />
                        </span>
                        <span className="rl-readout text-[10px] uppercase tracking-wide text-rl-text-3">
                          {item.dealContext}
                        </span>
                      </div>
                    ) : null}

                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-rl-text-2">
                      <span className="min-w-0">{item.evidence}</span>
                      {item.evidenceTimestamp ? (
                        <EvidenceChip
                          callId={item.callId}
                          timestamp={item.evidenceTimestamp}
                          tone={isCritica ? "danger" : "risk"}
                        />
                      ) : null}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-rl-text-3">
                      <span>{item.closer}</span>
                      <span className="text-rl-text-muted">·</span>
                      <span className="rl-readout">{item.ageLabel}</span>
                      <span className="text-rl-text-muted">·</span>
                      <span className="rl-readout text-rl-text-2">{formatBRL(item.dealValue)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {/* ação recomendada — agora PRODUZ estado (drena a fila) */}
                    <button
                      type="button"
                      onClick={() => resolve(item.callId, "done")}
                      className="rl-press rl-cta-glow inline-flex items-center gap-1.5 rounded-rl-control border border-rl-oxy/30 bg-rl-oxy-dim px-2.5 py-1.5 text-[11px] font-medium text-rl-oxy rl-t-hover transition-colors hover:border-rl-oxy/60 hover:bg-rl-oxy/15"
                    >
                      {item.recommendedAction}
                      <svg width="10" height="10" viewBox="0 0 11 11" fill="none" aria-hidden>
                        <path d="M2 5.5h7M6 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 text-[10px] text-rl-text-3">
                      <Link
                        href={`/calls/${item.callId}`}
                        className="rl-t-hover transition-colors hover:text-rl-text-2"
                      >
                        abrir call
                      </Link>
                      <span className="text-rl-text-muted">·</span>
                      <button
                        type="button"
                        onClick={() => resolve(item.callId, "snoozed")}
                        className="rl-press rl-t-hover transition-colors hover:text-rl-text-2"
                      >
                        adiar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* rodapé com undo dos itens tratados/adiados (o estado "aconteceu" é visível) */}
      {resolvedCount > 0 && openItems.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-rl-border px-5 py-2.5 text-[11px] text-rl-text-3">
          <span className="rl-readout">
            {resolvedCount} fora da fila
          </span>
          {items
            .filter((i) => (states[i.callId] ?? "open") !== "open")
            .map((i) => (
              <button
                key={i.callId}
                type="button"
                onClick={() => reopen(i.callId)}
                className="rl-press inline-flex items-center gap-1 rounded-[5px] border border-rl-border bg-rl-inset/40 px-1.5 py-0.5 rl-t-hover transition-colors hover:border-rl-border-strong hover:text-rl-text-2"
                title="Reverter"
              >
                <span className="truncate max-w-[120px]">{i.account}</span>
                <span className={states[i.callId] === "done" ? "text-rl-oxy" : "text-rl-risk"}>
                  {states[i.callId] === "done" ? "✓" : "⏱"}
                </span>
                <span className="text-rl-text-muted">desfazer</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
