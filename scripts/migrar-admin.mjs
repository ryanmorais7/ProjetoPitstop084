// Migração aditiva do admin operacional. Idempotente: pode rodar mais de uma vez.
// Só adiciona colunas nullable; não altera nem apaga dados.
// Uso: npm run db:migrar-admin
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

const sql = neon(url);

await sql`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS origem text`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS responsavel_fechamento text`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS responsavel_atendimento text`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS checklist_entrada text`;

// Kanban da Agenda: estágio operacional, separado do status
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS estagio text`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS estagio_desde timestamp with time zone`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS historico_estagios text`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS cliente_aguardando boolean`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS checklist_saida text`;

const [{ clientes }] = await sql`SELECT count(*)::int AS clientes FROM clientes`;
const [{ agendamentos }] = await sql`SELECT count(*)::int AS agendamentos FROM agendamentos`;
console.log(`OK. Colunas garantidas. ${clientes} clientes e ${agendamentos} agendamentos preservados.`);
