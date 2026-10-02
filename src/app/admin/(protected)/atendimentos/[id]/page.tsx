import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, assinaturas, beneficioUsos } from "@/db/schema";
import { formatarDataCurta } from "@/lib/agenda";
import { formatarPreco } from "@/lib/format";
import { planos, PlanoId, portesVeiculo, VehicleSize, linkWhatsapp } from "@/lib/data";
import { garantirTokenCheckin, origemDaRequisicao, urlCheckin } from "@/lib/checkin";
import {
  etapaAtendimento,
  rotuloEtapa,
  formatarHoraFortaleza,
  dataIsoFortaleza,
  EtapaAtendimento,
} from "@/lib/pitpass";
import { atualizarStatusAgendamento, fazerCheckin, iniciarAtendimentoAgendamento } from "../../../actions";
import CarSparkMark from "@/components/CarSparkMark";
import QrCode from "@/components/QrCode";
import { pitpassTheme, temaDoPlano } from "@/lib/pitpassTheme";

interface AdicionalJson {
  nome: string;
}

const estiloEtapa: Record<EtapaAtendimento, string> = {
  aguardando: "border-white/15 text-text-secondary",
  checkin: "border-gold/60 text-gold",
  em_atendimento: "border-gold bg-gold text-asphalt",
  concluido: "border-white/15 text-text-primary",
  cancelado: "border-red-400/40 text-red-400",
};

const rotuloUsoBeneficio: Record<string, string> = {
  reservado: "Reservado",
  utilizado: "Utilizado",
  liberado: "Liberado (não contou)",
};

export default async function AtendimentoPage({ params, searchParams }: PageProps<"/admin/atendimentos/[id]">) {
  const { id } = await params;
  const { lido } = await searchParams;
  const agendamentoId = Number(id);
  if (!Number.isInteger(agendamentoId)) notFound();

  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.id, agendamentoId));
  if (!registro) notFound();

  const [token, origem, usos, assinaturaAtiva] = await Promise.all([
    garantirTokenCheckin(registro),
    origemDaRequisicao(),
    db.select().from(beneficioUsos).where(eq(beneficioUsos.agendamentoId, registro.id)),
    registro.clienteId
      ? db
          .select()
          .from(assinaturas)
          .where(and(eq(assinaturas.clienteId, registro.clienteId), eq(assinaturas.status, "ativo")))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const etapa = etapaAtendimento(registro);
  const ehAssinatura = registro.tipoAtendimento === "assinatura";
  const planoId = (registro.plano ?? assinaturaAtiva?.plano ?? null) as PlanoId | null;
  const nomePlano = planoId ? planos[planoId]?.nome : null;
  const porte = portesVeiculo[(registro.categoriaVeiculo as VehicleSize) ?? "P"] ?? portesVeiculo.P;

  let adicionais: string[] = [];
  if (registro.servicosAdicionais) {
    try {
      adicionais = (JSON.parse(registro.servicosAdicionais) as AdicionalJson[]).map((a) => a.nome);
    } catch {
      // JSON mal formado, ignora
    }
  }

  const linhaDoTempo = [
    { rotulo: "Agendado", em: registro.createdAt, dia: true },
    { rotulo: "Check-in", em: registro.checkedInAt },
    { rotulo: "Atendimento iniciado", em: registro.startedAt },
    { rotulo: "Atendimento concluído", em: registro.completedAt },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/pitpass"
          className="font-mono text-xs uppercase tracking-wide text-text-secondary hover:text-gold"
        >
          ← Ler outro PitPass
        </Link>
        <Link
          href="/admin/agendamentos"
          className="font-mono text-xs uppercase tracking-wide text-text-secondary hover:text-gold"
        >
          Agendamentos
        </Link>
      </div>

      {lido === "1" && (
        <p className="pitpass-entra mt-5 font-heading text-sm font-bold tracking-[0.2em] text-gold">
          ✓ PitPass encontrado
        </p>
      )}

      {/* Identificação */}
      <div className={`pitpass-cartao ${pitpassTheme[temaDoPlano(ehAssinatura ? planoId : null)].classe} mt-3 rounded-xl p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CarSparkMark className="h-5 w-5 text-white" />
            <span className="font-heading text-xs font-bold tracking-[0.18em]">
              PITPASS
              {ehAssinatura && nomePlano && <span className="pitpass-acento"> • {nomePlano.toUpperCase()}</span>}
            </span>
          </div>
          <span className="font-mono text-sm font-semibold text-white">{registro.codigo}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${estiloEtapa[etapa]}`}
          >
            {rotuloEtapa[etapa]}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Dado rotulo="Cliente" largo>
            {registro.clienteId ? (
              <Link href={`/admin/clientes/${registro.clienteId}`} className="font-semibold hover:text-gold">
                {registro.nome}
              </Link>
            ) : (
              <span className="font-semibold">{registro.nome}</span>
            )}
          </Dado>
          <Dado rotulo="Tipo">{ehAssinatura ? "Assinatura PitPass" : "Ducha Pitstop"}</Dado>
          <Dado rotulo="Plano">{nomePlano ?? "Sem plano"}</Dado>
          <Dado rotulo="Veículo">{registro.carro}</Dado>
          <Dado rotulo="Porte">{`${porte.nome} · ${porte.descricao}`}</Dado>
          <Dado rotulo="Placa">{registro.placa ?? "Não informada"}</Dado>
          <Dado rotulo="Código">{registro.codigo ?? "-"}</Dado>
          <Dado rotulo="Data">{formatarDataCurta(registro.dia)}</Dado>
          <Dado rotulo="Horário">{registro.horario}</Dado>
          <Dado rotulo={ehAssinatura ? "Benefício do plano" : "Serviço"} largo>
            {ehAssinatura ? (
              registro.servicoNome ?? "-"
            ) : (
              <>
                {registro.servicoNome ?? "Ducha Pitstop"}
                {adicionais.map((a) => (
                  <span key={a} className="block text-text-secondary">
                    + {a}
                  </span>
                ))}
              </>
            )}
          </Dado>
          {ehAssinatura && usos.length > 0 && (
            <Dado rotulo="Uso do benefício" largo>
              {usos.map((u) => `${u.beneficio}: ${rotuloUsoBeneficio[u.status] ?? u.status}`).join(" · ")}
            </Dado>
          )}
          {!ehAssinatura && registro.preco && (
            <Dado rotulo="Valor">{formatarPreco(Number(registro.preco))}</Dado>
          )}
          {registro.observacoes && (
            <Dado rotulo="Observações" largo>
              {registro.observacoes}
            </Dado>
          )}
        </dl>
      </div>

      {/* Ação da etapa */}
      <div className="mt-5 space-y-3">
        {etapa === "aguardando" && (
          <form action={fazerCheckin.bind(null, registro.id)}>
            <BotaoEtapa>Fazer check-in</BotaoEtapa>
          </form>
        )}
        {etapa === "checkin" && (
          <form action={iniciarAtendimentoAgendamento.bind(null, registro.id)}>
            <BotaoEtapa>Iniciar atendimento</BotaoEtapa>
          </form>
        )}
        {etapa === "em_atendimento" && (
          <form action={atualizarStatusAgendamento.bind(null, registro.id, "concluido")}>
            <BotaoEtapa>Concluir</BotaoEtapa>
          </form>
        )}
        {etapa === "concluido" && (
          <p className="rounded-md border border-white/10 bg-panel px-4 py-3 text-center font-mono text-xs uppercase tracking-wide text-text-secondary">
            ✓ Atendimento concluído
          </p>
        )}
        {etapa === "cancelado" && (
          <p className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-center font-mono text-xs uppercase tracking-wide text-red-300">
            Agendamento cancelado
          </p>
        )}
      </div>

      {/* Histórico */}
      <div className="mt-6 rounded-lg border border-white/10 bg-panel p-5">
        <p className="font-heading text-sm font-bold uppercase tracking-wide">Histórico</p>
        <ol className="mt-4 space-y-3">
          {linhaDoTempo.map((passo) => (
            <li key={passo.rotulo} className="flex items-baseline gap-4 font-mono text-sm">
              <span className={`w-28 shrink-0 ${passo.em ? "text-white" : "text-text-secondary/40"}`}>
                {passo.em
                  ? passo.dia
                    ? `${formatarDataCurta(dataIsoFortaleza(passo.em))} ${formatarHoraFortaleza(passo.em)}`
                    : formatarHoraFortaleza(passo.em)
                  : "--:--"}
              </span>
              <span
                className={`text-xs uppercase tracking-wide ${passo.em ? "text-text-primary" : "text-text-secondary/40"}`}
              >
                {passo.rotulo}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Contato + QR */}
      <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-panel p-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">WhatsApp</p>
          <a
            href={linkWhatsapp(`Olá ${registro.nome}! Aqui é da PitStop084, sobre seu agendamento ${registro.codigo ?? ""}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-mono text-sm text-gold underline-offset-4 hover:underline"
          >
            {registro.telefone}
          </a>
          <p className="mt-3 text-xs text-text-secondary">QR do PitPass deste atendimento.</p>
        </div>
        <QrCode conteudo={urlCheckin(origem, token)} className="h-24 w-24 shrink-0 rounded-md" />
      </div>

      {registro.status === "confirmado" && (
        <form action={atualizarStatusAgendamento.bind(null, registro.id, "cancelado")} className="mt-6 text-center">
          <button
            type="submit"
            className="font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-red-400 hover:underline"
          >
            Cancelar agendamento
          </button>
        </form>
      )}
    </div>
  );
}

function Dado({ rotulo, largo, children }: { rotulo: string; largo?: boolean; children: ReactNode }) {
  return (
    <div className={largo ? "col-span-2" : undefined}>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">{rotulo}</dt>
      <dd className="mt-0.5 text-text-primary">{children}</dd>
    </div>
  );
}

function BotaoEtapa({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-md bg-gold py-4 font-heading text-base font-bold tracking-wide text-asphalt transition hover:brightness-110"
    >
      {children}
    </button>
  );
}
