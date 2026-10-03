"use client";

import { useEffect, useMemo, useState } from "react";
import {
  duchaPitstop,
  planos,
  listaPlanos,
  PlanoId,
  servicosPorPlano,
  lavagensPlano,
  regrasBeneficios,
  formatarRegraBeneficio,
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
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import FichaTecnicaSheet from "./FichaTecnicaSheet";
import NivelCuidado from "./NivelCuidado";
import { abrirMeuPitPass, lembrarBuscaPitPass } from "./MeuPitPass";

type Etapa = "tipo" | "plano" | "veiculo" | "beneficio" | "horario" | "ficha" | "confirmacao";

interface Slot {
  dia: string;
  hora: string;
}

/**
 * Próxima etapa a partir do que já se sabe. O porte nunca é presumido: se o visitante não
 * escolheu em nenhum lugar da landing, o agendamento pergunta antes do horário.
 */
function etapaInicial(
  tipo: TipoAtendimento | null,
  planoId: PlanoId | null,
  beneficio: string | null,
  porteDefinido: boolean
): Etapa {
  if (tipo === "avulso") return porteDefinido ? "horario" : "veiculo";
  if (tipo === "assinatura") {
    if (!planoId) return "plano";
    if (!porteDefinido) return "veiculo";
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
    porteDefinidoPeloUsuario,
    reiniciarSelecao,
  } = useSelection();

  const [beneficioSelecionado, setBeneficioSelecionado] = useState<string | null>(null);
  const [reserva, setReserva] = useState<{ id: number; codigo: string; checkinUrl?: string } | null>(null);
  const [trocandoVeiculo, setTrocandoVeiculo] = useState(false);
  const [beneficiosPlanoAbertos, setBeneficiosPlanoAbertos] = useState(false);
  const [detalheBeneficio, setDetalheBeneficio] = useState<string | null>(null);
  const [avisoVeiculo, setAvisoVeiculo] = useState(false);
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
      (etapa === "tipo" || etapa === "plano" || etapa === "veiculo" || etapa === "beneficio")
    ) {
      setEtapa(alvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoAtendimento, planoSelecionado, beneficioSelecionado, porteDefinidoPeloUsuario]);

  const plano = planoSelecionado ? planos[planoSelecionado] : null;
  const fichaBeneficio = detalheBeneficio ? (lavagensPlano[detalheBeneficio] ?? null) : null;
  const regraFichaBeneficio =
    plano && detalheBeneficio ? regrasBeneficios[plano.id][detalheBeneficio] : null;
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
    veiculo: 1,
    beneficio: 1,
    horario: 2,
    ficha: 3,
    confirmacao: 4,
  };
  const passos = etapasAgendamento.map((label, i) =>
    i === 1 && tipoAtendimento === "assinatura" ? "Plano" : label
  );

  function escolherTipo(tipo: TipoAtendimento) {
    if (!porteDefinidoPeloUsuario) {
      // sem porte não dá pra calcular preço nem reservar: pede a escolha ali mesmo
      setAvisoVeiculo(true);
      return;
    }
    setTipoAtendimento(tipo);
    setEtapa(etapaInicial(tipo, planoSelecionado, beneficioSelecionado, porteDefinidoPeloUsuario));
  }

  function escolherBeneficio(nome: string) {
    setBeneficioSelecionado(nome);
    setEtapa("horario");
  }

  /** Depois de escolher o veículo na etapa dedicada (inclusive quando voltou pra trocar). */
  function continuarAposVeiculo() {
    if (tipoAtendimento === "assinatura" && plano && servicosPorPlano[plano.id].length > 1) {
      setEtapa("beneficio");
    } else {
      setEtapa("horario");
    }
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
      const dados: { id: number; codigo: string; checkinUrl?: string } = await resposta.json();
      setReserva(dados);
      lembrarBuscaPitPass({ telefone });
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
    setTrocandoVeiculo(false);
    setBeneficiosPlanoAbertos(false);
    setDetalheBeneficio(null);
    setEtapa("tipo");
    reiniciarSelecao();
  }

  return (
    <section id="agendamento" className="bg-light px-6 py-16 md:py-24">
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
            Escolha como quer cuidar do seu carro e marque seu horário.
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

        <div className="rounded-sm border border-white/10 bg-panel p-5 sm:p-8">
          <div key={etapa} className="passo-entra">
          {etapa === "tipo" && (
            <div>
              {/* veículo primeiro: quem desceu a página pode ter esquecido o que escolheu lá em cima */}
              <div
                className={`rounded-sm border p-4 transition-colors duration-200 sm:p-5 ${
                  avisoVeiculo && !porteDefinidoPeloUsuario ? "border-gold/70 bg-gold/[0.04]" : "border-white/10"
                }`}
              >
                <h3 className="font-heading text-lg font-bold">Qual é o seu tipo de veículo?</h3>
                <VehicleSizeSelector className="mt-4" semTitulo exigirEscolha onEscolher={() => setAvisoVeiculo(false)} />
                {avisoVeiculo && !porteDefinidoPeloUsuario && (
                  <p role="alert" className="passo-entra mt-3 text-sm text-gold">
                    Escolha o tipo de veículo para continuar.
                  </p>
                )}
              </div>

              <h3 className="mt-7 font-heading text-xl font-bold">Como você quer agendar?</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => escolherTipo("avulso")}
                  className="rounded-sm border border-white/10 bg-asphalt p-5 text-left transition-colors duration-200 hover:border-gold sm:p-6"
                >
                  <span className="font-heading text-lg font-bold">Ducha Pitstop</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    {avulsosSelecionados.length > 0
                      ? `Sua Ducha com ${avulsosSelecionados.length} cuidado${
                          avulsosSelecionados.length > 1 ? "s" : ""
                        } que você já escolheu. Agora é só marcar o horário.`
                      : "Agende sua Ducha agora. Se quiser, você pode adicionar outros cuidados."}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => escolherTipo("assinatura")}
                  className="rounded-sm border border-white/10 bg-asphalt p-5 text-left transition-colors duration-200 hover:border-gold sm:p-6"
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

          {etapa === "veiculo" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual é o seu tipo de veículo?</h3>
              <p className="mt-1 text-sm text-text-secondary">
                O porte define o valor do seu cuidado. Você pode trocar depois.
              </p>
              <VehicleSizeSelector
                className="mt-6"
                semTitulo
                exigirEscolha
                onEscolher={continuarAposVeiculo}
              />
              <button
                type="button"
                onClick={() => setEtapa(tipoAtendimento === "assinatura" ? "plano" : "tipo")}
                className="mt-6 rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
              >
                Voltar
              </button>
            </div>
          )}

          {etapa === "beneficio" && plano && (
            <div>
              <h3 className="font-heading text-xl font-bold">O que você quer usar?</h3>
              <p className="mt-1 mb-5 text-sm text-text-secondary">
                Plano: <span className="text-gold">{plano.nome}</span> · {porte.nome}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {servicosPorPlano[plano.id].map((nome) => {
                  const regra = regrasBeneficios[plano.id][nome];
                  const lavagem = lavagensPlano[nome];
                  return (
                    <div
                      key={nome}
                      className="flex flex-col rounded-sm border border-white/10 bg-asphalt transition-colors duration-200 hover:border-gold/60"
                    >
                      <button
                        type="button"
                        onClick={() => escolherBeneficio(nome)}
                        className="flex flex-col p-4 text-left sm:p-5"
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="font-heading text-base font-bold">{nome}</span>
                          {regra && (
                            <span className="shrink-0 rounded-sm bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                              {formatarRegraBeneficio(regra)}
                            </span>
                          )}
                        </div>
                        {lavagem?.shortDescription && (
                          <p className="mt-1.5 line-clamp-3 text-sm text-text-secondary">{lavagem.shortDescription}</p>
                        )}
                        {lavagem?.nivel && <NivelCuidado nivel={lavagem.nivel} className="mt-3" />}
                        <span className="mt-4 font-mono text-[11px] uppercase tracking-widest text-gold">
                          Usar este benefício →
                        </span>
                      </button>

                      {lavagem && (
                        <button
                          type="button"
                          onClick={() => setDetalheBeneficio(nome)}
                          aria-haspopup="dialog"
                          className="mt-auto border-t border-white/[0.07] px-4 py-3.5 text-left font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:text-gold sm:px-5"
                        >
                          Ver o que inclui
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-sm border border-white/10 bg-asphalt">
                <button
                  type="button"
                  onClick={() => setBeneficiosPlanoAbertos((v) => !v)}
                  aria-expanded={beneficiosPlanoAbertos}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    Seu {plano.nome}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                    {beneficiosPlanoAbertos ? "Mostrar menos ↑" : "Ver benefícios +"}
                  </span>
                </button>
                <div className="colapsavel" data-aberto={beneficiosPlanoAbertos} inert={!beneficiosPlanoAbertos}>
                  <div>
                    <ul className="space-y-1 px-4 pb-4 text-sm text-text-secondary">
                      {plano.beneficios.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEtapa("veiculo")}
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
                    ·{" "}
                    <span key={totalAvulso} className="valor-atualiza">
                      {formatarPreco(totalAvulso)}
                    </span>
                  </>
                )}
                {tipoAtendimento === "assinatura" && plano && (
                  <>
                    Plano: <span className="text-gold">{plano.nome}</span>
                    {beneficioSelecionado && <> · {beneficioSelecionado}</>}
                  </>
                )}
              </p>

              {/* veículo já escolhido: sempre visível e alterável sem voltar etapas */}
              <div className="mb-6 rounded-sm border border-white/10 bg-asphalt px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                      Veículo
                    </span>
                    <span className="ml-2 font-heading font-bold">{porte.nome}</span>
                    <span className="ml-1.5 font-mono text-xs uppercase text-text-secondary">· {porte.descricao}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setTrocandoVeiculo((v) => !v)}
                    aria-expanded={trocandoVeiculo}
                    className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-gold underline-offset-4 hover:underline"
                  >
                    {trocandoVeiculo ? "Fechar" : "Alterar"}
                  </button>
                </div>
                <div className="colapsavel" data-aberto={trocandoVeiculo} inert={!trocandoVeiculo}>
                  <div>
                    <VehicleSizeSelector
                      className="pt-4"
                      semTitulo
                      exigirEscolha
                      onEscolher={() => setTrocandoVeiculo(false)}
                    />
                  </div>
                </div>
              </div>

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
                          : "veiculo"
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
                    <h3 className="font-heading text-2xl font-bold">Seu Pitstop está marcado.</h3>
                    <p className="mt-1 text-sm text-text-secondary">Agora deixa o cuidado com a gente.</p>

                    <div className="mt-6">
                      <PitPass
                        checkinUrl={reserva.checkinUrl}
                        tipoAtendimento={tipoAtendimento ?? "avulso"}
                        planoId={plano?.id}
                        nome={nome}
                        carro={carro}
                        porteNome={porte.nome}
                        dataIso={slotSelecionado.dia}
                        horario={slotSelecionado.hora}
                        servicos={servicosPitpass}
                        beneficio={tipoAtendimento === "assinatura" ? beneficioSelecionado : null}
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

                    <div className="mx-auto mt-6 grid max-w-[22rem] grid-cols-2 gap-3">
                      <a
                        href={linkComoChegar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110 active:scale-[0.985]"
                      >
                        Como chegar
                      </a>
                      <a
                        href={linkWhatsapp(mensagemWhats)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-white/15 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold active:scale-[0.985]"
                      >
                        Falar com a PitStop
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={novoAgendamento}
                      className="mt-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary underline-offset-4 transition hover:text-gold hover:underline"
                    >
                      Fazer novo agendamento
                    </button>
                  </>
                );
              })()}
            </div>
          )}
          </div>
        </div>

        {/* ficha técnica do benefício: o assinante relembra a diferença antes de agendar */}
        <FichaTecnicaSheet
          ficha={fichaBeneficio}
          etiqueta={plano ? `Plano ${plano.nome}` : undefined}
          nivel={fichaBeneficio?.nivel}
          tituloInclui="O que inclui"
          incluiTudoDe={fichaBeneficio?.incluiTudoDe}
          diferencial={fichaBeneficio?.diferencial}
          valor={
            regraFichaBeneficio && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                  No seu plano
                </span>
                <span className="font-heading text-sm font-bold tracking-[0.14em] text-gold">
                  {formatarRegraBeneficio(regraFichaBeneficio)}
                </span>
              </>
            )
          }
          acao={
            <button
              type="button"
              onClick={() => {
                if (!detalheBeneficio) return;
                setDetalheBeneficio(null);
                escolherBeneficio(detalheBeneficio);
              }}
              className="w-full rounded-sm bg-gold py-4 font-heading text-sm font-bold tracking-[0.12em] text-asphalt transition hover:brightness-110"
            >
              Usar este benefício
            </button>
          }
          onFechar={() => setDetalheBeneficio(null)}
        />

        {etapa !== "confirmacao" && (
          <div className="mt-5 flex flex-col gap-3 rounded-sm border border-black/10 bg-light-panel/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-sm font-bold text-light-text">Já tem um agendamento?</p>
              <p className="text-sm text-light-text-secondary">Reencontre seu PitPass e o QR de chegada.</p>
            </div>
            <button
              type="button"
              onClick={abrirMeuPitPass}
              className="shrink-0 rounded-md border border-light-text px-5 py-2.5 font-heading text-sm font-semibold tracking-wide text-light-text transition-colors duration-200 hover:bg-light-text hover:text-light"
            >
              Encontrar meu PitPass
            </button>
          </div>
        )}
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
