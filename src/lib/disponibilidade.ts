import { and, eq, gte, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, horariosBloqueados } from "@/db/schema";
import { Intervalo, intervaloOcupado, ocupaAgenda } from "./agenda";

/** Um trecho ocupado da agenda (atendimento ou bloqueio), em minutos do dia. */
export interface Ocupacao extends Intervalo {
  dia: string;
}

/**
 * Tudo que ocupa a agenda de `aPartirDe` em diante (ou só em `soDia`): atendimentos não
 * cancelados, cada um do início até início + duração + buffer, e horários bloqueados pela
 * gestão. Encaixes (hora fora da grade) não entram: são carros já na loja, sem reserva.
 */
export async function ocupacaoDaAgenda({
  aPartirDe,
  soDia,
  bufferMin,
}: {
  aPartirDe?: string;
  soDia?: string;
  bufferMin: number;
}): Promise<Ocupacao[]> {
  const doDia = soDia ?? aPartirDe ?? "";
  const [atendimentos, bloqueios] = await Promise.all([
    db
      .select({ dia: agendamentos.dia, horario: agendamentos.horario, duracaoMin: agendamentos.duracaoMin })
      .from(agendamentos)
      .where(
        and(soDia ? eq(agendamentos.dia, doDia) : gte(agendamentos.dia, doDia), ne(agendamentos.status, "cancelado"))
      ),
    db
      .select({ dia: horariosBloqueados.dia, horario: horariosBloqueados.horario })
      .from(horariosBloqueados)
      .where(soDia ? eq(horariosBloqueados.dia, doDia) : gte(horariosBloqueados.dia, doDia)),
  ]);

  return [
    ...atendimentos
      .filter((a) => ocupaAgenda(a.horario))
      .map((a) => ({ dia: a.dia, ...intervaloOcupado(a.horario, a.duracaoMin, bufferMin) })),
    // bloqueio vale pelo horário da grade inteiro, sem buffer
    ...bloqueios.map((b) => ({ dia: b.dia, ...intervaloOcupado(b.horario, null, 0) })),
  ];
}
