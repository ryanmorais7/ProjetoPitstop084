import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, assinaturas, beneficioUsos, clientes } from "@/db/schema";
import { formatarDataCurta, hojeIso, horaAtualFortaleza } from "@/lib/agenda";
import { formatarPreco } from "@/lib/format";
import { planos, PlanoId, portesVeiculo, VehicleSize } from "@/lib/data";
import { whatsappDoCliente } from "@/lib/adminDados";
import { garantirTokenCheckin, origemDaRequisicao, urlCheckin } from "@/lib/checkin";
import { statusOperacional, formatarHoraFortaleza, dataIsoFortaleza } from "@/lib/pitpass";
import { estagioDoRegistro, lerHistoricoEstagios, rotuloEstagio } from "@/lib/operacao";
import QrCode from "@/components/QrCode";
import ClienteBadge from "@/components/admin/ClienteBadge";
import { StatusChip, ProximidadeChip, nomePlanoDoAgendamento } from "@/components/admin/AgendamentoCard";
import AcoesAgendamento from "@/components/admin/AcoesAgendamento";
import CheckinPlaca from "@/components/admin/CheckinPlaca";
import FormComAviso, { BotaoEnviar } from "@/components/admin/FormComAviso";
import { salvarOperacaoAtendimento } from "../../../actions";

interface AdicionalJson {
  nome: string;
  preco: number | null;
}

const rotuloUsoBeneficio: Record<string, string> = {
  reservado: "Reservado",
  utilizado: "Utilizado",
  liberado: "Liberado (não contou)",
};

const itensChecklist = [
  { campo: "checkPlaca", chave: "placa", rotulo: "Placa conferida" },
  { campo: "checkVeiculo", chave: "veiculo", rotulo: "Veículo conferido" },
  { campo: "checkObservacoes", chave: "observacoes", rotulo: "Observações registradas" },
  { campo: "checkFotos", chave: "fotos", rotulo: "Fotos de entrada, quando necessário" },
] as const;

export default async function AtendimentoPage({ params, searchParams }: PageProps<"/admin/atendimentos/[id]">) {
  const { id } = await params;
  const { lido, novo } = await searchParams;
  const agendamentoId = Number(id);
  if (!Number.isInteger(agendamentoId)) notFound();

  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.id, agendamentoId));
  if (!registro) notFound();

  const [token, origem, usos, assinaturaAtiva, cliente] = await Promise.all([
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
    registro.clienteId
      ? db
          .select({ preferencias: clientes.preferencias })
          .from(clientes)
          .where(eq(clientes.id, registro.clienteId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  const hoje = hojeIso();
  const status = statusOperacional(registro, hoje);
  const ehAssinatura = registro.tipoAtendimento === "assinatura";
  const planoAtivo = assinaturaAtiva ? (planos[assinaturaAtiva.plano as PlanoId]?.nome ?? null) : null;
  const nomePlano = nomePlanoDoAgendamento(registro, planoAtivo);
  const porte = portesVeiculo[(registro.categoriaVeiculo as VehicleSize) ?? "P"] ?? portesVeiculo.P;
  const aguardandoCheckin = status === "aguardando";

  let adicionais: AdicionalJson[] = [];
  if (registro.servicosAdicionais) {
    try {
      adicionais = JSON.parse(registro.servicosAdicionais) as AdicionalJson[];
    } catch {
      // JSON mal formado, ignora
    }
  }

  let checklist: Record<string, boolean> = {};
  if (registro.checklistEntrada) {
    try {
      checklist = JSON.parse(registro.checklistEntrada) as Record<string, boolean>;
    } catch {
      // checklist antigo mal formado: começa vazio
    }
  }

  const estagio = estagioDoRegistro(registro);
  const movimentacoes = lerHistoricoEstagios(registro.historicoEstagios);

  const linhaDoTempo = [
    { rotulo: "Agendado", em: registro.createdAt, dia: true },
    { rotulo: "Check-in", em: registro.checkedInAt },
    { rotulo: "Atendimento iniciado", em: registro.startedAt },
    { rotulo: "Atendimento concluído", em: registro.completedAt },
    { rotulo: "Entregue ao cliente", em: registro.deliveredAt },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/agendamentos" className="inline-flex min-h-9 items-center text-sm text-adm-muted underline-offset-4 hover:text-adm-ink hover:underline">
          ← Agendamentos
        </Link>
        <Link href="/admin/pitpass" className="inline-flex min-h-9 items-center text-sm text-adm-muted underline-offset-4 hover:text-adm-ink hover:underline">
          Ler outro PitPass
        </Link>
      </div>

      {lido === "1" && (
        <p className="passo-entra rounded-lg bg-adm-ink px-4 py-3 font-heading text-sm font-bold tracking-[0.16em] text-white">
          <span className="mr-2 text-gold">✓</span>PitPass encontrado
        </p>
      )}
      {novo === "1" && (
        <p className="passo-entra rounded-lg bg-[#e4f3e8] px-4 py-3 text-sm font-semibold text-[#1c6a35]">
          Agendamento criado. O horário já está reservado na agenda e na landing.
        </p>
      )}

      {/* Identificação */}
      <section className="adm-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-semibold tracking-wide">{registro.codigo}</p>
            <p className="mt-2 flex items-baseline gap-3">
              <span className="font-heading text-4xl font-bold leading-none tabular-nums">{registro.horario}</span>
              <span className="font-mono text-xs font-medium uppercase tracking-wide text-adm-muted">
                {formatarDataCurta(registro.dia)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProximidadeChip registro={registro} hoje={hoje} horaAgora={horaAtualFortaleza()} />
            <StatusChip status={status} />
            {estagio && status !== "cancelado" && (
              <span className="adm-chip adm-status-em_atendimento" title="Estágio no quadro da Agenda">
                {rotuloEstagio[estagio]}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-adm-line pt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {registro.clienteId ? (
              <Link
                href={`/admin/clientes/${registro.clienteId}`}
                className="font-heading text-2xl font-bold leading-tight underline-offset-4 hover:underline"
              >
                {registro.nome}
              </Link>
            ) : (
              <p className="font-heading text-2xl font-bold leading-tight">{registro.nome}</p>
            )}
            <ClienteBadge nomePlano={nomePlano} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Dado rotulo="Veículo">{registro.carro}</Dado>
            <Dado rotulo="Placa">
              <span className="font-mono">{registro.placa ?? "Não informada"}</span>
            </Dado>
            <Dado rotulo="Porte">{porte.nome}</Dado>
            <Dado rotulo={ehAssinatura ? "Benefício do plano" : "Serviço"} largo>
              {ehAssinatura ? (
                (registro.servicoNome ?? "-")
              ) : (
                <>
                  {registro.servicoNome ?? "Ducha Pitstop"}
                  {adicionais.map((a) => (
                    <span key={a.nome} className="block font-normal text-adm-muted">
                      + {a.nome}
                      {a.preco == null && " (mediante avaliação)"}
                    </span>
                  ))}
                </>
              )}
            </Dado>
            <Dado rotulo="Plano">{nomePlano ? `PitPass ${nomePlano}` : "Sem plano"}</Dado>
            {ehAssinatura && usos.length > 0 && (
              <Dado rotulo="Uso do benefício" largo>
                {usos.map((u) => `${u.beneficio}: ${rotuloUsoBeneficio[u.status] ?? u.status}`).join(" · ")}
              </Dado>
            )}
            {!ehAssinatura && registro.preco && <Dado rotulo="Valor">{formatarPreco(Number(registro.preco))}</Dado>}
            {registro.transporte === "leva_busca" && <Dado rotulo="Transporte">Leva & Busca</Dado>}
            <Dado rotulo="Agendado por">{registro.origem === "admin" ? "Recepção (admin)" : "Site"}</Dado>
          </dl>
        </div>
      </section>

      {cliente?.preferencias && (
        <section className="rounded-xl bg-[#fdf1cf] px-5 py-4 text-[#5f4300]">
          <p className="adm-rotulo text-[#7a5600]">Preferências do cliente</p>
          <p className="mt-1 whitespace-pre-line text-sm font-medium">{cliente.preferencias}</p>
        </section>
      )}

      {/* Ação da etapa: só o que é possível agora */}
      {aguardandoCheckin && (
        <CheckinPlaca id={registro.id} carro={registro.carro} placa={registro.placa} lido={lido === "1"} />
      )}
      {status === "concluido" && (
        <p className="adm-card px-4 py-3 text-center text-sm font-semibold text-[#1c6a35]">✓ Atendimento concluído</p>
      )}
      {status === "cancelado" && (
        <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-center text-sm font-semibold text-[#b42318]">
          Agendamento cancelado. O horário foi liberado.
        </p>
      )}
      {status !== "concluido" && status !== "cancelado" && (
        <AcoesAgendamento
          id={registro.id}
          codigo={registro.codigo}
          status={status}
          whatsappUrl={whatsappDoCliente(registro)}
          naFicha
        />
      )}

      {/* Operação interna */}
      <section aria-labelledby="operacao">
        <h3 id="operacao" className="adm-rotulo mb-3">
          Operação interna
        </h3>
        <FormComAviso
          action={salvarOperacaoAtendimento.bind(null, registro.id)}
          mensagem="Dados do atendimento salvos"
          className="adm-card space-y-5 p-5 sm:p-6"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="adm-rotulo mb-1.5 block">Responsável pelo fechamento</span>
              <input
                name="responsavelFechamento"
                defaultValue={registro.responsavelFechamento ?? ""}
                placeholder="Quem fechou este agendamento"
                className="campo"
              />
            </label>
            <label className="block">
              <span className="adm-rotulo mb-1.5 block">Responsável pelo atendimento</span>
              <input
                name="responsavelAtendimento"
                defaultValue={registro.responsavelAtendimento ?? ""}
                placeholder="Lavador ou detailer"
                className="campo"
              />
            </label>
          </div>

          <label className="block">
            <span className="adm-rotulo mb-1.5 block">Observações do atendimento</span>
            <textarea
              name="observacoes"
              rows={3}
              defaultValue={registro.observacoes ?? ""}
              placeholder="Ex.: risco já existente na porta direita. Atenção especial às rodas."
              className="campo"
            />
            <span className="mt-1 block text-xs text-adm-muted">
              Só deste atendimento. Preferências permanentes ficam na ficha do cliente.
            </span>
          </label>

          <fieldset>
            <legend className="adm-rotulo mb-2">Checklist de entrada (opcional)</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {itensChecklist.map((item) => (
                <label key={item.campo} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-black/10 px-3 text-sm">
                  <input
                    type="checkbox"
                    name={item.campo}
                    defaultChecked={Boolean(checklist[item.chave])}
                    className="h-[18px] w-[18px] shrink-0 accent-[#16171a]"
                  />
                  {item.rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <BotaoEnviar>Salvar</BotaoEnviar>
        </FormComAviso>
      </section>

      {/* Histórico */}
      <section aria-labelledby="linha-do-tempo">
        <h3 id="linha-do-tempo" className="adm-rotulo mb-3">
          Linha do tempo
        </h3>
        <ol className="adm-card divide-y divide-adm-line">
          {linhaDoTempo.map((passo) => (
            <li key={passo.rotulo} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <span className={`text-sm font-medium ${passo.em ? "" : "text-black/35"}`}>{passo.rotulo}</span>
              <span className={`font-mono text-sm tabular-nums ${passo.em ? "" : "text-black/30"}`}>
                {passo.em
                  ? passo.dia
                    ? `${formatarDataCurta(dataIsoFortaleza(passo.em))} ${formatarHoraFortaleza(passo.em)}`
                    : formatarHoraFortaleza(passo.em)
                  : "--:--"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {movimentacoes.length > 0 && (
        <section aria-labelledby="movimentacoes">
          <h3 id="movimentacoes" className="adm-rotulo mb-3">
            Movimentações no quadro
          </h3>
          <ol className="adm-card divide-y divide-adm-line">
            {movimentacoes.map((evento, i) => (
              <li key={`${evento.em}-${i}`} className="flex items-baseline justify-between gap-4 px-5 py-3">
                <span className="text-sm font-semibold uppercase tracking-wide">{rotuloEstagio[evento.estagio]}</span>
                <span className="font-mono text-sm tabular-nums text-adm-muted">
                  {formatarDataCurta(dataIsoFortaleza(evento.em))} {formatarHoraFortaleza(evento.em)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Contato + QR */}
      <section className="adm-card flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="adm-rotulo">WhatsApp do cliente</p>
          <a
            href={whatsappDoCliente(registro)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-mono text-sm font-semibold underline underline-offset-4"
          >
            {registro.telefone}
          </a>
          <p className="mt-3 text-xs text-adm-muted">QR original do PitPass deste agendamento (o mesmo do cliente).</p>
        </div>
        <QrCode conteudo={urlCheckin(origem, token)} className="h-24 w-24 shrink-0 rounded-md border border-black/10" />
      </section>
    </div>
  );
}

function Dado({ rotulo, largo, children }: { rotulo: string; largo?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${largo ? "col-span-2 sm:col-span-3" : ""}`}>
      <dt className="adm-rotulo">{rotulo}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}
