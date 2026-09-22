import { notFound } from "next/navigation";
import { and, gte, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, horariosBloqueados } from "@/db/schema";
import { buscarClienteComDetalhes } from "@/lib/clientes";
import { hojeIso, proximasDatasUteis, paraIso } from "@/lib/agenda";
import { planos, PlanoId } from "@/lib/data";
import NovoAtendimentoForm from "./NovoAtendimentoForm";

export default async function AgendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clienteId = Number(id);
  const dados = Number.isFinite(clienteId) ? await buscarClienteComDetalhes(clienteId) : null;
  if (!dados) notFound();

  const [ocupados, bloqueados] = await Promise.all([
    db
      .select({ dia: agendamentos.dia, horario: agendamentos.horario })
      .from(agendamentos)
      .where(and(gte(agendamentos.dia, hojeIso()), ne(agendamentos.status, "cancelado"))),
    db.select({ dia: horariosBloqueados.dia, horario: horariosBloqueados.horario }).from(horariosBloqueados),
  ]);

  const chavesOcupadas = [...ocupados, ...bloqueados].map((o) => `${o.dia}-${o.horario}`);
  const datasIso = proximasDatasUteis(6).map((d) => paraIso(d));

  const nomePlanoAtivo = dados.assinaturaAtiva ? (planos[dados.assinaturaAtiva.plano as PlanoId]?.nome ?? null) : null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Novo atendimento · {dados.cliente.nome}</h1>
      <NovoAtendimentoForm
        clienteId={dados.cliente.id}
        nomeCliente={dados.cliente.nome}
        telefoneCliente={dados.cliente.telefone}
        veiculos={dados.veiculos}
        assinaturaAtiva={dados.assinaturaAtiva}
        nomePlanoAtivo={nomePlanoAtivo}
        datasIso={datasIso}
        chavesOcupadas={chavesOcupadas}
      />
    </div>
  );
}
