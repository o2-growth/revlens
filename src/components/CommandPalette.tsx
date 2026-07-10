"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { calls } from "@/lib/mock/calls";
import { Kbd } from "@/components/Kbd";
import { Sparkline } from "@/components/Sparkline";
import { toast } from "@/components/ToastHost";

type Item = {
  key: string;
  label: string;
  hint?: string;
  kbd?: string;
  sparkData?: number[];
  run: () => void;
};

type Section = { title: string; items: Item[] };

const PLACEHOLDERS = [
  "Buscar call, conta ou trecho…",
  "Tente: objeção de preço",
  "Tente: Nortex",
  "Tente: menção a concorrente",
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [phIndex, setPhIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // abrir/fechar via ⌘K / Ctrl+K + evento do Topbar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("rl-open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("rl-open-command", onOpen);
    };
  }, []);

  // reset ao abrir + placeholder rotativo
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setQuery("");
        setActive(0);
      });
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (open) return;
    const id = window.setInterval(() => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => window.clearInterval(id);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const sections: Section[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => s.toLowerCase().includes(q);

    const nav: Item[] = [
      { key: "nav-painel", label: "Painel", hint: "Sala de comando", run: () => go("/") },
      { key: "nav-calls", label: "Calls", hint: "Mural de operação", run: () => go("/calls") },
      { key: "nav-busca", label: "Busca", hint: "Auscultar trechos", run: () => go("/search") },
    ].filter((i) => !q || match(i.label) || match(i.hint ?? ""));

    const callItems: Item[] = calls
      .filter((c) => !q || match(c.account) || match(c.prospectName) || match(c.closer))
      .slice(0, 6)
      .map((c) => ({
        key: `call-${c.id}`,
        label: c.account,
        hint: `${c.prospectName} · ${c.closer}`,
        kbd: c.dateLabel,
        sparkData: c.talkRatioByMinute,
        run: () => go(`/calls/${c.id}`),
      }));

    const searchItems: Item[] = q
      ? [
          {
            key: "search-q",
            label: `Buscar "${query.trim()}" nas transcrições`,
            hint: "Abre a Busca com o termo",
            run: () => go(`/search?q=${encodeURIComponent(query.trim())}`),
          },
        ]
      : [];

    const actions: Item[] = [
      {
        key: "act-followup",
        label: "Copiar follow-up",
        hint: "Rascunho a partir da última call",
        run: () => {
          setOpen(false);
          navigator.clipboard
            ?.writeText(
              "Oi! Ótimo falar com você hoje. Seguindo o combinado, envio os próximos passos e fico à disposição.",
            )
            .catch(() => {});
          toast("Follow-up copiado para a área de transferência");
        },
      },
      { key: "act-risk", label: "Ver deals em risco", hint: "Filtra Calls por risco", run: () => go("/calls?view=risco") },
    ].filter((i) => !q || match(i.label) || match(i.hint ?? ""));

    return [
      { title: "Ir para", items: nav },
      { title: "Calls recentes", items: callItems },
      { title: "Buscar trecho", items: searchItems },
      { title: "Ações", items: actions },
    ].filter((s) => s.items.length > 0);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // lista achatada para roving focus
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const activeIdx = Math.max(0, Math.min(active, flat.length - 1));

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[activeIdx]?.run();
    }
  }

  // rolar item ativo pra vista
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  let running = -1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="rl-raised relative w-full max-w-xl overflow-hidden rounded-rl-modal bg-rl-surface-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-rl-border px-4 py-3.5">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden className="shrink-0 text-rl-text-3">
            <circle cx="7.5" cy="7.5" r="4.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder={PLACEHOLDERS[phIndex]}
            className="w-full bg-transparent text-base text-rl-text placeholder:text-rl-text-muted focus:outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-rl-text-3">
              Nenhum comando para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.title} className="mb-1">
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-rl-text-3">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  running += 1;
                  const idx = running;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={item.key}
                      data-idx={idx}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={item.run}
                      className={`relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? "bg-rl-surface-2" : "hover:bg-rl-surface-2/50"
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-rl-oxy" aria-hidden />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-rl-text">{item.label}</div>
                        {item.hint ? (
                          <div className="truncate text-[11px] text-rl-text-3">{item.hint}</div>
                        ) : null}
                      </div>
                      {item.sparkData ? (
                        <div className="hidden h-4 w-16 shrink-0 sm:block">
                          <Sparkline data={item.sparkData} domain={[30, 90]} tone="oxy" height={16} />
                        </div>
                      ) : null}
                      {item.kbd ? (
                        <span className="rl-readout shrink-0 text-[10px] text-rl-text-3">{item.kbd}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-rl-border px-4 py-2.5 text-[10px] text-rl-text-3">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navegar</span>
          <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> abrir</span>
          <span className="flex items-center gap-1.5"><Kbd>esc</Kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
