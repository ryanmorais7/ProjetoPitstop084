import Link from "next/link";
import { listarClientesResumo } from "@/lib/adminDados";
import ClienteLinha from "@/components/admin/ClienteLinha";

export default async function ClientesPage({ searchParams }: PageProps<"/admin/clientes">) {
  const params = await searchParams;
  const termo = typeof params.q === "string" ? params.q.trim() : "";
  const clientes = await listarClientesResumo(termo);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <form method="GET" action="/admin/clientes" role="search" className="flex min-w-0 flex-1 gap-2">
          <label htmlFor="busca-clientes" className="sr-only">
            Buscar clientes
          </label>
          <input
            id="busca-clientes"
            type="search"
            name="q"
            defaultValue={termo}
            placeholder="Buscar por nome, código, WhatsApp ou placa"
            className="campo"
          />
          <button type="submit" className="adm-btn shrink-0">
            Buscar
          </button>
        </form>
        <Link href="/admin/clientes/novo" className="adm-btn adm-btn-primario">
          + Novo cliente
        </Link>
      </div>

      <p className="adm-rotulo mt-6">
        {termo
          ? `${clientes.length} resultado${clientes.length === 1 ? "" : "s"} para “${termo}”`
          : `Clientes mais recentes · ${clientes.length}`}
      </p>

      {clientes.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-black/15 px-5 py-12 text-center">
          <p className="font-heading text-lg font-bold">Nenhum cliente encontrado.</p>
          <p className="mt-1 text-sm text-adm-muted">
            {termo ? "Confira o termo ou cadastre um novo cliente." : "Os clientes aparecem aqui depois do primeiro agendamento."}
          </p>
          <Link href="/admin/clientes/novo" className="adm-btn mt-5">
            Cadastrar cliente
          </Link>
        </div>
      ) : (
        <div className="adm-card mt-3 overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 border-b border-adm-line bg-black/[0.02] px-5 py-2.5 md:grid">
            <span className="adm-rotulo">Nome e tipo</span>
            <span className="adm-rotulo">Veículo e placa</span>
            <span className="adm-rotulo">Última visita</span>
            <span className="adm-rotulo">Próximo atendimento</span>
          </div>
          <div className="divide-y divide-adm-line">
            {clientes.map((c) => (
              <ClienteLinha key={c.id} cliente={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
