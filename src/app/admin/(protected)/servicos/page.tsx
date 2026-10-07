import type { ReactNode } from "react";
import { categoriasCuidado, formatarRegraBeneficio, Plano, regrasBeneficios, servicosPorPlano } from "@/lib/data";
import { Catalogo, formatarDuracao, ItemCatalogo, rotuloTipoItem } from "@/lib/catalogo";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import { formatarPreco } from "@/lib/format";
import ClienteBadge from "@/components/admin/ClienteBadge";
import FormComAviso, { BotaoEnviar } from "@/components/admin/FormComAviso";
import { salvarPlano, salvarServico } from "../../servicos/actions";

/**
 * Catálogo central: o mesmo que o site, o agendamento, o Kanban e o recibo usam. Os textos das
 * fichas ficam no código (src/lib/data.ts); o que a operação ajusta no dia a dia (preço, duração,
 * ativo, equipe) é editado aqui e vale na hora, sem deploy.
 */
export default async function ServicosPage() {
  const catalogo = await carregarCatalogo();
  const doTipo = (tipo: ItemCatalogo["tipo"], moto: boolean) =>
    catalogo.itens.filter((i) => i.tipo === tipo && i.tiposVeiculo.includes("moto") === moto);
  const beneficios = catalogo.itens.filter((i) => i.beneficioDePlano);
  const planos = Object.values(catalogo.planos);

  const semDuracao = catalogo.itens.filter((i) => i.ativo && !i.duracaoMin).length;

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-black/[0.04] px-4 py-3 text-sm text-adm-muted">
        <p>
          Preço, duração e disponibilidade de cada serviço. O que você salvar aqui passa a valer no site, no
          agendamento e na agenda na mesma hora.
        </p>
        {semDuracao > 0 && (
          <p className="mt-1.5 font-medium text-adm-ink">
            {semDuracao} serviço{semDuracao === 1 ? "" : "s"} ainda sem duração definida: enquanto isso, o atendimento
            ocupa um horário inteiro da agenda e o cliente não vê a estimativa de tempo.
          </p>
        )}
      </div>

      <Secao titulo="Serviços base" itens={[...doTipo("ducha", false), ...doTipo("ducha", true)]} />
      <Secao titulo="Adicionais · carro" itens={doTipo("adicional", false)} />
      <Secao
        titulo="Adicionais · moto"
        itens={doTipo("adicional", true)}
        vazio="Nenhum adicional de moto cadastrado ainda. Quando a operação definir (proteção de carenagem, tratamento de plásticos...), eles entram no catálogo e aparecem aqui."
      />
      <Secao titulo="Lavagens e manutenções dos planos" itens={beneficios} />

      <section aria-labelledby="planos">
        <h2 id="planos" className="adm-rotulo mb-3">
          Planos PitPass
        </h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {planos.map((plano) => (
            <CartaoPlano key={plano.id} plano={plano} catalogo={catalogo} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Secao({ titulo, itens, vazio }: { titulo: string; itens: ItemCatalogo[]; vazio?: string }) {
  return (
    <section>
      <h2 className="adm-rotulo mb-3">
        {titulo} · {itens.length}
      </h2>
      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 px-5 py-6 text-sm text-adm-muted">{vazio}</p>
      ) : (
        <ul className="adm-card divide-y divide-adm-line overflow-hidden">
          {itens.map((item) => (
            <LinhaServico key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LinhaServico({ item }: { item: ItemCatalogo }) {
  const carro = item.tiposVeiculo.includes("carro");
  const moto = item.tiposVeiculo.includes("moto");
  const temPreco = !item.beneficioDePlano;

  let valor: ReactNode;
  if (!temPreco) valor = "Incluso no plano";
  else if (item.requiresEvaluation) valor = "Mediante avaliação";
  else {
    const partes = [
      carro && item.precos ? `P ${formatarPreco(item.precos.P)} · G ${formatarPreco(item.precos.G)}` : null,
      moto && item.precoMoto != null ? `Moto ${formatarPreco(item.precoMoto)}` : null,
    ].filter(Boolean);
    valor = partes.length > 0 ? partes.join(" · ") : <span className="text-[#b42318]">Preço a definir</span>;
  }

  return (
    <li className="px-4 py-4 sm:px-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="font-heading text-base font-bold leading-tight">{item.nome}</p>
            <p className="mt-0.5 text-sm text-adm-muted">
              {rotuloTipoItem[item.tipo]}
              {item.categoria ? ` · ${categoriasCuidado[item.categoria]}` : ""}
              {moto && !carro ? " · Moto" : ""}
              {moto && carro ? " · Carro e moto" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-sm font-semibold tabular-nums">{valor}</span>
            <span className="font-mono text-xs text-adm-muted">
              {item.duracaoMin ? formatarDuracao(item.duracaoMin) : "sem duração"}
            </span>
            {item.exigeDetailer && <span className="adm-chip adm-status-em_atendimento">Detailer</span>}
            <span className={`adm-chip ${item.ativo ? "adm-status-concluido" : "adm-status-inativo"}`}>
              {item.ativo ? "Ativo" : "Inativo"}
            </span>
            <span className="adm-btn min-h-9 px-3 text-[11px] group-open:hidden">Editar</span>
            <span className="adm-btn hidden min-h-9 px-3 text-[11px] group-open:inline-flex">Fechar</span>
          </div>
        </summary>

        <FormComAviso action={salvarServico.bind(null, item.id)} mensagem={`${item.nome} atualizado`} className="mt-4 space-y-4 border-t border-adm-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block sm:col-span-2">
              <span className="adm-rotulo mb-1.5 block">Nome</span>
              <input name="nome" defaultValue={item.nome} disabled={item.beneficioDePlano} className="campo disabled:opacity-60" />
              {item.beneficioDePlano && (
                <span className="mt-1 block text-xs text-adm-muted">É a chave das cotas do PitPass: não pode ser renomeado por aqui.</span>
              )}
            </label>
            <label className="block">
              <span className="adm-rotulo mb-1.5 block">Categoria</span>
              {item.tipo === "adicional" ? (
                <select name="categoria" defaultValue={item.categoria ?? ""} className="campo">
                  <option value="">Sem categoria</option>
                  {Object.entries(categoriasCuidado).map(([id, rotulo]) => (
                    <option key={id} value={id}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="campo flex items-center bg-black/[0.03]">{rotuloTipoItem[item.tipo]}</p>
              )}
            </label>
            <label className="block">
              <span className="adm-rotulo mb-1.5 block">Duração padrão (minutos)</span>
              <input name="duracaoMin" inputMode="numeric" defaultValue={item.duracaoMin ?? ""} placeholder="Ex.: 180" className="campo" />
            </label>

            {temPreco && carro && (
              <>
                <CampoPreco rotulo="Preço P" name="precoP" valor={item.precos?.P} />
                <CampoPreco rotulo="Preço G" name="precoG" valor={item.precos?.G} />
              </>
            )}
            {temPreco && moto && <CampoPreco rotulo="Preço moto" name="precoMoto" valor={item.precoMoto} />}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Marcar name="ativo" marcado={item.ativo}>
              Ativo
            </Marcar>
            {temPreco && (
              <Marcar name="requerAvaliacao" marcado={item.requiresEvaluation}>
                Requer avaliação
              </Marcar>
            )}
            <Marcar name="requerDetailer" marcado={item.exigeDetailer}>
              Requer detailer
            </Marcar>
            <Marcar name="requerLavador" marcado={item.exigeLavador}>
              Requer lavador
            </Marcar>
            {item.tipo === "adicional" && (
              <Marcar name="podeSerAdicional" marcado={item.podeSerAdicional}>
                Pode ser adicional
              </Marcar>
            )}
          </div>

          {temPreco && (
            <p className="text-xs text-adm-muted">
              Serviço sem preço (e sem &quot;Requer avaliação&quot;) não aparece para o cliente. Com &quot;Requer avaliação&quot;, o
              valor é combinado depois e os preços acima são ignorados.
            </p>
          )}

          {item.aConfirmar && item.aConfirmar.length > 0 && (
            <div className="rounded-lg bg-[#fdf1cf] px-4 py-3 text-[#5f4300]">
              <p className="adm-rotulo text-[#7a5600]">Pendências desta ficha (não aparecem no site)</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {item.aConfirmar.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <BotaoEnviar className="adm-btn adm-btn-primario">Salvar</BotaoEnviar>
        </FormComAviso>
      </details>
    </li>
  );
}

function CartaoPlano({ plano, catalogo }: { plano: Plano; catalogo: Catalogo }) {
  const ehMoto = plano.tipoVeiculo === "moto";
  const ativo = plano.ativo !== false;
  const semPreco = ehMoto ? plano.precoMoto == null : plano.precos == null;

  return (
    <div className="adm-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ClienteBadge nomePlano={plano.nome} />
        <span className={`adm-chip ${ativo && !semPreco ? "adm-status-concluido" : "adm-status-inativo"}`}>
          {!ativo ? "Inativo" : semPreco ? "Sem mensalidade" : "Ativo"}
        </span>
      </div>

      <FormComAviso action={salvarPlano.bind(null, plano.id)} mensagem={`Plano ${plano.nome} atualizado`} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {ehMoto ? (
            <CampoPreco rotulo="Mensalidade" name="precoMoto" valor={plano.precoMoto} />
          ) : (
            <>
              <CampoPreco rotulo="Mensalidade P" name="precoP" valor={plano.precos?.P} />
              <CampoPreco rotulo="Mensalidade G" name="precoG" valor={plano.precos?.G} />
            </>
          )}
        </div>
        <Marcar name="ativo" marcado={ativo}>
          Ativo no site
        </Marcar>
        {semPreco && (
          <p className="text-xs text-adm-muted">Sem mensalidade definida, o plano não aparece para o cliente.</p>
        )}
        <BotaoEnviar>Salvar</BotaoEnviar>
      </FormComAviso>

      <p className="adm-rotulo mb-1 mt-5">Lavagens do plano</p>
      <ul className="divide-y divide-adm-line">
        {servicosPorPlano[plano.id].map((nome) => {
          const item = catalogo.itens.find((i) => i.beneficioDePlano && i.nome === nome);
          return (
            <li key={nome} className="py-2.5">
              <p className="flex items-baseline justify-between gap-3 text-sm font-semibold">
                {nome}
                <span className="font-mono text-[11px] font-normal text-adm-muted">
                  {formatarRegraBeneficio(regrasBeneficios[plano.id][nome])}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-adm-muted">
                {item?.includes?.length ?? 0} itens na ficha
                {item?.incluiTudoDe ? ` + tudo da ${item.incluiTudoDe}` : ""}
                {item?.duracaoMin ? ` · ${formatarDuracao(item.duracaoMin)}` : " · sem duração"}
              </p>
            </li>
          );
        })}
      </ul>

      {plano.aConfirmar && plano.aConfirmar.length > 0 && (
        <div className="mt-4 rounded-lg bg-[#fdf1cf] px-4 py-3 text-[#5f4300]">
          <p className="adm-rotulo text-[#7a5600]">A definir pela gestão</p>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {plano.aConfirmar.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CampoPreco({ rotulo, name, valor }: { rotulo: string; name: string; valor: number | null | undefined }) {
  return (
    <label className="block">
      <span className="adm-rotulo mb-1.5 block">{rotulo}</span>
      <input
        name={name}
        inputMode="decimal"
        defaultValue={valor != null ? valor.toFixed(2).replace(".", ",") : ""}
        placeholder="A definir"
        className="campo tabular-nums"
      />
    </label>
  );
}

function Marcar({ name, marcado, children }: { name: string; marcado: boolean; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-black/10 px-3 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={marcado} className="h-[18px] w-[18px] shrink-0 accent-[#16171a]" />
      {children}
    </label>
  );
}
