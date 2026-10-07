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

export type TipoVeiculo = "carro" | "moto";

/**
 * Classificação gravada no veículo e no agendamento: o porte do carro (P/G) ou MOTO.
 * Moto não tem porte: tem preço, duração e serviços próprios.
 */
export type CategoriaVeiculo = VehicleSize | "MOTO";

export function categoriaVeiculoValida(valor: unknown): valor is CategoriaVeiculo {
  return valor === "P" || valor === "G" || valor === "MOTO";
}

export function tipoDaCategoria(categoria: string | null | undefined): TipoVeiculo {
  return categoria === "MOTO" ? "moto" : "carro";
}

/** "Hatch / Sedan", "SUV / Pick-up" ou "Moto". Registro antigo sem categoria = porte P. */
export function rotuloCategoriaVeiculo(categoria: string | null | undefined): string {
  if (categoria === "MOTO") return "Moto";
  return (portesVeiculo[categoria as VehicleSize] ?? portesVeiculo.P).nome;
}

export type PlanoId = "black" | "gold" | "diamante" | "moto-black" | "moto-gold";

/** Nível de cuidado: 1 = limpar, 2 = limpar + proteger, 3 = limpar + proteger + preservar. */
export type NivelCuidado = 1 | 2 | 3;

/** Pilares acumulados por nível (o nível N entrega os N primeiros). */
export const pilaresCuidado = ["Limpar", "Proteger", "Preservar"] as const;

export function pilaresDoNivel(nivel: NivelCuidado): string {
  return pilaresCuidado.slice(0, nivel).join(" + ");
}

export interface Plano {
  id: PlanoId;
  nome: string;
  nivel: NivelCuidado;
  headline: string;
  tipoVeiculo: TipoVeiculo;
  /** Mensalidade por porte (planos de carro). */
  precos: Record<VehicleSize, number> | null;
  /** Mensalidade do plano de moto. null = ainda não definida pela gestão (não aparece no site). */
  precoMoto: number | null;
  beneficios: string[];
  cta: string;
  badge?: string;
  /** false = fora do site e do agendamento público. O admin liga/desliga em Serviços. */
  ativo?: boolean;
  /** Pendências comerciais/operacionais deste plano. NUNCA aparece no site. */
  aConfirmar?: string[];
}

export function precoPlano(plano: Plano, categoria: CategoriaVeiculo): number | null {
  if (categoria === "MOTO") return plano.precoMoto;
  return plano.precos ? plano.precos[categoria] : null;
}

/** Serviços incluídos em cada plano que podem ser agendados dentro do ciclo mensal. */
export const servicosPorPlano: Record<PlanoId, string[]> = {
  black: ["Lavagem Black"],
  gold: ["Lavagem Gold", "Manutenção"],
  diamante: ["Lavagem Diamante", "Lavagem Gold", "Manutenção"],
  "moto-black": ["Lavagem Moto Black"],
  "moto-gold": ["Lavagem Moto Gold"],
};

export const planos: Record<PlanoId, Plano> = {
  black: {
    id: "black",
    nome: "Black",
    nivel: 1,
    headline: "Manutenção essencial para manter seu carro limpo e apresentável.",
    tipoVeiculo: "carro",
    precos: { P: 149.9, G: 199.9 },
    precoMoto: null,
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
    nivel: 2,
    headline: "Limpeza e proteção adicional para conservar pintura, plásticos e acabamento.",
    tipoVeiculo: "carro",
    precos: { P: 239.9, G: 269.9 },
    precoMoto: null,
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
    nivel: 3,
    headline:
      "O tratamento mais completo da PitStop084 para quem busca conservação, acabamento e preservação superior.",
    tipoVeiculo: "carro",
    precos: { P: 329.9, G: 389.9 },
    precoMoto: null,
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
  // Planos de moto: só dois nesta fase (sem Moto Diamante). Mensalidade e cotas ainda dependem
  // da gestão: enquanto `precoMoto` for null, o plano não aparece no site.
  "moto-black": {
    id: "moto-black",
    nome: "Moto Black",
    nivel: 1,
    headline: "Manutenção essencial para manter a moto limpa e bem apresentada.",
    tipoVeiculo: "moto",
    precos: null,
    precoMoto: null,
    beneficios: ["2 lavagens mensais"],
    cta: "Quero ser Moto Black",
    aConfirmar: ["Mensalidade", "Quantidade de lavagens por ciclo (proposta: 2 por mês)"],
  },
  "moto-gold": {
    id: "moto-gold",
    nome: "Moto Gold",
    nivel: 2,
    headline: "Limpeza com proteção adicional para preservar pintura, carenagens e acabamento da moto.",
    tipoVeiculo: "moto",
    precos: null,
    precoMoto: null,
    beneficios: ["1 lavagem semanal"],
    cta: "Quero ser Moto Gold",
    aConfirmar: [
      "Mensalidade",
      "Frequência (proposta: 1 lavagem por semana)",
      "Se inclui atendimento prioritário e desconto em adicionais de moto",
    ],
  },
};

/** Planos de carro, na ordem da landing. */
export const listaPlanos: Plano[] = [planos.black, planos.gold, planos.diamante];
export const listaPlanosMoto: Plano[] = [planos["moto-black"], planos["moto-gold"]];
export const todosOsPlanos: Plano[] = [...listaPlanos, ...listaPlanosMoto];

export function planoValido(valor: unknown): valor is PlanoId {
  return typeof valor === "string" && Object.prototype.hasOwnProperty.call(planos, valor);
}

export const regraUtilizacaoPlanos =
  "Os benefícios são válidos durante o ciclo mensal da assinatura e não acumulam para o mês seguinte.";

/**
 * Regras reais de uso de cada benefício, derivadas dos textos de `planos[x].beneficios` acima
 * (cada linha cita o bullet de origem — não é um número inventado). `limite: null` = ilimitado.
 */
export const regrasBeneficios: Record<
  PlanoId,
  Record<string, { tipo: "ciclo" | "semanal"; limite: number | null }>
> = {
  black: {
    "Lavagem Black": { tipo: "semanal", limite: 1 }, // "1 lavagem semanal"
  },
  gold: {
    "Lavagem Gold": { tipo: "ciclo", limite: 1 }, // "1 Lavagem Gold mensal"
    "Manutenção": { tipo: "ciclo", limite: 4 }, // "4 Manutenções mensais"
  },
  diamante: {
    "Lavagem Diamante": { tipo: "ciclo", limite: 1 }, // "1 Lavagem Diamante mensal"
    "Lavagem Gold": { tipo: "ciclo", limite: 2 }, // "2 Lavagens Gold mensais"
    "Manutenção": { tipo: "semanal", limite: null }, // "Manutenção semanal ilimitada"
  },
  "moto-black": {
    "Lavagem Moto Black": { tipo: "ciclo", limite: 2 }, // "2 lavagens mensais" (proposta a validar)
  },
  "moto-gold": {
    "Lavagem Moto Gold": { tipo: "semanal", limite: 1 }, // "1 lavagem semanal" (proposta a validar)
  },
};

export type CategoriaCuidado = "limpeza" | "protecao" | "estetica";

export const categoriasCuidado: Record<CategoriaCuidado, string> = {
  limpeza: "Limpeza profunda",
  protecao: "Proteção",
  estetica: "Estética avançada",
};

/**
 * Ficha técnica: estrutura única usada por serviços avulsos e lavagens dos planos.
 * É a fonte de verdade de landing, configurador, agendamento, "Sou assinante" e admin —
 * objeto serializável, pronto pra vir do banco quando o admin passar a editar.
 */
export interface FichaTecnica {
  id: string;
  nome: string;
  /** Uma ou duas linhas: é o que aparece no card. O resto só na ficha. */
  shortDescription?: string;
  idealFor?: string[];
  includes?: string[];
  expectedResult?: string;
  /** Limitações e avisos ("Importante") que evitam promessa errada. */
  technicalNote?: string;
  /**
   * Duração operacional padrão, em minutos. Só preencher com tempo confirmado pela operação;
   * o admin ajusta em Serviços sem mexer no código. Sem valor = duração ainda não definida.
   */
  duracaoMin?: number;
  /**
   * Pontos que a operação ainda precisa confirmar. NUNCA aparece no site:
   * é a lista de pendências desta ficha.
   */
  aConfirmar?: string[];
}

export interface Servico extends FichaTecnica {
  categoria?: CategoriaCuidado;
  duracao?: string;
  /** Preço por porte do carro. null = sem preço fixo de carro (mediante avaliação, ou serviço só de moto). */
  precos: Record<VehicleSize, number> | null;
  /** Preço para moto. null/ausente = ainda não definido (ou serviço só de carro). */
  precoMoto?: number | null;
  /** Em quais veículos o serviço pode ser aplicado. Ausente = só carro. */
  tiposVeiculo?: TipoVeiculo[];
  requiresEvaluation: boolean;
  destaque?: boolean;
  /** Serviço técnico: precisa do detailer (o Kanban manda pro fluxo EM DETAIL). */
  exigeDetailer?: boolean;
  /** Precisa do lavador. Ausente = sim, a não ser que seja serviço só do detailer. */
  exigeLavador?: boolean;
}

export function precoServico(servico: Servico, categoria: CategoriaVeiculo): number | null {
  if (categoria === "MOTO") return servico.precoMoto ?? null;
  return servico.precos ? servico.precos[categoria] : null;
}

const notaAvaliacao = "O valor é definido após avaliação presencial do veículo.";

export const duchaPitstop: Servico = {
  id: "ducha-pitstop",
  nome: "Ducha Pitstop",
  shortDescription: "Lavagem rápida para manter o carro limpo, seco e apresentável.",
  includes: [
    "Lavagem externa completa",
    "Rodas e pneus",
    "Caixas de portas",
    "Secagem detalhada",
    "Pretinho nos pneus",
  ],
  duracao: "Aproximadamente 45 minutos",
  duracaoMin: 45,
  expectedResult: "Veículo limpo, seco e com pneus renovados.",
  precos: { P: 49.9, G: 49.9 },
  requiresEvaluation: false,
};

/**
 * Ducha Moto: serviço base do atendimento de motocicleta. Preço e duração NÃO estão definidos:
 * a gestão informa em Admin > Serviços, e só então a moto aparece no agendamento do site.
 *
 * SEGURANÇA: moto não recebe pretinho nem qualquer produto que deixe a banda de rodagem
 * escorregadia. Nunca copiar a etapa "Pretinho nos pneus" das lavagens de carro pra cá, nem
 * presumir que um produto automotivo serve nas superfícies da moto.
 */
export const duchaMoto: Servico = {
  id: "ducha-moto",
  nome: "Ducha Moto",
  shortDescription: "Lavagem externa da motocicleta, com secagem detalhada.",
  includes: [
    "Lavagem externa da motocicleta",
    "Tanque e carenagens",
    "Rodas",
    "Paralamas",
    "Banco",
    "Limpeza externa dos componentes acessíveis",
    "Secagem detalhada",
    "Retirada de água de frestas e pontos de retenção",
    "Acabamento dos plásticos compatíveis",
  ],
  technicalNote:
    "Sem desmontagem de peças. Não aplicamos pretinho nem produto que deixe a banda de rodagem dos pneus escorregadia: aderência vem antes do acabamento.",
  aConfirmar: ["Preço", "Duração", "Etapas e produtos realmente usados em moto (lista atual é a direção técnica inicial)"],
  precos: null,
  precoMoto: null,
  tiposVeiculo: ["moto"],
  requiresEvaluation: false,
};

/**
 * Adicionais específicos de moto (proteção de pintura/carenagem, tratamento de plásticos...).
 * Vazio de propósito: a operação ainda vai definir. O catálogo automotivo NÃO é reaproveitado
 * aqui automaticamente. Cada item novo entra com `tiposVeiculo: ["moto"]` e `precoMoto`.
 */
export const adicionaisMoto: Servico[] = [];

/** Tabela oficial de serviços avulsos da Pitstop 084 — cuidados adicionais do configurador "Monte seu Pitstop". */
export const servicosAvulsos: Servico[] = [
  {
    id: "descontaminacao-pintura",
    nome: "Descontaminação de Pintura",
    shortDescription: "Remove contaminantes aderidos e prepara a pintura para receber proteção.",
    categoria: "limpeza",
    idealFor: ["Pintura áspera ao toque, contaminada ou com resíduos aderidos"],
    includes: [
      "Limpeza e preparação da superfície",
      "Remoção de contaminantes aderidos",
      "Descontaminação química e/ou mecânica, conforme a necessidade",
      "Preparação para proteção ou acabamento posterior",
    ],
    expectedResult: "Superfície mais limpa, lisa e preparada para receber proteção.",
    aConfirmar: ["Método usado (químico, mecânico ou ambos) e produtos"],
    precos: { P: 99.9, G: 149.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "higienizacao-interna",
    nome: "Higienização Interna",
    shortDescription: "Limpeza profunda e higienização das principais superfícies internas.",
    categoria: "limpeza",
    idealFor: [
      "Veículos com uso intenso",
      "Crianças ou pets",
      "Sujeira acumulada",
      "Manchas",
      "Interior há muito tempo sem higienização",
    ],
    includes: [
      "Limpeza dos bancos e estofados",
      "Limpeza do carpete",
      "Limpeza do teto",
      "Limpeza dos cintos",
      "Painel e console",
      "Portas e acabamentos",
      "Higienização das superfícies compatíveis",
    ],
    expectedResult: "Interior mais limpo, renovado e higienizado.",
    technicalNote: "Manchas permanentes podem não ser removidas por completo.",
    aConfirmar: ["Produtos de higienização utilizados"],
    precos: { P: 249.9, G: 299.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "protecao-pintura-selante",
    nome: "Proteção de Pintura c/ Selante",
    shortDescription: "Selante aplicado sobre a pintura para mais brilho e proteção.",
    categoria: "protecao",
    idealFor: ["Quem quer aumentar o brilho e a proteção da pintura"],
    includes: ["Preparação da superfície", "Aplicação do selante", "Acabamento", "Proteção da pintura"],
    expectedResult: "Mais brilho, repelência e proteção contra agentes externos.",
    aConfirmar: ["Selante utilizado e durabilidade que pode ser informada ao cliente"],
    precos: { P: 49.9, G: 79.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "descontaminacao-protecao-motor",
    nome: "Descontaminação e Proteção de Motor",
    shortDescription: "Limpeza técnica do cofre do motor, com proteção dos componentes sensíveis.",
    categoria: "protecao",
    includes: [
      "Proteção de componentes sensíveis",
      "Limpeza técnica do cofre",
      "Remoção de sujeira e oleosidade",
      "Secagem cuidadosa",
      "Acabamento e proteção compatível",
    ],
    expectedResult: "Cofre do motor limpo, organizado e protegido.",
    aConfirmar: ["Indicação (\"ideal para\"), produtos usados e restrições do serviço"],
    precos: { P: 119.9, G: 159.9 },
    requiresEvaluation: false,
    destaque: true,
  },
  {
    id: "descontaminacao-protecao-chassis",
    nome: "Descontaminação e Proteção de Chassis",
    shortDescription: "Remove sujeira pesada e protege a parte inferior do carro.",
    categoria: "protecao",
    includes: [
      "Limpeza inferior",
      "Remoção de sujeira pesada",
      "Desengraxe, quando necessário",
      "Limpeza das áreas acessíveis",
      "Proteção e acabamento das superfícies compatíveis",
    ],
    aConfirmar: ["Indicação (\"ideal para\"), resultado esperado e produto de proteção aplicado"],
    precos: { P: 99.9, G: 149.9 },
    requiresEvaluation: false,
  },
  {
    id: "restauracao-vitrificacao-plasticos",
    exigeDetailer: true,
    nome: "Restauração e Vitrificação de Plásticos",
    shortDescription: "Recupera a aparência e protege os plásticos desgastados.",
    categoria: "estetica",
    includes: [
      "Limpeza profunda dos plásticos",
      "Preparação",
      "Recuperação visual, quando possível",
      "Aplicação do produto de proteção/vitrificação",
      "Acabamento",
    ],
    expectedResult: "Melhor aparência, proteção e conservação dos plásticos.",
    technicalNote: `A recuperação depende do estado dos plásticos. ${notaAvaliacao}`,
    aConfirmar: ["Produto de vitrificação e se cobre plásticos internos, externos ou ambos"],
    precos: null,
    requiresEvaluation: true,
  },
  {
    id: "vitrificacao-pintura",
    exigeDetailer: true,
    nome: "Vitrificação de Pintura",
    shortDescription: "Coating aplicado sobre a pintura preparada, para proteção superior.",
    categoria: "estetica",
    idealFor: ["Quem busca proteção superior e conservação da pintura"],
    includes: [
      "Avaliação da pintura",
      "Preparação",
      "Descontaminação",
      "Correção conforme necessidade e avaliação",
      "Aplicação do coating/vitrificador",
      "Cura conforme o produto",
    ],
    technicalNote: `O resultado depende da condição da pintura. ${notaAvaliacao}`,
    aConfirmar: ["Coating utilizado, tempo de cura, durabilidade e resultado esperado a comunicar"],
    precos: null,
    requiresEvaluation: true,
  },
  {
    id: "polimento-tecnico",
    exigeDetailer: true,
    nome: "Polimento Técnico",
    shortDescription: "Correção de marcas leves a moderadas e recuperação do brilho.",
    categoria: "estetica",
    idealFor: ["Perda de brilho", "Marcas leves a moderadas", "Pequenos riscos superficiais", "Swirls"],
    includes: [
      "Avaliação da pintura",
      "Descontaminação",
      "Correção de defeitos conforme a condição",
      "Refino",
      "Acabamento",
    ],
    technicalNote: `Riscos profundos podem exigir outro procedimento. O resultado depende da condição da pintura. ${notaAvaliacao}`,
    aConfirmar: ["Número de etapas de correção e resultado esperado a comunicar"],
    precos: null,
    requiresEvaluation: true,
  },
  {
    id: "polimento-detalhado",
    exigeDetailer: true,
    nome: "Polimento Detalhado",
    shortDescription: "Correção em etapas, com atenção às áreas pequenas e de difícil acesso.",
    categoria: "estetica",
    includes: [
      "Avaliação completa",
      "Preparação",
      "Etapas de correção conforme a necessidade",
      "Atenção a áreas pequenas e de difícil acesso",
      "Refino",
      "Acabamento final",
    ],
    technicalNote: `Riscos profundos podem exigir outro procedimento. ${notaAvaliacao}`,
    aConfirmar: ["O que o diferencia do Polimento Técnico, indicação e resultado esperado"],
    precos: null,
    requiresEvaluation: true,
  },
];

/**
 * Lavagem/benefício agendável de um plano. `nome` é a chave usada em `servicosPorPlano`,
 * `regrasBeneficios` e gravada no agendamento.
 */
export interface LavagemPlano extends FichaTecnica {
  /** Ausente = lavagem de carro. */
  tiposVeiculo?: TipoVeiculo[];
  /** null = não é um nível de lavagem (Manutenção). */
  nivel: NivelCuidado | null;
  /** Nome da lavagem cujos itens esta herda ("Inclui tudo da ... +"). */
  incluiTudoDe?: string;
  /** O que este nível entrega de concreto: produtos, processos, proteção, etapas. */
  diferencial: string;
}

export const lavagensPlano: Record<string, LavagemPlano> = {
  "Lavagem Black": {
    id: "lavagem-black",
    nome: "Lavagem Black",
    nivel: 1,
    shortDescription: "Manutenção essencial para manter seu carro limpo e apresentável.",
    idealFor: ["Manutenção frequente", "Quem quer o carro limpo e apresentável toda semana"],
    includes: [
      "Lavagem externa",
      "Rodas e pneus",
      "Caixas de rodas com desengraxante apropriado",
      "Caixas de portas",
      "Secagem detalhada",
      "Pretinho nos pneus",
      "Aspiração interna básica",
      "Painel e superfícies de contato",
      "Limpeza básica dos vidros",
    ],
    expectedResult: "Carro limpo por fora e por dentro, seco e apresentável.",
    diferencial:
      "Vai além da Ducha: soma caixas de rodas, aspiração interna, painel e vidros à lavagem externa.",
  },
  "Lavagem Gold": {
    id: "lavagem-gold",
    nome: "Lavagem Gold",
    nivel: 2,
    shortDescription:
      "Limpeza com produtos de nível superior e proteção adicional para conservar pintura, plásticos e acabamento.",
    idealFor: ["Quem quer limpeza, conservação e proteção no mesmo cuidado"],
    incluiTudoDe: "Lavagem Black",
    includes: [
      "Shampoo de lavagem de linha superior",
      "Produto específico para rodas",
      "Proteção de pintura com selante ou produto de manutenção premium",
      "Proteção e acabamento dos plásticos externos",
      "Acabamento premium dos pneus",
      "Produto específico para vidros",
      "Proteção e acabamento do painel e das superfícies internas compatíveis",
    ],
    expectedResult: "Carro limpo, com pintura, plásticos, pneus e painel protegidos.",
    diferencial:
      "Acrescenta à Black a etapa de proteção: selante na pintura, acabamento nos plásticos externos, pneus e painel, com produtos específicos para rodas e vidros.",
    aConfirmar: [
      "Quais produtos de linha superior são usados (shampoo, rodas, vidros)",
      "Produto de proteção de pintura da Gold (selante ou manutenção premium)",
    ],
  },
  "Lavagem Diamante": {
    id: "lavagem-diamante",
    nome: "Lavagem Diamante",
    nivel: 3,
    shortDescription:
      "O tratamento mais completo da PitStop084 para quem busca conservação, acabamento e preservação superior.",
    idealFor: ["Quem busca o máximo padrão de acabamento e preservação"],
    incluiTudoDe: "Lavagem Gold",
    includes: [
      "Proteção de pintura de nível superior à da Gold",
      "Tratamento e proteção dos plásticos internos e externos compatíveis",
      "Acabamento de pneus de maior durabilidade",
      "Limpeza técnica de áreas de difícil acesso",
      "Proteção de vidros",
      "Inspeção visual final",
      "Finalização com produto de alto brilho e proteção, no padrão PitStop084",
    ],
    expectedResult: "Carro limpo, protegido e com o acabamento preservado.",
    diferencial:
      "Acrescenta à Gold a etapa de preservação: proteção de pintura de nível superior, tratamento dos plásticos internos, limpeza técnica de áreas de difícil acesso e inspeção final.",
    aConfirmar: ["Produtos de proteção de pintura e de vidros da Diamante"],
  },
  "Manutenção": {
    id: "manutencao-pitpass",
    nome: "Manutenção",
    nivel: null,
    shortDescription: "Cuidado periódico para preservar o resultado da lavagem principal ao longo do mês.",
    idealFor: ["Manter o padrão entre as lavagens principais"],
    includes: [
      "Lavagem externa de manutenção",
      "Rodas e pneus",
      "Aspiração leve",
      "Painel e superfícies",
      "Vidros",
      "Caixas de portas",
      "Secagem",
      "Acabamento",
    ],
    expectedResult: "Padrão da lavagem principal mantido até o próximo cuidado completo.",
    diferencial:
      "Não é outra lavagem completa do plano: é a manutenção que conserva o resultado dela, sem repetir as etapas de proteção.",
  },
  // Lavagens dos planos de moto. Conteúdo = direção técnica inicial, a validar com a operação.
  // Sem pretinho nem produto na banda de rodagem (ver aviso em `duchaMoto`).
  "Lavagem Moto Black": {
    id: "lavagem-moto-black",
    nome: "Lavagem Moto Black",
    nivel: 1,
    tiposVeiculo: ["moto"],
    shortDescription: "Manutenção essencial para manter a moto limpa e bem apresentada.",
    includes: [
      "Lavagem externa",
      "Tanque e carenagens",
      "Rodas",
      "Paralamas",
      "Banco",
      "Áreas externas acessíveis",
      "Secagem detalhada",
      "Acabamento dos plásticos compatíveis",
      "Inspeção visual final",
    ],
    technicalNote:
      "Sem desmontagem de peças. Não aplicamos pretinho nem produto que deixe a banda de rodagem dos pneus escorregadia.",
    diferencial: "Limpar: a manutenção essencial da moto, com secagem detalhada e inspeção final.",
    aConfirmar: ["Etapas confirmadas pela operação", "Duração"],
  },
  "Lavagem Moto Gold": {
    id: "lavagem-moto-gold",
    nome: "Lavagem Moto Gold",
    nivel: 2,
    tiposVeiculo: ["moto"],
    shortDescription: "Limpeza com proteção adicional para preservar pintura, carenagens e acabamento da moto.",
    incluiTudoDe: "Lavagem Moto Black",
    includes: [
      "Produto de lavagem de linha premium",
      "Proteção de pintura e carenagens compatíveis",
      "Proteção e acabamento dos plásticos compatíveis",
      "Limpeza e acabamento superior das rodas",
      "Inspeção e acabamento final premium",
    ],
    technicalNote:
      "Sem desmontagem de peças. Não aplicamos pretinho nem produto que deixe a banda de rodagem dos pneus escorregadia.",
    diferencial: "Limpar + proteger: acrescenta à Moto Black produtos de linha superior e a etapa de proteção.",
    aConfirmar: [
      "Quais itens realmente fazem parte do processo (lista atual é proposta)",
      "Produtos de lavagem e de proteção usados em moto",
      "Duração",
    ],
  },
};

/**
 * Lavagens/benefícios de um plano como serviços reais do catálogo (não nomes soltos):
 * é por aqui que agendamento, admin e recibo chegam à ficha, à duração e ao id do serviço.
 */
export function beneficiosDoPlano(planoId: PlanoId): LavagemPlano[] {
  return (servicosPorPlano[planoId] ?? []).map((nome) => lavagensPlano[nome]).filter(Boolean);
}

/** Rótulos genéricos das etapas do agendamento, usados no indicador de progresso. */
export const etapasAgendamento = ["Como agendar", "Serviço", "Horário", "Ficha técnica", "PitPass"];

export const whatsappNumero = "5584987554603";

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensagem)}`;
}

/** Conversa com um CLIENTE (o admin usa isso; `linkWhatsapp` acima fala com a loja). */
export function linkWhatsappPara(telefone: string, mensagem: string) {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length <= 11) digitos = "55" + digitos;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

/** Por onde o cliente chegou (campo interno do admin). */
export const origensCliente = [
  { id: "site", rotulo: "Site" },
  { id: "instagram", rotulo: "Instagram" },
  { id: "whatsapp", rotulo: "WhatsApp" },
  { id: "presencial", rotulo: "Presencial" },
  { id: "indicacao", rotulo: "Indicação" },
  { id: "outro", rotulo: "Outro" },
] as const;

export const enderecoPitstop = {
  nome: "PitStop084",
  linha1: "Av. Presidente Café Filho, 522",
  linha2: "Praia do Meio",
  linha3: "Natal - RN",
};

/**
 * Foto REAL da fachada, pra ajudar o cliente a reconhecer a loja ao chegar. Se virar null,
 * a seção de localização volta a mostrar só endereço + mapa, sem buraco nem placeholder.
 * `foco` = object-position, pra manter a placa visível no recorte.
 */
export const fotoFachada: { src: string; alt: string; foco: string } | null = {
  src: "/fachada-pitstop084.jpg",
  alt: "Fachada da PitStop084 Premium Car Studio, com a placa preta e o portão aberto para o box de lavagem",
  foco: "50% 40%",
};

const enderecoCompleto =`${enderecoPitstop.linha1}, ${enderecoPitstop.linha2}, ${enderecoPitstop.linha3}`;

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

/** Descreve a cota real de um benefício (de `regrasBeneficios`), sem inventar número nenhum. */
export function formatarRegraBeneficio(regra: { tipo: "ciclo" | "semanal"; limite: number | null }): string {
  if (regra.limite === null) return "Ilimitado nesta semana";
  if (regra.tipo === "semanal") return regra.limite === 1 ? "1x por semana" : `Até ${regra.limite}x por semana`;
  return regra.limite === 1 ? "1x por ciclo" : `Até ${regra.limite}x por ciclo`;
}
