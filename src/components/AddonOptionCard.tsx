"use client";

import { Servico } from "@/lib/data";
import { formatarDuracao } from "@/lib/catalogo";
import Preco from "./Preco";

/**
 * Card de um adicional. Duas formas, mesma estrutura:
 * - normal: nome, descrição curta, preço, "Ver o que inclui" e "+ Adicionar";
 * - destaque: os primeiros do configurador, com a oferta "Por mais R$ X" e o benefício do serviço.
 * O preço recebido é sempre o do porte atual. Selecionado = borda, fundo, selo e "✓ Adicionado"
 * (o estado não depende só da cor).
 */
export default function AddonOptionCard({
  servico,
  preco,
  selecionado,
  destaque = false,
  selo,
  className = "",
  onToggle,
  onDetalhes,
}: {
  servico: Servico;
  /** null = mediante avaliação (nunca vira "Por mais R$ 0"). */
  preco: number | null;
  selecionado: boolean;
  destaque?: boolean;
  /** Etiqueta pequena acima do nome ("Recomendado"). */
  selo?: string;
  className?: string;
  onToggle: () => void;
  onDetalhes: () => void;
}) {
  const avaliacao = preco == null;
  const rotuloAcao = selecionado
    ? avaliacao
      ? "✓ Avaliação solicitada"
      : "✓ Adicionado"
    : avaliacao
    ? "Solicitar avaliação"
    : "+ Adicionar";

  return (
    <article
      className={`flex flex-col rounded-md border p-4 transition-colors duration-200 ease-out sm:p-5 ${
        selecionado
          ? "border-gold bg-gold/[0.08]"
          : destaque
          ? "border-gold/30 bg-[#1b1915] hover:border-gold/60"
          : "border-white/10 bg-asphalt hover:border-white/25"
      } ${className}`}
    >
      {selo && !selecionado && (
        <p className="mb-2 w-fit rounded-sm bg-gold/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
          {selo}
        </p>
      )}
      {selecionado && (
        <p className="check-entra mb-2 w-fit rounded-sm bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-asphalt">
          ✓ No seu Pitstop
        </p>
      )}

      <h4 className="font-heading text-lg font-bold leading-tight text-text-primary">{servico.nome}</h4>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
        {destaque && servico.chamada ? `${servico.chamada}.` : servico.shortDescription}
      </p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div key={`${servico.id}-${preco ?? "avaliacao"}`} className="preco-fade">
          {avaliacao ? (
            <p className="text-sm font-semibold text-gold">Mediante avaliação</p>
          ) : (
            <>
              {destaque && <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Por mais</p>}
              <Preco valor={preco} className={`mt-0.5 ${destaque ? "text-3xl" : "text-2xl"} text-text-primary`} />
            </>
          )}
        </div>
        {/* tempo extra: informação secundária, só quando a duração do serviço já foi definida */}
        {servico.duracaoMin ? (
          <p className="text-xs text-text-secondary">+ {formatarDuracao(servico.duracaoMin)}</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selecionado}
          aria-label={`${selecionado ? "Remover" : avaliacao ? "Solicitar avaliação de" : "Adicionar"} ${servico.nome}`}
          className={`min-h-11 flex-1 whitespace-nowrap rounded-sm px-4 text-sm font-bold tracking-wide transition-colors duration-200 ${
            selecionado
              ? "border border-gold bg-transparent text-gold"
              : destaque
              ? "bg-gold text-asphalt hover:brightness-110"
              : "border border-white/25 text-text-primary hover:border-gold hover:text-gold"
          }`}
        >
          {rotuloAcao}
        </button>
        <button
          type="button"
          onClick={onDetalhes}
          aria-haspopup="dialog"
          className="min-h-11 whitespace-nowrap text-sm text-text-secondary underline decoration-white/25 underline-offset-4 transition-colors hover:text-gold"
        >
          Ver o que inclui
        </button>
      </div>
    </article>
  );
}
