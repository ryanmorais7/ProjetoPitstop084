import Link from "next/link";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, horariosBloqueados } from "@/db/schema";
import { horariosAgendamento } from "@/lib/data";
import { hojeIso, proximasDatasUteis, paraIso, formatarDataCurta } from "@/lib/agenda";
import { bloquearHorario, desbloquearHorario } from "../../actions";

const diaAbreviadoCurto = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function isoValido(valor: string | undefined): valor is string {
  return !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { dia } = await searchParams;
  const diaSelecionado = isoValido(dia) ? dia : hojeIso();
  const datasRapidas = proximasDatasUteis(6);

  const [registros, bloqueios] = await Promise.all([
    db
      .select()
      .from(agendamentos)
      .where(and(eq(agendamentos.dia, diaSelecionado), ne(agendamentos.status, "cancelado"))),
    db.select().from(horariosBloqueados).where(eq(horariosBloqueados.dia, diaSelecionado)),
  ]);

  const porHorario = new Map(registros.map((r) => [r.horario, r]));
  const bloqueioPorHorario = new Map(bloqueios.map((b) => [b.horario, b]));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Agenda</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {datasRapidas.map((data) => {
          const iso = paraIso(data);
          const ativo = iso === diaSelecionado;
          return (
            <Link
              key={iso}
              href={`/admin/agenda?dia=${iso}`}
              className={`flex flex-col items-center rounded-sm px-4 py-2 font-heading transition ${
                ativo ? "bg-gold text-asphalt" : "border border-white/15 text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="text-xs">{diaAbreviadoCurto[data.getUTCDay()]}</span>
              <span className="text-base font-bold">{data.getUTCDate()}</span>
            </Link>
          );
        })}

        <form method="GET" action="/admin/agenda" className="flex items-center gap-2">
          <input type="date" name="dia" defaultValue={diaSelecionado} min={hojeIso()} className="campo w-auto" />
          <button
            type="submit"
            className="rounded-sm border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-secondary transition hover:border-gold hover:text-gold"
          >
            Ver
          </button>
        </form>
      </div>

      <p className="mt-4 font-mono text-sm text-text-secondary">{formatarDataCurta(diaSelecionado)}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {horariosAgendamento.map((hora) => {
          const registro = porHorario.get(hora);
          const bloqueio = bloqueioPorHorario.get(hora);
          return (
            <div
              key={hora}
              className={`rounded-sm border p-4 ${
                registro
                  ? "border-gold bg-gold/10"
                  : bloqueio
                  ? "border-white/10 bg-white/5"
                  : "border-white/10 bg-panel"
              }`}
            >
              <p className="font-mono text-sm font-bold">{hora}</p>
              {registro ? (
                <>
                  <p className="mt-1 text-sm text-white">{registro.nome}</p>
                  <p className="text-xs text-text-secondary">{registro.carro}</p>
                  {registro.codigo && (
                    <p className="mt-1 font-mono text-xs text-gold">{registro.codigo}</p>
                  )}
                </>
              ) : bloqueio ? (
                <>
                  <p className="mt-1 text-sm text-text-secondary">
                    Bloqueado{bloqueio.motivo ? ` · ${bloqueio.motivo}` : ""}
                  </p>
                  <form action={desbloquearHorario.bind(null, bloqueio.id)}>
                    <button
                      type="submit"
                      className="mt-2 font-mono text-xs uppercase tracking-wide text-gold underline-offset-4 hover:underline"
                    >
                      Desbloquear
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-text-secondary">Livre</p>
                  <form action={bloquearHorario} className="mt-2 space-y-1">
                    <input type="hidden" name="dia" value={diaSelecionado} />
                    <input type="hidden" name="horario" value={hora} />
                    <input
                      type="text"
                      name="motivo"
                      placeholder="Motivo (opcional)"
                      className="campo font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="font-mono text-xs uppercase tracking-wide text-text-secondary underline-offset-4 hover:text-gold hover:underline"
                    >
                      Bloquear horário
                    </button>
                  </form>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
