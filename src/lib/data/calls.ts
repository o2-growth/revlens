import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  calls as mockCalls,
  getCallById as getMockCallById,
  closers as mockClosers,
  type Call,
  type Objection,
  type NextStep,
  type TranscriptTurn,
} from "@/lib/mock/calls";

// Camada de dados: se o Supabase estiver configurado, lê do banco (RLS
// aplica o filtro closer/manager); senão, cai de volta nos mocks (modo
// demo). As páginas devem importar `listCalls`/`getCall` DAQUI em vez de
// `@/lib/mock/calls` diretamente, mas continuam recebendo o mesmo tipo
// `Call` — nenhum componente visual precisa mudar.
//
// Observação: campos que hoje só existem como "inteligência" calculada nos
// mocks (sentimento, sinais de compra, pulso, monólogos) ainda não são
// produzidos pelo pipeline de IA real (fora do escopo desta Fase 1 — ver
// docs/BACKEND.md). Quando vêm do banco, esses campos ficam com defaults
// neutros em vez de quebrar a tela.

export { tsToSeconds, deriveMoments } from "@/lib/mock/calls";
export type { Call, CallStatus, Objection, NextStep, TranscriptTurn } from "@/lib/mock/calls";

function mmss(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const dd = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hh = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dd} ${hh}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type DbCallRow = {
  id: string;
  title: string;
  started_at: string;
  duration_s: number | null;
  participants: Array<{ name: string; email?: string; internal: boolean }> | null;
  status: string;
  outcome: string | null;
  deal_value: number | null;
  owner_id: string | null;
};

type DbAnalysisRow = {
  call_id: string;
  summary: string | null;
  key_points: unknown;
  objections: unknown;
  next_steps: unknown;
  talk_ratio: Record<string, number> | null;
} | null;

type DbSegmentRow = {
  speaker_name: string;
  speaker_email: string | null;
  text: string;
  start_ms: number;
  end_ms: number;
};

function mapAnalysisArray<T>(raw: unknown, map: (item: string, idx: number) => T): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => map(String(item), idx));
}

function toCall(
  row: DbCallRow,
  analysis: DbAnalysisRow,
  segments: DbSegmentRow[],
  ownerName: string | null
): Call {
  const participants = row.participants ?? [];
  const external = participants.find((p) => !p.internal) ?? participants[0];
  const internalNames = participants.filter((p) => p.internal).map((p) => p.email ?? p.name);

  const talkRatio = analysis?.talk_ratio ?? {};
  const talkRatioRep = internalNames.length
    ? Math.round(internalNames.reduce((sum, key) => sum + (talkRatio[key] ?? 0), 0))
    : 0;

  const objections: Objection[] = mapAnalysisArray(analysis?.objections, (text) => ({
    text,
    severity: "risco",
  }));
  const nextSteps: NextStep[] = mapAnalysisArray(analysis?.next_steps, (text) => ({
    text,
    done: false,
    owner: ownerName ?? "",
  }));
  const keyPoints = mapAnalysisArray(analysis?.key_points, (text) => text);

  const transcript: TranscriptTurn[] = segments.map((seg) => ({
    speaker: seg.speaker_email && internalNames.includes(seg.speaker_email) ? "rep" : "prospect",
    speakerName: seg.speaker_name,
    timestamp: mmss(seg.start_ms),
    text: seg.text,
  }));

  const closerName = ownerName ?? "Sem dono";

  return {
    id: row.id,
    account: row.title,
    prospectName: external?.name ?? "Prospect",
    prospectRole: "",
    closer: closerName,
    closerInitials: initialsOf(closerName),
    date: row.started_at,
    dateLabel: formatDateLabel(row.started_at),
    durationLabel: mmss((row.duration_s ?? 0) * 1000),
    durationSeconds: row.duration_s ?? 0,
    status: row.status === "ready" ? "pronto" : "processando",
    talkRatioRep,
    sentiment: "neutro",
    sentimentScore: 0,
    objectionsCount: objections.length,
    buyingSignalsCount: 0,
    signal: null,
    outcome: (row.outcome as Call["outcome"]) ?? "aberto",
    pulse: [],
    longestMonologueSec: 0,
    questionsPerHour: 0,
    dealValue: row.deal_value ?? undefined,
    summary: analysis?.summary ?? undefined,
    keyPoints,
    objections,
    buyingSignalDetails: [],
    nextSteps,
    transcript,
  };
}

export async function listCalls(): Promise<Call[]> {
  if (!isSupabaseConfigured()) return mockCalls;

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("calls")
    .select("id, title, started_at, duration_s, participants, status, outcome, deal_value, owner_id")
    .order("started_at", { ascending: false });

  if (error || !rows) return mockCalls;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [{ data: analyses }, { data: profiles }] = await Promise.all([
    supabase.from("call_analyses").select("call_id, summary, key_points, objections, next_steps, talk_ratio").in("call_id", ids),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const analysesByCall = new Map((analyses ?? []).map((a) => [a.call_id, a as DbAnalysisRow]));
  const namesByOwner = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]));

  return rows.map((row) =>
    toCall(row as DbCallRow, analysesByCall.get(row.id) ?? null, [], row.owner_id ? namesByOwner.get(row.owner_id) ?? null : null)
  );
}

export async function getCall(id: string): Promise<Call | undefined> {
  if (!isSupabaseConfigured()) return getMockCallById(id);

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("calls")
    .select("id, title, started_at, duration_s, participants, status, outcome, deal_value, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) return getMockCallById(id);

  const [{ data: analysis }, { data: segments }, ownerName] = await Promise.all([
    supabase
      .from("call_analyses")
      .select("call_id, summary, key_points, objections, next_steps, talk_ratio")
      .eq("call_id", id)
      .maybeSingle(),
    supabase
      .from("transcript_segments")
      .select("speaker_name, speaker_email, text, start_ms, end_ms")
      .eq("call_id", id)
      .order("start_ms", { ascending: true }),
    row.owner_id
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", row.owner_id)
          .maybeSingle()
          .then((r) => r.data?.full_name || r.data?.email || null)
      : Promise.resolve(null),
  ]);

  return toCall(row as DbCallRow, (analysis as DbAnalysisRow) ?? null, segments ?? [], ownerName);
}

export async function listClosers(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockClosers;
  const list = await listCalls();
  return Array.from(new Set(list.map((c) => c.closer)));
}
