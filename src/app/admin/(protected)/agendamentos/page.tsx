import Link from "next/link";
import { and, asc, gte, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import { hojeIso, formatarDataCurta } from "@/lib/agenda";
import { formatarPreco } from "@/lib/format";
import { linkWhatsapp } from "@/lib/data";
import { atualizarStatusAgendamento } from "../../actions";

interface AdicionalJson {
  id: string;
  nome: string;
  preco: number | null;
}

function descreverServicos(registro: typeof agendamentos.$inferSelect): string {
  if (registro.tipoAtendimento === "assinatura") {
    const plano = registro.plano ? registro.plano.toUpperCase() : "—";
    return registro.servicoNome ? `${plano} · ${registro.servicoNome}` : plano;
  }

  const partes = [registro.servicoNome ?? "Ducha Pitstop"];
  if (registro.servicosAdicionais) {
    try {
      const adicionais = JSON.parse(registro.servicosAdicionais) as AdicionalJson[];
      partes.push(...adicionais.map((a) => a.nome));
    } catch {
      // servicosAdicionais mal formado, ignora
    }
  }
  return partes.join(" + ");
}

const estiloStatus: Record<string, string> = {
  confirmado: "text-gold",
  concluido: "text-text-secondary",
  cancelado: "text-red-400 line-through",
};

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  const { ver } = await searchParams;
  const mostrarTodos = ver === "todas";

  const registros = await db
    .select()
    .from(agendamentos)
    .where(
      mostrarTodos
        ? undefined
        : and(gte(agendamentos.dia, hojeIso()), ne(agendamentos.status, "cancelado"))
    )
    .orderBy(asc(agendamentos.dia), asc(agendamentos.horario));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Agendamentos</h1>
        <div className="flex gap-2 font-mono text-xs uppercase tracking-wide">
          <Link
            href="/admin/agendamentos"
            className={`rounded-sm px-3 py-1.5 ${!mostrarTodos ? "bg-gold text-asphalt" : "border border-white/15 text-text-secondary"}`}
          >
            Próximos
          </Link>
          <Link
            href="/admin/agendamentos?ver=todas"
            className={`rounded-sm px-3 py-1.5 ${mostrarTodos ? "bg-gold text-asphalt" : "border border-white/15 text-text-secondary"}`}
          >
            Todos
          </Link>
        </div>
      </div>

      {registros.length === 0 && (
        <p className="text-sm text-text-secondary">Nenhum agendamento por aqui.</p>
      )}

      <div className="space-y-3">
        {registros.map((r) => (
          <div
            key={r.id}
            className="rounded-sm border border-white/10 bg-panel p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm">
                <span className="text-gold">{formatarDataCurta(r.dia)}</span>
                <span className="text-text-secondary">·</span>
                <span>{r.horario}</span>
                <span className={`text-xs uppercase ${estiloStatus[r.status] ?? ""}`}>{r.status}</span>
              </div>
              <p className="mt-1 font-heading text-base font-bold">{r.nome}</p>
              <p className="text-sm text-text-secondary">
                {r.carro}
                {r.placa ? ` · ${r.placa}` : ""} · {r.categoriaVeiculo === "G" ? "SUV / Pick-up" : "Hatch / Sedan"}
              </p>
              <p className="mt-1 text-sm text-text-primary">{descreverServicos(r)}</p>
              {r.preco && (
                <p className="mt-1 font-mono text-sm text-gold">{formatarPreco(Number(r.preco))}</p>
              )}
              <a
                href={linkWhatsapp(`Olá ${r.nome}! Aqui é da Pitstop 084, sobre seu agendamento.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-gold hover:underline"
              >
                {r.telefone} · WhatsApp
              </a>
            </div>

            {r.status === "confirmado" && (
              <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
                <form action={atualizarStatusAgendamento.bind(null, r.id, "concluido")}>
                  <button
                    type="submit"
                    className="rounded-sm border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
                  >
                    Concluir
                  </button>
                </form>
                <form action={atualizarStatusAgendamento.bind(null, r.id, "cancelado")}>
                  <button
                    type="submit"
                    className="rounded-sm border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-secondary transition hover:border-red-400 hover:text-red-400"
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
