"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import type { CartaoAgenda } from "@/lib/adminDados";
import { estagiosComTempo, itensChecklistSaida, rotuloEstagio } from "@/lib/operacao";
import { formatarHoraFortaleza, formatarMinutos } from "@/lib/pitpass";
import { salvarPainelAtendimento } from "@/app/admin/actions";
import ClienteBadge from "../ClienteBadge";
import FormComAviso, { BotaoEnviar } from "../FormComAviso";

/**
 * Painel de um atendimento aberto a partir do quadro: gaveta lateral no desktop, tela quase
 * cheia no celular. Mostra o que não cabe no card e guarda o que a equipe ajusta no dia.
 */
export default function DrawerAtendimento({
  cartao,
  agora,
  responsaveis,
  onMover,
  onFechar,
}: {
  cartao: CartaoAgenda;
  agora: number;
  /** Nomes já usados hoje, pra sugerir no campo de responsável. */
  responsaveis: string[];
  onMover: () => void;
  onFechar: () => void;
}) {
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoTeclar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a abrir/fechar; onFechar muda de identidade a cada render
  }, []);

  const decorrido =
    cartao.iniciadoEm && estagiosComTempo.includes(cartao.estagio)
      ? Math.max(0, Math.floor((agora - new Date(cartao.iniciadoEm).getTime()) / 60000))
      : null;
  const endereco = cartao.endereco
    ? [cartao.endereco.rua, cartao.endereco.numero, cartao.endereco.bairro].filter(Boolean).join(", ")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end" role="dialog" aria-modal="true" aria-labelledby="painel-atendimento">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onFechar}
        className="absolute inset-0 cursor-default bg-black/40"
        style={{ animation: "preco-fade 0.2s ease-out" }}
      />

      <div className="ficha-entra relative flex max-h-[94dvh] w-full flex-col rounded-t-2xl bg-white text-adm-ink shadow-xl md:max-h-none md:w-[30rem] md:rounded-none">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-adm-line px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="adm-chip adm-status-em_atendimento">{rotuloEstagio[cartao.estagio]}</span>
              <span className="font-mono text-xs text-adm-muted">{cartao.codigo}</span>
            </p>
            <h2 id="painel-atendimento" className="mt-2 font-heading text-2xl font-bold leading-tight">
              {cartao.nome}
            </h2>
            <ClienteBadge nomePlano={cartao.nomePlano} className="mt-1.5" />
          </div>
          <button
            type="button"
            autoFocus
            onClick={onFechar}
            aria-label="Fechar painel"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-adm-muted hover:bg-black/[0.05] hover:text-adm-ink"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Dado rotulo="Horário">{cartao.horario}</Dado>
            <Dado rotulo="WhatsApp">{cartao.telefone}</Dado>
            <Dado rotulo="Veículo">{cartao.carro}</Dado>
            <Dado rotulo="Placa">
              <span className="font-mono">{cartao.placa ?? "Não informada"}</span>
            </Dado>
            <Dado rotulo="Porte">{cartao.porteNome}</Dado>
            <Dado rotulo="Plano">{cartao.nomePlano ? `PitPass ${cartao.nomePlano}` : "Sem plano"}</Dado>
            <Dado rotulo="Serviço" largo>
              {cartao.servico}
              {cartao.adicionais.map((a) => (
                <span key={a} className="block font-normal text-adm-muted">
                  + {a}
                </span>
              ))}
              {cartao.exigeDetailer && <span className="adm-chip adm-status-em_atendimento mt-1.5">Detailer necessário</span>}
            </Dado>
            {cartao.estimativaMin != null && (
              <Dado rotulo="Tempo estimado">
                {formatarMinutos(cartao.estimativaMin)}
                {decorrido != null && <span className="font-normal text-adm-muted"> · decorrido {formatarMinutos(decorrido)}</span>}
              </Dado>
            )}
          </dl>

          {cartao.levaBusca && (
            <Aviso titulo="Leva & Busca">
              {endereco || "Endereço não informado."}
              {cartao.endereco?.referencia && <span className="block">Referência: {cartao.endereco.referencia}</span>}
              <span className="mt-1 block text-xs opacity-80">Retirada e devolução no mesmo endereço.</span>
            </Aviso>
          )}
          {cartao.observacoes && <Aviso titulo="Observações do atendimento">{cartao.observacoes}</Aviso>}
          {cartao.preferencias && <Aviso titulo="Preferências do cliente">{cartao.preferencias}</Aviso>}

          <FormComAviso
            key={cartao.id}
            action={salvarPainelAtendimento.bind(null, cartao.id)}
            mensagem="Atendimento atualizado"
            className="space-y-4"
          >
            <label className="block">
              <span className="adm-rotulo mb-1.5 block">Responsável pelo atendimento</span>
              <input
                name="responsavelAtendimento"
                list="responsaveis-do-dia"
                defaultValue={cartao.responsavel ?? ""}
                placeholder="Lavador ou detailer"
                className="campo"
              />
              <datalist id="responsaveis-do-dia">
                {responsaveis.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </label>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-black/10 px-3 text-sm font-medium">
              <input
                type="checkbox"
                name="clienteAguardando"
                defaultChecked={cartao.clienteAguardando}
                className="h-[18px] w-[18px] shrink-0 accent-[#16171a]"
              />
              Cliente aguardando na loja
            </label>

            <fieldset>
              <legend className="adm-rotulo mb-2">Checklist de finalização (opcional)</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {itensChecklistSaida.map((item) => (
                  <label key={item.chave} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-black/10 px-3 text-sm">
                    <input
                      type="checkbox"
                      name={`saida-${item.chave}`}
                      defaultChecked={Boolean(cartao.checklistSaida[item.chave])}
                      className="h-[18px] w-[18px] shrink-0 accent-[#16171a]"
                    />
                    {item.rotulo}
                  </label>
                ))}
              </div>
            </fieldset>

            <BotaoEnviar>Salvar</BotaoEnviar>
          </FormComAviso>

          <section>
            <h3 className="adm-rotulo mb-2">Histórico do atendimento</h3>
            {cartao.historico.length === 0 ? (
              <p className="text-sm text-adm-muted">Nenhuma movimentação registrada ainda.</p>
            ) : (
              <ol className="divide-y divide-adm-line rounded-lg border border-adm-line">
                {cartao.historico.map((evento, i) => (
                  <li key={`${evento.em}-${i}`} className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm">
                    <span className="font-semibold uppercase tracking-wide">{rotuloEstagio[evento.estagio]}</span>
                    <span className="font-mono text-adm-muted tabular-nums">{formatarHoraFortaleza(evento.em)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div
          className="grid shrink-0 grid-cols-2 gap-2 border-t border-adm-line px-5 pt-3 md:px-6"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button type="button" onClick={onMover} className="adm-btn adm-btn-primario">
            Mover
          </button>
          {cartao.estagio === "pronto" ? (
            <a href={cartao.avisoProntoUrl} target="_blank" rel="noopener noreferrer" className="adm-btn">
              Avisar cliente
            </a>
          ) : (
            <a href={cartao.whatsappUrl} target="_blank" rel="noopener noreferrer" className="adm-btn">
              WhatsApp
            </a>
          )}
          <Link href={`/admin/atendimentos/${cartao.id}`} className="adm-btn">
            Ficha completa
          </Link>
          {cartao.clienteId ? (
            <Link href={`/admin/clientes/${cartao.clienteId}`} className="adm-btn">
              Ficha do cliente
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}

function Dado({ rotulo, largo, children }: { rotulo: string; largo?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${largo ? "col-span-2" : ""}`}>
      <dt className="adm-rotulo">{rotulo}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-[#fdf1cf] px-4 py-3 text-[#5f4300]">
      <h3 className="adm-rotulo text-[#7a5600]">{titulo}</h3>
      <p className="mt-1 whitespace-pre-line text-sm font-medium">{children}</p>
    </section>
  );
}
