"use client";

import { useRef } from "react";
import { paraIso, hojeIso, horaAtualFortaleza } from "@/lib/agenda";

const diaAbreviadoCurto = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export default function DateTimePicker({
  datasRapidas,
  dataSelecionadaIso,
  onSelecionarData,
  horarios,
  ocupados,
  horaSelecionada,
  onSelecionarHora,
}: {
  datasRapidas: Date[];
  dataSelecionadaIso: string | null;
  onSelecionarData: (iso: string) => void;
  horarios: string[];
  ocupados: Set<string>;
  horaSelecionada: string | null;
  onSelecionarHora: (hora: string) => void;
}) {
  const inputDataRef = useRef<HTMLInputElement>(null);

  function abrirOutroDia() {
    const input = inputDataRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {datasRapidas.map((data) => {
          const iso = paraIso(data);
          const ativo = iso === dataSelecionadaIso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelecionarData(iso)}
              aria-pressed={ativo}
              className={`flex shrink-0 flex-col items-center rounded-sm px-4 py-2 font-heading transition ${
                ativo ? "bg-gold text-asphalt" : "bg-asphalt text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="text-xs">{diaAbreviadoCurto[data.getUTCDay()]}</span>
              <span className="text-base font-bold">{data.getUTCDate()}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={abrirOutroDia}
          className="flex shrink-0 flex-col items-center justify-center rounded-sm border border-white/15 px-4 py-2 font-heading text-xs font-semibold text-text-secondary transition hover:border-gold hover:text-gold"
        >
          Outro dia
          <span aria-hidden="true">📅</span>
        </button>
        <input
          ref={inputDataRef}
          type="date"
          min={hojeIso()}
          className="sr-only"
          onChange={(e) => {
            if (e.target.value) onSelecionarData(e.target.value);
          }}
        />
      </div>

      {dataSelecionadaIso && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {horarios.map((hora) => {
            const chave = `${dataSelecionadaIso}-${hora}`;
            const ocupado = ocupados.has(chave);
            const jaPassou = dataSelecionadaIso === hojeIso() && hora <= horaAtualFortaleza();
            const indisponivel = ocupado || jaPassou;
            const selecionado = horaSelecionada === hora;
            return (
              <button
                key={hora}
                type="button"
                disabled={indisponivel}
                onClick={() => onSelecionarHora(hora)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-sm px-3 py-3 font-mono text-sm transition ${
                  indisponivel
                    ? "cursor-not-allowed bg-white/5 text-text-secondary/40"
                    : selecionado
                    ? "bg-gold text-asphalt"
                    : "bg-asphalt text-text-primary hover:border hover:border-gold hover:text-gold"
                }`}
              >
                <span>
                  {selecionado && "✓ "}
                  {hora}
                </span>
                {ocupado && <span className="text-[10px] uppercase tracking-wide">Ocupado</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
