import { NextResponse } from "next/server";
import { buscarMeusPitPass, prepararBusca } from "@/lib/meuPitPass";

/**
 * Freio simples contra tentativa em massa (por instância do servidor; não substitui um
 * rate limit distribuído, mas barra o abuso mais óbvio sem dependência nova).
 */
const JANELA_MS = 10 * 60 * 1000;
const MAX_TENTATIVAS = 12;
const tentativas = new Map<string, number[]>();

function limiteExcedido(chave: string): boolean {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(chave, recentes);
  if (tentativas.size > 5000) tentativas.clear();
  return recentes.length > MAX_TENTATIVAS;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limiteExcedido(ip)) {
    return NextResponse.json(
      { erro: "Muitas buscas seguidas. Aguarde alguns minutos e tente de novo." },
      { status: 429 }
    );
  }

  const busca = prepararBusca(await request.json().catch(() => null));
  if (!busca) {
    return NextResponse.json(
      { erro: "Confira o WhatsApp (com DDD) e a placa ou o código do agendamento." },
      { status: 400 }
    );
  }

  const agendamentos = await buscarMeusPitPass(busca, new URL(request.url).origin);
  // mesma resposta pra "telefone não existe" e "placa não bate": não revela quem é cliente
  return NextResponse.json({ agendamentos }, { headers: { "Cache-Control": "no-store" } });
}
