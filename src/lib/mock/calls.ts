// Dados mock — sem backend. Calls de vendas B2B fictícias (contas e pessoas fictícias, BR).

export type CallStatus = "pronto" | "processando";
export type Speaker = "rep" | "prospect";

export type PulseSegment = {
  speaker: Speaker;
  /** duração relativa do segmento (soma dos segmentos de uma call não precisa fechar 100) */
  weight: number;
};

export type TranscriptTurn = {
  speaker: Speaker;
  speakerName: string;
  timestamp: string; // mm:ss
  text: string;
};

export type Objection = {
  text: string;
  severity: "risco" | "critica";
  /** recibo: timestamp do turno que originou a objeção (mm:ss) */
  atTimestamp?: string;
  /** citação literal do transcript (a prova) */
  quote?: string;
};

/** Sinal de compra com recibo — deep-link pro turno exato */
export type BuyingSignalDetail = {
  atTimestamp: string; // mm:ss
  quote: string;
};

export type NextStep = {
  text: string;
  done: boolean;
  owner: string;
};

/** Evento na timeline da call (para o MomentTrack scrubável) */
export type MomentType = "sinal" | "objecao" | "objecao-critica" | "preco";
export type Moment = {
  tSeconds: number;
  type: MomentType;
  quote: string;
  atTimestamp: string;
};

export type Call = {
  id: string;
  account: string;
  prospectName: string;
  prospectRole: string;
  closer: string;
  closerInitials: string;
  date: string; // ISO
  dateLabel: string; // dd/mm hh:mm
  durationLabel: string; // mm:ss
  durationSeconds: number;
  status: CallStatus;
  talkRatioRep: number; // % do tempo falado pelo rep
  sentiment: "positivo" | "neutro" | "negativo";
  sentimentScore: number; // -100 a 100
  objectionsCount: number;
  buyingSignalsCount: number;
  signal: "sinal" | "risco" | null;
  pulse: PulseSegment[];
  /** vitais de coaching — só significam contra a norma */
  longestMonologueSec: number;
  questionsPerHour: number;
  /** talk-ratio do rep por minuto — escala fixa 0-100 pra comparabilidade entre calls */
  talkRatioByMinute?: number[];
  /** impacto do deal no commit do trimestre (R$) — peso de decisão */
  dealValue?: number;
  forecastWeightPct?: number; // % do commit do trimestre que esse deal representa
  summary?: string;
  keyPoints?: string[];
  objections?: Objection[];
  buyingSignalDetails?: BuyingSignalDetail[];
  nextSteps?: NextStep[];
  transcript: TranscriptTurn[];
};

function pulseFrom(pattern: Array<[Speaker, number]>): PulseSegment[] {
  return pattern.map(([speaker, weight]) => ({ speaker, weight }));
}

/** mm:ss -> segundos */
export function tsToSeconds(ts: string): number {
  const [m, s] = ts.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

export const calls: Call[] = [
  {
    id: "cl-8841",
    account: "Nortex Logística",
    prospectName: "Fernanda Aquino",
    prospectRole: "Diretora de Operações",
    closer: "Bruno Kellner",
    closerInitials: "BK",
    date: "2026-07-10T09:15:00-03:00",
    dateLabel: "10/07 · 09:15",
    durationLabel: "38:12",
    durationSeconds: 2292,
    status: "pronto",
    talkRatioRep: 47,
    sentiment: "positivo",
    sentimentScore: 62,
    objectionsCount: 1,
    buyingSignalsCount: 3,
    signal: "sinal",
    longestMonologueSec: 74,
    questionsPerHour: 14,
    talkRatioByMinute: [52, 60, 44, 41, 38, 55, 47, 43, 49, 45],
    dealValue: 480000,
    forecastWeightPct: 22,
    pulse: pulseFrom([
      ["rep", 3], ["prospect", 2], ["rep", 4], ["prospect", 5], ["rep", 2],
      ["prospect", 3], ["rep", 5], ["prospect", 2], ["rep", 3], ["prospect", 4],
    ]),
    summary:
      "Fernanda confirmou dor em rastreamento de frota multimodal e validou orçamento aprovado para Q3. Pediu comparativo técnico com o fornecedor atual (LogTrack) antes de avançar para proposta.",
    keyPoints: [
      "Frota de 340 veículos, hoje sem visibilidade em tempo real entre transportadoras parceiras.",
      "Budget de Q3 já aprovado pela diretoria financeira — não é mais objeção de preço.",
      "Decisão em comitê: Fernanda + CTO + Compras. CTO ainda não participou de nenhuma call.",
    ],
    objections: [
      {
        text: "Precisa validar integração com o TMS atual (Solvis) antes de assinar.",
        severity: "risco",
        atTimestamp: "02:40",
        quote: "Mas preciso entender como isso conversa com o nosso TMS, hoje usamos o Solvis.",
      },
    ],
    buyingSignalDetails: [
      { atTimestamp: "04:20", quote: "Já aprovamos verba pra Q3 justamente pra resolver esse gap de visibilidade." },
      { atTimestamp: "03:30", quote: "Seria bom trazer nosso CTO, o Ricardo, pra essa conversa técnica." },
      { atTimestamp: "05:24", quote: "Se puder incluir a LogTrack no comparativo, ajuda demais na minha apresentação interna." },
    ],
    nextSteps: [
      { text: "Enviar comparativo técnico vs. LogTrack até quinta-feira.", done: false, owner: "Bruno" },
      { text: "Agendar call técnica com o CTO da Nortex.", done: false, owner: "Bruno" },
      { text: "Confirmar SLA de integração com o time de engenharia.", done: true, owner: "Bruno" },
    ],
    transcript: [
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "00:04", text: "Fernanda, bom dia! Obrigado por reservar o horário. Antes de começar, topa eu gravar a call pra eu focar 100% na conversa?" },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "00:18", text: "Pode gravar sim, sem problema. Vim direto de outra reunião então já aviso, tenho até as dez." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "00:29", text: "Perfeito, vou direto ao ponto então. Da nossa troca por e-mail entendi que vocês perdem visibilidade quando a carga passa de transportadora própria pra parceira. É isso mesmo?" },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "00:52", text: "Exatamente. A gente rastreia bonitinho enquanto é frota própria, mas assim que entra parceiro terceirizado é telefone e planilha. Isso já gerou atraso feio com um cliente grande mês passado." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "01:20", text: "Entendi. E hoje, quantos veículos transitam por essa zona cinzenta, entre frota própria e parceira?" },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "01:34", text: "Da frota total de 340, uns 40% passam por parceiro em algum trecho da rota." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "02:10", text: "Faz sentido. O nosso módulo de rastreamento multimodal resolve exatamente esse handoff, com um único painel pra frota própria e parceira." },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "02:40", text: "Isso me interessa bastante. Mas preciso entender como isso conversa com o nosso TMS, hoje usamos o Solvis." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "03:05", text: "Temos integração nativa com Solvis via API, isso não é problema. Posso trazer nosso time técnico numa próxima call pra detalhar isso com quem for validar." },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "03:30", text: "Ótimo, seria bom trazer nosso CTO, o Ricardo, pra essa conversa técnica." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "04:02", text: "Combinado. E do lado orçamentário, como está? Vocês têm budget alocado pra esse tipo de solução esse ano?" },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "04:20", text: "Sim, já aprovamos verba pra Q3 justamente pra resolver esse gap de visibilidade. Não é mais uma questão de preço, é de escolher o parceiro certo." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "05:01", text: "Excelente, isso ajuda demais. Vou preparar um comparativo técnico entre nós e o fornecedor que vocês avaliam hoje, pra vocês decidirem com segurança." },
      { speaker: "prospect", speakerName: "Fernanda Aquino", timestamp: "05:24", text: "Perfeito. A gente está olhando também a LogTrack, então se puder incluir eles no comparativo, ajuda demais na minha apresentação interna." },
    ],
  },
  {
    id: "cl-8839",
    account: "Cedro Farmacêutica",
    prospectName: "Diego Marins",
    prospectRole: "Head de Supply Chain",
    closer: "Camila Vasques",
    closerInitials: "CV",
    date: "2026-07-09T14:30:00-03:00",
    dateLabel: "09/07 · 14:30",
    durationLabel: "24:47",
    durationSeconds: 1487,
    status: "pronto",
    talkRatioRep: 68,
    sentiment: "negativo",
    sentimentScore: -28,
    objectionsCount: 3,
    buyingSignalsCount: 0,
    signal: "risco",
    longestMonologueSec: 156,
    questionsPerHour: 4,
    talkRatioByMinute: [70, 82, 88, 74, 91, 66, 72, 60],
    dealValue: 320000,
    forecastWeightPct: 15,
    pulse: pulseFrom([
      ["rep", 6], ["prospect", 1], ["rep", 5], ["prospect", 1], ["rep", 6],
      ["prospect", 2], ["rep", 4], ["prospect", 1],
    ]),
    summary:
      "Diego demonstrou frieza desde o início. Rep falou 68% do tempo, sem deixar espaço pra qualificação. Três objeções levantadas — preço, timing e concorrente incumbente — nenhuma endereçada com dado concreto. Risco alto de perder o deal.",
    keyPoints: [
      "Contrato atual com concorrente (RotaCerta) vence só em dezembro — sem urgência real.",
      "Diego mencionou corte de orçamento em TI para o segundo semestre.",
      "Rep não conseguiu identificar o processo de decisão nem outros stakeholders.",
    ],
    objections: [
      {
        text: "Já temos contrato vigente com a RotaCerta até dezembro.",
        severity: "critica",
        atTimestamp: "03:10",
        quote: "A gente já tem contrato com a RotaCerta até dezembro. Não sei se faz sentido continuar essa conversa agora.",
      },
      {
        text: "Corte de orçamento de TI anunciado para o H2.",
        severity: "critica",
        atTimestamp: "03:50",
        quote: "Tivemos um corte de orçamento de TI pro segundo semestre, então qualquer investimento novo tá mais difícil de aprovar agora.",
      },
      {
        text: "Não vê diferencial claro frente ao fornecedor atual.",
        severity: "risco",
        atTimestamp: "05:30",
        quote: "Sinceramente não estou vendo muita diferença do que já usamos hoje.",
      },
    ],
    nextSteps: [
      { text: "Reagendar com foco em descoberta, reduzir talk ratio do rep.", done: false, owner: "Camila" },
      { text: "Mapear quem mais participa da decisão além do Diego.", done: false, owner: "Camila" },
    ],
    transcript: [
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "00:05", text: "Diego, tudo certo? Vou te mostrar rapidinho a plataforma inteira, separei uma demo bem completa hoje." },
      { speaker: "prospect", speakerName: "Diego Marins", timestamp: "00:15", text: "Pode ser, mas eu tenho só uns vinte minutos hoje." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "00:22", text: "Sem problema, vou ser rápida. Então, a gente atende mais de duzentos clientes do setor farma, com módulo de rastreamento, dashboard executivo, alertas automáticos..." },
      { speaker: "prospect", speakerName: "Diego Marins", timestamp: "01:40", text: "Certo." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "01:44", text: "...e ainda temos a parte de compliance regulatório, que pra farma é essencial, com trilha de auditoria completa, relatórios automáticos pra Anvisa..." },
      { speaker: "prospect", speakerName: "Diego Marins", timestamp: "03:10", text: "Olha, sinceramente, a gente já tem contrato com a RotaCerta até dezembro. Não sei se faz sentido continuar essa conversa agora." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "03:28", text: "Entendo, mas vale a pena já conhecer porque nosso processo de implementação leva uns 60 dias, então dá tempo de planejar a transição." },
      { speaker: "prospect", speakerName: "Diego Marins", timestamp: "03:50", text: "É que também tivemos um corte de orçamento de TI pro segundo semestre, então qualquer investimento novo tá mais difícil de aprovar agora." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "04:05", text: "Entendi. Bom, deixa eu te mostrar mais um pouco da parte de dashboards, acho que isso vai te convencer." },
      { speaker: "prospect", speakerName: "Diego Marins", timestamp: "05:30", text: "Sinceramente não estou vendo muita diferença do que já usamos hoje." },
    ],
  },
  {
    id: "cl-8837",
    account: "Vórtice Alimentos",
    prospectName: "Patrícia Yamamoto",
    prospectRole: "VP Comercial",
    closer: "Bruno Kellner",
    closerInitials: "BK",
    date: "2026-07-09T11:00:00-03:00",
    dateLabel: "09/07 · 11:00",
    durationLabel: "41:55",
    durationSeconds: 2515,
    status: "pronto",
    talkRatioRep: 39,
    sentiment: "positivo",
    sentimentScore: 81,
    objectionsCount: 0,
    buyingSignalsCount: 5,
    signal: "sinal",
    longestMonologueSec: 48,
    questionsPerHour: 18,
    talkRatioByMinute: [42, 38, 33, 40, 36, 44, 35, 39, 37, 41],
    dealValue: 620000,
    forecastWeightPct: 28,
    pulse: pulseFrom([
      ["rep", 2], ["prospect", 5], ["rep", 3], ["prospect", 6], ["rep", 2],
      ["prospect", 4], ["rep", 3], ["prospect", 5], ["rep", 2], ["prospect", 4],
    ]),
    summary:
      "Call quase perfeita — Patrícia liderou boa parte da conversa, trouxe caso de uso detalhado e pediu proposta comercial antes mesmo do rep sugerir. Cinco sinais de compra claros, zero objeção.",
    keyPoints: [
      "Patrícia já rodou um piloto informal comparando concorrentes e quer decidir até o fim do mês.",
      "Pediu explicitamente cronograma de implementação e SLA de suporte.",
      "Mencionou expansão para 3 novas plantas em 2027, o que amplia o ticket.",
    ],
    objections: [],
    buyingSignalDetails: [
      { atTimestamp: "00:20", quote: "Testamos três fornecedores em paralelo e o de vocês foi o único que resolveu o problema sem gambiarra." },
      { atTimestamp: "01:58", quote: "Se vocês me mandarem uma proposta formal essa semana, eu levo pro nosso comitê na sexta." },
      { atTimestamp: "02:50", quote: "Temos três plantas novas entrando em operação em 2027, já quero deixar isso previsto no contrato." },
      { atTimestamp: "03:40", quote: "Cronograma detalhado de implementação e o SLA de suporte. Com isso eu fecho a apresentação." },
      { atTimestamp: "01:05", quote: "Já ter integração pronta com nosso ERP pra mim já elimina um baita risco de projeto." },
    ],
    nextSteps: [
      { text: "Enviar proposta comercial formal em até 48h.", done: false, owner: "Bruno" },
      { text: "Incluir cláusula de expansão para novas plantas.", done: false, owner: "Bruno" },
      { text: "Agendar assinatura para a próxima semana.", done: false, owner: "Bruno" },
    ],
    transcript: [
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "00:06", text: "Patrícia, bom te ver de novo. Como ficou aquela avaliação interna que vocês estavam fazendo?" },
      { speaker: "prospect", speakerName: "Patrícia Yamamoto", timestamp: "00:20", text: "Ficou muito boa pra vocês, sinceramente. Testamos três fornecedores em paralelo e o de vocês foi o único que resolveu o problema de rastreio de lote em tempo real sem gambiarra." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "00:48", text: "Que ótimo ouvir isso. O que mais pesou nessa comparação?" },
      { speaker: "prospect", speakerName: "Patrícia Yamamoto", timestamp: "01:05", text: "A velocidade de implementação, principalmente. E o fato de já ter integração pronta com nosso ERP. Isso pra mim já elimina um baita risco de projeto." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "01:40", text: "Faz total sentido. E em termos de cronograma, como está a expectativa de vocês?" },
      { speaker: "prospect", speakerName: "Patrícia Yamamoto", timestamp: "01:58", text: "Queremos decidir até o fim do mês. Inclusive, já posso adiantar: se vocês me mandarem uma proposta formal essa semana, eu levo pro nosso comitê na sexta." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "02:30", text: "Combinado, te mando em até 48 horas. Só uma pergunta: vocês pensam em expandir isso pra outras plantas também?" },
      { speaker: "prospect", speakerName: "Patrícia Yamamoto", timestamp: "02:50", text: "Sim, temos três plantas novas entrando em operação em 2027, então já quero deixar isso previsto no contrato." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "03:20", text: "Perfeito, vou incluir uma cláusula de expansão já com condições fechadas. Mais alguma coisa que você precisa pra levar ao comitê?" },
      { speaker: "prospect", speakerName: "Patrícia Yamamoto", timestamp: "03:40", text: "Cronograma detalhado de implementação e o SLA de suporte. Com isso eu fecho a apresentação." },
    ],
  },
  {
    id: "cl-8834",
    account: "Altiplano Seguros",
    prospectName: "Marcos Vinícius Prado",
    prospectRole: "Gerente de TI",
    closer: "Ísis Nogueira",
    closerInitials: "IN",
    date: "2026-07-08T16:20:00-03:00",
    dateLabel: "08/07 · 16:20",
    durationLabel: "29:03",
    durationSeconds: 1743,
    status: "pronto",
    talkRatioRep: 55,
    sentiment: "neutro",
    sentimentScore: 8,
    objectionsCount: 2,
    buyingSignalsCount: 1,
    signal: "risco",
    longestMonologueSec: 92,
    questionsPerHour: 9,
    talkRatioByMinute: [50, 58, 62, 54, 49, 56, 60, 52],
    dealValue: 260000,
    forecastWeightPct: 12,
    pulse: pulseFrom([
      ["rep", 3], ["prospect", 3], ["rep", 4], ["prospect", 2], ["rep", 3],
      ["prospect", 3], ["rep", 4], ["prospect", 2],
    ]),
    summary:
      "Marcos é tecnicamente exigente e trouxe duas preocupações de segurança de dados que ainda não foram resolvidas. Sinal de compra único, mas real: pediu certificações de compliance por escrito.",
    keyPoints: [
      "Segurança de dados é bloqueador nº1 — setor de seguros tem exigência regulatória alta.",
      "Marcos não é o decisor final, reporta ao CISO.",
      "Pediu documentação formal de certificações (ISO 27001, LGPD).",
    ],
    objections: [
      {
        text: "Preocupação com onde os dados ficam hospedados (residência de dados).",
        severity: "risco",
        atTimestamp: "00:22",
        quote: "A principal é sobre onde os dados ficam hospedados. Seguradora tem exigência forte de residência de dados no Brasil.",
      },
      {
        text: "Time de segurança (CISO) ainda não validou o fornecedor.",
        severity: "risco",
        atTimestamp: "01:45",
        quote: "Preciso disso por escrito pra passar pro nosso CISO, ele que vai bater o martelo em termos de segurança.",
      },
    ],
    buyingSignalDetails: [
      { atTimestamp: "02:20", quote: "Se a documentação estiver em ordem, aí sim eu me sinto confortável em recomendar avançar." },
    ],
    nextSteps: [
      { text: "Enviar dossiê de certificações e política de residência de dados.", done: false, owner: "Ísis" },
      { text: "Marcar call com o CISO da Altiplano.", done: false, owner: "Ísis" },
    ],
    transcript: [
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "00:08", text: "Marcos, valeu por topar essa call técnica. Vi que você mandou uma lista de perguntas antes, ótimo, vamos direto nelas." },
      { speaker: "prospect", speakerName: "Marcos Vinícius Prado", timestamp: "00:22", text: "Isso, a principal é sobre onde os dados ficam hospedados. Seguradora tem exigência forte de residência de dados no Brasil." },
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "00:45", text: "Ótima pergunta. Nossos dados ficam em datacenter no Brasil, região São Paulo, com replicação também em território nacional." },
      { speaker: "prospect", speakerName: "Marcos Vinícius Prado", timestamp: "01:10", text: "Isso ajuda. E vocês têm certificação ISO 27001?" },
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "01:20", text: "Temos sim, posso te mandar o certificado junto com nossa política de LGPD detalhada." },
      { speaker: "prospect", speakerName: "Marcos Vinícius Prado", timestamp: "01:45", text: "Perfeito, preciso disso por escrito pra passar pro nosso CISO, ele que vai bater o martelo em termos de segurança." },
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "02:05", text: "Combinado. Mando ainda hoje. Faz sentido já agendar uma call com ele diretamente?" },
      { speaker: "prospect", speakerName: "Marcos Vinícius Prado", timestamp: "02:20", text: "Faz. Se a documentação estiver em ordem, aí sim eu me sinto confortável em recomendar avançar." },
    ],
  },
  {
    id: "cl-8830",
    account: "Ferraz & Bittencourt Advogados",
    prospectName: "Renata Bittencourt",
    prospectRole: "Sócia-fundadora",
    closer: "Camila Vasques",
    closerInitials: "CV",
    date: "2026-07-08T10:00:00-03:00",
    dateLabel: "08/07 · 10:00",
    durationLabel: "18:34",
    durationSeconds: 1114,
    status: "pronto",
    talkRatioRep: 44,
    sentiment: "positivo",
    sentimentScore: 55,
    objectionsCount: 1,
    buyingSignalsCount: 2,
    signal: "sinal",
    longestMonologueSec: 58,
    questionsPerHour: 15,
    talkRatioByMinute: [46, 42, 48, 40, 45, 43],
    dealValue: 180000,
    forecastWeightPct: 8,
    pulse: pulseFrom([
      ["rep", 3], ["prospect", 4], ["rep", 2], ["prospect", 3], ["rep", 3], ["prospect", 3],
    ]),
    summary:
      "Primeira call de descoberta com sócia-fundadora. Boa energia, dor clara em gestão de prazos processuais. Objeção pontual sobre curva de adoção da equipe jurídica, mas orçamento já sinalizado como não-problema.",
    keyPoints: [
      "Escritório com 40 advogados, hoje controla prazos em planilha compartilhada.",
      "Já perderam prazo processual uma vez este ano — motivador forte de mudança.",
      "Renata decide sozinha, sem comitê.",
    ],
    objections: [
      {
        text: "Receio de resistência da equipe mais sênior a uma ferramenta nova.",
        severity: "risco",
        atTimestamp: "01:42",
        quote: "Minha preocupação maior é a resistência dos advogados mais antigos a mudar de ferramenta.",
      },
    ],
    buyingSignalDetails: [
      { atTimestamp: "00:18", quote: "Já perdemos um prazo esse ano por causa disso, foi um susto grande." },
      { atTimestamp: "02:35", quote: "Se resolver essa parte de adoção, orçamento não vai ser problema." },
    ],
    nextSteps: [
      { text: "Enviar case de outro escritório de médio porte que migrou com sucesso.", done: false, owner: "Camila" },
      { text: "Propor onboarding assistido para reduzir fricção da equipe.", done: false, owner: "Camila" },
    ],
    transcript: [
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "00:05", text: "Renata, prazer em falar com você. Me conta um pouco como funciona hoje o controle de prazos processuais aí no escritório?" },
      { speaker: "prospect", speakerName: "Renata Bittencourt", timestamp: "00:18", text: "Hoje é tudo numa planilha compartilhada, cada equipe atualiza o que consegue. Já perdemos um prazo esse ano por causa disso, foi um susto grande." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "00:50", text: "Imagino o quanto isso pesa. Quantos advogados usariam a ferramenta no dia a dia?" },
      { speaker: "prospect", speakerName: "Renata Bittencourt", timestamp: "01:05", text: "Uns quarenta, entre sócios, associados e estagiários." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "01:30", text: "Entendido. E a decisão de contratar passa por mais alguém, ou é só você?" },
      { speaker: "prospect", speakerName: "Renata Bittencourt", timestamp: "01:42", text: "Sou eu que decido, sim. Minha preocupação maior é a resistência dos advogados mais antigos a mudar de ferramenta." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "02:10", text: "Isso é super comum, e a gente tem um processo de onboarding assistido justamente pra reduzir esse atrito. Posso te mostrar um case parecido de outro escritório." },
      { speaker: "prospect", speakerName: "Renata Bittencourt", timestamp: "02:35", text: "Adoraria ver. Se resolver essa parte de adoção, orçamento não vai ser problema." },
    ],
  },
  {
    id: "cl-8825",
    account: "Solaris Energia Renovável",
    prospectName: "Thiago Espósito",
    prospectRole: "Diretor de Expansão",
    closer: "Ísis Nogueira",
    closerInitials: "IN",
    date: "2026-07-07T15:45:00-03:00",
    dateLabel: "07/07 · 15:45",
    durationLabel: "33:20",
    durationSeconds: 2000,
    status: "pronto",
    talkRatioRep: 51,
    sentiment: "neutro",
    sentimentScore: 12,
    objectionsCount: 2,
    buyingSignalsCount: 2,
    signal: "risco",
    longestMonologueSec: 68,
    questionsPerHour: 11,
    talkRatioByMinute: [48, 54, 50, 46, 53, 49, 55, 47],
    dealValue: 410000,
    forecastWeightPct: 19,
    pulse: pulseFrom([
      ["rep", 4], ["prospect", 3], ["rep", 3], ["prospect", 4], ["rep", 3],
      ["prospect", 2], ["rep", 4], ["prospect", 3],
    ]),
    summary:
      "Call mista: Thiago demonstrou interesse real no módulo de monitoramento remoto, mas trouxe objeção forte de preço frente a concorrente nacional mais barato. Segue em avaliação.",
    keyPoints: [
      "Concorrente direto (SunOps) ofereceu proposta 20% mais barata.",
      "Thiago valoriza suporte técnico local, ponto fraco do concorrente.",
      "Decisão prevista para as próximas duas semanas.",
    ],
    objections: [
      {
        text: "Preço 20% acima da proposta concorrente (SunOps).",
        severity: "critica",
        atTimestamp: "00:24",
        quote: "Recebemos proposta da SunOps também, e o preço deles ficou uns 20% abaixo do de vocês.",
      },
      {
        text: "Ainda não validou tempo de resposta do suporte.",
        severity: "risco",
        atTimestamp: "01:15",
        quote: "A SunOps é mais nova, não sei como é o tempo de resposta em caso de falha crítica numa usina.",
      },
    ],
    buyingSignalDetails: [
      { atTimestamp: "02:05", quote: "Se o suporte for realmente melhor, talvez valha pagar a diferença." },
      { atTimestamp: "01:40", quote: "Posso te conectar com um cliente do setor de energia pra você validar isso na prática — isso ajudaria bastante." },
    ],
    nextSteps: [
      { text: "Preparar contraproposta com desconto de volume.", done: false, owner: "Ísis" },
      { text: "Conectar Thiago com cliente referência do setor de energia.", done: false, owner: "Ísis" },
    ],
    transcript: [
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "00:10", text: "Thiago, como está a avaliação de fornecedores até aqui?" },
      { speaker: "prospect", speakerName: "Thiago Espósito", timestamp: "00:24", text: "Está andando. Recebemos proposta da SunOps também, e o preço deles ficou uns 20% abaixo do de vocês." },
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "00:50", text: "Entendo a preocupação com preço. Pode me contar como está o suporte técnico deles, isso costuma pesar bastante em projetos de monitoramento remoto." },
      { speaker: "prospect", speakerName: "Thiago Espósito", timestamp: "01:15", text: "Essa é uma dúvida real. A SunOps é mais nova, não sei como é o tempo de resposta em caso de falha crítica numa usina." },
      { speaker: "rep", speakerName: "Ísis Nogueira", timestamp: "01:40", text: "Nosso SLA de suporte crítico é de quinze minutos, com time local. Posso te conectar com um cliente do setor de energia pra você validar isso na prática." },
      { speaker: "prospect", speakerName: "Thiago Espósito", timestamp: "02:05", text: "Isso ajudaria bastante. Se o suporte for realmente melhor, talvez valha pagar a diferença." },
    ],
  },
  {
    id: "cl-8819",
    account: "Multivix Educação",
    prospectName: "Larissa Coutinho",
    prospectRole: "Coordenadora de TI Acadêmica",
    closer: "Bruno Kellner",
    closerInitials: "BK",
    date: "2026-07-06T09:30:00-03:00",
    dateLabel: "06/07 · 09:30",
    durationLabel: "22:15",
    durationSeconds: 1335,
    status: "pronto",
    talkRatioRep: 60,
    sentiment: "negativo",
    sentimentScore: -45,
    objectionsCount: 2,
    buyingSignalsCount: 0,
    signal: "risco",
    longestMonologueSec: 128,
    questionsPerHour: 3,
    talkRatioByMinute: [62, 78, 71, 84, 69, 66],
    dealValue: 140000,
    forecastWeightPct: 6,
    pulse: pulseFrom([
      ["rep", 5], ["prospect", 1], ["rep", 4], ["prospect", 1], ["rep", 5], ["prospect", 1],
    ]),
    summary:
      "Call fraca — timing ruim, Larissa avisou logo no início que o projeto foi despriorizado internamente. Rep insistiu em seguir com a demo completa mesmo assim.",
    keyPoints: [
      "Projeto de TI acadêmica foi despriorizado para o próximo ano fiscal.",
      "Larissa participou por cortesia, não há intenção de avançar agora.",
    ],
    objections: [
      {
        text: "Projeto despriorizado, sem verba até o próximo ano fiscal.",
        severity: "critica",
        atTimestamp: "00:10",
        quote: "Esse projeto foi despriorizado aqui internamente, não sei se faz sentido usarmos o tempo hoje.",
      },
      {
        text: "Sem urgência declarada para os próximos 6 meses.",
        severity: "critica",
        atTimestamp: "00:40",
        quote: "Não vai ter decisão nenhuma nos próximos meses, quero deixar isso claro.",
      },
    ],
    nextSteps: [
      { text: "Marcar retomada de contato em janeiro, respeitando o timing dela.", done: false, owner: "Bruno" },
    ],
    transcript: [
      { speaker: "prospect", speakerName: "Larissa Coutinho", timestamp: "00:10", text: "Só de antemão, esse projeto foi despriorizado aqui internamente, não sei se faz sentido usarmos o tempo hoje." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "00:25", text: "Entendo, mas já que estamos aqui, deixa eu te mostrar rapidinho a plataforma completa, acho que vale a pena." },
      { speaker: "prospect", speakerName: "Larissa Coutinho", timestamp: "00:40", text: "Tudo bem, mas não vai ter decisão nenhuma nos próximos meses, quero deixar isso claro." },
      { speaker: "rep", speakerName: "Bruno Kellner", timestamp: "00:55", text: "Sem problema, vamos só conhecer então. Temos módulo de gestão acadêmica, módulo financeiro, módulo de..." },
    ],
  },
  {
    id: "cl-8815",
    account: "Bravium Construtora",
    prospectName: "Otávio Reznik",
    prospectRole: "Gerente de Projetos",
    closer: "Camila Vasques",
    closerInitials: "CV",
    date: "2026-07-10T13:00:00-03:00",
    dateLabel: "10/07 · 13:00",
    durationLabel: "12:40",
    durationSeconds: 760,
    status: "processando",
    talkRatioRep: 0,
    sentiment: "neutro",
    sentimentScore: 0,
    objectionsCount: 0,
    buyingSignalsCount: 0,
    signal: null,
    longestMonologueSec: 0,
    questionsPerHour: 0,
    pulse: [],
    transcript: [
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "00:06", text: "Otávio, bom dia! Vamos começar falando um pouco do que motivou essa conversa hoje?" },
      { speaker: "prospect", speakerName: "Otávio Reznik", timestamp: "00:20", text: "Bom dia. Estamos buscando uma forma melhor de acompanhar o andamento das obras em tempo real pros nossos investidores." },
      { speaker: "rep", speakerName: "Camila Vasques", timestamp: "00:45", text: "Entendi. Hoje vocês reportam isso como, planilha, reunião semanal?" },
      { speaker: "prospect", speakerName: "Otávio Reznik", timestamp: "01:02", text: "Um pouco dos dois, e não é nada em tempo real, sempre atrasado." },
    ],
  },
];

export function getCallById(id: string): Call | undefined {
  return calls.find((c) => c.id === id);
}

/** Deriva os eventos da timeline (MomentTrack) a partir de objeções + sinais de compra. */
export function deriveMoments(call: Call): Moment[] {
  const moments: Moment[] = [];

  for (const obj of call.objections ?? []) {
    if (!obj.atTimestamp) continue;
    const isPrice = /pre[çc]o|barat|20%|desconto|or[çc]amento|verba|corte/i.test(obj.text + obj.quote);
    moments.push({
      tSeconds: tsToSeconds(obj.atTimestamp),
      type: obj.severity === "critica" ? "objecao-critica" : isPrice ? "preco" : "objecao",
      quote: obj.quote ?? obj.text,
      atTimestamp: obj.atTimestamp,
    });
  }

  for (const sig of call.buyingSignalDetails ?? []) {
    moments.push({
      tSeconds: tsToSeconds(sig.atTimestamp),
      type: "sinal",
      quote: sig.quote,
      atTimestamp: sig.atTimestamp,
    });
  }

  return moments.sort((a, b) => a.tSeconds - b.tSeconds);
}

export const closers = Array.from(new Set(calls.map((c) => c.closer)));
