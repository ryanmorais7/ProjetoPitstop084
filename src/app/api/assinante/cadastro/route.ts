import { NextResponse } from "next/server";
import { cadastrarAssinante } from "@/lib/assinante";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import { ipDaRequisicao, limiteExcedido, respostaLimite } from "@/lib/limiteRequisicoes";

const MAX_POR_IP = 6;

/** Cadastro PitPass (uma única vez por WhatsApp). Se já existir, devolve o cadastro existente. */
export async function POST(request: Request) {
  if (limiteExcedido(`cadastro-ip:${ipDaRequisicao(request)}`, MAX_POR_IP)) return respostaLimite();

  const resultado = await cadastrarAssinante(await request.json().catch(() => null), await carregarCatalogo());
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }
  return NextResponse.json(
    { assinante: resultado.assinante.publico, jaExistia: resultado.jaExistia },
    { status: resultado.jaExistia ? 200 : 201, headers: { "Cache-Control": "no-store" } }
  );
}
