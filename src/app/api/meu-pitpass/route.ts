import { NextResponse } from "next/server";
import { buscarMeusPitPass, prepararBusca } from "@/lib/meuPitPass";

/**
 * Freio contra tentativa em massa (por instância do servidor; não substitui um rate limit
 * distribuído, mas barra o abuso mais óbvio sem dependência nova). Como a busca usa só o
 * telefone, o limite é por IP (quem tenta vários números) e por número (quem insiste no mesmo).
 */
const JANELA_MS = 10 * 60 * 1000;
const MAX_POR_IP = 8;
const MAX_POR_TELEFONE = 6;
const tentativas = new Map<string, number[]>();

function limiteExcedido(chave: string, maximo: number): boolean {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(chave, recentes);
  if (tentativas.size > 5000) tentativas.clear();
  return recentes.length > maximo;
}

const respostaLimite = () =>
  NextResponse.json(
    { erro: "Muitas buscas seguidas. Aguarde alguns minutos e tente de novo." },
    { status: 429, headers: { "Retry-After": String(JANELA_MS / 1000) } }
  );

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limiteExcedido(`ip:${ip}`, MAX_POR_IP)) return respostaLimite();

  const telefone = prepararBusca(await request.json().catch(() => null));
  if (!telefone) {
    return NextResponse.json({ erro: "Confira o WhatsApp, com DDD." }, { status: 400 });
  }
  if (limiteExcedido(`tel:${telefone}`, MAX_POR_TELEFONE)) return respostaLimite();

  const agendamentos = await buscarMeusPitPass(telefone, new URL(request.url).origin);
  // lista vazia vale pra "número nunca usado" e pra "sem próximos agendamentos": não revela quem é cliente
  return NextResponse.json({ agendamentos }, { headers: { "Cache-Control": "no-store" } });
}
