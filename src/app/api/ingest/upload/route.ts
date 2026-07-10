import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseTranscript } from "@/lib/ingest/parse-transcript";
import { NormalizedTranscriptSchema } from "@/lib/ingest/types";
import { allowedEmailDomain, isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Ingestão via upload/colar — o adaptador mais rápido de transcrição
// enquanto a captura automática do Meet não existe. Aceita multipart
// form-data com:
//   - content: texto colado (ou)
//   - file: arquivo .txt/.vtt
//   - title: título da call (obrigatório)
//   - startedAt: ISO 8601 opcional (default = agora)
//
// Sempre valida com Zod e roda o parser puro. Se o Supabase estiver
// configurado, grava a call + segmentos e enfileira o job de análise
// (idempotente por meetingId). Sem Supabase, responde 200 com um preview do
// NormalizedTranscript — dá pra testar o parser sem banco nenhum.

const RequestFieldsSchema = z.object({
  title: z.string().min(1, "título é obrigatório"),
  startedAt: z.string().datetime({ offset: true }).optional(),
});

export async function POST(request: NextRequest) {
  let content: string;
  let title: string;
  let startedAt: string | undefined;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const rawContent = form.get("content");
    const rawTitle = form.get("title");
    const rawStartedAt = form.get("startedAt");

    const fields = RequestFieldsSchema.parse({
      title: typeof rawTitle === "string" ? rawTitle : undefined,
      startedAt: typeof rawStartedAt === "string" && rawStartedAt ? rawStartedAt : undefined,
    });
    title = fields.title;
    startedAt = fields.startedAt;

    if (file instanceof File) {
      content = await file.text();
    } else if (typeof rawContent === "string" && rawContent.trim().length > 0) {
      content = rawContent;
    } else {
      return NextResponse.json(
        { error: "envie 'content' (texto colado) ou 'file' (.txt/.vtt)" },
        { status: 400 }
      );
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "dados inválidos", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "não foi possível ler o formulário" }, { status: 400 });
  }

  let transcript;
  try {
    transcript = parseTranscript({
      content,
      title,
      startedAt,
      allowedDomain: allowedEmailDomain(),
    });
    NormalizedTranscriptSchema.parse(transcript);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `falha ao parsear transcrição: ${message}` }, { status: 422 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      mode: "preview",
      message:
        "Supabase não configurado — retornando apenas o preview do parse. Configure NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY para persistir.",
      transcript,
    });
  }

  const admin = createAdminClient();

  // resolve owner_id pelo usuário autenticado (se houver sessão); nunca
  // bloqueia o upload por falta de sessão — call fica sem dono e só
  // aparece para managers (RLS).
  let ownerId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    ownerId = user?.id ?? null;
  } catch {
    ownerId = null;
  }

  // idempotência: nunca faz update/delete em call já existente — só
  // reaproveita o id se o mesmo conteúdo já tiver sido importado antes.
  const { data: existingCall, error: findError } = await admin
    .from("calls")
    .select("id, status")
    .eq("meet_meeting_id", transcript.meetingId)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: `erro ao consultar call existente: ${findError.message}` }, { status: 500 });
  }

  if (existingCall) {
    return NextResponse.json({
      mode: "persisted",
      alreadyIngested: true,
      callId: existingCall.id,
      status: existingCall.status,
      transcript,
    });
  }

  const { data: inserted, error: insertError } = await admin
    .from("calls")
    .insert({
      meet_meeting_id: transcript.meetingId,
      owner_id: ownerId,
      title: transcript.title,
      started_at: transcript.startedAt,
      duration_s: transcript.durationS ?? null,
      participants: transcript.participants,
      status: "ingested",
      source: "upload",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: `erro ao criar call: ${insertError?.message ?? "desconhecido"}` },
      { status: 500 }
    );
  }

  const callId = inserted.id as string;

  if (transcript.segments.length > 0) {
    const { error: segmentsError } = await admin.from("transcript_segments").insert(
      transcript.segments.map((seg, idx) => ({
        call_id: callId,
        speaker_name: seg.speakerName,
        speaker_email: seg.speakerEmail ?? null,
        text: seg.text,
        start_ms: seg.startMs,
        end_ms: seg.endMs,
        seq: idx,
      }))
    );
    if (segmentsError) {
      return NextResponse.json(
        { error: `call criada, mas falha ao gravar segmentos: ${segmentsError.message}`, callId },
        { status: 500 }
      );
    }
  }

  const { error: jobError } = await admin.from("jobs").insert({
    type: "analyze_call",
    call_id: callId,
    status: "pending",
  });
  if (jobError) {
    return NextResponse.json(
      { error: `call criada, mas falha ao enfileirar job de análise: ${jobError.message}`, callId },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mode: "persisted",
    alreadyIngested: false,
    callId,
    status: "ingested",
    transcript,
  });
}
