"use client";

import { listaPortesVeiculo, VehicleSize } from "@/lib/data";
import { useSelection } from "@/context/SelectionContext";

/**
 * Seletor de porte (P/G). Lê e grava SEMPRE no SelectionContext (fonte única de verdade):
 * trocar aqui atualiza preços, configurador, planos, assistente, ficha técnica e agendamento.
 */
export function VehicleSizeSelector({
  className = "",
  exigirEscolha = false,
  semTitulo = false,
  onEscolher,
}: {
  className?: string;
  /** Quando quem usa já mostra a pergunta como título da etapa. */
  semTitulo?: boolean;
  /**
   * true no agendamento: nada aparece marcado enquanto o usuário não escolher de verdade
   * (o "P" padrão serve só pra mostrar preço na landing, não vale como resposta).
   */
  exigirEscolha?: boolean;
  onEscolher?: (porte: VehicleSize) => void;
}) {
  const { porteVeiculo, definirPorteVeiculo, porteDefinidoPeloUsuario } = useSelection();
  const temSelecao = !exigirEscolha || porteDefinidoPeloUsuario;

  return (
    <div className={className}>
      {!semTitulo && (
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-secondary">
          Qual é o seu tipo de veículo?
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {listaPortesVeiculo.map((porte) => {
          const selecionado = temSelecao && porteVeiculo === porte.id;
          return (
            <button
              key={porte.id}
              type="button"
              onClick={() => {
                definirPorteVeiculo(porte.id);
                onEscolher?.(porte.id);
              }}
              aria-pressed={selecionado}
              className={`flex items-center justify-between gap-3 rounded-sm border px-5 py-3 text-left transition-colors duration-200 ${
                selecionado ? "border-gold bg-gold/[0.07]" : "border-white/10 bg-asphalt hover:border-white/30"
              }`}
            >
              <span>
                <span className="block font-heading text-sm font-bold">{porte.nome}</span>
                <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">
                  {porte.descricao}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors duration-200 ${
                  selecionado ? "border-gold bg-gold text-asphalt" : "border-white/20"
                }`}
              >
                {selecionado && <span className="check-entra">✓</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
