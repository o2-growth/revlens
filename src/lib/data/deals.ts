// Camada de dados para "deals" (pipeline/forecast). Fora do escopo desta
// Fase 1 (ver docs/superpowers/plans/2026-07-10-clone-elephan-fase1-mvp.md,
// seção "Fora de escopo"): o backend real ainda não computa estágio de
// funil/forecast a partir das calls. Por enquanto este módulo é um
// pass-through explícito para os mocks — mantém o ponto de import estável
// (`@/lib/data/deals`) para quando essa inteligência for implementada.
export * from "@/lib/mock/deals";
