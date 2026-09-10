import { pgTable, serial, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const assinaturas = pgTable("assinaturas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  veiculo: text("veiculo").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  endereco: text("endereco"),
  plano: text("plano").notNull(),
  precoMensal: numeric("preco_mensal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agendamentos = pgTable("agendamentos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  servicoId: text("servico_id").notNull(),
  servicoNome: text("servico_nome").notNull(),
  preco: numeric("preco", { precision: 10, scale: 2 }),
  dia: text("dia").notNull(),
  horario: text("horario").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
