"use client";

import { useState } from "react";
import {
  diasAgendamento,
  horariosAgendamento,
  horariosIndisponiveisMock,
} from "@/lib/data";
import { formatarPreco } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";

interface Slot {
  dia: string;
  hora: string;
}

export default function Agendamento() {
  const { avulsoSelecionado, limparAvulso } = useSelection();
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  function selecionarSlot(dia: string, hora: string) {
    setSlotSelecionado({ dia, hora });
    setConfirmado(false);
  }

  function confirmarAgendamento() {
    setConfirmado(true);
  }

  function novoAgendamento() {
    setSlotSelecionado(null);
    setConfirmado(false);
    limparAvulso();
  }

  return (
    <section id="agendamento" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">Agendamento</p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Escolha o melhor horário</h2>
          {avulsoSelecionado && (
            <p className="mx-auto mt-3 max-w-md rounded-full bg-panel px-4 py-2 text-sm text-text-secondary">
              Agendando: <span className="text-gold">{avulsoSelecionado.nome}</span>
              {avulsoSelecionado.preco != null && (
                <span className="ml-2 font-mono text-cyan">
                  {formatarPreco(avulsoSelecionado.preco)}
                </span>
              )}
            </p>
          )}
        </div>

        {confirmado && slotSelecionado ? (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-panel p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan/10 text-2xl text-cyan">
              ✓
            </div>
            <h3 className="font-heading text-xl font-bold">Horário reservado</h3>
            <p className="mt-2 text-sm text-text-secondary">
              {slotSelecionado.dia}, às {slotSelecionado.hora}
              {avulsoSelecionado ? ` para ${avulsoSelecionado.nome}` : ""}.
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Reserva simulada, sem cobrança ou confirmação real.
            </p>
            <button
              onClick={novoAgendamento}
              className="mt-6 rounded-full border border-white/15 px-6 py-2 text-sm text-text-secondary transition hover:border-cyan hover:text-cyan"
            >
              Fazer novo agendamento
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-panel p-4">
              <table className="w-full min-w-[640px] border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-normal text-text-secondary" />
                    {diasAgendamento.map((dia) => (
                      <th
                        key={dia}
                        className="pb-2 text-center font-heading text-xs uppercase text-text-secondary"
                      >
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horariosAgendamento.map((hora) => (
                    <tr key={hora}>
                      <td className="pr-2 text-right font-mono text-xs text-text-secondary">
                        {hora}
                      </td>
                      {diasAgendamento.map((dia) => {
                        const chave = `${dia}-${hora}`;
                        const indisponivel = horariosIndisponiveisMock.has(chave);
                        const selecionado =
                          slotSelecionado?.dia === dia && slotSelecionado?.hora === hora;
                        return (
                          <td key={chave}>
                            <button
                              disabled={indisponivel}
                              onClick={() => selecionarSlot(dia, hora)}
                              className={`h-9 w-full rounded-md font-mono text-xs transition ${
                                indisponivel
                                  ? "cursor-not-allowed bg-white/5 text-text-secondary/40"
                                  : selecionado
                                  ? "bg-gold text-asphalt"
                                  : "bg-asphalt text-text-secondary hover:text-cyan"
                              }`}
                            >
                              {indisponivel ? "—" : selecionado ? "✓" : "livre"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={confirmarAgendamento}
                disabled={!slotSelecionado}
                className="rounded-full bg-gold px-8 py-3 font-heading font-semibold text-asphalt transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {slotSelecionado
                  ? `Confirmar ${slotSelecionado.dia}, ${slotSelecionado.hora}`
                  : "Selecione um horário"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
