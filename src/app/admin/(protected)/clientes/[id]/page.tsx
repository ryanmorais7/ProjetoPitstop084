import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarClienteComDetalhes } from "@/lib/clientes";
import { resumoBeneficiosAssinatura } from "@/lib/bookings";
import { formatarPreco } from "@/lib/format";
import { formatarDataCurta } from "@/lib/agenda";
import { planos, PlanoId, listaPlanos, linkWhatsapp } from "@/lib/data";
import CarSparkMark from "@/components/CarSparkMark";
import {
  editarCliente,
  adicionarPreferencia,
  adicionarVeiculo,
  ativarAssinatura,
  alterarStatusAssinatura,
} from "../../../clientes/actions";
import { atualizarStatusAgendamento } from "../../../actions";

const estiloStatusAgendamento: Record<string, string> = {
  confirmado: "text-gold",
  concluido: "text-text-secondary",
  cancelado: "text-red-400 line-through",
};

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clienteId = Number(id);
  const dados = Number.isFinite(clienteId) ? await buscarClienteComDetalhes(clienteId) : null;
  if (!dados) notFound();

  const { cliente, veiculos, assinaturaAtiva, historico, visitasConcluidas, proximoAgendamento } = dados;
  const nomePlano = assinaturaAtiva ? planos[assinaturaAtiva.plano as PlanoId]?.nome : null;
  const beneficios = assinaturaAtiva
    ? await resumoBeneficiosAssinatura(assinaturaAtiva.id, assinaturaAtiva.plano as PlanoId, assinaturaAtiva.cicloInicio)
    : [];

  return (
    <div>
      <Link href="/admin/clientes" className="font-mono text-xs uppercase tracking-wide text-text-secondary hover:text-gold">
        ← Clientes
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{cliente.nome}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                nomePlano ? "bg-gold text-asphalt" : "bg-white/10 text-text-secondary"
              }`}
            >
              {nomePlano ? `Cliente PitPass · ${nomePlano}` : "Cliente Pitstop 084"}
            </span>
            <span className="font-mono text-xs text-text-secondary">{cliente.codigo}</span>
          </div>
        </div>
        <Link
          href={`/admin/clientes/${cliente.id}/agendar`}
          className="rounded-sm bg-gold px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wide text-asphalt transition hover:brightness-110"
        >
          + Novo atendimento
        </Link>
      </div>

      {/* Cartão visual */}
      <div
        className={`mt-6 max-w-sm rounded-sm border p-5 ${
          nomePlano ? "border-gold bg-gradient-to-br from-panel to-asphalt" : "border-white/10 bg-panel"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarSparkMark className="h-5 w-5 text-white" />
            <span className="font-heading text-xs font-bold tracking-[0.15em]">
              {nomePlano ? `PITPASS ${nomePlano.toUpperCase()}` : "PITSTOP 084"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-secondary">P084</span>
        </div>
        <p className="mt-4 font-heading text-lg font-bold">{cliente.nome}</p>
        <p className="font-mono text-xs text-text-secondary">
          {veiculos[0] ? veiculos[0].modelo : "Sem veículo cadastrado"}
        </p>
        <div className="mt-3 flex items-center justify-between font-mono text-xs">
          <span className="text-text-secondary">{cliente.codigo}</span>
          <span className={nomePlano ? "text-gold" : "text-text-secondary"}>
            {nomePlano ? assinaturaAtiva?.status.toUpperCase() : `${visitasConcluidas} visitas`}
          </span>
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoBox label="Cliente desde" valor={new Date(cliente.createdAt).toLocaleDateString("pt-BR")} />
        <InfoBox label="Atendimentos concluídos" valor={String(visitasConcluidas)} />
        <InfoBox
          label="Próximo agendamento"
          valor={proximoAgendamento ? `${formatarDataCurta(proximoAgendamento.dia)} · ${proximoAgendamento.horario}` : "Nenhum"}
        />
        <InfoBox label="WhatsApp" valor={cliente.telefone} />
        <InfoBox
          label="Endereço"
          valor={cliente.rua ? `${cliente.rua}, ${cliente.numero ?? "s/n"} · ${cliente.bairro ?? ""}` : "Não cadastrado"}
        />
        <InfoBox label="Veículos" valor={veiculos.map((v) => v.modelo).join(", ") || "Nenhum"} />
      </div>

      {/* Ciclo PitPass */}
      {assinaturaAtiva && (
        <div className="mt-6 rounded-sm border border-gold/40 bg-gold/5 p-5">
          <p className="font-heading text-sm font-bold uppercase tracking-wide text-gold">
            Ciclo atual · {formatarDataCurta(assinaturaAtiva.cicloInicio)} a {formatarDataCurta(assinaturaAtiva.cicloFim)}
          </p>
          <div className="mt-3 space-y-2">
            {beneficios.map((b) => (
              <div key={b.beneficio} className="flex items-center justify-between font-mono text-sm">
                <span>{b.beneficio}</span>
                <span className="text-text-secondary">
                  {b.limite === null
                    ? `${b.usados} utilização${b.usados === 1 ? "" : "ões"} nesta semana`
                    : `${b.usados} de ${b.limite}${b.tipo === "semanal" ? " (semana)" : ""}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {assinaturaAtiva.status === "ativo" ? (
              <form action={alterarStatusAssinatura.bind(null, assinaturaAtiva.id, cliente.id, "pausado")}>
                <button type="submit" className="font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-gold hover:underline">
                  Pausar plano
                </button>
              </form>
            ) : (
              <form action={alterarStatusAssinatura.bind(null, assinaturaAtiva.id, cliente.id, "ativo")}>
                <button type="submit" className="font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline">
                  Reativar plano
                </button>
              </form>
            )}
            <form action={alterarStatusAssinatura.bind(null, assinaturaAtiva.id, cliente.id, "cancelado")}>
              <button type="submit" className="font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-red-400 hover:underline">
                Cancelar plano
              </button>
            </form>
          </div>
        </div>
      )}

      {!assinaturaAtiva && (
        <div className="mt-6 rounded-sm border border-white/10 bg-panel p-5">
          <p className="font-heading text-sm font-bold uppercase tracking-wide">Aderir a um plano</p>
          <form action={ativarAssinatura.bind(null, cliente.id)} className="mt-3 flex flex-wrap items-center gap-3">
            <select name="plano" className="campo w-auto">
              {listaPlanos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-sm bg-gold px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wide text-asphalt transition hover:brightness-110"
            >
              Ativar PitPass
            </button>
          </form>
        </div>
      )}

      {/* Preferências */}
      <div className="mt-6 rounded-sm border border-white/10 bg-panel p-5">
        <p className="font-heading text-sm font-bold uppercase tracking-wide">Preferências do cliente</p>
        <p className="mt-1 text-xs text-text-secondary">Permanecem pras próximas visitas.</p>
        <form action={adicionarPreferencia.bind(null, cliente.id)} className="mt-3 space-y-2">
          <textarea
            name="preferencias"
            defaultValue={cliente.preferencias ?? ""}
            rows={2}
            className="campo"
            placeholder="Ex.: prefere receber o carro até 17h."
          />
          <button type="submit" className="font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline">
            Salvar
          </button>
        </form>
      </div>

      {/* Veículos */}
      <div className="mt-6 rounded-sm border border-white/10 bg-panel p-5">
        <p className="font-heading text-sm font-bold uppercase tracking-wide">Veículos</p>
        <div className="mt-2 space-y-1">
          {veiculos.map((v) => (
            <p key={v.id} className="font-mono text-sm text-text-secondary">
              {v.modelo} {v.placa ? `· ${v.placa}` : ""} · {v.porte === "G" ? "SUV / Pick-up" : "Hatch / Sedan"}
            </p>
          ))}
        </div>
        <form action={adicionarVeiculo.bind(null, cliente.id)} className="mt-3 flex flex-wrap items-end gap-2">
          <input name="modelo" placeholder="Modelo" required className="campo w-auto" />
          <input name="placa" placeholder="Placa (opcional)" className="campo w-auto" />
          <select name="porte" className="campo w-auto" defaultValue="P">
            <option value="P">P</option>
            <option value="G">G</option>
          </select>
          <button type="submit" className="rounded-sm border border-white/15 px-3 py-2 font-mono text-xs uppercase tracking-wide text-text-secondary hover:border-gold hover:text-gold">
            + Adicionar veículo
          </button>
        </form>
      </div>

      {/* Endereço + WhatsApp */}
      <div className="mt-6 rounded-sm border border-white/10 bg-panel p-5">
        <p className="font-heading text-sm font-bold uppercase tracking-wide">Contato e endereço</p>
        <form action={editarCliente.bind(null, cliente.id)} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-text-secondary">WhatsApp</span>
            <input name="telefone" defaultValue={cliente.telefone} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">CEP</span>
            <input name="cep" defaultValue={cliente.cep ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Rua</span>
            <input name="rua" defaultValue={cliente.rua ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Número</span>
            <input name="numero" defaultValue={cliente.numero ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Complemento</span>
            <input name="complemento" defaultValue={cliente.complemento ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Bairro</span>
            <input name="bairro" defaultValue={cliente.bairro ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Cidade</span>
            <input name="cidade" defaultValue={cliente.cidade ?? ""} className="campo" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">UF</span>
            <input name="uf" defaultValue={cliente.uf ?? ""} className="campo" maxLength={2} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-text-secondary">Ponto de referência</span>
            <input name="referencia" defaultValue={cliente.referencia ?? ""} className="campo" />
          </label>
          <button
            type="submit"
            className="sm:col-span-2 rounded-sm border border-white/15 py-2 font-mono text-xs uppercase tracking-wide text-text-secondary hover:border-gold hover:text-gold"
          >
            Salvar contato e endereço
          </button>
        </form>
        <a
          href={linkWhatsapp(`Olá ${cliente.nome}! Aqui é da Pitstop 084.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline"
        >
          Falar no WhatsApp
        </a>
      </div>

      {/* Histórico */}
      <div className="mt-6">
        <p className="font-heading text-sm font-bold uppercase tracking-wide">Histórico</p>
        {historico.length === 0 && <p className="mt-2 text-sm text-text-secondary">Nenhum atendimento ainda.</p>}
        <div className="mt-3 space-y-2">
          {historico.map((h) => (
            <div key={h.id} className="rounded-sm border border-white/10 bg-panel p-4 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-sm">
                  <span className="text-white">{h.codigo}</span> · <span className="text-gold">{formatarDataCurta(h.dia)}</span> · {h.horario}{" "}
                  <span className={`text-xs uppercase ${estiloStatusAgendamento[h.status] ?? ""}`}>{h.status}</span>
                </p>
                <p className="text-sm text-text-primary">{h.servicoNome}</p>
                {h.preco && <p className="font-mono text-xs text-gold">{formatarPreco(Number(h.preco))}</p>}
                {h.observacoes && <p className="mt-1 text-xs text-text-secondary">Obs.: {h.observacoes}</p>}
              </div>
              {h.status === "confirmado" && (
                <div className="mt-2 flex gap-2 sm:mt-0">
                  <form action={atualizarStatusAgendamento.bind(null, h.id, "concluido")}>
                    <button type="submit" className="rounded-sm border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-primary hover:border-gold hover:text-gold">
                      Concluir
                    </button>
                  </form>
                  <form action={atualizarStatusAgendamento.bind(null, h.id, "cancelado")}>
                    <button type="submit" className="rounded-sm border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-secondary hover:border-red-400 hover:text-red-400">
                      Cancelar
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{valor}</p>
    </div>
  );
}
