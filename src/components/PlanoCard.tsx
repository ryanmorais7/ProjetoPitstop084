"use client";

import { useState } from "react";
import { CategoriaVeiculo, Plano, precoPlano } from "@/lib/data";
import { temaDoPlano } from "@/lib/pitpassTheme";
import Bolt from "./Bolt";
import NivelCuidado from "./NivelCuidado";
import Preco from "./Preco";

// Moto Black / Moto Gold usam o visual do nível equivalente; o que muda é o indicador MOTO.
const estilosPorPlano: Record<
  "black" | "gold" | "diamante",
  { card: string; nome: string; preco: string; cta: string; check: string }
> = {
  black: {
    card: "border border-white/15 bg-asphalt",
    nome: "text-white",
    preco: "text-white",
    cta: "bg-gold text-asphalt hover:brightness-110",
    check: "text-gold",
  },
  gold: {
    card: "border-2 border-gold bg-panel",
    nome: "text-gold",
    preco: "text-gold",
    cta: "bg-gold text-asphalt hover:brightness-110",
    check: "text-gold",
  },
  diamante: {
    card: "border border-black/10 bg-light",
    nome: "text-light-text",
    preco: "text-light-text",
    cta: "bg-light-text text-light hover:opacity-90",
    check: "text-gold",
  },
};

/** No mobile, os primeiros benefícios ficam sempre visíveis (comparação continua possível); o resto expande. */
const BENEFICIOS_VISIVEIS_MOBILE = 3;

export default function PlanoCard({
  plano,
  porteVeiculo,
  onClick,
  onVerInclui,
  destacado = false,
}: {
  plano: Plano;
  porteVeiculo: CategoriaVeiculo;
  onClick?: () => void;
  /** Abre a ficha técnica das lavagens do plano. */
  onVerInclui?: () => void;
  /** Plano recomendado pelo assistente: recebe um realce curto, sem esconder os outros. */
  destacado?: boolean;
}) {
  const [verTodos, setVerTodos] = useState(false);
  const tema = temaDoPlano(plano.id);
  const estilo = estilosPorPlano[tema === "avulso" ? "black" : tema];
  const preco = precoPlano(plano, porteVeiculo);
  const ehMoto = plano.tipoVeiculo === "moto";
  const textoSecundario = plano.id === "diamante" ? "text-light-text-secondary" : "text-text-secondary";
  const ocultos = plano.beneficios.length - BENEFICIOS_VISIVEIS_MOBILE;

  return (
    <div
      id={`plano-${plano.id}`}
      className={`relative flex h-full flex-col rounded-sm p-6 ${estilo.card} ${destacado ? "destaque-plano" : ""}`}
    >
      {(destacado || plano.badge || ehMoto) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {ehMoto && (
            <span className="w-fit rounded-sm border border-white/25 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
              Moto
            </span>
          )}
          {destacado && (
            <span className="check-entra w-fit rounded-sm border border-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-gold">
              ✓ Combina com você
            </span>
          )}
          {plano.badge && (
            <span className="w-fit rounded-sm bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-asphalt">
              {plano.badge}
            </span>
          )}
        </div>
      )}
      <h3 className={`font-heading text-2xl font-bold ${estilo.nome}`}>{plano.nome}</h3>
      <NivelCuidado nivel={plano.nivel} claro={plano.id === "diamante"} className="mt-3" />

      <p className={`mt-6 flex flex-wrap items-baseline gap-x-1.5 ${estilo.preco}`}>
        <span key={porteVeiculo} className="valor-atualiza">
          {preco != null && <Preco valor={preco} className="text-4xl" />}
        </span>
        <span className={`whitespace-nowrap font-mono text-xs ${textoSecundario}`}>/mês</span>
      </p>
      <p className={`mt-4 text-sm leading-relaxed ${textoSecundario}`}>{plano.headline}</p>

      <ul className="mt-6 space-y-2.5 text-sm">
        {plano.beneficios.map((item, i) => (
          <li
            key={item}
            className={`items-start gap-2 leading-relaxed ${plano.id === "diamante" ? "text-light-text" : "text-white"} ${
              i < BENEFICIOS_VISIVEIS_MOBILE ? "flex" : verTodos ? "passo-entra flex" : "hidden md:flex"
            }`}
          >
            <Bolt className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${estilo.check}`} />
            {item}
          </li>
        ))}
      </ul>
      {ocultos > 0 && (
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          aria-expanded={verTodos}
          className={`mt-3 w-fit font-mono text-[11px] uppercase tracking-widest underline-offset-4 hover:underline md:hidden ${textoSecundario}`}
        >
          {verTodos ? "Mostrar menos ↑" : `Ver benefícios (+${ocultos})`}
        </button>
      )}
      <div className="mb-8" />

      {onVerInclui && (
        <button
          type="button"
          onClick={onVerInclui}
          aria-haspopup="dialog"
          className={`mb-3 mt-auto rounded-sm border py-3 font-mono text-[11px] uppercase tracking-widest transition-colors duration-200 ${
            plano.id === "diamante"
              ? "border-black/15 text-light-text hover:border-black/40"
              : "border-white/15 text-text-primary hover:border-gold hover:text-gold"
          }`}
        >
          Ver o que inclui
        </button>
      )}
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center justify-center gap-1 rounded-sm py-3.5 font-heading text-xs font-bold uppercase tracking-[0.12em] transition ${
          onVerInclui ? "" : "mt-auto"
        } ${estilo.cta}`}
      >
        {plano.cta}
      </button>
    </div>
  );
}
