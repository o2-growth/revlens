"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { NormalizedTranscript } from "@/lib/ingest/types";

type UploadResponse = {
  mode: "preview" | "persisted";
  message?: string;
  alreadyIngested?: boolean;
  callId?: string;
  status?: string;
  transcript?: NormalizedTranscript;
  error?: string;
};

function mmss(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ImportClient() {
  const [title, setTitle] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.set("title", title || "Call importada");
      if (startedAt) form.set("startedAt", new Date(startedAt).toISOString());

      const file = fileRef.current?.files?.[0];
      if (file) {
        form.set("file", file);
      } else if (content.trim()) {
        form.set("content", content);
      } else {
        setError("Cole o texto da transcrição ou selecione um arquivo (.txt/.vtt).");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/ingest/upload", { method: "POST", body: form });
      const data = (await res.json()) as UploadResponse;

      if (!res.ok) {
        setError(data.error ?? `Falha ao importar (HTTP ${res.status}).`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao importar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-rl-text-3">Título da call</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Descoberta — Acme Corp"
                className="rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2 text-sm text-rl-text outline-none transition-colors focus:border-rl-border-strong"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-rl-text-3">Data/hora (opcional)</span>
              <input
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="rounded-rl-control border border-rl-border bg-rl-inset px-3 py-2 text-sm text-rl-text outline-none transition-colors focus:border-rl-border-strong"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-rl-text-3">
              Colar transcrição — aceita &quot;Nome (mm:ss) texto&quot;, &quot;Nome: texto&quot; ou WebVTT
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder={"Ana Ribeiro (00:00) Boa tarde, obrigada por aceitar a call.\nCarlos Menezes (00:14) Perfeito, pode seguir."}
              className="rl-readout resize-none rounded-rl-card border border-rl-border bg-rl-inset px-3 py-2.5 text-sm text-rl-text outline-none transition-colors focus:border-rl-border-strong"
            />
          </label>

          <div className="flex items-center gap-3">
            <span className="text-xs text-rl-text-3">ou envie um arquivo</span>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.vtt,text/vtt,text/plain"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="text-xs text-rl-text-2 file:mr-3 file:rounded-rl-control file:border file:border-rl-border file:bg-rl-surface-1 file:px-3 file:py-1.5 file:text-xs file:text-rl-text-2 hover:file:border-rl-border-strong"
            />
            {fileName ? <span className="text-xs text-rl-text-3">{fileName}</span> : null}
          </div>

          {error ? (
            <div className="rounded-rl-control border border-rl-danger/40 bg-rl-danger-dim px-3 py-2 text-xs text-rl-danger">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="rl-press w-fit rounded-rl-control border border-rl-oxy/50 bg-rl-oxy-dim px-4 py-2 text-sm text-rl-oxy transition-colors hover:border-rl-oxy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Importando…" : "Importar transcrição"}
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {!result && !error ? (
            <div className="rounded-rl-card border border-dashed border-rl-border px-4 py-8 text-center text-sm text-rl-text-3">
              O resultado do parse (ou a call criada) aparece aqui.
            </div>
          ) : null}

          {result ? (
            <div className="rounded-rl-card border border-rl-border bg-rl-surface-1 p-4">
              {result.mode === "preview" ? (
                <div className="mb-3 rounded-rl-control border border-rl-border-strong bg-rl-surface-2 px-3 py-2 text-xs text-rl-text-2">
                  {result.message ?? "Modo demo — supabase não configurado. Mostrando só o preview do parse."}
                </div>
              ) : (
                <div className="mb-3 rounded-rl-control border border-rl-oxy/40 bg-rl-oxy-dim px-3 py-2 text-xs text-rl-oxy">
                  {result.alreadyIngested
                    ? "Essa transcrição já tinha sido importada — reaproveitando a call existente."
                    : "Call criada e job de análise enfileirado."}{" "}
                  {result.callId ? (
                    <Link href={`/calls/${result.callId}`} className="underline underline-offset-2">
                      Ver call →
                    </Link>
                  ) : null}
                </div>
              )}

              {result.transcript ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-rl-text-3">Título</div>
                    <div className="text-sm text-rl-text">{result.transcript.title}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-rl-text-3">Participantes</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {result.transcript.participants.map((p) => (
                        <span
                          key={p.name}
                          className="rounded-rl-control border border-rl-border px-2 py-0.5 text-xs text-rl-text-2"
                        >
                          {p.name}
                          {p.internal ? " · interno" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-rl-text-3">
                      {result.transcript.segments.length} falas
                    </div>
                    <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                      {result.transcript.segments.map((seg, i) => (
                        <div key={i} className="rl-readout text-xs">
                          <span className="text-rl-text-3">[{mmss(seg.startMs)}]</span>{" "}
                          <span className="text-rl-oxy">{seg.speakerName}:</span>{" "}
                          <span className="text-rl-text-2">{seg.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
