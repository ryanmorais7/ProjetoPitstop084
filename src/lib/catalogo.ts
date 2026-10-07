import {
  adicionaisMoto,
  CategoriaCuidado,
  categoriasCuidado,
  CategoriaVeiculo,
  duchaMoto,
  duchaPitstop,
  lavagensPlano,
  LavagemPlano,
  NivelCuidado,
  Plano,
  PlanoId,
  planos as planosBase,
  precoPlano,
  precoServico,
  Servico,
  servicosAvulsos,
  tipoDaCategoria,
  TipoVeiculo,
} from "./data";

/**
 * Catálogo central: Ducha, adicionais, lavagens e manutenções dos planos, carro e moto, numa
 * estrutura só. Helpers puros (sem banco): rodam no servidor e no navegador.
 *
 * Os textos e valores padrão continuam em src/lib/data.ts (fonte única). O que a gestão ajusta
 * no admin (preço, duração, ativo...) fica na tabela `catalogo_config` e entra aqui como
 * `AjusteCatalogo`: o catálogo não é duplicado no banco, só as diferenças.
 */

export type TipoItem = "ducha" | "adicional" | "lavagem_plano" | "manutencao";

export const rotuloTipoItem: Record<TipoItem, string> = {
  ducha: "Serviço base",
  adicional: "Adicional",
  lavagem_plano: "Lavagem de plano",
  manutencao: "Manutenção de plano",
};

export interface ItemCatalogo extends Servico {
  tipo: TipoItem;
  precoMoto: number | null;
  tiposVeiculo: TipoVeiculo[];
  exigeDetailer: boolean;
  exigeLavador: boolean;
  /** Pode ser somado ao serviço base no agendamento. */
  podeSerAdicional: boolean;
  /** É benefício de plano PitPass (o nome é a chave das cotas, por isso não é editável). */
  beneficioDePlano: boolean;
  ativo: boolean;
  nivel?: NivelCuidado | null;
  incluiTudoDe?: string;
  diferencial?: string;
}

/** Uma linha de `catalogo_config`. Todo campo null = usa o padrão do código. */
export interface AjusteCatalogo {
  itemId: string;
  nome?: string | null;
  categoria?: string | null;
  precoP?: number | null;
  precoG?: number | null;
  precoMoto?: number | null;
  duracaoMin?: number | null;
  ativo?: boolean | null;
  requerAvaliacao?: boolean | null;
  requerDetailer?: boolean | null;
  requerLavador?: boolean | null;
  podeSerAdicional?: boolean | null;
}

export interface Catalogo {
  itens: ItemCatalogo[];
  planos: Record<PlanoId, Plano>;
  /** Tempo de organização/movimentação somado depois de cada atendimento. 0 até a gestão definir. */
  bufferMin: number;
}

/** Chave de um plano em `catalogo_config` (serviços usam o próprio id). */
export function chaveAjustePlano(planoId: PlanoId): string {
  return `plano:${planoId}`;
}

function doServico(servico: Servico, tipo: TipoItem): ItemCatalogo {
  const exigeDetailer = servico.exigeDetailer ?? false;
  return {
    ...servico,
    tipo,
    precoMoto: servico.precoMoto ?? null,
    tiposVeiculo: servico.tiposVeiculo ?? ["carro"],
    exigeDetailer,
    exigeLavador: servico.exigeLavador ?? !exigeDetailer,
    podeSerAdicional: tipo === "adicional",
    beneficioDePlano: false,
    ativo: true,
  };
}

function daLavagem(lavagem: LavagemPlano): ItemCatalogo {
  return {
    ...lavagem,
    tipo: lavagem.nivel === null ? "manutencao" : "lavagem_plano",
    precos: null,
    precoMoto: null,
    tiposVeiculo: lavagem.tiposVeiculo ?? ["carro"],
    requiresEvaluation: false,
    exigeDetailer: false,
    exigeLavador: true,
    podeSerAdicional: false,
    beneficioDePlano: true,
    ativo: true,
  };
}

function itensBase(): ItemCatalogo[] {
  return [
    doServico(duchaPitstop, "ducha"),
    doServico(duchaMoto, "ducha"),
    ...servicosAvulsos.map((s) => doServico(s, "adicional")),
    ...adicionaisMoto.map((s) => doServico(s, "adicional")),
    ...Object.values(lavagensPlano).map(daLavagem),
  ];
}

function aplicarAjuste(item: ItemCatalogo, ajuste: AjusteCatalogo | undefined): ItemCatalogo {
  if (!ajuste) return item;
  const requiresEvaluation = ajuste.requerAvaliacao ?? item.requiresEvaluation;
  const precoP = ajuste.precoP ?? item.precos?.P ?? null;
  const precoG = ajuste.precoG ?? item.precos?.G ?? null;
  const categoria =
    ajuste.categoria && ajuste.categoria in categoriasCuidado ? (ajuste.categoria as CategoriaCuidado) : item.categoria;
  return {
    ...item,
    nome: !item.beneficioDePlano && ajuste.nome?.trim() ? ajuste.nome.trim() : item.nome,
    categoria,
    requiresEvaluation,
    precos: requiresEvaluation || precoP == null || precoG == null ? null : { P: precoP, G: precoG },
    precoMoto: requiresEvaluation ? null : (ajuste.precoMoto ?? item.precoMoto),
    duracaoMin: ajuste.duracaoMin ?? item.duracaoMin,
    ativo: ajuste.ativo ?? item.ativo,
    exigeDetailer: ajuste.requerDetailer ?? item.exigeDetailer,
    exigeLavador: ajuste.requerLavador ?? item.exigeLavador,
    podeSerAdicional: ajuste.podeSerAdicional ?? item.podeSerAdicional,
  };
}

function aplicarAjustePlano(plano: Plano, ajuste: AjusteCatalogo | undefined): Plano {
  if (!ajuste) return plano;
  const precoP = ajuste.precoP ?? plano.precos?.P ?? null;
  const precoG = ajuste.precoG ?? plano.precos?.G ?? null;
  return {
    ...plano,
    precos: precoP == null || precoG == null ? null : { P: precoP, G: precoG },
    precoMoto: ajuste.precoMoto ?? plano.precoMoto,
    ativo: ajuste.ativo ?? plano.ativo,
  };
}

export function montarCatalogo(ajustes: AjusteCatalogo[] = [], bufferMin = 0): Catalogo {
  const porId = new Map(ajustes.map((a) => [a.itemId, a]));
  const planos = Object.fromEntries(
    Object.values(planosBase).map((p) => [p.id, aplicarAjustePlano(p, porId.get(chaveAjustePlano(p.id)))])
  ) as Record<PlanoId, Plano>;
  return {
    itens: itensBase().map((item) => aplicarAjuste(item, porId.get(item.id))),
    planos,
    bufferMin: Number.isFinite(bufferMin) && bufferMin > 0 ? Math.round(bufferMin) : 0,
  };
}

/** Catálogo só com os padrões do código (sem ajustes do admin). */
export const catalogoPadrao: Catalogo = montarCatalogo();

export function itemPorId(catalogo: Catalogo, id: string | null | undefined): ItemCatalogo | null {
  return (id ? catalogo.itens.find((i) => i.id === id) : null) ?? null;
}

/** Serviço real por trás de um benefício de plano ("Lavagem Gold" → item do catálogo). */
export function itemDoBeneficio(catalogo: Catalogo, beneficio: string | null | undefined): ItemCatalogo | null {
  return (beneficio ? catalogo.itens.find((i) => i.beneficioDePlano && i.nome === beneficio) : null) ?? null;
}

export function atendeVeiculo(item: ItemCatalogo, categoria: CategoriaVeiculo): boolean {
  return item.tiposVeiculo.includes(tipoDaCategoria(categoria));
}

/**
 * Pode ser vendido no site pra esse veículo: ativo, compatível e com preço definido (ou
 * mediante avaliação). Serviço sem preço cadastrado nunca aparece pro cliente.
 */
export function disponivelNoSite(item: ItemCatalogo, categoria: CategoriaVeiculo): boolean {
  if (!item.ativo || !atendeVeiculo(item, categoria)) return false;
  return item.requiresEvaluation || precoServico(item, categoria) != null;
}

/** Serviço base (Ducha) do tipo de veículo. */
export function servicoBase(catalogo: Catalogo, categoria: CategoriaVeiculo): ItemCatalogo | null {
  return catalogo.itens.find((i) => i.tipo === "ducha" && atendeVeiculo(i, categoria)) ?? null;
}

/** Adicionais compatíveis com o veículo. `site` = só o que o cliente pode contratar sozinho. */
export function adicionaisPara(catalogo: Catalogo, categoria: CategoriaVeiculo, site: boolean): ItemCatalogo[] {
  return catalogo.itens.filter(
    (i) =>
      i.podeSerAdicional &&
      i.tipo !== "ducha" &&
      (site ? disponivelNoSite(i, categoria) : i.ativo && atendeVeiculo(i, categoria))
  );
}

/** A moto só entra no fluxo público quando a Ducha Moto tem preço e está ativa. */
export function motoDisponivelNoSite(catalogo: Catalogo): boolean {
  const base = servicoBase(catalogo, "MOTO");
  return Boolean(base && disponivelNoSite(base, "MOTO"));
}

/** Planos de um tipo de veículo. `site` = só os ativos e com mensalidade definida. */
export function planosPara(catalogo: Catalogo, tipo: TipoVeiculo, site: boolean): Plano[] {
  return Object.values(catalogo.planos).filter((p) => {
    if (p.tipoVeiculo !== tipo) return false;
    if (!site) return true;
    return p.ativo !== false && precoPlano(p, tipo === "moto" ? "MOTO" : "P") != null;
  });
}

/**
 * Duração estimada do atendimento = soma das durações configuradas. Se algum serviço ainda não
 * tem duração definida, devolve null: não se mostra nem se usa uma estimativa pela metade.
 */
export function duracaoTotal(itens: { duracaoMin?: number | null }[]): number | null {
  if (itens.length === 0) return null;
  let total = 0;
  for (const item of itens) {
    if (typeof item.duracaoMin !== "number" || item.duracaoMin <= 0) return null;
    total += item.duracaoMin;
  }
  return total;
}

/** "45 min", "1h", "1h 45min". */
export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const resto = minutos % 60;
  return resto ? `${Math.floor(minutos / 60)}h ${String(resto).padStart(2, "0")}min` : `${Math.floor(minutos / 60)}h`;
}

/**
 * "Complete seu cuidado": regras fixas, em ordem de prioridade. Sem IA, sem API, sem sorteio:
 * a mesma seleção devolve sempre a mesma sugestão. `quando` = serviço já escolhido (a Ducha
 * conta); `sugerir` = complemento. Os motivos só repetem o que as fichas técnicas já dizem.
 */
export const regrasRecomendacao: { quando: string; sugerir: string; motivo: string }[] = [
  {
    quando: "descontaminacao-pintura",
    sugerir: "protecao-pintura-selante",
    motivo: "A descontaminação deixa a pintura preparada para receber proteção. O selante completa esse cuidado.",
  },
  {
    quando: "protecao-pintura-selante",
    sugerir: "descontaminacao-pintura",
    motivo: "Antes do selante, a descontaminação remove o que está aderido e prepara a pintura para a proteção.",
  },
  {
    quando: "ducha-pitstop",
    sugerir: "protecao-pintura-selante",
    motivo: "Depois da Ducha, o selante acrescenta brilho e proteção à pintura.",
  },
];

export interface RecomendacaoAdicional {
  item: ItemCatalogo;
  motivo: string;
}

/**
 * Devolve no máximo UM complemento pro que já foi escolhido, ou null. `candidatos` = adicionais
 * que o cliente pode contratar pra aquele veículo (já filtrados por ativo/preço/compatibilidade);
 * serviço mediante avaliação nunca é sugerido.
 */
export function recomendarAdicional(idsEscolhidos: string[], candidatos: ItemCatalogo[]): RecomendacaoAdicional | null {
  for (const regra of regrasRecomendacao) {
    if (!idsEscolhidos.includes(regra.quando) || idsEscolhidos.includes(regra.sugerir)) continue;
    const item = candidatos.find((c) => c.id === regra.sugerir && !c.requiresEvaluation);
    if (item) return { item, motivo: regra.motivo };
  }
  return null;
}

/** Mesmo que `recomendarAdicional` (nome usado no alinhamento com a gestão). */
export const getRecommendedAddOn = recomendarAdicional;
