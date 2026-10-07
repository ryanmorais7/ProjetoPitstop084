"use client";

import { CategoriaVeiculo, listaPortesVeiculo } from "@/lib/data";
import { useSelection } from "@/context/SelectionContext";

function Marcador({ selecionado }: { selecionado: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors duration-200 ${
        selecionado ? "border-gold bg-gold text-asphalt" : "border-white/20"
      }`}
    >
      {selecionado && <span className="check-entra">✓</span>}
    </span>
  );
}

const classeOpcao = (selecionado: boolean) =>
  `flex items-center justify-between gap-3 rounded-sm border px-5 py-3 text-left transition-colors duration-200 ${
    selecionado ? "border-gold bg-gold/[0.07]" : "border-white/10 bg-asphalt hover:border-white/30"
  }`;

/**
 * Seletor de veículo. Lê e grava SEMPRE no SelectionContext (fonte única de verdade):
 * trocar aqui atualiza preços, configurador, planos, assistente, ficha técnica e agendamento.
 *
 * Carro escolhe o porte (P/G). Moto não tem porte: entra como opção própria, e só aparece
 * quando o atendimento de moto está liberado no catálogo (Ducha Moto ativa e com preço).
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
  onEscolher?: (categoria: CategoriaVeiculo) => void;
}) {
  const { porteVeiculo, definirPorteVeiculo, tipoVeiculo, definirMoto, motoDisponivel, porteDefinidoPeloUsuario } =
    useSelection();
  const temSelecao = !exigirEscolha || porteDefinidoPeloUsuario;
  const motoSelecionada = temSelecao && tipoVeiculo === "moto";

  return (
    <div className={className}>
      {!semTitulo && (
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-secondary">
          {motoDisponivel ? "Qual é o seu veículo?" : "Qual é o seu tipo de veículo?"}
        </p>
      )}
      <div className={`grid gap-3 ${motoDisponivel ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {listaPortesVeiculo.map((porte) => {
          const selecionado = temSelecao && tipoVeiculo === "carro" && porteVeiculo === porte.id;
          return (
            <button
              key={porte.id}
              type="button"
              onClick={() => {
                definirPorteVeiculo(porte.id);
                onEscolher?.(porte.id);
              }}
              aria-pressed={selecionado}
              className={classeOpcao(selecionado)}
            >
              <span>
                <span className="block font-heading text-sm font-bold">{porte.nome}</span>
                <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">
                  {motoDisponivel ? `Carro · ${porte.descricao}` : porte.descricao}
                </span>
              </span>
              <Marcador selecionado={selecionado} />
            </button>
          );
        })}
        {motoDisponivel && (
          <button
            type="button"
            onClick={() => {
              definirMoto();
              onEscolher?.("MOTO");
            }}
            aria-pressed={motoSelecionada}
            className={classeOpcao(motoSelecionada)}
          >
            <span>
              <span className="block font-heading text-sm font-bold">Moto</span>
              <span className="block font-mono text-xs uppercase tracking-wide text-text-secondary">Motocicleta</span>
            </span>
            <Marcador selecionado={motoSelecionada} />
          </button>
        )}
      </div>
    </div>
  );
}
