import { ReactNode } from "react";
import Link from "next/link";
import { exigirSessaoAdmin } from "@/lib/adminAuth";
import { logout } from "../actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await exigirSessaoAdmin();

  return (
    <div className="min-h-screen bg-asphalt text-text-primary">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-heading text-sm font-bold uppercase tracking-widest">
              Pitstop 084 · Admin
            </span>
            <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-wide text-text-secondary">
              <Link href="/admin/agendamentos" className="transition hover:text-gold">
                Agendamentos
              </Link>
              <Link href="/admin/agenda" className="transition hover:text-gold">
                Agenda
              </Link>
              <Link href="/admin/clientes" className="transition hover:text-gold">
                Clientes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <form action="/admin/clientes" method="GET" className="flex items-center">
              <input
                type="text"
                name="q"
                placeholder="🔍 Buscar cliente..."
                className="campo w-48 py-1.5 font-mono text-xs"
              />
            </form>
            <form action={logout}>
              <button
                type="submit"
                className="shrink-0 font-mono text-xs uppercase tracking-wide text-text-secondary transition hover:text-gold"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
