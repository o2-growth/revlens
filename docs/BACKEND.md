# Backend do revlens — como ligar

O app roda **100% em modo demo** (dados mock) sem nenhuma env configurada — é
o comportamento padrão hoje. Este documento explica o que foi construído e
como ligar o backend real quando houver credenciais de Supabase/Gemini.

Ver também `docs/SETUP-CREDENCIAIS.md` para o passo-a-passo completo de como
gerar cada valor.

## Como o fallback gracioso funciona

`src/lib/config.ts` expõe `isSupabaseConfigured()` e `isGeminiConfigured()`
— checam as env vars, nada mais. A camada de dados em `src/lib/data/`
(`calls.ts`, `deals.ts`, `intelligence.ts`, `coaching.ts`) usa essas funções:

- **Supabase configurado** → lê do banco (RLS filtra closer/manager).
- **Não configurado** → devolve os mocks de `src/lib/mock/*` (modo demo).

As páginas de `/calls` e `/calls/[id]` já foram migradas para consumir
`@/lib/data/calls` (`listCalls()`, `getCall(id)`) em vez de importar o mock
direto. `deals.ts`, `intelligence.ts` e `coaching.ts` em `src/lib/data/` são
hoje um **pass-through explícito** para os mocks — o pipeline de IA real
(Fase 1) só produz `summary/key_points/objections/next_steps/talk_ratio` por
call; as métricas agregadas de operação, scorecards e coaching ficam para uma
fase seguinte (fora do escopo do plano — ver
`docs/superpowers/plans/2026-07-10-clone-elephan-fase1-mvp.md`, seção "Fora
de escopo").

## O que existe hoje (Fase 1 — ingestão por upload)

```
supabase/migrations/0001_init.sql   — schema + RLS (NÃO aplicado ainda)
src/lib/config.ts                   — isSupabaseConfigured / isGeminiConfigured
src/lib/ingest/types.ts             — contrato NormalizedTranscript (Zod)
src/lib/ingest/parse-transcript.ts  — parser puro (docs-style + WebVTT)
src/lib/ingest/parse-transcript.test.ts + __fixtures__/
src/lib/ai/analyze.ts               — buildAnalysisPrompt (puro) + analyzeCall (Gemini) + computeTalkRatio (puro)
src/lib/ai/analyze.test.ts
src/lib/ai/embeddings.ts            — embedCall / embedQuery (gemini-embedding-001, 768d)
src/lib/jobs/worker.ts              — runPendingJobs(): consome a fila `jobs`
src/lib/data/calls.ts               — listCalls()/getCall() com fallback gracioso
src/lib/data/{deals,intelligence,coaching}.ts — pass-through pros mocks (por enquanto)
src/app/api/ingest/upload/route.ts  — POST multipart: content|file + title (+startedAt)
src/app/api/jobs/run/route.ts       — POST/GET protegido por JOBS_RUN_SECRET
src/app/(app)/import/page.tsx + ImportClient.tsx — UI de "colar/enviar transcrição"
```

### O que é testável agora, sem nenhuma credencial

- `npm test` — parser (`parse-transcript.test.ts`, 15 casos: docs-style com
  timestamp, docs-style "Nome: texto", WebVTT, idempotência do meetingId,
  participante interno) e funções puras de IA (`analyze.test.ts`, 8 casos:
  `buildAnalysisPrompt`, `computeTalkRatio`). 23 testes, todos passando.
- `POST /api/ingest/upload` sem Supabase configurado responde 200 com o
  **preview** do `NormalizedTranscript` (`mode: "preview"`) — dá pra testar
  o parser real, com qualquer texto colado, direto pela UI em `/import` ou
  via curl:
  ```bash
  curl -X POST http://localhost:3000/api/ingest/upload \
    -F "title=Teste" \
    -F $'content=Ana: oi tudo bem\nCarlos: tudo bem sim'
  ```
- Todo o app (`/`, `/calls`, `/calls/[id]`, `/search`, `/coaching`,
  `/playbook`, `/import`) continua funcionando 100% em modo demo.

### O que precisa de credenciais para ser exercitado

- Persistência real (`calls`, `transcript_segments`, `jobs`) — precisa da
  migration aplicada + `SUPABASE_SERVICE_ROLE_KEY`.
- `analyzeCall` / `embedCall` (chamadas de rede ao Gemini) — precisa de
  `GEMINI_API_KEY`. Propositalmente **não são testadas por unit test** (são
  I/O de rede); ficam para validação E2E manual, como o plano pede.
- `/api/jobs/run` — precisa de `JOBS_RUN_SECRET` E Supabase+Gemini
  configurados (sem eles, responde `{ skipped: true, reason: "..." }` sem
  quebrar).

## Passo a passo para ligar de verdade

1. **Aplicar a migration.** Com o projeto Supabase criado (ver
   `docs/SETUP-CREDENCIAIS.md`, seção 1):
   ```bash
   supabase link --project-ref <seu-ref>
   supabase db push
   ```
   ou cole o conteúdo de `supabase/migrations/0001_init.sql` inteiro no
   **SQL Editor** do painel Supabase e rode. É **inteiramente aditivo** —
   só `create table if not exists` / `create index if not exists` / trigger
   `security definer` para RLS não-recursiva (mesmo padrão do
   `vyce-platform/supabase/fix-rls-recursion.sql`). Não apaga nem
   sobrescreve nada.

2. **Preencher `.env.local`** com as chaves do Supabase e
   `GEMINI_API_KEY` (ver `docs/SETUP-CREDENCIAIS.md`). Gerar
   `JOBS_RUN_SECRET` com `openssl rand -hex 32`.

3. **Rodar o app** (`npm run dev`). A partir daqui, `isSupabaseConfigured()`
   passa a ser `true` e `/calls`, `/calls/[id]` e `/api/ingest/upload`
   passam a ler/escrever no banco de verdade automaticamente — nenhuma
   mudança de código necessária.

4. **Importar uma transcrição de teste** em `/import` (colar texto ou
   enviar `.txt`/`.vtt`). Confirme no Supabase (Table Editor) que apareceu
   uma linha em `calls` (status `ingested`), `transcript_segments` e um job
   `pending` em `jobs`.

5. **Rodar o worker** manualmente para processar a fila:
   ```bash
   curl -X POST "http://localhost:3000/api/jobs/run?limit=5" \
     -H "Authorization: Bearer $JOBS_RUN_SECRET"
   ```
   Confirme que a call virou `status = 'ready'`, que `call_analyses` tem uma
   linha (summary/key_points/objections/next_steps/talk_ratio) e que
   `call_embeddings` tem uma linha por segmento.

6. **Configurar o cron.** Em produção (Vercel), criar um
   [Vercel Cron](https://vercel.com/docs/cron-jobs) apontando para
   `POST /api/jobs/run` a cada 1–2 min, com o header
   `Authorization: Bearer <JOBS_RUN_SECRET>`. Alternativa: Supabase Cron
   (pg_cron + `net.http_post`) chamando o mesmo endpoint.

7. **Conferir no app**: a call importada aparece em `/calls` com o resumo,
   objeções e próximos passos gerados pela IA, respeitando RLS (closer só
   vê as próprias; manager vê todas).

## Limitações conhecidas desta entrega (documentadas, não escondidas)

- A camada de dados (`src/lib/data/calls.ts`) mapeia o que o banco realmente
  tem hoje (summary/objections/next_steps/talk_ratio/transcript) para o
  shape `Call` que a UI espera. Campos que são "inteligência calculada" nos
  mocks e que o pipeline de IA desta fase **não produz** (sentimento,
  contagem de sinais de compra, pulso/monólogos, moments da timeline) vêm
  com defaults neutros a partir do banco real, em vez de quebrar a tela.
  Ficam para uma iteração futura do pipeline de IA.
- A captura automática via Google Meet (webhook + Meet REST API) **não foi
  implementada nesta entrega** — é o próximo passo do plano (Task 0/3/4
  específicas do Meet). O upload/colar é o adaptador de ingestão que existe
  hoje; o contrato `NormalizedTranscript` foi desenhado para que o adaptador
  do Meet possa plugar no mesmo pipeline sem mudar banco, IA ou UI.
- Login com Google restrito por domínio (Task 3 do plano) não foi
  implementado nesta entrega — fora do escopo pedido.
