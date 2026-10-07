"use client";

import { useRef } from "react";
import { paraIso, hojeIso, horaAtualFortaleza, SituacaoHorario } from "@/lib/agenda";

const diaAbreviadoCurto = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export default function DateTimePicker({
  datasRapidas,
  dataSelecionadaIso,
  onSelecionarData,
  horarios,
  situacao,
  horaSelecionada,
  onSelecionarHora,
  claro = false,
}: {
  /** Fundo claro (admin). O padrão é o tema escuro da landing. */
  claro?: boolean;
  datasRapidas: Date[];
  dataSelecionadaIso: string | null;
  onSelecionarData: (iso: string) => void;
  horarios: string[];
  /**
   * Situação de cada horário do dia selecionado pra duração do atendimento montado:
   * "ocupado" (já tem atendimento/bloqueio) ou "sem-janela" (começaria livre, mas não cabe).
   */
  situacao: (hora: string) => SituacaoHorario;
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
              className={`flex shrink-0 flex-col items-center rounded-sm px-4 py-2 font-heading transition-colors duration-200 ${
                ativo
                  ? "bg-gold text-asphalt"
                  : claro
                  ? "border border-black/15 bg-white text-adm-muted hover:border-black/40 hover:text-adm-ink"
                  : "bg-asphalt text-text-secondary hover:text-text-primary"
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
          className={`flex shrink-0 flex-col items-center justify-center rounded-sm border px-4 py-2 font-heading text-xs font-semibold transition ${
            claro
              ? "border-black/15 bg-white text-adm-muted hover:border-black/40 hover:text-adm-ink"
              : "border-white/15 text-text-secondary hover:border-gold hover:text-gold"
          }`}
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
            const jaPassou = dataSelecionadaIso === hojeIso() && hora <= horaAtualFortaleza();
            const situacaoDaHora = jaPassou ? "livre" : situacao(hora);
            const ocupado = situacaoDaHora === "ocupado";
            const semJanela = situacaoDaHora === "sem-janela";
            const indisponivel = ocupado || semJanela || jaPassou;
            const selecionado = horaSelecionada === hora;
            return (
              <button
                key={hora}
                type="button"
                disabled={indisponivel}
                title={semJanela ? "Não há tempo suficiente a partir deste horário para o atendimento escolhido." : undefined}
                onClick={() => onSelecionarHora(hora)}
                aria-pressed={selecionado}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-sm border px-3 py-3 font-mono text-sm transition-colors duration-200 ${
                  indisponivel
                    ? claro
                      ? "cursor-not-allowed border-transparent bg-black/[0.04] text-black/30"
                      : "cursor-not-allowed border-transparent bg-white/5 text-text-secondary/40"
                    : selecionado
                    ? "border-gold bg-gold font-semibold text-asphalt"
                    : claro
                    ? "border-black/15 bg-white text-adm-ink hover:border-adm-ink"
                    : "border-transparent bg-asphalt text-text-primary hover:border-gold hover:text-gold"
                }`}
              >
                <span>
                  {selecionado && <span className="check-entra mr-1 inline-block">✓</span>}
                  {hora}
                </span>
                {ocupado && <span className="text-[10px] uppercase tracking-wide">Ocupado</span>}
                {semJanela && <span className="text-[10px] uppercase tracking-wide">Sem janela</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
