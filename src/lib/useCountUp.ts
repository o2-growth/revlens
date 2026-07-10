"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Odômetro — conta de 0 até `target` com easing outExpo.
 * Respeita prefers-reduced-motion (seta o valor final direto).
 * Dispara uma vez, quando o elemento entra na viewport.
 *
 * Orquestração (evita o "dashboard epilético" de N count-ups disparando juntos):
 * - `delayMs` cascateia o início a partir do momento em que o elemento entra na
 *   viewport — o chamador passa um offset (ex.: índice * 70ms, herói primeiro).
 * - Inteiros pequenos (decimals=0, |target|<10) pulam a animação: 0→1→2 num
 *   piscar é ruído, não deleite. Assenta direto no valor final.
 */
export function useCountUp(
  target: number,
  { duration = 700, decimals = 0, delayMs = 0 }: { duration?: number; decimals?: number; delayMs?: number } = {},
) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const isSmallInt = decimals === 0 && Math.abs(target) < 10;

    const animate = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(2, -10 * t); // outExpo
        const factor = Math.pow(10, decimals);
        setValue(Math.round(target * eased * factor) / factor);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    };

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (reduce || isSmallInt) {
        setValue(target);
        return;
      }
      if (delayMs > 0) window.setTimeout(animate, delayMs);
      else animate();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration, decimals, delayMs]);

  return { value, ref };
}
