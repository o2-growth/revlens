# revlens — Design System

## Direção e feel

**"Monitor de sinais vitais da receita."** revlens não é mais um dashboard SaaS — é um
**instrumento**. A marca da O2 Inc já é literalmente isso: tela preta, verde-oxigênio pulsando
como um oxímetro. Cada call de vendas tem *vitais* (talk ratio, sentimento, objeções, sinais de
compra). O produto lê esses vitais como um monitor lê os de um paciente.

- **Escuro, alto contraste, instrumento.** Fundo quase-preto com leve tint verde.
- **Verde-oxigênio = SINAL**, nunca decoração: fala do rep, positivo, ativo, sinal de compra.
- **Âmbar = risco/atenção. Vermelho = crítico/perdido.** Cor sempre carrega significado.
- **Sóbrio, denso, rápido.** Gente ocupada de vendas — alto sinal por pixel, zero enfeite.

## Persona e tarefa

- **Closer:** entre calls / logo após. Relembrar rápido, achar o follow-up, buscar um trecho.
- **Gestor:** varre muitas calls, acha o que está em risco, coaching.
- Desktop-first. Leitura rápida, escaneável.

## Depth (uma estratégia só)

**Bordas de baixa opacidade + shift sutil de superfície.** Sombra some no preto, então a
definição vem da borda (`--color-rl-border`, rgba ~0.08) e do clareamento leve entre superfícies.
Glow verde (`.rl-glow`) SÓ em elementos "vivos" (pulso ativo, botão primário em hover). Nada de
drop-shadow dramático.

## Cores (tokens em globals.css — usar SEMPRE o token, nunca hex solto)

- Superfícies: `rl-canvas` (página+sidebar) → `rl-surface-1` → `rl-surface-2` → `rl-surface-3`
  (dropdown). Inputs usam `rl-inset` (mais escuro que o entorno).
- Texto (4 níveis): `rl-text` → `rl-text-2` → `rl-text-3` → `rl-text-muted`.
- Sinal: `rl-oxy` (#6CF269), `rl-oxy-bright` (picos/ativo), `rl-oxy-dim` (fundo/glow),
  `rl-oxy-ink` (texto sobre botão verde).
- Semânticas: `rl-risk` (âmbar), `rl-danger` (vermelho), `rl-prospect` (teal frio — fala do
  prospect, contrasta com o verde do rep na waveform).

## Tipografia

- **Display — Anton** (`.rl-display` / `font-display`): SÓ títulos de página e métrica-herói.
  Caixa alta, condensado. Nunca em texto corrido nem em label pequeno.
- **UI/corpo — Host Grotesk** (`font-ui`): navegação, labels, textos, botões.
- **Readout — JetBrains Mono** (`.rl-readout` / `font-mono`, tabular-nums): TODO número que é
  medição — tempo de fala, timestamps, talk ratio %, score, contadores. É o que dá cara de
  instrumento.

## Espaçamento e forma

- Base **4px**. Escala: 4, 8, 12, 16, 24, 32, 48, 64.
- Padding simétrico.
- Radius: `--radius-rl-control` 8px (botões/inputs), `--radius-rl-card` 12px, `--radius-rl-modal` 16px.

## Componentes-assinatura (o que torna o revlens reconhecível)

### 1. Pulse (onda de tempo de fala como traço de oxímetro)
Cada call renderiza quem-falou-quando como uma linha tipo ECG/oxímetro. Rep = `rl-oxy` (verde),
prospect = `rl-prospect` (teal). Versão grande na página da call; **mini-pulse (sparkline)** inline
em cada linha do log. SVG, traço fino (~1.5px), sem preenchimento pesado. É a assinatura visual nº1.

### 2. Vitals readout (leitura de monitor)
Fileira de vitais da call em `.rl-readout` (mono tabular): TALK RATIO, SENTIMENTO, OBJEÇÕES,
SINAIS DE COMPRA, DURAÇÃO. Não é card "ícone + número grande + label". É leitura de instrumento:
label pequeno em `rl-text-3` caixa alta + valor mono grande. Valor muda de cor pela semântica
(talk ratio saudável = verde; rep falando demais = âmbar).

### 3. Call log (feed, não tabela branca)
Lista de calls como um log escuro. Cada linha: nome da conta/prospect, dono (closer), data/hora
(mono), duração (mono), status (processando/pronto), o **mini-pulse** e um chip de sinal (verde =
sinal de compra; âmbar = risco). Densa, escaneável, hover clareia a linha (surface-1).

## Layout / navegação

- **Sidebar mesma cor do canvas** (`rl-canvas`), separada só por borda — não fragmentar em
  "mundo sidebar" vs "mundo conteúdo". Itens: Calls, Busca, (futuro: Coaching, Pipeline).
  Logo O2 (anel verde) no topo. Contexto do usuário (avatar + papel closer/gestor) embaixo.
- **Topbar** enxuta: título da tela (display), busca rápida, filtros.
- Grounding sempre presente — nada de tela flutuando no vazio.

## Estados (obrigatórios)

Todo interativo: default, hover, active, focus (anel verde), disabled. Dados: loading (call
`processing` mostra transcrição, esconde insights com aviso "gerando sinais…"), empty, error.

## Regras anti-genérico (checar antes de entregar)

- Swap test: trocar Anton pelo Inter genérico ou o log por tabela branca deve DESTRUIR a
  identidade. Se não destrói, defaultou.
- Verde nunca decorativo — se um verde não significa sinal/positivo/ativo, tirar.
- Números de medição sempre em mono tabular.
- Squint test: hierarquia visível, nada saltando (bordas sussurram).
