"use client";

import type { CartaoAgenda } from "@/lib/adminDados";
import { estagiosComTempo, rotuloEstagio } from "@/lib/operacao";
import { formatarMinutos, proximidadeAgendamento } from "@/lib/pitpass";
import Bolt from "@/components/Bolt";
import ClienteBadge from "../ClienteBadge";

function minutosDesde(iso: string | null, agora: number): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000));
}

/** Quanto o serviço passou do tempo estimado (só avisa a partir de 10 min de estouro). */
export function estouroEstimativa(cartao: CartaoAgenda, agora: number): number | null {
  if (!cartao.estimativaMin || !estagiosComTempo.includes(cartao.estagio)) return null;
  const decorrido = minutosDesde(cartao.iniciadoEm, agora);
  if (decorrido == null) return null;
  const estouro = decorrido - cartao.estimativaMin;
  return estouro >= 10 ? estouro : null;
}

/**
 * Card compacto de um veículo no quadro. Ordem de leitura: horário, cliente, veículo, serviço,
 * tipo, responsável, tempo no estágio, alertas. O resto fica no painel ao abrir.
 */
export default function CartaoKanban({
  cartao,
  agora,
  hoje,
  horaAgora,
  arrastando,
  onAbrir,
  onMover,
  onArrastar,
  onSoltar,
}: {
  cartao: CartaoAgenda;
  /** Relógio compartilhado do quadro (ms): os tempos são calculados aqui, sem consulta ao banco. */
  agora: number;
  hoje: string;
  horaAgora: string;
  arrastando: boolean;
  onAbrir: () => void;
  onMover: () => void;
  onArrastar: () => void;
  onSoltar: () => void;
}) {
  const noEstagio = estagiosComTempo.includes(cartao.estagio) ? minutosDesde(cartao.estagioDesde, agora) : null;
  const estouro = estouroEstimativa(cartao, agora);
  const proximidade =
    cartao.estagio === "agendado"
      ? proximidadeAgendamento(
          { status: "confirmado", dia: cartao.dia, horario: cartao.horario, checkedInAt: null, startedAt: null },
          hoje,
          horaAgora
        )
      : null;
  const temAtencao = Boolean(cartao.observacoes || cartao.preferencias);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(cartao.id));
        onArrastar();
      }}
      onDragEnd={onSoltar}
      className={`group adm-card cursor-grab p-3.5 transition-[opacity,box-shadow,border-color] duration-150 hover:border-black/25 hover:shadow-sm active:cursor-grabbing ${
        arrastando ? "opacity-40" : ""
      } ${cartao.clienteAguardando ? "border-l-4 border-l-gold" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-xl font-bold leading-none tabular-nums">{cartao.horario}</p>
        <div className="flex flex-wrap justify-end gap-1">
          {proximidade?.tipo === "proximo" && (
            <span className="adm-chip border border-gold bg-white text-gold-ink">
              Próximo • {proximidade.minutos === 0 ? "agora" : formatarMinutos(proximidade.minutos)}
            </span>
          )}
          {proximidade?.tipo === "atrasado" && (
            <span className="adm-chip adm-status-cancelado">Atrasado • {formatarMinutos(proximidade.minutos)}</span>
          )}
          {cartao.prioridade && (
            <span className="adm-chip bg-gold/20 text-adm-ink" title="PitPass: atendimento prioritário">
              <Bolt className="h-3 w-3 text-gold-ink" />
              Prioridade
            </span>
          )}
        </div>
      </div>

      <button type="button" onClick={onAbrir} className="mt-2.5 block w-full text-left">
        <span className="block truncate font-heading text-base font-bold leading-tight">{cartao.nome}</span>
        <span className="mt-0.5 block truncate text-sm text-adm-muted">{cartao.carro}</span>
        <span className="block font-mono text-[13px] font-medium">{cartao.placa ?? "sem placa"}</span>
        <span className="mt-2 block text-sm font-semibold leading-snug">
          {cartao.servico}
          {cartao.adicionais.length > 0 && (
            <span className="font-normal text-adm-muted"> + {cartao.adicionais.length} adicional{cartao.adicionais.length > 1 ? "is" : ""}</span>
          )}
        </span>
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <ClienteBadge nomePlano={cartao.nomePlano} />
        <span className="font-mono text-[11px] text-adm-muted">{cartao.codigo}</span>
      </div>

      {(cartao.exigeDetailer || cartao.levaBusca || cartao.clienteAguardando || temAtencao) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {cartao.clienteAguardando && <span className="adm-chip adm-status-checkin">Cliente aguardando</span>}
          {cartao.exigeDetailer && <span className="adm-chip adm-status-em_atendimento">Detailer necessário</span>}
          {cartao.levaBusca && <span className="adm-chip adm-status-confirmado">Leva & Busca</span>}
          {temAtencao && (
            <button type="button" onClick={onAbrir} className="adm-chip adm-status-aguardando" title="Há observações ou preferências. Abra para ler.">
              Atenção
            </button>
          )}
        </div>
      )}

      {(cartao.responsavel || noEstagio != null) && (
        <dl className="mt-3 space-y-1 border-t border-adm-line pt-2.5 text-xs">
          {cartao.responsavel && (
            <div className="flex items-baseline justify-between gap-2">
              <dt className="adm-rotulo">Responsável</dt>
              <dd className="truncate font-semibold uppercase">{cartao.responsavel}</dd>
            </div>
          )}
          {noEstagio != null && (
            <div className="flex items-baseline justify-between gap-2">
              <dt className="adm-rotulo">{rotuloEstagio[cartao.estagio]}</dt>
              <dd className="font-mono font-semibold tabular-nums">
                {formatarMinutos(noEstagio)}
                {estouro != null && <span className="ml-1.5 text-gold-ink">+{formatarMinutos(estouro)}</span>}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-3 flex gap-1.5 lg:opacity-0 lg:transition-opacity lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <button type="button" onClick={onAbrir} className="adm-btn min-h-9 flex-1 px-2 text-[11px]">
          Abrir
        </button>
        {cartao.estagio === "pronto" ? (
          <a
            href={cartao.avisoProntoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="adm-btn adm-btn-primario min-h-9 flex-1 px-2 text-[11px]"
          >
            Avisar cliente
          </a>
        ) : (
          <a href={cartao.whatsappUrl} target="_blank" rel="noopener noreferrer" className="adm-btn min-h-9 flex-1 px-2 text-[11px]">
            WhatsApp
          </a>
        )}
        <button type="button" onClick={onMover} className="adm-btn min-h-9 flex-1 px-2 text-[11px]">
          Mover
        </button>
      </div>
    </article>
  );
}
