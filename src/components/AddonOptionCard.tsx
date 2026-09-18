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
      className={`flex w-full flex-col rounded-sm border p-4 text-left transition ${
        selecionado
          ? "border-gold bg-gold/10"
          : "border-white/10 bg-asphalt hover:border-white/25"
      }`}
    >
      <span className="font-heading text-sm font-bold">
        {selecionado ? (
          <span className="text-gold">✓ </span>
        ) : (
          <span className="text-text-secondary">+ </span>
        )}
        {servico.nome}
      </span>
      {servico.shortDescription && (
        <p className="mt-1 text-xs text-text-secondary">{servico.shortDescription}</p>
      )}
      <span
        key={`${servico.id}-${preco ?? "avaliacao"}`}
        className="preco-fade mt-2 block text-right font-mono text-xs text-gold"
      >
        {preco != null ? formatarPreco(preco) : selecionado ? "Avaliação solicitada" : "Mediante avaliação"}
      </span>
    </button>
  );
}
