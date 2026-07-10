import { listCalls } from "@/lib/data/calls";
import { CallsClient } from "./CallsClient";

// Server Component: busca via camada de dados (Supabase quando configurado,
// mocks em modo demo) e entrega para o client component que já tinha toda a
// interatividade (filtros, navegação por teclado).
export default async function CallsPage() {
  const calls = await listCalls();
  return <CallsClient calls={calls} />;
}
