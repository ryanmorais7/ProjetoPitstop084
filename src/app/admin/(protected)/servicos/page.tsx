import {
  duchaPitstop,
  servicosAvulsos,
  listaPlanos,
  lavagensPlano,
  servicosPorPlano,
  regrasBeneficios,
  formatarRegraBeneficio,
  categoriasCuidado,
  Servico,
} from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import ClienteBadge from "@/components/admin/ClienteBadge";

/**
 * Catálogo em modo leitura. A fonte continua única (src/lib/data.ts): é o mesmo conteúdo da
 * landing, do configurador e do agendamento. Tudo que está no catálogo está ativo.
 */
export default function ServicosPage() {
  return (
    <div className="space-y-8">
      <p className="rounded-lg bg-black/[0.04] px-4 py-3 text-sm text-adm-muted">
        Catálogo atual, o mesmo que o cliente vê no site. Preços e textos ainda são alterados no código, em um único
        arquivo. A edição por aqui é o próximo passo.
      </p>

      <section aria-labelledby="ducha">
        <h2 id="ducha" className="adm-rotulo mb-3">
          Serviço base
        </h2>
        <Tabela servicos={[duchaPitstop]} />
      </section>

      <section aria-labelledby="adicionais">
        <h2 id="adicionais" className="adm-rotulo mb-3">
          Adicionais · {servicosAvulsos.length}
        </h2>
        <Tabela servicos={servicosAvulsos} />
      </section>

      <section aria-labelledby="planos">
        <h2 id="planos" className="adm-rotulo mb-3">
          Planos PitPass
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {listaPlanos.map((plano) => (
            <div key={plano.id} className="adm-card p-5">
              <div className="flex items-center justify-between gap-2">
                <ClienteBadge nomePlano={plano.nome} />
                <span className="adm-chip adm-status-concluido">Ativo</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="adm-rotulo">Porte P</dt>
                  <dd className="mt-1 font-heading text-xl font-bold tabular-nums">{formatarPreco(plano.precos.P)}</dd>
                </div>
                <div>
                  <dt className="adm-rotulo">Porte G</dt>
                  <dd className="mt-1 font-heading text-xl font-bold tabular-nums">{formatarPreco(plano.precos.G)}</dd>
                </div>
              </dl>
              <p className="adm-rotulo mb-1 mt-5">Lavagens do plano</p>
              <ul className="divide-y divide-adm-line">
                {servicosPorPlano[plano.id].map((nome) => (
                  <li key={nome} className="py-2.5">
                    <p className="flex items-baseline justify-between gap-3 text-sm font-semibold">
                      {nome}
                      <span className="font-mono text-[11px] font-normal text-adm-muted">
                        {formatarRegraBeneficio(regrasBeneficios[plano.id][nome])}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-adm-muted">
                      {lavagensPlano[nome]?.includes?.length ?? 0} itens na ficha
                      {lavagensPlano[nome]?.incluiTudoDe ? ` + tudo da ${lavagensPlano[nome].incluiTudoDe}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tabela({ servicos }: { servicos: Servico[] }) {
  return (
    <div className="adm-card overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] gap-x-4 border-b border-adm-line bg-black/[0.02] px-5 py-2.5 md:grid">
        <span className="adm-rotulo">Serviço</span>
        <span className="adm-rotulo text-right">Porte P</span>
        <span className="adm-rotulo text-right">Porte G</span>
        <span className="adm-rotulo text-right">Status</span>
      </div>
      <ul className="divide-y divide-adm-line">
        {servicos.map((s) => (
          <li
            key={s.id}
            className="grid gap-x-4 gap-y-2 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] md:items-center"
          >
            <div className="min-w-0">
              <p className="font-heading text-base font-bold leading-tight">{s.nome}</p>
              <p className="mt-0.5 text-sm text-adm-muted">
                {s.categoria ? `${categoriasCuidado[s.categoria]} · ` : ""}
                {s.shortDescription}
              </p>
            </div>
            {s.precos ? (
              <>
                <p className="text-sm font-semibold tabular-nums md:text-right">
                  <span className="adm-rotulo mr-2 md:hidden">Porte P</span>
                  {formatarPreco(s.precos.P)}
                </p>
                <p className="text-sm font-semibold tabular-nums md:text-right">
                  <span className="adm-rotulo mr-2 md:hidden">Porte G</span>
                  {formatarPreco(s.precos.G)}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-adm-muted md:col-span-2 md:text-right">Mediante avaliação</p>
            )}
            <p className="md:text-right">
              <span className="adm-chip adm-status-concluido">Ativo</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
