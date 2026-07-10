-- ============================================================
-- revlens — schema inicial (ADITIVO — só create/add, nunca drop/delete/update)
--
-- Como aplicar: ver docs/BACKEND.md. Resumo:
--   supabase link --project-ref <ref>
--   supabase db push
-- ou colar este arquivo inteiro no SQL Editor do painel Supabase.
--
-- ⚠️ Este arquivo NÃO foi aplicado a nenhum banco. Está pronto para revisão
-- e aplicação manual quando houver um projeto Supabase configurado.
-- ============================================================

-- ------------------------------------------------------------
-- Extensões
-- ------------------------------------------------------------
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- profiles — estende auth.users. role: closer (padrão) | manager
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'closer' check (role in ('closer', 'manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário autenticado; estende auth.users com papel (closer/manager).';

-- ------------------------------------------------------------
-- calls — uma call de vendas ingerida (upload ou Meet, no futuro)
-- ------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  meet_meeting_id text,
  owner_id uuid references public.profiles (id) on delete set null,
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_s integer,
  participants jsonb not null default '[]'::jsonb,
  status text not null default 'ingested' check (status in ('ingested', 'processing', 'ready', 'failed')),
  source text not null default 'upload' check (source in ('upload', 'meet')),
  outcome text check (outcome in ('ganho', 'perdido', 'aberto')),
  deal_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.calls is 'Uma call de vendas normalizada (NormalizedTranscript) pronta para análise de IA.';

-- unique parcial: só força unicidade quando meet_meeting_id não é nulo
-- (uploads avulsos não têm meeting id do Meet)
create unique index if not exists calls_meet_meeting_id_key
  on public.calls (meet_meeting_id)
  where meet_meeting_id is not null;

create index if not exists calls_owner_id_idx on public.calls (owner_id);
create index if not exists calls_started_at_idx on public.calls (started_at desc);
create index if not exists calls_status_idx on public.calls (status);

-- ------------------------------------------------------------
-- transcript_segments — falas normalizadas, uma linha por turno de fala
-- ------------------------------------------------------------
create table if not exists public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  speaker_name text not null,
  speaker_email text,
  text text not null,
  start_ms integer not null,
  end_ms integer not null,
  seq integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.transcript_segments is 'Falas normalizadas de uma call, ordenadas por start_ms.';

create index if not exists transcript_segments_call_id_idx on public.transcript_segments (call_id);
create index if not exists transcript_segments_call_id_start_ms_idx
  on public.transcript_segments (call_id, start_ms);

-- full-text search em português sobre o texto das falas
create index if not exists transcript_segments_text_fts_idx
  on public.transcript_segments
  using gin (to_tsvector('portuguese', text));

-- ------------------------------------------------------------
-- call_analyses — saída do pipeline de IA (Gemini), uma por call
-- ------------------------------------------------------------
create table if not exists public.call_analyses (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls (id) on delete cascade,
  summary text,
  key_points jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  talk_ratio jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.call_analyses is 'Resumo/objeções/próximos-passos/talk-ratio gerados por IA para uma call.';

-- ------------------------------------------------------------
-- call_embeddings — embeddings por segmento, para busca semântica
-- gemini-embedding-001 truncado a 768 dims (MRL)
-- ------------------------------------------------------------
create table if not exists public.call_embeddings (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  segment_id uuid references public.transcript_segments (id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

comment on table public.call_embeddings is 'Embeddings (768d, gemini-embedding-001) por segmento de transcrição, para busca semântica.';

create index if not exists call_embeddings_call_id_idx on public.call_embeddings (call_id);

-- ivfflat exige alguma massa de dados pra ser útil; lists=100 é um ponto de
-- partida razoável para volumes pequenos/médios (ajustar depois com ANALYZE).
create index if not exists call_embeddings_embedding_idx
  on public.call_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ------------------------------------------------------------
-- jobs — fila simples para processamento assíncrono (análise + embeddings)
-- ------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('analyze_call')),
  call_id uuid references public.calls (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.jobs is 'Fila de jobs assíncronos (hoje: analyze_call). Consumida por src/lib/jobs/worker.ts.';

create index if not exists jobs_status_run_after_idx on public.jobs (status, run_after);
create index if not exists jobs_call_id_idx on public.jobs (call_id);

-- ------------------------------------------------------------
-- updated_at triggers (aditivo, opcional mas útil)
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.calls;
create trigger set_updated_at before update on public.calls
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.call_analyses;
create trigger set_updated_at before update on public.call_analyses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.jobs;
create trigger set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Trigger: cria profiles automaticamente no signup (role default closer)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'closer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Helper: le o role do usuario atual SEM reconsultar profiles a partir de
-- uma policy de profiles (evita recursão infinita — ver
-- vyce-platform/supabase/fix-rls-recursion.sql). security definer roda com
-- privilégios do dono da função, então não é bloqueada pela própria RLS que
-- está tentando avaliar.
-- ------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.calls enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.call_analyses enable row level security;
alter table public.call_embeddings enable row level security;
alter table public.jobs enable row level security;

-- profiles: cada um lê/atualiza o próprio; manager lê todos via helper
-- (não recursivo — a função é security definer, não reavalia RLS de profiles)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_manager" on public.profiles;
create policy "profiles_select_manager"
  on public.profiles for select
  using (public.current_user_role() = 'manager');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- calls: closer vê as próprias (owner_id = auth.uid()); manager vê tudo.
-- Escrita (insert/update/delete) só via service role (sem policy pra
-- authenticated/anon = negado por padrão).
drop policy if exists "calls_select_own_or_manager" on public.calls;
create policy "calls_select_own_or_manager"
  on public.calls for select
  using (
    owner_id = auth.uid()
    or public.current_user_role() = 'manager'
  );

drop policy if exists "transcript_segments_select_via_call" on public.transcript_segments;
create policy "transcript_segments_select_via_call"
  on public.transcript_segments for select
  using (
    exists (
      select 1 from public.calls c
      where c.id = transcript_segments.call_id
        and (c.owner_id = auth.uid() or public.current_user_role() = 'manager')
    )
  );

drop policy if exists "call_analyses_select_via_call" on public.call_analyses;
create policy "call_analyses_select_via_call"
  on public.call_analyses for select
  using (
    exists (
      select 1 from public.calls c
      where c.id = call_analyses.call_id
        and (c.owner_id = auth.uid() or public.current_user_role() = 'manager')
    )
  );

drop policy if exists "call_embeddings_select_via_call" on public.call_embeddings;
create policy "call_embeddings_select_via_call"
  on public.call_embeddings for select
  using (
    exists (
      select 1 from public.calls c
      where c.id = call_embeddings.call_id
        and (c.owner_id = auth.uid() or public.current_user_role() = 'manager')
    )
  );

-- jobs: não é dado de negócio exposto ao usuário final; só service role
-- (nenhuma policy para authenticated/anon => tudo negado por padrão com RLS on)

-- ------------------------------------------------------------
-- RPC: busca semântica respeitando RLS (security invoker — roda com os
-- privilégios de quem chama, então a RLS de call_embeddings/calls se aplica)
-- ------------------------------------------------------------
create or replace function public.match_call_segments(
  query_embedding vector(768),
  match_count integer default 20
)
returns table (
  call_id uuid,
  segment_id uuid,
  content text,
  similarity float
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ce.call_id,
    ce.segment_id,
    ce.content,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.call_embeddings ce
  order by ce.embedding <=> query_embedding
  limit match_count;
$$;
