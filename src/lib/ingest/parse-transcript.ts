import { createHash } from "node:crypto";
import {
  type NormalizedTranscript,
  NormalizedTranscriptSchema,
  type Participant,
  type TranscriptSegment,
} from "./types";

// Parser PURO (sem I/O) dos formatos de transcrição que sabemos aceitar
// hoje via upload/colar:
//
//   (a) Estilo Google Docs/Meet "colar texto":
//       "Nome (mm:ss) texto"      — timestamp entre parênteses
//       "Nome: texto"             — sem timestamp (cronometramos nós)
//       linhas seguintes sem esses padrões são continuação da fala anterior
//
//   (b) WebVTT (.vtt) com cues `HH:MM:SS.mmm --> HH:MM:SS.mmm` e, quando
//       disponível, tag de voz `<v Nome do Falante>texto`.
//
// Detecta o formato automaticamente e produz um NormalizedTranscript.

export type ParseTranscriptInput = {
  /** conteúdo bruto colado ou lido do arquivo (.txt ou .vtt) */
  content: string;
  title: string;
  /** ISO 8601; default = agora, no momento do parse */
  startedAt?: string;
  /** id estável da call; default = hash do conteúdo (upload idempotente) */
  meetingId?: string;
  /** domínio de e-mail da empresa, para marcar participantes internos */
  allowedDomain?: string | null;
};

const DOCS_HEADER_WITH_TS = /^(.{1,100}?)\s*\((\d{1,2}):(\d{2})\)\s*(.*)$/;
const DOCS_HEADER_NO_TS = /^([^:()\n]{1,80}):\s+(.*)$/;
const VTT_CUE_TIMING = /(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})/;
const VTT_VOICE_TAG = /^<v\s+([^>]+)>\s*/;

export function detectTranscriptFormat(content: string): "vtt" | "docs" {
  return /^\s*WEBVTT/.test(content) ? "vtt" : "docs";
}

function contentHash(content: string): string {
  return "upload:" + createHash("sha256").update(content).digest("hex").slice(0, 32);
}

function domainOf(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function buildParticipants(
  segments: TranscriptSegment[],
  allowedDomain?: string | null
): Participant[] {
  const byName = new Map<string, Participant>();
  for (const seg of segments) {
    if (byName.has(seg.speakerName)) continue;
    const internal = Boolean(
      seg.speakerEmail && allowedDomain && domainOf(seg.speakerEmail) === allowedDomain.toLowerCase()
    );
    byName.set(seg.speakerName, {
      name: seg.speakerName,
      email: seg.speakerEmail,
      internal,
    });
  }
  return Array.from(byName.values());
}

// ---------------------------------------------------------------------
// (a) formato "colar texto" (estilo Google Docs/Meet)
// ---------------------------------------------------------------------

function parseDocsStyle(content: string): TranscriptSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: TranscriptSegment[] = [];

  // Índice de fala sem timestamp explícito — usado para cronometrar
  // sinteticamente e garantir ordenação estável.
  let syntheticIndex = 0;
  const SYNTHETIC_SLOT_MS = 5000;
  const SYNTHETIC_SPAN_MS = 4500;

  let current: TranscriptSegment | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const withTs = line.match(DOCS_HEADER_WITH_TS);
    if (withTs) {
      const [, name, mm, ss, rest] = withTs;
      const startMs = (Number(mm) * 60 + Number(ss)) * 1000;
      current = {
        speakerName: name.trim(),
        text: rest.trim(),
        startMs,
        // fechado quando a próxima fala do mesmo bloco chegar ou no fim
        endMs: startMs + SYNTHETIC_SPAN_MS,
      };
      if (current.text.length > 0) segments.push(current);
      else segments.push(current); // texto vem em linhas seguintes; ajustado ao concatenar
      continue;
    }

    const noTs = line.match(DOCS_HEADER_NO_TS);
    if (noTs) {
      const [, name, rest] = noTs;
      const startMs = syntheticIndex * SYNTHETIC_SLOT_MS;
      syntheticIndex += 1;
      current = {
        speakerName: name.trim(),
        text: rest.trim(),
        startMs,
        endMs: startMs + SYNTHETIC_SPAN_MS,
      };
      segments.push(current);
      continue;
    }

    // continuação da fala anterior (linha sem cabeçalho reconhecido)
    if (current) {
      current.text = current.text.length > 0 ? `${current.text} ${line}` : line;
    }
    // se não há segmento corrente ainda, a linha é descartada (preâmbulo)
  }

  return segments.filter((s) => s.text.trim().length > 0);
}

// ---------------------------------------------------------------------
// (b) WebVTT
// ---------------------------------------------------------------------

function vttTimeToMs(h: string | undefined, m: string, s: string, ms: string): number {
  const hours = h ? Number(h) : 0;
  return ((hours * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(ms);
}

function parseVtt(content: string): TranscriptSegment[] {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  const segments: TranscriptSegment[] = [];
  let lastSpeaker = "Falante";

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const timingIdx = lines.findIndex((l) => VTT_CUE_TIMING.test(l));
    if (timingIdx === -1) continue; // cabeçalho "WEBVTT" ou bloco sem timing

    const timingMatch = lines[timingIdx].match(VTT_CUE_TIMING)!;
    const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = timingMatch;
    const startMs = vttTimeToMs(h1, m1, s1, ms1);
    const endMs = vttTimeToMs(h2, m2, s2, ms2);

    const textLines = lines.slice(timingIdx + 1);
    if (textLines.length === 0) continue;

    let text = textLines.join(" ");
    const voiceMatch = text.match(VTT_VOICE_TAG);
    let speakerName = lastSpeaker;
    if (voiceMatch) {
      speakerName = voiceMatch[1].trim();
      text = text.slice(voiceMatch[0].length);
      lastSpeaker = speakerName;
    }
    text = text.replace(/<\/?[^>]+>/g, "").trim();
    if (!text) continue;

    segments.push({ speakerName, text, startMs, endMs });
  }

  return segments;
}

// ---------------------------------------------------------------------
// entrypoint
// ---------------------------------------------------------------------

export function parseTranscript(input: ParseTranscriptInput): NormalizedTranscript {
  const format = detectTranscriptFormat(input.content);
  const segments =
    format === "vtt" ? parseVtt(input.content) : parseDocsStyle(input.content);

  const sorted = [...segments].sort((a, b) => a.startMs - b.startMs);

  const startedAt = input.startedAt ?? new Date().toISOString();
  const lastEnd = sorted.length > 0 ? Math.max(...sorted.map((s) => s.endMs)) : 0;

  const transcript: NormalizedTranscript = {
    meetingId: input.meetingId ?? contentHash(input.content),
    title: input.title,
    startedAt,
    durationS: Math.round(lastEnd / 1000),
    participants: buildParticipants(sorted, input.allowedDomain),
    segments: sorted,
  };

  return NormalizedTranscriptSchema.parse(transcript);
}
