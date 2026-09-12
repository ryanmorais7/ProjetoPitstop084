import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import {
  avulsos,
  planos,
  PlanoId,
  servicosPlano,
  diasAgendamento,
  horariosAgendamento,
} from "@/lib/data";

export async function GET() {
  const ocupados = await db
    .select({ dia: agendamentos.dia, horario: agendamentos.horario })
    .from(agendamentos);

  return NextResponse.json({ ocupados });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { nome, telefone, carro, placa, tipoAtendimento, servicoId, planoId, servicoPlano, dia, horario } =
    body ?? {};

  if (
    typeof nome !== "string" || nome.trim().length < 2 ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof carro !== "string" || carro.trim().length < 1 ||
    (tipoAtendimento !== "avulso" && tipoAtendimento !== "assinatura") ||
    typeof dia !== "string" || !diasAgendamento.includes(dia) ||
    typeof horario !== "string" || !horariosAgendamento.includes(horario)
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  let servico = null as (typeof avulsos)[number] | null;
  let plano = null as (typeof planos)[PlanoId] | null;
  let servicoPlanoNome: string | null = null;

  if (tipoAtendimento === "avulso") {
    servico = avulsos.find((s) => s.id === servicoId && !s.sobConsulta) ?? null;
    if (!servico) {
      return NextResponse.json({ erro: "Serviço inválido" }, { status: 400 });
    }
  } else {
    plano = planos[planoId as PlanoId] ?? null;
    if (!plano || typeof servicoPlano !== "string" || !servicosPlano.includes(servicoPlano)) {
      return NextResponse.json({ erro: "Plano ou serviço do plano inválido" }, { status: 400 });
    }
    servicoPlanoNome = servicoPlano;
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
      carro: carro.trim(),
      placa: typeof placa === "string" && placa.trim() ? placa.trim().toUpperCase() : null,
      tipoAtendimento,
      plano: plano?.id ?? null,
      servicoId: servico?.id ?? null,
      servicoNome: servico?.nome ?? servicoPlanoNome,
      preco: servico?.preco != null ? servico.preco.toFixed(2) : null,
      dia,
      horario,
    })
    .returning({ id: agendamentos.id });

  return NextResponse.json({ id: registro.id }, { status: 201 });
}
