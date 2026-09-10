import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import { avulsos, diasAgendamento, horariosAgendamento } from "@/lib/data";

export async function GET() {
  const ocupados = await db
    .select({ dia: agendamentos.dia, horario: agendamentos.horario })
    .from(agendamentos);

  return NextResponse.json({ ocupados });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { nome, telefone, servicoId, dia, horario } = body ?? {};

  if (
    typeof nome !== "string" || nome.trim().length < 2 ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof dia !== "string" || !diasAgendamento.includes(dia) ||
    typeof horario !== "string" || !horariosAgendamento.includes(horario)
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  const servico = avulsos.find((s) => s.id === servicoId && !s.sobConsulta);
  if (!servico) {
    return NextResponse.json({ erro: "Serviço inválido" }, { status: 400 });
  }

  const existente = await db
    .select({ id: agendamentos.id })
    .from(agendamentos)
    .where(and(eq(agendamentos.dia, dia), eq(agendamentos.horario, horario)))
    .limit(1);

  if (existente.length > 0) {
    return NextResponse.json({ erro: "Horário já reservado" }, { status: 409 });
  }

  const [registro] = await db
    .insert(agendamentos)
    .values({
      nome: nome.trim(),
      telefone: telefone.trim(),
      servicoId: servico.id,
      servicoNome: servico.nome,
      preco: servico.preco != null ? servico.preco.toFixed(2) : null,
      dia,
      horario,
    })
    .returning({ id: agendamentos.id });

  return NextResponse.json({ id: registro.id }, { status: 201 });
}
