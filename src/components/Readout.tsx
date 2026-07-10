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
  tone?: Tone;
  /** desliga o count-up (ex.: quando não é medição-herói) */
  animate?: boolean;
  decimals?: number;
  /** valor estático quando animate=false ou pra strings não-numéricas */
  className?: string;
  hero?: boolean;
};

/** Valor de medição em mono + unidade rebaixada (0.62em, text-3). */
export function Readout({
  value,
  unit,
  tone = "text",
  animate = true,
  decimals = 0,
  className = "",
  hero = false,
}: ReadoutProps) {
  const { value: counted, ref } = useCountUp(value, { decimals });
  const shown = animate ? counted : value;
  const base = hero ? "rl-readout-hero" : "rl-readout";

  return (
    <span ref={ref} className={`${base} ${toneClass[tone]} rl-measuring ${className}`}>
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
