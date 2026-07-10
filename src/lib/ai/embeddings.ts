import { GoogleGenAI } from "@google/genai";
import type { NormalizedTranscript } from "@/lib/ingest/types";

// Dimensão truncada via MRL (Matryoshka Representation Learning) do
// gemini-embedding-001 — precisa bater com `vector(768)` na migration
// (supabase/migrations/0001_init.sql, tabela call_embeddings).
export const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_MODEL = "gemini-embedding-001";

export type SegmentEmbedding = {
  content: string;
  embedding: number[];
  segmentIndex: number;
};

// Chama o Gemini de fato — não testado por unit test (I/O de rede). Gera um
// embedding por segmento de transcrição (unidade inicial mais simples;
// agregação em janelas fica para uma iteração futura, ver plano Task 5).
export async function embedCall(
  transcript: NormalizedTranscript
): Promise<SegmentEmbedding[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada — não é possível chamar embedCall.");
  }
  if (transcript.segments.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey });

  const results: SegmentEmbedding[] = [];
  // Processa em lotes pequenos para não estourar limites de payload/rate.
  const BATCH_SIZE = 20;
  for (let i = 0; i < transcript.segments.length; i += BATCH_SIZE) {
    const batch = transcript.segments.slice(i, i + BATCH_SIZE);
    const contents = batch.map((seg) => `${seg.speakerName}: ${seg.text}`);

    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });

    const embeddings = response.embeddings ?? [];
    embeddings.forEach((e, idx) => {
      results.push({
        content: contents[idx],
        embedding: e.values ?? [],
        segmentIndex: i + idx,
      });
    });
  }

  return results;
}

// Gera o embedding de uma única query de busca (mesma dimensão), usado pela
// busca semântica (RPC match_call_segments).
export async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada — não é possível chamar embedQuery.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [query],
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  return response.embeddings?.[0]?.values ?? [];
}
