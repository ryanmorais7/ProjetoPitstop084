"use client";

import { useEffect, useState } from "react";
import {
  avulsos,
  planos,
  listaPlanos,
  PlanoId,
  servicosPlanoDiamante,
  etapasAgendamento,
  diasAgendamento,
  horariosAgendamento,
  horariosIndisponiveisMock,
  linkWhatsapp,
  AvulsoServico,
} from "@/lib/data";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { useSelection, TipoAtendimento } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import PlanoCard from "./PlanoCard";
import Bolt from "./Bolt";

type Etapa =
  | "tipo"
  | "servico"
  | "plano"
  | "categoria"
  | "servicoPlano"
  | "horario"
  | "ficha"
  | "confirmacao";

interface Slot {
  dia: string;
  hora: string;
}

const diaAbreviado: Record<string, string> = {
  Segunda: "Seg",
  Terça: "Ter",
  Quarta: "Qua",
  Quinta: "Qui",
  Sexta: "Sex",
  Sábado: "Sáb",
};

function etapaInicial(
  tipo: TipoAtendimento | null,
  avulso: AvulsoServico | null,
  planoId: PlanoId | null,
  categoriaVeiculo: string | null,
  servicoPlano: string | null
): Etapa {
  if (tipo === "avulso" && avulso) return "horario";
  if (tipo === "assinatura" && planoId) {
    const precisaCategoria = !!planos[planoId].categorias?.length;
    if (precisaCategoria && !categoriaVeiculo) return "categoria";
    if (!servicoPlano) return "servicoPlano";
    return "horario";
  }
  if (tipo === "assinatura") return "plano";
  if (tipo === "avulso") return "servico";
  return "tipo";
}

export default function BookingFlow() {
  const {
    tipoAtendimento,
    setTipoAtendimento,
    avulsoSelecionado,
    selecionarAvulso,
    planoSelecionado,
    selecionarPlano,
    categoriaVeiculo,
    setCategoriaVeiculo,
    reiniciarSelecao,
  } = useSelection();

  const [servicoPlano, setServicoPlano] = useState<string | null>(null);
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [etapa, setEtapa] = useState<Etapa>(() =>
    etapaInicial(tipoAtendimento, avulsoSelecionado, planoSelecionado, categoriaVeiculo, servicoPlano)
  );
  const [diaSelecionadoDia, setDiaSelecionadoDia] = useState(diasAgendamento[0]);
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carro, setCarro] = useState("");
  const [placa, setPlaca] = useState("");
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/agendamentos")
      .then((r) => r.json())
      .then((data: { ocupados: { dia: string; horario: string }[] }) => {
        setOcupados(new Set(data.ocupados.map((o) => `${o.dia}-${o.horario}`)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const alvo = etapaInicial(
      tipoAtendimento,
      avulsoSelecionado,
      planoSelecionado,
      categoriaVeiculo,
      servicoPlano
    );
    if (alvo !== "tipo" && (etapa === "tipo" || etapa === "servico" || etapa === "plano")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza a etapa quando o serviço/plano é escolhido em outra seção da página
      setEtapa(alvo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoAtendimento, avulsoSelecionado, planoSelecionado, categoriaVeiculo]);

  const plano = planoSelecionado ? planos[planoSelecionado] : null;
  const categoria = plano?.categorias?.find((c) => c.id === categoriaVeiculo) ?? null;
  const fichaValida = nome.trim().length > 1 && telefone.trim().length > 7 && carro.trim().length > 0;

  const indiceVisivel: Record<Etapa, number> = {
    tipo: 0,
    servico: 1,
    plano: 1,
    categoria: 1,
    servicoPlano: 1,
    horario: 2,
    ficha: 3,
    confirmacao: 4,
  };
  const passos = etapasAgendamento.map((label, i) =>
    i === 1 && tipoAtendimento === "assinatura" ? "Plano" : label
  );

  function escolherTipo(tipo: TipoAtendimento) {
    setTipoAtendimento(tipo);
    setEtapa(tipo === "avulso" ? "servico" : "plano");
  }

  function escolherServico(servico: AvulsoServico) {
    if (servico.sobConsulta) {
      window.open(
        linkWhatsapp(`Olá! Quero saber mais sobre o serviço "${servico.nome}" da Pitstop.`),
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    selecionarAvulso(servico);
    setEtapa("horario");
  }

  function escolherPlano(id: PlanoId) {
    selecionarPlano(id);
    setEtapa(planos[id].categorias?.length ? "categoria" : "servicoPlano");
  }

  function escolherCategoria(id: string) {
    setCategoriaVeiculo(id);
    setEtapa("servicoPlano");
  }

  function escolherServicoPlano(nome: string) {
    setServicoPlano(nome);
    setEtapa("horario");
  }

  function selecionarSlot(hora: string) {
    setSlotSelecionado({ dia: diaSelecionadoDia, hora });
    setErro(null);
  }

  function trocarDia(dia: string) {
    setDiaSelecionadoDia(dia);
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
          servicoId: avulsoSelecionado?.id,
          planoId: planoSelecionado,
          categoriaVeiculo,
          servicoPlano,
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
      if (!resposta.ok) throw new Error();
      const dados: { id: number } = await resposta.json();
      setReservaId(dados.id);
      setEtapa("confirmacao");
    } catch {
      setErro("Não foi possível confirmar o agendamento agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function copiarCodigo(codigo: string) {
    function marcarCopiado() {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(codigo).then(marcarCopiado, () => {
        // permissão de clipboard negada pelo navegador, tenta o fallback abaixo
        copiarComFallback(codigo, marcarCopiado);
      });
    } else {
      copiarComFallback(codigo, marcarCopiado);
    }
  }

  function copiarComFallback(codigo: string, aoCopiar: () => void) {
    const campoTemporario = document.createElement("textarea");
    campoTemporario.value = codigo;
    campoTemporario.style.position = "fixed";
    campoTemporario.style.opacity = "0";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();
    try {
      document.execCommand("copy");
      aoCopiar();
    } catch {
      // navegador não suporta cópia programática, usuário pode selecionar o código manualmente
    } finally {
      document.body.removeChild(campoTemporario);
    }
  }

  function novoAgendamento() {
    setSlotSelecionado(null);
    setNome("");
    setTelefone("");
    setCarro("");
    setPlaca("");
    setServicoPlano(null);
    setReservaId(null);
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
            Escolha o serviço, o horário e deixe o resto com a gente.
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
                  <span className="font-heading text-lg font-bold">Serviço avulso</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    Escolho um serviço agora, sem compromisso.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => escolherTipo("assinatura")}
                  className="rounded-sm border border-white/10 bg-asphalt p-6 text-left transition hover:border-gold"
                >
                  <span className="font-heading text-lg font-bold">Sou assinante</span>
                  <p className="mt-2 text-sm text-text-secondary">
                    Já uso ou quero usar um plano Pitstop.
                  </p>
                </button>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("planos")}
                className="mt-4 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline"
              >
                Ou conhecer os planos primeiro
              </button>
            </div>
          )}

          {etapa === "servico" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual serviço você deseja?</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {avulsos.map((servico) => (
                  <button
                    key={servico.id}
                    type="button"
                    onClick={() => escolherServico(servico)}
                    className="flex flex-col rounded-sm border border-white/10 bg-asphalt p-5 text-left transition hover:border-gold"
                  >
                    <span className="font-heading text-base font-bold">{servico.nome}</span>
                    <span className="mt-1 text-sm text-text-secondary">{servico.descricao}</span>
                    <span className="mt-4 font-mono text-sm text-gold">
                      {servico.sobConsulta ? "Sob consulta · WhatsApp" : formatarPreco(servico.preco ?? 0)}
                    </span>
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

          {etapa === "plano" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual plano você assina?</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {listaPlanos.map((p) => (
                  <PlanoCard key={p.id} plano={p} onClick={() => escolherPlano(p.id)} />
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

          {etapa === "categoria" && plano?.categorias && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual é o seu veículo?</h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                Plano: <span className="text-gold">{plano.nome}</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {plano.categorias.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => escolherCategoria(cat.id)}
                    className="rounded-sm border border-white/10 bg-asphalt p-5 text-left transition hover:border-gold"
                  >
                    <span className="font-heading text-base font-bold">{cat.nome}</span>
                    <span className="block text-sm text-text-secondary">{cat.descricao}</span>
                    <span className="mt-2 block font-mono text-sm text-gold">
                      {formatarPreco(cat.precoMensal)}/mês
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

          {etapa === "servicoPlano" && (
            <div>
              <h3 className="font-heading text-xl font-bold">Qual serviço você quer agendar?</h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                Plano: <span className="text-gold">{plano?.nome}</span>
                {categoria && <> · {categoria.nome}</>}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {servicosPlanoDiamante.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => escolherServicoPlano(nome)}
                    className="rounded-sm border border-white/10 bg-asphalt p-5 text-left font-heading text-base font-bold transition hover:border-gold"
                  >
                    {nome}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEtapa(plano?.categorias?.length ? "categoria" : "plano")}
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
                {tipoAtendimento === "avulso" && avulsoSelecionado && (
                  <>
                    Agendando: <span className="text-gold">{avulsoSelecionado.nome}</span>
                  </>
                )}
                {tipoAtendimento === "assinatura" && plano && (
                  <>
                    Plano: <span className="text-gold">{plano.nome}</span>
                    {categoria && <> · {categoria.nome}</>}
                    {servicoPlano && <> · {servicoPlano}</>}
                  </>
                )}
              </p>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {diasAgendamento.map((dia) => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => trocarDia(dia)}
                    className={`shrink-0 rounded-sm px-4 py-2 font-heading text-sm font-semibold transition ${
                      dia === diaSelecionadoDia
                        ? "bg-gold text-asphalt"
                        : "bg-asphalt text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {diaAbreviado[dia] ?? dia}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {horariosAgendamento.map((hora) => {
                  const chave = `${diaSelecionadoDia}-${hora}`;
                  const indisponivel = horariosIndisponiveisMock.has(chave) || ocupados.has(chave);
                  const selecionado =
                    slotSelecionado?.dia === diaSelecionadoDia && slotSelecionado?.hora === hora;
                  return (
                    <button
                      key={hora}
                      type="button"
                      disabled={indisponivel}
                      onClick={() => selecionarSlot(hora)}
                      className={`flex w-full items-center justify-between rounded-sm px-4 py-3 font-mono text-sm transition ${
                        indisponivel
                          ? "cursor-not-allowed bg-white/5 text-text-secondary/40"
                          : selecionado
                          ? "bg-gold text-asphalt"
                          : "bg-asphalt text-text-primary hover:text-gold"
                      }`}
                    >
                      <span>{hora}</span>
                      <span className="text-xs uppercase">
                        {indisponivel ? "Ocupado" : selecionado ? "Selecionado" : "Livre"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEtapa(tipoAtendimento === "assinatura" ? "servicoPlano" : "servico")}
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
                    ? `Continuar · ${diaAbreviado[slotSelecionado.dia] ?? slotSelecionado.dia} ${slotSelecionado.hora}`
                    : "Selecione um horário"}
                </button>
              </div>
            </div>
          )}

          {etapa === "ficha" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (fichaValida) confirmarFicha();
              }}
            >
              <h3 className="flex items-center gap-2 font-heading text-xl font-bold">
                Ficha técnica <Bolt className="h-4 w-4 text-gold" />
              </h3>
              <p className="mt-1 mb-6 text-sm text-text-secondary">
                Só o essencial pra gente te receber direito.
              </p>

              {slotSelecionado && (
                <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm border border-white/10 bg-asphalt p-4 font-mono text-xs">
                  <SpecItem
                    label="Tipo"
                    valor={tipoAtendimento === "assinatura" ? "Assinatura" : "Serviço avulso"}
                  />
                  {tipoAtendimento === "avulso" && avulsoSelecionado && (
                    <SpecItem label="Serviço" valor={avulsoSelecionado.nome} />
                  )}
                  {tipoAtendimento === "assinatura" && plano && (
                    <>
                      <SpecItem label="Plano" valor={plano.nome} />
                      {categoria && <SpecItem label="Categoria" valor={categoria.nome} />}
                      {servicoPlano && <SpecItem label="Serviço" valor={servicoPlano} />}
                    </>
                  )}
                  <SpecItem label="Data" valor={slotSelecionado.dia} />
                  <SpecItem label="Horário" valor={slotSelecionado.hora} />
                </div>
              )}

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
                  {enviando ? "Confirmando..." : "Confirmar agendamento"}
                </button>
              </div>
            </form>
          )}

          {etapa === "confirmacao" && slotSelecionado && reservaId && (
            <div className="text-center">
              {(() => {
                const codigo = `PIT-084-${String(reservaId).padStart(6, "0")}`;
                const barras = codigo
                  .split("")
                  .map((c) => (c.charCodeAt(0) % 3) + 1);
                return (
                  <>
                    <p className="font-heading text-xs font-bold tracking-[0.2em] text-gold">
                      PITSTOP 084 ⚡
                    </p>
                    <h3 className="mt-1 font-heading text-2xl font-bold">
                      Seu PitPass está pronto.
                    </h3>

                    <div className="mx-auto mt-6 max-w-sm rounded-sm border-2 border-gold bg-asphalt p-6">
                      <div className="mb-4 flex h-10 items-end justify-center gap-[3px]" aria-hidden="true">
                        {barras.map((largura, i) => (
                          <span
                            key={i}
                            style={{ width: `${largura * 2}px` }}
                            className="h-full bg-gold/70"
                          />
                        ))}
                      </div>
                      <p className="font-mono text-2xl font-bold tracking-[0.15em] text-white">
                        {codigo}
                      </p>
                      <button
                        type="button"
                        onClick={() => copiarCodigo(codigo)}
                        className="mt-3 font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline"
                      >
                        {copiado ? "Copiado!" : "Copiar código"}
                      </button>
                    </div>

                    <div className="mx-auto mt-6 max-w-sm space-y-2 rounded-sm bg-asphalt p-4 text-left font-mono text-sm">
                      <Linha label="Cliente" valor={nome} />
                      <Linha label="Veículo" valor={carro} />
                      {placa && <Linha label="Placa" valor={placa} />}
                      {tipoAtendimento === "avulso" && avulsoSelecionado && (
                        <Linha label="Serviço" valor={avulsoSelecionado.nome} />
                      )}
                      {tipoAtendimento === "assinatura" && plano && (
                        <>
                          <Linha label="Plano" valor={plano.nome} />
                          {categoria && <Linha label="Categoria" valor={categoria.nome} />}
                          {servicoPlano && <Linha label="Serviço" valor={servicoPlano} />}
                        </>
                      )}
                      <Linha label="Horário" valor={`${slotSelecionado.dia}, ${slotSelecionado.hora}`} />
                    </div>

                    <p className="mt-4 text-xs text-text-secondary">
                      Apresente seu PitPass na chegada.
                    </p>

                    <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
                      <a
                        href={linkWhatsapp(
                          `Olá! Acabei de agendar na Pitstop pra ${slotSelecionado.dia} às ${slotSelecionado.hora}. Meu PitPass: ${codigo}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm border border-white/15 py-3 font-heading text-sm font-semibold tracking-wide text-text-primary transition hover:border-gold hover:text-gold"
                      >
                        Falar com a Pitstop no WhatsApp
                      </a>
                      <button
                        type="button"
                        disabled
                        title="Em breve"
                        className="cursor-not-allowed rounded-sm border border-white/10 py-3 font-heading text-sm font-semibold tracking-wide text-text-secondary opacity-50"
                      >
                        Adicionar ao calendário
                      </button>
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

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right text-text-primary">{valor}</span>
    </div>
  );
}

function SpecItem({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <span className="block text-text-secondary uppercase tracking-wide">{label}</span>
      <span className="text-text-primary">{valor}</span>
    </div>
  );
}
