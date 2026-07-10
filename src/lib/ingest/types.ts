import { z } from "zod";

// Contrato canônico que todo adaptador de ingestão (upload/colar, e no
// futuro o Meet) tem que produzir. Nada além deste módulo conhece o formato
// de origem (Google Docs, VTT, Meet REST API...) — o resto do sistema
// (parser de IA, banco, UI) só enxerga NormalizedTranscript.

export const ParticipantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  internal: z.boolean(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const TranscriptSegmentSchema = z
  .object({
    speakerName: z.string().min(1),
    speakerEmail: z.string().email().optional(),
    text: z.string().min(1),
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().nonnegative(),
  })
  .refine((s) => s.endMs >= s.startMs, {
    message: "endMs deve ser >= startMs",
  });
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const NormalizedTranscriptSchema = z.object({
  meetingId: z.string().min(1),
  title: z.string().min(1),
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional(),
  durationS: z.number().int().nonnegative().optional(),
  participants: z.array(ParticipantSchema),
  segments: z.array(TranscriptSegmentSchema),
});
export type NormalizedTranscript = z.infer<typeof NormalizedTranscriptSchema>;
