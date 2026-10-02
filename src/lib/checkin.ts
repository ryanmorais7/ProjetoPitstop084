import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos } from "@/db/schema";
import { caminhoCheckin, PADRAO_TOKEN_CHECKIN } from "./pitpass";

type Agendamento = typeof agendamentos.$inferSelect;

/** 18 bytes aleatórios (144 bits) em base64url: 24 caracteres, impossível de adivinhar ou enumerar. */
export function gerarTokenCheckin(): string {
  return randomBytes(18).toString("base64url");
}

/** Origem pública do site a partir da requisição atual (funciona em localhost e atrás do proxy da Vercel). */
export async function origemDaRequisicao(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function urlCheckin(origem: string, token: string): string {
  return `${origem}${caminhoCheckin(token)}`;
}

export async function buscarAgendamentoPorToken(token: string): Promise<Agendamento | null> {
  if (!PADRAO_TOKEN_CHECKIN.test(token)) return null;
  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.checkinToken, token)).limit(1);
  return registro ?? null;
}

export async function buscarAgendamentoPorCodigo(codigo: string): Promise<Agendamento | null> {
  const [registro] = await db.select().from(agendamentos).where(eq(agendamentos.codigo, codigo)).limit(1);
  return registro ?? null;
}

/** Agendamentos criados antes do QR não têm token: gera um na primeira vez que alguém precisa dele. */
export async function garantirTokenCheckin(registro: Agendamento): Promise<string> {
  if (registro.checkinToken) return registro.checkinToken;
  const token = gerarTokenCheckin();
  const [atualizado] = await db
    .update(agendamentos)
    .set({ checkinToken: token })
    .where(and(eq(agendamentos.id, registro.id), isNull(agendamentos.checkinToken)))
    .returning({ checkinToken: agendamentos.checkinToken });
  if (atualizado?.checkinToken) return atualizado.checkinToken;
  // outra requisição gerou primeiro; usa o que ficou salvo
  const [atual] = await db
    .select({ checkinToken: agendamentos.checkinToken })
    .from(agendamentos)
    .where(eq(agendamentos.id, registro.id));
  return atual?.checkinToken ?? token;
}
