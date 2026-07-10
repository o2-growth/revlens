import { describe, expect, it } from "vitest";
import { buildAnalysisPrompt, computeTalkRatio } from "./analyze";
import type { NormalizedTranscript } from "@/lib/ingest/types";

const transcript: NormalizedTranscript = {
  meetingId: "m1",
  title: "Call de descoberta — Acme",
  startedAt: "2026-07-01T14:00:00.000Z",
  participants: [
    { name: "Ana Ribeiro", email: "ana@empresa.com", internal: true },
    { name: "Carlos Menezes", email: "carlos@acme.com", internal: false },
  ],
  segments: [
    {
      speakerName: "Ana Ribeiro",
      speakerEmail: "ana@empresa.com",
      text: "Boa tarde, obrigada por aceitar a call.",
      startMs: 0,
      endMs: 5000,
    },
    {
      speakerName: "Carlos Menezes",
      speakerEmail: "carlos@acme.com",
      text: "Perfeito, pode seguir. O preço está um pouco alto pra nós.",
      startMs: 5000,
      endMs: 20000,
    },
    {
      speakerName: "Ana Ribeiro",
      speakerEmail: "ana@empresa.com",
      text: "Entendo, podemos falar de desconto anual.",
      startMs: 20000,
      endMs: 25000,
    },
  ],
};

describe("buildAnalysisPrompt", () => {
  const prompt = buildAnalysisPrompt(transcript);

  it("inclui o nome de cada falante e o timestamp mm:ss", () => {
    expect(prompt).toContain("Ana Ribeiro (0:00):");
    expect(prompt).toContain("Carlos Menezes (0:05):");
    expect(prompt).toContain("Ana Ribeiro (0:20):");
  });

  it("inclui o texto de cada fala", () => {
    expect(prompt).toContain("Boa tarde, obrigada por aceitar a call.");
    expect(prompt).toContain("O preço está um pouco alto pra nós.");
  });

  it("inclui o título da call", () => {
    expect(prompt).toContain("Call de descoberta — Acme");
  });

  it("pede explicitamente os quatro campos do JSON de saída", () => {
    expect(prompt).toContain("summary");
    expect(prompt).toContain("key_points");
    expect(prompt).toContain("objections");
    expect(prompt).toContain("next_steps");
  });
});

describe("computeTalkRatio", () => {
  it("calcula o % de tempo falado por participante (chave = email)", () => {
    const ratio = computeTalkRatio(transcript);
    // Ana: 5000 + 5000 = 10000ms; Carlos: 15000ms; total = 25000ms
    expect(ratio["ana@empresa.com"]).toBeCloseTo(40, 1);
    expect(ratio["carlos@acme.com"]).toBeCloseTo(60, 1);
  });

  it("soma aproximadamente 100%", () => {
    const ratio = computeTalkRatio(transcript);
    const total = Object.values(ratio).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it("retorna objeto vazio para transcrição sem segmentos", () => {
    const empty: NormalizedTranscript = { ...transcript, segments: [] };
    expect(computeTalkRatio(empty)).toEqual({});
  });

  it("usa o nome do falante quando não há email", () => {
    const noEmail: NormalizedTranscript = {
      ...transcript,
      segments: [
        { speakerName: "Só Nome", text: "oi", startMs: 0, endMs: 1000 },
      ],
    };
    const ratio = computeTalkRatio(noEmail);
    expect(ratio["Só Nome"]).toBe(100);
  });
});
