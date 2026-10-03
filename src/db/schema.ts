import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  /** "C084-0001", gerado server-side depois do insert (segundo UPDATE usando o próprio id). */
  codigo: text("codigo").unique(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  cep: text("cep"),
  rua: text("rua"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  uf: text("uf"),
  referencia: text("referencia"),
  /** Observações permanentes do cliente (ex.: preferências), diferente de observações de um atendimento específico. */
  preferencias: text("preferencias"),
  /** Por onde o cliente chegou: "site" | "instagram" | "whatsapp" | "presencial" | "indicacao" | "outro". Uso interno. */
  origem: text("origem"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const veiculos = pgTable("veiculos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientes.id),
  modelo: text("modelo").notNull(),
  placa: text("placa"),
  /** "P" | "G" */
  porte: text("porte").notNull(),
  principal: boolean("principal").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StatusAssinatura = "ativo" | "pausado" | "cancelado";

export const assinaturas = pgTable("assinaturas", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientes.id),
  /** "black" | "gold" | "diamante" */
  plano: text("plano").notNull(),
  status: text("status").notNull().default("ativo"),
  inicioEm: text("inicio_em").notNull(),
  cicloInicio: text("ciclo_inicio").notNull(),
  cicloFim: text("ciclo_fim").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StatusBeneficioUso = "reservado" | "utilizado" | "liberado";

export const beneficioUsos = pgTable("beneficio_usos", {
  id: serial("id").primaryKey(),
  assinaturaId: integer("assinatura_id")
    .notNull()
    .references(() => assinaturas.id),
  agendamentoId: integer("agendamento_id").references(() => agendamentos.id),
  /** Nome do benefício, mesmo texto usado em servicosPorPlano (ex.: "Lavagem Gold", "Manutenção"). */
  beneficio: text("beneficio").notNull(),
  status: text("status").notNull().default("reservado"),
  /** Ciclo ao qual essa reserva pertence (= assinatura.cicloInicio no momento da reserva), pra contar limite por ciclo certo. */
  cicloReferencia: text("ciclo_referencia").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const horariosBloqueados = pgTable("horarios_bloqueados", {
  id: serial("id").primaryKey(),
  dia: text("dia").notNull(),
  horario: text("horario").notNull(),
  motivo: text("motivo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agendamentos = pgTable(
  "agendamentos",
  {
    id: serial("id").primaryKey(),
    /** "P084-0027", gerado server-side (segundo UPDATE usando o próprio id) — substitui o cálculo client-side antigo. */
    codigo: text("codigo").unique(),
    clienteId: integer("cliente_id").references(() => clientes.id),
    veiculoId: integer("veiculo_id").references(() => veiculos.id),
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
    /** Preço calculado original, antes de qualquer ajuste manual no admin. */
    valorOriginal: numeric("valor_original", { precision: 10, scale: 2 }),
    motivoAjuste: text("motivo_ajuste"),
    /** "cliente_leva" | "leva_busca" */
    transporte: text("transporte"),
    /** JSON com o endereço usado NAQUELE atendimento (snapshot — o cadastro do cliente pode mudar depois). */
    enderecoSnapshot: text("endereco_snapshot"),
    /** Observação daquele atendimento específico, separada das preferências permanentes do cliente. */
    observacoes: text("observacoes"),
    /** "landing" | "admin" */
    origem: text("origem").notNull().default("landing"),
    /** Quem fechou a venda/agendamento (recepção). Só registro, sem cálculo de comissão. */
    responsavelFechamento: text("responsavel_fechamento"),
    /** Quem executou o serviço (lavador, detailer). */
    responsavelAtendimento: text("responsavel_atendimento"),
    /** JSON com o checklist opcional de entrada: { placa, veiculo, observacoes, fotos } (booleans). */
    checklistEntrada: text("checklist_entrada"),
    /** Data real do agendamento, formato ISO "YYYY-MM-DD" (não é mais nome de dia da semana). */
    dia: text("dia").notNull(),
    horario: text("horario").notNull(),
    /** "confirmado" | "concluido" | "cancelado" — só confirmado/concluido ocupam o horário. */
    status: text("status").notNull().default("confirmado"),
    /**
     * Token aleatório (não sequencial) que vai dentro do QR do PitPass, gerado server-side no insert.
     * Nullable: agendamentos antigos recebem um token na primeira vez que o admin abre a ficha.
     */
    checkinToken: text("checkin_token"),
    /** Etapas reais do atendimento, registradas pelo admin (o status continua "confirmado" até concluir). */
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("agendamento_slot_ativo")
      .on(table.dia, table.horario)
      .where(sql`${table.status} <> 'cancelado'`),
    uniqueIndex("agendamento_checkin_token").on(table.checkinToken),
  ]
);

export type StatusAgendamento = "confirmado" | "concluido" | "cancelado";
