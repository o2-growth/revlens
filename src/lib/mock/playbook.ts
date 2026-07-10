// Dados mock — Script Padrão / Playbook. A partitura de referência contra a qual
// as calls são auscultadas. Sem backend. Objeções e etapas coerentes com
// src/lib/mock/calls.ts e src/lib/mock/intelligence.ts (objectionRanking).

export type PlaybookStage = {
  key: string;
  name: string;
  objective: string;
  /** perguntas/movimentos esperados nessa etapa */
  expectedMoves: string[];
  /** alvo de talk-ratio do rep nessa etapa (%) */
  targetTalkRatio: number;
  /** faixa saudável [min,max] em torno do alvo */
  talkRatioBand: [number, number];
  /** o time realmente fala X% nessa etapa (agregado das calls recentes) — pro ScriptTrace */
  executedTalkRatio: number;
};

export const playbookStages: PlaybookStage[] = [
  {
    key: "abertura",
    name: "Abertura",
    objective:
      "Estabelecer o tom, confirmar tempo disponível e pedir permissão para gravar — sem entrar em pitch.",
    expectedMoves: [
      "Pedir autorização para gravar a call.",
      "Confirmar quanto tempo o prospect tem disponível.",
      "Alinhar a agenda em uma frase (\"hoje quero entender X e ver se faz sentido Y\").",
      "Não abrir com feature — abrir com a dor que motivou a call.",
    ],
    targetTalkRatio: 30,
    talkRatioBand: [20, 35],
    executedTalkRatio: 38,
  },
  {
    key: "descoberta",
    name: "Descoberta",
    objective:
      "Qualificar dor, processo de decisão e orçamento antes de qualquer demonstração. É a etapa que mais prediz ganho.",
    expectedMoves: [
      "Quantificar o problema (quantos veículos/pessoas/processos afetados).",
      "Mapear quem mais participa da decisão além do interlocutor.",
      "Perguntar sobre orçamento aprovado ou processo de aprovação.",
      "Identificar o gatilho — por que resolver isso agora e não em 6 meses.",
      "Deixar o prospect falar mais que o rep nessa etapa.",
    ],
    targetTalkRatio: 25,
    talkRatioBand: [15, 30],
    executedTalkRatio: 34,
  },
  {
    key: "pitch",
    name: "Pitch",
    objective:
      "Apresentar só o que resolve a dor mapeada na descoberta — nunca o tour completo da plataforma.",
    expectedMoves: [
      "Conectar cada funcionalidade mostrada a uma dor que o prospect já confirmou.",
      "Checar entendimento a cada bloco (\"isso faz sentido pro que você me contou?\").",
      "Evitar demo genérica — cortar módulos que o prospect não mencionou.",
    ],
    targetTalkRatio: 55,
    talkRatioBand: [45, 60],
    executedTalkRatio: 61,
  },
  {
    key: "objecoes",
    name: "Tratamento de Objeções",
    objective:
      "Responder com dado concreto, nunca ignorar ou atropelar. Objeção sem resposta é o principal preditor de perda.",
    expectedMoves: [
      "Repetir a objeção com as próprias palavras antes de responder.",
      "Responder com prova (case, certificação, número) — nunca só opinião.",
      "Perguntar se a resposta resolveu antes de seguir em frente.",
      "Se não houver resposta pronta, comprometer prazo específico para trazer uma.",
    ],
    targetTalkRatio: 40,
    talkRatioBand: [30, 50],
    executedTalkRatio: 46,
  },
  {
    key: "fechamento",
    name: "Próximos Passos / Fechamento",
    objective:
      "Sair da call com data, dono e ação concretos — nunca \"vou te mandar um material e a gente se fala\".",
    expectedMoves: [
      "Propor a próxima etapa com data específica, não vaga.",
      "Confirmar quem mais precisa estar na próxima call.",
      "Resumir em voz alta o que foi combinado.",
      "Perguntar se falta algo para o prospect levar à decisão interna.",
    ],
    targetTalkRatio: 35,
    talkRatioBand: [25, 45],
    executedTalkRatio: 33,
  },
];

/** Banco de perguntas de descoberta obrigatórias — cruzam toda call de qualificação. */
export const discoveryQuestionBank: string[] = [
  "Como vocês resolvem isso hoje, na prática?",
  "Quantas pessoas/processos/unidades isso afeta?",
  "Já tentaram resolver isso antes? O que não funcionou?",
  "Quem mais, além de você, participa dessa decisão?",
  "Existe orçamento já aprovado ou isso ainda depende de aprovação?",
  "O que faz isso ser prioridade agora e não daqui a dois trimestres?",
  "Como vocês vão medir se a solução deu certo?",
  "Que evento ou incidente recente trouxe isso pra mesa?",
];

/** Objeção → resposta recomendada. Mesmas 5 categorias do objectionRanking (intelligence.ts). */
export type ObjectionPlaybookEntry = {
  objection: string;
  recommendedResponse: string;
};

export const objectionPlaybook: ObjectionPlaybookEntry[] = [
  {
    objection: "Preço acima do concorrente",
    recommendedResponse:
      "Não competir em desconto. Trazer TCO (custo total incluindo suporte, tempo de implementação, risco de projeto) e oferecer conectar com uma referência do mesmo setor. Nunca ignorar o número — nomear a diferença e justificar com prova.",
  },
  {
    objection: "Timing / orçamento não aprovado",
    recommendedResponse:
      "Perguntar o que precisaria ser verdade para isso virar prioridade e propor reengajar em data específica (não \"mais pra frente\"). Se houver dor real, quantificar o custo de não agir agora.",
  },
  {
    objection: "Integração com sistema atual (TMS/ERP)",
    recommendedResponse:
      "Confirmar a integração nativa existente e oferecer trazer o time técnico numa call dedicada com quem for validar. Nunca prometer algo que a engenharia não confirmou.",
  },
  {
    objection: "Segurança de dados e compliance",
    recommendedResponse:
      "Enviar certificações (ISO 27001, LGPD) por escrito no mesmo dia e oferecer call direta com o time de segurança do prospect. Bloqueador regulatório não se resolve com discurso, só com documento.",
  },
  {
    objection: "Resistência interna da equipe",
    recommendedResponse:
      "Validar a preocupação como legítima (não minimizar) e oferecer onboarding assistido + case de adoção de outro cliente parecido. Perguntar quem seria o maior cético e envolvê-lo cedo.",
  },
];

/** Aderência média do time ao script (mock) — Readout no cabeçalho da página. */
export const teamScriptAdherence = 72;
