"use client";

import { Servico } from "@/lib/data";
import Preco from "./Preco";

/**
 * Card compacto de um adicional: nome, uma descrição curta e o preço. O corpo abre a ficha
 * técnica; o marcador no canto adiciona/remove direto, sem precisar abrir nada.
 */
export default function AddonOptionCard({
  servico,
  preco,
  selecionado,
  onToggle,
  onDetalhes,
}: {
  servico: Servico;
  preco: number | null;
  selecionado: boolean;
  onToggle: () => void;
  onDetalhes: () => void;
}) {
  return (
    <div
      className={`relative rounded-sm border transition-colors duration-200 ease-out ${
        selecionado ? "border-gold bg-gold/[0.07]" : "border-white/10 bg-asphalt hover:border-white/25"
      }`}
    >
      <button
        type="button"
        onClick={onDetalhes}
        aria-haspopup="dialog"
        className="flex h-full w-full flex-col p-4 text-left"
      >
        <span
          className={`block pr-9 font-heading text-[15px] font-bold leading-tight transition-colors duration-200 ${
            selecionado ? "text-gold" : "text-text-primary"
          }`}
        >
          {servico.nome}
        </span>
        {servico.shortDescription && (
          <span className="mt-2 line-clamp-2 block text-[13px] leading-snug text-text-secondary">
            {servico.shortDescription}
          </span>
        )}
        <span className="mt-auto flex items-end justify-between gap-3 pt-4">
          <span key={`${servico.id}-${preco ?? "avaliacao"}`} className="preco-fade">
            {preco != null ? (
              <Preco valor={preco} className="text-xl text-text-primary" />
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold">
                {selecionado ? "Avaliação solicitada" : "Mediante avaliação"}
              </span>
            )}
          </span>
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-text-secondary underline decoration-white/20 underline-offset-4">
            Ver o que inclui
          </span>
        </span>
      </button>

      {/* marcador: vira check dourado ao adicionar, volta a "+" ao remover. Área de toque de 44px. */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selecionado}
        aria-label={`${selecionado ? "Remover" : "Adicionar"} ${servico.nome}`}
        className="absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center"
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-200 ${
            selecionado ? "border-gold bg-gold text-asphalt" : "border-white/25 text-text-secondary"
          }`}
        >
          {selecionado ? <span className="check-entra">✓</span> : "+"}
        </span>
      </button>
    </div>
  );
}
