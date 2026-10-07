import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, clientes, recibos } from "@/db/schema";
import { dadosEmpresa, lerConfiguracoes } from "./configuracoes";
import { planos, planoValido, portesVeiculo, tipoDaCategoria, VehicleSize } from "./data";
import { DadosRecibo, ItemRecibo, numeroDoRecibo } from "./recibo";

type Agendamento = typeof agendamentos.$inferSelect;

/** Dinheiro sempre em centavos exatos: 299.8 - 249.9 não pode virar 49.900000000000006. */
const centavos = (valor: number) => Math.round(valor * 100) / 100;
export type Recibo = typeof recibos.$inferSelect;

/** Itens e subtotal a partir dos dados REAIS do atendimento (serviço, adicionais e valores gravados). */
export function itensDoAtendimento(registro: Agendamento): { itens: ItemRecibo[]; subtotal: number; plano: string | null } {
  if (registro.tipoAtendimento === "assinatura") {
    const plano = planoValido(registro.plano) ? `PitPass ${planos[registro.plano].nome}` : "PitPass";
    return {
      itens: [{ descricao: registro.servicoNome ?? "Benefício do plano", adicional: false, valor: null, nota: "Incluso no plano" }],
      subtotal: 0,
      plano,
    };
  }

  let adicionais: { nome: string; preco: number | null }[] = [];
  try {
    adicionais = registro.servicosAdicionais ? JSON.parse(registro.servicosAdicionais) : [];
  } catch {
    // JSON antigo mal formado: recibo sai só com o serviço principal
  }
  const somaAdicionais = adicionais.reduce((soma, a) => soma + (a.preco ?? 0), 0);
  // valor de tabela do atendimento (antes de qualquer ajuste manual) menos os adicionais = serviço base
  const tabela = registro.valorOriginal ?? registro.preco;
  const valorBase = tabela != null ? centavos(Math.max(Number(tabela) - somaAdicionais, 0)) : null;

  const itens: ItemRecibo[] = [
    { descricao: registro.servicoNome ?? "Ducha Pitstop", adicional: false, valor: valorBase, nota: "A combinar" },
    ...adicionais.map((a) => ({ descricao: a.nome, adicional: true, valor: a.preco, nota: "Mediante avaliação" })),
  ];
  return { itens, subtotal: centavos(itens.reduce((soma, i) => soma + (i.valor ?? 0), 0)), plano: null };
}

/** Valor que o recibo sugere como cobrado: o valor final gravado no atendimento. */
export function valorCobradoSugerido(registro: Agendamento): number {
  if (registro.tipoAtendimento === "assinatura") return 0;
  return registro.preco != null ? Number(registro.preco) : itensDoAtendimento(registro).subtotal;
}

export async function buscarReciboDoAtendimento(agendamentoId: number): Promise<Recibo | null> {
  const [recibo] = await db.select().from(recibos).where(eq(recibos.agendamentoId, agendamentoId));
  return recibo ?? null;
}

export async function recibosDoCliente(clienteId: number): Promise<Recibo[]> {
  return db.select().from(recibos).where(eq(recibos.clienteId, clienteId)).orderBy(desc(recibos.emitidoEm));
}

export function lerDadosRecibo(recibo: Recibo): DadosRecibo | null {
  try {
    return JSON.parse(recibo.dados) as DadosRecibo;
  } catch {
    return null;
  }
}

export type ResultadoRecibo = { ok: true; recibo: Recibo } | { ok: false; erro: string };

/**
 * Emite (ou atualiza) o recibo de um atendimento concluído. Um recibo por atendimento: emitir de
 * novo mantém o mesmo número e a data original, só atualiza pagamento/observação/valor.
 * O número vem da sequência própria da tabela de recibos (R084-0001...), então nunca repete.
 */
export async function emitirRecibo(
  agendamentoId: number,
  entrada: { formaPagamento: string; observacao: string | null; valorCobrado: number | null }
): Promise<ResultadoRecibo> {
  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.id, agendamentoId));
  if (!registro) return { ok: false, erro: "Atendimento não encontrado." };
  if (registro.status !== "concluido") {
    return { ok: false, erro: "O recibo é emitido depois que o atendimento é concluído." };
  }

  const [config, cliente, existente] = await Promise.all([
    lerConfiguracoes(),
    registro.clienteId
      ? db.select().from(clientes).where(eq(clientes.id, registro.clienteId)).then((r) => r[0] ?? null)
      : Promise.resolve(null),
    buscarReciboDoAtendimento(agendamentoId),
  ]);

  const { itens, subtotal, plano } = itensDoAtendimento(registro);
  const total = centavos(entrada.valorCobrado ?? valorCobradoSugerido(registro));
  const ehMoto = tipoDaCategoria(registro.categoriaVeiculo) === "moto";

  let recibo = existente;
  if (!recibo) {
    try {
      [recibo] = await db
        .insert(recibos)
        .values({ agendamentoId, clienteId: registro.clienteId, dados: "{}" })
        .returning();
    } catch {
      // dois cliques ao mesmo tempo: o índice único do atendimento garante um recibo só
      recibo = await buscarReciboDoAtendimento(agendamentoId);
    }
  }
  if (!recibo) return { ok: false, erro: "Não foi possível gerar o recibo. Tente de novo." };

  const numero = recibo.numero ?? numeroDoRecibo(recibo.id);
  const dados: DadosRecibo = {
    numero,
    emitidoEm: new Date(recibo.emitidoEm).toISOString(),
    empresa: dadosEmpresa(config),
    cliente: { nome: registro.nome, telefone: registro.telefone, codigo: cliente?.codigo ?? null },
    veiculo: {
      modelo: registro.carro,
      placa: registro.placa,
      tipo: ehMoto ? "Moto" : "Carro",
      porte: ehMoto ? null : (portesVeiculo[registro.categoriaVeiculo as VehicleSize]?.nome ?? null),
    },
    codigoAtendimento: registro.codigo,
    dataAtendimento: registro.dia,
    horario: registro.horario,
    plano,
    itens,
    subtotal,
    desconto: centavos(Math.max(subtotal - total, 0)),
    acrescimo: centavos(Math.max(total - subtotal, 0)),
    total,
    formaPagamento: entrada.formaPagamento,
    observacao: entrada.observacao,
  };

  const [salvo] = await db
    .update(recibos)
    .set({
      numero,
      formaPagamento: entrada.formaPagamento,
      observacao: entrada.observacao,
      total: total.toFixed(2),
      dados: JSON.stringify(dados),
      updatedAt: new Date(),
    })
    .where(eq(recibos.id, recibo.id))
    .returning();
  return { ok: true, recibo: salvo };
}
