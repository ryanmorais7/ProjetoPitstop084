"use client";

import { useActionState } from "react";
import { formasPagamento } from "@/lib/recibo";
import { gerarRecibo, ReciboState } from "@/app/admin/recibos/actions";

const estadoInicial: ReciboState = {};

/** Dados que só a recepção sabe na hora de emitir: como foi pago, quanto foi cobrado e observação. */
export default function FormRecibo({
  agendamentoId,
  formaPagamento,
  valorCobrado,
  observacao,
  jaEmitido,
}: {
  agendamentoId: number;
  formaPagamento: string;
  /** Valor sugerido (o valor final gravado no atendimento). */
  valorCobrado: number;
  observacao: string;
  jaEmitido: boolean;
}) {
  const [estado, formAction, pendente] = useActionState(gerarRecibo.bind(null, agendamentoId), estadoInicial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="adm-rotulo mb-1.5 block">Forma de pagamento *</span>
        <select name="formaPagamento" defaultValue={formaPagamento} required className="campo">
          <option value="" disabled>
            Escolha
          </option>
          {formasPagamento.map((forma) => (
            <option key={forma} value={forma}>
              {forma}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="adm-rotulo mb-1.5 block">Valor cobrado (R$)</span>
        <input
          name="valorCobrado"
          inputMode="decimal"
          defaultValue={valorCobrado.toFixed(2).replace(".", ",")}
          className="campo tabular-nums"
        />
        <span className="mt-1 block text-xs text-adm-muted">
          Diferente da soma dos serviços, sai no recibo como desconto ou acréscimo.
        </span>
      </label>
      <label className="block sm:col-span-2">
        <span className="adm-rotulo mb-1.5 block">Observação (opcional)</span>
        <textarea name="observacao" rows={2} defaultValue={observacao} className="campo" />
      </label>

      {estado?.erro && (
        <p role="alert" className="rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-medium text-[#b42318] sm:col-span-2">
          {estado.erro}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pendente} className={`adm-btn ${jaEmitido ? "" : "adm-btn-primario"}`}>
          {pendente ? "Salvando..." : jaEmitido ? "Atualizar recibo" : "Gerar recibo"}
        </button>
      </div>
    </form>
  );
}
