export type PlanoId = "premium" | "diamante";

export interface Plano {
  id: PlanoId;
  nome: string;
  precoMensal: number;
  descricao: string;
  destaque?: boolean;
  beneficios: string[];
}

/**
 * PLACEHOLDER: preço, benefícios e brindes são exemplos e ainda poderão ser
 * alterados pelo cliente. Centralizado aqui pra trocar num lugar só, sem
 * mexer nos componentes visuais (PlanoCard, SubscriptionPlans, BookingFlow).
 */
export const planos: Record<PlanoId, Plano> = {
  premium: {
    id: "premium",
    nome: "Premium",
    precoMensal: 149.9,
    descricao: "Para quem quer manter o carro sempre bem cuidado.",
    beneficios: [
      "Lavagens selecionadas por mês (exemplo)",
      "Condições especiais em serviços adicionais (exemplo)",
      "Benefício exclusivo para assinantes (exemplo)",
      "Brinde periódico (exemplo)",
    ],
  },
  diamante: {
    id: "diamante",
    nome: "Diamante",
    precoMensal: 249.9,
    descricao: "Para quem exige um nível ainda maior de cuidado e exclusividade.",
    destaque: true,
    beneficios: [
      "Mais serviços incluídos (exemplo)",
      "Condições especiais em serviços adicionais (exemplo)",
      "Benefícios exclusivos (exemplo)",
      "Brindes especiais (exemplo)",
      "Prioridade de agendamento (exemplo)",
    ],
  },
};

export const listaPlanos: Plano[] = Object.values(planos);

export interface AvulsoServico {
  id: string;
  nome: string;
  descricao: string;
  preco: number | null;
  sobConsulta?: boolean;
  duracao?: string;
  imagem?: string;
  destaque?: boolean;
  categoria?: string;
}

export const avulsos: AvulsoServico[] = [
  {
    id: "lavagem-simples",
    nome: "Lavagem simples",
    descricao: "Lavagem externa completa com produtos próprios.",
    preco: 49.9,
  },
  {
    id: "lavagem-detalhada",
    nome: "Lavagem detalhada",
    descricao: "Externa + interna, com aspiração e hidratação de painel.",
    preco: 89.9,
  },
  {
    id: "higienizacao-interna",
    nome: "Higienização interna completa",
    descricao: "Bancos, carpetes, teto e ar-condicionado.",
    preco: 179.9,
  },
  {
    id: "lavagem-motor",
    nome: "Lavagem de motor",
    descricao: "Limpeza e proteção do compartimento do motor.",
    preco: null,
    sobConsulta: true,
  },
  {
    id: "polimento",
    nome: "Polimento e proteção de pintura",
    descricao: "Remoção de riscos leves e camada de proteção.",
    preco: null,
    sobConsulta: true,
  },
];

export interface Depoimento {
  nome: string;
  carro: string;
  frase: string;
}

/** PLACEHOLDER: depoimentos de exemplo, substituir por relatos reais de clientes. */
export const depoimentos: Depoimento[] = [
  {
    nome: "Marcos A.",
    carro: "HB20 2022",
    frase: "Assinei pra não precisar mais lembrar de levar o carro pra lavar.",
  },
  {
    nome: "Juliana R.",
    carro: "Compass 2021",
    frase: "O acabamento interno ficou impecável, parece carro novo.",
  },
  {
    nome: "Felipe S.",
    carro: "Onix 2023",
    frase: "Marcar horário e não pegar fila mudou completamente minha rotina.",
  },
];

/** Rótulos genéricos das etapas do agendamento, usados no indicador de progresso. */
export const etapasAgendamento = ["Como agendar", "Serviço", "Horário", "Ficha técnica", "Confirmação"];

export const whatsappNumero = "5511999999999";

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensagem)}`;
}

export const diasAgendamento = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

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

export const horariosIndisponiveisMock = new Set<string>([
  "Segunda-09:00",
  "Segunda-14:00",
  "Terça-08:00",
  "Quarta-11:00",
  "Quarta-15:00",
  "Quinta-16:00",
  "Sexta-08:00",
  "Sexta-13:00",
  "Sábado-10:00",
  "Sábado-17:00",
]);
