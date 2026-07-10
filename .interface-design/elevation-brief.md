# revlens — Elevation Brief

**Síntese das três direções (A "Instrumento Vivo" · B "Sala de Comando" · C "Prontuário Editorial") em uma direção única, coesa e implementável.**
Documento é a fonte da verdade para a elevação a nível portfólio. Fiel ao system.md e ao conceito "monitor de sinais vitais da receita". Escrito para um engenheiro executar sem reinterpretar.

---

## 0. Como as três direções se fundem

- **Espinha (de A):** o instrumento está *vivo e medindo agora* — traço que desenha, readouts que ligam, uma única cabeça de varredura viva. É a alma sensorial.
- **Cérebro (de B):** o instrumento é *prescritivo e olha pra frente* — briefing do líder, forecast como oxímetro projetado, fila de intervenção com ação de um clique. É a razão de abrir toda manhã.
- **Disciplina (de C):** o instrumento é *contido e auditável* — um gesto de movimento por vez, um verde por vez, e todo insight tem recibo clicável. É o que impede virar Grafana genérico ou dashboard epilético.

Regra de fusão: **A dá o corpo, B dá o propósito, C dá o freio.** Quando duas direções brigam, C vence (contenção > espetáculo). O forecast (B) só entra se passar o teste de C (todo número tem receipt). O movimento (A) só entra se passar o freio de C (um gesto "ligar" por tela, dois loops "vivos" no máximo).

---

## 1. Tese central & o que torna o revlens memorável

**Tese:** revlens não mostra dados *sobre* calls — ele **ausculta a receita como um monitor de UTI ausculta um paciente**, e então **diz onde intervir**. Cada pixel é ou um *sinal vital* (medição em mono, dentro de uma faixa-alvo) ou uma *prescrição* (o que fazer, com a prova a um clique). O verde-oxigênio da O2 é o batimento: aparece só quando há vida/sinal, nunca como enfeite.

**As 3 provas de que é memorável (o "swap test" invertido — o que não pode ser copiado por um template):**
1. **O pulso é navegável, não decorativo.** O traço de oxímetro carrega ticks de evento (objeção, sinal, preço) e uma cabeça de varredura viva presa ao scroll. Nenhum dashboard genérico tem um gráfico que você *ausculta e scrubs*.
2. **Toda afirmação da IA tem recibo.** Clicou no insight → pula pro segundo exato do transcript. Auditabilidade é o que faz o gestor cético confiar no Gemini.
3. **É prescritivo, não descritivo.** A tela não diz "3 deals em risco"; diz "PUXAR O CTO DA NORTEX — champion inativo há 12 dias" com botão de ação. Retrovisor vira volante.

**Frase-âncora para copy e decisões:** *"Se desfocar a tela e não sobrar o pulso verde saltando do quase-preto + um número mono medindo, defaultamos."*

---

## 2. Sistema de movimento & micro-interações

Movimento é **pontuação clínica**, não animação. Governado 100% por `prefers-reduced-motion` (desliga tudo, seta valor final direto). Três camadas, hierarquia rígida.

### Tokens de movimento (centralizar em globals.css)
```css
--rl-ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* "assentar" — draw, morph, enter */
--rl-ease-press: cubic-bezier(0.4, 0, 0.2, 1);    /* press físico */
--rl-dur-fast: 100ms;    /* press, toggles */
--rl-dur-hover: 150ms;   /* hover choreography (teto 160ms em lista) */
--rl-dur-enter: 280ms;   /* stagger item */
--rl-dur-draw: 800ms;    /* line-drawing do pulse/forecast */
--rl-dur-count: 700ms;   /* count-up readout (faixa 600–800) */
--rl-dur-morph: 320ms;   /* view-transition-group */
```

### CAMADA 1 — "LIGAR" (one-shot, no mount) — *no máx. um count-up e um draw por tela*
- **Count-up (odômetro):** hook `useCountUp(target,{duration:700})` com `requestAnimationFrame` + easing outExpo `t => 1 - 2**(-10*t)`. Só em **valor de medição mono** (talk ratio %, calls, sinais, forecast %, sentimento). Nunca em label. Como já é `tabular-nums`, zero reflow. Escalonar célula-a-célula (40ms), nunca todos de vez.
- **Line-drawing:** `.rl-trace { stroke-dasharray: 2000; animation: rl-draw var(--rl-dur-draw) var(--rl-ease-out) both; }` / `@keyframes rl-draw { from { stroke-dashoffset: 2000 } to { stroke-dashoffset: 0 } }`. Stagger rep→prospect de 120ms. **Só** em `PulseWave variant="large"` e nas polylines do TrendChart/forecast ao entrar na viewport (IntersectionObserver). **NUNCA** na sparkline do log (ruído em lista densa).
- **Stagger de entrada dos feeds:** `.rl-enter { opacity: 0; animation: rl-in var(--rl-dur-enter) var(--rl-ease-out) both; animation-delay: calc(min(var(--i), 10) * 40ms) }`. Cap em 10 (fim não fica lento). Só no primeiro paint — key estável para não re-animar em re-render.

### CAMADA 2 — "AO VIVO" (loop contínuo — os DOIS ÚNICOS permitidos, porque significam)
- **Cabeça de varredura (playhead):** `<circle>` `rl-oxy-bright` com `.rl-glow` presa ao scroll do transcript (o `SpeakerTurn` visível vira a cabeça). Traço à esquerda sólido, à direita esvaece via `<linearGradient>` de opacidade no stroke. **É o único elemento com glow da tela** — a licença "elemento vivo" do system.md finalmente cumprida. rAF throttled a ~60fps; se engasgar, degradar para "cabeça parada no último turno visível" (melhor que 30fps travando).
- **Shimmer-sweep (processando):** `.rl-shimmer::after` gradiente `rl-oxy` 6% varrendo em `translateX(-100% → 100%)`, 1.6s linear infinite. Significa "gerando sinais". Zero spinner.

> Nada mais pulsa pra sempre. O antigo `animate-pulse` infinito (CallLogRow processando, dots) **é substituído** por: blip mono discreto (processando) ou `rl-ping` one-shot (chegada de sinal).

### CAMADA 3 — "RESPONDER" (input)
- **Hover coreografado na linha** (CallLogRow): 3 micro-movimentos ≤150ms, tudo transform/opacity: (1) rail `rl-oxy` 2px entra por `scale-y-0 → 100 origin-center`; (2) chevron `translate-x-0.5`; (3) sparkline `opacity-85 → 100`.
- **Press físico:** `active:scale-[0.98] active:translate-y-px` + `transition-[transform,box-shadow] var(--rl-dur-fast)`. `.rl-glow` migra para `hover:` com transition (não instantâneo).
- **Ping de chegada** (evento único): `@keyframes rl-ping { from { box-shadow: 0 0 0 0 var(--color-rl-oxy-dim) } to { box-shadow: 0 0 0 8px transparent } }` rodando `.7s ease-out 1` quando um sinal é detectado (call processando→pronta).
- **Shared-element morph** mini-pulse→grande via View Transitions (Next 16): `::view-transition-group(*) { animation-duration: var(--rl-dur-morph); animation-timing-function: var(--rl-ease-out) }`.
- **Toast (sonner-style):** entrada `translateY(16px)+opacity` 400ms `var(--rl-ease-out)`, bottom-right, auto-dismiss, stack por translateY. Dispara quando o monitor "apita" (call vira pronta com sinal).

### O que NÃO anima (regra de instrumento sério)
- Nada acima de ~800ms exceto os 2 loops "vivos". Acima disso é gimmick.
- Sparkline do log não desenha, não conta, não morfa (densidade > espetáculo).
- Labels, bordas, ícones estáticos, texto corrido: imóveis.
- Sem parallax, sem fade de página inteira, sem bounce/spring exagerado, sem hover-scale em card.
- **Um count-up por tela. Um ping por evento. Verde só quando significa.**

---

## 3. Refinamentos de tokens / tipografia / layering / densidade

### Tokens a adicionar em `globals.css` (`@theme` + utilitários)
```css
/* Layering — linha-de-luz de 1px (Linear/Vercel), volume sem drop-shadow */
.rl-raised {
  border: 1px solid var(--color-rl-border);
  box-shadow: inset 0 1px 0 0 rgba(230, 255, 240, 0.06);  /* quina de luz no topo */
}

/* Faixa-alvo / zona saudável (oxímetro tem faixa marcada) */
--color-rl-oxy-band: rgba(108, 242, 105, 0.10);   /* fundo da zona-alvo em barras/bands */
--color-rl-prospect-dim: rgba(107, 168, 160, 0.14);
--color-rl-danger-dim: rgba(255, 107, 107, 0.12);

/* Rastro do playhead (gradiente de opacidade no stroke vivo) */
--color-rl-oxy-trail: rgba(108, 242, 105, 0.25);
```

### Onde `.rl-raised` entra (e onde NÃO)
- **SIM:** cada célula de `VitalsReadout` e `OperationVitals` (a quina de luz no topo dá o volume de instrumento), cards do Painel (TrendChart, AttentionList), painel do ⌘K, popovers.
- **NÃO:** `CallLogRow` (linhas de log são planas de propósito), sparklines, chips.

### Tipografia — micro-refino
- **Unidade rebaixada:** todo readout separa valor de unidade — valor em `rl-readout` cor semântica, unidade (`%`, `min`, `x`, `pp`) num `<span>` `~0.62em text-rl-text-3`. Separa medição de rótulo. Componente `<Readout value unit/>` (ver §5).
- **Tracking negativo** só nos readouts grandes (`VitalsReadout` valor `text-xl`+, `OperationVitals` `text-2xl`): `letter-spacing: -0.02em` (o `.rl-readout` já tem -0.01em; herói leva um pouco mais).
- **`<Kbd>` consistente:** `border rl-border · bg rl-inset · font-mono · text-[10px] · px-1.5 py-0.5 · rounded-[5px]`. Usado no ⌘K, empty states, tooltips de tick.
- **Anton (`.rl-display`)** permanece SÓ em: título de página (Topbar), métrica-herói, e a nova **manchete editorial do Painel** (ver §4). Nunca em label/corpo.
- **Auditar:** garantir `tabular-nums` em TODO número medido — `TeamRanking`, `ObjectionRanking` (`count`, `pctOfCalls`), delta labels. Nada de número de medição em `font-ui`.

### Densidade & layering
- **Grid tipográfico rígido** nas telas de leitura (Detail, Busca): uma coluna de leitura calma, hierarquia por opacidade (4 níveis de texto já existem — usar os 4). Espaço em branco **orçado só em Detail/Busca**; feed operacional (Calls, log, fila) permanece **denso** — editorial é a hierarquia, não o vazio.
- **Escala de superfície:** manter canvas→s1→s2→s3. ⌘K e popovers em `surface-3` + `.rl-raised` + `radius-rl-modal`.
- **Sticky headers** com labels micro `text-[10px] uppercase tracking-wider text-rl-text-3` a ~50% de peso visual.

---

## 4. Momentos-assinatura por tela (estética + inteligência comercial)

Legenda: **[EST]** craft visual/movimento · **[INT]** upgrade de inteligência comercial (novo insight/visão).

### PAINEL (`/`) — "Sala de comando do líder"
1. **[INT] Briefing editorial + faixa "Desde ontem".** Manchete em Anton gerada da IA (ex.: *"DOIS DEALS ESCORREGARAM ONTEM. O TIME FALA 6PP ACIMA DA FAIXA."*) seguida de uma linha densa mono: `+4 sinais · 2 deals → risco · talk ratio médio 52%→48% · Nortex sumiu do radar`. Setas pintadas pela semântica (rep falando menos = `rl-oxy`; risco subindo = `rl-risk`). **Regra dura: nenhuma frase sem número atrás; a manchete linka pros deals citados.** Empty honesto na 1ª visita ("sem base de comparação ainda").
2. **[INT+EST] Linha do Horizonte (forecast como oxímetro projetado).** O TrendChart evolui: traço único `rl-oxy` 1.75px de S-7 até "Atual", cruza um **redline vertical em glow ("agora")** e continua como **cone pontilhado** — commit (linha central) numa banda best/at-risk em `rl-oxy-band` que abre com a incerteza. Segmento futuro fora da faixa saudável acende `rl-risk`. Desenha via `stroke-dashoffset` com cabeça de varredura glow na marca "agora". **Blindagem anti-clichê: é o MESMO traço fisicamente continuado, jamais uma área azul preenchida.**
3. **[INT+EST] OperationVitals vira single-stat (Grafana Stat panel).** Cada tile: número herói (count-up) + **sparkline de 8 semanas no rodapé** (traço 1.4px espelhando `toneColor()` — `rl-oxy`/`rl-risk`/`rl-text-3`, último ponto `rl-oxy-bright` como cauda do delta) + `<Delta>` com "era X". KPI vira filme: distingue "subiu 8%" de "subiu 8% mas vinha despencando 3 semanas".
4. **[INT] Fila de Intervenção (AttentionList reescrita = triagem de UTI + Gong Deal Warnings).** Ordenada por **severidade × valor do deal × recência**. Cada item: rail esquerdo 2px (`rl-danger` faz `rl-ping` UMA vez no crítico), `reasonType` tipado caixa-alta (`SINGLE-THREADED` · `CHAMPION INATIVO 12d` · `PREÇO SEM REAÇÃO` · `SEM PRÓXIMO PASSO` · `CONCORRENTE CITADO 4×` · `TALK-RATIO ALTO`), prova literal em `rl-text-2` com **`<EvidenceChip>` clicável**, recência mono ("há 12 dias"), e um **chip de ação recomendada** verde de um clique (`Puxar CTO pra call` · `Cobrar próximo passo`). Prescritivo, não descritivo. Severidade pinta só o rail, nunca o fundo.
5. **[INT+EST] TrendChart com threshold band.** `<rect>` horizontal `rl-oxy-band` atrás da linha de sentimento marca a faixa saudável; polyline colorida **por segmento** (verde dentro, `rl-risk` fora) em vez de verde uniforme. Usuário sabe *por que* 62% é ruim sem ler eixo.
6. **[INT] Scorecard de coaching (TeamRanking vira gestão de gente).** Cada closer: mini-sparkline de **escala fixa compartilhada** do `talkRatioTrend` nas últimas N calls + delta mono vs. média do time (`+9pp fora da faixa`). Pinta **âmbar quem está fora da faixa-alvo de um vital**, nunca "o último colocado". Linha clicável → futura visão do rep.
7. **[EST] BuyingSignals com `<EvidenceChip>`** — cada sinal deep-linka pro `SpeakerTurn` (o recibo), entrada em stagger.

### CALLS (`/calls`) — "Mural de operação"
1. **[INT] Saved views (Attio).** Fileira de view-chips acima da lista: `Todas · Em risco · Forecast escorregando · Sinais fortes · Meus deals · Processando` (reusa `SignalChip` como base; ativo = borda `rl-oxy`). Codifica as perguntas reais do gestor em um clique. Foco-anel verde obrigatório.
2. **[EST] Header de colunas sticky.** `top-0 bg-rl-canvas`, labels `text-[10px] uppercase text-rl-text-3`, **mesma grid-template do CallLogRow** para alinhar.
3. **[EST] CallLogRow — navegação por teclado.** Roving tabindex `↑/↓/j/k/Enter`; **foco de teclado distinto do hover de mouse** (rail `rl-oxy` 2px vs. `hover:bg-rl-surface-1`). Trocar a **seta `>` sempre-visível** por cluster de ações reveladas só em `group-hover/focus` (`Abrir` · `Copiar follow-up`) + a seta.
4. **[INT+EST] Mini-pulse de escala FIXA comparável (mural de UTI).** Hoje cada sparkline usa `ampScale` randômico (ótimo p/ assinatura única, péssimo p/ comparar). Dar a cada linha um sparkline mapeando **talk-ratio real por minuto**, `viewBox` e domínio y **iguais em todas** — a anomalia salta pela silhueta. `ampScale` randômico fica restrito ao pulso decorativo quando não há dado.
5. **[INT] Vital dominante inline.** Densificar a linha com o vital que importa já visível (mini talk-ratio) pra escanear sem entrar.
6. **[EST] Rail de severidade** na Link row quando `signal="risco"` (2px, reusa o hover existente). Ordenação: risco no topo, processando por último.
7. **[EST] Shared-element morph** — o wrapper do sparkline recebe `viewTransitionName: 'pulse-'+call.id` (origem do voo pro Detail).

### CALL DETAIL (`/calls/[id]`) — "O palco do instrumento vivo"
1. **[EST] PulseWave large que se desenha** (rl-draw, stagger rep→prospect) + **cabeça de varredura viva com glow** presa ao scroll do transcript (o único glow da tela).
2. **[INT+EST] MomentTrack scrubável** — faixa de ~10px logo abaixo do Pulse, alinhada à MESMA timeline. Ticks color-coded por token: `rl-oxy`=sinal de compra, `rl-risk`=objeção, `rl-danger`=objeção crítica, `rl-prospect`=preço/concorrente. Losango mono no topo de cada tick. Hover → popover `surface-3` `.rl-raised` com citação literal + timestamp mono; clique → scroll+highlight no `SpeakerTurn`. `SignalChip` vira legenda inline acima. Derivado dos timestamps de `transcript/objections/buyingSignals`.
3. **[INT] "Impacto no Forecast" no topo** — quanto aquele deal pesa no commit do trimestre (de B). Dá peso de decisão à tela.
4. **[INT+EST] VitalsReadout com faixa-alvo.** Sob cada valor mono, micro-barra de 3px com a **zona saudável em `rl-oxy-band`** e um **ponteiro** (valor atual); fora da faixa → ponteiro âmbar. `talkRatioColor()` já define os cortes (40–55% saudável, ≥60% âmbar) — só torná-los geometria. Anton só no herói; a faixa é geometria fina.
5. **[INT] 2 vitais novos de coaching** que nenhum dashboard genérico tem: **`MAIOR MONÓLOGO 4:12`** (acende âmbar acima de ~2:30) e **`PERGUNTAS/HORA`**. O número só significa contra a norma.
6. **[EST] `<EvidenceChip>` em TODA inferência** — buying signals, objeções, keyPoints, sentimento no VitalsReadout. Clique = deep-link pro `SpeakerTurn` (mesmo alvo do MomentTrack). **Regra de sistema: se a IA afirma, tem receipt clicável.**
7. **[EST] Estado "processando" = skeleton que espelha o layout final.** VitalsReadout em modo silhueta (mesmas 5 células, label visível, valor = barra `rl-inset` com shimmer verde), PulseWave em **flatline pulsante com blip verde varrendo** ("oxímetro calibrando"), label "gerando sinais…". **Zero spinner.**
8. **[EST] Morph de entrada** vindo da lista (`pulse-'+id`), continuidade de instrumento.

### BUSCA (`/search`) — "A materialização do recibo"
1. **[INT+EST] Empty state de primeira classe.** Glifo de oxímetro estático (traço PulseWave `rl-text-muted`), headline Anton curta *"AUSCULTE SUAS CALLS"*, chips de busca **reais** clicáveis (`objeção de preço` · `menção a concorrente` · `sinal de compra`) roteando pra `?q=`, e `<Kbd>⌘K</Kbd>`. Mata o "tela flutuando no vazio".
2. **[EST] Sem-resultado ensina o atalho:** `Nenhum trecho com "x"` + `<Kbd>⌘K</Kbd>` pra refinar. Mesmo tratamento para lista de Calls vazia por filtro.
3. **[INT] Resultado = o próprio recibo:** trecho + timestamp mono + **query realçada no `SpeakerTurn`**. É Chorus quotes nativo.
4. **[EST]** Resultados com roving tabindex + ações reveladas (mesmo padrão de Calls).

### TRANSVERSAL — ⌘K como coluna vertebral
- **[EST+INT] Command palette global** (de A/B/C, unânime). Promover o campo do Topbar a overlay `surface-3` `radius-rl-modal` `.rl-raised` (backdrop leve). Input = linha grande sem borda de campo, placeholder que muda de contexto. Seções agrupadas: **Ir para** (Painel/Calls/Busca) · **Calls recentes** (CallLogRow compacto com mini-pulse) · **Buscar trecho** (roteia `?q=`) · **Ações** (`Copiar follow-up`, saved views). Item ativo = **barra `rl-oxy` 2px à esquerda + `bg-rl-surface-2`**; `<Kbd>` à direita de cada linha. **Setas/Enter/Esc obrigatórios.** O `:focus-visible` verde fecha o loop de marca. O campo do Topbar vira só o gatilho visual (com hint `⌘K` mono).

---

## 5. Componentes — novos & upgrades (nomeados)

### Novos componentes
| Componente | Papel | Notas de impl. |
|---|---|---|
| `CommandPalette` | ⌘K global overlay | `"use client"`, portal, roving focus, seções, `<Kbd>`, Esc/setas/Enter. |
| `Readout` | valor+unidade com count-up | `<Readout value={47} unit="%" tone="oxy"/>`; valor mono, unidade 0.62em `rl-text-3`; `useCountUp`. |
| `Kbd` | chip de atalho | borda `rl-border`, `bg rl-inset`, mono 10px. |
| `Delta` | delta com seta+sinal | `▲ rl-oxy` / `▼ rl-risk`, mono, `tone` semântico; "era X" opcional. |
| `EvidenceChip` | recibo clicável | mono `timestamp ›`, deep-link `#turn-<ts>` pro SpeakerTurn. Anexado a todo insight. |
| `MomentTrack` | trilha de eventos scrubável | 10px sob o Pulse large, ticks color-coded, popover, click→scroll. |
| `TargetBand` | faixa-alvo sob readout | micro-barra 3px, zona `rl-oxy-band` + ponteiro (âmbar fora). |
| `Sparkline` | mini-traço de escala fixa | wrapper fino sobre PulseWave/polyline; `domain` compartilhado p/ comparabilidade. |
| `ForecastTrace` | linha do horizonte | traço + redline "agora" + cone pontilhado + banda; draw + cabeça glow. |
| `SinceYesterdayBar` | faixa "Desde ontem" | uma linha mono densa, setas semânticas, empty honesto. |
| `LeaderHeadline` | manchete editorial | Anton, gerada da IA, cada frase linka pra evidência. |
| `InterventionQueue` | fila prescritiva | substitui AttentionList; rail, reasonType, EvidenceChip, ação recomendada. |
| `SweepHead` | cabeça de varredura viva | `<circle>` rl-oxy-bright + `.rl-glow`, rAF preso ao scroll, degrade gracioso. |
| `Toast` / `ToastHost` | apito do monitor | sonner-style, bottom-right, stack. |
| `Skeleton` (Vitals/Pulse) | loading que espelha layout | flatline+sweep, silhueta de célula; zero spinner. |
| `useCountUp` (hook) | odômetro | rAF + outExpo, respeita reduced-motion. |
| `useViewTransition` (hook) | morph de navegação | wrapper do View Transitions do Next 16. |

### Upgrades de componentes existentes
- **`PulseWave`** → adicionar `variant="large"` com `.rl-trace` (draw), camada `<linearGradient>` de rastro, prop `events?: {tSeconds,type,quote}[]` p/ MomentTrack, prop `data?: number[]` p/ sparkline de escala fixa (bypass do `ampScale` randômico). Sparkline permanece estática.
- **`VitalsReadout`** → `Readout` + `TargetBand` por vital; +2 vitais (`MAIOR MONÓLOGO`, `PERGUNTAS/HORA`); `.rl-raised` por célula; `EvidenceChip` no sentimento.
- **`OperationVitals`** → single-stat: `Readout` (count-up) + `Sparkline` de rodapé + `Delta` "era X"; `.rl-raised`.
- **`TrendChart`** → threshold band + linha por-segmento + evolução p/ `ForecastTrace` (cone); draw na viewport.
- **`AttentionList`** → renomear/reescrever como `InterventionQueue`.
- **`TeamRanking`** → `Sparkline` de talk-ratio (escala fixa) + `Delta` vs. time; âmbar por vital fora da faixa.
- **`CallLogRow`** → hover coreografado, rail de foco/severidade, ações reveladas, `viewTransitionName`, `Sparkline` de escala fixa, blip no lugar do `animate-pulse`.
- **`Topbar`** → search vira gatilho do `CommandPalette` + hint `<Kbd>⌘K</Kbd>`.
- **`SignalChip`** → base dos view-chips; estado de chegada com `rl-ping` one-shot.
- **`BuyingSignals` / `ObjectionRanking`** → `EvidenceChip`; auditar `tabular-nums`.

### Mudanças de dados (mock) — **apenas aditivas**
- `calls.ts` `Call`: `+ longestMonologueSec: number`, `+ questionsPerHour: number`. `Objection` e cada buying signal: `+ atTimestamp: string (mm:ss)`, `+ quote: string`. Estender `PulseSegment`/derivar `events: {tSeconds,type,quote}[]` p/ MomentTrack. `+ talkRatioByMinute?: number[]` p/ sparkline de escala fixa.
- `intelligence.ts`: `AttentionItem.reason: string` → `{ type: ReasonType, evidence: string, ageLabel: string }` + `recommendedAction: string` + `dealValue?: number`. `OperationMetric + history: number[]`. `CloserRanking + talkRatioTrend: number[]` + `vsTeamDelta: number`. `+ forecast: { commit, best, worst, confidence }`. `SinceYesterday` object. `WeeklyPoint` já serve ao forecast (estender com futuro pontilhado).

---

## 6. Regras anti-genérico & checklist de aceitação

### Regras anti-genérico (o antídoto contra "mais um dashboard escuro")
1. **Verde só como sinal.** Se um verde não significa fala-do-rep/positivo/ativo/sinal-saudável → tirar. Forecast, coaching, sparklines: verde só quando o vital está saudável.
2. **Anton só no herói.** Título de página, métrica-herói, manchete editorial. Trocar Anton por Inter deve DESTRUIR a identidade.
3. **Todo número de medição em mono tabular** com unidade rebaixada. Nada de número medido em `font-ui`.
4. **Bordas sussurram.** Depth = borda baixa-opacidade + `.rl-raised` (linha-de-luz), nunca drop-shadow dramático. Severidade = rail 2px, nunca fundo chapado.
5. **Se a IA afirma, tem receipt clicável.** Sem exceção. Nenhuma inferência órfã.
6. **Prescritivo > descritivo.** Todo risco carrega o *porquê* datado + a *ação*. Elimina o "e daí?".
7. **Um count-up por tela, um ping por evento, dois loops vivos no máx.** (playhead + shimmer). Todo o resto é one-shot ≤800ms.
8. **Métrica médica explícita na copy e na geometria** (oxímetro, faixa saudável, ausculta, sinais vitais) — impede o vocabulário Grafana/Datadog de sequestrar a marca.
9. **Feed operacional denso; espaço em branco só nas telas de leitura.** Editorial é hierarquia, não vazio.
10. **Sparkline de comparação = escala fixa compartilhada.** ampScale randômico só decora quando não há dado.

### Checklist de aceitação (rodar antes de entregar cada tela)
- [ ] **Swap test:** trocar Anton→Inter e o log→tabela branca destrói a identidade? Se não, defaultou.
- [ ] **Squint test:** desfocado, sobra o pulso verde + um número mono? Nada mais salta (rails finos, bordas sussurram)?
- [ ] **Receipt test:** cada afirmação da IA na tela tem chip clicável que pula pro turno exato?
- [ ] **Prescrição test:** cada item de risco diz *o que fazer* (ação), não só *o que é*?
- [ ] **Faixa test:** todo vital com faixa-alvo mostra dentro/fora sem o usuário calcular?
- [ ] **Movimento test:** com `prefers-reduced-motion: reduce`, tudo assenta no valor final sem animar? No modo normal, no máx. um count-up e um draw dispararam; só playhead+shimmer fazem loop?
- [ ] **Teclado test:** ⌘K abre em qualquer tela; lista navega por ↑/↓/Enter/Esc; foco-anel verde visível; foco-de-teclado distinto do hover?
- [ ] **Densidade test:** feed operacional continua denso e escaneável; espaço em branco só onde há leitura?
- [ ] **Delta test:** cada KPI mostra estado + tendência (sparkline) + julgamento (cor de threshold) + "era X"?
- [ ] **Estados test:** processando = skeleton que espelha layout + flatline sweep (zero spinner); empty = 1ª classe com `<Kbd>`; foco/hover/active/disabled presentes.
- [ ] **Token test:** zero hex solto; toda cor via token; toda medida na escala 4px.
- [ ] **Comparabilidade test:** sparklines de comparação (Calls, TeamRanking) usam escala fixa compartilhada, não ampScale randômico.

---

## Ordem de implementação sugerida (menor risco → maior "wow")
1. **Fundação:** tokens de movimento + `.rl-raised` + `Readout`/`Kbd`/`Delta` + `useCountUp` + reduced-motion. (Baixo risco, eleva tudo.)
2. **Inteligência de dados:** aditivos no mock (`atTimestamp`/`quote`, `reasonType`+`recommendedAction`, `history`, `talkRatioTrend`, forecast, 2 vitais). (Destrava o resto.)
3. **Painel:** SinceYesterdayBar + LeaderHeadline + OperationVitals single-stat + InterventionQueue + TrendChart threshold. (Maior payload de inteligência.)
4. **Detail:** VitalsReadout+TargetBand + EvidenceChip + MomentTrack + PulseWave draw + skeleton. (Palco do craft.)
5. **Transversal:** CommandPalette ⌘K + Busca empty states.
6. **Alto brilho (por último, guardado por reduced-motion):** SweepHead vivo + ForecastTrace cone + shared-element morph. (Caros de acertar — degradar graciosamente se travar.)

*Regra de ouro final: quando em dúvida entre espetáculo e contenção, escolha contenção. Um instrumento sério impressiona por precisão, não por movimento.*
