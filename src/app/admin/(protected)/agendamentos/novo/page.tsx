import Link from "next/link";
import { listarClientesResumo } from "@/lib/adminDados";
import ClienteLinha from "@/components/admin/ClienteLinha";
import { lerContextoAgendar, queryContextoAgendar } from "@/lib/contextoAgendar";
import { formatarDataCurta } from "@/lib/agenda";

/**
 * Passo 1 do agendamento manual: achar o cliente (ou cadastrar). O resto do fluxo
 * (veículo, serviço, adicionais, data, horário, Leva & Busca, observações) acontece em
 * /admin/clientes/[id]/agendar, com a mesma disponibilidade da landing.
 */
export default async function NovoAgendamentoPage({ searchParams }: PageProps<"/admin/agendamentos/novo">) {
  const params = await searchParams;
  const termo = typeof params.q === "string" ? params.q.trim() : "";
  const clientes = termo ? await listarClientesResumo(termo) : [];
  const contexto = lerContextoAgendar(params);
  const extra = queryContextoAgendar(contexto);

  return (
    <div className="mx-auto max-w-3xl">
      {contexto.encaixe ? (
        <p className="rounded-lg bg-[#fdf1cf] px-4 py-3 text-sm font-medium text-[#5f4300]">
          Encaixe: o carro já está na loja, sem reserva. Ache o cliente, escolha veículo e serviço e ele entra direto em
          CHEGOU.
        </p>
      ) : (
        <ol className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-adm-muted">
          <li className="font-semibold text-adm-ink">1. Cliente</li>
          <li>2. Veículo e serviço</li>
          <li>3. Data e horário</li>
          <li>4. Confirmar</li>
        </ol>
      )}
      {!contexto.encaixe && contexto.dia && contexto.hora && (
        <p className="mt-3 text-sm font-medium">
          Horário escolhido na agenda: {formatarDataCurta(contexto.dia)} · {contexto.hora}
        </p>
      )}

      <div className="adm-card mt-4 p-5 sm:p-6">
        <h2 className="font-heading text-xl font-bold">Busque antes de cadastrar</h2>
        <p className="mt-1 text-sm text-adm-muted">
          Procure por nome, WhatsApp, placa ou código. Assim o cliente não fica duplicado.
        </p>
        <form method="GET" action="/admin/agendamentos/novo" role="search" className="mt-4 flex gap-2">
          {contexto.encaixe && <input type="hidden" name="encaixe" value="1" />}
          {!contexto.encaixe && contexto.dia && <input type="hidden" name="dia" value={contexto.dia} />}
          {!contexto.encaixe && contexto.hora && <input type="hidden" name="hora" value={contexto.hora} />}
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
              <ClienteLinha key={c.id} cliente={c} href={`/admin/clientes/${c.id}/agendar${extra ? `?${extra}` : ""}`} />
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
            href={`/admin/clientes/novo?destino=agendar&q=${encodeURIComponent(termo)}${extra ? `&${extra}` : ""}`}
            className="adm-btn mt-4"
          >
            Cadastrar novo cliente
          </Link>
        </div>
      )}
    </div>
  );
}
