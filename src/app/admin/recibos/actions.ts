"use server";

import { revalidatePath } from "next/cache";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import { formasPagamento } from "@/lib/recibo";
import { emitirRecibo } from "@/lib/recibos";

export interface ReciboState {
  erro?: string;
}

/** GERAR RECIBO: emite o comprovante de um atendimento concluído (ou atualiza o já emitido). */
export async function gerarRecibo(
  agendamentoId: number,
  _estado: ReciboState | undefined,
  formData: FormData
): Promise<ReciboState> {
  await exigirSessaoAdmin();

  const forma = String(formData.get("formaPagamento") ?? "");
  if (!(formasPagamento as readonly string[]).includes(forma)) return { erro: "Escolha a forma de pagamento." };

  const bruto = String(formData.get("valorCobrado") ?? "").trim();
  const texto = bruto.includes(",") ? bruto.replace(/\./g, "").replace(",", ".") : bruto;
  const valor = texto ? Number(texto) : null;
  if (valor != null && (!Number.isFinite(valor) || valor < 0)) return { erro: "Confira o valor cobrado." };

  const resultado = await emitirRecibo(agendamentoId, {
    formaPagamento: forma,
    observacao: String(formData.get("observacao") ?? "").trim() || null,
    valorCobrado: valor,
  });
  if (!resultado.ok) return { erro: resultado.erro };

  revalidatePath(`/admin/atendimentos/${agendamentoId}`);
  revalidatePath(`/admin/atendimentos/${agendamentoId}/recibo`);
  if (resultado.recibo.clienteId) revalidatePath(`/admin/clientes/${resultado.recibo.clienteId}`);
  return {};
}
