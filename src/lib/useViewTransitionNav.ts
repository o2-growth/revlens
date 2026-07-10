"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

type StartViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

/**
 * Navegação com morph de View Transitions (progressive enhancement).
 * Envolve router.push em document.startViewTransition quando o browser suporta —
 * é o que faz o pulse-<id> (CallLogRow → CallStage) voar da linha pro palco.
 * Sem suporte (ou reduced-motion), cai de volta pra navegação normal.
 */
export function useViewTransitionNav() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      const doc = typeof document !== "undefined" ? (document as StartViewTransitionDocument) : undefined;
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      if (doc?.startViewTransition && !reduce) {
        doc.startViewTransition(() => {
          router.push(href);
        });
      } else {
        router.push(href);
      }
    },
    [router],
  );
}
