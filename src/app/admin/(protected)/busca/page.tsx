import Link from "next/link";
import { hojeIso, horaAtualFortaleza } from "@/lib/agenda";
import { buscaGlobal, planosAtivosPorCliente } from "@/lib/adminDados";
import AgendamentoCard from "@/components/admin/AgendamentoCard";
import ClienteLinha from "@/components/admin/ClienteLinha";

export default async function BuscaPage({ searchParams }: PageProps<"/admin/busca">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const { clientes, agendamentos } = await buscaGlobal(q);
  const planosAtivos = await planosAtivosPorCliente(agendamentos.map((a) => a.clienteId));
  const hoje = hojeIso();
  const horaAgora = horaAtualFortaleza();
  const nada = q.length >= 2 && clientes.length === 0 && agendamentos.length === 0;

  return (
    <div>
      <form method="GET" action="/admin/busca" role="search" className="flex gap-2">
        <label htmlFor="busca-pagina" className="sr-only">
          Buscar no admin
        </label>
        <input
          id="busca-pagina"
          type="search"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Nome, WhatsApp, placa, P084 ou C084"
          className="campo"
        />
        <button type="submit" className="adm-btn adm-btn-primario shrink-0">
          Buscar
        </button>
      </form>

      {q.length < 2 && (
        <p className="mt-6 rounded-xl border border-dashed border-black/15 px-5 py-10 text-center text-sm text-adm-muted">
          Digite pelo menos 2 caracteres para buscar clientes e agendamentos.
        </p>
      )}

      {nada && (
        <div className="mt-6 rounded-xl border border-dashed border-black/15 px-5 py-10 text-center">
          <p className="font-heading text-lg font-bold">Nada encontrado para “{q}”.</p>
          <p className="mt-1 text-sm text-adm-muted">Tente só o primeiro nome, a placa sem hífen ou o final do WhatsApp.</p>
          <Link href="/admin/clientes/novo" className="adm-btn mt-5">
            Cadastrar cliente
          </Link>
        </div>
      )}

      {clientes.length > 0 && (
        <section className="mt-8">
          <h2 className="adm-rotulo mb-3">Clientes · {clientes.length}</h2>
          <div className="adm-card divide-y divide-adm-line overflow-hidden">
            {clientes.map((c) => (
              <ClienteLinha key={c.id} cliente={c} />
            ))}
          </div>
        </section>
      )}

      {agendamentos.length > 0 && (
        <section className="mt-8">
          <h2 className="adm-rotulo mb-3">Agendamentos · {agendamentos.length}</h2>
          <div className="space-y-3">
            {agendamentos.map((r) => (
              <AgendamentoCard
                key={r.id}
                registro={r}
                planoAtivoDoCliente={r.clienteId ? planosAtivos.get(r.clienteId) : null}
                hoje={hoje}
                horaAgora={horaAgora}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
