"use client";

import { useEffect, useState } from "react";
import {
  diasAgendamento,
  horariosAgendamento,
  horariosIndisponiveisMock,
} from "@/lib/data";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { useSelection } from "@/context/SelectionContext";

interface Slot {
  dia: string;
  hora: string;
}

const diaAbreviado: Record<string, string> = {
  Segunda: "Seg",
  Terça: "Ter",
  Quarta: "Qua",
  Quinta: "Qui",
  Sexta: "Sex",
  Sábado: "Sáb",
};

export default function Agendamento() {
  const { avulsoSelecionado, limparAvulso } = useSelection();
  const [diaSelecionado, setDiaSelecionado] = useState(diasAgendamento[0]);
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agendamentos")
      .then((r) => r.json())
      .then((data: { ocupados: { dia: string; horario: string }[] }) => {
        setOcupados(new Set(data.ocupados.map((o) => `${o.dia}-${o.horario}`)));
      })
      .catch(() => {});
  }, []);

  const contatoValido = nome.trim().length > 1 && telefone.trim().length > 7;

  function selecionarSlot(hora: string) {
    setSlotSelecionado({ dia: diaSelecionado, hora });
    setErro(null);
  }

  function trocarDia(dia: string) {
    setDiaSelecionado(dia);
    setSlotSelecionado(null);
    setErro(null);
  }

  async function confirmarAgendamento() {
    if (!slotSelecionado || !avulsoSelecionado) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          telefone,
          servicoId: avulsoSelecionado.id,
          dia: slotSelecionado.dia,
          horario: slotSelecionado.hora,
        }),
      });
      if (resposta.status === 409) {
        setOcupados((atual) => new Set(atual).add(`${slotSelecionado.dia}-${slotSelecionado.hora}`));
        setSlotSelecionado(null);
        setErro("Esse horário acabou de ser reservado por outra pessoa. Escolha outro.");
        return;
      }
      if (!resposta.ok) throw new Error();
      setConfirmado(true);
    } catch {
      setErro("Não foi possível confirmar o agendamento agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function novoAgendamento() {
    setSlotSelecionado(null);
    setConfirmado(false);
    setNome("");
    setTelefone("");
    limparAvulso();
  }

  return (
    <section id="agendamento" className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">Agendamento</p>
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Escolha o melhor horário</h2>
          {avulsoSelecionado ? (
            <p className="mx-auto mt-3 max-w-md rounded-full bg-panel px-4 py-2 text-sm text-text-secondary">
              Agendando: <span className="text-gold">{avulsoSelecionado.nome}</span>
              {avulsoSelecionado.preco != null && (
                <span className="ml-2 font-mono text-cyan">
                  {formatarPreco(avulsoSelecionado.preco)}
                </span>
              )}
            </p>
          ) : (
            <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
              Escolha um serviço avulso acima para agendar um horário.
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
            <button
              onClick={novoAgendamento}
              className="mt-6 rounded-full border border-white/15 px-6 py-2 text-sm text-text-secondary transition hover:border-cyan hover:text-cyan"
            >
              Fazer novo agendamento
            </button>
          </div>
        ) : (
          <fieldset disabled={!avulsoSelecionado} className="disabled:opacity-40">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {diasAgendamento.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => trocarDia(dia)}
                  className={`shrink-0 rounded-full px-4 py-2 font-heading text-sm font-semibold transition ${
                    dia === diaSelecionado
                      ? "bg-gold text-asphalt"
                      : "bg-panel text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {diaAbreviado[dia] ?? dia}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {horariosAgendamento.map((hora) => {
                const chave = `${diaSelecionado}-${hora}`;
                const indisponivel =
                  horariosIndisponiveisMock.has(chave) || ocupados.has(chave);
                const selecionado =
                  slotSelecionado?.dia === diaSelecionado && slotSelecionado?.hora === hora;
                return (
                  <button
                    key={hora}
                    type="button"
                    disabled={indisponivel}
                    onClick={() => selecionarSlot(hora)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 font-mono text-sm transition ${
                      indisponivel
                        ? "cursor-not-allowed bg-white/5 text-text-secondary/40"
                        : selecionado
                        ? "bg-gold text-asphalt"
                        : "bg-panel text-text-primary hover:text-cyan"
                    }`}
                  >
                    <span>{hora}</span>
                    <span className="text-xs uppercase">
                      {indisponivel ? "Ocupado" : selecionado ? "Selecionado" : "Livre"}
                    </span>
                  </button>
                );
              })}
            </div>

            {slotSelecionado && (
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-text-secondary">Nome *</span>
                  <input
                    className="campo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-text-secondary">Telefone *</span>
                  <input
                    className="campo"
                    inputMode="numeric"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(84) 9 0000-0000"
                  />
                </label>
              </div>
            )}

            {erro && <p className="mt-4 text-center text-sm text-red-400">{erro}</p>}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={confirmarAgendamento}
                disabled={!slotSelecionado || !contatoValido || enviando}
                className="w-full rounded-full bg-gold px-8 py-3 font-heading font-semibold text-asphalt transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {enviando
                  ? "Confirmando..."
                  : slotSelecionado
                  ? `Confirmar ${diaAbreviado[slotSelecionado.dia] ?? slotSelecionado.dia}, ${slotSelecionado.hora}`
                  : "Selecione um horário"}
              </button>
            </div>
          </fieldset>
        )}
      </div>
    </section>
  );
}
