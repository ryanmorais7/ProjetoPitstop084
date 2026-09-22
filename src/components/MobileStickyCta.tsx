"use client";

import { useEffect, useState } from "react";
import { duchaPitstop, precoServico } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import Bolt from "./Bolt";

export default function MobileStickyCta() {
  const { porteVeiculo, avulsosSelecionados } = useSelection();
  const [visivel, setVisivel] = useState(false);
  const [dentroConfigurador, setDentroConfigurador] = useState(false);
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
    const secao = document.getElementById("servicos");
    if (!secao) return;
    const observer = new IntersectionObserver(
      ([entrada]) => setDentroConfigurador(entrada.isIntersecting),
      { rootMargin: "-40% 0px -40% 0px" }
    );
    observer.observe(secao);
    return () => observer.disconnect();
  }, []);

  const precoDucha = precoServico(duchaPitstop, porteVeiculo) ?? 0;
  const totalAdicionais = avulsosSelecionados
    .filter((s) => s.precos)
    .reduce((soma, s) => soma + (precoServico(s, porteVeiculo) ?? 0), 0);
  const total = precoDucha + totalAdicionais;
  const mostrarResumo = dentroConfigurador && avulsosSelecionados.length > 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asphalt/95 p-3 backdrop-blur transition-transform duration-300 md:hidden ${
        visivel ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {mostrarResumo && resumoAberto && (
        <div className="mb-2 rounded-sm border border-white/10 bg-panel p-3 font-mono text-xs">
          <div className="flex justify-between text-text-secondary">
            <span>Ducha Pitstop</span>
            <span className="text-white">{formatarPreco(precoDucha)}</span>
          </div>
          {avulsosSelecionados.map((s) => {
            const preco = precoServico(s, porteVeiculo);
            return (
              <div key={s.id} className="mt-1 flex justify-between text-text-secondary">
                <span>+ {s.nome}</span>
                <span className="text-white">
                  {preco != null ? formatarPreco(preco) : "Mediante avaliação"}
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
            className="flex flex-1 flex-col items-start text-left"
          >
            <span className="font-mono text-[11px] uppercase tracking-wide text-text-secondary">
              {avulsosSelecionados.length} cuidado{avulsosSelecionados.length > 1 ? "s" : ""}
            </span>
            <span key={total} className="preco-fade font-mono text-sm font-bold text-gold">
              {formatarPreco(total)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => scrollToId("agendamento")}
            className="flex items-center gap-1.5 rounded-sm bg-gold px-6 py-3 text-center font-heading text-sm font-semibold tracking-wide text-asphalt"
          >
            <Bolt className="h-3.5 w-3.5" />
            Agendar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => scrollToId("agendamento")}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-gold py-3 text-center font-heading text-sm font-semibold tracking-wide text-asphalt"
        >
          <Bolt className="h-3.5 w-3.5" />
          Agendar
        </button>
      )}
    </div>
  );
}
