"use client";

import { Servico } from "@/lib/data";
import { formatarPreco } from "@/lib/format";

export default function AddonOptionCard({
  servico,
  preco,
  selecionado,
  onToggle,
}: {
  servico: Servico;
  preco: number | null;
  selecionado: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selecionado}
      className={`flex w-full items-start gap-3 rounded-sm border p-3 text-left transition-colors duration-200 ease-out ${
        selecionado
          ? "border-gold bg-gold/10"
          : "border-white/10 bg-asphalt hover:border-white/25"
      }`}
    >
      {/* marcador: vira check dourado ao adicionar, volta a "+" ao remover */}
      <span
        aria-hidden="true"
        className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors duration-200 ${
          selecionado ? "border-gold bg-gold text-asphalt" : "border-white/20 text-text-secondary"
        }`}
      >
        {selecionado ? <span className="check-entra">✓</span> : "+"}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block font-heading text-sm font-bold leading-tight transition-colors duration-200 ${
            selecionado ? "text-gold" : "text-text-primary"
          }`}
        >
          {servico.nome}
        </span>
        {servico.shortDescription && (
          <span className="mt-1 line-clamp-2 block text-xs text-text-secondary">{servico.shortDescription}</span>
        )}
        <span
          key={`${servico.id}-${preco ?? "avaliacao"}`}
          className="preco-fade mt-1.5 block text-right font-mono text-xs text-gold"
        >
          {preco != null ? formatarPreco(preco) : selecionado ? "Avaliação solicitada" : "Mediante avaliação"}
        </span>
      </span>
    </button>
  );
}
