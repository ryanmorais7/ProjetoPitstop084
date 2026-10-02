"use client";

import { useState } from "react";
import { Plano, VehicleSize } from "@/lib/data";
import { formatarPrecoPartes } from "@/lib/format";
import Bolt from "./Bolt";

const estilosPorPlano: Record<
  Plano["id"],
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
  destacado = false,
}: {
  plano: Plano;
  porteVeiculo: VehicleSize;
  onClick?: () => void;
  /** Plano recomendado pelo assistente: recebe um realce curto, sem esconder os outros. */
  destacado?: boolean;
}) {
  const [verTodos, setVerTodos] = useState(false);
  const estilo = estilosPorPlano[plano.id];
  const preco = plano.precos[porteVeiculo];
  const { moeda, valor } = formatarPrecoPartes(preco);
  const textoSecundario = plano.id === "diamante" ? "text-light-text-secondary" : "text-text-secondary";
  const ocultos = plano.beneficios.length - BENEFICIOS_VISIVEIS_MOBILE;

  return (
    <div
      id={`plano-${plano.id}`}
      className={`relative flex h-full flex-col rounded-sm p-6 ${estilo.card} ${destacado ? "destaque-plano" : ""}`}
    >
      {(destacado || plano.badge) && (
        <div className="mb-3 flex flex-wrap gap-2">
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

      <p className={`mt-3 flex flex-wrap items-baseline gap-x-1 font-mono font-bold ${estilo.preco}`}>
        <span className="text-sm font-semibold">{moeda}</span>
        <span
          key={porteVeiculo}
          className="valor-atualiza text-[clamp(1.5rem,4.5vw,1.875rem)] leading-none"
        >
          {valor}
        </span>
        <span className={`whitespace-nowrap text-sm font-normal ${textoSecundario}`}>/mês</span>
      </p>
      <p className={`mt-3 text-sm ${textoSecundario}`}>{plano.headline}</p>

      <ul className="mt-5 space-y-2.5 text-sm">
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

      <button
        type="button"
        onClick={onClick}
        className={`mt-auto flex items-center justify-center gap-1 rounded-sm py-3 font-heading text-xs font-bold uppercase tracking-wide transition ${estilo.cta}`}
      >
        {plano.cta}
      </button>
    </div>
  );
}
