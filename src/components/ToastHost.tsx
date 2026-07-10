"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "oxy" | "neutral" | "danger"; leaving?: boolean };

/** Dispara um toast de qualquer lugar: window.dispatchEvent(new CustomEvent("rl-toast", { detail })) */
export function toast(message: string, tone: Toast["tone"] = "oxy") {
  window.dispatchEvent(new CustomEvent("rl-toast", { detail: { message, tone } }));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; tone?: Toast["tone"] };
      const id = ++counter;
      setToasts((t) => [...t, { id, message: detail.message, tone: detail.tone ?? "oxy" }]);
      // marca "saindo" antes de desmontar — recua com rl-toast-out em vez de sumir seco
      window.setTimeout(() => {
        setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
      }, 2800);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3000);
    };
    window.addEventListener("rl-toast", onToast);
    return () => window.removeEventListener("rl-toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rl-raised pointer-events-auto flex items-center gap-2.5 rounded-rl-control bg-rl-surface-3 px-4 py-2.5 text-sm text-rl-text shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)] ${
            t.leaving ? "rl-toast-out" : "rl-toast"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              t.tone === "oxy" ? "bg-rl-oxy" : t.tone === "danger" ? "bg-rl-danger" : "bg-rl-text-3"
            }`}
          />
          {t.message}
        </div>
      ))}
    </div>
  );
}
