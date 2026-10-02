import { PlanoId, planos } from "./data";

/**
 * Assistente "Qual plano combina com você?". Regras 100% determinísticas, sem IA e sem API:
 * o mesmo conjunto de respostas sempre devolve o mesmo plano. Toda a lógica fica aqui; os
 * componentes só exibem perguntas e resultado.
 */

export type Frequencia = "mensal" | "semanal" | "impecavel";
export type Prioridade = "economia" | "praticidade" | "completo";
export type Comodidade = "limpo" | "frequente" | "levaBusca";

export interface RespostasPlano {
  frequencia: Frequencia;
  prioridade: Prioridade;
  comodidade: Comodidade;
}

export interface PerguntaPlano<K extends keyof RespostasPlano = keyof RespostasPlano> {
  id: K;
  titulo: string;
  opcoes: { valor: RespostasPlano[K]; rotulo: string }[];
}

export const perguntasPlano: [
  PerguntaPlano<"frequencia">,
  PerguntaPlano<"prioridade">,
  PerguntaPlano<"comodidade">,
] = [
  {
    id: "frequencia",
    titulo: "Com que frequência você gosta de manter o carro limpo?",
    opcoes: [
      { valor: "mensal", rotulo: "1 ou 2 vezes por mês" },
      { valor: "semanal", rotulo: "Toda semana" },
      { valor: "impecavel", rotulo: "Quero o carro sempre impecável" },
    ],
  },
  {
    id: "prioridade",
    titulo: "O que mais importa para você?",
    opcoes: [
      { valor: "economia", rotulo: "Economia" },
      { valor: "praticidade", rotulo: "Praticidade no dia a dia" },
      { valor: "completo", rotulo: "Um cuidado mais completo" },
    ],
  },
  {
    id: "comodidade",
    titulo: "Qual nível de comodidade você procura?",
    opcoes: [
      { valor: "limpo", rotulo: "Quero principalmente manter o carro limpo" },
      { valor: "frequente", rotulo: "Quero cuidados mais frequentes e completos" },
      { valor: "levaBusca", rotulo: "Quero também Leva & Busca e mais benefícios" },
    ],
  },
];

export interface RecomendacaoPlano {
  planoId: PlanoId;
  /** Frase curta explicando a escolha, montada a partir das próprias respostas. */
  motivo: string;
  /** Benefícios reais do plano (de `planos[x].beneficios`), na ordem do catálogo. */
  destaques: string[];
}

/**
 * Regras, em ordem de prioridade (a primeira que casar decide):
 *
 * 1. Leva & Busca só existe no Gold e no Diamante. Quem pediu Leva & Busca recebe Gold, e só
 *    sobe pro Diamante se a rotina pede: quer o carro sempre impecável (sem priorizar economia)
 *    ou um cuidado mais completo com frequência semanal ou maior. Quem prioriza economia ou
 *    lava 1-2x por mês nunca é levado ao Diamante por causa do Leva & Busca.
 * 2. "Sempre impecável" + "cuidado mais completo" = Diamante (manutenção semanal ilimitada,
 *    Lavagem Diamante e 2 Lavagens Gold no ciclo).
 * 3. Quem prioriza economia fica no Black (menor mensalidade, já com 1 lavagem por semana).
 * 4. Quem quer cuidados mais frequentes/completos, ou o carro sempre impecável, ou prioriza um
 *    cuidado mais completo = Gold (Lavagem Gold + 4 Manutenções no ciclo).
 * 5. Caso contrário (manter o carro limpo, sem pedir mais que isso) = Black.
 */
export function getRecommendedPlan(respostas: RespostasPlano): RecomendacaoPlano {
  const { frequencia, prioridade, comodidade } = respostas;
  let planoId: PlanoId;

  if (comodidade === "levaBusca") {
    const rotinaDiamante =
      (frequencia === "impecavel" && prioridade !== "economia") ||
      (prioridade === "completo" && frequencia !== "mensal");
    planoId = rotinaDiamante ? "diamante" : "gold";
  } else if (frequencia === "impecavel" && prioridade === "completo") {
    planoId = "diamante";
  } else if (prioridade === "economia") {
    planoId = "black";
  } else if (comodidade === "frequente" || frequencia === "impecavel" || prioridade === "completo") {
    planoId = "gold";
  } else {
    planoId = "black";
  }

  return {
    planoId,
    motivo: montarMotivo(respostas),
    destaques: planos[planoId].beneficios,
  };
}

const fraseFrequencia: Record<Frequencia, string> = {
  mensal: "Você cuida do carro com mais espaço entre uma lavagem e outra",
  semanal: "Você gosta de manter o carro limpo toda semana",
  impecavel: "Você quer o carro sempre impecável",
};

const frasePrioridade: Record<Prioridade, string> = {
  economia: "e prefere um plano que caiba bem no orçamento.",
  praticidade: "e valoriza praticidade no dia a dia.",
  completo: "e valoriza um cuidado mais completo.",
};

function montarMotivo({ frequencia, prioridade, comodidade }: RespostasPlano): string {
  const base = `${fraseFrequencia[frequencia]} ${frasePrioridade[prioridade]}`;
  return comodidade === "levaBusca" ? `${base} O Leva & Busca já vem incluso.` : base;
}
