"use client";

import { Kbd } from "@/components/Kbd";

type TopbarProps = {
  title: string;
  subtitle?: string;
  /** slot à direita — ex.: PeriodToggle no Painel — sem criar um header divergente */
  right?: React.ReactNode;
};

export function Topbar({ title, subtitle, right }: TopbarProps) {
  function openPalette() {
    window.dispatchEvent(new CustomEvent("rl-open-command"));
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rl-border px-8 py-5">
      <div className="min-w-0">
        <h1 className="rl-display truncate text-2xl text-rl-text">{title}</h1>
        {subtitle ? <p className="mt-0.5 truncate text-sm text-rl-text-3">{subtitle}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {right}
        <button
          type="button"
          onClick={openPalette}
          className="rl-press flex w-72 shrink-0 items-center gap-2 rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2 text-left rl-t-hover transition-colors hover:border-rl-border-strong"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden className="shrink-0 text-rl-text-3">
            <circle cx="6.5" cy="6.5" r="4.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.7 9.7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-sm text-rl-text-muted">Buscar em todas as calls…</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>
    </header>
  );
}
