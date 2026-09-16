"use client";

import { useEffect } from "react";
import { servicosAvulsos, precoServico } from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import { VehicleSizePill } from "./VehicleSizeSelector";
import Bolt from "./Bolt";

export default function ServicosAvulsosModal({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const { porteVeiculo, selecionarAvulso, setTipoAtendimento } = useSelection();

  useEffect(() => {
    if (!aberto) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  function agendar(servico: (typeof servicosAvulsos)[number]) {
    selecionarAvulso(servico);
    setTipoAtendimento("avulso");
    onFechar();
    scrollToId("agendamento");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-label="Todos os serviços avulsos"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-sm border border-white/10 bg-panel p-6 sm:max-w-2xl sm:rounded-sm sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              <Bolt className="h-3.5 w-3.5 text-gold" />
              Serviços avulsos
            </div>
            <h3 className="font-heading text-2xl font-bold">Tabela completa</h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-sm border border-white/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-secondary transition hover:border-gold hover:text-gold"
          >
            Fechar
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-wide text-text-secondary">
            Seu veículo
          </span>
          <VehicleSizePill />
        </div>

        <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
          {servicosAvulsos.map((servico) => {
            const preco = precoServico(servico, porteVeiculo);
            return (
              <div key={servico.id} className="flex items-center justify-between gap-4 py-4">
                <span className="font-heading text-sm font-bold">{servico.nome}</span>
                <div className="flex shrink-0 items-center gap-4">
                  <span key={`${servico.id}-${porteVeiculo}`} className="preco-fade font-mono text-sm text-gold">
                    {preco != null ? formatarPreco(preco) : "Mediante avaliação"}
                  </span>
                  <button
                    type="button"
                    onClick={() => agendar(servico)}
                    className="font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-gold hover:underline"
                  >
                    {servico.requiresEvaluation ? "Solicitar avaliação" : "Agendar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
