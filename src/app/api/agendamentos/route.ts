import { NextResponse } from "next/server";
import { and, gte, ne, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, horariosBloqueados, assinaturas } from "@/db/schema";
import {
  duchaPitstop,
  servicosAvulsos,
  planos,
  PlanoId,
  servicosPorPlano,
  precoServico,
  VehicleSize,
  horariosAgendamento,
} from "@/lib/data";
import { hojeIso, dataValidaParaAgendar } from "@/lib/agenda";
import { criarAgendamento, buscarClientePorTelefone, verificarBeneficioDisponivel } from "@/lib/bookings";

export async function GET() {
  const [ocupados, bloqueados] = await Promise.all([
    db
      .select({ dia: agendamentos.dia, horario: agendamentos.horario })
      .from(agendamentos)
      .where(and(gte(agendamentos.dia, hojeIso()), ne(agendamentos.status, "cancelado"))),
    db
      .select({ dia: horariosBloqueados.dia, horario: horariosBloqueados.horario })
      .from(horariosBloqueados)
      .where(gte(horariosBloqueados.dia, hojeIso())),
  ]);

  return NextResponse.json({ ocupados: [...ocupados, ...bloqueados] });
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
    typeof dia !== "string" || !dataValidaParaAgendar(dia) ||
    typeof horario !== "string" || !horariosAgendamento.includes(horario)
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  const porte = porteVeiculo as VehicleSize;
  let plano = null as (typeof planos)[PlanoId] | null;
  let servicoPlanoNome: string | null = null;
  let preco: number | null = null;
  let servicosAdicionaisJson: string | null = null;
  let assinaturaId: number | null = null;

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

    // Se já existe um cliente com esse telefone e uma assinatura ativa, o benefício
    // precisa bater com o plano real dele e respeitar a cota real — nunca confiar só na UI.
    const clienteExistente = await buscarClientePorTelefone(telefone);
    if (clienteExistente) {
      const [assinaturaAtiva] = await db
        .select()
        .from(assinaturas)
        .where(and(eq(assinaturas.clienteId, clienteExistente.id), eq(assinaturas.status, "ativo")));

      if (assinaturaAtiva) {
        if (assinaturaAtiva.plano !== plano.id) {
          return NextResponse.json(
            { erro: "Esse WhatsApp já está associado a outro plano PitPass." },
            { status: 400 }
          );
        }
        const disponibilidade = await verificarBeneficioDisponivel({
          assinaturaId: assinaturaAtiva.id,
          plano: plano.id,
          beneficio: servicoPlanoNome,
          cicloInicio: assinaturaAtiva.cicloInicio,
        });
        if (!disponibilidade.disponivel) {
          return NextResponse.json(
            { erro: disponibilidade.motivo ?? "Benefício indisponível." },
            { status: 400 }
          );
        }
        assinaturaId = assinaturaAtiva.id;
      }
    }
  }

  const resultado = await criarAgendamento({
    nome,
    telefone,
    carro,
    placa,
    porteVeiculo: porte,
    tipoAtendimento,
    dia,
    horario,
    planoId: plano?.id ?? null,
    servicoPlano: servicoPlanoNome,
    servicoId: tipoAtendimento === "avulso" ? duchaPitstop.id : null,
    servicoNome: tipoAtendimento === "avulso" ? duchaPitstop.nome : servicoPlanoNome,
    servicosAdicionaisJson,
    preco,
    origem: "landing",
    assinaturaId,
  });

  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: resultado.status });
  }

  return NextResponse.json({ id: resultado.id, codigo: resultado.codigo }, { status: 201 });
}
