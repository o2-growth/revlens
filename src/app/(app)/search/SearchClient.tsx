"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { calls, type TranscriptTurn } from "@/lib/mock/calls";

type Result = {
  callId: string;
  account: string;
  turn: TranscriptTurn;
};

function highlight(text: string, term: string) {
  if (!term.trim()) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-rl-oxy-dim px-0.5 text-rl-oxy-bright">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function SearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const results: Result[] = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const found: Result[] = [];
    for (const call of calls) {
      for (const turn of call.transcript) {
        if (turn.text.toLowerCase().includes(term)) {
          found.push({ callId: call.id, account: call.account, turn });
        }
      }
    }
    return found;
  }, [query]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-8 py-10">
      <div className="flex items-center gap-3 rounded-rl-card border border-rl-border bg-rl-inset px-4 py-3.5 focus-within:border-rl-oxy/40">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0 text-rl-text-3">
          <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque em todas as suas calls…"
          className="w-full bg-transparent text-base text-rl-text placeholder:text-rl-text-muted focus:outline-none"
        />
      </div>

      {!hasQuery && (
        <div className="mt-24 flex flex-col items-center gap-3 text-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden className="text-rl-text-muted">
            <circle cx="17" cy="17" r="12" stroke="currentColor" strokeWidth="1.5" />
            <path d="M26 26l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-rl-text-3">
            Busque em todas as suas calls — trechos de transcrição, objeções, nomes de contas.
          </p>
        </div>
      )}

      {hasQuery && results.length === 0 && (
        <div className="mt-24 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-rl-text-2">Nenhum resultado para “{query}”.</p>
          <p className="text-xs text-rl-text-3">Tente outro termo ou nome de conta.</p>
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="mt-8 flex flex-col gap-2">
          <div className="mb-1 text-xs text-rl-text-3">
            {results.length} resultado{results.length > 1 ? "s" : ""}
          </div>
          {results.map((r, i) => (
            <Link
              key={i}
              href={`/calls/${r.callId}#t-${r.turn.timestamp}`}
              className="rounded-rl-card border border-rl-border bg-rl-surface-1 px-4 py-3.5 transition-colors hover:bg-rl-surface-2"
            >
              <div className="mb-1.5 flex items-center gap-2 text-xs">
                <span className="font-medium text-rl-text">{r.account}</span>
                <span className="text-rl-text-muted">·</span>
                <span
                  className={r.turn.speaker === "rep" ? "text-rl-oxy" : "text-rl-prospect"}
                >
                  {r.turn.speakerName}
                </span>
                <span className="text-rl-text-muted">·</span>
                <span className="rl-readout text-rl-text-3">{r.turn.timestamp}</span>
              </div>
              <p className="text-sm leading-relaxed text-rl-text-2">
                {highlight(r.turn.text, query.trim())}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
