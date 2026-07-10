"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "oxy" | "neutral" | "danger" };

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
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3200);
    };
    window.addEventListener("rl-toast", onToast);
    return () => window.removeEventListener("rl-toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rl-toast rl-raised pointer-events-auto flex items-center gap-2.5 rounded-rl-control bg-rl-surface-3 px-4 py-2.5 text-sm text-rl-text shadow-lg"
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
