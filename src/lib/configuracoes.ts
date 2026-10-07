import { db } from "@/db/client";
import { configuracoes } from "@/db/schema";
import { enderecoPitstop, whatsappNumero } from "./data";
import { formatarTelefone } from "./format";

/**
 * Configurações do negócio editáveis no admin (tabela `configuracoes`, chave/valor).
 * Tudo aqui tem padrão: se a tabela não existir ou estiver vazia, o site segue funcionando.
 */
export const chavesConfiguracao = {
  bufferMin: "agenda.bufferMin",
  empresaNome: "empresa.nome",
  empresaDocumento: "empresa.documento",
  empresaEndereco: "empresa.endereco",
  empresaTelefone: "empresa.telefone",
  reciboObservacao: "recibo.observacao",
} as const;

export type Configuracoes = Record<string, string>;

export async function lerConfiguracoes(): Promise<Configuracoes> {
  try {
    const linhas = await db.select().from(configuracoes);
    return Object.fromEntries(linhas.filter((l) => l.valor != null).map((l) => [l.chave, l.valor as string]));
  } catch {
    // tabela ainda não migrada ou banco fora: vale o padrão do código
    return {};
  }
}

export async function salvarConfiguracoes(valores: Record<string, string | null>) {
  for (const [chave, valor] of Object.entries(valores)) {
    await db
      .insert(configuracoes)
      .values({ chave, valor })
      .onConflictDoUpdate({ target: configuracoes.chave, set: { valor, updatedAt: new Date() } });
  }
}

/** Minutos de organização/movimentação depois de cada atendimento. Começa em 0. */
export function bufferDaAgenda(config: Configuracoes): number {
  const valor = Number(config[chavesConfiguracao.bufferMin]);
  return Number.isFinite(valor) && valor > 0 ? Math.min(Math.round(valor), 240) : 0;
}

export interface DadosEmpresa {
  nome: string;
  /** CNPJ/CPF. Vazio enquanto a gestão não informar: o recibo simplesmente não mostra a linha. */
  documento: string;
  endereco: string;
  telefone: string;
}

export function dadosEmpresa(config: Configuracoes): DadosEmpresa {
  return {
    nome: config[chavesConfiguracao.empresaNome] || "PitStop084 Premium Car Studio",
    documento: config[chavesConfiguracao.empresaDocumento] || "",
    endereco:
      config[chavesConfiguracao.empresaEndereco] ||
      `${enderecoPitstop.linha1}, ${enderecoPitstop.linha2}, ${enderecoPitstop.linha3}`,
    telefone: config[chavesConfiguracao.empresaTelefone] || formatarTelefone(whatsappNumero.replace(/^55/, "")),
  };
}
