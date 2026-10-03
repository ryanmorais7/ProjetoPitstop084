import Link from "next/link";
import { formatarDataCurta } from "@/lib/agenda";
import type { ClienteResumo } from "@/lib/adminDados";
import ClienteBadge from "./ClienteBadge";

/**
 * Uma linha da lista de clientes: colunas no desktop, cartão empilhado no celular
 * (nada de tabela espremida). `href` troca o destino — o fluxo de novo agendamento usa isso.
 */
export default function ClienteLinha({ cliente, href }: { cliente: ClienteResumo; href?: string }) {
  return (
    <Link
      href={href ?? `/admin/clientes/${cliente.id}`}
      className="grid gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-black/[0.025] sm:px-5 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)] md:items-center"
    >
      <div className="min-w-0">
        <p className="truncate font-heading text-base font-bold leading-tight">{cliente.nome}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ClienteBadge nomePlano={cliente.nomePlano} />
          <span className="font-mono text-[11px] text-adm-muted">{cliente.codigo}</span>
        </div>
      </div>
      <div className="min-w-0 text-sm">
        <p className="truncate">{cliente.veiculo ?? <span className="text-adm-muted">Sem veículo</span>}</p>
        <p className="font-mono text-[13px] text-adm-muted">{cliente.placa ?? "sem placa"}</p>
      </div>
      <div className="text-sm">
        <p className="adm-rotulo md:hidden">Última visita</p>
        <p>{cliente.ultimaVisita ? formatarDataCurta(cliente.ultimaVisita) : <span className="text-adm-muted">Nenhuma</span>}</p>
      </div>
      <div className="text-sm">
        <p className="adm-rotulo md:hidden">Próximo atendimento</p>
        <p>
          {cliente.proximo ? (
            <span className="font-medium">
              {formatarDataCurta(cliente.proximo.dia)} · {cliente.proximo.horario}
            </span>
          ) : (
            <span className="text-adm-muted">Sem agendamento</span>
          )}
        </p>
      </div>
    </Link>
  );
}
