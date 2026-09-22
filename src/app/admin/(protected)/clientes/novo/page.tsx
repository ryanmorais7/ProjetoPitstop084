import Link from "next/link";
import { buscarClientes } from "@/lib/clientes";
import { criarClienteManual } from "../../../clientes/actions";

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termo = q?.trim() ?? "";
  const resultados = termo ? await buscarClientes(termo) : [];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Novo cliente</h1>
      <p className="mt-1 text-sm text-text-secondary">Busque antes de cadastrar, pra evitar duplicar um cliente.</p>

      <form method="GET" action="/admin/clientes/novo" className="mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={termo}
          placeholder="Nome, telefone ou placa..."
          autoFocus
          className="campo"
        />
        <button
          type="submit"
          className="shrink-0 rounded-sm border border-white/15 px-5 py-2.5 font-heading text-sm font-semibold text-text-primary transition hover:border-gold hover:text-gold"
        >
          Buscar
        </button>
      </form>

      {resultados.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="font-mono text-xs uppercase tracking-wide text-text-secondary">
            Já existe alguém parecido — confira antes de continuar:
          </p>
          {resultados.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/admin/clientes/${cliente.id}`}
              className="block rounded-sm border border-white/10 bg-panel p-4 transition hover:border-gold"
            >
              <p className="font-heading text-base font-bold">{cliente.nome}</p>
              <p className="font-mono text-xs text-text-secondary">
                {cliente.codigo} · {cliente.telefone}
              </p>
            </Link>
          ))}
        </div>
      )}

      {(termo === "" || resultados.length === 0) && (
        <form action={criarClienteManual} className="mt-8 max-w-lg space-y-4 rounded-sm border border-white/10 bg-panel p-6">
          <p className="font-heading text-sm font-bold uppercase tracking-wide text-gold">
            {termo ? "Não encontrou? Cadastrar novo cliente" : "Cadastrar novo cliente"}
          </p>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Nome *</span>
            <input required name="nome" className="campo" placeholder="Nome do cliente" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">WhatsApp *</span>
            <input required name="telefone" className="campo" placeholder="(84) 9 0000-0000" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-text-secondary">Veículo *</span>
              <input required name="modelo" className="campo" placeholder="Modelo do carro" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-text-secondary">Placa (opcional)</span>
              <input name="placa" className="campo" placeholder="ABC1D23" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Porte</span>
            <select name="porte" className="campo" defaultValue="P">
              <option value="P">Hatch / Sedan (P)</option>
              <option value="G">SUV / Pick-up (G)</option>
            </select>
          </label>
          <button
            type="submit"
            className="w-full rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
          >
            Cadastrar cliente
          </button>
        </form>
      )}
    </div>
  );
}
