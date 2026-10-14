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

/**
 * Seletor de veículo. Lê e grava SEMPRE no SelectionContext (fonte única de verdade):
 * trocar aqui atualiza preços, configurador, planos, ficha técnica e agendamento.
 *
 * Primeiro CARRO ou MOTO. Carro escolhe o porte (P/G) logo abaixo; moto não tem porte.
 * Sem atendimento de moto ativo no catálogo, o seletor volta a ser só o porte do carro.
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
  /** Chamado quando a escolha fica completa: porte do carro (P/G) ou "MOTO". */
  onEscolher?: (categoria: CategoriaVeiculo) => void;
}) {
  const {
    porteVeiculo,
    definirPorteVeiculo,
    tipoVeiculo,
    definirCarro,
    definirMoto,
    motoDisponivel,
    porteDefinidoPeloUsuario,
  } = useSelection();
  const temSelecao = !exigirEscolha || porteDefinidoPeloUsuario;
  const ehMoto = motoDisponivel && tipoVeiculo === "moto";

  return (
    <div className={className}>
      {!semTitulo && (
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-secondary">
          {motoDisponivel ? "Qual é o seu veículo?" : "Qual é o seu tipo de veículo?"}
        </p>
      )}

      {motoDisponivel && (
        <div role="group" aria-label="Tipo de veículo" className="mb-3 grid grid-cols-2 gap-1 rounded-sm border border-white/10 bg-asphalt p-1">
          {(["carro", "moto"] as const).map((tipo) => {
            const ativo = tipoVeiculo === tipo && (tipo === "carro" || temSelecao);
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  if (tipo === "moto") {
                    definirMoto();
                    onEscolher?.("MOTO");
                  } else {
                    definirCarro();
                  }
                }}
                className={`min-h-11 rounded-sm font-heading text-sm font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
                  ativo ? "bg-gold text-asphalt" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tipo === "carro" ? "Carro" : "Moto"}
              </button>
            );
          })}
        </div>
      )}

      {/* porte só existe pra carro */}
      {!ehMoto && (
        <div className="grid gap-3 sm:grid-cols-2">
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
                <Marcador selecionado={selecionado} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
