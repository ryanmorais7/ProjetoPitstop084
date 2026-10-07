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
  /** Categoria do veículo: "P" | "G" (porte do carro) ou "MOTO" (moto não tem porte). */
  porte: text("porte").notNull(),
  principal: boolean("principal").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * "pendente" = cadastro PitPass feito pelo próprio cliente no site, ainda não conferido pela
 * recepção. Já identifica o assinante pelo WhatsApp e conta cota, mas só vira "ativo" no admin.
 */
export type StatusAssinatura = "pendente" | "ativo" | "pausado" | "cancelado";

export const assinaturas = pgTable("assinaturas", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientes.id),
  /** PlanoId: "black" | "gold" | "diamante" | "moto-black" | "moto-gold" */
  plano: text("plano").notNull(),
  /** Veículo do PitPass. Null (assinatura antiga) = veículo principal do cliente. */
  veiculoId: integer("veiculo_id").references(() => veiculos.id),
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
    /** "P" | "G" | "MOTO" */
    categoriaVeiculo: text("categoria_veiculo"),
    /** Id do serviço no catálogo: a Ducha (avulso) ou a lavagem do plano (assinatura). */
    servicoId: text("servico_id"),
    servicoNome: text("servico_nome"),
    /**
     * Duração estimada do atendimento inteiro (serviço + adicionais), em minutos, calculada do
     * catálogo no momento do agendamento. Null = algum serviço sem duração definida (ou registro
     * antigo): ocupa um horário da grade, como antes.
     */
    duracaoMin: integer("duracao_min"),
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
    /**
     * Estágio operacional do carro na loja (Kanban da Agenda): "agendado" | "chegou" | "lavagem" |
     * "detail" | "finalizacao" | "pronto" | "entregue". Separado de `status`, que continua sendo
     * a verdade comercial (ocupa horário, consome benefício). Null = registro antigo: o estágio
     * é derivado de status + horários (src/lib/operacao.ts).
     */
    estagio: text("estagio"),
    /** Quando entrou no estágio atual (o cronômetro do card conta a partir daqui). */
    estagioDesde: timestamp("estagio_desde", { withTimezone: true }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    /** JSON de [{ estagio, em }] com cada movimentação, em ordem. Nunca é apagado. */
    historicoEstagios: text("historico_estagios"),
    /** Cliente esperando na loja: prioridade operacional (não tem relação com PitPass). */
    clienteAguardando: boolean("cliente_aguardando"),
    /** JSON com o checklist opcional de finalização. */
    checklistSaida: text("checklist_saida"),
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

/**
 * Ajustes do catálogo feitos pelo admin. O catálogo em si (textos, fichas, valores padrão)
 * continua em src/lib/data.ts; aqui fica só o que a gestão alterou. Coluna null = usa o padrão.
 * `itemId` = id do serviço, ou "plano:<id>" pra mensalidade/ativação de um plano.
 */
export const catalogoConfig = pgTable("catalogo_config", {
  itemId: text("item_id").primaryKey(),
  nome: text("nome"),
  categoria: text("categoria"),
  precoP: numeric("preco_p", { precision: 10, scale: 2 }),
  precoG: numeric("preco_g", { precision: 10, scale: 2 }),
  precoMoto: numeric("preco_moto", { precision: 10, scale: 2 }),
  duracaoMin: integer("duracao_min"),
  ativo: boolean("ativo"),
  requerAvaliacao: boolean("requer_avaliacao"),
  requerDetailer: boolean("requer_detailer"),
  requerLavador: boolean("requer_lavador"),
  podeSerAdicional: boolean("pode_ser_adicional"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Configurações simples do negócio (chave/valor): buffer da agenda, dados da empresa no recibo. */
export const configuracoes = pgTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Recibo/comprovante de serviço (NÃO é nota fiscal). Um por atendimento. `dados` guarda o
 * retrato do que foi impresso, pra o recibo não mudar se o cadastro mudar depois.
 */
export const recibos = pgTable("recibos", {
  id: serial("id").primaryKey(),
  /** "R084-0001": sequência própria dos recibos, gerada depois do insert. */
  numero: text("numero").unique(),
  agendamentoId: integer("agendamento_id")
    .notNull()
    .unique()
    .references(() => agendamentos.id),
  clienteId: integer("cliente_id").references(() => clientes.id),
  formaPagamento: text("forma_pagamento"),
  observacao: text("observacao"),
  total: numeric("total", { precision: 10, scale: 2 }),
  /** JSON de DadosRecibo (src/lib/recibo.ts). */
  dados: text("dados").notNull(),
  emitidoEm: timestamp("emitido_em", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
