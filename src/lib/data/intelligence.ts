// Camada de dados para os dashboards de "inteligência de operação" (vitals,
// ranking de time, pressão competitiva, forecast, etc). Fora do escopo desta
// Fase 1 — o pipeline de IA hoje produz summary/key_points/objections/
// next_steps/talk_ratio por call (ver src/lib/ai/analyze.ts), não as
// métricas agregadas de operação que este módulo expõe. Pass-through
// explícito para os mocks até essa camada de agregação existir.
export * from "@/lib/mock/intelligence";
