import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { clientes, veiculos, assinaturas, agendamentos, beneficioUsos } from "@/db/schema";

export async function buscarClientes(query: string) {
  const termo = query.trim();
  if (!termo) return [];
  const digitos = termo.replace(/\D/g, "");

  const porTexto = await db
    .select()
    .from(clientes)
    .where(or(ilike(clientes.nome, `%${termo}%`), ilike(clientes.codigo, `%${termo}%`)))
    .limit(20);

  const porTelefone =
    digitos.length >= 3
      ? await db
          .select()
          .from(clientes)
          .where(sql`regexp_replace(${clientes.telefone}, '[^0-9]', '', 'g') LIKE ${"%" + digitos + "%"}`)
          .limit(20)
      : [];

  const veiculosMatch = await db.select().from(veiculos).where(ilike(veiculos.placa, `%${termo}%`)).limit(20);
  const idsClientesPorPlaca = [...new Set(veiculosMatch.map((v) => v.clienteId))];
  const porPlaca =
    idsClientesPorPlaca.length > 0
      ? await db.select().from(clientes).where(inArray(clientes.id, idsClientesPorPlaca))
      : [];

  // busca também por código de AGENDAMENTO (P084-XXXX), não só código de cliente (C084-XXXX)
  const agendamentosMatch = await db
    .select({ clienteId: agendamentos.clienteId })
    .from(agendamentos)
    .where(ilike(agendamentos.codigo, `%${termo}%`))
    .limit(20);
  const idsClientesPorAgendamento = [
    ...new Set(agendamentosMatch.map((a) => a.clienteId).filter((id): id is number => id != null)),
  ];
  const porCodigoAgendamento =
    idsClientesPorAgendamento.length > 0
      ? await db.select().from(clientes).where(inArray(clientes.id, idsClientesPorAgendamento))
      : [];

  const todos = [...porTexto, ...porTelefone, ...porPlaca, ...porCodigoAgendamento];
  const unicos = new Map(todos.map((c) => [c.id, c]));
  return [...unicos.values()];
}

export async function buscarClienteComDetalhes(id: number) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
  if (!cliente) return null;

  const [veiculosDoCliente, assinaturaAtiva, historico] = await Promise.all([
    db.select().from(veiculos).where(eq(veiculos.clienteId, id)),
    db
      .select()
      .from(assinaturas)
      .where(and(eq(assinaturas.clienteId, id), eq(assinaturas.status, "ativo")))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(agendamentos)
      .where(eq(agendamentos.clienteId, id))
      .orderBy(desc(agendamentos.dia), desc(agendamentos.horario)),
  ]);

  const beneficios = assinaturaAtiva
    ? await db.select().from(beneficioUsos).where(eq(beneficioUsos.assinaturaId, assinaturaAtiva.id))
    : [];

  const visitasConcluidas = historico.filter((h) => h.status === "concluido").length;
  const proximoAgendamento = historico
    .filter((h) => h.status === "confirmado")
    .sort((a, b) => (a.dia + a.horario).localeCompare(b.dia + b.horario))[0];

  return {
    cliente,
    veiculos: veiculosDoCliente,
    assinaturaAtiva,
    historico,
    beneficios,
    visitasConcluidas,
    proximoAgendamento: proximoAgendamento ?? null,
  };
}
