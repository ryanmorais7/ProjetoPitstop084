"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartaoAgenda } from "@/lib/adminDados";
import {
  cargaOperacional,
  Estagio,
  estagios,
  rotuloEstagio,
  Setor,
  tipoMovimento,
  TipoMovimento,
} from "@/lib/operacao";
import { moverEstagioAgendamento, bloquearHorario, desbloquearHorario } from "@/app/admin/actions";
import { useAviso } from "../AdminShell";
import FormComAviso, { BotaoEnviar } from "../FormComAviso";
import ClienteBadge from "../ClienteBadge";
import CartaoKanban from "./CartaoKanban";
import DrawerAtendimento from "./DrawerAtendimento";

type Visao = "kanban" | "horarios";
type FiltroTipo = "todos" | "avulso" | "pitpass" | "black" | "gold" | "diamante";
type FiltroServico = "todos" | Setor;

const CHAVE_VISAO = "pitstop084:agenda-visao";

const filtrosTipo: { id: FiltroTipo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "avulso", rotulo: "PitStop" },
  { id: "pitpass", rotulo: "PitPass" },
  { id: "black", rotulo: "Black" },
  { id: "gold", rotulo: "Gold" },
  { id: "diamante", rotulo: "Diamante" },
];

const filtrosServico: { id: FiltroServico; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos os serviços" },
  { id: "lavagem", rotulo: "Lavagem" },
  { id: "detail", rotulo: "Detail" },
  { id: "manutencao", rotulo: "Manutenção" },
];

const corNivel = {
  normal: "adm-status-concluido",
  atencao: "adm-status-aguardando",
  alta: "adm-status-cancelado",
} as const;

interface Bloqueio {
  id: number;
  horario: string;
  motivo: string | null;
}

interface Confirmacao {
  cartao: CartaoAgenda;
  destino: Estagio;
  tipo: TipoMovimento;
  /** Sair de AGENDADO é o check-in: exige a placa conferida. */
  precisaPlaca: boolean;
  /** Já tem carro com o detailer. Só avisa, não bloqueia. */
  detailerOcupado: boolean;
}

function horaFortaleza(ms: number): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function AgendaPainel({
  cartoes: cartoesDoServidor,
  dia,
  hoje,
  rotuloDia,
  diaAnterior,
  diaSeguinte,
  horarios,
  bloqueios,
  agoraServidor,
}: {
  cartoes: CartaoAgenda[];
  dia: string;
  hoje: string;
  rotuloDia: string;
  diaAnterior: string;
  diaSeguinte: string;
  horarios: string[];
  bloqueios: Bloqueio[];
  /** Relógio do servidor no render: evita divergência de hidratação nos tempos. */
  agoraServidor: number;
}) {
  const router = useRouter();
  const avisar = useAviso();
  const [, startTransition] = useTransition();
  const [cartoes, moverOtimista] = useOptimistic(
    cartoesDoServidor,
    (atual, mudanca: { id: number; destino: Estagio; em: string }) =>
      atual.map((c) => (c.id === mudanca.id ? { ...c, estagio: mudanca.destino, estagioDesde: mudanca.em } : c))
  );

  const [visao, setVisao] = useState<Visao>("kanban");
  const [aba, setAba] = useState<Estagio>("agendado");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");
  const [servico, setServico] = useState<FiltroServico>("todos");
  const [agora, setAgora] = useState(agoraServidor);
  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<Estagio | null>(null);
  const [abertoId, setAbertoId] = useState<number | null>(null);
  const [movendoId, setMovendoId] = useState<number | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [placaConferida, setPlacaConferida] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(CHAVE_VISAO) === "horarios") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- lê a visão lembrada na sessão uma vez, no mount
        setVisao("horarios");
      }
    } catch {
      // sessionStorage indisponível: fica no Kanban
    }
  }, []);

  // relógio dos cronômetros (calculados no navegador) + sincronização moderada com o servidor
  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), 30_000);
    const sincronia = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => {
      clearInterval(relogio);
      clearInterval(sincronia);
    };
  }, [router]);

  function trocarVisao(nova: Visao) {
    setVisao(nova);
    try {
      window.sessionStorage.setItem(CHAVE_VISAO, nova);
    } catch {
      // sem sessionStorage a escolha vale só até recarregar
    }
  }

  const horaAgora = horaFortaleza(agora);
  const carga = useMemo(() => cargaOperacional(cartoes), [cartoes]);
  const contar = (...lista: Estagio[]) => cartoes.filter((c) => lista.includes(c.estagio)).length;

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    const digitos = termo.replace(/\D/g, "");
    return cartoes.filter((c) => {
      if (tipo === "avulso" && c.nomePlano) return false;
      if (tipo === "pitpass" && !c.nomePlano) return false;
      if ((tipo === "black" || tipo === "gold" || tipo === "diamante") && c.nomePlano?.toLowerCase() !== tipo) return false;
      if (servico !== "todos" && c.setor !== servico) return false;
      if (!termo) return true;
      return (
        semAcento(c.nome).includes(termo) ||
        semAcento(c.codigo ?? "").includes(termo) ||
        semAcento((c.placa ?? "").replace(/[^a-z0-9]/gi, "")).includes(termo.replace(/[^a-z0-9]/g, "")) ||
        (digitos.length >= 4 && c.telefone.replace(/\D/g, "").includes(digitos))
      );
    });
  }, [cartoes, busca, tipo, servico]);

  const filtrando = busca.trim() !== "" || tipo !== "todos" || servico !== "todos";
  const aberto = abertoId != null ? (cartoes.find((c) => c.id === abertoId) ?? null) : null;
  const movendo = movendoId != null ? (cartoes.find((c) => c.id === movendoId) ?? null) : null;
  const responsaveis = [...new Set(cartoes.map((c) => c.responsavel).filter((r): r is string => Boolean(r)))];
  // serviço técnico esperando enquanto o detailer já está com outro carro
  const emDetail = cartoes.filter((c) => c.estagio === "detail");
  const esperandoDetailer = cartoes.filter(
    (c) => c.exigeDetailer && (c.estagio === "chegou" || c.estagio === "lavagem")
  );

  function executar(cartao: CartaoAgenda, destino: Estagio, conferida: boolean) {
    startTransition(async () => {
      moverOtimista({ id: cartao.id, destino, em: new Date().toISOString() });
      const resultado = await moverEstagioAgendamento(cartao.id, destino, conferida);
      if (resultado.ok) {
        avisar(`${cartao.nome.trim().split(/\s+/)[0]} movido para ${rotuloEstagio[destino].toUpperCase()}`);
      } else {
        avisar(resultado.erro ?? "Não foi possível mover. Tente de novo.", "erro");
      }
      router.refresh();
    });
  }

  function pedirMovimento(cartao: CartaoAgenda, destino: Estagio) {
    if (destino === cartao.estagio) return;
    const tipoDoMovimento = tipoMovimento(cartao.fluxo, cartao.estagio, destino);
    const precisaPlaca = cartao.estagio === "agendado";
    const detailerOcupado = destino === "detail" && cartoes.some((c) => c.id !== cartao.id && c.estagio === "detail");
    if (tipoDoMovimento === "natural" && !precisaPlaca && !detailerOcupado) {
      executar(cartao, destino, false);
      return;
    }
    setPlacaConferida(false);
    setConfirmacao({ cartao, destino, tipo: tipoDoMovimento, precisaPlaca, detailerOcupado });
  }

  // o id vem do próprio arrasto (dataTransfer), não do estado: soltar funciona mesmo que o
  // React ainda não tenha processado o início do arrasto
  function soltarEm(destino: Estagio, id: number) {
    const cartao = cartoes.find((c) => c.id === id);
    setArrastandoId(null);
    setColunaAlvo(null);
    if (cartao) pedirMovimento(cartao, destino);
  }

  const linkNovo = (extra: string) => `/admin/agendamentos/novo${extra}`;

  return (
    <div>
      {/* Dia + resumo */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Link href={`/admin/agenda?dia=${diaAnterior}`} aria-label="Dia anterior" className="adm-btn w-11 px-0 text-base">
              ‹
            </Link>
            <div className="min-w-[9.5rem] px-1 text-center">
              {dia === hoje && <p className="adm-rotulo text-gold-ink">Hoje</p>}
              <p className="font-heading text-xl font-bold leading-tight">{rotuloDia}</p>
            </div>
            <Link href={`/admin/agenda?dia=${diaSeguinte}`} aria-label="Próximo dia" className="adm-btn w-11 px-0 text-base">
              ›
            </Link>
            {dia !== hoje && (
              <Link href="/admin/agenda" className="adm-btn ml-1">
                Hoje
              </Link>
            )}
          </div>
          <form method="GET" action="/admin/agenda" className="relative mt-2 flex items-center gap-2">
            <label htmlFor="agenda-dia" className="adm-rotulo">
              Escolher data
            </label>
            <input
              id="agenda-dia"
              type="date"
              name="dia"
              defaultValue={dia}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="campo w-auto py-1 text-sm"
            />
          </form>
        </div>

        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          {[
            { rotulo: cartoes.length === 1 ? "veículo no dia" : "veículos no dia", valor: cartoes.length },
            { rotulo: "aguardando", valor: contar("agendado") },
            { rotulo: "em atendimento", valor: contar("chegou", "lavagem", "detail", "finalizacao") },
            { rotulo: "prontos", valor: contar("pronto") },
            { rotulo: "entregues", valor: contar("entregue") },
          ].map((n) => (
            <div key={n.rotulo} className="flex items-baseline gap-1.5">
              <dd className="font-heading text-2xl font-bold tabular-nums">{n.valor}</dd>
              <dt className="adm-rotulo">{n.rotulo}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Capacidade da equipe + semáforo */}
      <div className="adm-card mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <span className={`adm-chip ${corNivel[carga.nivel]}`} title="Atenção: setor ocupado com carro esperando. Capacidade alta: 2 ou mais esperando o mesmo setor.">
          {carga.nivel === "normal" ? "Fluxo normal" : carga.nivel === "atencao" ? `Atenção · ${carga.mensagem}` : `Capacidade alta · ${carga.mensagem}`}
        </span>
        <p className="text-sm">
          <span className="adm-rotulo mr-2">Lavagem</span>
          <strong>{carga.lavagem.andamento}</strong> em andamento · <strong>{carga.lavagem.aguardando}</strong> aguardando
        </p>
        <p className="text-sm">
          <span className="adm-rotulo mr-2">Detail</span>
          <strong>{carga.detail.andamento}</strong> em andamento · <strong>{carga.detail.aguardando}</strong> aguardando
        </p>
        <p className="text-sm">
          <span className="adm-rotulo mr-2">Finalização</span>
          <strong>{carga.finalizacao}</strong> veículo{carga.finalizacao === 1 ? "" : "s"}
        </p>
      </div>

      {emDetail.length > 0 && esperandoDetailer.length > 0 && (
        <p role="status" className="mt-3 rounded-lg bg-[#fdf1cf] px-4 py-3 text-sm font-medium text-[#5f4300]">
          Atenção: o detailer já está com {emDetail.map((c) => c.nome.trim().split(/\s+/)[0]).join(", ")} e há{" "}
          {esperandoDetailer.length} serviço{esperandoDetailer.length === 1 ? "" : "s"} técnico{esperandoDetailer.length === 1 ? "" : "s"} na fila (
          {esperandoDetailer.map((c) => c.nome.trim().split(/\s+/)[0]).join(", ")}).
        </p>
      )}

      {/* Barra de ações */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Visão da agenda" className="flex rounded-lg border border-black/15 bg-white p-1">
          {(["kanban", "horarios"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={visao === v}
              onClick={() => trocarVisao(v)}
              className={`min-h-9 rounded-md px-4 font-heading text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                visao === v ? "bg-adm-ink text-white" : "text-adm-muted hover:text-adm-ink"
              }`}
            >
              {v === "kanban" ? "Kanban" : "Horários"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={linkNovo(`?dia=${dia}`)} className="adm-btn adm-btn-primario">
            + Novo agendamento
          </Link>
          <Link href={linkNovo("?encaixe=1")} className="adm-btn">
            + Encaixe
          </Link>
          <Link href="/admin/pitpass" className="adm-btn">
            Ler PitPass
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor="busca-agenda" className="sr-only">
          Filtrar a agenda
        </label>
        <input
          id="busca-agenda"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar por nome, placa, P084 ou WhatsApp"
          className="campo w-full text-sm sm:max-w-xs"
        />
        <div className="relative -mx-4 flex max-w-[100vw] gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {filtrosTipo.map((f) => (
            <Chip key={f.id} ativo={tipo === f.id} onClick={() => setTipo(f.id)}>
              {f.rotulo}
            </Chip>
          ))}
        </div>
        <div className="relative -mx-4 flex max-w-[100vw] gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {filtrosServico.map((f) => (
            <Chip key={f.id} ativo={servico === f.id} onClick={() => setServico(f.id)}>
              {f.rotulo}
            </Chip>
          ))}
        </div>
      </div>

      {filtrando && (
        <p className="mt-3 text-sm text-adm-muted">
          Mostrando {visiveis.length} de {cartoes.length}.{" "}
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setTipo("todos");
              setServico("todos");
            }}
            className="font-medium text-adm-ink underline underline-offset-4"
          >
            Limpar filtros
          </button>
        </p>
      )}

      {/* KANBAN */}
      {visao === "kanban" && (
        <div className="mt-4">
          {/* celular: uma aba por estágio, cards em coluna única */}
          <div role="tablist" aria-label="Estágio" className="relative -mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden">
            {estagios.map((e) => {
              const total = visiveis.filter((c) => c.estagio === e).length;
              return (
                <button
                  key={e}
                  type="button"
                  role="tab"
                  aria-selected={aba === e}
                  onClick={() => setAba(e)}
                  className={`flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg border px-3 font-heading text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                    aba === e ? "border-adm-ink bg-adm-ink text-white" : "border-black/15 bg-white text-adm-muted"
                  }`}
                >
                  {rotuloEstagio[e]}
                  <span className={`rounded-full px-1.5 font-mono text-[11px] ${aba === e ? "bg-white/20" : "bg-black/[0.06]"}`}>{total}</span>
                </button>
              );
            })}
          </div>

          <div className="lg:-mx-1 lg:flex lg:gap-3 lg:overflow-x-auto lg:px-1 lg:pb-3">
            {estagios.map((e) => {
              const daColuna = visiveis.filter((c) => c.estagio === e);
              const alvo = colunaAlvo === e;
              return (
                <section
                  key={e}
                  aria-label={rotuloEstagio[e]}
                  onDragOver={(ev) => {
                    if (!ev.dataTransfer.types.includes("text/plain")) return;
                    ev.preventDefault();
                    ev.dataTransfer.dropEffect = "move";
                    if (colunaAlvo !== e) setColunaAlvo(e);
                  }}
                  onDragLeave={(ev) => {
                    if (!ev.currentTarget.contains(ev.relatedTarget as Node | null)) setColunaAlvo(null);
                  }}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    soltarEm(e, Number(ev.dataTransfer.getData("text/plain")));
                  }}
                  className={`${aba === e ? "block" : "hidden"} rounded-xl transition-colors duration-150 lg:block lg:min-w-56 lg:flex-1 lg:border lg:p-2 ${
                    alvo ? "lg:border-gold lg:bg-gold/10" : "lg:border-transparent lg:bg-black/[0.035]"
                  }`}
                >
                  <h2 className="hidden items-center justify-between px-1.5 pb-2 pt-1 lg:flex">
                    <span className="font-heading text-sm font-bold uppercase tracking-[0.1em]">{rotuloEstagio[e]}</span>
                    <span className="rounded-full bg-white px-2 font-mono text-xs font-semibold text-adm-muted">{daColuna.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {daColuna.map((c) => (
                      <CartaoKanban
                        key={c.id}
                        cartao={c}
                        agora={agora}
                        hoje={hoje}
                        horaAgora={horaAgora}
                        arrastando={arrastandoId === c.id}
                        onAbrir={() => setAbertoId(c.id)}
                        onMover={() => setMovendoId(c.id)}
                        onArrastar={() => setArrastandoId(c.id)}
                        onSoltar={() => {
                          setArrastandoId(null);
                          setColunaAlvo(null);
                        }}
                      />
                    ))}
                    {daColuna.length === 0 && (
                      <p className="rounded-lg border border-dashed border-black/15 px-3 py-6 text-center text-xs text-adm-muted">
                        {filtrando ? "Nada com esse filtro." : "Nenhum veículo."}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* HORÁRIOS */}
      {visao === "horarios" && (
        <VisaoHorarios
          dia={dia}
          hoje={hoje}
          horaAgora={horaAgora}
          horarios={horarios}
          bloqueios={bloqueios}
          cartoes={visiveis}
          todos={cartoes}
          onAbrir={setAbertoId}
        />
      )}

      {aberto && (
        <DrawerAtendimento
          cartao={aberto}
          agora={agora}
          responsaveis={responsaveis}
          onMover={() => setMovendoId(aberto.id)}
          onFechar={() => setAbertoId(null)}
        />
      )}

      {/* Mover para: (alternativa ao arrastar; é o caminho principal no celular) */}
      {movendo && (
        <Folha titulo="Mover para" subtitulo={`${movendo.nome} · ${movendo.carro}`} onFechar={() => setMovendoId(null)}>
          <div className="grid gap-2">
            {estagios.map((e) => {
              const atual = e === movendo.estagio;
              const proximo = tipoMovimento(movendo.fluxo, movendo.estagio, e) === "natural";
              return (
                <button
                  key={e}
                  type="button"
                  disabled={atual}
                  onClick={() => {
                    setMovendoId(null);
                    pedirMovimento(movendo, e);
                  }}
                  className={`adm-btn justify-between ${proximo ? "adm-btn-primario" : ""}`}
                >
                  {rotuloEstagio[e]}
                  <span className="font-mono text-[10px] font-medium normal-case tracking-normal opacity-70">
                    {atual ? "está aqui" : proximo ? "próximo passo" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </Folha>
      )}

      {confirmacao && (
        <Folha
          alerta
          titulo={
            confirmacao.precisaPlaca
              ? "Confirme a placa do veículo"
              : confirmacao.tipo === "voltar"
              ? `Voltar para ${rotuloEstagio[confirmacao.destino].toUpperCase()}?`
              : confirmacao.tipo === "natural"
              ? `Mover para ${rotuloEstagio[confirmacao.destino].toUpperCase()}?`
              : `Pular diretamente para ${rotuloEstagio[confirmacao.destino].toUpperCase()}?`
          }
          subtitulo={`${confirmacao.cartao.nome} · ${confirmacao.cartao.codigo ?? ""}`}
          onFechar={() => setConfirmacao(null)}
        >
          {confirmacao.precisaPlaca && (
            <div className="rounded-lg border-2 border-gold bg-[#fdf6e0] p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="adm-rotulo">Veículo cadastrado</p>
                  <p className="mt-1 font-heading text-lg font-bold leading-tight">{confirmacao.cartao.carro}</p>
                </div>
                <div>
                  <p className="adm-rotulo">Placa</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.08em]">{confirmacao.cartao.placa ?? "—"}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-adm-muted">
                O QR identifica o agendamento. A placa confirma o veículo. Se não bater, não faça o check-in.
              </p>
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={placaConferida}
                  onChange={(e) => setPlacaConferida(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#16171a]"
                />
                Conferi o veículo e a placa
              </label>
            </div>
          )}
          {confirmacao.tipo === "pular" && (
            <p className="mt-3 text-sm text-adm-muted">
              O carro está em {rotuloEstagio[confirmacao.cartao.estagio].toUpperCase()}. As etapas do meio não serão registradas.
            </p>
          )}
          {confirmacao.tipo === "fora-do-fluxo" && (
            <p className="mt-3 text-sm text-adm-muted">
              {rotuloEstagio[confirmacao.destino]} não faz parte do fluxo previsto para este serviço.
            </p>
          )}
          {confirmacao.tipo === "voltar" && (confirmacao.cartao.estagio === "pronto" || confirmacao.cartao.estagio === "entregue") && (
            <p className="mt-3 text-sm text-adm-muted">O atendimento será reaberto.</p>
          )}
          {confirmacao.detailerOcupado && (
            <p className="mt-3 rounded-lg bg-[#fdf1cf] px-3 py-2.5 text-sm font-medium text-[#5f4300]">
              Atenção: o detailer já possui atendimento em andamento.
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" autoFocus onClick={() => setConfirmacao(null)} className="adm-btn">
              Voltar
            </button>
            <button
              type="button"
              disabled={confirmacao.precisaPlaca && !placaConferida}
              onClick={() => {
                const { cartao, destino } = confirmacao;
                setConfirmacao(null);
                executar(cartao, destino, placaConferida);
              }}
              className="adm-btn adm-btn-primario"
            >
              Confirmar
            </button>
          </div>
        </Folha>
      )}
    </div>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`flex min-h-9 shrink-0 items-center rounded-full px-3 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors ${
        ativo ? "bg-gold/25 text-adm-ink" : "text-adm-muted hover:bg-black/[0.05] hover:text-adm-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Folha de decisão: sobe do rodapé no celular, modal centrado no desktop. */
function Folha({
  titulo,
  subtitulo,
  alerta = false,
  onFechar,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  alerta?: boolean;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só registra o Escape enquanto a folha existe
  }, []);

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center sm:p-6" role={alerta ? "alertdialog" : "dialog"} aria-modal="true" aria-label={titulo}>
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onFechar}
        className="absolute inset-0 cursor-default bg-black/45"
        style={{ animation: "preco-fade 0.2s ease-out" }}
      />
      <div
        className="folha-entra relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 text-adm-ink shadow-xl sm:max-w-sm sm:rounded-2xl sm:p-6"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <p className="font-heading text-xl font-bold leading-tight">{titulo}</p>
        {subtitulo && <p className="mb-4 mt-1 text-sm text-adm-muted">{subtitulo}</p>}
        {children}
      </div>
    </div>
  );
}

function VisaoHorarios({
  dia,
  hoje,
  horaAgora,
  horarios,
  bloqueios,
  cartoes,
  todos,
  onAbrir,
}: {
  dia: string;
  hoje: string;
  horaAgora: string;
  horarios: string[];
  bloqueios: Bloqueio[];
  /** Cards depois dos filtros. */
  cartoes: CartaoAgenda[];
  /** Todos os cards do dia: um horário ocupado continua ocupado mesmo com filtro ativo. */
  todos: CartaoAgenda[];
  onAbrir: (id: number) => void;
}) {
  // grade fixa + horários fora dela (encaixes), em ordem
  const linhas = [...new Set([...horarios, ...todos.map((c) => c.horario)])].sort();
  const bloqueioPorHorario = new Map(bloqueios.map((b) => [b.horario, b]));

  return (
    <ol className="adm-card mt-4 divide-y divide-adm-line overflow-hidden">
      {linhas.map((hora) => {
        const ocupantes = todos.filter((c) => c.horario === hora);
        const visiveis = cartoes.filter((c) => c.horario === hora);
        const bloqueio = bloqueioPorHorario.get(hora);
        const jaPassou = dia < hoje || (dia === hoje && hora <= horaAgora);
        const encaixe = !horarios.includes(hora);

        return (
          <li key={hora} className={`flex gap-4 px-4 py-4 sm:px-5 ${bloqueio ? "bg-black/[0.03]" : ""}`}>
            <p className="w-14 shrink-0 pt-0.5 font-heading text-xl font-bold tabular-nums">{hora}</p>

            {ocupantes.length > 0 ? (
              <div className="min-w-0 flex-1 space-y-3 border-l-2 border-gold pl-4">
                {visiveis.length === 0 && <p className="text-sm text-adm-muted">Ocupado (fora do filtro).</p>}
                {visiveis.map((c) => (
                  <button key={c.id} type="button" onClick={() => onAbrir(c.id)} className="group block w-full text-left">
                    <span className="block font-heading text-base font-bold leading-tight underline-offset-4 group-hover:underline">{c.nome}</span>
                    <span className="mt-0.5 block text-sm">
                      {c.servico}
                      {c.adicionais.length > 0 && <span className="text-adm-muted"> + {c.adicionais.join(" + ")}</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-adm-muted">
                      {c.carro}
                      <span className="mx-1.5 text-black/25">•</span>
                      <span className="font-mono text-[13px] text-adm-ink">{c.placa ?? "sem placa"}</span>
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="adm-chip adm-status-em_atendimento">{rotuloEstagio[c.estagio]}</span>
                      <ClienteBadge nomePlano={c.nomePlano} />
                      {encaixe && <span className="adm-chip adm-status-confirmado">Encaixe</span>}
                      {c.exigeDetailer && <span className="adm-chip adm-status-confirmado">Detailer</span>}
                      <span className="font-mono text-[11px] text-adm-muted">{c.codigo}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : bloqueio ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 border-l-2 border-black/20 pl-4">
                <div>
                  <span className="adm-chip adm-status-inativo">Bloqueado</span>
                  {bloqueio.motivo && <p className="mt-1 text-sm text-adm-muted">{bloqueio.motivo}</p>}
                </div>
                <FormComAviso action={desbloquearHorario.bind(null, bloqueio.id)} mensagem="Horário liberado">
                  <BotaoEnviar>Desbloquear</BotaoEnviar>
                </FormComAviso>
              </div>
            ) : jaPassou ? (
              <p className="flex-1 border-l-2 border-black/10 pl-4 font-heading text-sm font-bold tracking-[0.12em] text-black/30">SEM AGENDAMENTO</p>
            ) : (
              <div className="min-w-0 flex-1 border-l-2 border-black/10 pl-4">
                <Link
                  href={`/admin/agendamentos/novo?dia=${dia}&hora=${hora}`}
                  className="inline-flex min-h-9 items-center gap-2 font-heading text-sm font-bold tracking-[0.12em] text-[#1c6a35] underline-offset-4 hover:underline"
                >
                  DISPONÍVEL
                  <span className="font-mono text-[11px] font-medium normal-case tracking-normal text-adm-muted">+ agendar neste horário</span>
                </Link>
                <details>
                  <summary className="inline-flex min-h-9 cursor-pointer items-center text-sm text-adm-muted underline-offset-4 hover:text-adm-ink hover:underline">
                    Bloquear horário
                  </summary>
                  <FormComAviso action={bloquearHorario} mensagem="Horário bloqueado" className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="dia" value={dia} />
                    <input type="hidden" name="horario" value={hora} />
                    <input type="text" name="motivo" aria-label="Motivo do bloqueio" placeholder="Motivo (opcional)" className="campo max-w-xs flex-1 text-sm" />
                    <BotaoEnviar>Bloquear</BotaoEnviar>
                  </FormComAviso>
                </details>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
