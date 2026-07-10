"use client";

import { useEffect, useRef, useState } from "react";
import type { Call, Moment } from "@/lib/mock/calls";
import { deriveMoments, tsToSeconds } from "@/lib/mock/calls";
import { PulseWave } from "@/components/PulseWave";

type CallStageProps = {
  call: Call;
};

const momentColor: Record<Moment["type"], string> = {
  sinal: "var(--color-rl-oxy)",
  objecao: "var(--color-rl-risk)",
  "objecao-critica": "var(--color-rl-danger)",
  preco: "var(--color-rl-prospect)",
};

const momentLabel: Record<Moment["type"], string> = {
  sinal: "Sinal de compra",
  objecao: "Objeção",
  "objecao-critica": "Objeção crítica",
  preco: "Preço / concorrente",
};

export function CallStage({ call }: CallStageProps) {
  const moments = deriveMoments(call);
  const duration = call.durationSeconds || 1;
  // Inicializa revelando a onda inteira (não coberta no primeiro paint) — só passa a
  // esvaecer o que "ainda não foi auscultado" depois que a posição real de leitura
  // é calculada (ver useEffect abaixo).
  const [headPct, setHeadPct] = useState(100);
  const [hovered, setHovered] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Cabeça de varredura viva — presa ao scroll do transcript (IntersectionObserver).
  useEffect(() => {
    const turns = Array.from(
      document.querySelectorAll<HTMLElement>("[data-turn-ts]"),
    );
    if (turns.length === 0) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let activeSeconds = 0;
    const update = () => {
      rafRef.current = null;
      // turno mais recente cuja borda superior passou da linha-gatilho (~30% do topo)
      const triggerLine = window.innerHeight * 0.32;
      let current = turns[0];
      for (const t of turns) {
        if (t.getBoundingClientRect().top <= triggerLine) current = t;
      }
      const ts = current.getAttribute("data-turn-ts") ?? "00:00";
      activeSeconds = tsToSeconds(ts);
      setHeadPct(Math.max(0, Math.min(100, (activeSeconds / duration) * 100)));
    };

    const onScroll = () => {
      if (reduce) {
        update();
        return;
      }
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [duration]);

  function jumpTo(ts: string) {
    // dispara :target (highlight) + scroll pro turno exato
    window.location.assign(`#t-${ts}`);
  }

  const hasPulse = call.pulse.length > 0;

  return (
    <div className="rl-raised rounded-rl-card bg-rl-surface-1 p-5" style={{ viewTransitionName: `pulse-${call.id}` }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-rl-text-3">Pulso da conversa</span>
        <span className="flex flex-wrap items-center gap-3 text-[11px] text-rl-text-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-oxy" /> {call.closer.split(" ")[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rl-prospect" /> {call.prospectName.split(" ")[0]}
          </span>
        </span>
      </div>

      {/* Pulso + cabeça de varredura viva */}
      <div className="relative h-20 w-full">
        {/* gradiente de opacidade aplicado direto no stroke da onda (mask no próprio
            traço, não um véu por cima): sólido à esquerda da cabeça, esvaece à direita —
            "o que ainda não foi auscultado" some do PRÓPRIO pulso, não é coberto. */}
        <div
          className="h-20 w-full"
          style={
            hasPulse
              ? {
                  maskImage: `linear-gradient(to right, black 0%, black ${headPct}%, transparent ${Math.min(100, headPct + 14)}%)`,
                  WebkitMaskImage: `linear-gradient(to right, black 0%, black ${headPct}%, transparent ${Math.min(100, headPct + 14)}%)`,
                }
              : undefined
          }
        >
          <PulseWave segments={call.pulse} variant="large" seed={call.id} draw className="h-20 w-full" />
        </div>

        {hasPulse ? (
          <>
            {/* linha + dot da cabeça (o único glow vivo da tela) */}
            <div
              className="pointer-events-none absolute inset-y-0 w-px"
              style={{ left: `${headPct}%`, background: "var(--color-rl-oxy-trail)" }}
              aria-hidden
            />
            <div
              className="rl-live-glow pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${headPct}%`, top: "50%", background: "var(--color-rl-oxy-bright)" }}
              aria-hidden
            />
          </>
        ) : null}
      </div>

      {/* MomentTrack — trilha de eventos scrubável, mesma timeline */}
      {moments.length > 0 ? (
        <div className="mt-3">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-rl-text-3">
            {(Object.keys(momentLabel) as Moment["type"][])
              .filter((t) => moments.some((m) => m.type === t))
              .map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rotate-45" style={{ background: momentColor[t] }} />
                  {momentLabel[t]}
                </span>
              ))}
          </div>

          <div className="relative h-2.5 w-full rounded-full bg-rl-inset">
            {moments.map((m, i) => {
              const left = Math.max(0, Math.min(100, (m.tSeconds / duration) * 100));
              // clamp de borda — tick perto de 0%/100% não pode transbordar a viewport do card
              const edgeLeft = left < 15;
              const edgeRight = left > 85;
              const popoverAnchor = edgeLeft
                ? "left-0 translate-x-0"
                : edgeRight
                  ? "right-0 left-auto translate-x-0"
                  : "left-1/2 -translate-x-1/2";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpTo(m.atTimestamp)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  className="absolute top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ left: `${left}%` }}
                  aria-label={`${momentLabel[m.type]} em ${m.atTimestamp}`}
                >
                  <span
                    className="h-2.5 w-2.5 rotate-45 rounded-[2px] border border-rl-canvas transition-transform hover:scale-125"
                    style={{ background: momentColor[m.type] }}
                  />
                  {hovered === i ? (
                    <span
                      className={`rl-raised absolute bottom-[calc(100%+10px)] z-10 w-56 rounded-rl-card bg-rl-surface-3 px-3 py-2 text-left ${popoverAnchor}`}
                    >
                      <span className="rl-readout mb-1 flex items-center gap-1.5 text-[10px]" style={{ color: momentColor[m.type] }}>
                        <span className="h-1.5 w-1.5 rotate-45" style={{ background: momentColor[m.type] }} />
                        {momentLabel[m.type]} · {m.atTimestamp}
                      </span>
                      <span className="block text-[11px] leading-snug text-rl-text-2">&ldquo;{m.quote}&rdquo;</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex justify-between text-[10px] text-rl-text-muted">
        <span className="rl-readout">00:00</span>
        <span className="rl-readout">{call.durationLabel}</span>
      </div>
    </div>
  );
}
