import { NextResponse } from "next/server";
import { buscarMeusPitPass, prepararBusca } from "@/lib/meuPitPass";
import { ipDaRequisicao, limiteExcedido, respostaLimite } from "@/lib/limiteRequisicoes";

// Como a busca usa só o telefone, o limite é por IP (quem tenta vários números) e por número
// (quem insiste no mesmo).
const MAX_POR_IP = 8;
const MAX_POR_TELEFONE = 6;

export async function POST(request: Request) {
  if (limiteExcedido(`ip:${ipDaRequisicao(request)}`, MAX_POR_IP)) return respostaLimite();

  const telefone = prepararBusca(await request.json().catch(() => null));
  if (!telefone) {
    return NextResponse.json({ erro: "Confira o WhatsApp, com DDD." }, { status: 400 });
  }
  if (limiteExcedido(`tel:${telefone}`, MAX_POR_TELEFONE)) return respostaLimite();

  const agendamentos = await buscarMeusPitPass(telefone, new URL(request.url).origin);
  // lista vazia vale pra "número nunca usado" e pra "sem próximos agendamentos": não revela quem é cliente
  return NextResponse.json({ agendamentos }, { headers: { "Cache-Control": "no-store" } });
}
