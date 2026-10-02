"use client";

import { useEffect, useRef, useState } from "react";
import { formatarDataCurta } from "@/lib/agenda";
import { formatarTelefone } from "@/lib/format";
import { planos } from "@/lib/data";
import { pitpassTheme, temaDoPlano } from "@/lib/pitpassTheme";
import type { PitPassPublico } from "@/lib/meuPitPass";
import PitPass from "./PitPass";
import CarSparkMark from "./CarSparkMark";

const EVENTO_ABRIR = "pitstop084:abrir-meu-pitpass";
const CHAVE_LEMBRAR = "pitstop084:meu-pitpass";

/** Abre o "Meu PitPass" de qualquer lugar da landing (header, agendamento...). */
export function abrirMeuPitPass() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

/** Guarda WhatsApp/placa neste aparelho pra preencher a busca depois (conveniência local, nunca enviado). */
export function lembrarBuscaPitPass(dados: { telefone: string; placa?: string }) {
  try {
    window.localStorage.setItem(CHAVE_LEMBRAR, JSON.stringify({ telefone: dados.telefone, placa: dados.placa ?? "" }));
  } catch {
    // armazenamento indisponível (modo privado etc.): só não pré-preenche
  }
}

function lerBuscaLembrada(): { telefone: string; placa: string } | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_LEMBRAR);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

type Modo = "placa" | "codigo";

export default function MeuPitPass() {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<Modo>("placa");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PitPassPublico[] | null>(null);
  const [selecionado, setSelecionado] = useState<PitPassPublico | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function abrir() {
      const lembrado = lerBuscaLembrada();
      if (lembrado) {
        setTelefone((t) => t || lembrado.telefone);
        setPlaca((p) => p || lembrado.placa);
      }
      setAberto(true);
    }
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  // troca de tela dentro do painel: volta pro topo pra não abrir o PitPass "pela metade"
  useEffect(() => {
    painelRef.current?.scrollTo({ top: 0 });
  }, [resultados, selecionado]);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await fetch("/api/meu-pitpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modo === "placa" ? { telefone, placa } : { telefone, codigo }),
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErro(corpo?.erro ?? "Não foi possível buscar agora. Tente novamente.");
        return;
      }
      const lista: PitPassPublico[] = corpo.agendamentos ?? [];
      setResultados(lista);
      setSelecionado(null);
      if (lista.length > 0 && modo === "placa") lembrarBuscaPitPass({ telefone, placa });
    } catch {
      setErro("Não foi possível buscar agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function novaBusca() {
    setResultados(null);
    setSelecionado(null);
    setErro(null);
  }

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setResultados(null);
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="meu-pitpass-titulo">
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => setAberto(false)}
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
        style={{ animation: "preco-fade 0.2s ease-out" }}
      />

      <div
        ref={painelRef}
        className="folha-entra relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-panel px-5 pb-8 pt-5 sm:max-w-md sm:rounded-2xl sm:px-7"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        {/* alça (mobile) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between gap-4">
          <p id="meu-pitpass-titulo" className="flex items-center gap-2 font-heading text-lg font-bold tracking-[0.12em]">
            <CarSparkMark className="h-5 w-6 text-white" />
            Meu PitPass
          </p>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="font-mono text-xs uppercase tracking-wide text-text-secondary transition-colors hover:text-gold"
          >
            Fechar ✕
          </button>
        </div>

        {/* PitPass completo */}
        {selecionado && (
          <div className="passo-entra mt-5">
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              className="mb-4 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors hover:text-gold"
            >
              ← {resultados && resultados.length > 1 ? "Meus agendamentos" : "Voltar"}
            </button>
            <PitPass
              tipoAtendimento={selecionado.tipoAtendimento}
              planoId={selecionado.planoId}
              nome={selecionado.nome}
              carro={selecionado.carro}
              porteNome={selecionado.porteNome}
              dataIso={selecionado.dia}
              horario={selecionado.horario}
              servicos={selecionado.servicos}
              beneficio={selecionado.beneficio}
              codigo={selecionado.codigo}
              checkinUrl={selecionado.checkinUrl}
              status={selecionado.status}
            />
          </div>
        )}

        {/* Resultados */}
        {!selecionado && resultados && (
          <div className="passo-entra mt-5">
            {resultados.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-asphalt p-5">
                <p className="font-heading text-base font-bold">Nenhum agendamento encontrado</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Não achamos próximos agendamentos com esses dados. Confira o WhatsApp
                  {modo === "placa" ? " e a placa" : " e o código"} usados no agendamento.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  <button type="button" onClick={novaBusca} className="font-mono text-xs uppercase tracking-widest text-gold underline-offset-4 hover:underline">
                    Tentar de novo
                  </button>
                  {modo === "placa" && (
                    <button type="button" onClick={() => trocarModo("codigo")} className="font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline">
                      Buscar com código
                    </button>
                  )}
                </div>
              </div>
            ) : resultados.length === 1 ? (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary">Seu próximo PitStop</p>
                <ResumoAgendamento item={resultados[0]} destaque onAbrir={() => setSelecionado(resultados[0])} />
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                  Seus próximos PitStops · {resultados.length}
                </p>
                <div className="mt-3 space-y-3">
                  {resultados.map((item) => (
                    <ResumoAgendamento key={item.codigo} item={item} onAbrir={() => setSelecionado(item)} />
                  ))}
                </div>
              </>
            )}
            {resultados.length > 0 && (
              <button type="button" onClick={novaBusca} className="mt-5 font-mono text-[11px] uppercase tracking-widest text-text-secondary underline-offset-4 hover:text-gold hover:underline">
                Nova busca
              </button>
            )}
          </div>
        )}

        {/* Busca */}
        {!selecionado && !resultados && (
          <form onSubmit={buscar} className="passo-entra mt-4">
            <p className="text-sm text-text-secondary">
              {modo === "placa"
                ? "Use o WhatsApp e a placa informados no agendamento."
                : "Use o WhatsApp e o código que aparece no seu PitPass."}
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-text-secondary">WhatsApp</span>
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="campo text-base"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(84) 9 9999-9999"
                />
              </label>
              {modo === "placa" ? (
                <label className="block">
                  <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-text-secondary">Placa do veículo</span>
                  <input
                    required
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={9}
                    className="campo font-mono text-base uppercase tracking-wider"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                  />
                </label>
              ) : (
                <label className="block">
                  <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-text-secondary">Código do agendamento</span>
                  <input
                    required
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="campo font-mono text-base uppercase tracking-wider"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="P084-0047"
                  />
                </label>
              )}
            </div>

            {erro && (
              <p role="alert" className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-6 w-full rounded-md bg-gold py-3.5 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110 disabled:opacity-50"
            >
              {carregando ? "Buscando..." : "Buscar meu PitPass"}
            </button>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              {modo === "placa" ? (
                <>
                  <p className="text-xs text-text-secondary">Não cadastrou a placa?</p>
                  <button type="button" onClick={() => trocarModo("codigo")} className="mt-1 font-mono text-xs uppercase tracking-widest text-gold underline-offset-4 hover:underline">
                    Buscar com código
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => trocarModo("placa")} className="font-mono text-xs uppercase tracking-widest text-gold underline-offset-4 hover:underline">
                  Buscar com a placa
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ResumoAgendamento({
  item,
  destaque = false,
  onAbrir,
}: {
  item: PitPassPublico;
  destaque?: boolean;
  onAbrir: () => void;
}) {
  const tema = pitpassTheme[temaDoPlano(item.tipoAtendimento === "assinatura" ? item.planoId : null)];
  const plano = item.tipoAtendimento === "assinatura" && item.planoId ? planos[item.planoId] : null;
  const servico = item.beneficio ?? [item.servicos[0], item.servicos.length > 1 ? `+ ${item.servicos.length - 1}` : ""].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`${tema.classe} pitpass-cartao mt-3 block w-full rounded-xl text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5`}
    >
      <div className="pitpass-filete" />
      <div className={destaque ? "p-5" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-base font-bold tracking-wide text-white">{formatarDataCurta(item.dia)}</p>
            <p className={`font-mono font-semibold leading-none text-white ${destaque ? "mt-1 text-4xl" : "mt-0.5 text-2xl"}`}>
              {item.horario}
            </p>
          </div>
          <span className="font-mono text-xs font-semibold tracking-wide text-white/80">{item.codigo}</span>
        </div>

        <div className="mt-4 space-y-0.5 text-sm">
          <p className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
            {item.carro} • {item.porteNome}
          </p>
          {plano && (
            <p className="pitpass-acento font-heading text-sm font-bold tracking-wide">PitPass {plano.nome}</p>
          )}
          <p className="text-text-primary">
            {item.beneficio && <span className="pitpass-label text-xs">Benefício do plano · </span>}
            {servico}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
            <span className="pitpass-ponto h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            {item.status}
          </span>
          <span className="pitpass-acento font-mono text-[11px] font-semibold uppercase tracking-widest">Ver PitPass →</span>
        </div>
      </div>
    </button>
  );
}
