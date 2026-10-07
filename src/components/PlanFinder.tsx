"use client";

import { useRef, useState, type ReactNode } from "react";
import { listaPortesVeiculo, planos, PlanoId, precoPlano, VehicleSize } from "@/lib/data";
import { getRecommendedPlan, perguntasPlano, RespostasPlano } from "@/lib/planFinder";
import { formatarPrecoPartes } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import Bolt from "./Bolt";

type Passo = "porte" | keyof RespostasPlano;

/**
 * "Qual plano combina com você?": uma pergunta por vez, inline na seção de planos (sem modal).
 * As regras ficam em `getRecommendedPlan` (src/lib/planFinder.ts); aqui é só a experiência.
 */
export default function PlanFinder({
  onConhecer,
  onComparar,
}: {
  onConhecer: (planoId: PlanoId) => void;
  onComparar: () => void;
}) {
  const { porteVeiculo, definirPorteVeiculo, porteDefinidoPeloUsuario } = useSelection();
  const [aberto, setAberto] = useState(false);
  const [passos, setPassos] = useState<Passo[]>([]);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Partial<RespostasPlano>>({});
  const [ultimaRecomendacao, setUltimaRecomendacao] = useState<PlanoId | null>(null);
  const avancoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resultado =
    aberto && indice >= passos.length && respostas.frequencia && respostas.prioridade && respostas.comodidade
      ? getRecommendedPlan(respostas as RespostasPlano)
      : null;

  function comecar() {
    // o porte só entra como pergunta se ainda não foi escolhido em nenhum lugar da página
    setPassos([...(porteDefinidoPeloUsuario ? [] : (["porte"] as Passo[])), "frequencia", "prioridade", "comodidade"]);
    setIndice(0);
    setRespostas({});
    setAberto(true);
  }

  function avancarDepois() {
    if (avancoRef.current) clearTimeout(avancoRef.current);
    // pequena pausa pra pessoa ver a opção marcada antes de trocar de pergunta
    avancoRef.current = setTimeout(() => setIndice((i) => i + 1), 180);
  }

  function responder<K extends keyof RespostasPlano>(id: K, valor: RespostasPlano[K]) {
    setRespostas((atual) => ({ ...atual, [id]: valor }));
    avancarDepois();
  }

  function escolherPorte(porte: VehicleSize) {
    definirPorteVeiculo(porte);
    avancarDepois();
  }

  function voltar() {
    if (avancoRef.current) clearTimeout(avancoRef.current);
    setIndice((i) => Math.max(0, i - 1));
  }

  function fechar() {
    if (avancoRef.current) clearTimeout(avancoRef.current);
    setAberto(false);
  }

  function conhecer(planoId: PlanoId) {
    setUltimaRecomendacao(planoId);
    setAberto(false);
    onConhecer(planoId);
  }

  function comparar() {
    if (resultado) setUltimaRecomendacao(resultado.planoId);
    setAberto(false);
    onComparar();
  }

  if (!aberto) {
    return (
      <div className="rounded-lg border border-white/10 bg-panel p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
            <Bolt className="h-3 w-3" />
            Não sabe qual plano escolher?
          </p>
          <p className="mt-2 font-heading text-xl font-bold">Qual plano combina com você?</p>
          <p className="mt-1 text-sm text-text-secondary">
            {ultimaRecomendacao ? (
              <>
                Pela sua rotina, o <span className="text-gold">{planos[ultimaRecomendacao].nome}</span> combina
                mais com você.
              </>
            ) : (
              "Responda 3 perguntas rápidas e veja qual plano combina mais com a sua rotina."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={comecar}
          className={`mt-4 w-full shrink-0 rounded-md px-6 py-3 font-heading text-sm font-semibold tracking-wide transition sm:mt-0 sm:w-auto ${
            ultimaRecomendacao
              ? "border border-white/15 text-text-primary hover:border-gold hover:text-gold"
              : "bg-gold text-asphalt hover:brightness-110"
          }`}
        >
          {ultimaRecomendacao ? "Refazer respostas" : "Encontrar meu plano →"}
        </button>
      </div>
    );
  }

  const passoAtual = passos[indice];
  const totalPerguntas = passos.length;

  return (
    <div className="rounded-lg border border-gold/40 bg-panel p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          <Bolt className="h-3 w-3" />
          {resultado ? "Seu plano" : "Encontre seu plano"}
        </p>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar assistente de plano"
          className="font-mono text-xs uppercase tracking-wide text-text-secondary transition hover:text-gold"
        >
          Fechar ✕
        </button>
      </div>

      {!resultado && passoAtual && (
        <>
          {/* progresso */}
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-xs text-text-secondary">
              {indice + 1} / {totalPerguntas}
            </span>
            <div className="h-px flex-1 bg-white/10">
              <div
                className="h-px bg-gold transition-[width] duration-300 ease-out"
                style={{ width: `${((indice + 1) / totalPerguntas) * 100}%` }}
              />
            </div>
          </div>

          <div key={passoAtual} className="passo-entra mt-5">
            {passoAtual === "porte" ? (
              <>
                <p className="font-heading text-lg font-bold sm:text-xl">Qual é o seu tipo de veículo?</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {listaPortesVeiculo.map((p) => (
                    <OpcaoAssistente
                      key={p.id}
                      selecionada={porteDefinidoPeloUsuario && porteVeiculo === p.id}
                      onClick={() => escolherPorte(p.id)}
                    >
                      <span className="block font-heading text-base font-bold">{p.nome}</span>
                      <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">
                        {p.descricao}
                      </span>
                    </OpcaoAssistente>
                  ))}
                </div>
              </>
            ) : (
              <PerguntaAtual
                id={passoAtual}
                valorAtual={respostas[passoAtual]}
                onResponder={(valor) => responder(passoAtual, valor as never)}
              />
            )}
          </div>

          {indice > 0 && (
            <button
              type="button"
              onClick={voltar}
              className="mt-5 font-mono text-xs uppercase tracking-widest text-text-secondary transition hover:text-gold"
            >
              ← Voltar
            </button>
          )}
        </>
      )}

      {resultado && <Resultado resultado={resultado} onConhecer={conhecer} onComparar={comparar} onRefazer={comecar} />}
    </div>
  );
}

function PerguntaAtual({
  id,
  valorAtual,
  onResponder,
}: {
  id: keyof RespostasPlano;
  valorAtual: string | undefined;
  onResponder: (valor: string) => void;
}) {
  const pergunta = perguntasPlano.find((p) => p.id === id)!;
  return (
    <>
      <p className="font-heading text-lg font-bold sm:text-xl">{pergunta.titulo}</p>
      <div className="mt-4 grid gap-2.5">
        {pergunta.opcoes.map((opcao) => (
          <OpcaoAssistente
            key={opcao.valor}
            selecionada={valorAtual === opcao.valor}
            onClick={() => onResponder(opcao.valor)}
          >
            <span className="text-sm font-medium text-text-primary">{opcao.rotulo}</span>
          </OpcaoAssistente>
        ))}
      </div>
    </>
  );
}

function OpcaoAssistente({
  selecionada,
  onClick,
  children,
}: {
  selecionada: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionada}
      className={`flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3.5 text-left transition-colors duration-200 ${
        selecionada ? "border-gold bg-gold/10" : "border-white/10 bg-asphalt hover:border-white/30"
      }`}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors duration-200 ${
          selecionada ? "border-gold bg-gold text-asphalt" : "border-white/20"
        }`}
      >
        {selecionada && <span className="check-entra">✓</span>}
      </span>
    </button>
  );
}

function Resultado({
  resultado,
  onConhecer,
  onComparar,
  onRefazer,
}: {
  resultado: ReturnType<typeof getRecommendedPlan>;
  onConhecer: (planoId: PlanoId) => void;
  onComparar: () => void;
  onRefazer: () => void;
}) {
  const { catalogo, porteVeiculo, definirPorteVeiculo } = useSelection();
  const plano = catalogo.planos[resultado.planoId];
  const { moeda, valor } = formatarPrecoPartes(precoPlano(plano, porteVeiculo) ?? 0);

  return (
    <div className="passo-entra mt-4">
      <p className="font-heading text-2xl font-bold leading-tight sm:text-3xl">
        O <span className="text-gold">{plano.nome}</span> combina mais com a sua rotina.
      </p>
      <p className="mt-2 text-sm text-text-secondary">{resultado.motivo}</p>

      <div className="mt-5 rounded-md border border-white/10 bg-asphalt p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="flex items-baseline gap-1 font-mono font-bold text-white">
            <span className="text-sm">{moeda}</span>
            <span key={`${plano.id}-${porteVeiculo}`} className="valor-atualiza text-3xl leading-none">
              {valor}
            </span>
            <span className="text-sm font-normal text-text-secondary">/mês</span>
          </p>
          {/* troca de porte direto no resultado: atualiza o preço aqui e na página toda */}
          <div className="flex rounded-md border border-white/10 p-0.5" role="group" aria-label="Tipo de veículo">
            {listaPortesVeiculo.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => definirPorteVeiculo(p.id)}
                aria-pressed={porteVeiculo === p.id}
                className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors duration-200 ${
                  porteVeiculo === p.id ? "bg-gold text-asphalt" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {resultado.destaques.map((b) => (
            <li key={b} className="flex items-start gap-2 text-text-primary">
              <Bolt className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => onConhecer(plano.id)}
          className="rounded-md bg-gold px-6 py-3 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110"
        >
          Conhecer o {plano.nome}
        </button>
        <button
          type="button"
          onClick={onComparar}
          className="py-2 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 transition hover:text-gold hover:underline"
        >
          Comparar os outros planos
        </button>
        <button
          type="button"
          onClick={onRefazer}
          className="py-2 font-mono text-xs uppercase tracking-widest text-text-secondary underline-offset-4 transition hover:text-gold hover:underline sm:ml-auto"
        >
          ↺ Refazer respostas
        </button>
      </div>
    </div>
  );
}
