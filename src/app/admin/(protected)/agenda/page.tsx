import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { horariosBloqueados } from "@/db/schema";
import { diaFechado, horariosAgendamento } from "@/lib/data";
import { hojeIso, formatarDataCurta, agoraMs } from "@/lib/agenda";
import { cartoesDoDia } from "@/lib/adminDados";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import AgendaPainel from "@/components/admin/agenda/AgendaPainel";

function isoValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

/** Dia vizinho, pulando o dia em que a loja não abre. */
function diaVizinho(iso: string, passo: 1 | -1): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia, 12));
  do {
    data.setUTCDate(data.getUTCDate() + passo);
  } while (data.getUTCDay() === diaFechado);
  return data.toISOString().slice(0, 10);
}

/**
 * Agenda = painel operacional do dia. O servidor entrega os cards do dia escolhido; o quadro
 * (Kanban ou Horários), os filtros e os cronômetros rodam no navegador.
 */
export default async function AgendaPage({ searchParams }: PageProps<"/admin/agenda">) {
  const { dia } = await searchParams;
  const hoje = hojeIso();
  const diaSelecionado = isoValido(dia) ? dia : hoje;

  const [cartoes, catalogo, bloqueios] = await Promise.all([
    cartoesDoDia(diaSelecionado),
    carregarCatalogo(),
    db
      .select({ id: horariosBloqueados.id, horario: horariosBloqueados.horario, motivo: horariosBloqueados.motivo })
      .from(horariosBloqueados)
      .where(eq(horariosBloqueados.dia, diaSelecionado))
      .orderBy(asc(horariosBloqueados.horario)),
  ]);

  return (
    <AgendaPainel
      key={diaSelecionado}
      cartoes={cartoes}
      dia={diaSelecionado}
      hoje={hoje}
      rotuloDia={formatarDataCurta(diaSelecionado)}
      diaAnterior={diaVizinho(diaSelecionado, -1)}
      diaSeguinte={diaVizinho(diaSelecionado, 1)}
      horarios={horariosAgendamento}
      bloqueios={bloqueios}
      bufferMin={catalogo.bufferMin}
      agoraServidor={agoraMs()}
    />
  );
}
