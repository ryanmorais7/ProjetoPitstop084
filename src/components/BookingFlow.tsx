"use client";

import { useEffect, useMemo, useState } from "react";
import {
  duchaPitstop,
  planos,
  listaPlanos,
  listaPortesVeiculo,
  PlanoId,
  servicosPorPlano,
  beneficiosAgendaveis,
  itensInclusosBeneficio,
  portesVeiculo,
  precoServico,
  etapasAgendamento,
  horariosAgendamento,
  linkWhatsapp,
  linkComoChegar,
} from "@/lib/data";
import { proximasDatasUteis, paraIso, formatarDataCurta } from "@/lib/agenda";
import { mensagemAgendamentoAvulso, mensagemAgendamentoPitPass } from "@/lib/whatsapp";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { useSelection, TipoAtendimento } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import DateTimePicker from "./DateTimePicker";
import PitPass from "./PitPass";
import Bolt from "./Bolt";

type Etapa = "tipo" | "plano" | "porte" | "beneficio" | "horario" | "ficha" | "confirmacao";

interface Slot {
  dia: string;
  hora: string;
}

function etapaInicial(
  tipo: TipoAtendimento | null,
  planoId: PlanoId | null,
  beneficio: string | null,
  porteDefinido: boolean
): Etapa {
  if (tipo === "avulso") return "horario";
  if (tipo === "assinatura") {
    if (!planoId) return "plano";
    if (!porteDefinido) return "porte";
    if (!beneficio) return "beneficio";
    return "horario";
  }
  return "tipo";
}

export default function BookingFlow() {
  const {
    tipoAtendimento,
    setTipoAtendimento,
    avulsosSelecionados,
    planoSelecionado,
    selecionarPlano,
    porteVeiculo,
    definirPorteVeiculo,
    porteDefinidoPeloUsuario,
    reiniciarSelecao,
  } = useSelection();

  const [beneficioSelecionado, setBeneficioSelecionado] = useState<string | null>(null);
  const [reserva, setReserva] = useState<{ id: number; codigo: string } | null>(null);
  const [etapa, setEtapa] = useState<Etapa>(() =>
    etapaInicial(tipoAtendimento, planoSelecionado, beneficioSelecionado, porteDefinidoPeloUsuario)
  );
  const datasRapidas = useMemo(() => proximasDatasUteis(6), []);
  const [dataSelecionadaIso, setDataSelecionadaIso] = useState(() => paraIso(datasRapidas[0]));
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carro, setCarro] = useState("");
  const [placa, setPlaca] = useState("");
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agendamentos")
      .then((r) => r.json())
      .then((data: { ocupados: { dia: string; horario: string }[] }) => {
        setOcupados(new Set(data.ocupados.map((o) => `${o.dia}-${o.horario}`)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tipoAtendimento === "assinatura" && planoSelecionado) {
      const beneficios = servicosPorPlano[planoSelecionado];
      if (beneficios.length === 1 && !beneficioSelecionado) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- planos com um único benefício não precisam de uma tela de escolha
        setBeneficioSelecionado(beneficios[0]);
        return;
      }
    }
    const alvo = etapaInicial(tipoAtendimento, planoSelecionado, beneficioSelecionado, porteDefinidoPeloUsuario);
    if (
      alvo !== "tipo" &&
      (etapa === "tipo" || etapa === "plano" || etapa === "porte" || etapa === "beneficio")
    ) {
      setEtapa(alvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoAtendimento, planoSelecionado, beneficioSelecionado, porteDefinidoPeloUsuario]);

  const plano = planoSelecionado ? planos[planoSelecionado] : null;
  const porte = portesVeiculo[porteVeiculo];
  const precoDucha = precoServico(duchaPitstop, porteVeiculo) ?? 0;
  const adicionaisComPreco = avulsosSelecionados.filter((s) => s.precos);
  const adicionaisAvaliacao = avulsosSelecionados.filter((s) => s.requiresEvaluation);
  const totalAdicionais = adicionaisComPreco.reduce(
    (soma, s) => soma + (precoServico(s, porteVeiculo) ?? 0),
    0
  );
  const totalAvulso = precoDucha + totalAdicionais;
  const fichaValida = nome.trim().length > 1 && telefone.trim().length > 7 && carro.trim().length > 0;

  const indiceVisivel: Record<Etapa, number> = {
    tipo: 0,
    plano: 1,
    porte: 1,
    beneficio: 1,
    horario: 2,
    ficha: 3,
    confirmacao: 4,
  };
  const passos = etapasAgendamento.map((label, i) =>
    i === 1 && tipoAtendimento === "assinatura" ? "Plano" : label
  );

  function escolherTipo(tipo: TipoAtendimento) {
    setTipoAtendimento(tipo);
    setEtapa(etapaInicial(tipo, planoSelecionado, beneficioSelecionado, porteDefinidoPeloUsuario));
  }

  function escolherBeneficio(nome: string) {
    setBeneficioSelecionado(nome);
    setEtapa("horario");
  }

  function selecionarSlot(hora: string) {
    setSlotSelecionado({ dia: dataSelecionadaIso, hora });
    setErro(null);
  }

  function trocarData(iso: string) {
    setDataSelecionadaIso(iso);
    setSlotSelecionado(null);
  }

  async function confirmarFicha() {
    if (!slotSelecionado || !tipoAtendimento) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          telefone,
          carro,
          placa,
          tipoAtendimento,
          avulsosIds: avulsosSelecionados.map((s) => s.id),
          planoId: planoSelecionado,
          porteVeiculo,
          servicoPlano: beneficioSelecionado,
          dia: slotSelecionado.dia,
          horario: slotSelecionado.hora,
        }),
      });
      if (resposta.status === 409) {
        setOcupados((atual) => new Set(atual).add(`${slotSelecionado.dia}-${slotSelecionado.hora}`));
        setSlotSelecionado(null);
        setErro("Esse horário acabou de ser reservado por outra pessoa. Escolha outro.");
        setEtapa("horario");
        return;
      }
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não foi possível confirmar o agendamento agora. Tente novamente.");
        return;
      }
      const dados: { id: number; codigo: string } = await resposta.json();
      setReserva(dados);
      setEtapa("confirmacao");
    } catch {
      setErro("Não foi possível confirmar o agendamento agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function novoAgendamento() {
    setSlotSelecionado(null);
    setNome("");
    setTelefone("");
    setCarro("");
    setPlaca("");
    setBeneficioSelecionado(null);
    setReserva(null);
    setEtapa("tipo");
    reiniciarSelecao();
  }

  return (
    <section id="agendamento" className="bg-light px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-light-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Agendamento
          </div>
          <h2 className="font-heading text-3xl font-bold text-light-text md:text-5xl">
            Seu Pitstop começa aqui.
          </h2>
          <p className="mt-3 text-light-text-secondary">
            Escolha o horário e deixe o resto com a gente.
          </p>
        </div>

        {etapa !== "confirmacao" && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            {passos.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm ${
                      i <= indiceVisivel[etapa]
                        ? "bg-gold text-asphalt"
                        : "bg-light-panel text-light-text-secondary"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-light-text-secondary">{label}</span>
                </div>
                {i < passos.length - 1 && (
                  <span
                    className={`h-px w-6 ${i < indiceVisivel[etapa] ? "bg-gold" : "bg-black/10"}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-sm border border-white/10 bg-panel p-8">
          {etapa === "tipo" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Como você quer agendar?</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => escolherTipo("avulso")}
                  className="rounded-sm border border-white/10 bg-asphalt p-6 text-left transition hover:border-gold"
                >
                  <span className="font-heading text-lg font-bold">Ducha Pitstop</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    Agendo agora, sem compromisso — dá pra adicionar cuidados na hora.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => escolherTipo("assinatura")}
                  className="rounded-sm border border-white/10 bg-asphalt p-6 text-left transition hover:border-gold"
                >
                  <span className="font-heading text-lg font-bold">Sou assinante</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    Já tenho um plano PitStop e quero usar um benefício.
                  </p>
                </button>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("servicos")}
                className="mt-4 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline"
              >
                Ou montar meu Pitstop primeiro
              </button>
            </div>
          )}

          {etapa === "plano" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual é o seu plano?</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {listaPlanos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selecionarPlano(p.id)}
                    className="rounded-sm border border-white/10 bg-asphalt p-6 text-center font-heading text-lg font-bold uppercase tracking-wide transition hover:border-gold"
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEtapa("tipo")}
                className="mt-6 rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
              >
                Voltar
              </button>
            </div>
          )}

          {etapa === "porte" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual é o seu veículo?</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {listaPortesVeiculo.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => definirPorteVeiculo(p.id)}
                    className="rounded-sm border border-white/10 bg-asphalt p-6 text-left transition hover:border-gold"
                  >
                    <span className="block font-heading text-base font-bold">{p.nome}</span>
                    <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">
                      {p.descricao}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEtapa("plano")}
                className="mt-6 rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
              >
                Voltar
              </button>
            </div>
          )}

          {etapa === "beneficio" && plano && (
            <div>
              <h3 className="font-heading text-xl font-bold">O que você quer usar?</h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                Plano: <span className="text-gold">{plano.nome}</span> · {porte.nome}
              </p>

              <div className="mb-6 rounded-sm border border-white/10 bg-asphalt p-4">
                <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Seu {plano.nome}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {plano.beneficios.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {servicosPorPlano[plano.id].map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => escolherBeneficio(nome)}
                    className="rounded-sm border border-white/10 bg-asphalt p-5 text-left transition hover:border-gold"
                  >
                    <span className="font-heading text-base font-bold">{nome}</span>
                    {beneficiosAgendaveis[nome] && (
                      <p className="mt-1 text-sm text-text-secondary">{beneficiosAgendaveis[nome]}</p>
                    )}
                    {itensInclusosBeneficio[nome]?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-mono text-[10px] uppercase tracking-wide text-gold">Inclui</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-text-secondary">
                          {itensInclusosBeneficio[nome].map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEtapa("porte")}
                className="mt-6 rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
              >
                Voltar
              </button>
            </div>
          )}

          {etapa === "horario" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Quando você quer vir?</h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                {tipoAtendimento === "avulso" && (
                  <>
                    Agendando:{" "}
                    <span className="text-gold">
                      Ducha Pitstop
                      {avulsosSelecionados.length > 0 &&
                        ` + ${avulsosSelecionados.length} cuidado${
                          avulsosSelecionados.length > 1 ? "s" : ""
                        }`}
                    </span>{" "}
                    · {formatarPreco(totalAvulso)}
                  </>
                )}
                {tipoAtendimento === "assinatura" && plano && (
                  <>
                    Plano: <span className="text-gold">{plano.nome}</span>
                    {beneficioSelecionado && <> · {beneficioSelecionado}</>} · {porte.nome}
                  </>
                )}
              </p>

              <DateTimePicker
                datasRapidas={datasRapidas}
                dataSelecionadaIso={dataSelecionadaIso}
                onSelecionarData={trocarData}
                horarios={horariosAgendamento}
                ocupados={ocupados}
                horaSelecionada={slotSelecionado?.dia === dataSelecionadaIso ? slotSelecionado.hora : null}
                onSelecionarHora={selecionarSlot}
              />

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEtapa(
                      tipoAtendimento === "assinatura"
                        ? plano && servicosPorPlano[plano.id].length > 1
                          ? "beneficio"
                          : "porte"
                        : "tipo"
                    )
                  }
                  className="rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!slotSelecionado}
                  onClick={() => setEtapa("ficha")}
                  className="flex-1 rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {slotSelecionado
                    ? `Continuar · ${formatarDataCurta(slotSelecionado.dia)} ${slotSelecionado.hora}`
                    : "Selecione um horário"}
                </button>
              </div>
            </div>
          )}

          {etapa === "ficha" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!fichaValida) return;
                confirmarFicha();
              }}
            >
              <h3 className="flex items-center gap-2 font-heading text-xl font-bold">
                Ficha técnica <Bolt className="h-4 w-4 text-gold" />
              </h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                Só o essencial pra gente te receber direito.
              </p>

              <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm border border-white/10 bg-asphalt p-4 font-mono text-xs">
                <SpecItem
                  label="Tipo"
                  valor={tipoAtendimento === "assinatura" ? "Assinatura" : "Ducha Pitstop"}
                />
                {tipoAtendimento === "avulso" && (
                  <SpecItem
                    label="Serviços"
                    valor={["Ducha Pitstop", ...avulsosSelecionados.map((s) => s.nome)].join(" + ")}
                    wide
                  />
                )}
                {tipoAtendimento === "assinatura" && plano && (
                  <>
                    <SpecItem label="Plano" valor={plano.nome} />
                    {beneficioSelecionado && <SpecItem label="Cuidado" valor={beneficioSelecionado} />}
                  </>
                )}
                <SpecItem label="Porte" valor={porte.nome} />
                {slotSelecionado && (
                  <>
                    <SpecItem label="Data" valor={formatarDataCurta(slotSelecionado.dia)} />
                    <SpecItem label="Horário" valor={slotSelecionado.hora} />
                  </>
                )}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-text-secondary">Nome *</span>
                  <input
                    required
                    className="campo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-text-secondary">WhatsApp *</span>
                  <input
                    required
                    inputMode="numeric"
                    className="campo"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(84) 9 0000-0000"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-text-secondary">Carro *</span>
                  <input
                    required
                    className="campo"
                    value={carro}
                    onChange={(e) => setCarro(e.target.value)}
                    placeholder="Modelo do carro"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-text-secondary">Placa (opcional)</span>
                  <input
                    className="campo"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                  />
                </label>
              </div>

              {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEtapa("horario")}
                  className="rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={!fichaValida || enviando}
                  className="flex-1 rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviando ? "Confirmando..." : "Confirmar meu Pitstop"}
                </button>
              </div>
            </form>
          )}

          {etapa === "confirmacao" && slotSelecionado && reserva && (
            <div className="text-center">
              {(() => {
                const codigo = reserva.codigo;
                const servicosPitpass =
                  tipoAtendimento === "avulso"
                    ? [
                        "Ducha Pitstop",
                        ...avulsosSelecionados.filter((s) => !s.requiresEvaluation).map((s) => s.nome),
                      ]
                    : [plano?.nome, beneficioSelecionado].filter((v): v is string => Boolean(v));
                const selo = tipoAtendimento === "avulso" ? "AGENDAMENTO" : plano?.nome.toUpperCase() ?? "";
                const mensagemWhats =
                  tipoAtendimento === "avulso"
                    ? mensagemAgendamentoAvulso({
                        nome,
                        veiculo: carro,
                        porteNome: porte.nome,
                        servico: servicosPitpass.join(" + "),
                        dataIso: slotSelecionado.dia,
                        horario: slotSelecionado.hora,
                        codigo,
                      })
                    : mensagemAgendamentoPitPass({
                        nome,
                        veiculo: carro,
                        porteNome: porte.nome,
                        plano: plano?.nome ?? "",
                        beneficio: beneficioSelecionado ?? "",
                        dataIso: slotSelecionado.dia,
                        horario: slotSelecionado.hora,
                        codigo,
                      });

                return (
                  <>
                    <p className="font-heading text-xs font-bold tracking-[0.2em] text-gold">
                      ✓ AGENDAMENTO CONFIRMADO
                    </p>
                    <h3 className="mt-1 font-heading text-2xl font-bold">Seu Pitstop está marcado.</h3>
                    <p className="mt-2 text-sm text-text-secondary">Agora deixa o cuidado com a gente.</p>

                    <div className="mt-6">
                      <PitPass
                        selo={selo}
                        planoId={plano?.id}
                        carro={carro}
                        porteNome={porte.nome}
                        dataIso={slotSelecionado.dia}
                        horario={slotSelecionado.hora}
                        servicos={servicosPitpass}
                        codigo={codigo}
                      />
                    </div>

                    {tipoAtendimento === "avulso" && adicionaisAvaliacao.length > 0 && (
                      <div className="mx-auto mt-4 max-w-sm rounded-sm border border-white/10 bg-panel p-4 text-left text-sm">
                        <p className="text-text-secondary">
                          Você também pediu avaliação para:{" "}
                          <span className="text-white">
                            {adicionaisAvaliacao.map((s) => s.nome).join(", ")}
                          </span>
                          . Nossa equipe retorna pelo WhatsApp com o valor.
                        </p>
                        <a
                          href={linkWhatsapp(
                            `Olá! Acabei de agendar na Pitstop e também quero uma avaliação para: ${adicionaisAvaliacao
                              .map((s) => s.nome)
                              .join(", ")}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline"
                        >
                          Pedir avaliação no WhatsApp
                        </a>
                      </div>
                    )}

                    <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
                      <a
                        href={linkComoChegar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm border border-white/15 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
                      >
                        Como chegar
                      </a>
                      <a
                        href={linkWhatsapp(mensagemWhats)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm border border-white/15 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
                      >
                        Falar com a Pitstop
                      </a>
                      <button
                        onClick={novoAgendamento}
                        className="rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
                      >
                        Fazer novo agendamento
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SpecItem({ label, valor, wide }: { label: string; valor: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <span className="block text-text-secondary uppercase tracking-wide">{label}</span>
      <span className="text-text-primary">{valor}</span>
    </div>
  );
}
