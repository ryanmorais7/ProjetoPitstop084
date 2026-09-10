import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { assinaturas } from "@/db/schema";
import { planos, PlanoId } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json();
  const { nome, telefone, veiculo, dataNascimento, endereco, planoId } = body ?? {};

  if (
    typeof nome !== "string" || nome.trim().length < 2 ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof veiculo !== "string" || veiculo.trim().length < 1 ||
    typeof dataNascimento !== "string" || dataNascimento.trim().length === 0
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  const plano = planos.find((p) => p.id === planoId);
  if (!plano) {
    return NextResponse.json({ erro: "Plano inválido" }, { status: 400 });
  }

  const [registro] = await db
    .insert(assinaturas)
    .values({
      nome: nome.trim(),
      telefone: telefone.trim(),
      veiculo: veiculo.trim(),
      dataNascimento,
      endereco: typeof endereco === "string" && endereco.trim() ? endereco.trim() : null,
      plano: plano.id satisfies PlanoId,
      precoMensal: plano.precoMensal.toFixed(2),
    })
    .returning({ id: assinaturas.id });

  return NextResponse.json({ id: registro.id }, { status: 201 });
}
