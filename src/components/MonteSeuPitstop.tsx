"use client";

import { usePitstop, useSelection } from "@/context/SelectionContext";
import { scrollToId } from "@/lib/scroll";
import { VehicleSizeSelector } from "./VehicleSizeSelector";
import ConfiguradorPitstop from "./ConfiguradorPitstop";
import ResumoPitstop from "./ResumoPitstop";

/**
 * Configurador principal da landing: porte → Ducha incluída → adicionais → resumo → Agendar.
 * Quem monta aqui não monta de novo: "Agendar" leva a seleção inteira direto pra data e horário.
 */
export default function MonteSeuPitstop() {
  const { agendarPitstop } = useSelection();
  const { adicionais } = usePitstop();

  function agendar() {
    agendarPitstop();
    scrollToId("agendamento");
  }

  return (
    <div className="rounded-sm border border-white/10 bg-panel p-5 sm:p-7 lg:p-8">
      <h3 className="font-heading text-2xl font-bold tracking-wide">Monte seu Pitstop</h3>
      <p className="mt-1.5 text-sm text-text-secondary">
        Comece com a Ducha e personalize o restante do cuidado.
      </p>

      <VehicleSizeSelector className="mt-7" />

      <ConfiguradorPitstop className="mt-7" />

      <div className="mt-8">
        <ResumoPitstop>
          <button
            type="button"
            onClick={agendar}
            className="mt-6 min-h-12 w-full rounded-sm bg-gold py-4 font-heading text-base font-bold tracking-[0.1em] text-asphalt transition hover:brightness-110"
          >
            {adicionais.length > 0 ? "Agendar meu Pitstop" : "Agendar Ducha"}
          </button>
        </ResumoPitstop>
      </div>
    </div>
  );
}
