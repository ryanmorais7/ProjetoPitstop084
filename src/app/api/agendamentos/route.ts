import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import {
  duchaPitstop,
  servicosAvulsos,
  planos,
  PlanoId,
  servicosPorPlano,
  precoServico,
  VehicleSize,
  diaFechado,
  horariosAgendamento,
} from "@/lib/data";
import { hojeIso } from "@/lib/agenda";

export async function GET() {
  const ocupados = await db
    .select({ dia: agendamentos.dia, horario: agendamentos.horario })
    .from(agendamentos)
    .where(gte(agendamentos.dia, hojeIso()));

  return NextResponse.json({ ocupados });
}

function dataValida(dia: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  const [ano, mes, diaDoMes] = dia.split("-").map(Number);
  const data = new Date(ano, mes - 1, diaDoMes);
  if (Number.isNaN(data.getTime())) return false;
  if (data.getDay() === diaFechado) return false;
  return dia >= hojeIso();
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    nome,
    telefone,
    carro,
    placa,
    tipoAtendimento,
    avulsosIds,
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
    typeof dia !== "string" || !dataValida(dia) ||
    typeof horario !== "string" || !horariosAgendamento.includes(horario)
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  const porte = porteVeiculo as VehicleSize;
  let plano = null as (typeof planos)[PlanoId] | null;
  let servicoPlanoNome: string | null = null;
  let preco: number | null = null;
  let servicosAdicionaisJson: string | null = null;

  if (tipoAtendimento === "avulso") {
    if (!Array.isArray(avulsosIds) || avulsosIds.some((id) => typeof id !== "string")) {
      return NextResponse.json({ erro: "Adicionais inválidos" }, { status: 400 });
    }
    const adicionais = (avulsosIds as string[]).map((id) =>
      servicosAvulsos.find((s) => s.id === id)
    );
    if (adicionais.some((s) => !s)) {
      return NextResponse.json({ erro: "Adicional inválido" }, { status: 400 });
    }
    const validos = adicionais.filter((s): s is NonNullable<typeof s> => Boolean(s));
    const totalAdicionais = validos.reduce(
      (soma, s) => soma + (precoServico(s, porte) ?? 0),
      0
    );
    preco = (precoServico(duchaPitstop, porte) ?? 0) + totalAdicionais;
    servicosAdicionaisJson = JSON.stringify(
      validos.map((s) => ({ id: s.id, nome: s.nome, preco: precoServico(s, porte) }))
    );
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
      servicoId: tipoAtendimento === "avulso" ? duchaPitstop.id : null,
      servicoNome: tipoAtendimento === "avulso" ? duchaPitstop.nome : servicoPlanoNome,
      servicosAdicionais: servicosAdicionaisJson,
      preco: preco != null ? preco.toFixed(2) : null,
      dia,
      horario,
    })
    .returning({ id: agendamentos.id });

  return NextResponse.json({ id: registro.id }, { status: 201 });
}
