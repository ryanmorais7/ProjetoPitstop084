import Link from "next/link";
import { listarClientesResumo } from "@/lib/adminDados";
import ClienteLinha from "@/components/admin/ClienteLinha";

/**
 * Passo 1 do agendamento manual: achar o cliente (ou cadastrar). O resto do fluxo
 * (veículo, serviço, adicionais, data, horário, Leva & Busca, observações) acontece em
 * /admin/clientes/[id]/agendar, com a mesma disponibilidade da landing.
 */
export default async function NovoAgendamentoPage({ searchParams }: PageProps<"/admin/agendamentos/novo">) {
  const params = await searchParams;
  const termo = typeof params.q === "string" ? params.q.trim() : "";
  const clientes = termo ? await listarClientesResumo(termo) : [];

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-adm-muted">
        <li className="font-semibold text-adm-ink">1. Cliente</li>
        <li>2. Veículo e serviço</li>
        <li>3. Data e horário</li>
        <li>4. Confirmar</li>
      </ol>

      <div className="adm-card mt-4 p-5 sm:p-6">
        <h2 className="font-heading text-xl font-bold">Busque antes de cadastrar</h2>
        <p className="mt-1 text-sm text-adm-muted">
          Procure por nome, WhatsApp, placa ou código. Assim o cliente não fica duplicado.
        </p>
        <form method="GET" action="/admin/agendamentos/novo" role="search" className="mt-4 flex gap-2">
          <label htmlFor="busca-cliente" className="sr-only">
            Buscar cliente
          </label>
          <input
            id="busca-cliente"
            type="search"
            name="q"
            defaultValue={termo}
            autoFocus
            placeholder="Nome, WhatsApp, placa ou C084"
            className="campo"
          />
          <button type="submit" className="adm-btn adm-btn-primario shrink-0">
            Buscar
          </button>
        </form>
      </div>

      {termo && clientes.length > 0 && (
        <section className="mt-6">
          <h2 className="adm-rotulo mb-3">Selecione o cliente · {clientes.length}</h2>
          <div className="adm-card divide-y divide-adm-line overflow-hidden">
            {clientes.map((c) => (
              <ClienteLinha key={c.id} cliente={c} href={`/admin/clientes/${c.id}/agendar`} />
            ))}
          </div>
        </section>
      )}

      {termo && (
        <div className="mt-6 rounded-xl border border-dashed border-black/15 px-5 py-8 text-center">
          <p className="font-heading text-lg font-bold">
            {clientes.length === 0 ? `Nenhum cliente encontrado para “${termo}”.` : "Não é nenhum desses?"}
          </p>
          <Link
            href={`/admin/clientes/novo?destino=agendar&q=${encodeURIComponent(termo)}`}
            className="adm-btn mt-4"
          >
            Cadastrar novo cliente
          </Link>
        </div>
      )}
    </div>
  );
}
