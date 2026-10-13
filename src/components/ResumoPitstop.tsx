"use client";

import { ReactNode } from "react";
import { formatarDuracao } from "@/lib/catalogo";
import { usePitstop, useSelection } from "@/context/SelectionContext";
import Preco from "./Preco";

/**
 * "Seu Pitstop": Ducha, adicionais, tempo estimado e total. Mesmo resumo na landing e no
 * agendamento, lendo de `usePitstop` (o valor daqui é o valor do card e o que o servidor recalcula).
 */
export default function ResumoPitstop({ children }: { children?: ReactNode }) {
  const { alternarAvulso } = useSelection();
  const { base, precoBase, adicionais, preco, emAvaliacao, total, duracaoMin } = usePitstop();

  return (
    <div className="rounded-md border border-gold/40 bg-asphalt p-5 sm:p-6">
      <h4 className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-gold">Seu Pitstop</h4>

      <ul className="mt-3 divide-y divide-white/[0.07] text-[15px]">
        <li className="flex items-baseline justify-between gap-4 py-3">
          <span className="font-semibold text-text-primary">{base?.nome ?? "Ducha Pitstop"}</span>
          <Preco valor={precoBase} className="text-lg text-text-primary" />
        </li>
        {adicionais.map((s) => {
          const valor = preco(s);
          return (
            <li key={s.id} className="passo-entra flex items-start justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="text-text-primary">{s.nome}</span>
                <button
                  type="button"
                  onClick={() => alternarAvulso(s)}
                  className="mt-0.5 block text-xs text-text-secondary underline underline-offset-4 hover:text-gold"
                >
                  Remover
                </button>
              </span>
              {valor != null ? (
                <span className="flex shrink-0 items-baseline gap-1 text-text-primary">
                  <span className="text-sm text-text-secondary">+</span>
                  <Preco valor={valor} className="text-lg" />
                </span>
              ) : (
                <span className="shrink-0 text-xs font-semibold text-gold">Avaliação solicitada</span>
              )}
            </li>
          );
        })}
      </ul>

      {/* tempo só com todas as durações definidas: nunca uma soma pela metade */}
      {duracaoMin != null && (
        <div className="flex items-baseline justify-between gap-4 border-t border-white/[0.07] py-3 text-sm">
          <span className="text-text-secondary">Tempo estimado</span>
          <span key={duracaoMin} className="valor-atualiza font-semibold text-text-primary">
            {formatarDuracao(duracaoMin)}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-5">
        <span className="font-heading text-base font-bold uppercase tracking-[0.14em] text-text-secondary">Total</span>
        <span aria-live="polite">
          <span key={total} className="valor-atualiza">
            <Preco valor={total} className="text-4xl text-gold" />
          </span>
        </span>
      </div>
      {emAvaliacao.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
          + avaliação solicitada para {emAvaliacao.map((s) => s.nome).join(", ")}. O valor não entra no total: nossa
          equipe define com você.
        </p>
      )}

      {children}
    </div>
  );
}
