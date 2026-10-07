"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  CategoriaVeiculo,
  PlanoId,
  Servico,
  lavagensPlano,
  regrasBeneficios,
  formatarRegraBeneficio,
  listaPortesVeiculo,
  rotuloCategoriaVeiculo,
  precoServico,
  tipoDaCategoria,
  categoriasCuidado,
  etapasAgendamento,
  horariosAgendamento,
  linkWhatsapp,
  linkComoChegar,
} from "@/lib/data";
import {
  adicionaisPara,
  duracaoTotal,
  formatarDuracao,
  itemDoBeneficio,
  planosPara,
  recomendarAdicional,
  servicoBase,
} from "@/lib/catalogo";
import { proximasDatasUteis, paraIso, formatarDataCurta, situacaoDoHorario, SituacaoHorario } from "@/lib/agenda";
import type { Ocupacao } from "@/lib/disponibilidade";
import type { AssinantePublico } from "@/lib/assinante";
import { mensagemAgendamentoAvulso, mensagemAgendamentoPitPass } from "@/lib/whatsapp";
import { formatarTelefone, telefoneValido } from "@/lib/format";
import { useSelection, TipoAtendimento } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import DateTimePicker from "./DateTimePicker";
import PitPass from "./PitPass";
import Bolt from "./Bolt";
import Preco from "./Preco";
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import AddonOptionCard from "./AddonOptionCard";
import FichaTecnicaSheet from "./FichaTecnicaSheet";
import NivelCuidado from "./NivelCuidado";
import { abrirMeuPitPass, lembrarBuscaPitPass, whatsappLembrado } from "./MeuPitPass";

/**
 * Agendamento público.
 *
 * Ducha:      tipo → veículo → adicionais → resumo (com duração) → horário → ficha → PitPass
 * Assinante:  tipo → WhatsApp → (cadastro, só na 1ª vez) → benefício → horário → confirmação → PitPass
 *
 * O horário só é escolhido depois que o atendimento está montado: a agenda precisa da duração
 * inteira pra saber onde ele cabe.
 */
type Etapa =
  | "tipo"
  | "veiculo"
  | "adicionais"
  | "resumo"
  | "whatsapp"
  | "cadastro"
  | "beneficio"
  | "horario"
  | "ficha"
  | "confirmacao";

/** Etapas antes do horário: uma escolha feita na landing (plano, "Agendar Ducha") ainda redireciona. */
const etapasDeMontagem: Etapa[] = ["tipo", "veiculo", "adicionais", "resumo", "whatsapp", "cadastro", "beneficio"];

interface Slot {
  dia: string;
  hora: string;
}

const botaoVoltar =
  "rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold";
const botaoPrincipal =
  "flex-1 rounded-sm bg-gold py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40";
const rotuloBloco = "font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary";

export default function BookingFlow() {
  const {
    catalogo,
    motoDisponivel,
    tipoAtendimento,
    setTipoAtendimento,
    avulsosSelecionados,
    alternarAvulso,
    planoSelecionado,
    categoriaVeiculo,
    porteDefinidoPeloUsuario,
    reiniciarSelecao,
  } = useSelection();

  const [etapa, setEtapa] = useState<Etapa>("tipo");
  const [avisoVeiculo, setAvisoVeiculo] = useState(false);
  const [reserva, setReserva] = useState<{ id: number; codigo: string; checkinUrl?: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ficha (Ducha) e cadastro PitPass
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carro, setCarro] = useState("");
  const [placa, setPlaca] = useState("");

  // assinante
  const [assinante, setAssinante] = useState<AssinantePublico | null>(null);
  const [beneficioSelecionado, setBeneficioSelecionado] = useState<string | null>(null);
  const [detalheBeneficio, setDetalheBeneficio] = useState<string | null>(null);
  const [categoriaCadastro, setCategoriaCadastro] = useState<CategoriaVeiculo | null>(null);
  const [planoCadastro, setPlanoCadastro] = useState<PlanoId | null>(null);

  // Ducha + adicionais
  const [fichaAdicional, setFichaAdicional] = useState<Servico | null>(null);
  /** Uma sugestão por agendamento: aceita ou dispensada, não volta a aparecer. */
  const [recomendacaoEncerrada, setRecomendacaoEncerrada] = useState(false);

  // agenda
  const datasRapidas = useMemo(() => proximasDatasUteis(6), []);
  const [dataSelecionadaIso, setDataSelecionadaIso] = useState(() => paraIso(datasRapidas[0]));
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [ocupacao, setOcupacao] = useState<Ocupacao[]>([]);
  const [bufferMin, setBufferMin] = useState(catalogo.bufferMin);

  function carregarAgenda() {
    fetch("/api/agendamentos")
      .then((r) => r.json())
      .then((dados: { ocupados: Ocupacao[]; bufferMin: number }) => {
        setOcupacao(dados.ocupados ?? []);
        setBufferMin(dados.bufferMin ?? 0);
      })
      .catch(() => {});
  }

  // a agenda é consultada de novo sempre que o cliente chega na escolha do horário
  useEffect(() => {
    if (etapa === "tipo" || etapa === "horario") carregarAgenda();
  }, [etapa]);

  const ehAssinatura = tipoAtendimento === "assinatura";
  const base = servicoBase(catalogo, categoriaVeiculo);
  const adicionaisDisponiveis = useMemo(() => adicionaisPara(catalogo, categoriaVeiculo, true), [catalogo, categoriaVeiculo]);
  const itemBeneficio = itemDoBeneficio(catalogo, beneficioSelecionado);

  const precoBase = base ? (precoServico(base, categoriaVeiculo) ?? 0) : 0;
  const adicionaisAvaliacao = avulsosSelecionados.filter((s) => s.requiresEvaluation);
  const totalAvulso =
    precoBase + avulsosSelecionados.reduce((soma, s) => soma + (precoServico(s, categoriaVeiculo) ?? 0), 0);

  // duração REAL estimada: soma das durações configuradas; null se alguma ainda não foi definida
  const duracaoMin = ehAssinatura
    ? itemBeneficio
      ? duracaoTotal([itemBeneficio])
      : null
    : base
    ? duracaoTotal([base, ...avulsosSelecionados])
    : null;

  const recomendacao =
    !recomendacaoEncerrada && base
      ? recomendarAdicional([base.id, ...avulsosSelecionados.map((s) => s.id)], adicionaisDisponiveis)
      : null;

  function situacaoDe(dia: string, hora: string): SituacaoHorario {
    return situacaoDoHorario({
      horario: hora,
      duracaoMin,
      bufferMin,
      ocupados: ocupacao.filter((o) => o.dia === dia),
    });
  }
  // se o atendimento mudou (mais um adicional) e o horário escolhido deixou de comportar, ele cai
  const slot = slotSelecionado && situacaoDe(slotSelecionado.dia, slotSelecionado.hora) === "livre" ? slotSelecionado : null;

  const plano = assinante ? catalogo.planos[assinante.planoId] : null;
  const nomeNoPitPass = ehAssinatura ? (assinante?.primeiroNome ?? "") : nome;
  const carroNoPitPass = ehAssinatura ? (assinante?.veiculo ?? "") : carro;
  const porteNome = rotuloCategoriaVeiculo(ehAssinatura ? assinante?.categoria : categoriaVeiculo);
  const fichaValida = nome.trim().length > 1 && telefoneValido(telefone) !== null && carro.trim().length > 0;

  const fichaBeneficio = detalheBeneficio ? (lavagensPlano[detalheBeneficio] ?? null) : null;
  const regraFichaBeneficio = plano && detalheBeneficio ? regrasBeneficios[plano.id][detalheBeneficio] : null;

  /** Depois do veículo definido: adicionais, ou direto o resumo se não houver o que adicionar. */
  function etapaDaDucha(): Etapa {
    if (!porteDefinidoPeloUsuario) return "veiculo";
    return avulsosSelecionados.length > 0 || adicionaisDisponiveis.length === 0 ? "resumo" : "adicionais";
  }

  // escolha feita fora daqui (card de plano, "Agendar Ducha" do configurador) leva à etapa certa
  useEffect(() => {
    if (!tipoAtendimento || !etapasDeMontagem.includes(etapa)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza a etapa com uma escolha feita em outra seção da landing
    setEtapa(tipoAtendimento === "avulso" ? etapaDaDucha() : assinante ? "beneficio" : "whatsapp");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoAtendimento, planoSelecionado]);

  const indiceVisivel: Record<Etapa, number> = {
    tipo: 0,
    veiculo: 1,
    adicionais: 1,
    resumo: 1,
    whatsapp: 1,
    cadastro: 1,
    beneficio: 1,
    horario: 2,
    ficha: 3,
    confirmacao: 4,
  };
  const passos = etapasAgendamento.map((label, i) =>
    ehAssinatura ? (i === 1 ? "PitPass" : i === 3 ? "Confirmação" : label) : label
  );

  function escolherTipo(tipo: TipoAtendimento) {
    setErro(null);
    if (tipo === "assinatura") {
      // assinante não informa veículo aqui: o WhatsApp traz o cadastro
      if (!telefone) setTelefone(whatsappLembrado());
      setTipoAtendimento(tipo);
      setEtapa(assinante ? "beneficio" : "whatsapp");
      return;
    }
    if (!porteDefinidoPeloUsuario) {
      // sem veículo não dá pra calcular preço nem duração: pede a escolha ali mesmo
      setAvisoVeiculo(true);
      return;
    }
    setTipoAtendimento(tipo);
    setEtapa(etapaDaDucha());
  }

  async function identificarAssinante() {
    if (!telefoneValido(telefone)) {
      setErro("Confira o WhatsApp, com DDD.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/assinante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErro(corpo?.erro ?? "Não foi possível buscar agora. Tente novamente.");
        return;
      }
      if (corpo.encontrado) {
        setAssinante(corpo.assinante);
        setBeneficioSelecionado(null);
        lembrarBuscaPitPass({ telefone });
        setEtapa("beneficio");
        return;
      }
      // primeira vez: abre o cadastro já com o que a pessoa escolheu na landing
      const planoDaLanding = planoSelecionado ? catalogo.planos[planoSelecionado] : null;
      setCategoriaCadastro(
        planoDaLanding?.tipoVeiculo === "moto" ? "MOTO" : porteDefinidoPeloUsuario ? categoriaVeiculo : null
      );
      setPlanoCadastro(planoSelecionado);
      setEtapa("cadastro");
    } catch {
      setErro("Não foi possível buscar agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function salvarCadastro() {
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/assinante/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          nome,
          modelo: carro,
          placa,
          categoria: categoriaCadastro,
          planoId: planoCadastro,
        }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErro(corpo?.erro ?? "Não foi possível salvar o cadastro. Tente novamente.");
        return;
      }
      setAssinante(corpo.assinante);
      setBeneficioSelecionado(null);
      lembrarBuscaPitPass({ telefone });
      setEtapa("beneficio");
    } catch {
      setErro("Não foi possível salvar o cadastro. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function escolherBeneficio(beneficio: string) {
    setBeneficioSelecionado(beneficio);
    setErro(null);
    setEtapa("horario");
  }

  function trocarData(iso: string) {
    setDataSelecionadaIso(iso);
    setSlotSelecionado(null);
  }

  async function confirmar() {
    if (!slot || !tipoAtendimento) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          ehAssinatura
            ? // assinante: o servidor busca nome, veículo, placa e plano pelo WhatsApp
              { tipoAtendimento, telefone, servicoPlano: beneficioSelecionado, dia: slot.dia, horario: slot.hora }
            : {
                tipoAtendimento,
                nome,
                telefone,
                carro,
                placa,
                categoriaVeiculo,
                avulsosIds: avulsosSelecionados.map((s) => s.id),
                dia: slot.dia,
                horario: slot.hora,
              }
        ),
      });
      if (resposta.status === 409) {
        // outro cliente ocupou (parte d)esse intervalo enquanto este escolhia
        const corpo = await resposta.json().catch(() => null);
        carregarAgenda();
        setSlotSelecionado(null);
        setErro(
          corpo?.erro === "Horário já reservado"
            ? "Esse horário acabou de ser reservado por outra pessoa. Escolha outro."
            : (corpo?.erro ?? "Esse horário não está mais disponível. Escolha outro.")
        );
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
      setSlotSelecionado(slot);
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
    setAssinante(null);
    setBeneficioSelecionado(null);
    setDetalheBeneficio(null);
    setCategoriaCadastro(null);
    setPlanoCadastro(null);
    setRecomendacaoEncerrada(false);
    setReserva(null);
    setErro(null);
    setEtapa("tipo");
    reiniciarSelecao();
  }

  const resumoDoAtendimento = ehAssinatura ? (
    <>
      PitPass <span className="text-gold">{plano?.nome}</span>
      {beneficioSelecionado && <> · {beneficioSelecionado}</>}
    </>
  ) : (
    <>
      <span className="text-gold">
        {base?.nome}
        {avulsosSelecionados.length > 0 &&
          ` + ${avulsosSelecionados.length} cuidado${avulsosSelecionados.length > 1 ? "s" : ""}`}
      </span>{" "}
      ·{" "}
      <span key={totalAvulso} className="valor-atualiza">
        <Preco valor={totalAvulso} className="text-sm text-text-primary" />
      </span>
    </>
  );

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
            Escolha como quer cuidar do seu {motoDisponivel ? "veículo" : "carro"} e marque seu horário.
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
                <h3 className="font-heading text-lg font-bold">
                  {motoDisponivel ? "Qual é o seu veículo?" : "Qual é o seu tipo de veículo?"}
                </h3>
                <VehicleSizeSelector className="mt-4" semTitulo exigirEscolha onEscolher={() => setAvisoVeiculo(false)} />
                {avisoVeiculo && !porteDefinidoPeloUsuario && (
                  <p role="alert" className="passo-entra mt-3 text-sm text-gold">
                    Escolha o veículo para continuar.
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
                  <span className="font-heading text-lg font-bold">{base?.nome ?? "Ducha Pitstop"}</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    {avulsosSelecionados.length > 0
                      ? `Sua Ducha com ${avulsosSelecionados.length} cuidado${
                          avulsosSelecionados.length > 1 ? "s" : ""
                        } que você já escolheu. Confira e marque o horário.`
                      : "Monte seu atendimento: comece pela Ducha e, se quiser, adicione outros cuidados."}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => escolherTipo("assinatura")}
                  className="rounded-sm border border-white/10 bg-asphalt p-5 text-left transition-colors duration-200 hover:border-gold sm:p-6"
                >
                  <span className="font-heading text-lg font-bold">Sou assinante</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    Tenho PitPass e quero usar um benefício. Só preciso do meu WhatsApp.
                  </p>
                </button>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("servicos")}
                className="mt-4 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline"
              >
                Ou ver os serviços primeiro
              </button>
            </div>
          )}

          {etapa === "veiculo" && (
            <div>
              <h3 className="font-heading text-xl font-bold">
                {motoDisponivel ? "Qual é o seu veículo?" : "Qual é o seu tipo de veículo?"}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                O veículo define os serviços, o valor e o tempo do seu cuidado. Você pode trocar depois.
              </p>
              <VehicleSizeSelector
                className="mt-6"
                semTitulo
                exigirEscolha
                onEscolher={(categoria) =>
                  // o contexto só atualiza no próximo render: decide pela categoria recém-escolhida
                  setEtapa(adicionaisPara(catalogo, categoria, true).length > 0 ? "adicionais" : "resumo")
                }
              />
              <button type="button" onClick={() => setEtapa("tipo")} className={`mt-6 ${botaoVoltar}`}>
                Voltar
              </button>
            </div>
          )}

          {etapa === "adicionais" && base && (
            <div>
              <h3 className="font-heading text-xl font-bold">Quer adicionar algum cuidado?</h3>
              <p className="mt-1 text-sm text-text-secondary">
                A {base.nome} já está no seu atendimento. Adicione o que fizer sentido, ou siga só com ela.
              </p>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-sm border border-gold/40 bg-gold/[0.07] px-4 py-3.5">
                <span>
                  <span className="block font-heading text-sm font-bold text-gold">{base.nome}</span>
                  <span className={rotuloBloco}>
                    {porteNome}
                    {base.duracaoMin ? ` · ${formatarDuracao(base.duracaoMin)}` : ""}
                  </span>
                </span>
                <Preco valor={precoBase} className="text-lg text-gold" />
              </div>

              <p className={`mt-7 ${rotuloBloco}`}>Adicionais</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {adicionaisDisponiveis.map((servico) => (
                  <AddonOptionCard
                    key={servico.id}
                    servico={servico}
                    preco={precoServico(servico, categoriaVeiculo)}
                    selecionado={avulsosSelecionados.some((s) => s.id === servico.id)}
                    onToggle={() => alternarAvulso(servico)}
                    onDetalhes={() => setFichaAdicional(servico)}
                  />
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setEtapa("tipo")} className={botaoVoltar}>
                  Voltar
                </button>
                <button type="button" onClick={() => setEtapa("resumo")} className={botaoPrincipal}>
                  {avulsosSelecionados.length > 0 ? "Ver meu Pitstop" : "Seguir só com a Ducha"}
                </button>
              </div>
            </div>
          )}

          {etapa === "resumo" && base && (
            <div>
              <h3 className="font-heading text-xs font-bold tracking-[0.22em] text-gold">Seu Pitstop</h3>
              <p className="mt-1.5 text-sm text-text-secondary">
                {porteNome} ·{" "}
                <button
                  type="button"
                  onClick={() => setEtapa("veiculo")}
                  className="text-text-secondary underline underline-offset-4 hover:text-gold"
                >
                  trocar veículo
                </button>
              </p>

              <ul className="mt-4 divide-y divide-white/[0.07]">
                <LinhaResumo nome={base.nome} duracaoMin={base.duracaoMin} preco={precoBase} />
                {avulsosSelecionados.map((s) => (
                  <LinhaResumo
                    key={s.id}
                    nome={s.nome}
                    duracaoMin={s.duracaoMin}
                    adicional
                    preco={precoServico(s, categoriaVeiculo)}
                    onRemover={() => alternarAvulso(s)}
                  />
                ))}
              </ul>

              {/* estimativa só com todas as durações definidas: nunca uma soma pela metade */}
              {duracaoMin != null && (
                <div className="flex items-baseline justify-between gap-4 border-t border-white/[0.07] py-3 text-sm">
                  <span className="text-text-secondary">Estimativa</span>
                  <span key={duracaoMin} className="valor-atualiza font-mono text-text-primary">
                    {formatarDuracao(duracaoMin)}
                  </span>
                </div>
              )}

              <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-5">
                <span className="font-heading text-sm font-bold tracking-[0.18em] text-text-secondary">Total</span>
                <span aria-live="polite">
                  <span key={totalAvulso} className="valor-atualiza">
                    <Preco valor={totalAvulso} className="text-4xl text-gold" />
                  </span>
                </span>
              </div>
              {adicionaisAvaliacao.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                  + avaliação solicitada para {adicionaisAvaliacao.map((s) => s.nome).join(", ")}. O valor não entra
                  no total: nossa equipe define com você.
                </p>
              )}

              {recomendacao && (
                <aside
                  aria-label="Complete seu cuidado"
                  className="passo-entra mt-6 rounded-sm border border-white/10 bg-asphalt p-4 sm:p-5"
                >
                  <p className={rotuloBloco}>Complete seu cuidado</p>
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-heading text-base font-bold">{recomendacao.item.nome}</p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{recomendacao.motivo}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Preco
                        valor={precoServico(recomendacao.item, categoriaVeiculo) ?? 0}
                        className="text-lg text-text-primary"
                      />
                      {recomendacao.item.duracaoMin ? (
                        <p className={`mt-0.5 ${rotuloBloco}`}>+ {formatarDuracao(recomendacao.item.duracaoMin)}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        alternarAvulso(recomendacao.item);
                        setRecomendacaoEncerrada(true);
                      }}
                      className="rounded-sm border border-gold px-5 py-2.5 font-heading text-sm font-semibold tracking-wide text-gold transition hover:bg-gold hover:text-asphalt"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecomendacaoEncerrada(true)}
                      className="py-2 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                    >
                      Agora não
                    </button>
                    <button
                      type="button"
                      onClick={() => setFichaAdicional(recomendacao.item)}
                      aria-haspopup="dialog"
                      className="py-2 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline sm:ml-auto"
                    >
                      Ver o que inclui
                    </button>
                  </div>
                </aside>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEtapa(adicionaisDisponiveis.length > 0 ? "adicionais" : "tipo")}
                  className={botaoVoltar}
                >
                  {adicionaisDisponiveis.length > 0 ? "Editar" : "Voltar"}
                </button>
                <button type="button" onClick={() => setEtapa("horario")} className={botaoPrincipal}>
                  Escolher data e horário
                </button>
              </div>
            </div>
          )}

          {etapa === "whatsapp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                identificarAssinante();
              }}
            >
              <h3 className="font-heading text-xl font-bold">Sou assinante</h3>
              <p className="mt-1 text-sm text-text-secondary">Informe o WhatsApp do seu PitPass.</p>

              <label className="mt-6 block">
                <span className="mb-1 block text-xs text-text-secondary">WhatsApp</span>
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="campo text-base"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(84) 9 0000-0000"
                />
              </label>

              {erro && <p role="alert" className="mt-4 text-sm text-red-400">{erro}</p>}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErro(null);
                    setEtapa("tipo");
                  }}
                  className={botaoVoltar}
                >
                  Voltar
                </button>
                <button type="submit" disabled={enviando} className={botaoPrincipal}>
                  {enviando ? "Buscando..." : "Continuar"}
                </button>
              </div>
            </form>
          )}

          {etapa === "cadastro" && (
            <FormCadastro
              telefone={telefone}
              nome={nome}
              setNome={setNome}
              carro={carro}
              setCarro={setCarro}
              placa={placa}
              setPlaca={setPlaca}
              categoria={categoriaCadastro}
              setCategoria={(categoria) => {
                setCategoriaCadastro(categoria);
                // plano de carro não vale pra moto (e vice-versa)
                if (planoCadastro && catalogo.planos[planoCadastro].tipoVeiculo !== tipoDaCategoria(categoria)) {
                  setPlanoCadastro(null);
                }
              }}
              planoId={planoCadastro}
              setPlanoId={setPlanoCadastro}
              planos={categoriaCadastro ? planosPara(catalogo, tipoDaCategoria(categoriaCadastro), true) : []}
              permitirMoto={motoDisponivel && planosPara(catalogo, "moto", true).length > 0}
              erro={erro}
              enviando={enviando}
              onVoltar={() => {
                setErro(null);
                setEtapa("whatsapp");
              }}
              onEnviar={salvarCadastro}
            />
          )}

          {etapa === "beneficio" && assinante && plano && (
            <div>
              <div className="rounded-sm border border-gold/40 bg-gold/[0.05] p-4 sm:p-5">
                <p className="font-heading text-xl font-bold">Olá, {assinante.primeiroNome}</p>
                <p className="mt-1 font-heading text-sm font-bold tracking-[0.18em] text-white">
                  PITPASS <span className="text-gold">• {plano.nome.toUpperCase()}</span>
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
                  <SpecItem label="Veículo" valor={assinante.veiculo} />
                  <SpecItem label={assinante.categoria === "MOTO" ? "Tipo" : "Porte"} valor={porteNome} />
                </dl>
                {assinante.pendente && (
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                    Cadastro recebido. A recepção confirma o seu plano na chegada.
                  </p>
                )}
              </div>

              <h3 className="mt-7 font-heading text-xl font-bold">O que você quer usar hoje?</h3>
              {erro && <p role="alert" className="mt-3 text-sm text-red-400">{erro}</p>}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {assinante.beneficios.map((b) => {
                  const lavagem = lavagensPlano[b.nome];
                  const duracao = itemDoBeneficio(catalogo, b.nome)?.duracaoMin;
                  return (
                    <div
                      key={b.nome}
                      className={`flex flex-col rounded-sm border border-white/10 bg-asphalt transition-colors duration-200 ${
                        b.disponivel ? "hover:border-gold/60" : "opacity-60"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!b.disponivel}
                        onClick={() => escolherBeneficio(b.nome)}
                        className="flex flex-col p-4 text-left disabled:cursor-not-allowed sm:p-5"
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <span className="font-heading text-base font-bold">{b.nome}</span>
                          <span className="shrink-0 rounded-sm bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                            {b.regra}
                          </span>
                        </div>
                        {b.descricao && <p className="mt-1.5 line-clamp-3 text-sm text-text-secondary">{b.descricao}</p>}
                        {lavagem?.nivel && <NivelCuidado nivel={lavagem.nivel} className="mt-3" />}
                        {duracao ? <span className={`mt-3 ${rotuloBloco}`}>{formatarDuracao(duracao)}</span> : null}
                        <span className="mt-4 font-mono text-[11px] uppercase tracking-widest text-gold">
                          {b.disponivel ? "Usar este benefício →" : (b.motivo ?? "Indisponível")}
                        </span>
                      </button>

                      {lavagem && (
                        <button
                          type="button"
                          onClick={() => setDetalheBeneficio(b.nome)}
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

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button type="button" onClick={() => setEtapa("tipo")} className={botaoVoltar}>
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssinante(null);
                    setBeneficioSelecionado(null);
                    setTelefone("");
                    setEtapa("whatsapp");
                  }}
                  className="py-2 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline"
                >
                  Não é você? Usar outro WhatsApp
                </button>
              </div>
            </div>
          )}

          {etapa === "horario" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Quando você quer vir?</h3>
              <p className="mt-1 text-sm text-text-secondary">{resumoDoAtendimento}</p>
              <p className="mb-6 mt-1 text-sm text-text-secondary">
                {porteNome}
                {duracaoMin != null && (
                  <>
                    {" "}
                    · duração estimada <span className="text-text-primary">{formatarDuracao(duracaoMin)}</span>. Só
                    aparecem livres os horários que comportam o atendimento inteiro.
                  </>
                )}
              </p>

              {erro && <p role="alert" className="mb-4 text-sm text-red-400">{erro}</p>}

              <DateTimePicker
                datasRapidas={datasRapidas}
                dataSelecionadaIso={dataSelecionadaIso}
                onSelecionarData={trocarData}
                horarios={horariosAgendamento}
                situacao={(hora) => situacaoDe(dataSelecionadaIso, hora)}
                horaSelecionada={slot?.dia === dataSelecionadaIso ? slot.hora : null}
                onSelecionarHora={(hora) => {
                  setSlotSelecionado({ dia: dataSelecionadaIso, hora });
                  setErro(null);
                }}
              />

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErro(null);
                    setEtapa(ehAssinatura ? "beneficio" : "resumo");
                  }}
                  className={botaoVoltar}
                >
                  Voltar
                </button>
                <button type="button" disabled={!slot} onClick={() => setEtapa("ficha")} className={botaoPrincipal}>
                  {slot ? `Continuar · ${formatarDataCurta(slot.dia)} ${slot.hora}` : "Selecione um horário"}
                </button>
              </div>
            </div>
          )}

          {etapa === "ficha" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ehAssinatura && !fichaValida) return;
                confirmar();
              }}
            >
              <h3 className="flex items-center gap-2 font-heading text-xl font-bold">
                {ehAssinatura ? "Confirme seu agendamento" : "Ficha técnica"} <Bolt className="h-4 w-4 text-gold" />
              </h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                {ehAssinatura
                  ? "Seus dados já estão no cadastro PitPass. É só confirmar."
                  : "Só o essencial pra gente te receber direito."}
              </p>

              <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm border border-white/10 bg-asphalt p-4 font-mono text-xs">
                {ehAssinatura && plano ? (
                  <>
                    <SpecItem label="Assinante" valor={assinante?.primeiroNome ?? ""} />
                    <SpecItem label="Plano" valor={`PitPass ${plano.nome}`} />
                    <SpecItem label="Benefício" valor={beneficioSelecionado ?? ""} />
                    <SpecItem label="Veículo" valor={`${assinante?.veiculo ?? ""} · ${porteNome}`} />
                  </>
                ) : (
                  <>
                    <SpecItem
                      label="Serviços"
                      valor={[base?.nome ?? "", ...avulsosSelecionados.map((s) => s.nome)].join(" + ")}
                      wide
                    />
                    <SpecItem label={categoriaVeiculo === "MOTO" ? "Veículo" : "Porte"} valor={porteNome} />
                  </>
                )}
                {duracaoMin != null && <SpecItem label="Duração estimada" valor={formatarDuracao(duracaoMin)} />}
                {slot && (
                  <>
                    <SpecItem label="Data" valor={formatarDataCurta(slot.dia)} />
                    <SpecItem label="Horário" valor={slot.hora} />
                  </>
                )}
              </div>

              {!ehAssinatura && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-secondary">Nome *</span>
                    <input required className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
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
                    <span className="mb-1 block text-xs text-text-secondary">
                      {categoriaVeiculo === "MOTO" ? "Moto *" : "Carro *"}
                    </span>
                    <input
                      required
                      className="campo"
                      value={carro}
                      onChange={(e) => setCarro(e.target.value)}
                      placeholder={categoriaVeiculo === "MOTO" ? "Modelo da moto" : "Modelo do carro"}
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
              )}

              {erro && <p role="alert" className="mt-4 text-sm text-red-400">{erro}</p>}

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setEtapa("horario")} className={botaoVoltar}>
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={(!ehAssinatura && !fichaValida) || enviando || !slot}
                  className={botaoPrincipal}
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
                const servicosPitpass = ehAssinatura
                  ? [plano?.nome, beneficioSelecionado].filter((v): v is string => Boolean(v))
                  : [
                      base?.nome ?? "Ducha Pitstop",
                      ...avulsosSelecionados.filter((s) => !s.requiresEvaluation).map((s) => s.nome),
                    ];
                const comum = {
                  nome: nomeNoPitPass,
                  veiculo: carroNoPitPass,
                  porteNome,
                  dataIso: slotSelecionado.dia,
                  horario: slotSelecionado.hora,
                  codigo,
                };
                const mensagemWhats = ehAssinatura
                  ? mensagemAgendamentoPitPass({ ...comum, plano: plano?.nome ?? "", beneficio: beneficioSelecionado ?? "" })
                  : mensagemAgendamentoAvulso({ ...comum, servico: servicosPitpass.join(" + ") });

                return (
                  <>
                    <h3 className="font-heading text-2xl font-bold">Seu Pitstop está marcado.</h3>
                    <p className="mt-1 text-sm text-text-secondary">Agora deixa o cuidado com a gente.</p>

                    <div className="mt-6">
                      <PitPass
                        checkinUrl={reserva.checkinUrl}
                        tipoAtendimento={tipoAtendimento ?? "avulso"}
                        planoId={plano?.id}
                        nome={nomeNoPitPass}
                        carro={carroNoPitPass}
                        porteNome={porteNome}
                        dataIso={slotSelecionado.dia}
                        horario={slotSelecionado.hora}
                        servicos={servicosPitpass}
                        beneficio={ehAssinatura ? beneficioSelecionado : null}
                        codigo={codigo}
                      />
                    </div>

                    <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-text-secondary">
                      Na chegada, apresente o QR. A recepção confere a placa do veículo antes do check-in.
                    </p>

                    {!ehAssinatura && adicionaisAvaliacao.length > 0 && (
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

        {/* ficha técnica de um adicional (etapa de adicionais e recomendação) */}
        <FichaTecnicaSheet
          ficha={fichaAdicional}
          etiqueta={fichaAdicional?.categoria ? `Adicional · ${categoriasCuidado[fichaAdicional.categoria]}` : "Adicional"}
          onFechar={() => setFichaAdicional(null)}
          valor={
            fichaAdicional && (
              <>
                <span className={rotuloBloco}>
                  Valor{fichaAdicional.duracaoMin ? ` · + ${formatarDuracao(fichaAdicional.duracaoMin)}` : ""}
                </span>
                {precoServico(fichaAdicional, categoriaVeiculo) != null ? (
                  <Preco valor={precoServico(fichaAdicional, categoriaVeiculo) ?? 0} className="text-2xl text-gold" />
                ) : (
                  <span className="font-heading text-sm font-bold tracking-[0.14em] text-gold">Mediante avaliação</span>
                )}
              </>
            )
          }
          acao={
            fichaAdicional && (
              <button
                type="button"
                onClick={() => {
                  alternarAvulso(fichaAdicional);
                  if (recomendacao?.item.id === fichaAdicional.id) setRecomendacaoEncerrada(true);
                  setFichaAdicional(null);
                }}
                className={`w-full rounded-sm py-4 font-heading text-sm font-bold tracking-[0.12em] transition ${
                  avulsosSelecionados.some((s) => s.id === fichaAdicional.id)
                    ? "border border-white/20 text-text-primary hover:border-gold hover:text-gold"
                    : "bg-gold text-asphalt hover:brightness-110"
                }`}
              >
                {avulsosSelecionados.some((s) => s.id === fichaAdicional.id)
                  ? "Remover do meu Pitstop"
                  : "Adicionar ao meu Pitstop"}
              </button>
            )
          }
        />

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
                <span className={rotuloBloco}>No seu plano</span>
                <span className="font-heading text-sm font-bold tracking-[0.14em] text-gold">
                  {formatarRegraBeneficio(regraFichaBeneficio)}
                </span>
              </>
            )
          }
          acao={
            assinante?.beneficios.find((b) => b.nome === detalheBeneficio)?.disponivel && (
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
            )
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

/** Linha do "Seu Pitstop": serviço, duração (só quando definida) e valor. */
function LinhaResumo({
  nome,
  duracaoMin,
  preco,
  adicional = false,
  onRemover,
}: {
  nome: string;
  duracaoMin?: number;
  preco: number | null;
  adicional?: boolean;
  onRemover?: () => void;
}) {
  return (
    <li className="passo-entra flex items-start justify-between gap-4 py-3 text-sm">
      <span className="min-w-0">
        <span className={adicional ? "text-text-secondary" : "text-text-primary"}>{nome}</span>
        <span className={`mt-0.5 flex items-center gap-3 ${rotuloBloco}`}>
          {duracaoMin ? (
            <span>
              {adicional ? "+ " : ""}
              {formatarDuracao(duracaoMin)}
            </span>
          ) : null}
          {onRemover && (
            <button type="button" onClick={onRemover} className="underline underline-offset-4 hover:text-gold">
              Remover
            </button>
          )}
        </span>
      </span>
      {preco != null ? (
        <Preco valor={preco} className="text-base text-text-primary" />
      ) : (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gold">Avaliação solicitada</span>
      )}
    </li>
  );
}

function OpcaoCadastro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-sm border px-4 py-3 text-left transition-colors duration-200 ${
        ativo ? "border-gold bg-gold/[0.07]" : "border-white/10 bg-asphalt hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

/** Cadastro PitPass: aparece uma única vez, quando o WhatsApp ainda não tem cadastro. */
function FormCadastro({
  telefone,
  nome,
  setNome,
  carro,
  setCarro,
  placa,
  setPlaca,
  categoria,
  setCategoria,
  planoId,
  setPlanoId,
  planos,
  permitirMoto,
  erro,
  enviando,
  onVoltar,
  onEnviar,
}: {
  telefone: string;
  nome: string;
  setNome: (v: string) => void;
  carro: string;
  setCarro: (v: string) => void;
  placa: string;
  setPlaca: (v: string) => void;
  categoria: CategoriaVeiculo | null;
  setCategoria: (c: CategoriaVeiculo) => void;
  planoId: PlanoId | null;
  setPlanoId: (id: PlanoId) => void;
  planos: { id: PlanoId; nome: string; headline: string }[];
  permitirMoto: boolean;
  erro: string | null;
  enviando: boolean;
  onVoltar: () => void;
  onEnviar: () => void;
}) {
  const completo = nome.trim().length > 1 && carro.trim().length > 1 && placa.trim().length >= 7 && categoria && planoId;
  const ehMoto = categoria === "MOTO";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (completo) onEnviar();
      }}
    >
      <h3 className="font-heading text-xl font-bold">Vamos criar seu cadastro PitPass</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Você só precisa fazer isso uma vez. Nas próximas visitas, o seu WhatsApp já traz tudo.
      </p>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-3 rounded-sm border border-white/10 bg-asphalt px-4 py-3 text-sm">
        <span className={rotuloBloco}>WhatsApp</span>
        <span className="font-mono text-text-primary">{telefone}</span>
        <button
          type="button"
          onClick={onVoltar}
          className="ml-auto font-mono text-[11px] uppercase tracking-widest text-gold underline-offset-4 hover:underline"
        >
          Alterar
        </button>
      </p>

      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="mb-1 block text-xs text-text-secondary">Nome *</span>
          <input required autoFocus className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
        </label>

        <div>
          <span className="mb-2 block text-xs text-text-secondary">Veículo do plano *</span>
          <div className={`grid gap-3 ${permitirMoto ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {listaPortesVeiculo.map((porte) => (
              <OpcaoCadastro key={porte.id} ativo={categoria === porte.id} onClick={() => setCategoria(porte.id)}>
                <span className="block font-heading text-sm font-bold">{porte.nome}</span>
                <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">{porte.descricao}</span>
              </OpcaoCadastro>
            ))}
            {permitirMoto && (
              <OpcaoCadastro ativo={ehMoto} onClick={() => setCategoria("MOTO")}>
                <span className="block font-heading text-sm font-bold">Moto</span>
                <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">Motocicleta</span>
              </OpcaoCadastro>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Modelo *</span>
            <input
              required
              className="campo"
              value={carro}
              onChange={(e) => setCarro(e.target.value)}
              placeholder={ehMoto ? "Ex.: Honda CB 500F" : "Modelo do carro"}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-text-secondary">Placa *</span>
            <input
              required
              className="campo font-mono uppercase"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              maxLength={8}
            />
            <span className="mt-1 block text-xs text-text-secondary">A recepção confere a placa na chegada.</span>
          </label>
        </div>

        {categoria && (
          <div className="passo-entra">
            <span className="mb-2 block text-xs text-text-secondary">Seu plano *</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {planos.map((p) => (
                <OpcaoCadastro key={p.id} ativo={planoId === p.id} onClick={() => setPlanoId(p.id)}>
                  <span className="block font-heading text-sm font-bold uppercase tracking-wide">{p.nome}</span>
                </OpcaoCadastro>
              ))}
            </div>
          </div>
        )}
      </div>

      {erro && <p role="alert" className="mt-4 text-sm text-red-400">{erro}</p>}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onVoltar} className={botaoVoltar}>
          Voltar
        </button>
        <button type="submit" disabled={!completo || enviando} className={botaoPrincipal}>
          {enviando ? "Salvando..." : "Salvar meu cadastro"}
        </button>
      </div>
    </form>
  );
}
