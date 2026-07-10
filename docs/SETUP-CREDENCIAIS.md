# Tutorial — Gerar as credenciais do revlens

Este guia lista **tudo** que o projeto precisa e como gerar cada valor, passo a passo.
No fim, você vai ter preenchido o arquivo `.env.local` (copiado de `.env.example`).

> **Como usar:** para cada valor gerado, cole no `.env.local`. Nunca commite o `.env.local`
> (o `.gitignore` já protege). Guarde os segredos num gerenciador de senhas.

Ordem sugerida: **1) Supabase → 2) Gemini → 3) Segredos locais → 4) Google** (o Google é o
mais longo e é o que destrava a captura das calls).

---

## 1. Supabase (banco + login) — ~5 min

Gera: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

1. Acesse https://supabase.com e faça login (pode usar o Google da empresa).
2. **New project** → nome `revlens`, escolha uma senha forte para o banco (guarde-a),
   região `South America (São Paulo)` se disponível.
3. Espere ~2 min o projeto provisionar.
4. Menu **Project Settings** (engrenagem) → **API**:
   - **Project URL** → cole em `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys → `service_role` `secret`** → cole em `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ Esta é a chave de administrador do banco. Nunca exponha no front-end nem commite.

> A extensão `vector` (busca semântica) será habilitada pela migration, você não precisa fazer nada agora.

---

## 2. Google Gemini (IA dos resumos) — ~2 min

Gera: `GEMINI_API_KEY`

1. Acesse https://aistudio.google.com/apikey (login com a conta Google da empresa).
2. **Create API key** → escolha o projeto Google Cloud `revlens` (o mesmo do passo 4) ou crie um.
3. Copie a chave e cole em `GEMINI_API_KEY`.
4. O uso do MVP é baixo. O modelo padrão será **Gemini 2.5 Flash** (rápido e barato) para as
   análises e **gemini-embedding-001** para a busca semântica. Confirme se há billing/limite
   adequado no projeto (o free tier do AI Studio já cobre testes).

> Dica: usar o **mesmo projeto Google Cloud** (`revlens`) para o Gemini e para as APIs do Meet
> deixa tudo (billing, permissões, logs) num lugar só.

---

## 3. Segredos locais (você mesmo gera) — ~1 min

Gera: `MEET_WEBHOOK_SECRET`, `JOBS_RUN_SECRET`

São segredos aleatórios que só o nosso sistema conhece (protegem o webhook e o processador de fila).
No terminal, rode duas vezes e cole cada resultado:

```bash
openssl rand -hex 32
```

- 1º resultado → `MEET_WEBHOOK_SECRET`
- 2º resultado → `JOBS_RUN_SECRET`

Também preencha:
- `ALLOWED_EMAIL_DOMAIN` → `o2inc.com.br` (só e-mails desse domínio conseguem logar)

---

## 4. Google — a parte que captura as calls — ~20–30 min

Esta é a única parte que exige **acesso de admin do Google Workspace**. São duas credenciais
diferentes com propósitos distintos:

- **(4A) OAuth 2.0** → para o **login** com Google no app (via Supabase).
- **(4B) Service Account + Domain-Wide Delegation** → para **ler as transcrições do Meet** sem
  exigir que cada vendedor autorize (o app "age em nome" dos usuários do domínio).

Antes de tudo, crie o projeto no Google Cloud:

1. Acesse https://console.cloud.google.com (logado com o admin do Workspace).
2. Topo → seletor de projeto → **New Project** → nome `revlens` → **Create**.
3. Com o projeto `revlens` selecionado, vá em **APIs & Services → Library** e **ative** (Enable):
   - **Google Meet API**
   - **Google Workspace Events API**
   - **Google Drive API** (as transcrições ficam no Drive do organizador)

### 4A. OAuth 2.0 (login) — gera `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

1. **APIs & Services → OAuth consent screen**:
   - User type: **Internal** (só gente do domínio — perfeito para uso interno).
   - App name: `revlens`, e-mail de suporte: o seu. Salve.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**, nome `revlens-web`.
   - **Authorized redirect URIs** → adicione a URL de callback do Supabase (você a encontra no
     Supabase em **Authentication → Providers → Google**; tem o formato
     `https://<seu-projeto>.supabase.co/auth/v1/callback`).
   - **Create** → copie **Client ID** e **Client secret**.
3. Cole em `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
4. **Ligue o login Google no Supabase:** Supabase → **Authentication → Providers → Google** →
   ative → cole o mesmo Client ID e Client Secret → Save.

### 4B. Service Account + Domain-Wide Delegation (ler transcrições) — gera `GOOGLE_SERVICE_ACCOUNT_JSON`

1. **APIs & Services → Credentials → Create Credentials → Service account**:
   - Nome `revlens-meet-reader` → Create and continue → pode pular papéis → Done.
2. Clique na service account criada → aba **Keys → Add key → Create new key → JSON** →
   baixa um arquivo `.json`. **Guarde-o com cuidado** (é uma credencial de admin).
3. Ainda na service account, anote o **Unique ID** (número longo, "Client ID" da conta de serviço).
4. **Delegação em todo o domínio (precisa do Admin Console do Workspace):**
   - Acesse https://admin.google.com (como admin) → **Security → Access and data control →
     API controls → Domain-wide delegation → Manage domain-wide delegation → Add new**.
   - **Client ID**: o Unique ID da service account (passo 3).
   - **OAuth scopes** (cole exatamente, separados por vírgula):
     ```
     https://www.googleapis.com/auth/meetings.space.readonly,
     https://www.googleapis.com/auth/drive.readonly
     ```
   - **Authorize**.
5. **Transcrição automática ligada (o "Caminho A"):** no Admin Console → **Apps → Google Workspace
   → Google Meet → Meet video settings** → confirme que **Transcripts** (e Gemini "take notes",
   se aplicável) está **ON** para a organização. Isso é o que faz toda call ser transcrita sem
   ninguém apertar botão. (Se não existir a opção, seu plano pode não incluir transcrição — me avise.)
6. **Como preencher `GOOGLE_SERVICE_ACCOUNT_JSON`:** abra o arquivo `.json` baixado, copie
   **todo o conteúdo** e cole como uma linha (string JSON) no `.env.local`. Dica para transformar
   em uma linha só:
   ```bash
   cat caminho/para/revlens-xxxx.json | jq -c . 
   ```
   Cole o resultado inteiro entre aspas simples em `GOOGLE_SERVICE_ACCOUNT_JSON='...'`.

---

## Teste rápido de validação (o "spike")

Depois de gerar 4A e 4B, dá pra confirmar que a transcrição vem pela API **antes** de
programar a ingestão. Faça uma call de teste no Meet (2 pessoas, ~2 min, com transcrição ligada),
espere alguns minutos e me avise — eu te passo um comando/script curto que:
1. lista os `conferenceRecords` recentes,
2. pega o `transcript` da call de teste,
3. imprime as `entries` (falas com nome do participante + timestamp).

Se aparecer o nome de quem falou + horário em cada fala, **está validado** e eu solto a
implementação da ingestão. Se não aparecer, a gente ajusta o plano (plano B: upload manual + Whisper).

---

## Checklist final do `.env.local`

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `ALLOWED_EMAIL_DOMAIN` = `o2inc.com.br`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON`
- [ ] `MEET_WEBHOOK_SECRET`
- [ ] `JOBS_RUN_SECRET`

Quando terminar (ou empacar em qualquer passo), me chama que eu continuo.
