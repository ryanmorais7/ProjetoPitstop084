export type PlanoId = "premium" | "diamante";

export interface Plano {
  id: PlanoId;
  nome: string;
  /** null = valor ainda não definido com o cliente, exibir como "sob consulta" */
  precoMensal: number | null;
  destaque?: boolean;
  beneficios: string[];
}

/**
 * PLACEHOLDER: benefícios, brindes e valores dos planos ainda estão sendo
 * definidos com o cliente. Tudo aqui é exemplo, centralizado neste array
 * pra ser fácil trocar quando os dados reais chegarem, sem mexer nos
 * componentes visuais (PlanoCard, SubscriptionPlans, BookingFlow).
 */
export const planos: Plano[] = [
  {
    id: "premium",
    nome: "Premium",
    precoMensal: null,
    beneficios: [
      "Lavagens selecionadas por mês (exemplo)",
      "Condições especiais em serviços adicionais (exemplo)",
      "Benefício exclusivo para assinantes (exemplo)",
      "Brinde periódico (exemplo)",
    ],
  },
  {
    id: "diamante",
    nome: "Diamante",
    precoMensal: null,
    destaque: true,
    beneficios: [
      "Mais serviços incluídos (exemplo)",
      "Condições especiais em serviços adicionais (exemplo)",
      "Benefícios exclusivos (exemplo)",
      "Brindes especiais (exemplo)",
      "Prioridade de agendamento (exemplo)",
    ],
  },
];

export interface AvulsoServico {
  id: string;
  nome: string;
  descricao: string;
  preco: number | null;
  sobConsulta?: boolean;
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

export const whatsappNumero = "5511999999999";

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensagem)}`;
}

export interface CarroAoVivo {
  placaOuModelo: string;
  status: "Na fila" | "Lavando" | "Secando" | "Finalizado";
}

export const carrosAoVivoMock: CarroAoVivo[] = [
  { placaOuModelo: "Onix Prata", status: "Lavando" },
  { placaOuModelo: "HB20 Branco", status: "Secando" },
  { placaOuModelo: "Compass Preto", status: "Na fila" },
  { placaOuModelo: "Civic Cinza", status: "Finalizado" },
  { placaOuModelo: "Corolla Prata", status: "Na fila" },
];

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

export interface DiferencialLinha {
  aspecto: string;
  lavaJatoComum: string;
  pitstop084: string;
}

export const diferenciais: DiferencialLinha[] = [
  {
    aspecto: "Agendamento",
    lavaJatoComum: "Fila por ordem de chegada",
    pitstop084: "Horário marcado, sem espera",
  },
  {
    aspecto: "Serviços técnicos",
    lavaJatoComum: "Raramente oferecidos",
    pitstop084: "Motor, chassis e proteção disponíveis",
  },
  {
    aspecto: "Higienização interna",
    lavaJatoComum: "Cobrada à parte, sem padrão",
    pitstop084: "Processo completo e padronizado",
  },
  {
    aspecto: "Contratação",
    lavaJatoComum: "Só avulso",
    pitstop084: "Avulso ou assinatura, você escolhe",
  },
];
