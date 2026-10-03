"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FichaTecnica, NivelCuidado as Nivel } from "@/lib/data";
import NivelCuidado from "./NivelCuidado";

interface Aba {
  rotulo: string;
  ativa: boolean;
  onClick: () => void;
}

/**
 * Ficha técnica de um serviço ou lavagem: bottom sheet no mobile, drawer lateral no desktop.
 * Só apresenta — o conteúdo vem inteiro de `ficha` (src/lib/data.ts) e as ações de quem abre.
 */
export default function FichaTecnicaSheet({
  ficha,
  etiqueta,
  nivel,
  abas,
  tituloInclui = "O que será feito",
  incluiTudoDe,
  diferencial,
  valor,
  acao,
  onFechar,
}: {
  /** null = fechada. */
  ficha: FichaTecnica | null;
  /** Linha pequena acima do nome ("Serviço adicional", "Plano Gold"...). */
  etiqueta?: string;
  nivel?: Nivel | null;
  /** Troca entre fichas irmãs (lavagens do mesmo plano) sem fechar. */
  abas?: Aba[];
  tituloInclui?: string;
  incluiTudoDe?: string;
  diferencial?: string;
  /** Preço, "Mediante avaliação" ou cota do benefício, no rodapé. */
  valor?: ReactNode;
  acao?: ReactNode;
  onFechar: () => void;
}) {
  const aberta = ficha !== null;
  const fecharRef = useRef<HTMLButtonElement>(null);
  const corpoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberta) return;
    const focoAnterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoTeclar);
      focoAnterior?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a abrir/fechar; onFechar muda de identidade a cada render
  }, [aberta]);

  // trocou de aba: volta pro topo da nova ficha
  useEffect(() => {
    corpoRef.current?.scrollTo({ top: 0 });
  }, [ficha?.id]);

  if (!ficha) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ficha-tecnica-titulo"
    >
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onFechar}
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
        style={{ animation: "preco-fade 0.2s ease-out" }}
      />

      <div className="ficha-entra relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl border border-white/10 bg-panel md:max-h-none md:w-[28rem] md:rounded-none md:border-y-0 md:border-r-0">
        {/* alça (mobile) */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" aria-hidden="true" />

        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-5 pt-4 md:px-8 md:pt-8">
          <div className="min-w-0">
            {etiqueta && (
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">{etiqueta}</p>
            )}
            <h3 id="ficha-tecnica-titulo" className="mt-1.5 font-heading text-2xl font-bold leading-tight">
              {ficha.nome}
            </h3>
          </div>
          <button
            ref={fecharRef}
            type="button"
            onClick={onFechar}
            aria-label="Fechar ficha técnica"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-gold"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {abas && abas.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-6 pb-4 md:px-8">
            {abas.map((aba) => (
              <button
                key={aba.rotulo}
                type="button"
                onClick={aba.onClick}
                aria-pressed={aba.ativa}
                className={`shrink-0 rounded-full border px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 ${
                  aba.ativa
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-white/10 text-text-secondary hover:border-white/30"
                }`}
              >
                {aba.rotulo}
              </button>
            ))}
          </div>
        )}

        <div ref={corpoRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/[0.07] px-6 py-6 md:px-8">
          <div key={ficha.id} className="passo-entra space-y-7">
            {ficha.shortDescription && (
              <p className="text-[15px] leading-relaxed text-text-primary">{ficha.shortDescription}</p>
            )}

            {nivel && <NivelCuidado nivel={nivel} />}

            {ficha.idealFor && ficha.idealFor.length > 0 && (
              <Bloco titulo="Ideal para">
                <ul className="flex flex-wrap gap-2">
                  {ficha.idealFor.map((item) => (
                    <li
                      key={item}
                      className="rounded-sm border border-white/10 bg-asphalt px-3 py-1.5 text-sm text-text-primary"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Bloco>
            )}

            {ficha.includes && ficha.includes.length > 0 && (
              <Bloco titulo={tituloInclui}>
                {incluiTudoDe && (
                  <p className="mb-3 text-sm text-text-secondary">
                    Tudo da <span className="text-text-primary">{incluiTudoDe}</span>, mais:
                  </p>
                )}
                <ul className="space-y-2.5">
                  {ficha.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-primary">
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </Bloco>
            )}

            {ficha.expectedResult && (
              <Bloco titulo="Resultado esperado">
                <p className="text-sm leading-relaxed text-text-primary">{ficha.expectedResult}</p>
              </Bloco>
            )}

            {diferencial && (
              <Bloco titulo="Diferencial do nível">
                <p className="text-sm leading-relaxed text-text-primary">{diferencial}</p>
              </Bloco>
            )}

            {ficha.technicalNote && (
              <div className="rounded-sm border border-white/10 bg-asphalt p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary">Importante</p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{ficha.technicalNote}</p>
              </div>
            )}
          </div>
        </div>

        {(valor || acao) && (
          <div
            className="shrink-0 border-t border-white/10 bg-panel px-6 pt-4 md:px-8"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            {valor && <div className="mb-3 flex items-baseline justify-between gap-3">{valor}</div>}
            {acao}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-gold">{titulo}</h4>
      {children}
    </section>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`mt-[3px] h-3.5 w-3.5 shrink-0 text-gold/80 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
