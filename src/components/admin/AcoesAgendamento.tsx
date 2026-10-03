"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { StatusOperacional } from "@/lib/pitpass";
import { atualizarStatusAgendamento, iniciarAtendimentoAgendamento } from "@/app/admin/actions";
import { useAviso } from "./AdminShell";

/**
 * Ações de um agendamento conforme o status: só aparece o que é possível agora.
 * O check-in não é feito daqui — ele mora na ficha, depois da conferência da placa.
 */
export default function AcoesAgendamento({
  id,
  codigo,
  status,
  whatsappUrl,
  naFicha = false,
}: {
  id: number;
  codigo: string | null;
  status: StatusOperacional;
  whatsappUrl: string;
  /** Na própria ficha não faz sentido oferecer "Abrir ficha". */
  naFicha?: boolean;
}) {
  const avisar = useAviso();
  const [pendente, startTransition] = useTransition();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const ficha = `/admin/atendimentos/${id}`;
  const aberto = status === "confirmado" || status === "aguardando" || status === "checkin" || status === "em_atendimento";

  useEffect(() => {
    if (!confirmandoCancelamento) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setConfirmandoCancelamento(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [confirmandoCancelamento]);

  function executar(acao: () => Promise<void>, mensagem: string) {
    startTransition(async () => {
      try {
        await acao();
        avisar(mensagem);
      } catch {
        avisar("Não foi possível concluir a ação. Tente de novo.", "erro");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "aguardando" && !naFicha && (
        <Link href={ficha} className="adm-btn adm-btn-primario">
          Check-in
        </Link>
      )}
      {status === "checkin" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => executar(() => iniciarAtendimentoAgendamento(id), "Atendimento iniciado")}
          className="adm-btn adm-btn-primario"
        >
          Iniciar atendimento
        </button>
      )}
      {status === "em_atendimento" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => executar(() => atualizarStatusAgendamento(id, "concluido"), "Atendimento concluído")}
          className="adm-btn adm-btn-primario"
        >
          Concluir
        </button>
      )}

      {!naFicha && (
        <Link href={ficha} className="adm-btn">
          {status === "cancelado" ? "Detalhes" : "Abrir ficha"}
        </Link>
      )}

      {aberto && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="adm-btn">
          WhatsApp
        </a>
      )}

      {aberto && (
        <div className="relative">
          <button
            type="button"
            aria-label="Mais ações"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((v) => !v)}
            className="adm-btn w-11 px-0 text-lg"
          >
            ⋯
          </button>
          {menuAberto && (
            <>
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => setMenuAberto(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="adm-card absolute right-0 z-20 mt-1 w-56 p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    setConfirmandoCancelamento(true);
                  }}
                  className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-medium text-[#b42318] hover:bg-[#fdecea]"
                >
                  Cancelar agendamento
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {confirmandoCancelamento && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`cancelar-${id}`}
        >
          <button
            type="button"
            aria-label="Voltar"
            tabIndex={-1}
            onClick={() => setConfirmandoCancelamento(false)}
            className="absolute inset-0 cursor-default bg-black/45"
            style={{ animation: "preco-fade 0.2s ease-out" }}
          />
          <div
            className="folha-entra relative w-full rounded-t-2xl bg-white p-6 text-adm-ink shadow-xl sm:max-w-sm sm:rounded-2xl"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <p id={`cancelar-${id}`} className="font-heading text-xl font-bold">
              Cancelar {codigo ?? "este agendamento"}?
            </p>
            <p className="mt-2 text-sm text-adm-muted">Isso liberará o horário novamente.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" autoFocus onClick={() => setConfirmandoCancelamento(false)} className="adm-btn">
                Voltar
              </button>
              <button
                type="button"
                disabled={pendente}
                onClick={() => {
                  setConfirmandoCancelamento(false);
                  executar(() => atualizarStatusAgendamento(id, "cancelado"), "Agendamento cancelado");
                }}
                className="adm-btn border-[#b42318] bg-[#b42318] text-white hover:border-[#b42318] hover:brightness-110"
              >
                Cancelar agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
