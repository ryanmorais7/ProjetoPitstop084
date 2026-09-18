export type VehicleSize = "P" | "G";

export interface VehicleSizeInfo {
  id: VehicleSize;
  nome: string;
  descricao: string;
}

/** Porte do veículo: escolha única, global, que controla todos os preços da landing. */
export const portesVeiculo: Record<VehicleSize, VehicleSizeInfo> = {
  P: { id: "P", nome: "Hatch / Sedan", descricao: "Porte P" },
  G: { id: "G", nome: "SUV / Pick-up", descricao: "Porte G" },
};

export const listaPortesVeiculo: VehicleSizeInfo[] = Object.values(portesVeiculo);

export type PlanoId = "black" | "gold" | "diamante";

export interface Plano {
  id: PlanoId;
  nome: string;
  headline: string;
  precos: Record<VehicleSize, number>;
  beneficios: string[];
  cta: string;
  badge?: string;
}

/** Serviços incluídos em cada plano que podem ser agendados dentro do ciclo mensal. */
export const servicosPorPlano: Record<PlanoId, string[]> = {
  black: ["Lavagem Black"],
  gold: ["Lavagem Gold", "Manutenção"],
  diamante: ["Lavagem Diamante", "Lavagem Gold", "Manutenção"],
};

export const planos: Record<PlanoId, Plano> = {
  black: {
    id: "black",
    nome: "Black",
    headline: "Seu carro limpo. Sua rotina mais prática.",
    precos: { P: 149.9, G: 199.9 },
    beneficios: [
      "1 lavagem semanal",
      "Atendimento prioritário",
      "10% OFF em todos os serviços adicionais",
      "Mais praticidade para manter seu carro sempre impecável",
    ],
    cta: "Quero ser Black",
  },
  gold: {
    id: "gold",
    nome: "Gold",
    headline: "Cuidado premium, praticidade e exclusividade para o seu carro.",
    precos: { P: 239.9, G: 269.9 },
    beneficios: [
      "1 Lavagem Gold mensal",
      "4 Manutenções mensais",
      "Atendimento prioritário",
      "Serviço Leva & Busca",
      "15% OFF em todos os serviços adicionais",
    ],
    cta: "Quero ser Gold",
  },
  diamante: {
    id: "diamante",
    nome: "Diamante",
    headline:
      "O cuidado mais completo da Pitstop 084 para quem não abre mão de ter o carro sempre impecável.",
    precos: { P: 329.9, G: 389.9 },
    beneficios: [
      "1 Lavagem Diamante mensal",
      "2 Lavagens Gold mensais",
      "Manutenção semanal ilimitada",
      "Atendimento prioritário",
      "Serviço Leva & Busca",
      "20% OFF em todos os serviços adicionais",
    ],
    cta: "Quero ser Diamante",
    badge: "Experiência completa",
  },
};

export const listaPlanos: Plano[] = [planos.black, planos.gold, planos.diamante];

export const regraUtilizacaoPlanos =
  "Os benefícios são válidos durante o ciclo mensal da assinatura e não acumulam para o mês seguinte.";

export type CategoriaCuidado = "limpeza" | "protecao" | "estetica";

export const categoriasCuidado: Record<CategoriaCuidado, string> = {
  limpeza: "Limpeza profunda",
  protecao: "Proteção",
  estetica: "Estética avançada",
};

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  /** Descrição curta (uma linha), usada nos cards do configurador "Monte seu Pitstop". */
  shortDescription?: string;
  categoria?: CategoriaCuidado;
  itens?: string[];
  duracao?: string;
  resultado?: string;
  /** null = serviço mediante avaliação, sem preço fixo */
  precos: Record<VehicleSize, number> | null;
  requiresEvaluation: boolean;
  destaque?: boolean;
}

export function precoServico(servico: Servico, porte: VehicleSize): number | null {
  return servico.precos ? servico.precos[porte] : null;
}

export const duchaPitstop: Servico = {
  id: "ducha-pitstop",
  nome: "Ducha Pitstop",
  descricao: "Uma limpeza rápida para manter o veículo sempre limpo e apresentável.",
  itens: [
    "Lavagem externa completa",
    "Secagem detalhada de toda a carroceria",
    "Secagem das caixas de portas",
    "Aplicação de pretinho nos pneus",
  ],
  duracao: "Aproximadamente 45 minutos",
  resultado: "Veículo limpo, seco e com pneus renovados.",
  precos: { P: 49.9, G: 49.9 },
  requiresEvaluation: false,
};

/** Tabela oficial de serviços avulsos da Pitstop 084 — cuidados adicionais do configurador "Monte seu Pitstop". */
export const servicosAvulsos: Servico[] = [
  {
    id: "descontaminacao-pintura",
    nome: "Descontaminação de Pintura",
    shortDescription: "Remove contaminantes aderidos à superfície.",
    categoria: "limpeza",
    precos: { P: 99.9, G: 149.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "higienizacao-interna",
    nome: "Higienização Interna",
    shortDescription: "Limpeza profunda para renovar o interior.",
    categoria: "limpeza",
    precos: { P: 249.9, G: 299.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "protecao-pintura-selante",
    nome: "Proteção de Pintura c/ Selante",
    shortDescription: "Proteção e acabamento para a pintura.",
    categoria: "protecao",
    precos: { P: 49.9, G: 79.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "descontaminacao-protecao-motor",
    nome: "Descontaminação e Proteção de Motor",
    shortDescription: "Limpeza e proteção cuidadosa do compartimento.",
    categoria: "protecao",
    precos: { P: 119.9, G: 159.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "descontaminacao-protecao-chassis",
    nome: "Descontaminação e Proteção de Chassis",
    shortDescription: "Remove sujeira pesada e protege a parte inferior do carro.",
    categoria: "protecao",
    precos: { P: 99.9, G: 149.9 },
    requiresEvaluation: false,
  },
  {
    id: "restauracao-vitrificacao-plasticos",
    nome: "Restauração e Vitrificação de Plásticos",
    shortDescription: "Renova e protege plásticos externos desgastados.",
    categoria: "estetica",
    precos: null,
    requiresEvaluation: true,
  },
  {
    id: "vitrificacao-pintura",
    nome: "Vitrificação de Pintura",
    shortDescription: "Proteção de longa duração com brilho intenso.",
    categoria: "estetica",
    precos: null,
    requiresEvaluation: true,
  },
  {
    id: "polimento-tecnico",
    nome: "Polimento Técnico",
    shortDescription: "Correção de imperfeições leves na pintura.",
    categoria: "estetica",
    precos: null,
    requiresEvaluation: true,
  },
  {
    id: "polimento-detalhado",
    nome: "Polimento Detalhado",
    shortDescription: "Acabamento refinado para um brilho de showroom.",
    categoria: "estetica",
    precos: null,
    requiresEvaluation: true,
  },
];

/** Rótulos genéricos das etapas do agendamento, usados no indicador de progresso. */
export const etapasAgendamento = ["Como agendar", "Serviço", "Horário", "Ficha técnica", "PitPass"];

export const whatsappNumero = "5584987554603";

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensagem)}`;
}

export const enderecoPitstop = {
  nome: "Pitstop 084",
  linha1: "Av. Presidente Café Filho, 522",
  linha2: "Praia do Meio",
  linha3: "Natal - RN",
};

const enderecoCompleto = `${enderecoPitstop.linha1}, ${enderecoPitstop.linha2}, ${enderecoPitstop.linha3}`;

export const linkComoChegar = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  enderecoCompleto
)}`;

export const linkMapaEmbed = `https://www.google.com/maps?q=${encodeURIComponent(
  enderecoCompleto
)}&output=embed`;

/** A Pitstop 084 não atende aos domingos (índice 0 de Date.getDay()). */
export const diaFechado = 0;

export const horariosAgendamento = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

/** Descrição curta de cada benefício agendável dos planos, para o passo "o que você quer usar?". */
export const beneficiosAgendaveis: Record<string, string> = {
  "Lavagem Black": "Seu cuidado recorrente para manter o carro limpo e apresentável durante a semana.",
  "Lavagem Gold": "Tratamento completo de conservação e proteção do veículo.",
  "Lavagem Diamante": "O cuidado mais completo da Pitstop 084 para o seu carro.",
  "Manutenção": "Cuidado periódico para manter o padrão da sua lavagem em dia.",
};
