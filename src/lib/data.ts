export type PlanoId = "black" | "gold" | "diamante";

export interface CategoriaVeiculo {
  id: string;
  nome: string;
  descricao: string;
  precoMensal: number;
}

export interface BeneficioPlano {
  numero: string;
  titulo: string;
  descricao: string;
}

export interface Plano {
  id: PlanoId;
  nome: string;
  descricao: string;
  /** false = detalhes ainda em definição com o cliente, não exibir preço/benefícios */
  disponivel: boolean;
  destaque?: boolean;
  categorias?: CategoriaVeiculo[];
  beneficios?: BeneficioPlano[];
}

/**
 * A Pitstop 084 tem três níveis de assinatura. Black e Gold ainda não têm
 * preço/benefícios definidos com o cliente, por isso ficam com
 * `disponivel: false` (aparecem na landing como "em breve", sem inventar
 * valores). Diamante já tem dados reais.
 */
export const planos: Record<PlanoId, Plano> = {
  black: {
    id: "black",
    nome: "Black",
    descricao: "Detalhes em definição com a Pitstop 084.",
    disponivel: false,
  },
  gold: {
    id: "gold",
    nome: "Gold",
    descricao: "Detalhes em definição com a Pitstop 084.",
    disponivel: false,
  },
  diamante: {
    id: "diamante",
    nome: "Diamante",
    descricao:
      "O cuidado mais completo da Pitstop 084 para quem não abre mão de ter o carro sempre impecável.",
    disponivel: true,
    destaque: true,
    categorias: [
      { id: "p", nome: "Carro P", descricao: "Hatch e Sedan", precoMensal: 329.9 },
      { id: "g", nome: "Carro G", descricao: "SUV e Pick-up", precoMensal: 389.9 },
    ],
    beneficios: [
      {
        numero: "01",
        titulo: "1 lavagem Diamante mensal",
        descricao:
          "O tratamento mais completo da Pitstop 084, pensado para entregar o máximo em cuidado, proteção e acabamento.",
      },
      {
        numero: "02",
        titulo: "2 lavagens Gold mensais",
        descricao: "Tratamento completo de conservação e proteção.",
      },
      {
        numero: "03",
        titulo: "Manutenção semanal ilimitada",
        descricao: "Mantenha seu veículo sempre impecável, com manutenções durante todo o mês.",
      },
      {
        numero: "04",
        titulo: "Atendimento prioritário",
        descricao: "Seu veículo tratado com prioridade na agenda.",
      },
      {
        numero: "05",
        titulo: "Serviço leva e busca",
        descricao: "Mais comodidade: nós cuidamos do deslocamento do veículo.",
      },
      {
        numero: "06",
        titulo: "20% off em todos os serviços adicionais",
        descricao: "",
      },
    ],
  },
};

export const listaPlanos: Plano[] = Object.values(planos);

export const regraUtilizacaoPlanos =
  "Os serviços inclusos no plano são válidos dentro do ciclo mensal vigente. Utilizações não realizadas dentro do período não acumulam para o próximo ciclo.";

/** Serviços que um assinante Diamante pode agendar dentro do próprio plano. */
export const servicosPlanoDiamante = ["Lavagem Diamante", "Lavagem Gold", "Manutenção semanal"];

export interface AvulsoServico {
  id: string;
  nome: string;
  descricao: string;
  preco: number | null;
  sobConsulta?: boolean;
  itens?: string[];
  duracao?: string;
  resultado?: string;
  imagem?: string;
  destaque?: boolean;
  categoria?: string;
}

export const avulsos: AvulsoServico[] = [
  {
    id: "ducha-pitstop",
    nome: "Ducha Pitstop",
    descricao: "Uma limpeza rápida para manter o veículo sempre limpo e apresentável.",
    preco: 49.9,
    itens: [
      "Lavagem externa completa",
      "Secagem detalhada de toda a carroceria",
      "Secagem das caixas de portas",
      "Aplicação de pretinho nos pneus",
    ],
    duracao: "Aproximadamente 45 minutos",
    resultado: "Veículo limpo, seco e com pneus renovados.",
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

export interface DuchaAddon {
  id: string;
  nome: string;
  /** null = preço ainda não definido com o cliente */
  preco: number | null;
}

export const duchaAddons: DuchaAddon[] = [
  { id: "pretinho", nome: "Pretinho", preco: null },
  { id: "cera", nome: "Cera", preco: null },
  { id: "protetor-plasticos", nome: "Protetor de plásticos", preco: null },
  { id: "protecao-chassi", nome: "Proteção de chassi", preco: null },
];

/** Rótulos genéricos das etapas do agendamento, usados no indicador de progresso. */
export const etapasAgendamento = ["Como agendar", "Serviço", "Horário", "Ficha técnica", "PitPass"];

export const whatsappNumero = "5511999999999";

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensagem)}`;
}

export const enderecoPitstop = {
  nome: "Pitstop 084",
  linha1: "Av. Presidente Café Filho, 522",
  linha2: "Praia do Meio",
};

export const linkComoChegar = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${enderecoPitstop.linha1}, ${enderecoPitstop.linha2}`
)}`;

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
