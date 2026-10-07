import { formatarDataCurta } from "./agenda";
import { formatarPreco } from "./format";

/**
 * Recibo / comprovante de serviço: estrutura e textos compartilhados pela tela, pela impressão
 * e pelo PDF. Helpers puros (sem banco). NÃO é nota fiscal: não há integração fiscal, então o
 * documento nunca se apresenta como NF, NF-e ou NFS-e.
 */

export const formasPagamento = [
  "Pix",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "PitPass (incluso no plano)",
  "Outro",
] as const;

export interface ItemRecibo {
  descricao: string;
  adicional: boolean;
  /** null = sem valor individual (benefício do plano ou serviço mediante avaliação). */
  valor: number | null;
  nota?: string;
}

export interface DadosRecibo {
  numero: string;
  /** ISO do momento da emissão. */
  emitidoEm: string;
  empresa: { nome: string; documento: string; endereco: string; telefone: string };
  cliente: { nome: string; telefone: string; codigo: string | null };
  veiculo: { modelo: string; placa: string | null; tipo: "Carro" | "Moto"; porte: string | null };
  /** Código P084 do atendimento. */
  codigoAtendimento: string | null;
  dataAtendimento: string;
  horario: string;
  /** "PitPass Gold" quando o atendimento usou benefício de plano. */
  plano: string | null;
  itens: ItemRecibo[];
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  formaPagamento: string;
  observacao: string | null;
}

export const AVISO_NAO_FISCAL = "Comprovante de serviço. Este documento não é nota fiscal.";

export function numeroDoRecibo(id: number): string {
  return `R084-${String(id).padStart(4, "0")}`;
}

/** "07/10/2026" no fuso da loja. */
export function dataDoRecibo(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short" }).format(new Date(iso));
}

export function valorDoItem(item: ItemRecibo): string {
  return item.valor != null ? formatarPreco(item.valor) : (item.nota ?? "-");
}

/** Resumo em texto, pra mandar no WhatsApp quando o aparelho não compartilha o PDF direto. */
export function textoDoRecibo(dados: DadosRecibo): string {
  const linhas = [
    `PitStop084 · Recibo de serviço ${dados.numero}`,
    `Data: ${dataDoRecibo(dados.emitidoEm)}`,
    "",
    `Cliente: ${dados.cliente.nome}`,
    `Veículo: ${dados.veiculo.modelo}${dados.veiculo.placa ? ` · ${dados.veiculo.placa}` : ""}`,
    dados.codigoAtendimento ? `Atendimento: ${dados.codigoAtendimento} (${formatarDataCurta(dados.dataAtendimento)})` : "",
    "",
    ...dados.itens.map((i) => `${i.adicional ? "+ " : ""}${i.descricao}: ${valorDoItem(i)}`),
    "",
    dados.desconto > 0 ? `Desconto: - ${formatarPreco(dados.desconto)}` : "",
    dados.acrescimo > 0 ? `Acréscimo: ${formatarPreco(dados.acrescimo)}` : "",
    `Total: ${formatarPreco(dados.total)}`,
    `Pagamento: ${dados.formaPagamento}`,
    "",
    AVISO_NAO_FISCAL,
  ];
  // tira linhas vazias repetidas deixadas pelos campos opcionais
  return linhas.filter((l, i) => l !== "" || linhas[i - 1] !== "").join("\n").trim();
}
