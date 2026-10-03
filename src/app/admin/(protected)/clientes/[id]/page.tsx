import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarClienteComDetalhes } from "@/lib/clientes";
import { resumoBeneficiosAssinatura } from "@/lib/bookings";
import { formatarDataCurta, hojeIso } from "@/lib/agenda";
import { planos, PlanoId, listaPlanos, linkWhatsappPara, origensCliente, portesVeiculo, VehicleSize } from "@/lib/data";
import { descreverServicos } from "@/lib/adminDados";
import { statusOperacional, dataIsoFortaleza } from "@/lib/pitpass";
import CarSparkMark from "@/components/CarSparkMark";
import { pitpassTheme, temaDoPlano } from "@/lib/pitpassTheme";
import ClienteBadge from "@/components/admin/ClienteBadge";
import { StatusChip } from "@/components/admin/AgendamentoCard";
import FormComAviso, { BotaoEnviar } from "@/components/admin/FormComAviso";
import {
  editarCliente,
  adicionarPreferencia,
  adicionarVeiculo,
  ativarAssinatura,
  alterarStatusAssinatura,
} from "../../../clientes/actions";

const rotuloStatusAssinatura: Record<string, string> = { ativo: "Ativo", pausado: "Pausado", cancelado: "Cancelado" };

export default async function FichaClientePage({ params }: PageProps<"/admin/clientes/[id]">) {
  const { id } = await params;
  const clienteId = Number(id);
  const dados = Number.isFinite(clienteId) ? await buscarClienteComDetalhes(clienteId) : null;
  if (!dados) notFound();

  const { cliente, veiculos, assinaturaAtiva, historico, visitasConcluidas, proximoAgendamento } = dados;
  const hoje = hojeIso();
  const nomePlano = assinaturaAtiva ? planos[assinaturaAtiva.plano as PlanoId]?.nome : null;
  const beneficios = assinaturaAtiva
    ? await resumoBeneficiosAssinatura(assinaturaAtiva.id, assinaturaAtiva.plano as PlanoId, assinaturaAtiva.cicloInicio)
    : [];
  const principal = veiculos.find((v) => v.principal) ?? veiculos[0] ?? null;
  // histórico vem do mais recente pro mais antigo; cancelado não conta como visita
  const ultimaVisita = historico.find((h) => h.status === "concluido") ?? null;
  const origem = origensCliente.find((o) => o.id === cliente.origem)?.rotulo ?? "Não informada";

  return (
    <div className="space-y-6">
      <Link href="/admin/clientes" className="inline-flex min-h-9 items-center text-sm text-adm-muted underline-offset-4 hover:text-adm-ink hover:underline">
        ← Clientes
      </Link>

      {/* Identificação */}
      <header className="adm-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-3xl font-bold leading-tight">{cliente.nome}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ClienteBadge nomePlano={nomePlano} />
              <span className="font-mono text-xs text-adm-muted">{cliente.codigo}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/clientes/${cliente.id}/agendar`} className="adm-btn adm-btn-primario">
              + Novo agendamento
            </Link>
            <a
              href={linkWhatsappPara(cliente.telefone, `Olá, ${cliente.nome.trim().split(/\s+/)[0]}! Aqui é da PitStop084.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="adm-btn"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-adm-line pt-5 sm:grid-cols-4">
          <Dado rotulo="WhatsApp">{cliente.telefone}</Dado>
          <Dado rotulo="Veículo">{principal?.modelo ?? "Não cadastrado"}</Dado>
          <Dado rotulo="Placa">
            <span className="font-mono">{principal?.placa ?? "Não informada"}</span>
          </Dado>
          <Dado rotulo="Porte">{principal ? (portesVeiculo[principal.porte as VehicleSize]?.nome ?? principal.porte) : "-"}</Dado>
        </dl>
      </header>

      {/* Resumo */}
      <section aria-labelledby="resumo">
        <h3 id="resumo" className="adm-rotulo mb-3">
          Resumo
        </h3>
        <dl className="adm-card grid grid-cols-2 gap-x-4 gap-y-5 p-5 sm:grid-cols-4 sm:p-6">
          <Dado rotulo="Cliente desde">{formatarDataCurta(dataIsoFortaleza(cliente.createdAt))}</Dado>
          <Dado rotulo="Última visita">{ultimaVisita ? formatarDataCurta(ultimaVisita.dia) : "Nenhuma"}</Dado>
          <Dado rotulo="Próximo agendamento">
            {proximoAgendamento ? (
              <Link href={`/admin/atendimentos/${proximoAgendamento.id}`} className="font-semibold underline underline-offset-4">
                {formatarDataCurta(proximoAgendamento.dia)} · {proximoAgendamento.horario}
              </Link>
            ) : (
              "Nenhum"
            )}
          </Dado>
          <Dado rotulo="Total de atendimentos">{visitasConcluidas}</Dado>
          <Dado rotulo="Plano">{nomePlano ? `PitPass ${nomePlano}` : "Sem plano"}</Dado>
          <Dado rotulo="Status">
            {assinaturaAtiva ? (rotuloStatusAssinatura[assinaturaAtiva.status] ?? assinaturaAtiva.status) : "Cliente avulso"}
          </Dado>
          <Dado rotulo="Código do cliente">
            <span className="font-mono">{cliente.codigo}</span>
          </Dado>
          <Dado rotulo="Origem">{origem}</Dado>
        </dl>
      </section>

      {/* PitPass */}
      <section aria-labelledby="pitpass">
        <h3 id="pitpass" className="adm-rotulo mb-3">
          PitPass
        </h3>
        {assinaturaAtiva && nomePlano ? (
          <div className="grid gap-4 md:grid-cols-[18rem_minmax(0,1fr)]">
            <div className={`pitpass-cartao ${pitpassTheme[temaDoPlano(assinaturaAtiva.plano)].classe} rounded-xl p-5`}>
              <div className="flex items-center gap-2">
                <CarSparkMark className="h-5 w-5 text-white" />
                <span className="font-heading text-xs font-bold tracking-[0.15em]">
                  PITPASS <span className="pitpass-acento">• {nomePlano.toUpperCase()}</span>
                </span>
              </div>
              <p className="mt-5 font-heading text-lg font-bold leading-tight">{cliente.nome}</p>
              <p className="font-mono text-xs text-white/60">{principal?.modelo ?? "Sem veículo cadastrado"}</p>
              <div className="mt-4 flex items-center justify-between font-mono text-xs">
                <span className="text-white/60">{cliente.codigo}</span>
                <span className="pitpass-acento">{(rotuloStatusAssinatura[assinaturaAtiva.status] ?? "").toUpperCase()}</span>
              </div>
            </div>

            <div className="adm-card p-5">
              <p className="adm-rotulo">Ciclo atual</p>
              <p className="mt-1 font-heading text-lg font-bold">
                {formatarDataCurta(assinaturaAtiva.cicloInicio)} → {formatarDataCurta(assinaturaAtiva.cicloFim)}
              </p>
              <ul className="mt-4 divide-y divide-adm-line">
                {beneficios.map((b) => (
                  <li key={b.beneficio} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                    <span className="text-sm font-semibold">{b.beneficio}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {b.limite !== null && (
                        <span className={`adm-chip ${b.limite - b.usados > 0 ? "adm-status-concluido" : "adm-status-inativo"}`}>
                          {Math.max(b.limite - b.usados, 0)} disponível{b.limite - b.usados === 1 ? "" : "is"}
                          {b.tipo === "semanal" ? " na semana" : ""}
                        </span>
                      )}
                      {b.limite === null && <span className="adm-chip adm-status-concluido">Ilimitado na semana</span>}
                      {b.reservados > 0 && (
                        <span className="adm-chip adm-status-aguardando">
                          {b.reservados} reservado{b.reservados === 1 ? "" : "s"}
                        </span>
                      )}
                      <span className="adm-chip adm-status-confirmado">
                        {b.utilizados} utilizado{b.utilizados === 1 ? "" : "s"}
                        {b.limite !== null ? ` de ${b.limite}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-adm-muted">
                Agendar reserva o benefício. Concluir o atendimento consome. Cancelar devolve.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-adm-line pt-4">
                <FormComAviso
                  action={alterarStatusAssinatura.bind(null, assinaturaAtiva.id, cliente.id, "pausado")}
                  mensagem="Plano pausado"
                >
                  <BotaoEnviar>Pausar plano</BotaoEnviar>
                </FormComAviso>
                <details className="relative">
                  <summary className="adm-btn adm-btn-perigo cursor-pointer list-none">Cancelar plano</summary>
                  <div className="adm-card absolute left-0 z-10 mt-2 w-64 p-4 shadow-lg">
                    <p className="text-sm">Cancelar o PitPass {nomePlano} deste cliente?</p>
                    <FormComAviso
                      action={alterarStatusAssinatura.bind(null, assinaturaAtiva.id, cliente.id, "cancelado")}
                      mensagem="Plano cancelado"
                      className="mt-3"
                    >
                      <BotaoEnviar className="adm-btn w-full border-[#b42318] bg-[#b42318] text-white">
                        Sim, cancelar plano
                      </BotaoEnviar>
                    </FormComAviso>
                  </div>
                </details>
              </div>
            </div>
          </div>
        ) : (
          <div className="adm-card p-5">
            <p className="text-sm text-adm-muted">Cliente PitStop 084, sem PitPass ativo.</p>
            <FormComAviso
              action={ativarAssinatura.bind(null, cliente.id)}
              mensagem="PitPass ativado"
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <label htmlFor="plano-ativar" className="sr-only">
                Plano
              </label>
              <select id="plano-ativar" name="plano" className="campo w-auto">
                {listaPlanos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <BotaoEnviar className="adm-btn adm-btn-primario">Ativar PitPass</BotaoEnviar>
            </FormComAviso>
          </div>
        )}
      </section>

      {/* Preferências (permanentes) */}
      <section aria-labelledby="preferencias">
        <h3 id="preferencias" className="adm-rotulo mb-3">
          Preferências do cliente
        </h3>
        <FormComAviso action={adicionarPreferencia.bind(null, cliente.id)} mensagem="Preferências salvas" className="adm-card p-5">
          <label htmlFor="preferencias-campo" className="text-sm text-adm-muted">
            Valem para todas as visitas. Observações de um atendimento específico ficam na ficha do atendimento.
          </label>
          <textarea
            id="preferencias-campo"
            name="preferencias"
            defaultValue={cliente.preferencias ?? ""}
            rows={3}
            className="campo mt-3"
            placeholder="Ex.: não gosta de perfume forte. Avisar antes da entrega."
          />
          <div className="mt-3">
            <BotaoEnviar>Salvar preferências</BotaoEnviar>
          </div>
        </FormComAviso>
      </section>

      {/* Histórico */}
      <section aria-labelledby="historico">
        <h3 id="historico" className="adm-rotulo mb-3">
          Histórico · {visitasConcluidas} atendimento{visitasConcluidas === 1 ? "" : "s"} realizado{visitasConcluidas === 1 ? "" : "s"}
        </h3>
        {historico.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 px-5 py-8 text-center text-sm text-adm-muted">
            Nenhum atendimento ainda.
          </p>
        ) : (
          <ol className="adm-card divide-y divide-adm-line overflow-hidden">
            {historico.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/admin/atendimentos/${h.id}`}
                  className="grid gap-x-4 gap-y-1 px-4 py-3.5 transition-colors hover:bg-black/[0.025] sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <span className="font-mono text-xs font-medium uppercase tracking-wide">
                    {formatarDataCurta(h.dia)} • {h.horario}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{descreverServicos(h)}</span>
                    <span className="block font-mono text-[11px] text-adm-muted">{h.codigo}</span>
                    {h.observacoes && <span className="mt-0.5 block text-xs text-adm-muted">Obs.: {h.observacoes}</span>}
                  </span>
                  <span>
                    <StatusChip status={statusOperacional(h, hoje)} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Veículos */}
      <section aria-labelledby="veiculos">
        <h3 id="veiculos" className="adm-rotulo mb-3">
          Veículos
        </h3>
        <div className="adm-card p-5">
          {veiculos.length > 0 && (
            <ul className="mb-4 divide-y divide-adm-line">
              {veiculos.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className="font-semibold">{v.modelo}</span>
                  <span className="font-mono text-adm-muted">{v.placa ?? "sem placa"}</span>
                  <span className="text-adm-muted">{portesVeiculo[v.porte as VehicleSize]?.nome ?? v.porte}</span>
                  {v.principal && <span className="adm-chip adm-status-confirmado">Principal</span>}
                </li>
              ))}
            </ul>
          )}
          <FormComAviso
            action={adicionarVeiculo.bind(null, cliente.id)}
            mensagem="Veículo adicionado"
            className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto]"
          >
            <input name="modelo" aria-label="Modelo" placeholder="Modelo" required className="campo" />
            <input name="placa" aria-label="Placa" placeholder="Placa" className="campo font-mono uppercase" />
            <select name="porte" aria-label="Porte" className="campo" defaultValue="P">
              <option value="P">Porte P</option>
              <option value="G">Porte G</option>
            </select>
            <BotaoEnviar>+ Adicionar</BotaoEnviar>
          </FormComAviso>
        </div>
      </section>

      {/* Contato, endereço e origem */}
      <section aria-labelledby="contato">
        <h3 id="contato" className="adm-rotulo mb-3">
          Contato, endereço e origem
        </h3>
        <FormComAviso
          action={editarCliente.bind(null, cliente.id)}
          mensagem="Dados do cliente salvos"
          className="adm-card grid gap-3 p-5 sm:grid-cols-2"
        >
          <Campo rotulo="WhatsApp" name="telefone" valor={cliente.telefone} />
          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Origem</span>
            <select name="origem" className="campo" defaultValue={cliente.origem ?? ""}>
              <option value="">Não informada</option>
              {origensCliente.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </label>
          <Campo rotulo="CEP" name="cep" valor={cliente.cep} />
          <Campo rotulo="Rua" name="rua" valor={cliente.rua} />
          <Campo rotulo="Número" name="numero" valor={cliente.numero} />
          <Campo rotulo="Complemento" name="complemento" valor={cliente.complemento} />
          <Campo rotulo="Bairro" name="bairro" valor={cliente.bairro} />
          <Campo rotulo="Cidade" name="cidade" valor={cliente.cidade} />
          <Campo rotulo="UF" name="uf" valor={cliente.uf} maxLength={2} />
          <Campo rotulo="Ponto de referência" name="referencia" valor={cliente.referencia} />
          <div className="sm:col-span-2">
            <BotaoEnviar>Salvar dados do cliente</BotaoEnviar>
          </div>
        </FormComAviso>
      </section>
    </div>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="adm-rotulo">{rotulo}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

function Campo({ rotulo, name, valor, maxLength }: { rotulo: string; name: string; valor: string | null; maxLength?: number }) {
  return (
    <label className="block">
      <span className="adm-rotulo mb-1.5 block">{rotulo}</span>
      <input name={name} defaultValue={valor ?? ""} maxLength={maxLength} className="campo" />
    </label>
  );
}
