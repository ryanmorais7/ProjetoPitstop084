import Link from "next/link";
import { formatarDataCurta } from "@/lib/agenda";
import { Agendamento, descreverServicos, whatsappDoCliente } from "@/lib/adminDados";
import { portesVeiculo, VehicleSize } from "@/lib/data";
import {
  formatarMinutos,
  proximidadeAgendamento,
  rotuloStatus,
  statusOperacional,
  StatusOperacional,
} from "@/lib/pitpass";
import ClienteBadge from "./ClienteBadge";
import AcoesAgendamento from "./AcoesAgendamento";

export function StatusChip({ status }: { status: StatusOperacional }) {
  return <span className={`adm-chip adm-status-${status}`}>{rotuloStatus[status]}</span>;
}

/** "PRÓXIMO • 20 MIN" / "ATRASADO • 15 MIN" pra quem é de hoje e ainda não chegou. */
export function ProximidadeChip({
  registro,
  hoje,
  horaAgora,
}: {
  registro: Agendamento;
  hoje: string;
  horaAgora: string;
}) {
  const proximidade = proximidadeAgendamento(registro, hoje, horaAgora);
  if (!proximidade) return null;
  return proximidade.tipo === "proximo" ? (
    <span className="adm-chip border border-gold bg-white text-gold-ink">
      Próximo • {proximidade.minutos === 0 ? "agora" : formatarMinutos(proximidade.minutos)}
    </span>
  ) : (
    <span className="adm-chip adm-status-cancelado">Atrasado • {formatarMinutos(proximidade.minutos)}</span>
  );
}

/** Selo do agendamento: PitPass do plano usado ali, ou cliente PitStop 084 (avulso). */
export function nomePlanoDoAgendamento(registro: Agendamento, planoAtivoDoCliente?: string | null): string | null {
  if (registro.tipoAtendimento === "assinatura" && registro.plano) {
    return registro.plano.charAt(0).toUpperCase() + registro.plano.slice(1);
  }
  return planoAtivoDoCliente ?? null;
}

export default function AgendamentoCard({
  registro,
  planoAtivoDoCliente,
  hoje,
  horaAgora,
}: {
  registro: Agendamento;
  planoAtivoDoCliente?: string | null;
  hoje: string;
  horaAgora: string;
}) {
  const status = statusOperacional(registro, hoje);
  const porte = portesVeiculo[(registro.categoriaVeiculo as VehicleSize) ?? "P"] ?? portesVeiculo.P;

  return (
    <article
      className={`adm-card p-4 transition-colors hover:border-black/25 sm:p-5 ${status === "cancelado" ? "opacity-70" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-3">
          <p className="font-heading text-2xl font-bold leading-none tabular-nums">{registro.horario}</p>
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-adm-muted">
            {formatarDataCurta(registro.dia)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProximidadeChip registro={registro} hoje={hoje} horaAgora={horaAgora} />
          <StatusChip status={status} />
        </div>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {registro.clienteId ? (
              <Link
                href={`/admin/clientes/${registro.clienteId}`}
                className="font-heading text-lg font-bold leading-tight underline-offset-4 hover:underline"
              >
                {registro.nome}
              </Link>
            ) : (
              <p className="font-heading text-lg font-bold leading-tight">{registro.nome}</p>
            )}
            <ClienteBadge nomePlano={nomePlanoDoAgendamento(registro, planoAtivoDoCliente)} />
          </div>
          <p className="mt-1.5 text-sm text-adm-muted">
            {registro.carro}
            <span className="mx-1.5 text-black/25">•</span>
            <span className="font-mono text-[13px] font-medium text-adm-ink">{registro.placa ?? "sem placa"}</span>
            <span className="mx-1.5 text-black/25">•</span>
            {porte.nome}
          </p>
          <p className="mt-1.5 text-sm font-medium">{descreverServicos(registro)}</p>
          <p className="mt-2 font-mono text-[11px] tracking-wide text-adm-muted">{registro.codigo}</p>
        </div>

        <AcoesAgendamento
          id={registro.id}
          codigo={registro.codigo}
          status={status}
          whatsappUrl={whatsappDoCliente(registro)}
        />
      </div>
    </article>
  );
}
