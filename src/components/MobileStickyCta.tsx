"use client";

import { useEffect, useState } from "react";
import { formatarPreco } from "@/lib/format";
import { usePitstop, useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import Bolt from "./Bolt";

export default function MobileStickyCta() {
  const { agendarPitstop } = useSelection();
  // mesma conta do configurador e do agendamento (porte atual, adicionais escolhidos)
  const { base, precoBase, adicionais, preco, total } = usePitstop();
  const [visivel, setVisivel] = useState(false);
  const [dentroConfigurador, setDentroConfigurador] = useState(false);
  const [dentroAgendamento, setDentroAgendamento] = useState(false);
  const [resumoAberto, setResumoAberto] = useState(false);

  useEffect(() => {
    let ticking = false;

    function verificar() {
      setVisivel(window.scrollY > window.innerHeight * 0.9);
      ticking = false;
    }

    function aoRolar() {
      if (!ticking) {
        requestAnimationFrame(verificar);
        ticking = true;
      }
    }

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    const observar = (id: string, margem: string, aoMudar: (dentro: boolean) => void) => {
      const secao = document.getElementById(id);
      if (!secao) return () => {};
      const observer = new IntersectionObserver(([entrada]) => aoMudar(entrada.isIntersecting), { rootMargin: margem });
      observer.observe(secao);
      return () => observer.disconnect();
    };
    const pararConfigurador = observar("servicos", "-40% 0px -40% 0px", setDentroConfigurador);
    // dentro do agendamento a barra some: ela cobriria os botões de continuar, horários e campos
    const pararAgendamento = observar("agendamento", "-30% 0px -30% 0px", setDentroAgendamento);
    return () => {
      pararConfigurador();
      pararAgendamento();
    };
  }, []);

  const mostrarResumo = dentroConfigurador && adicionais.length > 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asphalt/95 p-3 backdrop-blur transition-transform duration-300 md:hidden ${
        visivel && !dentroAgendamento ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      inert={!visivel || dentroAgendamento}
    >
      {mostrarResumo && resumoAberto && (
        <div className="mb-2 rounded-sm border border-white/10 bg-panel p-3 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>{base?.nome ?? "Ducha Pitstop"}</span>
            <span className="font-semibold text-white">{formatarPreco(precoBase)}</span>
          </div>
          {adicionais.map((s) => {
            const valor = preco(s);
            return (
              <div key={s.id} className="mt-1 flex justify-between gap-3 text-text-secondary">
                <span>+ {s.nome}</span>
                <span className="shrink-0 font-semibold text-white">
                  {valor != null ? formatarPreco(valor) : "Avaliação solicitada"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {mostrarResumo ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResumoAberto((atual) => !atual)}
            aria-expanded={resumoAberto}
            className="flex min-h-11 flex-1 flex-col items-start justify-center text-left"
          >
            <span className="text-xs text-text-secondary">
              Ducha + {adicionais.length} cuidado{adicionais.length > 1 ? "s" : ""}
            </span>
            <span className="font-heading text-lg font-bold leading-tight text-gold">
              <span key={total} className="valor-atualiza">
                {formatarPreco(total)}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              // já montou o Pitstop: leva a seleção direto pra data e horário
              agendarPitstop();
              scrollToId("agendamento");
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-sm bg-gold px-6 py-3 text-center font-heading text-sm font-semibold tracking-wide text-asphalt"
          >
            <Bolt className="h-3.5 w-3.5" />
            Agendar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => scrollToId("agendamento")}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-sm bg-gold py-3 text-center font-heading text-sm font-semibold tracking-wide text-asphalt"
        >
          <Bolt className="h-3.5 w-3.5" />
          Agendar
        </button>
      )}
    </div>
  );
}
