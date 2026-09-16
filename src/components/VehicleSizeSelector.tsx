"use client";

import { listaPortesVeiculo, VehicleSize } from "@/lib/data";
import { useSelection } from "@/context/SelectionContext";

export function VehicleSizeSelector({ className = "" }: { className?: string }) {
  const { porteVeiculo, definirPorteVeiculo } = useSelection();

  return (
    <div className={className}>
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-secondary">
        Qual é o seu tipo de veículo?
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {listaPortesVeiculo.map((porte) => (
          <button
            key={porte.id}
            type="button"
            onClick={() => definirPorteVeiculo(porte.id)}
            aria-pressed={porteVeiculo === porte.id}
            className={`rounded-sm border px-5 py-3 text-left transition ${
              porteVeiculo === porte.id
                ? "border-gold bg-panel"
                : "border-white/10 bg-panel hover:border-white/30"
            }`}
          >
            <span className="block font-heading text-sm font-bold">{porte.nome}</span>
            <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">
              {porte.descricao}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function VehicleSizePill({ className = "" }: { className?: string }) {
  const { porteVeiculo, definirPorteVeiculo } = useSelection();

  function alternar(porte: VehicleSize) {
    definirPorteVeiculo(porte);
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-asphalt p-1 font-mono text-xs uppercase tracking-wide ${className}`}
    >
      {listaPortesVeiculo.map((porte) => (
        <button
          key={porte.id}
          type="button"
          onClick={() => alternar(porte.id)}
          aria-pressed={porteVeiculo === porte.id}
          className={`rounded-full px-3 py-1.5 transition ${
            porteVeiculo === porte.id
              ? "bg-gold text-asphalt"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {porte.nome}
        </button>
      ))}
    </div>
  );
}
