import { listarClientesResumo } from "@/lib/adminDados";
import { origensCliente } from "@/lib/data";
import ClienteLinha from "@/components/admin/ClienteLinha";
import { lerContextoAgendar, queryContextoAgendar } from "@/lib/contextoAgendar";
import { criarClienteManual } from "../../../clientes/actions";

export default async function NovoClientePage({ searchParams }: PageProps<"/admin/clientes/novo">) {
  const params = await searchParams;
  const termo = typeof params.q === "string" ? params.q.trim() : "";
  const paraAgendar = params.destino === "agendar";
  const parecidos = termo ? await listarClientesResumo(termo) : [];
  const contexto = lerContextoAgendar(params);
  const extra = queryContextoAgendar(contexto);
  const camposContexto = paraAgendar && (
    <>
      <input type="hidden" name="destino" value="agendar" />
      {contexto.encaixe && <input type="hidden" name="encaixe" value="1" />}
      {!contexto.encaixe && contexto.dia && <input type="hidden" name="dia" value={contexto.dia} />}
      {!contexto.encaixe && contexto.hora && <input type="hidden" name="hora" value={contexto.hora} />}
    </>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="adm-card p-5 sm:p-6">
        <h2 className="font-heading text-xl font-bold">Busque antes de cadastrar</h2>
        <p className="mt-1 text-sm text-adm-muted">Nome, WhatsApp, placa ou código. Evita cliente duplicado.</p>
        <form method="GET" action="/admin/clientes/novo" role="search" className="mt-4 flex gap-2">
          {camposContexto}
          <label htmlFor="busca-duplicado" className="sr-only">
            Buscar cliente existente
          </label>
          <input
            id="busca-duplicado"
            type="search"
            name="q"
            defaultValue={termo}
            placeholder="Nome, WhatsApp, placa ou C084"
            className="campo"
          />
          <button type="submit" className="adm-btn shrink-0">
            Buscar
          </button>
        </form>
      </div>

      {parecidos.length > 0 && (
        <section className="mt-6">
          <h2 className="adm-rotulo mb-3">Já existe alguém parecido. Confira antes de continuar</h2>
          <div className="adm-card divide-y divide-adm-line overflow-hidden">
            {parecidos.map((c) => (
              <ClienteLinha key={c.id} cliente={c} href={paraAgendar ? `/admin/clientes/${c.id}/agendar${extra ? `?${extra}` : ""}` : undefined} />
            ))}
          </div>
        </section>
      )}

      <form action={criarClienteManual} className="adm-card mt-6 space-y-4 p-5 sm:p-6">
        <h2 className="font-heading text-xl font-bold">
          {parecidos.length > 0 ? "Não é nenhum deles? Cadastrar novo cliente" : "Cadastrar novo cliente"}
        </h2>
        {camposContexto}
        <label className="block">
          <span className="adm-rotulo mb-1.5 block">Nome *</span>
          <input required name="nome" className="campo" placeholder="Nome do cliente" />
        </label>
        <label className="block">
          <span className="adm-rotulo mb-1.5 block">WhatsApp *</span>
          <input required name="telefone" inputMode="tel" className="campo" placeholder="(84) 9 0000-0000" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Veículo *</span>
            <input required name="modelo" className="campo" placeholder="Modelo do carro" />
          </label>
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Placa</span>
            <input name="placa" autoCapitalize="characters" className="campo font-mono uppercase" placeholder="ABC1D23" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Porte</span>
            <select name="porte" className="campo" defaultValue="P">
              <option value="P">Hatch / Sedan (P)</option>
              <option value="G">SUV / Pick-up (G)</option>
            </select>
          </label>
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Origem</span>
            <select name="origem" className="campo" defaultValue="">
              <option value="">Não informada</option>
              {origensCliente.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="adm-btn adm-btn-primario w-full">
          {paraAgendar ? (contexto.encaixe ? "Cadastrar e seguir com o encaixe" : "Cadastrar e agendar") : "Cadastrar cliente"}
        </button>
      </form>
    </div>
  );
}
