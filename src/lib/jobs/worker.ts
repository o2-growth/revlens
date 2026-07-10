import { createAdminClient } from "@/lib/supabase/admin";
import { isGeminiConfigured, isSupabaseConfigured } from "@/lib/config";
import { analyzeCall, computeTalkRatio } from "@/lib/ai/analyze";
import { embedCall } from "@/lib/ai/embeddings";
import type { NormalizedTranscript, TranscriptSegment } from "@/lib/ingest/types";

const MAX_ATTEMPTS_DEFAULT = 3;

export type WorkerRunResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: boolean;
  reason?: string;
};

// Reconstrói um NormalizedTranscript a partir do que está gravado no banco,
// para reaproveitar as funções puras de análise/embeddings sem duplicar
// lógica.
function toNormalizedTranscript(
  call: { id: string; title: string; started_at: string },
  segments: Array<{
    speaker_name: string;
    speaker_email: string | null;
    text: string;
    start_ms: number;
    end_ms: number;
  }>
): NormalizedTranscript {
  const normalizedSegments: TranscriptSegment[] = segments.map((s) => ({
    speakerName: s.speaker_name,
    speakerEmail: s.speaker_email ?? undefined,
    text: s.text,
    startMs: s.start_ms,
    endMs: s.end_ms,
  }));

  return {
    meetingId: call.id,
    title: call.title,
    startedAt: call.started_at,
    participants: [],
    segments: normalizedSegments,
  };
}

// Processa até `limit` jobs pendentes (`type = 'analyze_call'`): roda
// analyzeCall + embedCall, grava call_analyses + call_embeddings, marca a
// call como 'ready' (ou 'failed' após esgotar as tentativas). Usa service
// role — bypassa RLS de propósito (worker é infra, não usuário).
export async function runPendingJobs(limit = 5): Promise<WorkerRunResult> {
  if (!isSupabaseConfigured()) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: true, reason: "supabase_not_configured" };
  }
  if (!isGeminiConfigured()) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: true, reason: "gemini_not_configured" };
  }

  const supabase = createAdminClient();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, call_id, attempts, max_attempts")
    .eq("status", "pending")
    .eq("type", "analyze_call")
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (jobsError) throw jobsError;
  if (!jobs || jobs.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: false };
  }

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    await supabase.from("jobs").update({ status: "processing" }).eq("id", job.id);

    try {
      if (!job.call_id) throw new Error("job sem call_id");

      const { data: call, error: callError } = await supabase
        .from("calls")
        .select("id, title, started_at")
        .eq("id", job.call_id)
        .single();
      if (callError || !call) throw callError ?? new Error("call não encontrada");

      const { data: segments, error: segmentsError } = await supabase
        .from("transcript_segments")
        .select("speaker_name, speaker_email, text, start_ms, end_ms")
        .eq("call_id", job.call_id)
        .order("start_ms", { ascending: true });
      if (segmentsError) throw segmentsError;

      const transcript = toNormalizedTranscript(call, segments ?? []);

      const [analysis, embeddings] = await Promise.all([
        analyzeCall(transcript),
        embedCall(transcript),
      ]);
      const talkRatio = computeTalkRatio(transcript);

      const { error: upsertError } = await supabase.from("call_analyses").upsert(
        {
          call_id: job.call_id,
          summary: analysis.summary,
          key_points: analysis.keyPoints,
          objections: analysis.objections,
          next_steps: analysis.nextSteps,
          talk_ratio: talkRatio,
          model: analysis.model,
        },
        { onConflict: "call_id" }
      );
      if (upsertError) throw upsertError;

      if (embeddings.length > 0) {
        const { error: embError } = await supabase.from("call_embeddings").insert(
          embeddings.map((e) => ({
            call_id: job.call_id,
            content: e.content,
            embedding: e.embedding,
          }))
        );
        if (embError) throw embError;
      }

      await supabase.from("calls").update({ status: "ready" }).eq("id", job.call_id);
      await supabase.from("jobs").update({ status: "done" }).eq("id", job.id);
      succeeded += 1;
    } catch (err) {
      const attempts = (job.attempts ?? 0) + 1;
      const maxAttempts = job.max_attempts ?? MAX_ATTEMPTS_DEFAULT;
      const message = err instanceof Error ? err.message : String(err);

      if (attempts >= maxAttempts) {
        await supabase
          .from("jobs")
          .update({ status: "failed", attempts, last_error: message })
          .eq("id", job.id);
        if (job.call_id) {
          await supabase.from("calls").update({ status: "failed" }).eq("id", job.call_id);
        }
      } else {
        // backoff simples: 2^attempts minutos
        const runAfter = new Date(Date.now() + Math.pow(2, attempts) * 60_000).toISOString();
        await supabase
          .from("jobs")
          .update({ status: "pending", attempts, last_error: message, run_after: runAfter })
          .eq("id", job.id);
      }
      failed += 1;
    }
  }

  return { processed: jobs.length, succeeded, failed, skipped: false };
}
