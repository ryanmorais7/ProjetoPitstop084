import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const agendamentos = pgTable("agendamentos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  carro: text("carro").notNull(),
  placa: text("placa"),
  tipoAtendimento: text("tipo_atendimento").notNull(),
  plano: text("plano"),
  categoriaVeiculo: text("categoria_veiculo"),
  servicoId: text("servico_id"),
  servicoNome: text("servico_nome"),
  /** JSON de [{id, nome, preco}] com os cuidados adicionais escolhidos no configurador (preco: null = mediante avaliação). */
  servicosAdicionais: text("servicos_adicionais"),
  preco: numeric("preco", { precision: 10, scale: 2 }),
  /** Data real do agendamento, formato ISO "YYYY-MM-DD" (não é mais nome de dia da semana). */
  dia: text("dia").notNull(),
  horario: text("horario").notNull(),
  /** "confirmado" | "concluido" | "cancelado" — só confirmado/concluido ocupam o horário. */
  status: text("status").notNull().default("confirmado"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StatusAgendamento = "confirmado" | "concluido" | "cancelado";
