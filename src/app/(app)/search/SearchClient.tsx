"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { calls, type TranscriptTurn } from "@/lib/mock/calls";
import { Kbd } from "@/components/Kbd";

type Result = {
  callId: string;
  account: string;
  turn: TranscriptTurn;
};

const SUGGESTIONS = ["objeção de preço", "menção a concorrente", "sinal de compra", "orçamento", "CTO"];

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

function OximeterGlyph() {
  return (
    <svg width="180" height="44" viewBox="0 0 180 44" fill="none" aria-hidden className="text-rl-text-muted">
      <path
        d="M0 22h40l6-14 8 28 7-20 5 10 6-4h30l6-10 8 20 6-12 5 6h34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const listRef = useRef<HTMLDivElement | null>(null);

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

  function onKeyDown(e: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-result]") ?? []);
    if (rows.length === 0) return;
    const idx = rows.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
    const target = rows[Math.max(0, Math.min(rows.length - 1, next < 0 ? 0 : next))];
    if (target) {
      e.preventDefault();
      target.focus();
    }
  }

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
          placeholder="Ausculte suas calls — trechos, objeções, contas…"
          className="w-full bg-transparent text-base text-rl-text placeholder:text-rl-text-muted focus:outline-none"
        />
      </div>

      {!hasQuery && (
        <div className="mt-20 flex flex-col items-center gap-5 text-center">
          <OximeterGlyph />
          <h2 className="rl-display text-3xl text-rl-text-2">AUSCULTE SUAS CALLS</h2>
          <p className="max-w-sm text-sm text-rl-text-3">
            Cada trecho é um recibo — a busca pula direto pro segundo exato do transcript.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="rl-press rounded-rl-control border border-rl-border bg-rl-surface-1 px-3 py-1.5 text-xs text-rl-text-2 transition-colors hover:border-rl-oxy/40 hover:text-rl-text"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-rl-text-muted">
            ou abra a paleta com <Kbd>⌘K</Kbd>
          </p>
        </div>
      )}

      {hasQuery && results.length === 0 && (
        <div className="mt-24 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-rl-text-2">
            Nenhum trecho com &ldquo;{query.trim()}&rdquo;.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-rl-text-3">
            Refine o termo ou use <Kbd>⌘K</Kbd> pra buscar de outra tela.
          </p>
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="mt-8 flex flex-col gap-2" ref={listRef} onKeyDown={onKeyDown}>
          <div className="mb-1 rl-readout text-xs text-rl-text-3">
            {results.length} recibo{results.length > 1 ? "s" : ""}
          </div>
          {results.map((r, i) => (
            <Link
              key={i}
              data-result=""
              href={`/calls/${r.callId}#t-${r.turn.timestamp}`}
              className="group rounded-rl-card border border-rl-border bg-rl-surface-1 px-4 py-3.5 outline-none transition-colors hover:bg-rl-surface-2 focus-visible:bg-rl-surface-2"
            >
              <div className="mb-1.5 flex items-center gap-2 text-xs">
                <span className="font-medium text-rl-text">{r.account}</span>
                <span className="text-rl-text-muted">·</span>
                <span className={r.turn.speaker === "rep" ? "text-rl-oxy" : "text-rl-prospect"}>
                  {r.turn.speakerName}
                </span>
                <span className="text-rl-text-muted">·</span>
                <span className="rl-readout text-rl-text-3">{r.turn.timestamp}</span>
                <span className="ml-auto rl-readout text-[11px] text-rl-oxy opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  ir pro turno ›
                </span>
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
