import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | null = null;

function getDb(): Db {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return getDb()[prop as keyof Db];
  },
});
