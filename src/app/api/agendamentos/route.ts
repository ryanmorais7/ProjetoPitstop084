import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import {
  todosServicos,
  planos,
  PlanoId,
  servicosPorPlano,
  precoServico,
  VehicleSize,
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
  const {
    nome,
    telefone,
    carro,
    placa,
    tipoAtendimento,
    servicoId,
    planoId,
    porteVeiculo,
    servicoPlano,
    dia,
    horario,
  } = body ?? {};

  if (
    typeof nome !== "string" || nome.trim().length < 2 ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof carro !== "string" || carro.trim().length < 1 ||
    (tipoAtendimento !== "avulso" && tipoAtendimento !== "assinatura") ||
    (porteVeiculo !== "P" && porteVeiculo !== "G") ||
    typeof dia !== "string" || !diasAgendamento.includes(dia) ||
    typeof horario !== "string" || !horariosAgendamento.includes(horario)
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  const porte = porteVeiculo as VehicleSize;
  let servico = null as (typeof todosServicos)[number] | null;
  let plano = null as (typeof planos)[PlanoId] | null;
  let servicoPlanoNome: string | null = null;
  let preco: number | null = null;

  if (tipoAtendimento === "avulso") {
    servico = todosServicos.find((s) => s.id === servicoId && !s.requiresEvaluation) ?? null;
    if (!servico) {
      return NextResponse.json({ erro: "Serviço inválido" }, { status: 400 });
    }
    preco = precoServico(servico, porte);
  } else {
    plano = planos[planoId as PlanoId] ?? null;
    if (!plano) {
      return NextResponse.json({ erro: "Plano inválido" }, { status: 400 });
    }
    if (typeof servicoPlano !== "string" || !servicosPorPlano[plano.id].includes(servicoPlano)) {
      return NextResponse.json({ erro: "Serviço do plano inválido" }, { status: 400 });
    }
    servicoPlanoNome = servicoPlano;
    preco = plano.precos[porte];
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
      categoriaVeiculo: porte,
      servicoId: servico?.id ?? null,
      servicoNome: servico?.nome ?? servicoPlanoNome,
      preco: preco != null ? preco.toFixed(2) : null,
      dia,
      horario,
    })
    .returning({ id: agendamentos.id });

  return NextResponse.json({ id: registro.id }, { status: 201 });
}
