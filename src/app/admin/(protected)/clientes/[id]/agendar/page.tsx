import Link from "next/link";
import { notFound } from "next/navigation";
import { and, gte, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, horariosBloqueados } from "@/db/schema";
import { buscarClienteComDetalhes } from "@/lib/clientes";
import { hojeIso, proximasDatasUteis, paraIso } from "@/lib/agenda";
import { planos, PlanoId } from "@/lib/data";
import ClienteBadge from "@/components/admin/ClienteBadge";
import NovoAtendimentoForm from "./NovoAtendimentoForm";

export default async function AgendarPage({ params }: PageProps<"/admin/clientes/[id]/agendar">) {
  const { id } = await params;
  const clienteId = Number(id);
  const dados = Number.isFinite(clienteId) ? await buscarClienteComDetalhes(clienteId) : null;
  if (!dados) notFound();

  // mesma disponibilidade da landing: ocupados + bloqueados, de hoje em diante
  const [ocupados, bloqueados] = await Promise.all([
    db
      .select({ dia: agendamentos.dia, horario: agendamentos.horario })
      .from(agendamentos)
      .where(and(gte(agendamentos.dia, hojeIso()), ne(agendamentos.status, "cancelado"))),
    db
      .select({ dia: horariosBloqueados.dia, horario: horariosBloqueados.horario })
      .from(horariosBloqueados)
      .where(gte(horariosBloqueados.dia, hojeIso())),
  ]);

  const chavesOcupadas = [...ocupados, ...bloqueados].map((o) => `${o.dia}-${o.horario}`);
  const datasIso = proximasDatasUteis(6).map((d) => paraIso(d));
  const nomePlanoAtivo = dados.assinaturaAtiva ? (planos[dados.assinaturaAtiva.plano as PlanoId]?.nome ?? null) : null;
  // veículo principal primeiro
  const veiculos = [...dados.veiculos].sort((a, b) => Number(b.principal) - Number(a.principal));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="adm-card flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <div className="min-w-0">
          <p className="adm-rotulo">Cliente</p>
          <p className="mt-0.5 truncate font-heading text-xl font-bold">{dados.cliente.nome}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ClienteBadge nomePlano={nomePlanoAtivo} />
            <span className="font-mono text-[11px] text-adm-muted">{dados.cliente.codigo}</span>
          </div>
        </div>
        <Link href="/admin/agendamentos/novo" className="adm-btn">
          Trocar cliente
        </Link>
      </div>

      {dados.cliente.preferencias && (
        <p className="mt-3 rounded-lg bg-[#fdf1cf] px-4 py-3 text-sm text-[#7a5600]">
          <span className="font-semibold">Preferências do cliente:</span> {dados.cliente.preferencias}
        </p>
      )}

      <NovoAtendimentoForm
        clienteId={dados.cliente.id}
        nomeCliente={dados.cliente.nome}
        telefoneCliente={dados.cliente.telefone}
        veiculos={veiculos}
        assinaturaAtiva={dados.assinaturaAtiva}
        nomePlanoAtivo={nomePlanoAtivo}
        datasIso={datasIso}
        chavesOcupadas={chavesOcupadas}
      />
    </div>
  );
}
