"use client";

import { useState, useTransition } from "react";
import { fazerCheckin } from "@/app/admin/actions";
import { useAviso } from "./AdminShell";

/**
 * Regra da casa: o QR identifica o agendamento, a placa confirma o veículo.
 * O check-in só libera depois que a recepção marca que conferiu. Sem reconhecimento automático.
 */
export default function CheckinPlaca({
  id,
  carro,
  placa,
  lido,
}: {
  id: number;
  carro: string;
  placa: string | null;
  /** Veio do leitor de QR / busca do PitPass. */
  lido: boolean;
}) {
  const avisar = useAviso();
  const [conferido, setConferido] = useState(false);
  const [pendente, startTransition] = useTransition();

  function enviar() {
    const dados = new FormData();
    dados.set("placaConferida", "on");
    startTransition(async () => {
      try {
        await fazerCheckin(id, dados);
        avisar("Check-in realizado");
      } catch {
        avisar("Não foi possível fazer o check-in. Tente de novo.", "erro");
      }
    });
  }

  return (
    <div className="rounded-xl border-2 border-gold bg-[#fdf6e0] p-5">
      <p className="font-heading text-lg font-bold tracking-wide">
        {lido ? "Confirme a placa do veículo" : "Confira o veículo antes do check-in"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="adm-rotulo">Veículo cadastrado</p>
          <p className="mt-1 font-heading text-xl font-bold leading-tight">{carro}</p>
        </div>
        <div>
          <p className="adm-rotulo">Placa</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.1em]">{placa ?? "—"}</p>
        </div>
      </div>
      {!placa && (
        <p className="mt-3 text-sm font-medium">
          Placa não informada no agendamento. Confirme o veículo e os dados com o cliente.
        </p>
      )}
      <p className="mt-4 text-sm text-adm-muted">
        O QR identifica o agendamento. A placa confirma o veículo. Se o veículo ou a placa não baterem, não faça o
        check-in.
      </p>
      <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold">
        <input
          type="checkbox"
          checked={conferido}
          onChange={(e) => setConferido(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-[#16171a]"
        />
        Conferi o veículo e a placa
      </label>
      <button
        type="button"
        disabled={!conferido || pendente}
        onClick={enviar}
        className="adm-btn adm-btn-primario mt-3 min-h-14 w-full text-base"
      >
        {pendente ? "Registrando..." : "Fazer check-in"}
      </button>
    </div>
  );
}
