// Fallback gracioso: o app inteiro roda em modo demo (mocks) sem nenhuma
// env configurada. Estas funções são a única fonte de verdade sobre "temos
// backend real ligado?" — usadas pela camada de dados (src/lib/data/*) e
// pelas rotas de ingestão/IA.

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function allowedEmailDomain(): string | null {
  return process.env.ALLOWED_EMAIL_DOMAIN || null;
}

export function jobsRunSecret(): string | null {
  return process.env.JOBS_RUN_SECRET || null;
}
