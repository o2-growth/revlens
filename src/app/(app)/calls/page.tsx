"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { CallLogRow } from "@/components/CallLogRow";
import { Kbd } from "@/components/Kbd";
import { calls, type Call } from "@/lib/mock/calls";

type ViewKey = "todas" | "risco" | "sinais" | "forecast" | "ganhas" | "perdidas" | "processando";

const VIEWS: { key: ViewKey; label: string; test: (c: Call) => boolean }[] = [
  { key: "todas", label: "Todas", test: () => true },
  { key: "risco", label: "Em risco", test: (c) => c.signal === "risco" },
  { key: "sinais", label: "Sinais fortes", test: (c) => c.signal === "sinal" && c.buyingSignalsCount >= 3 },
  {
    key: "forecast",
    label: "Forecast escorregando",
    test: (c) => c.signal === "risco" && (c.dealValue ?? 0) >= 350000,
  },
  { key: "ganhas", label: "Ganhas", test: (c) => c.outcome === "ganho" },
  { key: "perdidas", label: "Perdidas", test: (c) => c.outcome === "perdido" },
  { key: "processando", label: "Processando", test: (c) => c.status === "processando" },
];

// risco no topo, processando por último, resto por data desc
function sortCalls(list: Call[]) {
  const rank = (c: Call) => (c.status === "processando" ? 2 : c.signal === "risco" ? 0 : 1);
  return [...list].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export default function CallsPage() {
  const [view, setView] = useState<ViewKey>("todas");
  const listRef = useRef<HTMLDivElement | null>(null);

  // view inicial via ?view= (vem do ⌘K)
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v && VIEWS.some((x) => x.key === v)) {
      queueMicrotask(() => setView(v as ViewKey));
    }
  }, []);

  const filtered = useMemo(() => {
    const test = VIEWS.find((v) => v.key === view)?.test ?? (() => true);
    return sortCalls(calls.filter(test));
  }, [view]);

  // navegação por teclado — roving focus entre linhas (↑/↓/j/k)
  function onKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowDown", "ArrowUp", "j", "k"];
    if (!keys.includes(e.key)) return;
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-callrow]") ?? []);
    if (rows.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = rows.indexOf(current as HTMLElement);
    const next = e.key === "ArrowDown" || e.key === "j" ? idx + 1 : idx - 1;
    const target = rows[Math.max(0, Math.min(rows.length - 1, next < 0 ? 0 : next))];
    if (target) {
      e.preventDefault();
      target.focus();
    }
  }

  return (
    <>
      <Topbar title="Calls" subtitle={`${filtered.length} calls · mural de operação`} />

      {/* saved views — codificam as perguntas do gestor em um clique */}
      <div className="flex flex-wrap items-center gap-2 border-b border-rl-border px-8 py-3">
        {VIEWS.map((v) => {
          const isActive = v.key === view;
          const count = calls.filter(v.test).length;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`rl-press inline-flex items-center gap-1.5 rounded-rl-control border px-2.5 py-1 text-xs transition-colors ${
                isActive
                  ? "border-rl-oxy/50 bg-rl-oxy-dim text-rl-oxy"
                  : "border-rl-border text-rl-text-2 hover:border-rl-border-strong hover:text-rl-text"
              }`}
            >
              {v.label}
              <span className={`rl-readout text-[10px] ${isActive ? "text-rl-oxy/80" : "text-rl-text-3"}`}>
                {count}
              </span>
            </button>
          );
        })}
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-rl-text-3 sm:flex">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navegar
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-8" ref={listRef} onKeyDown={onKeyDown}>
        <div className="sticky top-0 z-10 hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_96px_auto_auto] gap-4 border-b border-rl-border bg-rl-canvas px-4 py-2.5 sm:grid">
          <span className="pl-1.5 text-[10px] uppercase tracking-wider text-rl-text-3">Conta / prospect</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Closer</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Data · fala</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Talk ratio/min</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Sinal</span>
          <span />
        </div>

        {filtered.map((call, i) => (
          <CallLogRow key={call.id} call={call} index={i} />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm text-rl-text-2">Nenhuma call nessa view.</p>
            <p className="flex items-center gap-1.5 text-xs text-rl-text-3">
              Refine pela busca com <Kbd>⌘K</Kbd>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
