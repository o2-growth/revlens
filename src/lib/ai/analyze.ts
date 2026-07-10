import { GoogleGenAI, Type } from "@google/genai";
import type { NormalizedTranscript } from "@/lib/ingest/types";

export type CallAnalysisResult = {
  summary: string;
  keyPoints: string[];
  objections: string[];
  nextSteps: string[];
  model: string;
};

export type TalkRatio = Record<string, number>;

const ANALYSIS_MODEL = "gemini-2.5-flash";

// Prompt puramente funcional (sem I/O) — testável sem chamar a rede.
export function buildAnalysisPrompt(transcript: NormalizedTranscript): string {
  const lines = transcript.segments.map((seg) => {
    const mm = Math.floor(seg.startMs / 60000);
    const ss = Math.floor((seg.startMs % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${seg.speakerName} (${mm}:${ss}): ${seg.text}`;
  });

  return [
    `Você é um analista de vendas B2B. Abaixo está a transcrição diarizada`,
    `("Falante (mm:ss): fala") de uma call de vendas intitulada "${transcript.title}".`,
    ``,
    `Leia a transcrição inteira e responda SOMENTE com um JSON no formato pedido,`,
    `em português do Brasil, com base apenas no que foi dito.`,
    ``,
    `- summary: um resumo executivo de 3 a 5 frases da call.`,
    `- key_points: lista dos pontos-chave discutidos (bullets curtos).`,
    `- objections: lista das objeções levantadas pelo prospect (bullets curtos).`,
    `- next_steps: lista dos próximos passos combinados (bullets curtos, com dono se ficou claro).`,
    ``,
    `Transcrição:`,
    `"""`,
    ...lines,
    `"""`,
  ].join("\n");
}

const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
    objections: { type: Type.ARRAY, items: { type: Type.STRING } },
    next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["summary", "key_points", "objections", "next_steps"],
};

// Calcula o % de tempo falado por cada falante (por email quando disponível,
// senão por nome), a partir da soma de (endMs - startMs) de cada segmento.
// Função pura — sem I/O, fácil de testar.
export function computeTalkRatio(transcript: NormalizedTranscript): TalkRatio {
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const seg of transcript.segments) {
    const key = seg.speakerEmail ?? seg.speakerName;
    const duration = Math.max(0, seg.endMs - seg.startMs);
    totals.set(key, (totals.get(key) ?? 0) + duration);
    grandTotal += duration;
  }

  const ratio: TalkRatio = {};
  if (grandTotal === 0) return ratio;

  for (const [key, ms] of totals.entries()) {
    ratio[key] = Math.round((ms / grandTotal) * 1000) / 10; // 1 casa decimal
  }
  return ratio;
}

// Chama o Gemini de fato — não testado por unit test (I/O de rede).
// Validado por E2E manual quando GEMINI_API_KEY estiver configurada.
export async function analyzeCall(
  transcript: NormalizedTranscript
): Promise<CallAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada — não é possível chamar analyzeCall.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildAnalysisPrompt(transcript);

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini não retornou conteúdo para a análise.");

  const parsed = JSON.parse(text) as {
    summary: string;
    key_points: string[];
    objections: string[];
    next_steps: string[];
  };

  return {
    summary: parsed.summary,
    keyPoints: parsed.key_points ?? [],
    objections: parsed.objections ?? [],
    nextSteps: parsed.next_steps ?? [],
    model: ANALYSIS_MODEL,
  };
}
