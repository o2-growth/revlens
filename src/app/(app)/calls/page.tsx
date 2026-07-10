"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { CallLogRow } from "@/components/CallLogRow";
import { calls, closers } from "@/lib/mock/calls";

const DATE_OPTIONS = [
  { value: "all", label: "Todo o período" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "3d", label: "Últimos 3 dias" },
];

export default function CallsPage() {
  const [closerFilter, setCloserFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const now = new Date("2026-07-10T23:59:59-03:00").getTime();
    const windowDays = dateFilter === "7d" ? 7 : dateFilter === "3d" ? 3 : null;

    return calls.filter((call) => {
      if (closerFilter !== "all" && call.closer !== closerFilter) return false;
      if (windowDays !== null) {
        const diffDays = (now - new Date(call.date).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > windowDays) return false;
      }
      return true;
    });
  }, [closerFilter, dateFilter]);

  return (
    <>
      <Topbar title="Calls" subtitle={`${filtered.length} calls registradas`} />

      <div className="flex items-center gap-3 border-b border-rl-border px-8 py-3">
        <FilterSelect
          value={dateFilter}
          onChange={setDateFilter}
          options={DATE_OPTIONS}
        />
        <FilterSelect
          value={closerFilter}
          onChange={setCloserFilter}
          options={[
            { value: "all", label: "Todos os closers" },
            ...closers.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_96px_auto_auto] gap-4 border-b border-rl-border px-4 py-2.5 sm:grid">
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Conta / prospect</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Closer</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Data · duração</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Pulso</span>
          <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Sinal</span>
          <span />
        </div>

        {filtered.map((call) => (
          <CallLogRow key={call.id} call={call} />
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-rl-text-3">
            Nenhuma call encontrada para esse filtro.
          </div>
        )}
      </div>
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rl-readout rounded-rl-control border border-rl-border bg-rl-inset px-3 py-1.5 text-xs text-rl-text-2 focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
