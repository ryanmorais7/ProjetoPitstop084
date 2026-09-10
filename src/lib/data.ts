export type PlanoId = "premium" | "diamante";

export interface Plano {
  id: PlanoId;
  nome: string;
  precoMensal: number;
  destaque?: boolean;
  itens: string[];
  naoInclui?: string[];
}

export const planos: Plano[] = [
  {
    id: "premium",
    nome: "Premium",
    precoMensal: 149.9,
    itens: ["Lavagem detalhada de entrada", "Manutenção semanal"],
    naoInclui: ["Lavagem de motor", "Chassis com proteção", "Higienização interna completa"],
  },
  {
    id: "diamante",
    nome: "Diamante",
    precoMensal: 219.9,
    destaque: true,
    itens: [
      "Lavagem detalhada de entrada",
      "Manutenção semanal",
      "Lavagem de motor",
      "Chassis com proteção",
      "Higienização interna completa",
    ],
  },
];

export const regrasFidelidade = {
  fidelidadeMeses: 3,
  textoResumo:
    "Fidelidade mínima de 3 meses. Cancelamento antes desse prazo gera cobrança proporcional. Depois dos 3 meses, você pode cancelar ou pausar quando quiser.",
};

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
    aspecto: "Frequência",
    lavaJatoComum: "Só quando você lembra",
    pitstop084: "Manutenção semanal incluída na assinatura",
  },
  {
    aspecto: "Motor e chassis",
    lavaJatoComum: "Raramente oferecido",
    pitstop084: "Inclusos no plano Diamante",
  },
  {
    aspecto: "Higienização interna",
    lavaJatoComum: "Cobrada à parte, sem padrão",
    pitstop084: "Processo completo e padronizado",
  },
  {
    aspecto: "Relacionamento",
    lavaJatoComum: "Atendimento avulso",
    pitstop084: "Brinde no aniversário da assinatura",
  },
];
