"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TopbarProps = {
  title: string;
  subtitle?: string;
};

export function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="flex items-center justify-between gap-6 border-b border-rl-border px-8 py-5">
      <div className="min-w-0">
        <h1 className="rl-display truncate text-2xl text-rl-text">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-rl-text-3">{subtitle}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="w-72 shrink-0">
        <div className="flex items-center gap-2 rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2 focus-within:border-rl-oxy/40">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden className="shrink-0 text-rl-text-3">
            <circle cx="6.5" cy="6.5" r="4.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.7 9.7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar em todas as calls…"
            className="w-full bg-transparent text-sm text-rl-text placeholder:text-rl-text-muted focus:outline-none"
          />
        </div>
      </form>
    </header>
  );
}
