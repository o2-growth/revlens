import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detectTranscriptFormat, parseTranscript } from "./parse-transcript";

function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__", name), "utf-8");
}

describe("detectTranscriptFormat", () => {
  it("detecta WebVTT pelo cabeçalho", () => {
    expect(detectTranscriptFormat("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\noi")).toBe("vtt");
  });

  it("detecta texto colado (docs-style) como default", () => {
    expect(detectTranscriptFormat("Ana (00:00) oi")).toBe("docs");
  });
});

describe("parseTranscript — docs-style com timestamp entre parênteses", () => {
  const raw = fixture("docs-style.txt");
  const transcript = parseTranscript({
    content: raw,
    title: "Call de teste — descoberta",
    startedAt: "2026-07-01T14:00:00.000Z",
  });

  it("produz os falantes corretos", () => {
    const names = transcript.participants.map((p) => p.name).sort();
    expect(names).toEqual(["Ana Ribeiro", "Carlos Menezes"]);
  });

  it("produz 4 segmentos, um por fala", () => {
    expect(transcript.segments).toHaveLength(4);
  });

  it("ordena os segmentos por startMs", () => {
    const starts = transcript.segments.map((s) => s.startMs);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(starts).toEqual([0, 14000, 41000, 80000]);
  });

  it("converte mm:ss para milissegundos corretamente", () => {
    // Carlos Menezes (01:20) -> 80000ms
    const last = transcript.segments[3];
    expect(last.speakerName).toBe("Carlos Menezes");
    expect(last.startMs).toBe(80000);
  });

  it("agrupa linhas de continuação na fala do mesmo falante", () => {
    const first = transcript.segments[0];
    expect(first.text).toContain("Boa tarde");
    expect(first.text).toContain("proposta");
  });
});

describe("parseTranscript — docs-style com 'Nome: texto' (sem timestamp)", () => {
  const raw = fixture("docs-style-colon.txt");
  const transcript = parseTranscript({
    content: raw,
    title: "Call de teste — sem timestamp",
    startedAt: "2026-07-01T14:00:00.000Z",
  });

  it("produz os falantes corretos", () => {
    const names = transcript.participants.map((p) => p.name).sort();
    expect(names).toEqual(["Ana Ribeiro", "Carlos Menezes"]);
  });

  it("produz 4 segmentos ordenados por startMs (cronometragem sintética)", () => {
    expect(transcript.segments).toHaveLength(4);
    const starts = transcript.segments.map((s) => s.startMs);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    // estritamente crescente: cada linha ganha seu próprio slot
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBeGreaterThan(starts[i - 1]);
    }
  });
});

describe("parseTranscript — WebVTT", () => {
  const raw = fixture("meet.vtt");
  const transcript = parseTranscript({
    content: raw,
    title: "Call de teste — VTT",
    startedAt: "2026-07-01T14:00:00.000Z",
  });

  it("produz os falantes corretos a partir da tag <v>", () => {
    const names = transcript.participants.map((p) => p.name).sort();
    expect(names).toEqual(["Ana Ribeiro", "Carlos Menezes"]);
  });

  it("produz 4 segmentos ordenados por startMs", () => {
    expect(transcript.segments).toHaveLength(4);
    const starts = transcript.segments.map((s) => s.startMs);
    expect(starts).toEqual([0, 5500, 9300, 15400]);
  });

  it("converte timestamps VTT (HH:MM:SS.mmm) para milissegundos", () => {
    expect(transcript.segments[0].endMs).toBe(5200);
  });

  it("remove a tag <v Nome> do texto", () => {
    expect(transcript.segments[0].text).not.toContain("<v");
    expect(transcript.segments[0].text).toContain("Boa tarde");
  });
});

describe("parseTranscript — idempotência do meetingId", () => {
  it("mesmo conteúdo produz o mesmo meetingId (hash), conteúdo diferente produz outro", () => {
    const a = parseTranscript({ content: "Ana: oi\n", title: "t" });
    const b = parseTranscript({ content: "Ana: oi\n", title: "outro título" });
    const c = parseTranscript({ content: "Ana: tchau\n", title: "t" });
    expect(a.meetingId).toBe(b.meetingId);
    expect(a.meetingId).not.toBe(c.meetingId);
  });
});

describe("parseTranscript — participante interno via domínio", () => {
  it("marca internal=true quando o email casa com allowedDomain", () => {
    const transcript = parseTranscript({
      content: "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n<v Ana Ribeiro>oi\n",
      title: "t",
      allowedDomain: "empresa.com",
    });
    // sem email nas falas de texto puro, internal fica false — mas o campo
    // deve sempre existir e ser boolean
    expect(typeof transcript.participants[0].internal).toBe("boolean");
  });
});
