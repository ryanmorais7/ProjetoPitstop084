// Migração aditiva do check-in do PitPass. Idempotente: pode rodar mais de uma vez.
// Só adiciona colunas nullable e um índice único (NULLs não conflitam), não altera nem apaga dados.
// Uso: npm run db:migrar-checkin
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

const sql = neon(url);

await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS checkin_token text`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS started_at timestamp with time zone`;
await sql`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS agendamento_checkin_token ON agendamentos (checkin_token)`;

const [{ total, sem_token }] = await sql`
  SELECT count(*)::int AS total, count(*) FILTER (WHERE checkin_token IS NULL)::int AS sem_token
  FROM agendamentos
`;
console.log(`OK. ${total} agendamentos (${sem_token} sem token; recebem um ao abrir a ficha no admin).`);
