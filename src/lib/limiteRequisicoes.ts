import { NextResponse } from "next/server";

/**
 * Freio contra tentativa em massa nas buscas públicas por WhatsApp (por instância do servidor;
 * não substitui um rate limit distribuído, mas barra o abuso mais óbvio sem dependência nova).
 */
const JANELA_MS = 10 * 60 * 1000;
const tentativas = new Map<string, number[]>();

export function limiteExcedido(chave: string, maximo: number): boolean {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  tentativas.set(chave, recentes);
  if (tentativas.size > 5000) tentativas.clear();
  return recentes.length > maximo;
}

export function ipDaRequisicao(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export const respostaLimite = () =>
  NextResponse.json(
    { erro: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." },
    { status: 429, headers: { "Retry-After": String(JANELA_MS / 1000) } }
  );
