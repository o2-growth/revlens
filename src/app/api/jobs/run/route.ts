import { NextRequest, NextResponse } from "next/server";
import { jobsRunSecret } from "@/lib/config";
import { runPendingJobs } from "@/lib/jobs/worker";

// Endpoint disparado por cron (Vercel scheduled function / Supabase cron) a
// cada 1-2 min para processar a fila de análise de IA. Protegido por um
// segredo compartilhado (JOBS_RUN_SECRET) — não é uma rota pública.
function isAuthorized(request: NextRequest): boolean {
  const secret = jobsRunSecret();
  if (!secret) return false; // sem segredo configurado, rota fica bloqueada por padrão
  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : request.nextUrl.searchParams.get("secret");
  return provided === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam) || 5, 25) : 5;

  try {
    const result = await runPendingJobs(limit);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET também funciona (alguns provedores de cron só disparam GET), mesma
// autorização.
export async function GET(request: NextRequest) {
  return POST(request);
}
