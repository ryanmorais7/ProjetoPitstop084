import Link from "next/link";
import { buscarClientes } from "@/lib/clientes";
import { assinaturas } from "@/db/schema";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { planos, PlanoId } from "@/lib/data";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";
  const resultados = termo ? await buscarClientes(termo) : [];

  const assinaturasAtivas =
    resultados.length > 0
      ? await db.select().from(assinaturas).where(eq(assinaturas.status, "ativo"))
      : [];
  const assinaturaPorCliente = new Map(assinaturasAtivas.map((a) => [a.clienteId, a]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Clientes</h1>
        <Link
          href="/admin/clientes/novo"
          className="rounded-sm bg-gold px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wide text-asphalt transition hover:brightness-110"
        >
          + Novo cliente
        </Link>
      </div>

      <form method="GET" action="/admin/clientes" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={termo}
          placeholder="Buscar por nome, código, WhatsApp ou placa..."
          autoFocus
          className="campo"
        />
        <button
          type="submit"
          className="shrink-0 rounded-sm bg-gold px-5 py-2.5 font-heading text-sm font-semibold text-asphalt transition hover:brightness-110"
        >
          Buscar
        </button>
      </form>

      {termo && resultados.length === 0 && (
        <div className="mt-6 rounded-sm border border-white/10 bg-panel p-6 text-center">
          <p className="text-sm text-text-secondary">Nenhum cliente encontrado para &quot;{termo}&quot;.</p>
          <Link
            href="/admin/clientes/novo"
            className="mt-3 inline-block font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline"
          >
            Cadastrar novo cliente
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {resultados.map((cliente) => {
          const assinatura = assinaturaPorCliente.get(cliente.id);
          const nomePlano = assinatura ? planos[assinatura.plano as PlanoId]?.nome : null;
          return (
            <Link
              key={cliente.id}
              href={`/admin/clientes/${cliente.id}`}
              className="flex items-center justify-between gap-4 rounded-sm border border-white/10 bg-panel p-4 transition hover:border-gold"
            >
              <div>
                <p className="font-heading text-base font-bold">{cliente.nome}</p>
                <p className="font-mono text-xs text-text-secondary">
                  {cliente.codigo} · {cliente.telefone}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                  nomePlano ? "bg-gold text-asphalt" : "bg-white/10 text-text-secondary"
                }`}
              >
                {nomePlano ? `PitPass · ${nomePlano}` : "Pitstop 084"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
