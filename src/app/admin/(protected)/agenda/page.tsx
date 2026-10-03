import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { horariosBloqueados } from "@/db/schema";
import { horariosAgendamento } from "@/lib/data";
import { hojeIso, horaAtualFortaleza, proximasDatasUteis, paraIso, formatarDataCurta } from "@/lib/agenda";
import { agendamentosDoDia, descreverServicos } from "@/lib/adminDados";
import { statusOperacional } from "@/lib/pitpass";
import { StatusChip, ProximidadeChip } from "@/components/admin/AgendamentoCard";
import FormComAviso, { BotaoEnviar } from "@/components/admin/FormComAviso";
import { bloquearHorario, desbloquearHorario } from "../../actions";

const diaAbreviadoCurto = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function isoValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

export default async function AgendaPage({ searchParams }: PageProps<"/admin/agenda">) {
  const { dia } = await searchParams;
  const hoje = hojeIso();
  const horaAgora = horaAtualFortaleza();
  const diaSelecionado = isoValido(dia) ? dia : hoje;
  const datasRapidas = proximasDatasUteis(6);

  const [registros, bloqueios] = await Promise.all([
    agendamentosDoDia(diaSelecionado),
    db.select().from(horariosBloqueados).where(eq(horariosBloqueados.dia, diaSelecionado)),
  ]);

  const porHorario = new Map(registros.map((r) => [r.horario, r]));
  const bloqueioPorHorario = new Map(bloqueios.map((b) => [b.horario, b]));
  const livres = horariosAgendamento.filter((h) => !porHorario.has(h) && !bloqueioPorHorario.has(h)).length;

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {datasRapidas.map((data) => {
          const iso = paraIso(data);
          const selecionado = iso === diaSelecionado;
          return (
            <Link
              key={iso}
              href={`/admin/agenda?dia=${iso}`}
              aria-current={selecionado ? "date" : undefined}
              className={`flex min-w-14 shrink-0 flex-col items-center rounded-lg border px-3 py-2 font-heading transition-colors ${
                selecionado
                  ? "border-gold bg-gold text-asphalt"
                  : "border-black/15 bg-white text-adm-muted hover:border-black/40 hover:text-adm-ink"
              }`}
            >
              <span className="text-[11px] font-semibold tracking-wide">{diaAbreviadoCurto[data.getUTCDay()]}</span>
              <span className="text-lg font-bold leading-tight">{data.getUTCDate()}</span>
            </Link>
          );
        })}
        <form method="GET" action="/admin/agenda" className="relative flex shrink-0 items-center gap-2">
          <label htmlFor="agenda-dia" className="sr-only">
            Outro dia
          </label>
          <input id="agenda-dia" type="date" name="dia" defaultValue={diaSelecionado} className="campo w-auto" />
          <button type="submit" className="adm-btn">
            Ver
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-heading text-2xl font-bold">
          {formatarDataCurta(diaSelecionado)}
          {diaSelecionado === hoje && <span className="ml-2 text-base text-adm-muted">· hoje</span>}
        </p>
        <p className="adm-rotulo">
          {registros.length} agendado{registros.length === 1 ? "" : "s"} · {livres} livre{livres === 1 ? "" : "s"} ·{" "}
          {bloqueios.length} bloqueado{bloqueios.length === 1 ? "" : "s"}
        </p>
      </div>

      <ol className="adm-card mt-4 divide-y divide-adm-line overflow-hidden">
        {horariosAgendamento.map((hora) => {
          const registro = porHorario.get(hora);
          const bloqueio = bloqueioPorHorario.get(hora);
          const jaPassou = diaSelecionado < hoje || (diaSelecionado === hoje && hora <= horaAgora);

          return (
            <li key={hora} className={`flex gap-4 px-4 py-4 sm:px-5 ${bloqueio ? "bg-black/[0.03]" : ""}`}>
              <p className="w-14 shrink-0 pt-0.5 font-heading text-xl font-bold tabular-nums">{hora}</p>

              {registro ? (
                <Link
                  href={`/admin/atendimentos/${registro.id}`}
                  className="group min-w-0 flex-1 border-l-2 border-gold pl-4"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-base font-bold leading-tight underline-offset-4 group-hover:underline">
                      {descreverServicos(registro)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-adm-muted">
                    {registro.nome}
                    <span className="mx-1.5 text-black/25">•</span>
                    {registro.carro}
                    {registro.placa && (
                      <>
                        <span className="mx-1.5 text-black/25">•</span>
                        <span className="font-mono text-[13px] text-adm-ink">{registro.placa}</span>
                      </>
                    )}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusChip status={statusOperacional(registro, hoje)} />
                    <ProximidadeChip registro={registro} hoje={hoje} horaAgora={horaAgora} />
                    <span className="font-mono text-[11px] text-adm-muted">{registro.codigo}</span>
                  </span>
                </Link>
              ) : bloqueio ? (
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 border-l-2 border-black/20 pl-4">
                  <div>
                    <span className="adm-chip adm-status-inativo">Bloqueado</span>
                    {bloqueio.motivo && <p className="mt-1 text-sm text-adm-muted">{bloqueio.motivo}</p>}
                  </div>
                  <FormComAviso action={desbloquearHorario.bind(null, bloqueio.id)} mensagem="Horário liberado">
                    <BotaoEnviar>Desbloquear</BotaoEnviar>
                  </FormComAviso>
                </div>
              ) : (
                <div className="min-w-0 flex-1 border-l-2 border-black/10 pl-4">
                  <p className={`font-heading text-sm font-bold tracking-[0.12em] ${jaPassou ? "text-black/30" : "text-[#1c6a35]"}`}>
                    {jaPassou ? "SEM AGENDAMENTO" : "DISPONÍVEL"}
                  </p>
                  {!jaPassou && (
                    <details className="mt-1">
                      <summary className="inline-flex min-h-9 cursor-pointer items-center text-sm text-adm-muted underline-offset-4 hover:text-adm-ink hover:underline">
                        Bloquear horário
                      </summary>
                      <FormComAviso action={bloquearHorario} mensagem="Horário bloqueado" className="mt-2 flex flex-wrap gap-2">
                        <input type="hidden" name="dia" value={diaSelecionado} />
                        <input type="hidden" name="horario" value={hora} />
                        <label className="sr-only" htmlFor={`motivo-${hora}`}>
                          Motivo do bloqueio
                        </label>
                        <input
                          id={`motivo-${hora}`}
                          type="text"
                          name="motivo"
                          placeholder="Motivo (opcional)"
                          className="campo max-w-xs flex-1 text-sm"
                        />
                        <BotaoEnviar>Bloquear</BotaoEnviar>
                      </FormComAviso>
                    </details>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-xs text-adm-muted">
        Horário bloqueado some da agenda da landing na mesma hora. A disponibilidade aqui é a mesma que o cliente vê.
      </p>
    </div>
  );
}
