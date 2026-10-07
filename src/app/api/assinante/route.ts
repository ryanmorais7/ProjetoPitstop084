import { NextResponse } from "next/server";
import { buscarAssinante } from "@/lib/assinante";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import { telefoneValido } from "@/lib/format";
import { ipDaRequisicao, limiteExcedido, respostaLimite } from "@/lib/limiteRequisicoes";

const MAX_POR_IP = 10;
const MAX_POR_TELEFONE = 8;

/** "Sou assinante": só o WhatsApp. Devolve o cadastro PitPass, se existir (sem placa nem telefone). */
export async function POST(request: Request) {
  if (limiteExcedido(`assinante-ip:${ipDaRequisicao(request)}`, MAX_POR_IP)) return respostaLimite();

  const corpo = (await request.json().catch(() => null)) as { telefone?: unknown } | null;
  const telefone = typeof corpo?.telefone === "string" ? telefoneValido(corpo.telefone) : null;
  if (!telefone) {
    return NextResponse.json({ erro: "Confira o WhatsApp, com DDD." }, { status: 400 });
  }
  if (limiteExcedido(`assinante-tel:${telefone}`, MAX_POR_TELEFONE)) return respostaLimite();

  const encontrado = await buscarAssinante(telefone, await carregarCatalogo());
  return NextResponse.json(
    encontrado ? { encontrado: true, assinante: encontrado.publico } : { encontrado: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}
