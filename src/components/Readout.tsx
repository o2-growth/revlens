"use client";

import { useCountUp } from "@/lib/useCountUp";

type Tone = "oxy" | "risk" | "danger" | "prospect" | "text" | "text-2" | "text-3";

const toneClass: Record<Tone, string> = {
  oxy: "text-rl-oxy",
  risk: "text-rl-risk",
  danger: "text-rl-danger",
  prospect: "text-rl-prospect",
  text: "text-rl-text",
  "text-2": "text-rl-text-2",
  "text-3": "text-rl-text-3",
};

type ReadoutProps = {
  value: number;
  unit?: string;
  /** prefixo rebaixado (ex.: "R$ ") — mesma escala da unidade */
  prefix?: string;
  tone?: Tone;
  /** desliga o count-up (ex.: quando não é medição-herói) */
  animate?: boolean;
  decimals?: number;
  /** valor estático quando animate=false ou pra strings não-numéricas */
  className?: string;
  hero?: boolean;
  /** stagger de orquestração — cascateia o início do count-up (herói primeiro, ~60-80ms/item) */
  delayMs?: number;
};

/** Valor de medição em mono + unidade/prefixo rebaixado (0.62em, text-3). */
export function Readout({
  value,
  unit,
  prefix,
  tone = "text",
  animate = true,
  decimals = 0,
  className = "",
  hero = false,
  delayMs = 0,
}: ReadoutProps) {
  const { value: counted, ref } = useCountUp(value, { decimals, delayMs });
  const shown = animate ? counted : value;
  const base = hero ? "rl-readout-hero" : "rl-readout";

  return (
    <span ref={ref} className={`${base} ${toneClass[tone]} rl-measuring ${className}`}>
      {prefix ? (
        <span className="mr-px align-baseline text-[0.62em] text-rl-text-3">{prefix.trim()}</span>
      ) : null}
      {shown.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {unit ? (
        <span className="ml-px align-baseline text-[0.62em] text-rl-text-3">{unit}</span>
      ) : null}
    </span>
  );
}
