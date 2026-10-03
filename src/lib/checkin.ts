import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { and, asc, eq, gte, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agendamentos, clientes } from "@/db/schema";
import { hojeIso } from "./agenda";
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

export interface AgendamentoRecepcao {
  id: number;
  codigo: string | null;
  nome: string;
  carro: string;
  placa: string | null;
  dia: string;
  horario: string;
  servicoNome: string | null;
}

/**
 * Fallback da recepção quando o QR falha: acha os próximos agendamentos por nome, WhatsApp,
 * placa, código P084 ou código do cliente (C084). Uso interno do admin, nunca exposto ao público.
 */
export async function buscarAgendamentosRecepcao(termoBruto: string): Promise<AgendamentoRecepcao[]> {
  const termo = termoBruto.trim();
  if (termo.length < 2) return [];
  const digitos = termo.replace(/\D/g, "");
  const placa = termo.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const curinga = `%${termo}%`;

  const criterios = [
    ilike(agendamentos.nome, curinga),
    ilike(agendamentos.codigo, curinga),
    ilike(clientes.codigo, curinga),
  ];
  if (placa.length >= 3) {
    criterios.push(
      sql`upper(regexp_replace(coalesce(${agendamentos.placa}, ''), '[^A-Za-z0-9]', '', 'g')) like ${"%" + placa + "%"}`
    );
  }
  if (digitos.length >= 4) {
    criterios.push(sql`regexp_replace(${agendamentos.telefone}, '[^0-9]', '', 'g') like ${"%" + digitos + "%"}`);
  }

  return db
    .select({
      id: agendamentos.id,
      codigo: agendamentos.codigo,
      nome: agendamentos.nome,
      carro: agendamentos.carro,
      placa: agendamentos.placa,
      dia: agendamentos.dia,
      horario: agendamentos.horario,
      servicoNome: agendamentos.servicoNome,
    })
    .from(agendamentos)
    .leftJoin(clientes, eq(agendamentos.clienteId, clientes.id))
    .where(and(gte(agendamentos.dia, hojeIso()), ne(agendamentos.status, "cancelado"), or(...criterios)))
    .orderBy(asc(agendamentos.dia), asc(agendamentos.horario))
    .limit(10);
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
