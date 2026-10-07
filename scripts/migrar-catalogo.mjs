// Migração aditiva: catálogo configurável, duração dos atendimentos, PitPass por veículo e recibos.
// Idempotente: pode rodar mais de uma vez. Só cria tabelas novas e colunas nullable;
// não altera nem apaga nenhum cliente, veículo, assinatura ou agendamento existente.
// Uso: npm run db:migrar-catalogo
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

const sql = neon(url);

// duração estimada do atendimento (bloqueio da agenda por intervalo)
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS duracao_min integer`;

// veículo do PitPass (null = veículo principal do cliente, como era)
await sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS veiculo_id integer REFERENCES veiculos(id)`;

// ajustes do catálogo feitos no admin (preço, duração, ativo...)
await sql`
  CREATE TABLE IF NOT EXISTS catalogo_config (
    item_id text PRIMARY KEY,
    nome text,
    categoria text,
    preco_p numeric(10, 2),
    preco_g numeric(10, 2),
    preco_moto numeric(10, 2),
    duracao_min integer,
    ativo boolean,
    requer_avaliacao boolean,
    requer_detailer boolean,
    requer_lavador boolean,
    pode_ser_adicional boolean,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  )`;

// configurações do negócio (buffer da agenda, dados da empresa no recibo)
await sql`
  CREATE TABLE IF NOT EXISTS configuracoes (
    chave text PRIMARY KEY,
    valor text,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  )`;

// recibos / comprovantes de serviço (um por atendimento)
await sql`
  CREATE TABLE IF NOT EXISTS recibos (
    id serial PRIMARY KEY,
    numero text UNIQUE,
    agendamento_id integer NOT NULL UNIQUE REFERENCES agendamentos(id),
    cliente_id integer REFERENCES clientes(id),
    forma_pagamento text,
    observacao text,
    total numeric(10, 2),
    dados text NOT NULL,
    emitido_em timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  )`;

const [{ clientes }] = await sql`SELECT count(*)::int AS clientes FROM clientes`;
const [{ agendamentos }] = await sql`SELECT count(*)::int AS agendamentos FROM agendamentos`;
const [{ assinaturas }] = await sql`SELECT count(*)::int AS assinaturas FROM assinaturas`;
console.log(
  `OK. Estrutura garantida. ${clientes} clientes, ${agendamentos} agendamentos e ${assinaturas} assinaturas preservados.`
);
